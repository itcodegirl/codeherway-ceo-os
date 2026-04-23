import { buildCreateId, safeLocalStorageSetItem } from './utils';

const STORAGE_KEY = 'ceo-os-reminders';
export const REMINDERS_UPDATED_EVENT = 'ceo-os:reminders-updated';

function normalizeReminder(reminder) {
  return {
    id: String(reminder?.id || buildCreateId()),
    text: typeof reminder?.text === 'string' ? reminder.text.trim() : '',
    isDone: Boolean(reminder?.isDone),
    createdAt: typeof reminder?.createdAt === 'string'
      ? reminder.createdAt
      : new Date().toISOString(),
  };
}

function readStorage() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((reminder) => normalizeReminder(reminder));
  } catch {
    return [];
  }
}

function writeStorage(reminders) {
  const didPersist = safeLocalStorageSetItem(
    STORAGE_KEY,
    JSON.stringify(reminders),
    'Failed to persist reminders to localStorage',
  );
  if (!didPersist) {
    throw new Error('Failed to persist reminders to localStorage');
  }
}

function emitReminderUpdated(detail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(REMINDERS_UPDATED_EVENT, { detail }));
}

export function listReminders() {
  return readStorage()
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function createReminder(payload) {
  const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
  if (!text) {
    throw new Error('Reminder text is required');
  }

  const reminder = normalizeReminder({
    id: buildCreateId(),
    text,
    isDone: false,
    createdAt: new Date().toISOString(),
  });

  const current = readStorage();
  const next = [reminder, ...current];
  writeStorage(next);
  emitReminderUpdated({ type: 'create', id: reminder.id });
  return reminder;
}

export function toggleReminder(id, isDone) {
  const normalizedId = String(id || '');
  const nextState = Boolean(isDone);
  const current = readStorage();
  const next = current.map((reminder) => (
    reminder.id === normalizedId
      ? { ...reminder, isDone: nextState }
      : reminder
  ));
  writeStorage(next);
  emitReminderUpdated({ type: 'toggle', id: normalizedId });
}

export function deleteReminder(id) {
  const normalizedId = String(id || '');
  const current = readStorage();
  const next = current.filter((reminder) => reminder.id !== normalizedId);
  writeStorage(next);
  emitReminderUpdated({ type: 'delete', id: normalizedId });
}
