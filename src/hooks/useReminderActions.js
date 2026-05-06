import { useCallback, useMemo } from 'react';
import {
  deleteReminder,
  toggleReminder,
  updateReminderText,
} from '../lib/remindersRepository';

function isReminderNotFoundError(error) {
  return error instanceof Error && error.message === 'Reminder not found';
}

/**
 * Bundles the toggle / delete / edit reminder action handlers used by Focus
 * Home so the page component does not have to repeat the same shape three
 * times: a presence check against the current reminders array, a try/catch
 * that swallows the "Reminder not found" race and shows a toast for anything
 * else. Each handler keeps the original return semantics so callers (notably
 * RemindersPanel's edit flow) can keep relying on the truthy/falsy result.
 */
export function useReminderActions({ reminders, showToast }) {
  const isReminderKnown = useCallback(
    (id) => reminders.some((item) => item.id === id),
    [reminders],
  );

  const toggle = useCallback(
    (id, isDone) => {
      if (!isReminderKnown(id)) {
        return;
      }

      try {
        toggleReminder(id, isDone);
      } catch (error) {
        if (!isReminderNotFoundError(error)) {
          showToast('Unable to update reminder right now.');
        }
      }
    },
    [isReminderKnown, showToast],
  );

  const remove = useCallback(
    (id) => {
      if (!isReminderKnown(id)) {
        return;
      }

      try {
        deleteReminder(id);
      } catch (error) {
        if (!isReminderNotFoundError(error)) {
          showToast('Unable to delete reminder right now.');
        }
      }
    },
    [isReminderKnown, showToast],
  );

  const edit = useCallback(
    (id, nextText) => {
      if (!isReminderKnown(id)) {
        return false;
      }

      const trimmed = typeof nextText === 'string' ? nextText.trim() : '';
      if (!trimmed) {
        showToast('Reminder text cannot be empty.');
        return false;
      }

      try {
        updateReminderText(id, trimmed);
        return true;
      } catch (error) {
        if (!isReminderNotFoundError(error)) {
          showToast('Unable to update reminder right now.');
        }
        return false;
      }
    },
    [isReminderKnown, showToast],
  );

  return useMemo(
    () => ({
      toggle,
      remove,
      edit,
      isReminderKnown,
    }),
    [toggle, remove, edit, isReminderKnown],
  );
}
