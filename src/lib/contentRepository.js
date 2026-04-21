import { contentItems as mockContentItems } from '../data/mockData';
import { isSupabaseConfigured, supabaseClient } from './supabase';

const STORAGE_KEY = 'ceo-os-content-items';

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

function buildCreateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return String(Date.now());
}

export function getContentSource() {
  return isSupabaseConfigured ? 'supabase' : 'local';
}

export async function listContentItems() {
  if (isSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('content_items')
      .select('id, title, platform, status');

    if (error) {
      throw error;
    }

    return (data || []).map((item) => normalizeContentItem(item));
  }

  return readLocalContentItems();
}

export async function createContentItem(payload) {
  const normalizedPayload = normalizeContentItem({ id: buildCreateId(), ...payload });

  if (isSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('content_items')
      .insert({
        title: normalizedPayload.title,
        platform: normalizedPayload.platform,
        status: normalizedPayload.status,
      })
      .select('id, title, platform, status')
      .single();

    if (error) {
      throw error;
    }

    return normalizeContentItem(data);
  }

  const current = readLocalContentItems();
  const next = [normalizedPayload, ...current];
  writeLocalContentItems(next);
  return normalizedPayload;
}

export async function updateContentItem(id, payload) {
  const normalizedPayload = normalizeContentItem({ id, ...payload });

  if (isSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('content_items')
      .update({
        title: normalizedPayload.title,
        platform: normalizedPayload.platform,
        status: normalizedPayload.status,
      })
      .eq('id', id)
      .select('id, title, platform, status')
      .single();

    if (error) {
      throw error;
    }

    return normalizeContentItem(data);
  }

  const current = readLocalContentItems();
  const next = current.map((item) => (item.id === String(id) ? normalizedPayload : item));
  writeLocalContentItems(next);
  return normalizedPayload;
}

export async function deleteContentItem(id) {
  if (isSupabaseConfigured && supabaseClient) {
    const { error } = await supabaseClient.from('content_items').delete().eq('id', id);
    if (error) {
      throw error;
    }
    return;
  }

  const current = readLocalContentItems();
  const next = current.filter((item) => item.id !== String(id));
  writeLocalContentItems(next);
}
