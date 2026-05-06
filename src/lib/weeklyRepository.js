import {
  DEFAULT_REVIEW_NOTES,
  defaultBlockers,
  defaultPriorities,
  defaultWins,
} from './weeklyData';
import { buildCreateId, requireLocalStorageSetItem } from './utils';
import { getSupabaseRuntime, isSupabaseRuntimeEnabled } from './supabaseRuntime';
import { assertRecordIsFresh, readUpdatedAtMs } from './staleRecordError';
import { isDemoWorkspaceEnabled } from './workspaceSetup';
import { parseJsonOrPreserveCorruption } from './storageCorruption';

const LOCAL_WEEKLY_BRIEFS_KEY = 'ceo-os-weekly-briefs';
const LEGACY_PRIORITIES_KEY = 'ceo-os-weekly-priorities';
const LEGACY_WINS_KEY = 'ceo-os-weekly-wins';
const LEGACY_BLOCKERS_KEY = 'ceo-os-weekly-blockers';
const LEGACY_REVIEW_NOTES_KEY = 'ceo-os-weekly-review-notes';

export const WEEKLY_BRIEF_UPDATED_EVENT = 'ceo-os:weekly-brief-updated';

const WEEKLY_ITEM_TYPES = {
  priority: 'priority',
  win: 'win',
  blocker: 'blocker',
};
const DEMO_PRIORITY_IDS = new Set(defaultPriorities.map((item) => String(item.id)));
const DEMO_WIN_IDS = new Set(defaultWins.map((item) => String(item.id)));
const DEMO_BLOCKER_IDS = new Set(defaultBlockers.map((item) => String(item.id)));

function isUuid(value) {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function resolveCurrentWeekStart(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const shiftToMonday = (day + 6) % 7;
  next.setDate(next.getDate() - shiftToMonday);
  next.setHours(0, 0, 0, 0);
  return next.toISOString().slice(0, 10);
}

export function getCurrentWeekStart() {
  return resolveCurrentWeekStart();
}

function getFallbackPriorities() {
  if (!isDemoWorkspaceEnabled()) {
    return [];
  }

  return getDemoPriorities();
}

function getDemoPriorities() {
  return defaultPriorities.map((item) => ({
    id: String(item.id || buildCreateId()),
    title: item.title || '',
    owner: item.owner || 'Team Member',
    status: item.status || 'Planned',
  }));
}

function getFallbackWins() {
  if (!isDemoWorkspaceEnabled()) {
    return [];
  }

  return getDemoWins();
}

function getDemoWins() {
  return defaultWins.map((item) => ({
    id: String(item.id || buildCreateId()),
    text: item.text || '',
    category: item.category || 'Execution',
  }));
}

function getFallbackBlockers() {
  if (!isDemoWorkspaceEnabled()) {
    return [];
  }

  return getDemoBlockers();
}

function getDemoBlockers() {
  return defaultBlockers.map((item) => ({
    id: String(item.id || buildCreateId()),
    text: item.text || '',
    severity: item.severity || 'warning',
  }));
}

function normalizePriorityItem(item) {
  return {
    id: String(item?.id || buildCreateId()),
    title: item?.title || '',
    owner: item?.owner || 'Team Member',
    status: item?.status || 'Planned',
    updatedAt: readUpdatedAtMs(item),
  };
}

function normalizeWinItem(item) {
  return {
    id: String(item?.id || buildCreateId()),
    text: item?.text || '',
    category: item?.category || 'Execution',
    updatedAt: readUpdatedAtMs(item),
  };
}

function normalizeBlockerItem(item) {
  return {
    id: String(item?.id || buildCreateId()),
    text: item?.text || '',
    severity: item?.severity || 'warning',
    updatedAt: readUpdatedAtMs(item),
  };
}

function normalizeCollection(type, items) {
  const source = Array.isArray(items) ? items : [];
  if (type === WEEKLY_ITEM_TYPES.priority) {
    return source.map(normalizePriorityItem);
  }

  if (type === WEEKLY_ITEM_TYPES.win) {
    return source.map(normalizeWinItem);
  }

  return source.map(normalizeBlockerItem);
}

function createDefaultWeekPayload() {
  return {
    reviewNotes: DEFAULT_REVIEW_NOTES,
    priorities: getFallbackPriorities(),
    wins: getFallbackWins(),
    blockers: getFallbackBlockers(),
  };
}

function createDemoWeekPayload() {
  return {
    reviewNotes: DEFAULT_REVIEW_NOTES,
    priorities: getDemoPriorities(),
    wins: getDemoWins(),
    blockers: getDemoBlockers(),
  };
}

function getWeeklySource() {
  return isSupabaseRuntimeEnabled ? 'supabase' : 'local';
}

export function resolveWeeklySource() {
  return getWeeklySource();
}

function notifyWeeklyUpdated(detail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(WEEKLY_BRIEF_UPDATED_EVENT, { detail }));
}

