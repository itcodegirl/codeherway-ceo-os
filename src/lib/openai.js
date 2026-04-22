import { getChiefActionConfig } from './chiefActions';
import { buildCreateId } from './utils';
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

function normalizeCorrelationId(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  return normalized.slice(0, 96);
}

function parseRequestId(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
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

  const responseText = textContent || extractChiefResponseText(payload);
  const parsedFromText = parseStructuredPayloadFromText(responseText);
  return normalizeStructuredPayload(parsedFromText);
}

function createFallback(actionKey, notes, metadata = {}) {
  const config = getChiefActionConfig(actionKey);
  return {
    title: config.title,
    content: config.fallback({ notes }),
    structuredPayload: createEmptyStructuredPayload(),
    source: 'fallback',
    requestId: parseRequestId(metadata.requestId),
    correlationId: normalizeCorrelationId(metadata.correlationId),
  };
}

async function fetchChiefProxy(payload, options = {}) {
  const correlationId = normalizeCorrelationId(options.correlationId);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(aiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(correlationId ? { 'x-chief-correlation-id': correlationId } : {}),
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

export async function generateChiefOfStaffResponse({ actionKey, notes, correlationId = '' }) {
  const normalizedNotes = notes?.trim() || '';
  const normalizedCorrelationId = normalizeCorrelationId(correlationId) || buildCreateId();

  if (!normalizedNotes) {
    return {
      title: getChiefActionConfig(actionKey).title,
      content: '',
      structuredPayload: createEmptyStructuredPayload(),
      source: 'empty',
      requestId: '',
      correlationId: normalizedCorrelationId,
    };
  }

  if (!aiConfig.endpoint) {
    return createFallback(actionKey, normalizedNotes, {
      correlationId: normalizedCorrelationId,
    });
  }

  const config = getChiefActionConfig(actionKey);

  try {
    const response = await fetchChiefProxy({
      actionKey,
      notes: normalizedNotes,
    }, {
      correlationId: normalizedCorrelationId,
    });

    if (!response.ok) {
      throw new Error(`AI proxy request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const requestId = parseRequestId(payload?.request_id);
    const responseCorrelationId = normalizeCorrelationId(payload?.correlation_id) || normalizedCorrelationId;
    const output = extractChiefResponseText(payload);
    const structuredPayload = extractStructuredPayload(payload, output);

    if (!output) {
      const fallback = createFallback(actionKey, normalizedNotes);
      return {
        ...fallback,
        structuredPayload: hasStructuredContent(structuredPayload)
          ? structuredPayload
          : fallback.structuredPayload,
        requestId,
        correlationId: responseCorrelationId,
      };
    }

    return {
      title: config.title,
      content: output,
      structuredPayload,
      source: 'proxy',
      requestId,
      correlationId: responseCorrelationId,
    };
  } catch {
    return createFallback(actionKey, normalizedNotes, {
      correlationId: normalizedCorrelationId,
    });
  }
}
