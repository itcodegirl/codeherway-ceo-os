import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createReminder,
  deleteReminder,
  getReminderProgress,
  listReminders,
  toggleReminder,
  updateReminderText,
} from './remindersRepository';

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
});
