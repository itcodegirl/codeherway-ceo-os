import { opportunities as mockOpportunities } from '../data/mockData';
import { isSupabaseConfigured, supabaseClient } from './supabase';

const STORAGE_KEY = 'ceo-os-opportunities';

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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
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

function formatForSupabase(payload) {
  return {
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
  return isSupabaseConfigured ? 'supabase' : 'local';
}

export async function listOpportunities() {
  if (isSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('opportunities')
      .select('id, name, company, priority, stage, next_step');

    if (error) {
      throw error;
    }

    return mapSupabaseRows(data || []);
  }

  return readLocalOpportunities();
}

export async function createOpportunity(payload) {
  const normalizedPayload = normalizeOpportunity({ id: buildCreateId(), ...payload });

  if (isSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('opportunities')
      .insert(formatForSupabase(normalizedPayload))
      .select('id, name, company, priority, stage, next_step')
      .single();

    if (error) {
      throw error;
    }

    return normalizeOpportunity(data);
  }

  const current = readLocalOpportunities();
  const next = [normalizedPayload, ...current];
  writeLocalOpportunities(next);
  return normalizedPayload;
}

export async function updateOpportunity(id, payload) {
  const normalizedPayload = normalizeOpportunity({ id, ...payload });

  if (isSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('opportunities')
      .update(formatForSupabase(normalizedPayload))
      .eq('id', id)
      .select('id, name, company, priority, stage, next_step')
      .single();

    if (error) {
      throw error;
    }

    return normalizeOpportunity(data);
  }

  const current = readLocalOpportunities();
  const next = current.map((item) => (item.id === String(id) ? normalizedPayload : item));
  writeLocalOpportunities(next);
  return normalizedPayload;
}

export async function deleteOpportunity(id) {
  if (isSupabaseConfigured && supabaseClient) {
    const { error } = await supabaseClient.from('opportunities').delete().eq('id', id);
    if (error) {
      throw error;
    }
    return;
  }

  const current = readLocalOpportunities();
  const next = current.filter((item) => item.id !== String(id));
  writeLocalOpportunities(next);
}
