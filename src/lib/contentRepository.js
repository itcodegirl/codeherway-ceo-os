import { contentItems as mockContentItems } from '../data/mockData';
import { deleteRecordById, replaceRecordById } from './stateUtils';
import { buildCreateId, requireLocalStorageSetItem, safeLocalStorageSetItem } from './utils';
import { getSupabaseRuntime, isSupabaseRuntimeEnabled } from './supabaseRuntime';
import { StaleRecordError, assertRecordIsFresh, readUpdatedAtMs } from './staleRecordError';

function expectedUpdatedAtToIso(expectedUpdatedAt) {
  const expected = Number(expectedUpdatedAt);
  if (!Number.isFinite(expected) || expected <= 0) {
    return null;
  }
  return new Date(expected).toISOString();
}

const STORAGE_KEY = 'ceo-os-content-items';
export const CONTENT_ITEMS_UPDATED_EVENT = 'ceo-os:content-items-updated';

function normalizeContentItem(item) {
  return {
    id: String(item.id),
    title: item.title || '',
    platform: item.platform || '',
    status: item.status || 'Drafting',
    updatedAt: readUpdatedAtMs(item),
  };
}

function getSeededLocalItems() {
  return mockContentItems.map((item) => normalizeContentItem(item));
}

function readLocalContentItems() {
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
        'Failed to seed content items in localStorage',
      );
      return seeded;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return getSeededLocalItems();
    }

    return parsed.map((item) => normalizeContentItem(item));
  } catch {
    return getSeededLocalItems();
  }
}

function writeLocalContentItems(items) {
  requireLocalStorageSetItem(
    STORAGE_KEY,
    JSON.stringify(items),
    'Failed to persist content items to localStorage',
  );
}

function notifyContentItemsUpdated(detail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(CONTENT_ITEMS_UPDATED_EVENT, { detail }));
}

export function getContentSource() {
  return isSupabaseRuntimeEnabled ? 'supabase' : 'local';
}

export async function listContentItems() {
  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const userId = await supabase.requireSupabaseUserId();
    const { data, error } = await supabaseClient
      .from('content_items')
      .select('id, title, platform, status')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return (data || []).map((item) => normalizeContentItem(item));
  }

  return readLocalContentItems();
}

export async function createContentItem(payload) {
  const normalizedPayload = normalizeContentItem({
    id: buildCreateId(),
    updatedAt: Date.now(),
    ...payload,
  });

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const userId = await supabase.requireSupabaseUserId();
    const { data, error } = await supabaseClient
      .from('content_items')
      .insert({
        user_id: userId,
        title: normalizedPayload.title,
        platform: normalizedPayload.platform,
        status: normalizedPayload.status,
      })
      .select('id, title, platform, status')
      .single();

    if (error) {
      throw error;
    }

    notifyContentItemsUpdated({ source: 'supabase', type: 'create' });
    return normalizeContentItem(data);
  }

  const current = readLocalContentItems();
  const next = [normalizedPayload, ...current];
  writeLocalContentItems(next);
  notifyContentItemsUpdated({ source: 'local', type: 'create' });
  return normalizedPayload;
}

export async function updateContentItem(id, payload, options = {}) {
  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const normalizedPayload = normalizeContentItem({ id, ...payload });
    const userId = await supabase.requireSupabaseUserId();
    let query = supabaseClient
      .from('content_items')
      .update({
        title: normalizedPayload.title,
        platform: normalizedPayload.platform,
        status: normalizedPayload.status,
      })
      .eq('id', id)
      .eq('user_id', userId);

    const expectedIso = expectedUpdatedAtToIso(options.expectedUpdatedAt);
    if (expectedIso) {
      // Optimistic locking — see opportunitiesRepository for the rationale.
      query = query.eq('updated_at', expectedIso);
    }

    const { data, error } = await query
      .select('id, title, platform, status, updated_at')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new StaleRecordError(
        'This content item was changed in another window. Reload to see the latest version before saving.',
      );
    }

    notifyContentItemsUpdated({ source: 'supabase', type: 'update' });
    return normalizeContentItem(data);
  }

  // Local-only optimistic locking via updatedAt.
  const current = readLocalContentItems();
  const persisted = current.find((item) => String(item.id) === String(id));

  assertRecordIsFresh(
    persisted,
    options.expectedUpdatedAt,
    'This content item was changed in another window. Reload to see the latest version before saving.',
  );

  const normalizedPayload = normalizeContentItem({
    id,
    ...payload,
    updatedAt: Date.now(),
  });
  const next = replaceRecordById(current, id, normalizedPayload, {
    notFoundMessage: 'Content item not found',
  });
  writeLocalContentItems(next);
  notifyContentItemsUpdated({ source: 'local', type: 'update' });
  return normalizedPayload;
}

export async function deleteContentItem(id) {
  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const userId = await supabase.requireSupabaseUserId();
    const { error } = await supabaseClient
      .from('content_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      throw error;
    }
    notifyContentItemsUpdated({ source: 'supabase', type: 'delete' });
    return;
  }

  const current = readLocalContentItems();
  const next = deleteRecordById(current, id, {
    notFoundMessage: 'Content item not found',
  });
  writeLocalContentItems(next);
  notifyContentItemsUpdated({ source: 'local', type: 'delete' });
}
