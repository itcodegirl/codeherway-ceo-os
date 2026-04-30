import { beforeEach, describe, expect, it } from 'vitest';
import {
  createReminder,
  deleteReminder,
  getReminderProgress,
  listReminders,
  toggleReminder,
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
});
