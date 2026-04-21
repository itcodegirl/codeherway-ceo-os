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

export const aiConfig = {
  hasProxyEndpoint: Boolean(configuredProxyUrl),
  endpoint: OPENAI_PROXY_URL,
  configuredEndpoint: configuredProxyUrl || null,
};

function extractResponseText(payload) {
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

function normalizeStructuredItem(item) {
  if (typeof item === 'string') {
    const normalizedValue = item.trim();
    return normalizedValue ? { title: normalizedValue } : null;
  }

  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }

  const normalized = {};
  Object.entries(item).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        normalized[key] = trimmed;
      }
      return;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      normalized[key] = value;
    }
  });

  if (Object.keys(normalized).length === 0) {
    return null;
  }

  return normalized;
}

function normalizeStructuredPayload(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      priorities: [],
      opportunities: [],
      contentItems: [],
      tasks: [],
    };
  }

  const normalized = {
    priorities: [],
    opportunities: [],
    contentItems: [],
    tasks: [],
  };

  STRUCTURED_KEYS.forEach((key) => {
    const rawValues = Array.isArray(input[key]) ? input[key] : [];
    normalized[key] = rawValues
      .map(normalizeStructuredItem)
      .filter(Boolean);
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
    return normalizeStructuredPayload(null);
  }

  const directStructured = payload.structured_payload || payload.structuredPayload;
  const normalizedDirect = normalizeStructuredPayload(directStructured);
  if (hasStructuredContent(normalizedDirect)) {
    return normalizedDirect;
  }

  const parsedFromText = parseStructuredPayloadFromText(textContent);
  return normalizeStructuredPayload(parsedFromText);
}

function createFallback(actionKey, notes) {
  const config = getChiefActionConfig(actionKey);
  return {
    title: config.title,
    content: config.fallback({ notes }),
    structuredPayload: normalizeStructuredPayload(null),
    source: 'fallback',
  };
}

export const getChiefActionTitle = (actionKey) => getChiefActionConfig(actionKey).title;

export async function generateChiefOfStaffResponse({ actionKey, notes }) {
  const normalizedNotes = notes?.trim() || '';

  if (!normalizedNotes) {
    return {
      title: getChiefActionConfig(actionKey).title,
      content: '',
      structuredPayload: normalizeStructuredPayload(null),
      source: 'empty',
    };
  }

  if (!aiConfig.endpoint) {
    return createFallback(actionKey, normalizedNotes);
  }

  const config = getChiefActionConfig(actionKey);

  try {
    const response = await fetch(aiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actionKey,
        notes: normalizedNotes,
      }),
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
