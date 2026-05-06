import { formatIsoDate, requireLocalStorageSetItem } from './utils';
import { parseJsonOrPreserveCorruption } from './storageCorruption';

const STORAGE_KEY = 'ceo-os-journal-entries';
export const JOURNAL_ENTRIES_UPDATED_EVENT = 'ceo-os:journal-entries-updated';

export const JOURNAL_PROMPTS = [
  {
    id: 'onMyMind',
    label: 'What is on my mind?',
  },
  {
    id: 'feelsHeavy',
    label: 'What feels heavy?',
  },
  {
    id: 'oneNextThing',
    label: 'What is one thing I can do next?',
  },
  {
    id: 'todaySuccess',
    label: 'What would make today feel successful?',
  },
];

function resolveText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value;
}

function resolveDateKey(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return formatIsoDate(new Date());
  }

  return value;
}

function normalizeJournalEntry(entry = {}) {
  return {
    onMyMind: resolveText(entry.onMyMind),
    feelsHeavy: resolveText(entry.feelsHeavy),
    oneNextThing: resolveText(entry.oneNextThing),
    todaySuccess: resolveText(entry.todaySuccess),
    updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : new Date().toISOString(),
  };
}

function readStore() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = parseJsonOrPreserveCorruption(STORAGE_KEY, raw, null);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  requireLocalStorageSetItem(
    STORAGE_KEY,
    JSON.stringify(store),
    'Failed to persist journal entries to localStorage',
  );
}

function emitJournalEntriesUpdated(detail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(JOURNAL_ENTRIES_UPDATED_EVENT, { detail }),
  );
}

export function getTodayJournalDateKey() {
  return formatIsoDate(new Date());
}

export function listJournalEntries() {
  const store = readStore();
  return Object.entries(store)
    .map(([dateKey, entry]) => ({
      dateKey,
      ...normalizeJournalEntry(entry),
    }))
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
}

export function getJournalEntryByDate(dateKey = getTodayJournalDateKey()) {
  const normalizedDate = resolveDateKey(dateKey);
  const store = readStore();
  return normalizeJournalEntry(store[normalizedDate]);
}

export function saveJournalEntry({
  dateKey = getTodayJournalDateKey(),
  entry,
}) {
  const normalizedDate = resolveDateKey(dateKey);
  const store = readStore();
  const normalizedEntry = normalizeJournalEntry({
    ...store[normalizedDate],
    ...entry,
    updatedAt: new Date().toISOString(),
  });

  store[normalizedDate] = normalizedEntry;
  writeStore(store);
  emitJournalEntriesUpdated({
    dateKey: normalizedDate,
    type: 'save',
  });

  return normalizedEntry;
}