export function emitWeeklyBriefUpdated(detail = {}) {
  notifyWeeklyUpdated(detail);
}

function readLegacyWeekPayload() {
  if (typeof window === 'undefined') {
    return createDefaultWeekPayload();
  }

  let priorities = getFallbackPriorities();
  let wins = getFallbackWins();
  let blockers = getFallbackBlockers();
  let reviewNotes = DEFAULT_REVIEW_NOTES;

  try {
    const rawPriorities = window.localStorage.getItem(LEGACY_PRIORITIES_KEY);
    const parsedPriorities = rawPriorities
      ? parseJsonOrPreserveCorruption(LEGACY_PRIORITIES_KEY, rawPriorities, priorities)
      : priorities;
    priorities = normalizeCollection(WEEKLY_ITEM_TYPES.priority, parsedPriorities);
  } catch {
    priorities = getFallbackPriorities();
  }

  try {
    const rawWins = window.localStorage.getItem(LEGACY_WINS_KEY);
    const parsedWins = rawWins
      ? parseJsonOrPreserveCorruption(LEGACY_WINS_KEY, rawWins, wins)
      : wins;
    wins = normalizeCollection(WEEKLY_ITEM_TYPES.win, parsedWins);
  } catch {
    wins = getFallbackWins();
  }

  try {
    const rawBlockers = window.localStorage.getItem(LEGACY_BLOCKERS_KEY);
    const parsedBlockers = rawBlockers
      ? parseJsonOrPreserveCorruption(LEGACY_BLOCKERS_KEY, rawBlockers, blockers)
      : blockers;
    blockers = normalizeCollection(WEEKLY_ITEM_TYPES.blocker, parsedBlockers);
  } catch {
    blockers = getFallbackBlockers();
  }

  try {
    const rawReviewNotes = window.localStorage.getItem(LEGACY_REVIEW_NOTES_KEY);
    reviewNotes = typeof rawReviewNotes === 'string'
      ? rawReviewNotes
      : DEFAULT_REVIEW_NOTES;
  } catch {
    reviewNotes = DEFAULT_REVIEW_NOTES;
  }

  return {
    reviewNotes,
    priorities,
    wins,
    blockers,
  };
}

function readLocalWeekStore() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_WEEKLY_BRIEFS_KEY);
    if (!raw) {
      return {};
    }

    const parsed = parseJsonOrPreserveCorruption(LOCAL_WEEKLY_BRIEFS_KEY, raw, null);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalWeekStore(store) {
  requireLocalStorageSetItem(
    LOCAL_WEEKLY_BRIEFS_KEY,
    JSON.stringify(store),
    'Failed to persist weekly brief data to localStorage',
  );
}

function removeLegacyWeeklyKeys() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(LEGACY_PRIORITIES_KEY);
  window.localStorage.removeItem(LEGACY_WINS_KEY);
  window.localStorage.removeItem(LEGACY_BLOCKERS_KEY);
  window.localStorage.removeItem(LEGACY_REVIEW_NOTES_KEY);
}

function resolveLocalWeekPayload(weekStart) {
  const store = readLocalWeekStore();
  const weekRecord = store[weekStart];

  if (weekRecord && typeof weekRecord === 'object') {
    return {
      reviewNotes: typeof weekRecord.reviewNotes === 'string'
        ? weekRecord.reviewNotes
        : DEFAULT_REVIEW_NOTES,
      priorities: normalizeCollection(WEEKLY_ITEM_TYPES.priority, weekRecord.priorities),
      wins: normalizeCollection(WEEKLY_ITEM_TYPES.win, weekRecord.wins),
      blockers: normalizeCollection(WEEKLY_ITEM_TYPES.blocker, weekRecord.blockers),
    };
  }

  if (weekStart === getCurrentWeekStart()) {
    return readLegacyWeekPayload();
  }

  return {
    reviewNotes: DEFAULT_REVIEW_NOTES,
    priorities: [],
    wins: [],
    blockers: [],
  };
}

