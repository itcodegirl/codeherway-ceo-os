import { getSupabaseRuntime, isSupabaseRuntimeEnabled } from './supabaseRuntime';

const TELEMETRY_STORAGE_KEY = 'ceo-os-chief-telemetry-events';
const MAX_LOCAL_EVENTS = 400;
const DEFAULT_LIMIT = 100;

export const CHIEF_TELEMETRY_UPDATED_EVENT = 'ceo-os:chief-telemetry-updated';

function isTelemetryAuthRequiredError(error) {
  return error?.code === 'SUPABASE_AUTH_REQUIRED';
}

function createEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `chief-telemetry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeEventTimestamp(value) {
  if (typeof value !== 'string') {
    return new Date().toISOString();
  }

  const nextDate = new Date(value);
  if (Number.isNaN(nextDate.getTime())) {
    return new Date().toISOString();
  }

  return nextDate.toISOString();
}

function normalizeEventValue(input) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const eventName = typeof input.event === 'string' ? input.event.trim() : '';
  if (!eventName) {
    return null;
  }

  const normalized = {
    id: typeof input.id === 'string' && input.id.trim() ? input.id.trim() : createEventId(),
    event: eventName,
    timestamp: normalizeEventTimestamp(input.timestamp),
  };

  const allowedKeys = [
    'actionKey',
    'section',
    'source',
    'reason',
    'notesLength',
    'requestId',
    'correlationId',
    'saved',
    'skipped',
    'failed',
    'structuredCounts',
  ];

  allowedKeys.forEach((key) => {
    if (input[key] !== undefined) {
      normalized[key] = input[key];
    }
  });

  return normalized;
}

function readLocalEvents() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => normalizeEventValue(entry))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writeLocalEvents(events) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = Array.isArray(events) ? events : [];
  window.localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(normalized));
}

function emitTelemetryUpdated(detail) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CHIEF_TELEMETRY_UPDATED_EVENT, {
      detail: detail && typeof detail === 'object' ? detail : {},
    }),
  );
}

function sortByTimestampDesc(left, right) {
  const leftTime = new Date(left.timestamp).getTime();
  const rightTime = new Date(right.timestamp).getTime();
  return rightTime - leftTime;
}

function limitEvents(events, limit = DEFAULT_LIMIT) {
  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DEFAULT_LIMIT;
  return events.slice(0, normalizedLimit);
}

function mapSupabaseRowToTelemetryEvent(row) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  return normalizeEventValue({
    id: row.id,
    event: row.event_name || row.event,
    timestamp: row.created_at || row.timestamp,
    ...(row.payload && typeof row.payload === 'object' ? row.payload : {}),
  });
}

export function getChiefTelemetrySource() {
  return isSupabaseRuntimeEnabled ? 'supabase' : 'local';
}

export async function listChiefTelemetryEvents({ limit = DEFAULT_LIMIT } = {}) {
  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    try {
      const userId = await supabase.requireSupabaseUserId();
      const { data, error } = await supabaseClient
        .from('chief_telemetry_events')
        .select('id,event_name,payload,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      const events = Array.isArray(data)
        ? data.map((row) => mapSupabaseRowToTelemetryEvent(row)).filter(Boolean)
        : [];

      return {
        source: 'supabase',
        events: limitEvents(events, limit),
      };
    } catch (error) {
      if (!isTelemetryAuthRequiredError(error) && import.meta.env.DEV) {
        console.error('Unable to load chief telemetry from Supabase, falling back to local.', error);
      }
    }
  }

  const localEvents = readLocalEvents().sort(sortByTimestampDesc);
  return {
    source: 'local',
    events: limitEvents(localEvents, limit),
  };
}

export async function recordChiefTelemetryEvent(eventInput) {
  const normalizedEvent = normalizeEventValue(eventInput);
  if (!normalizedEvent) {
    return null;
  }

  const localEvents = readLocalEvents();
  const nextLocalEvents = [normalizedEvent, ...localEvents]
    .sort(sortByTimestampDesc)
    .slice(0, MAX_LOCAL_EVENTS);

  writeLocalEvents(nextLocalEvents);
  emitTelemetryUpdated({
    source: 'local',
    event: normalizedEvent,
  });

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    try {
      const userId = await supabase.requireSupabaseUserId();
      const payload = { ...normalizedEvent };
      delete payload.id;
      delete payload.event;
      delete payload.timestamp;

      await supabaseClient.from('chief_telemetry_events').insert({
        user_id: userId,
        event_name: normalizedEvent.event,
        payload,
        created_at: normalizedEvent.timestamp,
      });

      emitTelemetryUpdated({
        source: 'supabase',
        event: normalizedEvent,
      });
    } catch (error) {
      if (!isTelemetryAuthRequiredError(error) && import.meta.env.DEV) {
        console.error('Unable to persist chief telemetry to Supabase.', error);
      }
    }
  }

  return normalizedEvent;
}
