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

function getConfiguredHmacSecret() {
  return normalizeText(process.env.APP_ERROR_TELEMETRY_HMAC_SECRET);
}

function normalizeSignatureHeader(headers) {
  const signatureHeader = getHeaderValue(headers, 'x-app-telemetry-signature');
  if (!signatureHeader) {
    return '';
  }

  if (signatureHeader.includes('=')) {
    const [prefix, value] = signatureHeader.split('=');
    if (prefix?.trim().toLowerCase() !== 'sha256') {
      return '';
    }
    return normalizeText(value).toLowerCase();
  }

  return signatureHeader.toLowerCase();
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
  const hmacSecret = getConfiguredHmacSecret();
  if (!hmacSecret) {
    return {
      required: false,
      verified: false,
      error: '',
    };
  }

  const providedSignature = normalizeSignatureHeader(headers);
  if (!providedSignature) {
    return {
      required: true,
      verified: false,
      error: 'Missing or invalid telemetry signature header',
    };
  }

  const expectedSignature = crypto
    .createHmac('sha256', hmacSecret)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const providedBuffer = Buffer.from(providedSignature, 'hex');

  if (
    expectedBuffer.length !== providedBuffer.length
    || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return {
      required: true,
      verified: false,
      error: 'Missing or invalid telemetry signature header',
    };
  }

  return {
    required: true,
    verified: true,
    error: '',
  };
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
  const signatureStatus = verifyHmacSignature(headers, resolvedRawBody);
  if (signatureStatus.error) {
    return buildResponse(401, {
      error: signatureStatus.error,
      error_code: 'INGEST_SIGNATURE_INVALID',
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
