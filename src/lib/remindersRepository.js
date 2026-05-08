import { buildCreateId } from './utils';
import { STORAGE_DOMAINS } from './dataSchema';
import { readVersionedLocalStorage, writeVersionedLocalStorage } from './versionedStorage';

export const REMINDERS_UPDATED_EVENT = 'ceo-os:reminders-updated';

function normalizeReminder(reminder) {
  const completedAt = typeof reminder?.completedAt === 'string'
    ? reminder.completedAt
    : '';

  // `snoozedUntil` is optional. When set, it carries an ISO timestamp the
  // reminder should re-surface at; the UI hides snoozed reminders whose
  // deadline is still in the future. Completed reminders never carry a
  // snooze marker — completion supersedes it.
  const snoozedUntil = !reminder?.isDone && typeof reminder?.snoozedUntil === 'string'
    ? reminder.snoozedUntil
    : '';

  return {
    id: String(reminder?.id || buildCreateId()),
    text: typeof reminder?.text === 'string' ? reminder.text.trim() : '',
    isDone: Boolean(reminder?.isDone),
    completedAt: reminder?.isDone ? completedAt : '',
    createdAt: typeof reminder?.createdAt === 'string'
      ? reminder.createdAt
      : new Date().toISOString(),
    snoozedUntil,
  };
}

/**
 * Returns an ISO timestamp for tomorrow at 6 AM local. Used as the default
 * snooze target so a single button reliably parks something off today's
 * surface without forcing a date picker decision.
 */
export function buildTomorrowSnoozeDeadline(now = new Date()) {
  const target = new Date(now.getTime());
  target.setDate(target.getDate() + 1);
  target.setHours(6, 0, 0, 0);
  return target.toISOString();
}

export function isReminderSnoozed(reminder, now = new Date()) {
  if (!reminder || !reminder.snoozedUntil || reminder.isDone) {
    return false;
  }
  const wakeAt = new Date(reminder.snoozedUntil).getTime();
  if (!Number.isFinite(wakeAt)) {
    return false;
  }
  return wakeAt > now.getTime();
}

function readStorage() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed = readVersionedLocalStorage(STORAGE_DOMAINS.reminders, []);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((reminder) => normalizeReminder(reminder));
  } catch {
    return [];
  }
}

function writeStorage(reminders) {
  writeVersionedLocalStorage(
    STORAGE_DOMAINS.reminders,
    reminders,
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

export function updateReminderText(id, text) {
  const normalizedId = String(id || '');
  if (!normalizedId) {
    throw new Error('Reminder id is required');
  }
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) {
    throw new Error('Reminder text is required');
  }

  const current = readStorage();
  let updatedReminder = null;
  const next = current.map((reminder) => {
    if (reminder.id !== normalizedId) {
      return reminder;
    }
    updatedReminder = { ...reminder, text: trimmed };
    return updatedReminder;
  });
  if (!updatedReminder) {
    throw new Error('Reminder not found');
  }

  writeStorage(next);
  emitReminderUpdated({ type: 'update', id: normalizedId });
  return updatedReminder;
}

export function snoozeReminderUntil(id, untilIso) {
  const normalizedId = String(id || '');
  if (!normalizedId) {
    throw new Error('Reminder id is required');
  }

  const wakeAt = new Date(untilIso).getTime();
  if (!Number.isFinite(wakeAt)) {
    throw new Error('Snooze deadline must be a valid ISO timestamp');
  }
  if (wakeAt <= Date.now()) {
    throw new Error('Snooze deadline must be in the future');
  }

  const current = readStorage();
  let updatedReminder = null;
  const next = current.map((reminder) => {
    if (reminder.id !== normalizedId) {
      return reminder;
    }
    if (reminder.isDone) {
      // Completed reminders cannot be snoozed; the action is a no-op.
      updatedReminder = reminder;
      return reminder;
    }
    updatedReminder = { ...reminder, snoozedUntil: new Date(wakeAt).toISOString() };
    return updatedReminder;
  });
  if (!updatedReminder) {
    throw new Error('Reminder not found');
  }

  writeStorage(next);
  emitReminderUpdated({ type: 'snooze', id: normalizedId });
  return updatedReminder;
}

export function wakeReminder(id) {
  const normalizedId = String(id || '');
  if (!normalizedId) {
    throw new Error('Reminder id is required');
  }

  const current = readStorage();
  let updatedReminder = null;
  const next = current.map((reminder) => {
    if (reminder.id !== normalizedId) {
      return reminder;
    }
    updatedReminder = { ...reminder, snoozedUntil: '' };
    return updatedReminder;
  });
  if (!updatedReminder) {
    throw new Error('Reminder not found');
  }

  writeStorage(next);
  emitReminderUpdated({ type: 'wake', id: normalizedId });
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
