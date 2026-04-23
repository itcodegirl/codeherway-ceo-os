const MAX_EVENTS_PER_BATCH = 25;
const MAX_TEXT_LENGTH = 2000;

function createRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `telemetry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildResponse(status, body = {}) {
  return {
    status,
    body: {
      request_id: createRequestId(),
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

function extractRequestToken(headers) {
  if (!headers || typeof headers !== 'object') {
    return '';
  }

  const headerToken = headers['x-app-telemetry-token']
    || headers['X-App-Telemetry-Token']
    || headers['X-APP-TELEMETRY-TOKEN']
    || headers.authorization;

  if (typeof headerToken !== 'string') {
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

export async function handleAppErrorTelemetryIngest({ method, body, headers = {} }) {
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

  // The ingestion endpoint validates schema contract and acknowledges accepted events.
  return buildResponse(202, {
    ok: true,
    accepted_count: parsedBody.events.length,
  });
}
