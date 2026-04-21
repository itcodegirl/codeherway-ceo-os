import { getChiefActionConfig } from './chiefActions';

const configuredProxyUrl = (import.meta.env.VITE_OPENAI_PROXY_URL || '').trim();
const fallbackProxyUrl = '/api/chief-of-staff';
const OPENAI_PROXY_URL = configuredProxyUrl || fallbackProxyUrl;

if (!configuredProxyUrl && import.meta.env.DEV) {
  console.warn(
    'OpenAI proxy URL is not explicitly configured. Using the bundled default endpoint for live responses.',
  );
}

const STRUCTURED_KEYS = ['priorities', 'opportunities', 'contentItems', 'tasks'];
const MAX_STRUCTURED_ITEMS_PER_SECTION = 12;
const MAX_STRUCTURED_TEXT_LENGTH = 280;
const REQUEST_TIMEOUT_MS = 12000;

export const aiConfig = {
  hasProxyEndpoint: Boolean(configuredProxyUrl),
  endpoint: OPENAI_PROXY_URL,
  configuredEndpoint: configuredProxyUrl || null,
};

function extractResponseText(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const readOutputTextValue = (value) => {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return value
        .map((entry) => readOutputTextValue(entry))
        .filter(Boolean)
        .join('\n\n');
    }

    return '';
  };

  const outputText = readOutputTextValue(payload.output_text);
  if (outputText) {
    return outputText;
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
        return;
      }

      if (
        contentPart?.type === 'output_text'
        && Array.isArray(contentPart.text)
      ) {
        contentPart.text
          .map((entry) => readOutputTextValue(entry))
          .filter(Boolean)
          .forEach((entryText) => textParts.push(entryText));
      }
    });
  });

  return textParts.filter(Boolean).join('\n\n');
}

function createEmptyStructuredPayload() {
  return {
    priorities: [],
    opportunities: [],
    contentItems: [],
    tasks: [],
  };
}

function sanitizeStructuredText(value) {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return '';
  }

  const collapsed = String(value).replace(/\s+/g, ' ').trim();
  if (!collapsed) {
    return '';
  }

  return collapsed.slice(0, MAX_STRUCTURED_TEXT_LENGTH);
}

function coerceStructuredObject(item) {
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    const title = sanitizeStructuredText(item);
    return title ? { title } : null;
  }

  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }

  return item;
}

function normalizePriorityLikeItem(item) {
  const title = sanitizeStructuredText(item.title || item.text || item.summary || item.task || item.name);
  if (!title) {
    return null;
  }

  const normalized = { title };
  const owner = sanitizeStructuredText(item.owner || item.assignee);
  const status = sanitizeStructuredText(item.status || item.state);
  const dueDate = sanitizeStructuredText(item.dueDate || item.due_date || item.deadline);

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
  const name = sanitizeStructuredText(item.name || item.title || item.text || item.summary || item.task);
  if (!name) {
    return null;
  }

  const normalized = { name };
  const company = sanitizeStructuredText(item.company || item.organization);
  const priority = sanitizeStructuredText(item.priority);
  const stage = sanitizeStructuredText(item.stage);
  const nextStep = sanitizeStructuredText(item.nextStep || item.next_step || item.action || item.actionItem);

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
  const title = sanitizeStructuredText(item.title || item.name || item.text || item.summary || item.task);
  if (!title) {
    return null;
  }

  const normalized = { title };
  const platform = sanitizeStructuredText(item.platform || item.channel);
  const status = sanitizeStructuredText(item.status || item.state);

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
    normalized[key] = normalizeStructuredCollection(key, input[key]);
  });

  return normalized;
}

function hasStructuredContent(structuredPayload) {
  return STRUCTURED_KEYS.some((key) => Array.isArray(structuredPayload[key]) && structuredPayload[key].length > 0);
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

  const sectionMap = {
    priorities: [],
    opportunities: [],
    contentItems: [],
    tasks: [],
  };

  let activeSection = '';
  const lines = trimmedText.split('\n').map((line) => line.trim()).filter(Boolean);
  lines.forEach((line) => {
    const headingMatch = line.match(/^#{1,6}\s*(priorities|opportunities|content items?|tasks)\b:?/i);
    if (headingMatch) {
      const heading = headingMatch[1].toLowerCase();
      if (heading.startsWith('content')) {
        activeSection = 'contentItems';
      } else {
        activeSection = heading;
      }
      return;
    }

    const labelMatch = line.match(/^(priorities|opportunities|content items?|tasks)\s*:/i);
    if (labelMatch) {
      const heading = labelMatch[1].toLowerCase();
      if (heading.startsWith('content')) {
        activeSection = 'contentItems';
      } else {
        activeSection = heading;
      }
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

function extractStructuredPayload(payload, textContent) {
  if (!payload || typeof payload !== 'object') {
    return createEmptyStructuredPayload();
  }

  const directStructuredCandidates = [
    payload.structured_payload,
    payload.structuredPayload,
    payload.data?.structured_payload,
    payload.data?.structuredPayload,
  ];

  for (let index = 0; index < directStructuredCandidates.length; index += 1) {
    const candidate = directStructuredCandidates[index];
    const parsedCandidate = typeof candidate === 'string' ? parseJsonCandidate(candidate) : candidate;
    const normalizedCandidate = normalizeStructuredPayload(parsedCandidate);
    if (hasStructuredContent(normalizedCandidate)) {
      return normalizedCandidate;
    }
  }

  const responseText = textContent || extractResponseText(payload);
  const parsedFromText = parseStructuredPayloadFromText(responseText);
  return normalizeStructuredPayload(parsedFromText);
}

function createFallback(actionKey, notes) {
  const config = getChiefActionConfig(actionKey);
  return {
    title: config.title,
    content: config.fallback({ notes }),
    structuredPayload: createEmptyStructuredPayload(),
    source: 'fallback',
  };
}

async function fetchChiefProxy(payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(aiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('Chief of staff proxy request timed out');
      timeoutError.code = 'CHIEF_PROXY_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const getChiefActionTitle = (actionKey) => getChiefActionConfig(actionKey).title;

export async function generateChiefOfStaffResponse({ actionKey, notes }) {
  const normalizedNotes = notes?.trim() || '';

  if (!normalizedNotes) {
    return {
      title: getChiefActionConfig(actionKey).title,
      content: '',
      structuredPayload: createEmptyStructuredPayload(),
      source: 'empty',
    };
  }

  if (!aiConfig.endpoint) {
    return createFallback(actionKey, normalizedNotes);
  }

  const config = getChiefActionConfig(actionKey);

  try {
    const response = await fetchChiefProxy({
      actionKey,
      notes: normalizedNotes,
    });

    if (!response.ok) {
      throw new Error(`AI proxy request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const output = extractResponseText(payload);
    const structuredPayload = extractStructuredPayload(payload, output);

    if (!output) {
      const fallback = createFallback(actionKey, normalizedNotes);
      return {
        ...fallback,
        structuredPayload: hasStructuredContent(structuredPayload)
          ? structuredPayload
          : fallback.structuredPayload,
      };
    }

    return {
      title: config.title,
      content: output,
      structuredPayload,
      source: 'proxy',
    };
  } catch {
    return createFallback(actionKey, normalizedNotes);
  }
}
