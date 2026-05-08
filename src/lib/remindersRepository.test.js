import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildTomorrowSnoozeDeadline,
  createReminder,
  deleteReminder,
  getReminderProgress,
  isReminderSnoozed,
  listReminders,
  snoozeReminderUntil,
  toggleReminder,
  updateReminderText,
  wakeReminder,
} from './remindersRepository';
import {
  CURRENT_DATA_SCHEMA_VERSION,
  STORAGE_DOMAINS,
  createVersionedStorageEnvelope,
} from './dataSchema';

describe('src/lib/remindersRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('creates and lists reminders', () => {
    createReminder({ text: 'Send follow-up to Acme' });
    const reminders = listReminders();

    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({
      text: 'Send follow-up to Acme',
      isDone: false,
    });
  });

  it('persists reminders in a versioned schema envelope', () => {
    const created = createReminder({ text: 'Protect reminder storage' });

    const raw = JSON.parse(window.localStorage.getItem('ceo-os-reminders'));
    expect(raw).toMatchObject({
      schemaVersion: CURRENT_DATA_SCHEMA_VERSION,
      domain: STORAGE_DOMAINS.reminders,
      model: 'Reminder[]',
    });
    expect(raw.data).toEqual([
      expect.objectContaining({ id: created.id, text: 'Protect reminder storage' }),
    ]);
  });

  it('continues reading legacy raw reminder arrays', () => {
    window.localStorage.setItem('ceo-os-reminders', JSON.stringify([
      {
        id: 'legacy-reminder',
        text: 'Legacy reminder',
        isDone: false,
        createdAt: '2026-04-23T12:00:00.000Z',
      },
    ]));

    expect(listReminders()).toEqual([
      expect.objectContaining({ id: 'legacy-reminder', text: 'Legacy reminder' }),
    ]);
  });

  it('reads reminders from the current schema envelope', () => {
    window.localStorage.setItem(
      'ceo-os-reminders',
      JSON.stringify(createVersionedStorageEnvelope(STORAGE_DOMAINS.reminders, [
        {
          id: 'versioned-reminder',
          text: 'Versioned reminder',
          isDone: false,
          createdAt: '2026-04-23T12:00:00.000Z',
        },
      ])),
    );

    expect(listReminders()).toEqual([
      expect.objectContaining({ id: 'versioned-reminder', text: 'Versioned reminder' }),
    ]);
  });

  it('toggles reminder completion state', () => {
    const created = createReminder({ text: 'Finalize sponsor note' });
    const completed = toggleReminder(created.id, true);

    const reminders = listReminders();
    expect(completed).toMatchObject({
      id: created.id,
      isDone: true,
    });
    expect(reminders[0].isDone).toBe(true);
    expect(reminders[0].completedAt).toBeTruthy();

    toggleReminder(created.id, false);

    expect(listReminders()[0]).toMatchObject({
      isDone: false,
      completedAt: '',
    });
  });

  it('deletes reminders', () => {
    const created = createReminder({ text: 'Clean backlog' });
    deleteReminder(created.id);

    expect(listReminders()).toHaveLength(0);
  });

  it('rejects stale reminder updates without emitting fake progress events', () => {
    const listener = vi.fn();
    window.addEventListener('ceo-os:reminders-updated', listener);

    expect(() => toggleReminder('missing-reminder', true)).toThrow('Reminder not found');
    expect(() => deleteReminder('missing-reminder')).toThrow('Reminder not found');

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('ceo-os:reminders-updated', listener);
  });

  it('summarizes reminder progress for execution feedback', () => {
    const first = createReminder({ text: 'Send recap' });
    createReminder({ text: 'Review pipeline' });
    toggleReminder(first.id, true);

    expect(getReminderProgress()).toEqual({
      total: 2,
      completed: 1,
      pending: 1,
      completionRate: 50,
    });
  });

  it('renames a reminder in place via updateReminderText', () => {
    const reminder = createReminder({ text: 'Email Sarah' });
    const updated = updateReminderText(reminder.id, '   Send Sarah a Slack message   ');
    expect(updated.text).toBe('Send Sarah a Slack message');

    const persisted = listReminders();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].text).toBe('Send Sarah a Slack message');
  });

  it('rejects empty rename text', () => {
    const reminder = createReminder({ text: 'Email Sarah' });
    expect(() => updateReminderText(reminder.id, '   ')).toThrow('Reminder text is required');
    expect(listReminders()[0].text).toBe('Email Sarah');
  });

  it('rejects renames for missing reminders', () => {
    expect(() => updateReminderText('missing-id', 'anything')).toThrow('Reminder not found');
  });

  describe('snooze', () => {
    it('builds a tomorrow-morning deadline ahead of now', () => {
      const now = new Date('2026-05-08T15:00:00.000Z');
      const iso = buildTomorrowSnoozeDeadline(now);
      expect(new Date(iso).getTime()).toBeGreaterThan(now.getTime());
    });

    it('parks an active reminder behind a future snooze deadline', () => {
      const reminder = createReminder({ text: 'Polish weekly recap' });
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const snoozed = snoozeReminderUntil(reminder.id, future);

      expect(snoozed.snoozedUntil).toBe(future);
      expect(isReminderSnoozed(snoozed)).toBe(true);
      const persisted = listReminders().find((row) => row.id === reminder.id);
      expect(persisted.snoozedUntil).toBe(future);
    });

    it('clears the snooze when the reminder is woken', () => {
      const reminder = createReminder({ text: 'Polish weekly recap' });
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      snoozeReminderUntil(reminder.id, future);

      const woken = wakeReminder(reminder.id);

      expect(woken.snoozedUntil).toBe('');
      expect(isReminderSnoozed(woken)).toBe(false);
    });

    it('refuses past or invalid snooze deadlines', () => {
      const reminder = createReminder({ text: 'Polish weekly recap' });
      const past = new Date(Date.now() - 60 * 1000).toISOString();
      expect(() => snoozeReminderUntil(reminder.id, past)).toThrow(/in the future/);
      expect(() => snoozeReminderUntil(reminder.id, 'not-an-iso')).toThrow(/valid ISO/);
    });

    it('skips snoozing completed reminders without throwing', () => {
      const reminder = createReminder({ text: 'Polish weekly recap' });
      toggleReminder(reminder.id, true);
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const result = snoozeReminderUntil(reminder.id, future);
      expect(result.isDone).toBe(true);
      expect(result.snoozedUntil).toBe('');
    });

    it('drops the snooze marker when a reminder is marked done', () => {
      const reminder = createReminder({ text: 'Polish weekly recap' });
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      snoozeReminderUntil(reminder.id, future);

      const done = toggleReminder(reminder.id, true);

      // Completed reminders should not still carry a snooze marker; the
      // normalize step strips it on the next read.
      const persisted = listReminders().find((row) => row.id === reminder.id);
      expect(done.isDone).toBe(true);
      expect(persisted.snoozedUntil).toBe('');
    });
  });
});
