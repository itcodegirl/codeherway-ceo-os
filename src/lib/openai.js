import { getChiefActionConfig } from './chiefActions';

const configuredProxyUrl = (import.meta.env.VITE_OPENAI_PROXY_URL || '').trim();
const fallbackProxyUrl = '/api/chief-of-staff';
const OPENAI_PROXY_URL = configuredProxyUrl || fallbackProxyUrl;

if (!configuredProxyUrl && import.meta.env.DEV) {
  console.warn(
    'OpenAI proxy URL is not explicitly configured. Using the bundled default endpoint for live responses.',
  );
}

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

function createFallback(actionKey, notes) {
  const config = getChiefActionConfig(actionKey);
  return {
    title: config.title,
    content: config.fallback({ notes }),
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

    if (!output) {
      return createFallback(actionKey, normalizedNotes);
    }

    return {
      title: config.title,
      content: output,
      source: 'proxy',
    };
  } catch {
    return createFallback(actionKey, normalizedNotes);
  }
}