function updateLocalWeekPayload(weekStart, updater) {
  const store = readLocalWeekStore();
  const current = resolveLocalWeekPayload(weekStart);
  const next = updater(current);

  store[weekStart] = {
    reviewNotes: typeof next.reviewNotes === 'string' ? next.reviewNotes : DEFAULT_REVIEW_NOTES,
    priorities: normalizeCollection(WEEKLY_ITEM_TYPES.priority, next.priorities),
    wins: normalizeCollection(WEEKLY_ITEM_TYPES.win, next.wins),
    blockers: normalizeCollection(WEEKLY_ITEM_TYPES.blocker, next.blockers),
  };

  writeLocalWeekStore(store);
  return store[weekStart];
}

function mapItemFromSupabaseRow(row) {
  if (row.item_type === WEEKLY_ITEM_TYPES.priority) {
    return normalizePriorityItem({
      id: row.id,
      title: row.title,
      owner: row.owner,
      status: row.status,
    });
  }

  if (row.item_type === WEEKLY_ITEM_TYPES.win) {
    return normalizeWinItem({
      id: row.id,
      text: row.description || row.title,
      category: row.category,
    });
  }

  return normalizeBlockerItem({
    id: row.id,
    text: row.description || row.title,
    severity: row.severity,
  });
}

function mapItemToSupabaseFields(type, item) {
  if (type === WEEKLY_ITEM_TYPES.priority) {
    const normalized = normalizePriorityItem(item);
    return {
      title: normalized.title,
      description: '',
      owner: normalized.owner,
      status: normalized.status,
      category: '',
      severity: '',
    };
  }

  if (type === WEEKLY_ITEM_TYPES.win) {
    const normalized = normalizeWinItem(item);
    return {
      title: '',
      description: normalized.text,
      owner: '',
      status: '',
      category: normalized.category,
      severity: '',
    };
  }

  const normalized = normalizeBlockerItem(item);
  return {
    title: '',
    description: normalized.text,
    owner: '',
    status: '',
    category: '',
    severity: normalized.severity,
  };
}

async function getSupabaseBriefRow({
  supabase,
  supabaseClient,
  weekStart,
  createIfMissing = false,
}) {
  const userId = await supabase.requireSupabaseUserId();
  const { data, error } = await supabaseClient
    .from('weekly_briefs')
    .select('id, week_start, review_notes')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data || !createIfMissing) {
    return { userId, brief: data || null };
  }

  const { data: insertedBrief, error: insertError } = await supabaseClient
    .from('weekly_briefs')
    .insert({
      user_id: userId,
      week_start: weekStart,
      review_notes: DEFAULT_REVIEW_NOTES,
    })
    .select('id, week_start, review_notes')
    .single();

  if (insertError) {
    throw insertError;
  }

  return {
    userId,
    brief: insertedBrief,
  };
}

async function listSupabaseWeeklyItems({
  supabaseClient,
  briefId,
  userId,
}) {
  const { data, error } = await supabaseClient
    .from('weekly_brief_items')
    .select('id, item_type, title, description, owner, status, category, severity, sort_order')
    .eq('brief_id', briefId)
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? data : [];
  const priorities = [];
  const wins = [];
  const blockers = [];

  rows.forEach((row) => {
    const normalized = mapItemFromSupabaseRow(row);
    if (row.item_type === WEEKLY_ITEM_TYPES.priority) {
      priorities.push(normalized);
      return;
    }

    if (row.item_type === WEEKLY_ITEM_TYPES.win) {
      wins.push(normalized);
      return;
    }

    blockers.push(normalized);
  });

  return {
    priorities,
    wins,
    blockers,
  };
}

export async function getWeeklyBriefByWeek(weekStart = getCurrentWeekStart()) {
  const normalizedWeekStart = typeof weekStart === 'string' && weekStart
    ? weekStart
    : getCurrentWeekStart();

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const { userId, brief } = await getSupabaseBriefRow({
      supabase,
      supabaseClient,
      weekStart: normalizedWeekStart,
      createIfMissing: false,
    });

    if (!brief) {
      return {
        weekStart: normalizedWeekStart,
        reviewNotes: DEFAULT_REVIEW_NOTES,
        priorities: [],
        wins: [],
        blockers: [],
        source: 'supabase',
      };
    }

    const collections = await listSupabaseWeeklyItems({
      supabaseClient,
      briefId: brief.id,
      userId,
    });

    return {
      weekStart: normalizedWeekStart,
      reviewNotes: brief.review_notes || DEFAULT_REVIEW_NOTES,
      ...collections,
      source: 'supabase',
    };
  }

  const payload = resolveLocalWeekPayload(normalizedWeekStart);
  return {
    weekStart: normalizedWeekStart,
    reviewNotes: payload.reviewNotes,
    priorities: payload.priorities,
    wins: payload.wins,
    blockers: payload.blockers,
    source: 'local',
  };
}

