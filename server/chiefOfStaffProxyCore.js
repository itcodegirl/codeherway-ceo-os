import { getChiefActionConfig } from '../src/lib/chiefActions.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const MAX_NOTES_LENGTH = 12000;

function normalizeBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  if (typeof body === 'object') {
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

export async function handleChiefOfStaffProxy({ method, body }) {
  if (method !== 'POST') {
    return buildResponse(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return buildResponse(500, { error: 'OPENAI_API_KEY is not configured on the server' });
  }

  const parsedBody = normalizeBody(body);
  const notes = normalizeNotes(parsedBody.notes);
  const actionKey = typeof parsedBody.actionKey === 'string' ? parsedBody.actionKey : 'summarize';

  if (!notes) {
    return buildResponse(400, { error: 'Notes are required' });
  }

  const actionConfig = getChiefActionConfig(actionKey);

  const upstreamResponse = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
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

  const upstreamPayload = await upstreamResponse.json().catch(() => ({}));

  if (!upstreamResponse.ok) {
    return buildResponse(upstreamResponse.status, {
      error: 'OpenAI request failed',
    });
  }

  return buildResponse(200, upstreamPayload);
}
