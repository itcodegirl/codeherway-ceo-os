import { beforeEach, describe, expect, it } from 'vitest';
import {
  createReminder,
  deleteReminder,
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
    toggleReminder(created.id, true);

    const reminders = listReminders();
    expect(reminders[0].isDone).toBe(true);
  });

  it('deletes reminders', () => {
    const created = createReminder({ text: 'Clean backlog' });
    deleteReminder(created.id);

    expect(listReminders()).toHaveLength(0);
  });
});