export async function saveWeeklyBriefReviewNotes({
  weekStart = getCurrentWeekStart(),
  reviewNotes = DEFAULT_REVIEW_NOTES,
  emitEvent = true,
}) {
  const normalizedWeekStart = typeof weekStart === 'string' && weekStart
    ? weekStart
    : getCurrentWeekStart();
  const normalizedReviewNotes = typeof reviewNotes === 'string'
    ? reviewNotes
    : DEFAULT_REVIEW_NOTES;

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const userId = await supabase.requireSupabaseUserId();
    const { error } = await supabaseClient
      .from('weekly_briefs')
      .upsert(
        {
          user_id: userId,
          week_start: normalizedWeekStart,
          review_notes: normalizedReviewNotes,
        },
        { onConflict: 'user_id,week_start' },
      );

    if (error) {
      throw error;
    }

    if (emitEvent) {
      notifyWeeklyUpdated({
        weekStart: normalizedWeekStart,
        source: 'supabase',
        mutation: 'review_notes',
      });
    }
    return normalizedReviewNotes;
  }

  updateLocalWeekPayload(normalizedWeekStart, (current) => ({
    ...current,
    reviewNotes: normalizedReviewNotes,
  }));

  if (emitEvent) {
    notifyWeeklyUpdated({
      weekStart: normalizedWeekStart,
      source: 'local',
      mutation: 'review_notes',
    });
  }
  return normalizedReviewNotes;
}

export async function createWeeklyItem({
  weekStart = getCurrentWeekStart(),
  itemType,
  item,
  sortOrder = 0,
  emitEvent = true,
}) {
  const normalizedWeekStart = typeof weekStart === 'string' && weekStart
    ? weekStart
    : getCurrentWeekStart();
  const normalizedType = itemType === WEEKLY_ITEM_TYPES.win
    ? WEEKLY_ITEM_TYPES.win
    : itemType === WEEKLY_ITEM_TYPES.blocker
      ? WEEKLY_ITEM_TYPES.blocker
      : WEEKLY_ITEM_TYPES.priority;

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const { userId, brief } = await getSupabaseBriefRow({
      supabase,
      supabaseClient,
      weekStart: normalizedWeekStart,
      createIfMissing: true,
    });
    const normalizedItem = normalizedType === WEEKLY_ITEM_TYPES.priority
      ? normalizePriorityItem(item)
      : normalizedType === WEEKLY_ITEM_TYPES.win
        ? normalizeWinItem(item)
        : normalizeBlockerItem(item);

    const { data, error } = await supabaseClient
      .from('weekly_brief_items')
      .insert({
        ...(isUuid(normalizedItem.id) ? { id: normalizedItem.id } : {}),
        brief_id: brief.id,
        user_id: userId,
        item_type: normalizedType,
        sort_order: sortOrder,
        ...mapItemToSupabaseFields(normalizedType, normalizedItem),
      })
      .select('id, item_type, title, description, owner, status, category, severity, sort_order')
      .single();

    if (error) {
      throw error;
    }

    const nextItem = mapItemFromSupabaseRow(data);
    if (emitEvent) {
      notifyWeeklyUpdated({
        weekStart: normalizedWeekStart,
        source: 'supabase',
        mutation: 'create_item',
        itemType: normalizedType,
      });
    }
    return nextItem;
  }

  const itemWithStamp = { ...item, updatedAt: Date.now() };
  const normalizedItem = normalizedType === WEEKLY_ITEM_TYPES.priority
    ? normalizePriorityItem(itemWithStamp)
    : normalizedType === WEEKLY_ITEM_TYPES.win
      ? normalizeWinItem(itemWithStamp)
      : normalizeBlockerItem(itemWithStamp);

  updateLocalWeekPayload(normalizedWeekStart, (current) => {
    const next = {
      ...current,
    };

    if (normalizedType === WEEKLY_ITEM_TYPES.priority) {
      next.priorities = [...current.priorities, normalizedItem];
    } else if (normalizedType === WEEKLY_ITEM_TYPES.win) {
      next.wins = [...current.wins, normalizedItem];
    } else {
      next.blockers = [...current.blockers, normalizedItem];
    }

    return next;
  });

  if (emitEvent) {
    notifyWeeklyUpdated({
      weekStart: normalizedWeekStart,
      source: 'local',
      mutation: 'create_item',
      itemType: normalizedType,
    });
  }
  return normalizedItem;
}

