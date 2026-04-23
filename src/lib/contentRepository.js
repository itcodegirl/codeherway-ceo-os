import { contentItems as mockContentItems } from '../data/mockData';
import { buildCreateId } from './utils';

const STORAGE_KEY = 'ceo-os-content-items';
export const CONTENT_ITEMS_UPDATED_EVENT = 'ceo-os:content-items-updated';

const hasSupabaseConfig = Boolean(
  import.meta.env.VITE_SUPABASE_URL
  && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

async function getSupabaseRuntime() {
  if (!hasSupabaseConfig) {
    return null;
  }

  const { getSupabaseAdapter } = await import('./supabaseAdapter');
  return getSupabaseAdapter();
}

function normalizeContentItem(item) {
  return {
    id: String(item.id),
    title: item.title || '',
    platform: item.platform || '',
    status: item.status || 'Drafting',
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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
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
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function notifyContentItemsUpdated(detail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(CONTENT_ITEMS_UPDATED_EVENT, { detail }));
}

export function getContentSource() {
  return hasSupabaseConfig ? 'supabase' : 'local';
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
  const normalizedPayload = normalizeContentItem({ id: buildCreateId(), ...payload });

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

export async function updateContentItem(id, payload) {
  const normalizedPayload = normalizeContentItem({ id, ...payload });

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const userId = await supabase.requireSupabaseUserId();
    const { data, error } = await supabaseClient
      .from('content_items')
      .update({
        title: normalizedPayload.title,
        platform: normalizedPayload.platform,
        status: normalizedPayload.status,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, title, platform, status')
      .single();

    if (error) {
      throw error;
    }

    notifyContentItemsUpdated({ source: 'supabase', type: 'update' });
    return normalizeContentItem(data);
  }

  const current = readLocalContentItems();
  const next = current.map((item) => (item.id === String(id) ? normalizedPayload : item));
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
  const next = current.filter((item) => item.id !== String(id));
  writeLocalContentItems(next);
  notifyContentItemsUpdated({ source: 'local', type: 'delete' });
}
