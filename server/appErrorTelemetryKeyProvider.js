const DEFAULT_KMS_CACHE_MS = 5 * 60 * 1000;
const DEFAULT_KMS_TIMEOUT_MS = 3000;

let cachedKmsState = null;

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseOptionalDateMs(value) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return null;
  }

  const parsed = Date.parse(normalizedValue);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function normalizeAlgorithm(value, fallback = 'ed25519') {
  const normalized = normalizeText(value).toLowerCase();
  return normalized || fallback;
}

function normalizeKeyEntry(candidate, source) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return null;
  }

  const keyId = normalizeText(candidate.keyId || candidate.key_id || candidate.id);
  const publicKeyPem = normalizeText(
    candidate.publicKeyPem || candidate.public_key_pem || candidate.publicKey,
  );
  if (!keyId || !publicKeyPem) {
    return null;
  }

  const activeFromMs = parseOptionalDateMs(
    candidate.activeFrom || candidate.active_from || candidate.validFrom || candidate.valid_from,
  );
  const activeUntilMs = parseOptionalDateMs(
    candidate.activeUntil || candidate.active_until || candidate.validUntil || candidate.valid_until,
  );
  if (Number.isNaN(activeFromMs) || Number.isNaN(activeUntilMs)) {
    return null;
  }

  return {
    keyId,
    publicKeyPem,
    algorithm: normalizeAlgorithm(candidate.algorithm),
    version: normalizeText(candidate.version || candidate.keyVersion || candidate.key_version),
    kmsKeyId: normalizeText(candidate.kmsKeyId || candidate.kms_key_id),
    activeFromMs,
    activeUntilMs,
    source,
  };
}

function isEntryActive(entry, nowMs) {
  const isAfterStart = entry.activeFromMs === null || nowMs >= entry.activeFromMs;
  const isBeforeEnd = entry.activeUntilMs === null || nowMs <= entry.activeUntilMs;
  return isAfterStart && isBeforeEnd;
}

function buildKeyState({
  configured,
  required,
  source,
  configError = '',
  entries = [],
  metadata = {},
}) {
  const keysById = entries.reduce((accumulator, entry) => {
    accumulator[entry.keyId] = entry;
    return accumulator;
  }, {});

  return {
    configured,
    required,
    source,
    configError,
    entries,
    keysById,
    metadata: {
      activeKeyCount: entries.length,
      ...metadata,
    },
  };
}

function parseEnvAsymmetricKeyMap(rawJson, nowMs) {
  const normalizedJson = normalizeText(rawJson);
  if (!normalizedJson) {
    return buildKeyState({
      configured: false,
      required: false,
      source: 'none',
      entries: [],
      metadata: {
        rawKeyCount: 0,
      },
    });
  }

  try {
    const parsed = JSON.parse(normalizedJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return buildKeyState({
        configured: true,
        required: true,
        source: 'env',
        configError: 'Telemetry asymmetric key configuration must be a JSON object',
      });
    }

    const rawEntries = Object.entries(parsed).map(([keyId, value]) => {
      if (typeof value === 'string') {
        return normalizeKeyEntry({ keyId, publicKeyPem: value }, 'env');
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return normalizeKeyEntry({ keyId, ...value }, 'env');
      }

      return null;
    }).filter(Boolean);

    const activeEntries = rawEntries.filter((entry) => isEntryActive(entry, nowMs));
    if (!rawEntries.length) {
      return buildKeyState({
        configured: true,
        required: true,
        source: 'env',
        configError: 'No asymmetric telemetry public keys are configured',
        metadata: {
          rawKeyCount: 0,
        },
      });
    }

    if (!activeEntries.length) {
      return buildKeyState({
        configured: true,
        required: true,
        source: 'env',
        configError: 'No active asymmetric telemetry public keys are valid for the current time window',
        metadata: {
          rawKeyCount: rawEntries.length,
        },
      });
    }

    return buildKeyState({
      configured: true,
      required: true,
      source: 'env',
      entries: activeEntries,
      metadata: {
        rawKeyCount: rawEntries.length,
      },
    });
  } catch {
    return buildKeyState({
      configured: true,
      required: true,
      source: 'env',
      configError: 'Telemetry asymmetric key configuration contains invalid JSON',
    });
  }
}