export async function updateWeeklyItem({
  weekStart = getCurrentWeekStart(),
  itemType,
  itemId,
  item,
  sortOrder = 0,
  emitEvent = true,
  expectedUpdatedAt,
}) {
  const normalizedWeekStart = typeof weekStart === 'string' && weekStart
    ? weekStart
    : getCurrentWeekStart();
  const normalizedType = itemType === WEEKLY_ITEM_TYPES.win
    ? WEEKLY_ITEM_TYPES.win
    : itemType === WEEKLY_ITEM_TYPES.blocker
      ? WEEKLY_ITEM_TYPES.blocker
      : WEEKLY_ITEM_TYPES.priority;
  const normalizedItemId = String(itemId || '');

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const userId = await supabase.requireSupabaseUserId();
    const normalizedItem = normalizedType === WEEKLY_ITEM_TYPES.priority
      ? normalizePriorityItem({ ...item, id: normalizedItemId })
      : normalizedType === WEEKLY_ITEM_TYPES.win
        ? normalizeWinItem({ ...item, id: normalizedItemId })
        : normalizeBlockerItem({ ...item, id: normalizedItemId });

    const { data, error } = await supabaseClient
      .from('weekly_brief_items')
      .update({
        sort_order: sortOrder,
        ...mapItemToSupabaseFields(normalizedType, normalizedItem),
      })
      .eq('id', normalizedItemId)
      .eq('user_id', userId)
      .select('id, item_type, title, description, owner, status, category, severity, sort_order')
      .single();

    if (error) {
      throw error;
    }

    const nextItem = mapItemFromSupabaseRow(data);
    if (emitEvent) {
      notifyWeeklyUpdated({
        weekStart: normalizedWeekStart,
        source: 'supabase',
        mutation: 'update_item',
        itemType: normalizedType,
      });
    }
    return nextItem;
  }

  const stamp = Date.now();

  let nextItem = null;
  updateLocalWeekPayload(normalizedWeekStart, (current) => {
    const next = {
      ...current,
    };

    let persisted = null;
    if (normalizedType === WEEKLY_ITEM_TYPES.priority) {
      persisted = current.priorities.find((entry) => String(entry.id) === normalizedItemId) || null;
    } else if (normalizedType === WEEKLY_ITEM_TYPES.win) {
      persisted = current.wins.find((entry) => String(entry.id) === normalizedItemId) || null;
    } else {
      persisted = current.blockers.find((entry) => String(entry.id) === normalizedItemId) || null;
    }

    assertRecordIsFresh(
      persisted,
      expectedUpdatedAt,
      'This weekly item was changed in another window. Reload to see the latest version before saving.',
    );

    const itemWithStamp = { ...item, id: normalizedItemId, updatedAt: stamp };

    if (normalizedType === WEEKLY_ITEM_TYPES.priority) {
      next.priorities = current.priorities.map((currentItem) => {
        if (String(currentItem.id) !== normalizedItemId) {
          return currentItem;
        }
        nextItem = normalizePriorityItem(itemWithStamp);
        return nextItem;
      });
    } else if (normalizedType === WEEKLY_ITEM_TYPES.win) {
      next.wins = current.wins.map((currentItem) => {
        if (String(currentItem.id) !== normalizedItemId) {
          return currentItem;
        }
        nextItem = normalizeWinItem(itemWithStamp);
        return nextItem;
      });
    } else {
      next.blockers = current.blockers.map((currentItem) => {
        if (String(currentItem.id) !== normalizedItemId) {
          return currentItem;
        }
        nextItem = normalizeBlockerItem(itemWithStamp);
        return nextItem;
      });
    }

    if (!nextItem) {
      throw new Error('Weekly item not found');
    }

    return next;
  });

  if (emitEvent) {
    notifyWeeklyUpdated({
      weekStart: normalizedWeekStart,
      source: 'local',
      mutation: 'update_item',
      itemType: normalizedType,
    });
  }
  return nextItem;
}

