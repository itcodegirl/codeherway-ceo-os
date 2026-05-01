import { opportunities as mockOpportunities } from '../data/mockData';
import { buildCreateId, requireLocalStorageSetItem, safeLocalStorageSetItem } from './utils';
import { getSupabaseRuntime, isSupabaseRuntimeEnabled } from './supabaseRuntime';

const STORAGE_KEY = 'ceo-os-opportunities';
export const OPPORTUNITIES_UPDATED_EVENT = 'ceo-os:opportunities-updated';

function normalizeOpportunity(item) {
  return {
    id: String(item.id),
    name: item.name || '',
    company: item.company || '',
    priority: item.priority || 'Low',
    stage: item.stage || 'New',
    nextStep: item.nextStep || item.next_step || '',
  };
}

function getSeededLocalItems() {
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

    const parsed = JSON.parse(raw);
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
      .select('id, name, company, priority, stage, next_step')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return mapSupabaseRows(data || []);
  }

  return readLocalOpportunities();
}

export async function createOpportunity(payload) {
  const normalizedPayload = normalizeOpportunity({ id: buildCreateId(), ...payload });

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const userId = await supabase.requireSupabaseUserId();
    const { data, error } = await supabaseClient
      .from('opportunities')
      .insert(formatForSupabase({ ...normalizedPayload, userId }))
      .select('id, name, company, priority, stage, next_step')
      .single();

    if (error) {
      throw error;
    }

    notifyOpportunitiesUpdated({ source: 'supabase', type: 'create' });
    return normalizeOpportunity(data);
  }

  const current = readLocalOpportunities();
  const next = [normalizedPayload, ...current];
  writeLocalOpportunities(next);
  notifyOpportunitiesUpdated({ source: 'local', type: 'create' });
  return normalizedPayload;
}

export async function updateOpportunity(id, payload) {
  const normalizedPayload = normalizeOpportunity({ id, ...payload });

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const userId = await supabase.requireSupabaseUserId();
    const { data, error } = await supabaseClient
      .from('opportunities')
      .update(formatForSupabase(normalizedPayload))
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, name, company, priority, stage, next_step')
      .single();

    if (error) {
      throw error;
    }

    notifyOpportunitiesUpdated({ source: 'supabase', type: 'update' });
    return normalizeOpportunity(data);
  }

  const current = readLocalOpportunities();
  let didUpdate = false;
  const next = current.map((item) => {
    if (item.id !== String(id)) {
      return item;
    }

    didUpdate = true;
    return normalizedPayload;
  });

  if (!didUpdate) {
    throw new Error('Opportunity not found');
  }

  writeLocalOpportunities(next);
  notifyOpportunitiesUpdated({ source: 'local', type: 'update' });
  return normalizedPayload;
}

export async function deleteOpportunity(id) {
  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
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
    return;
  }

  const current = readLocalOpportunities();
  const didDelete = current.some((item) => item.id === String(id));
  if (!didDelete) {
    throw new Error('Opportunity not found');
  }

  const next = current.filter((item) => item.id !== String(id));
  writeLocalOpportunities(next);
  notifyOpportunitiesUpdated({ source: 'local', type: 'delete' });
}
