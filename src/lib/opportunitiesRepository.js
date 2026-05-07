import { opportunities as mockOpportunities } from '../data/mockData';
import { deleteRecordById, replaceRecordById } from './stateUtils';
import { buildCreateId, requireLocalStorageSetItem, safeLocalStorageSetItem } from './utils';
import { getSupabaseRuntime, isSupabaseRuntimeEnabled } from './supabaseRuntime';
import { StaleRecordError, assertRecordIsFresh, readUpdatedAtMs } from './staleRecordError';
import { tryRemoteOrEnqueue } from './offlineWriteQueueIntegration';
import { isDemoWorkspaceEnabled } from './workspaceSetup';
import { parseJsonOrPreserveCorruption } from './storageCorruption';

export const OPPORTUNITY_QUEUE_KIND_CREATE = 'opportunity:create';
export const OPPORTUNITY_QUEUE_KIND_UPDATE = 'opportunity:update';
export const OPPORTUNITY_QUEUE_KIND_DELETE = 'opportunity:delete';

const STORAGE_KEY = 'ceo-os-opportunities';
export const OPPORTUNITIES_UPDATED_EVENT = 'ceo-os:opportunities-updated';
const DEMO_OPPORTUNITY_IDS = new Set(mockOpportunities.map((item) => String(item.id)));

function normalizeOpportunity(item) {
  return {
    id: String(item.id),
    name: item.name || '',
    company: item.company || '',
    priority: item.priority || 'Low',
    stage: item.stage || 'New',
    nextStep: item.nextStep || item.next_step || '',
    updatedAt: readUpdatedAtMs(item),
  };
}

function expectedUpdatedAtToIso(expectedUpdatedAt) {
  const expected = Number(expectedUpdatedAt);
  if (!Number.isFinite(expected) || expected <= 0) {
    return null;
  }
  return new Date(expected).toISOString();
}

function getSeededLocalItems() {
  if (!isDemoWorkspaceEnabled()) {
    return [];
  }

  return getDemoLocalItems();
}

function getDemoLocalItems() {
  return mockOpportunities.map((item) => normalizeOpportunity(item));
}

function readLocalOpportunities() {
  if (typeof window === 'undefined') {
    return getSeededLocalItems();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = getSeededLocalItems();
      safeLocalStorageSetItem(
        STORAGE_KEY,
        JSON.stringify(seeded),
        'Failed to seed opportunities in localStorage',
      );
      return seeded;
    }

    const parsed = parseJsonOrPreserveCorruption(STORAGE_KEY, raw, null);
    if (!Array.isArray(parsed)) {
      return getSeededLocalItems();
    }

    return parsed.map((item) => normalizeOpportunity(item));
  } catch {
    return getSeededLocalItems();
  }
}

function writeLocalOpportunities(items) {
  requireLocalStorageSetItem(
    STORAGE_KEY,
    JSON.stringify(items),
    'Failed to persist opportunities to localStorage',
  );
}

function notifyOpportunitiesUpdated(detail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(OPPORTUNITIES_UPDATED_EVENT, { detail }));
}

function formatForSupabase(payload) {
  return {
    ...(payload.userId ? { user_id: payload.userId } : {}),
    name: payload.name,
    company: payload.company,
    priority: payload.priority,
    stage: payload.stage,
    next_step: payload.nextStep,
  };
}

function mapSupabaseRows(rows) {
  return rows.map((item) => normalizeOpportunity(item));
}

export function getOpportunitiesSource() {
  return isSupabaseRuntimeEnabled ? 'supabase' : 'local';
}

export async function listOpportunities() {
  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const userId = await supabase.requireSupabaseUserId();
    const { data, error } = await supabaseClient
      .from('opportunities')
      .select('id, name, company, priority, stage, next_step, updated_at')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return mapSupabaseRows(data || []);
  }

  return readLocalOpportunities();
}

