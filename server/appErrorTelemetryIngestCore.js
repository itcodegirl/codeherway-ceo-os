import crypto from 'node:crypto';
import { persistAppErrorTelemetryBatch } from './appErrorTelemetryIngestRepository.js';

const MAX_EVENTS_PER_BATCH = 25;
const MAX_TEXT_LENGTH = 2000;
const MAX_IDEMPOTENCY_KEY_LENGTH = 120;

function createRequestId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `telemetry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildResponse(status, body = {}, requestId = createRequestId()) {
  return {
    status,
    body: {
      request_id: requestId,
      ...(body && typeof body === 'object' ? body : {}),
    },
  };
}

function normalizeBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  if (typeof body === 'object' && !Array.isArray(body)) {
    return body;
  }

  return null;
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, MAX_TEXT_LENGTH);
}

function getHeaderValue(headers, key) {
  if (!headers || typeof headers !== 'object') {
    return '';
  }

  const normalizedKey = key.toLowerCase();
  const match = Object.entries(headers).find(([headerKey]) => (
    typeof headerKey === 'string' && headerKey.toLowerCase() === normalizedKey
  ));
  if (!match) {
    return '';
  }

  const value = match[1];
  if (Array.isArray(value)) {
    return normalizeText(value.join(','));
  }

  return normalizeText(value);
}

function extractRequestToken(headers) {
  const headerToken = getHeaderValue(headers, 'x-app-telemetry-token')
    || getHeaderValue(headers, 'authorization');

  if (!headerToken) {
    return '';
  }

  if (headerToken.startsWith('Bearer ')) {
    return headerToken.slice(7).trim();
  }

  return headerToken.trim();
}

function hasValidIngestToken(headers) {
  const configuredToken = process.env.APP_ERROR_TELEMETRY_INGEST_TOKEN?.trim();
  if (!configuredToken) {
    return true;
  }

  return extractRequestToken(headers) === configuredToken;
}

function getSignatureKeyId(headers) {
  return normalizeText(getHeaderValue(headers, 'x-app-telemetry-signature-key-id'));
}

function parseOptionalDateMs(value) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return null;
  }

  const parsed = Date.parse(normalizedValue);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function isValidHex(value) {
  return Boolean(value && /^[0-9a-f]+$/i.test(value) && value.length % 2 === 0);
}

function normalizeBase64ToBuffer(value) {
  const normalized = normalizeText(value)
    .replaceAll('-', '+')
    .replaceAll('_', '/');
  if (!normalized) {
    return null;
  }

  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  try {
    const buffer = Buffer.from(padded, 'base64');
    return buffer.length ? buffer : null;
  } catch {
    return null;
  }
}

function buildHmacConfigState(nowMs = Date.now()) {
  const legacySecret = normalizeText(process.env.APP_ERROR_TELEMETRY_HMAC_SECRET);
  const currentSecret = normalizeText(process.env.APP_ERROR_TELEMETRY_HMAC_SECRET_CURRENT);
  const nextSecret = normalizeText(process.env.APP_ERROR_TELEMETRY_HMAC_SECRET_NEXT);
  const nextValidFrom = parseOptionalDateMs(process.env.APP_ERROR_TELEMETRY_HMAC_NEXT_VALID_FROM);
  const currentValidUntil = parseOptionalDateMs(process.env.APP_ERROR_TELEMETRY_HMAC_CURRENT_VALID_UNTIL);

  if (Number.isNaN(nextValidFrom) || Number.isNaN(currentValidUntil)) {
    return {
      required: true,
      candidates: [],
      configError: 'Telemetry HMAC key window configuration is invalid',
      errorCode: 'INGEST_SIGNATURE_CONFIG_INVALID',
      errorStatus: 503,
    };
  }

  const candidates = [];

  if (currentSecret && (currentValidUntil === null || nowMs <= currentValidUntil)) {
    candidates.push({ keyId: 'current', secret: currentSecret });
  }

  if (nextSecret && (nextValidFrom === null || nowMs >= nextValidFrom)) {
    candidates.push({ keyId: 'next', secret: nextSecret });
  }

  if (!currentSecret && !nextSecret && legacySecret) {
    candidates.push({ keyId: 'legacy', secret: legacySecret });
  }

  const required = Boolean(currentSecret || nextSecret || legacySecret);

  if (required && !candidates.length) {
    return {
      required: true,
      candidates: [],
      configError: 'No active telemetry HMAC key is configured for the current time window',
      errorCode: 'INGEST_SIGNATURE_CONFIG_INVALID',
      errorStatus: 503,
    };
  }

  return {
    required,
    candidates,
    configError: '',
    errorCode: '',
    errorStatus: 401,
  };
}

function normalizeSignatureHeader(headers) {
  const signatureHeader = getHeaderValue(headers, 'x-app-telemetry-signature');
  if (!signatureHeader) {
    return { algorithm: '', value: '' };
  }

  const delimiterIndex = signatureHeader.indexOf('=');
  if (delimiterIndex > 0) {
    const algorithm = normalizeText(signatureHeader.slice(0, delimiterIndex)).toLowerCase();
    const value = normalizeText(signatureHeader.slice(delimiterIndex + 1));
    return { algorithm, value };
  }

  return {
    algorithm: '',
    value: signatureHeader,
  };
}

function parseAsymmetricPublicKeyConfig(rawConfig) {
  const normalizedConfig = normalizeText(rawConfig);
  if (!normalizedConfig) {
    return {
      configured: false,
      keys: {},
      configError: '',
    };
  }

  try {
    const parsed = JSON.parse(normalizedConfig);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        configured: true,
        keys: {},
        configError: 'Telemetry asymmetric key configuration must be a JSON object',
      };
    }

    const keys = Object.entries(parsed).reduce((accumulator, [keyId, keyValue]) => {
      const normalizedKeyId = normalizeText(keyId);
      const normalizedKeyValue = normalizeText(keyValue);
      if (!normalizedKeyId || !normalizedKeyValue) {
        return accumulator;
      }

      accumulator[normalizedKeyId] = normalizedKeyValue;
      return accumulator;
    }, {});

    return {
      configured: true,
      keys,
      configError: '',
    };
  } catch {
    return {
      configured: true,
      keys: {},
      configError: 'Telemetry asymmetric key configuration contains invalid JSON',
    };
  }
}

function verifyAsymmetricSignature(headers, rawBody) {
  const asymmetricConfig = parseAsymmetricPublicKeyConfig(
    process.env.APP_ERROR_TELEMETRY_ASYMMETRIC_PUBLIC_KEYS_JSON,
  );
  if (!asymmetricConfig.configured) {
    return {
      configured: false,
      required: false,
      verified: false,
      keyId: '',
      algorithm: '',
      error: '',
      errorCode: '',
      errorStatus: 401,
    };
  }

  if (asymmetricConfig.configError) {
    return {
      configured: true,
      required: true,
      verified: false,
      keyId: '',
      algorithm: '',
      error: asymmetricConfig.configError,
      errorCode: 'INGEST_SIGNATURE_CONFIG_INVALID',
      errorStatus: 503,
    };
  }

  const configuredKeyIds = Object.keys(asymmetricConfig.keys);
  if (!configuredKeyIds.length) {
    return {
      configured: true,
      required: true,
      verified: false,
      keyId: '',
      algorithm: '',
      error: 'No asymmetric telemetry public keys are configured',
      errorCode: 'INGEST_SIGNATURE_CONFIG_INVALID',
      errorStatus: 503,
    };
  }

  const signatureKeyId = getSignatureKeyId(headers);
  if (!signatureKeyId) {
    return {
      configured: true,
      required: true,
      verified: false,
      keyId: '',
      algorithm: 'ed25519',
      error: 'Missing telemetry signature key id header',
      errorCode: 'INGEST_SIGNATURE_INVALID',
      errorStatus: 401,
    };
  }

  const publicKeyPem = asymmetricConfig.keys[signatureKeyId];
  if (!publicKeyPem) {
    return {
      configured: true,
      required: true,
      verified: false,
      keyId: signatureKeyId,
      algorithm: 'ed25519',
      error: 'Unknown telemetry signature key id',
      errorCode: 'INGEST_SIGNATURE_INVALID',
      errorStatus: 401,
    };
  }

  const signatureHeader = normalizeSignatureHeader(headers);
  const declaredAlgorithm = signatureHeader.algorithm || 'ed25519';
  if (declaredAlgorithm !== 'ed25519') {
    return {
      configured: true,
      required: true,
      verified: false,
      keyId: signatureKeyId,
      algorithm: declaredAlgorithm,
      error: 'Unsupported telemetry signature algorithm',
      errorCode: 'INGEST_SIGNATURE_INVALID',
      errorStatus: 401,
    };
  }

  const signatureBuffer = normalizeBase64ToBuffer(signatureHeader.value);
  if (!signatureBuffer) {
    return {
      configured: true,
      required: true,
      verified: false,
      keyId: signatureKeyId,
      algorithm: declaredAlgorithm,
      error: 'Missing or invalid telemetry signature header',
      errorCode: 'INGEST_SIGNATURE_INVALID',
      errorStatus: 401,
    };
  }

  try {
    const verified = crypto.verify(
      null,
      Buffer.from(rawBody),
      publicKeyPem,
      signatureBuffer,
    );

    if (!verified) {
      return {
        configured: true,
        required: true,
        verified: false,
        keyId: signatureKeyId,
        algorithm: declaredAlgorithm,
        error: 'Missing or invalid telemetry signature header',
        errorCode: 'INGEST_SIGNATURE_INVALID',
        errorStatus: 401,
      };
    }

    return {
      configured: true,
      required: true,
      verified: true,
      keyId: signatureKeyId,
      algorithm: declaredAlgorithm,
      error: '',
      errorCode: '',
      errorStatus: 401,
    };
  } catch {
    return {
      configured: true,
      required: true,
      verified: false,
      keyId: signatureKeyId,
      algorithm: declaredAlgorithm,
      error: 'Telemetry public key verification failed',
      errorCode: 'INGEST_SIGNATURE_CONFIG_INVALID',
      errorStatus: 503,
    };
  }
}

function normalizeRawBody(rawBody, parsedBody) {
  if (typeof rawBody === 'string') {
    return rawBody;
  }

  if (rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)) {
    try {
      return JSON.stringify(rawBody);
    } catch {
      return '';
    }
  }

  if (parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)) {
    try {
      return JSON.stringify(parsedBody);
    } catch {
      return '';
    }
  }

  return '';
}

function verifyHmacSignature(headers, rawBody) {
  const signatureKeyId = getSignatureKeyId(headers);
  const hmacConfigState = buildHmacConfigState();

  if (hmacConfigState.configError) {
    return {
      required: true,
      verified: false,
      keyId: signatureKeyId,
      algorithm: 'hmac-sha256',
      error: hmacConfigState.configError,
      errorCode: hmacConfigState.errorCode,
      errorStatus: hmacConfigState.errorStatus,
    };
  }

  if (!hmacConfigState.required) {
    return {
      required: false,
      verified: false,
      keyId: '',
      algorithm: '',
      error: '',
      errorCode: '',
      errorStatus: 401,
    };
  }

  const signatureHeader = normalizeSignatureHeader(headers);
  const normalizedAlgorithm = signatureHeader.algorithm.toLowerCase();
  if (
    normalizedAlgorithm
    && normalizedAlgorithm !== 'sha256'
    && normalizedAlgorithm !== 'hmac-sha256'
  ) {
    return {
      required: true,
      verified: false,
      keyId: signatureKeyId,
      algorithm: normalizedAlgorithm,
      error: 'Unsupported telemetry signature algorithm',
      errorCode: 'INGEST_SIGNATURE_INVALID',
      errorStatus: 401,
    };
  }

  const providedSignature = normalizeText(signatureHeader.value).toLowerCase();
  if (!isValidHex(providedSignature)) {
    return {
      required: true,
      verified: false,
      keyId: signatureKeyId,
      algorithm: 'hmac-sha256',
      error: 'Missing or invalid telemetry signature header',
      errorCode: 'INGEST_SIGNATURE_INVALID',
      errorStatus: 401,
    };
  }

  const matchingCandidates = signatureKeyId
    ? hmacConfigState.candidates.filter((candidate) => candidate.keyId === signatureKeyId)
    : hmacConfigState.candidates;

  if (signatureKeyId && !matchingCandidates.length) {
    return {
      required: true,
      verified: false,
      keyId: signatureKeyId,
      algorithm: 'hmac-sha256',
      error: 'Unknown telemetry signature key id',
      errorCode: 'INGEST_SIGNATURE_INVALID',
      errorStatus: 401,
    };
  }

  for (const candidate of matchingCandidates) {
    const expectedSignature = crypto
      .createHmac('sha256', candidate.secret)
      .update(rawBody)
      .digest('hex');

    if (!isValidHex(expectedSignature) || expectedSignature.length !== providedSignature.length) {
      continue;
    }

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    if (crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
      return {
        required: true,
        verified: true,
        keyId: candidate.keyId,
        algorithm: 'hmac-sha256',
        error: '',
        errorCode: '',
        errorStatus: 401,
      };
    }
  }

  return {
    required: true,
    verified: false,
    keyId: signatureKeyId,
    algorithm: 'hmac-sha256',
    error: 'Missing or invalid telemetry signature header',
    errorCode: 'INGEST_SIGNATURE_INVALID',
    errorStatus: 401,
  };
}

function verifyTelemetrySignature(headers, rawBody) {
  const asymmetricStatus = verifyAsymmetricSignature(headers, rawBody);
  if (asymmetricStatus.configured) {
    return asymmetricStatus;
  }

  return verifyHmacSignature(headers, rawBody);
}

function isValidTimestamp(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function validateEvent(event, index) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return `events[${index}] must be an object`;
  }

  if (normalizeText(event.event) !== 'ui_error_boundary') {
    return `events[${index}].event must be "ui_error_boundary"`;
  }

  if (!isValidTimestamp(event.timestamp)) {
    return `events[${index}].timestamp must be an ISO datetime string`;
  }

  if (!normalizeText(event.name)) {
    return `events[${index}].name is required`;
  }

  if (!normalizeText(event.message)) {
    return `events[${index}].message is required`;
  }

  return '';
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'Request body must be a JSON object';
  }

  if (!normalizeText(payload.source)) {
    return 'source is required';
  }

  if (normalizeText(payload.eventType) !== 'app_error') {
    return 'eventType must be "app_error"';
  }

  if (!isValidTimestamp(payload.sentAt)) {
    return 'sentAt must be an ISO datetime string';
  }

  if (!Array.isArray(payload.events)) {
    return 'events must be an array';
  }

  if (!payload.events.length) {
    return 'events array must include at least one event';
  }

  if (payload.events.length > MAX_EVENTS_PER_BATCH) {
    return `events array cannot exceed ${MAX_EVENTS_PER_BATCH} items`;
  }

  for (let index = 0; index < payload.events.length; index += 1) {
    const eventError = validateEvent(payload.events[index], index);
    if (eventError) {
      return eventError;
    }
  }

  return '';
}

function computePayloadIdempotencyHash(payload) {
  const events = Array.isArray(payload?.events)
    ? payload.events.map((event) => ({
      event: normalizeText(event?.event),
      timestamp: normalizeText(event?.timestamp),
      name: normalizeText(event?.name),
      message: normalizeText(event?.message),
      route: normalizeText(event?.route),
      componentStack: normalizeText(event?.componentStack),
    }))
    : [];

  const stablePayload = JSON.stringify({
    source: normalizeText(payload?.source),
    eventType: normalizeText(payload?.eventType),
    events,
  });

  return crypto
    .createHash('sha256')
    .update(stablePayload)
    .digest('hex');
}

function resolveIdempotencyKey(payload, headers) {
  const explicitIdempotencyKey = normalizeText(payload?.idempotencyKey)
    || normalizeText(getHeaderValue(headers, 'x-app-telemetry-idempotency-key'));
  if (explicitIdempotencyKey) {
    return explicitIdempotencyKey.slice(0, MAX_IDEMPOTENCY_KEY_LENGTH);
  }

  const hash = computePayloadIdempotencyHash(payload).slice(0, 48);
  return `app-error:${hash}`;
}

export async function handleAppErrorTelemetryIngest({
  method,
  body,
  headers = {},
  rawBody,
}) {
  if (method !== 'POST') {
    return buildResponse(405, {
      error: 'Method not allowed',
      error_code: 'METHOD_NOT_ALLOWED',
    });
  }

  if (!hasValidIngestToken(headers)) {
    return buildResponse(401, {
      error: 'Missing or invalid telemetry ingest token',
      error_code: 'INGEST_AUTH_INVALID',
    });
  }

  const parsedBody = normalizeBody(body);
  if (!parsedBody) {
    return buildResponse(400, {
      error: 'Request body must be a JSON object',
      error_code: 'INVALID_BODY',
    });
  }

  const validationError = validatePayload(parsedBody);
  if (validationError) {
    return buildResponse(400, {
      error: validationError,
      error_code: 'INVALID_PAYLOAD',
    });
  }

  const resolvedRawBody = normalizeRawBody(rawBody, parsedBody);
  const signatureStatus = verifyTelemetrySignature(headers, resolvedRawBody);
  if (signatureStatus.error) {
    return buildResponse(signatureStatus.errorStatus || 401, {
      error: signatureStatus.error,
      error_code: signatureStatus.errorCode || 'INGEST_SIGNATURE_INVALID',
    });
  }

  const requestId = createRequestId();
  const idempotencyKey = resolveIdempotencyKey(parsedBody, headers);

  try {
    const persistenceResult = await persistAppErrorTelemetryBatch({
      idempotencyKey,
      source: parsedBody.source,
      eventType: parsedBody.eventType,
      sentAt: parsedBody.sentAt,
      events: parsedBody.events,
      requestId,
      signatureVerified: signatureStatus.verified,
    });

    return buildResponse(202, {
      ok: true,
      accepted_count: parsedBody.events.length,
      persisted: Boolean(persistenceResult.persisted),
      duplicate: Boolean(persistenceResult.duplicate),
      storage: persistenceResult.storage || 'transient',
      idempotency_key: idempotencyKey,
      signature_verified: Boolean(signatureStatus.verified),
      signature_required: Boolean(signatureStatus.required),
      signature_key_id: signatureStatus.keyId || '',
      signature_algorithm: signatureStatus.algorithm || '',
    }, requestId);
  } catch (error) {
    return buildResponse(503, {
      error: 'Telemetry ingest persistence is temporarily unavailable',
      error_code: 'PERSISTENCE_UNAVAILABLE',
      retryable: true,
      details: process.env.NODE_ENV === 'development'
        ? normalizeText(error?.message || '')
        : '',
    }, requestId);
  }
}
