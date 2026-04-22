import { getChiefActionConfig } from './chiefActions';
import { extractChiefResponseText } from '../../shared/chiefResponseText';
import {
  createEmptyStructuredPayload,
  hasStructuredContent,
  normalizeStructuredPayload,
  parseJsonCandidate,
  parseStructuredPayloadFromText,
} from '../../shared/chiefStructuredPayload';

const configuredProxyUrl = (import.meta.env.VITE_OPENAI_PROXY_URL || '').trim();
const fallbackProxyUrl = '/api/chief-of-staff';
const OPENAI_PROXY_URL = configuredProxyUrl || fallbackProxyUrl;

if (!configuredProxyUrl && import.meta.env.DEV) {
  console.warn(
    'OpenAI proxy URL is not explicitly configured. Using the bundled default endpoint for live responses.',
  );
}

const REQUEST_TIMEOUT_MS = 12000;

export const aiConfig = {
  hasProxyEndpoint: Boolean(configuredProxyUrl),
  endpoint: OPENAI_PROXY_URL,
  configuredEndpoint: configuredProxyUrl || null,
};

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

  const responseText = textContent || extractChiefResponseText(payload);
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
    const output = extractChiefResponseText(payload);
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
