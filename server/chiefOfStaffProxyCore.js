import { getChiefActionConfig } from '../src/lib/chiefActions.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const MAX_NOTES_LENGTH = 12000;
const REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 0;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const STRUCTURED_KEYS = ['priorities', 'opportunities', 'contentItems', 'tasks'];
const MAX_STRUCTURED_ITEMS_PER_SECTION = 12;
const MAX_STRUCTURED_TEXT_LENGTH = 280;

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

function extractOutputText(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload.output)) {
    return '';
  }

  const textParts = [];
  payload.output.forEach((item) => {
    if (!Array.isArray(item?.content)) {
      return;
    }

    item.content.forEach((contentPart) => {
      if (contentPart?.type === 'output_text' && typeof contentPart.text === 'string') {
        textParts.push(contentPart.text.trim());
      }
    });
  });

  return textParts.filter(Boolean).join('\n\n');
}

function parseJsonCandidate(candidate) {
  if (typeof candidate !== 'string') {
    return null;
  }

  const normalizedCandidate = candidate.trim();
  if (!normalizedCandidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalizedCandidate);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeStructuredItem(item) {
  if (typeof item !== 'string' && typeof item !== 'number' && typeof item !== 'boolean') {
    return '';
  }

  const collapsed = String(item).replace(/\s+/g, ' ').trim();
  if (!collapsed) {
    return '';
  }

  return collapsed.slice(0, MAX_STRUCTURED_TEXT_LENGTH);
}

function coerceStructuredObject(item) {
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    const title = normalizeStructuredItem(item);
    return title ? { title } : null;
  }

  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }

  return item;
}

function normalizePriorityLikeItem(item) {
  const title = normalizeStructuredItem(item.title || item.text || item.summary || item.task || item.name);
  if (!title) {
    return null;
  }

  const normalized = { title };
  const owner = normalizeStructuredItem(item.owner || item.assignee);
  const status = normalizeStructuredItem(item.status || item.state);
  const dueDate = normalizeStructuredItem(item.dueDate || item.due_date || item.deadline);

  if (owner) {
    normalized.owner = owner;
  }

  if (status) {
    normalized.status = status;
  }

  if (dueDate) {
    normalized.dueDate = dueDate;
  }

  return normalized;
}

function normalizeOpportunityItem(item) {
  const name = normalizeStructuredItem(item.name || item.title || item.text || item.summary || item.task);
  if (!name) {
    return null;
  }

  const normalized = { name };
  const company = normalizeStructuredItem(item.company || item.organization);
  const priority = normalizeStructuredItem(item.priority);
  const stage = normalizeStructuredItem(item.stage);
  const nextStep = normalizeStructuredItem(item.nextStep || item.next_step || item.action || item.actionItem);

  if (company) {
    normalized.company = company;
  }

  if (priority) {
    normalized.priority = priority;
  }

  if (stage) {
    normalized.stage = stage;
  }

  if (nextStep) {
    normalized.nextStep = nextStep;
  }

  return normalized;
}

function normalizeContentItem(item) {
  const title = normalizeStructuredItem(item.title || item.name || item.text || item.summary || item.task);
  if (!title) {
    return null;
  }

  const normalized = { title };
  const platform = normalizeStructuredItem(item.platform || item.channel);
  const status = normalizeStructuredItem(item.status || item.state);

  if (platform) {
    normalized.platform = platform;
  }

  if (status) {
    normalized.status = status;
  }

  return normalized;
}

function normalizeStructuredItemForSection(sectionKey, item) {
  const normalizedObject = coerceStructuredObject(item);
  if (!normalizedObject) {
    return null;
  }

  if (sectionKey === 'priorities' || sectionKey === 'tasks') {
    return normalizePriorityLikeItem(normalizedObject);
  }

  if (sectionKey === 'opportunities') {
    return normalizeOpportunityItem(normalizedObject);
  }

  if (sectionKey === 'contentItems') {
    return normalizeContentItem(normalizedObject);
  }

  return null;
}

function buildStructuredItemSignature(sectionKey, item) {
  if (sectionKey === 'opportunities') {
    return `opportunities:${String(item.name || '').toLowerCase()}|${String(item.company || '').toLowerCase()}`;
  }

  if (sectionKey === 'contentItems') {
    return `contentItems:${String(item.title || '').toLowerCase()}|${String(item.platform || '').toLowerCase()}`;
  }

  return `${sectionKey}:${String(item.title || '').toLowerCase()}|${String(item.owner || '').toLowerCase()}`;
}

