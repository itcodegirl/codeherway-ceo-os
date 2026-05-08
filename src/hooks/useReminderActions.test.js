import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  toggleReminder: vi.fn(),
  deleteReminder: vi.fn(),
  updateReminderText: vi.fn(),
  snoozeReminderUntil: vi.fn(),
  wakeReminder: vi.fn(),
  buildTomorrowSnoozeDeadline: vi.fn(() => '2099-01-01T06:00:00.000Z'),
}));

vi.mock('../lib/remindersRepository', () => ({
  toggleReminder: repositoryMocks.toggleReminder,
  deleteReminder: repositoryMocks.deleteReminder,
  updateReminderText: repositoryMocks.updateReminderText,
  snoozeReminderUntil: repositoryMocks.snoozeReminderUntil,
  wakeReminder: repositoryMocks.wakeReminder,
  buildTomorrowSnoozeDeadline: repositoryMocks.buildTomorrowSnoozeDeadline,
}));

import { useReminderActions } from './useReminderActions';

const sampleReminders = [
  { id: 'r-1', text: 'Send recap email', isDone: false },
  { id: 'r-2', text: 'Confirm dinner reservation', isDone: true },
];

function notFoundError() {
  return new Error('Reminder not found');
}

describe('useReminderActions', () => {
  let showToast;

  beforeEach(() => {
    vi.clearAllMocks();
    showToast = vi.fn();
  });

  it('skips work when the reminder id is not in the list', () => {
    const { result } = renderHook(() =>
      useReminderActions({ reminders: sampleReminders, showToast }),
    );

    result.current.toggle('missing', true);
    result.current.remove('missing');
    expect(result.current.edit('missing', 'still here')).toBe(false);

    expect(repositoryMocks.toggleReminder).not.toHaveBeenCalled();
    expect(repositoryMocks.deleteReminder).not.toHaveBeenCalled();
    expect(repositoryMocks.updateReminderText).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('toggles a known reminder and surfaces unexpected failures', () => {
    repositoryMocks.toggleReminder
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw notFoundError();
      })
      .mockImplementationOnce(() => {
        throw new Error('storage offline');
      });

    const { result } = renderHook(() =>
      useReminderActions({ reminders: sampleReminders, showToast }),
    );

    result.current.toggle('r-1', true);
    result.current.toggle('r-1', false);
    result.current.toggle('r-1', true);

    expect(repositoryMocks.toggleReminder).toHaveBeenCalledTimes(3);
    expect(showToast).toHaveBeenCalledExactlyOnceWith(
      'Unable to update reminder right now.',
    );
  });

  it('deletes a known reminder and surfaces unexpected failures', () => {
    repositoryMocks.deleteReminder
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw notFoundError();
      })
      .mockImplementationOnce(() => {
        throw new Error('storage offline');
      });

    const { result } = renderHook(() =>
      useReminderActions({ reminders: sampleReminders, showToast }),
    );

    result.current.remove('r-1');
    result.current.remove('r-1');
    result.current.remove('r-1');

    expect(repositoryMocks.deleteReminder).toHaveBeenCalledTimes(3);
    expect(showToast).toHaveBeenCalledExactlyOnceWith(
      'Unable to delete reminder right now.',
    );
  });

  it('rejects empty edits, returns true on success, and surfaces real failures', () => {
    repositoryMocks.updateReminderText
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw notFoundError();
      })
      .mockImplementationOnce(() => {
        throw new Error('storage offline');
      });

    const { result } = renderHook(() =>
      useReminderActions({ reminders: sampleReminders, showToast }),
    );

    expect(result.current.edit('r-1', '   ')).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith('Reminder text cannot be empty.');

    expect(result.current.edit('r-1', '  Send recap email today  ')).toBe(true);
    expect(repositoryMocks.updateReminderText).toHaveBeenLastCalledWith(
      'r-1',
      'Send recap email today',
    );

    expect(result.current.edit('r-1', 'fresh text')).toBe(false);
    expect(result.current.edit('r-1', 'fresh text')).toBe(false);

    expect(showToast).toHaveBeenLastCalledWith('Unable to update reminder right now.');
    expect(showToast).toHaveBeenCalledTimes(2);
  });

  it('snoozes a known reminder until tomorrow without surfacing not-found races', () => {
    const { result } = renderHook(() =>
      useReminderActions({ reminders: sampleReminders, showToast }),
    );

    result.current.snooze('r-1');

    expect(repositoryMocks.snoozeReminderUntil).toHaveBeenCalledWith(
      'r-1',
      '2099-01-01T06:00:00.000Z',
    );
    expect(showToast).not.toHaveBeenCalled();
  });

  it('skips snooze for reminders that are not in the list', () => {
    const { result } = renderHook(() =>
      useReminderActions({ reminders: sampleReminders, showToast }),
    );

    result.current.snooze('missing');

    expect(repositoryMocks.snoozeReminderUntil).not.toHaveBeenCalled();
  });

  it('toasts when snooze fails for a non-race reason', () => {
    repositoryMocks.snoozeReminderUntil.mockImplementationOnce(() => {
      throw new Error('storage offline');
    });

    const { result } = renderHook(() =>
      useReminderActions({ reminders: sampleReminders, showToast }),
    );

    result.current.snooze('r-1');
    expect(showToast).toHaveBeenCalledWith('Unable to snooze reminder right now.');
  });

  it('wakes a snoozed reminder back into the active list', () => {
    const { result } = renderHook(() =>
      useReminderActions({ reminders: sampleReminders, showToast }),
    );

    result.current.wake('r-1');
    expect(repositoryMocks.wakeReminder).toHaveBeenCalledWith('r-1');
    expect(showToast).not.toHaveBeenCalled();
  });

  it('swallows the not-found race during wake', () => {
    repositoryMocks.wakeReminder.mockImplementationOnce(() => {
      throw notFoundError();
    });

    const { result } = renderHook(() =>
      useReminderActions({ reminders: sampleReminders, showToast }),
    );

    result.current.wake('r-1');
    expect(showToast).not.toHaveBeenCalled();
  });
});
