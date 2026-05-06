import { contentItems as mockContentItems } from '../data/mockData';
import { deleteRecordById, replaceRecordById } from './stateUtils';
import { buildCreateId, requireLocalStorageSetItem, safeLocalStorageSetItem } from './utils';
import { getSupabaseRuntime, isSupabaseRuntimeEnabled } from './supabaseRuntime';
import { StaleRecordError, assertRecordIsFresh, readUpdatedAtMs } from './staleRecordError';
import { tryRemoteOrEnqueue } from './offlineWriteQueueIntegration';
import { isDemoWorkspaceEnabled } from './workspaceSetup';
import { parseJsonOrPreserveCorruption } from './storageCorruption';

export const CONTENT_QUEUE_KIND_CREATE = 'content:create';
export const CONTENT_QUEUE_KIND_UPDATE = 'content:update';
export const CONTENT_QUEUE_KIND_DELETE = 'content:delete';

function expectedUpdatedAtToIso(expectedUpdatedAt) {
  const expected = Number(expectedUpdatedAt);
  if (!Number.isFinite(expected) || expected <= 0) {
    return null;
  }
  return new Date(expected).toISOString();
}

const STORAGE_KEY = 'ceo-os-content-items';
export const CONTENT_ITEMS_UPDATED_EVENT = 'ceo-os:content-items-updated';
const DEMO_CONTENT_ITEM_IDS = new Set(mockContentItems.map((item) => String(item.id)));

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
  if (!isDemoWorkspaceEnabled()) {
    return [];
  }

  return getDemoLocalItems();
}

function getDemoLocalItems() {
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

    const parsed = parseJsonOrPreserveCorruption(STORAGE_KEY, raw, null);
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

export async function createContentItem(payload, options = {}) {
  const normalizedPayload = normalizeContentItem({
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
    };

    return tryRemoteOrEnqueue(
      { kind: CONTENT_QUEUE_KIND_CREATE, payload, options },
      attempt,
    );
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
    const attempt = async () => {
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
    };

    return tryRemoteOrEnqueue(
      {
        kind: CONTENT_QUEUE_KIND_UPDATE,
        payload: { id, payload, expectedUpdatedAt: options.expectedUpdatedAt },
        options,
      },
      attempt,
    );
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

export async function deleteContentItem(id, options = {}) {
  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const attempt = async () => {
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
    };

    await tryRemoteOrEnqueue(
      { kind: CONTENT_QUEUE_KIND_DELETE, payload: { id }, options },
      attempt,
    );
    return;
  }

  const current = readLocalContentItems();
  const next = deleteRecordById(current, id, {
    notFoundMessage: 'Content item not found',
  });
  writeLocalContentItems(next);
  notifyContentItemsUpdated({ source: 'local', type: 'delete' });
}

export function clearLocalContentDemoData() {
  const current = readLocalContentItems();
  const next = current.filter((item) => !DEMO_CONTENT_ITEM_IDS.has(String(item.id)));
  writeLocalContentItems(next);
  notifyContentItemsUpdated({ source: 'local', type: 'clear_demo' });
  return next;
}

export function resetLocalContentDemoData() {
  const seeded = getDemoLocalItems();
  writeLocalContentItems(seeded);
  notifyContentItemsUpdated({ source: 'local', type: 'load_demo' });
  return seeded;
}
