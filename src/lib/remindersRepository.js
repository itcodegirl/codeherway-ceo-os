import { buildCreateId, requireLocalStorageSetItem } from './utils';

const STORAGE_KEY = 'ceo-os-reminders';
export const REMINDERS_UPDATED_EVENT = 'ceo-os:reminders-updated';

function normalizeReminder(reminder) {
  const completedAt = typeof reminder?.completedAt === 'string'
    ? reminder.completedAt
    : '';

  return {
    id: String(reminder?.id || buildCreateId()),
    text: typeof reminder?.text === 'string' ? reminder.text.trim() : '',
    isDone: Boolean(reminder?.isDone),
    completedAt: reminder?.isDone ? completedAt : '',
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
  requireLocalStorageSetItem(
    STORAGE_KEY,
    JSON.stringify(reminders),
    'Failed to persist reminders to localStorage',
  );
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

export function getReminderProgress(reminders = readStorage()) {
  const safeReminders = Array.isArray(reminders) ? reminders.map(normalizeReminder) : [];
  const total = safeReminders.length;
  const completed = safeReminders.filter((reminder) => reminder.isDone).length;
  const pending = Math.max(0, total - completed);

  return {
    total,
    completed,
    pending,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
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
  if (!normalizedId) {
    throw new Error('Reminder id is required');
  }

  const nextState = Boolean(isDone);
  const current = readStorage();
  let updatedReminder = null;
  const next = current.map((reminder) => (
    reminder.id === normalizedId
      ? (() => {
        updatedReminder = {
          ...reminder,
          isDone: nextState,
          completedAt: nextState ? new Date().toISOString() : '',
        };
        return updatedReminder;
      })()
      : reminder
  ));
  if (!updatedReminder) {
    throw new Error('Reminder not found');
  }

  writeStorage(next);
  emitReminderUpdated({ type: 'toggle', id: normalizedId, isDone: nextState });
  return updatedReminder;
}

export function deleteReminder(id) {
  const normalizedId = String(id || '');
  if (!normalizedId) {
    throw new Error('Reminder id is required');
  }

  const current = readStorage();
  if (!current.some((reminder) => reminder.id === normalizedId)) {
    throw new Error('Reminder not found');
  }

  const next = current.filter((reminder) => reminder.id !== normalizedId);
  writeStorage(next);
  emitReminderUpdated({ type: 'delete', id: normalizedId });
}
