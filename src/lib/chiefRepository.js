import { buildCreateId, safeLocalStorageSetItem } from './utils';
import { isSupabaseConfigured, requireSupabaseUserId, supabaseClient } from './supabase';

const CHIEF_NOTES_STORAGE_KEY = 'ceo-os-chief-notes';
const CHIEF_RESPONSES_STORAGE_KEY = 'ceo-os-chief-responses';
const MAX_CHIEF_RESPONSES = 30;

function normalizeChiefResponse(item) {
  return {
    id: String(item?.id || buildCreateId()),
    title: item?.title || 'Executive Output',
    content: item?.content || '',
    source: item?.source || 'proxy',
    structuredPayload:
      item?.structuredPayload && typeof item.structuredPayload === 'object'
        ? item.structuredPayload
        : {},
  };
}

function readLocalChiefNotes() {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const raw = window.localStorage.getItem(CHIEF_NOTES_STORAGE_KEY);
    return typeof raw === 'string' ? raw : '';
  } catch {
    return '';
  }
}

function writeLocalChiefNotes(notes) {
  safeLocalStorageSetItem(
    CHIEF_NOTES_STORAGE_KEY,
    notes,
    'Failed to persist chief notes to localStorage',
  );
}

function readLocalChiefResponses() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CHIEF_RESPONSES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeChiefResponse) : [];
  } catch {
    return [];
  }
}

function writeLocalChiefResponses(responses) {
  safeLocalStorageSetItem(
    CHIEF_RESPONSES_STORAGE_KEY,
    JSON.stringify(responses),
    'Failed to persist chief responses to localStorage',
  );
}

function isSupabaseAuthError(error) {
  const authErrorCode = error?.code || '';
  const statusCode = Number(error?.status) || 0;
  return (
    authErrorCode === 'SUPABASE_AUTH_REQUIRED'
    || authErrorCode === 'PGRST301'
    || authErrorCode === 'PGRST116'
    || statusCode === 401
    || statusCode === 403
  );
}

function normalizeSupabaseId(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

async function writeLatestSupabaseChiefNotes(notes) {
  if (!supabaseClient) {
    return false;
  }

  const userId = await requireSupabaseUserId();
  const { data: latestSession, error: lookupError } = await supabaseClient
    .from('chief_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  const sessionId = normalizeSupabaseId(latestSession?.id);
  if (!sessionId) {
    return false;
  }

  const { error: updateError } = await supabaseClient
    .from('chief_sessions')
    .update({ notes: notes })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (updateError) {
    throw updateError;
  }

  return true;
}

async function withSupabaseAuthFallback(operation, localFallback) {
  if (!isSupabaseConfigured || !supabaseClient) {
    return localFallback();
  }

  try {
    return await operation();
  } catch (error) {
    if (isSupabaseAuthError(error)) {
      return localFallback();
    }
    throw error;
  }
}

function getLocalChiefWorkspace() {
  return {
    notes: readLocalChiefNotes(),
    responses: readLocalChiefResponses(),
    source: 'local',
  };
}

export function getChiefSource() {
  return isSupabaseConfigured ? 'supabase' : 'local';
}

export async function loadChiefWorkspace() {
  return withSupabaseAuthFallback(
    async () => {
      const userId = await requireSupabaseUserId();
      const { data: latestSession, error: sessionError } = await supabaseClient
        .from('chief_sessions')
        .select('id, notes')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        throw sessionError;
      }

      const { data: outputRows, error: outputError } = await supabaseClient
        .from('chief_outputs')
        .select('id, title, content, source, structured_payload')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_CHIEF_RESPONSES);

      if (outputError) {
        throw outputError;
      }

      return {
        notes: latestSession?.notes || '',
        responses: (Array.isArray(outputRows) ? outputRows : []).map((row) =>
          normalizeChiefResponse({
            id: row.id,
            title: row.title,
            content: row.content,
            source: row.source,
            structuredPayload: row.structured_payload,
          })),
        source: 'supabase',
      };
    },
    getLocalChiefWorkspace,
  );
}

export async function saveChiefNotes(notes) {
  const normalizedNotes = typeof notes === 'string' ? notes : '';
  writeLocalChiefNotes(normalizedNotes);

  if (isSupabaseConfigured && supabaseClient) {
    return withSupabaseAuthFallback(
      async () => {
        await writeLatestSupabaseChiefNotes(normalizedNotes);
        return normalizedNotes;
      },
      () => normalizedNotes,
    );
  }

  return normalizedNotes;
}

export async function createChiefSession({ actionKey, notes }) {
  const normalizedActionKey = typeof actionKey === 'string' ? actionKey : '';
  const normalizedNotes = typeof notes === 'string' ? notes : '';

  return withSupabaseAuthFallback(
    async () => {
      const userId = await requireSupabaseUserId();
      const { data, error } = await supabaseClient
        .from('chief_sessions')
        .insert({
          user_id: userId,
          action_key: normalizedActionKey,
          notes: normalizedNotes,
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        source: 'supabase',
      };
    },
    () => {
      writeLocalChiefNotes(normalizedNotes);
      return {
        id: buildCreateId(),
        source: 'local',
      };
    },
  );
}

export async function saveChiefOutput({
  sessionId,
  outputType = 'response',
  title,
  content,
  structuredPayload,
  source = 'proxy',
}) {
  const normalizedOutput = normalizeChiefResponse({
    id: buildCreateId(),
    title,
    content,
    source,
    structuredPayload:
      structuredPayload && typeof structuredPayload === 'object'
        ? structuredPayload
        : {},
  });

  return withSupabaseAuthFallback(
    async () => {
      const userId = await requireSupabaseUserId();
      const { data, error } = await supabaseClient
        .from('chief_outputs')
        .insert({
          session_id: sessionId,
          user_id: userId,
          output_type: outputType,
          title: normalizedOutput.title,
          content: normalizedOutput.content,
          structured_payload: normalizedOutput.structuredPayload,
          source: normalizedOutput.source,
        })
        .select('id, title, content, source, structured_payload')
        .single();

      if (error) {
        throw error;
      }

      return normalizeChiefResponse({
        id: data.id,
        title: data.title,
        content: data.content,
        source: data.source,
        structuredPayload: data.structured_payload,
      });
    },
    () => {
      const current = readLocalChiefResponses();
      const next = [normalizedOutput, ...current].slice(0, MAX_CHIEF_RESPONSES);
      writeLocalChiefResponses(next);
      return normalizedOutput;
    },
  );
}

export async function resetChiefWorkspace() {
  return withSupabaseAuthFallback(
    async () => {
      const userId = await requireSupabaseUserId();
      const { error: outputDeleteError } = await supabaseClient
        .from('chief_outputs')
        .delete()
        .eq('user_id', userId);

      if (outputDeleteError) {
        throw outputDeleteError;
      }

      const { error } = await supabaseClient
        .from('chief_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    },
    () => {
      if (typeof window === 'undefined') {
        return;
      }

      window.localStorage.removeItem(CHIEF_NOTES_STORAGE_KEY);
      window.localStorage.removeItem(CHIEF_RESPONSES_STORAGE_KEY);
    },
  );
}
