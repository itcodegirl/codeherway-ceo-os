import { getChiefActionConfig } from '../src/lib/chiefActions.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const MAX_NOTES_LENGTH = 12000;
const REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 0;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const requestTimestampsByClient = new Map();

function parseRateLimit(value) {
  if (!value) {
    return DEFAULT_RATE_LIMIT_PER_MINUTE;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_RATE_LIMIT_PER_MINUTE;
  }

  return parsed;
}

function parseClientKey(headers) {
  if (!headers || typeof headers !== 'object') {
    return 'anonymous';
  }

  const headerValue = headers['x-forwarded-for']
    || headers['x-real-ip']
    || headers['cf-connecting-ip']
    || headers['x-client-ip']
    || headers['remote-addr'];

  if (typeof headerValue !== 'string') {
    return 'anonymous';
  }

  return headerValue.split(',')[0].trim() || 'anonymous';
}

function isRateLimited(headers) {
  const limit = parseRateLimit(process.env.CHIEF_STAFF_RATE_LIMIT_PER_MINUTE);
  if (limit <= 0) {
    return false;
  }

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const clientKey = parseClientKey(headers);
  const requestHistory = requestTimestampsByClient.get(clientKey) || [];

  const activeRequests = requestHistory.filter((timestamp) => timestamp >= windowStart);
  if (activeRequests.length >= limit) {
    return true;
  }

  activeRequests.push(now);
  requestTimestampsByClient.set(clientKey, activeRequests);
  return false;
}

function getAllowedActionKeys() {
  return new Set(['summarize', 'draft', 'actions', 'priorities']);
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

  if (typeof body === 'object' && !Array.isArray(body) && body !== null) {
    return body;
  }

  return {};
}

function normalizeNotes(notes) {
  if (typeof notes !== 'string') {
    return '';
  }

  return notes.trim().slice(0, MAX_NOTES_LENGTH);
}

function normalizeActionKey(actionKey, allowedActionKeys) {
  if (typeof actionKey !== 'string') {
    return 'summarize';
  }

  return allowedActionKeys.has(actionKey) ? actionKey : 'summarize';
}

function extractRequestToken(headers) {
  if (!headers || typeof headers !== 'object') {
    return '';
  }

  const headerToken = headers['x-chief-staff-token']
    || headers['X-Chief-Staff-Token']
    || headers['X-CHIEF-STAFF-TOKEN']
    || headers.authorization;

  if (typeof headerToken !== 'string') {
    return '';
  }

  if (headerToken.startsWith('Bearer ')) {
    return headerToken.slice(7).trim();
  }

  return headerToken.trim();
}

function hasValidProxyToken(headers) {
  const configuredToken = process.env.CHIEF_STAFF_PROXY_TOKEN?.trim();
  if (!configuredToken) {
    return true;
  }

  return extractRequestToken(headers) === configuredToken;
}

function buildInput({ instruction, notes }) {
  return [
    {
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: `You are the CEO OS Chief of Staff assistant. ${instruction} Keep output concise, practical, and ready to ship.`,
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: notes,
        },
      ],
    },
  ];
}

function buildResponse(status, body) {
  return {
    status,
    body,
  };
}

export async function handleChiefOfStaffProxy({ method, body, headers = {} }) {
  if (method !== 'POST') {
    return buildResponse(405, { error: 'Method not allowed' });
  }

  if (!hasValidProxyToken(headers)) {
    return buildResponse(401, { error: 'Missing or invalid proxy authentication token' });
  }

  if (isRateLimited(headers)) {
    return buildResponse(429, { error: 'Rate limit exceeded for this client' });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return buildResponse(500, { error: 'OPENAI_API_KEY is not configured on the server' });
  }

  const parsedBody = normalizeBody(body);
  if (parsedBody === null || typeof parsedBody !== 'object') {
    return buildResponse(400, { error: 'Request body must be a JSON object' });
  }

  const notes = normalizeNotes(parsedBody.notes);
  const allowedActionKeys = getAllowedActionKeys();
  const actionKey = normalizeActionKey(parsedBody.actionKey, allowedActionKeys);

  if (!notes) {
    return buildResponse(400, { error: 'Notes are required' });
  }

  const actionConfig = getChiefActionConfig(actionKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
        input: buildInput({
          instruction: actionConfig.instruction,
          notes,
        }),
      }),
    });
  } catch (error) {
    clearTimeout(timeout);
    const timedOut = error?.name === 'AbortError';
    return buildResponse(
      timedOut ? 504 : 502,
      { error: timedOut ? 'OpenAI request timed out' : 'Unable to reach OpenAI' },
    );
  } finally {
    clearTimeout(timeout);
  }

  const upstreamPayload = await upstreamResponse.json().catch(() => ({ error: 'Invalid JSON response from upstream' }));

  if (!upstreamResponse.ok) {
    return buildResponse(upstreamResponse.status, {
      error: 'OpenAI request failed',
      details: upstreamPayload?.error || upstreamPayload,
    });
  }

  if (!upstreamPayload) {
    return buildResponse(502, { error: 'Empty response from OpenAI' });
  }

  return buildResponse(200, upstreamPayload);
}