export async function createOpportunity(payload, options = {}) {
  const normalizedPayload = normalizeOpportunity({
    id: buildCreateId(),
    updatedAt: Date.now(),
    ...payload,
  });

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const attempt = async () => {
      const userId = await supabase.requireSupabaseUserId();
      const { data, error } = await supabaseClient
        .from('opportunities')
        .insert(formatForSupabase({ ...normalizedPayload, userId }))
        .select('id, name, company, priority, stage, next_step, updated_at')
        .single();

      if (error) {
        throw error;
      }

      notifyOpportunitiesUpdated({ source: 'supabase', type: 'create' });
      return normalizeOpportunity(data);
    };

    return tryRemoteOrEnqueue(
      { kind: OPPORTUNITY_QUEUE_KIND_CREATE, payload, options },
      attempt,
    );
  }

  const current = readLocalOpportunities();
  const next = [normalizedPayload, ...current];
  writeLocalOpportunities(next);
  notifyOpportunitiesUpdated({ source: 'local', type: 'create' });
  return normalizedPayload;
}

export async function updateOpportunity(id, payload, options = {}) {
  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const attempt = async () => {
      const normalizedPayload = normalizeOpportunity({ id, ...payload });
      const userId = await supabase.requireSupabaseUserId();
      let query = supabaseClient
        .from('opportunities')
        .update(formatForSupabase(normalizedPayload))
        .eq('id', id)
        .eq('user_id', userId);

      const expectedIso = expectedUpdatedAtToIso(options.expectedUpdatedAt);
      if (expectedIso) {
        // Optimistic locking: only update if the row's updated_at still matches
        // what the client opened the editor with. PostgREST returns the matched
        // row in `data`; if no row matched, data is null and we treat it as a
        // stale-record conflict (same UX as the local-only path).
        query = query.eq('updated_at', expectedIso);
      }

      const { data, error } = await query
        .select('id, name, company, priority, stage, next_step, updated_at')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new StaleRecordError(
          'This opportunity was changed in another window. Reload to see the latest version before saving.',
        );
      }

      notifyOpportunitiesUpdated({ source: 'supabase', type: 'update' });
      return normalizeOpportunity(data);
    };

    return tryRemoteOrEnqueue(
      {
        kind: OPPORTUNITY_QUEUE_KIND_UPDATE,
        payload: { id, payload, expectedUpdatedAt: options.expectedUpdatedAt },
        options,
      },
      attempt,
    );
  }

  // Local-only path enforces optimistic locking via the updatedAt timestamp.
  const current = readLocalOpportunities();
  const persisted = current.find((item) => String(item.id) === String(id));

  assertRecordIsFresh(
    persisted,
    options.expectedUpdatedAt,
    'This opportunity was changed in another window. Reload to see the latest version before saving.',
  );

  const normalizedPayload = normalizeOpportunity({
    id,
    ...payload,
    updatedAt: Date.now(),
  });
  const next = replaceRecordById(current, id, normalizedPayload, {
    notFoundMessage: 'Opportunity not found',
  });
  writeLocalOpportunities(next);
  notifyOpportunitiesUpdated({ source: 'local', type: 'update' });
  return normalizedPayload;
}

export async function deleteOpportunity(id, options = {}) {
  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const attempt = async () => {
      const userId = await supabase.requireSupabaseUserId();
      const { error } = await supabaseClient
        .from('opportunities')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) {
        throw error;
      }
      notifyOpportunitiesUpdated({ source: 'supabase', type: 'delete' });
    };

    await tryRemoteOrEnqueue(
      { kind: OPPORTUNITY_QUEUE_KIND_DELETE, payload: { id }, options },
      attempt,
    );
    return;
  }

  const current = readLocalOpportunities();
  const next = deleteRecordById(current, id, {
    notFoundMessage: 'Opportunity not found',
  });
  writeLocalOpportunities(next);
  notifyOpportunitiesUpdated({ source: 'local', type: 'delete' });
}

export function clearLocalOpportunityDemoData() {
  const current = readLocalOpportunities();
  const next = current.filter((item) => !DEMO_OPPORTUNITY_IDS.has(String(item.id)));
  writeLocalOpportunities(next);
  notifyOpportunitiesUpdated({ source: 'local', type: 'clear_demo' });
  return next;
}

export function resetLocalOpportunityDemoData() {
  const seeded = getDemoLocalItems();
  writeLocalOpportunities(seeded);
  notifyOpportunitiesUpdated({ source: 'local', type: 'load_demo' });
  return seeded;
}