async function fetchKmsAsymmetricKeys({ nowMs }) {
  const kmsUrl = normalizeText(process.env.APP_ERROR_TELEMETRY_KMS_KEYS_URL);
  if (!kmsUrl || typeof fetch !== 'function') {
    return null;
  }

  const cacheMs = parsePositiveInt(process.env.APP_ERROR_TELEMETRY_KMS_CACHE_MS, DEFAULT_KMS_CACHE_MS);
  if (cachedKmsState && nowMs - cachedKmsState.fetchedAt < cacheMs) {
    return buildKeyState({
      ...cachedKmsState.state,
      metadata: {
        ...cachedKmsState.state.metadata,
        cacheHit: true,
      },
    });
  }

  const timeoutMs = parsePositiveInt(process.env.APP_ERROR_TELEMETRY_KMS_TIMEOUT_MS, DEFAULT_KMS_TIMEOUT_MS);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(kmsUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(normalizeText(process.env.APP_ERROR_TELEMETRY_KMS_AUTH_TOKEN)
          ? { Authorization: `Bearer ${normalizeText(process.env.APP_ERROR_TELEMETRY_KMS_AUTH_TOKEN)}` }
          : {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      return buildKeyState({
        configured: true,
        required: true,
        source: 'kms',
        configError: `KMS asymmetric key retrieval failed (${response.status})${details ? `: ${details}` : ''}`,
      });
    }

    const body = await response.json().catch(() => null);
    const keys = Array.isArray(body) ? body : body?.keys;
    if (!Array.isArray(keys)) {
      return buildKeyState({
        configured: true,
        required: true,
        source: 'kms',
        configError: 'KMS key response must include a keys array',
      });
    }

    const rawEntries = keys
      .map((entry) => normalizeKeyEntry(entry, 'kms'))
      .filter(Boolean);
    const activeEntries = rawEntries.filter((entry) => isEntryActive(entry, nowMs));

    const state = !rawEntries.length
      ? buildKeyState({
        configured: true,
        required: true,
        source: 'kms',
        configError: 'KMS returned no usable asymmetric telemetry keys',
        metadata: {
          rawKeyCount: 0,
          fetchedAt: new Date(nowMs).toISOString(),
          cacheHit: false,
        },
      })
      : activeEntries.length
        ? buildKeyState({
          configured: true,
          required: true,
          source: 'kms',
          entries: activeEntries,
          metadata: {
            rawKeyCount: rawEntries.length,
            fetchedAt: new Date(nowMs).toISOString(),
            cacheHit: false,
          },
        })
        : buildKeyState({
          configured: true,
          required: true,
          source: 'kms',
          configError: 'No active KMS telemetry keys are valid for the current time window',
          metadata: {
            rawKeyCount: rawEntries.length,
            fetchedAt: new Date(nowMs).toISOString(),
            cacheHit: false,
          },
        });

    cachedKmsState = {
      fetchedAt: nowMs,
      state,
    };

    return state;
  } catch (error) {
    clearTimeout(timeoutId);
    return buildKeyState({
      configured: true,
      required: true,
      source: 'kms',
      configError: `KMS asymmetric key retrieval failed: ${normalizeText(error?.message || String(error))}`,
    });
  }
}

export async function resolveTelemetryVerificationKeys({ nowMs = Date.now() } = {}) {
  const kmsState = await fetchKmsAsymmetricKeys({ nowMs });
  if (kmsState) {
    return kmsState;
  }

  return parseEnvAsymmetricKeyMap(process.env.APP_ERROR_TELEMETRY_ASYMMETRIC_PUBLIC_KEYS_JSON, nowMs);
}

export function resetTelemetryKeyProviderCacheForTests() {
  cachedKmsState = null;
}
