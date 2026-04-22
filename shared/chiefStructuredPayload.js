export const STRUCTURED_KEYS = ['priorities', 'opportunities', 'contentItems', 'tasks'];
export const MAX_STRUCTURED_ITEMS_PER_SECTION = 12;
export const MAX_STRUCTURED_TEXT_LENGTH = 280;

export function createEmptyStructuredPayload() {
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

export function coerceStructuredObject(item) {
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    const title = sanitizeStructuredText(item);
    return title ? { title } : null;
  }

  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }

  return item;
}

export function normalizePriorityLikeItem(item) {
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

export function normalizeOpportunityItem(item) {
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

export function normalizeContentItem(item) {
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

export function normalizeStructuredCollection(sectionKey, values) {
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

export function normalizeStructuredPayload(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return createEmptyStructuredPayload();
  }

  const normalized = createEmptyStructuredPayload();

  STRUCTURED_KEYS.forEach((key) => {
    normalized[key] = normalizeStructuredCollection(key, input[key]);
  });

  return normalized;
}

export function hasStructuredContent(structuredPayload) {
  if (!structuredPayload || typeof structuredPayload !== 'object') {
    return false;
  }

  return STRUCTURED_KEYS.some((key) => Array.isArray(structuredPayload[key]) && structuredPayload[key].length > 0);
}

export function parseJsonCandidate(candidate) {
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

export function parseStructuredPayloadFromText(text) {
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