export async function deleteWeeklyItem({
  weekStart = getCurrentWeekStart(),
  itemType,
  itemId,
  emitEvent = true,
}) {
  const normalizedWeekStart = typeof weekStart === 'string' && weekStart
    ? weekStart
    : getCurrentWeekStart();
  const normalizedType = itemType === WEEKLY_ITEM_TYPES.win
    ? WEEKLY_ITEM_TYPES.win
    : itemType === WEEKLY_ITEM_TYPES.blocker
      ? WEEKLY_ITEM_TYPES.blocker
      : WEEKLY_ITEM_TYPES.priority;
  const normalizedItemId = String(itemId || '');

  const supabase = await getSupabaseRuntime();
  const supabaseClient = supabase ? await supabase.getSupabaseClient() : null;
  if (supabaseClient) {
    const userId = await supabase.requireSupabaseUserId();
    const { error } = await supabaseClient
      .from('weekly_brief_items')
      .delete()
      .eq('id', normalizedItemId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    if (emitEvent) {
      notifyWeeklyUpdated({
        weekStart: normalizedWeekStart,
        source: 'supabase',
        mutation: 'delete_item',
        itemType: normalizedType,
      });
    }
    return;
  }

  let didDelete = false;
  updateLocalWeekPayload(normalizedWeekStart, (current) => {
    const next = {
      ...current,
    };

    if (normalizedType === WEEKLY_ITEM_TYPES.priority) {
      didDelete = current.priorities.some((item) => String(item.id) === normalizedItemId);
      next.priorities = current.priorities.filter((item) => String(item.id) !== normalizedItemId);
    } else if (normalizedType === WEEKLY_ITEM_TYPES.win) {
      didDelete = current.wins.some((item) => String(item.id) === normalizedItemId);
      next.wins = current.wins.filter((item) => String(item.id) !== normalizedItemId);
    } else {
      didDelete = current.blockers.some((item) => String(item.id) === normalizedItemId);
      next.blockers = current.blockers.filter((item) => String(item.id) !== normalizedItemId);
    }

    if (!didDelete) {
      throw new Error('Weekly item not found');
    }

    return next;
  });

  if (emitEvent) {
    notifyWeeklyUpdated({
      weekStart: normalizedWeekStart,
      source: 'local',
      mutation: 'delete_item',
      itemType: normalizedType,
    });
  }
}

export function clearLocalWeeklyDemoData(weekStart = getCurrentWeekStart()) {
  const normalizedWeekStart = typeof weekStart === 'string' && weekStart
    ? weekStart
    : getCurrentWeekStart();
  const store = readLocalWeekStore();
  const current = resolveLocalWeekPayload(normalizedWeekStart);

  store[normalizedWeekStart] = {
    reviewNotes: current.reviewNotes,
    priorities: normalizeCollection(
      WEEKLY_ITEM_TYPES.priority,
      current.priorities.filter((item) => !DEMO_PRIORITY_IDS.has(String(item.id))),
    ),
    wins: normalizeCollection(
      WEEKLY_ITEM_TYPES.win,
      current.wins.filter((item) => !DEMO_WIN_IDS.has(String(item.id))),
    ),
    blockers: normalizeCollection(
      WEEKLY_ITEM_TYPES.blocker,
      current.blockers.filter((item) => !DEMO_BLOCKER_IDS.has(String(item.id))),
    ),
  };

  writeLocalWeekStore(store);
  removeLegacyWeeklyKeys();
  notifyWeeklyUpdated({
    weekStart: normalizedWeekStart,
    source: 'local',
    mutation: 'clear_demo',
  });
  return store[normalizedWeekStart];
}

export function resetLocalWeeklyDemoData(weekStart = getCurrentWeekStart()) {
  const normalizedWeekStart = typeof weekStart === 'string' && weekStart
    ? weekStart
    : getCurrentWeekStart();
  const store = readLocalWeekStore();
  store[normalizedWeekStart] = createDemoWeekPayload();

  writeLocalWeekStore(store);
  removeLegacyWeeklyKeys();
  notifyWeeklyUpdated({
    weekStart: normalizedWeekStart,
    source: 'local',
    mutation: 'load_demo',
  });
  return store[normalizedWeekStart];
}
