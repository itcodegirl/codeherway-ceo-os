const openAiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
const allowBrowserOpenAiRequests = import.meta.env.VITE_OPENAI_ALLOW_BROWSER === 'true';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = 'gpt-4.1-mini';

if (!openAiApiKey && import.meta.env.DEV) {
  console.warn('OpenAI API key is missing. Wire VITE_OPENAI_API_KEY for AI actions.');
}

if (openAiApiKey && !allowBrowserOpenAiRequests && import.meta.env.DEV) {
  console.warn(
    'Browser OpenAI requests are disabled by default. Set VITE_OPENAI_ALLOW_BROWSER=true only for local demos.',
  );
}

export const aiConfig = {
  hasApiKey: Boolean(openAiApiKey),
  canCallApiFromBrowser: Boolean(openAiApiKey && allowBrowserOpenAiRequests),
};

const CHIEF_ACTIONS = {
  summarize: {
    title: 'Executive Summary',
    instruction:
      'Write a concise executive summary with 3 short paragraphs: context, key updates, and immediate risks.',
    fallback: ({ notes }) =>
      `Executive Summary:\n${notes
        .split('.')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 3)
        .map((line) => `- ${line}.`)
        .join('\n')}`,
  },
  draft: {
    title: 'Draft Starter',
    instruction:
      'Draft a polished LinkedIn post in the founder voice with a clear hook, insight, and call to action.',
    fallback: ({ notes }) =>
      `LinkedIn Draft Starter:\n- Hook: This week we moved from planning to execution.\n- Insight: ${notes.slice(0, 180) || 'Share one practical leadership lesson from the week.'}\n- CTA: What is one operating-system habit that keeps your team aligned?`,
  },
  actions: {
    title: 'Action Item List',
    instruction:
      'Return a prioritized action list for the next 72 hours. Include owner, outcome, and due timing for each item.',
    fallback: () =>
      'Action Items:\n- Owner: Jenna | Outcome: Confirm next owner for each critical thread | Due: Today\n- Owner: Jenna | Outcome: Assign dates to each blocked item | Due: Tomorrow\n- Owner: Team | Outcome: Lock top 3 priorities for next 72 hours | Due: End of day',
  },
  priorities: {
    title: 'Priority Recommendation',
    instruction:
      'Recommend the top priorities for this week using impact, urgency, and sequence. Keep to 3 ranked bullets.',
    fallback: () =>
      'Priority Recommendation:\n1. Resolve high-urgency follow-ups with clear owners.\n2. Ship one high-leverage content artifact this week.\n3. Remove one strategic blocker that is slowing execution.',
  },
};

function getActionConfig(actionKey) {
  return CHIEF_ACTIONS[actionKey] || CHIEF_ACTIONS.summarize;
}

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
  const config = getActionConfig(actionKey);
  return {
    title: config.title,
    content: config.fallback({ notes }),
    source: 'fallback',
  };
}

export const createPromptPayload = (text) => ({
  input: text?.trim() || '',
  createdAt: new Date().toISOString(),
});

export const getChiefActionTitle = (actionKey) => getActionConfig(actionKey).title;

export async function generateChiefOfStaffResponse({ actionKey, notes }) {
  const normalizedNotes = notes?.trim() || '';

  if (!normalizedNotes) {
    return {
      title: getActionConfig(actionKey).title,
      content: '',
      source: 'empty',
    };
  }

  if (!aiConfig.canCallApiFromBrowser) {
    return createFallback(actionKey, normalizedNotes);
  }

  const config = getActionConfig(actionKey);
  const prompt = [
    `Task: ${config.instruction}`,
    'Use only the information below.',
    'If details are missing, state assumptions explicitly and keep wording practical.',
    '',
    'Notes:',
    normalizedNotes,
  ].join('\n');

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const output = extractResponseText(payload);

    if (!output) {
      return createFallback(actionKey, normalizedNotes);
    }

    return {
      title: config.title,
      content: output,
      source: 'openai',
    };
  } catch {
    return createFallback(actionKey, normalizedNotes);
  }
}