function createEmptyStructuredPayload() {
  return {
    priorities: [],
    opportunities: [],
    contentItems: [],
    tasks: [],
  };
}

function normalizeStructuredCollection(sectionKey, values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set();
  const normalized = [];

  for (let index = 0; index < values.length; index += 1) {
    if (normalized.length >= MAX_STRUCTURED_ITEMS_PER_SECTION) {
      break;
    }

    const nextItem = normalizeStructuredItemForSection(sectionKey, values[index]);
    if (!nextItem) {
      continue;
    }

    const signature = buildStructuredItemSignature(sectionKey, nextItem);
    if (seen.has(signature)) {
      continue;
    }

    seen.add(signature);
    normalized.push(nextItem);
  }

  return normalized;
}

function normalizeStructuredPayload(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return createEmptyStructuredPayload();
  }

  const normalized = createEmptyStructuredPayload();

  STRUCTURED_KEYS.forEach((key) => {
    const values = Array.isArray(input[key]) ? input[key] : [];
    normalized[key] = normalizeStructuredCollection(key, values);
  });

  return normalized;
}

function parseStructuredPayloadFromText(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return null;
  }

  const trimmedText = text.trim();
  const directParsed = parseJsonCandidate(trimmedText);
  if (directParsed) {
    return directParsed;
  }

  const fencedMatch = trimmedText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    const parsedFenced = parseJsonCandidate(fencedMatch[1]);
    if (parsedFenced) {
      return parsedFenced;
    }
  }

  const sectionMap = createEmptyStructuredPayload();
  let activeSection = '';

  const lines = trimmedText.split('\n').map((line) => line.trim()).filter(Boolean);
  lines.forEach((line) => {
    const headingMatch = line.match(/^#{1,6}\s*(priorities|opportunities|content items?|tasks)\b:?/i);
    if (headingMatch) {
      const heading = headingMatch[1].toLowerCase();
      activeSection = heading.startsWith('content') ? 'contentItems' : heading;
      return;
    }

    const labelMatch = line.match(/^(priorities|opportunities|content items?|tasks)\s*:/i);
    if (labelMatch) {
      const heading = labelMatch[1].toLowerCase();
      activeSection = heading.startsWith('content') ? 'contentItems' : heading;
      const suffix = line.slice(labelMatch[0].length).trim();
      if (suffix) {
        sectionMap[activeSection].push({ title: suffix });
      }
      return;
    }

    if (!activeSection) {
      return;
    }

    const itemMatch = line.match(/^[-*]\s+(.+)/) || line.match(/^\d+\.\s+(.+)/);
    if (itemMatch?.[1]) {
      sectionMap[activeSection].push({ title: itemMatch[1].trim() });
    }
  });

  return hasStructuredContent(sectionMap) ? sectionMap : null;
}

function normalizeStructuredPayloadCandidate(candidate) {
  const parsedCandidate = typeof candidate === 'string' ? parseJsonCandidate(candidate) : candidate;
  return normalizeStructuredPayload(parsedCandidate);
}

function extractStructuredPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const directCandidates = [
    payload.structured_payload,
    payload.structuredPayload,
    payload.data?.structured_payload,
    payload.data?.structuredPayload,
  ];

  for (let index = 0; index < directCandidates.length; index += 1) {
    const normalizedDirect = normalizeStructuredPayloadCandidate(directCandidates[index]);
    if (hasStructuredContent(normalizedDirect)) {
      return normalizedDirect;
    }
  }

  const outputText = extractOutputText(payload);
  const normalizedTextPayload = normalizeStructuredPayload(parseStructuredPayloadFromText(outputText));
  if (hasStructuredContent(normalizedTextPayload)) {
    return normalizedTextPayload;
  }

  return null;
}

function hasStructuredContent(structuredPayload) {
  if (!structuredPayload || typeof structuredPayload !== 'object') {
    return false;
  }

  return STRUCTURED_KEYS.some(
    (key) => Array.isArray(structuredPayload[key]) && structuredPayload[key].length > 0,
  );
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

  const structuredPayload = extractStructuredPayload(upstreamPayload);
  if (structuredPayload) {
    return buildResponse(200, {
      ...upstreamPayload,
      structured_payload: structuredPayload,
    });
  }

  return buildResponse(200, upstreamPayload);
}
