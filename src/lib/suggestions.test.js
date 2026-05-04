import { describe, expect, it } from 'vitest';
import { buildDeterministicSuggestions } from './suggestions';

describe('src/lib/suggestions', () => {
  it('builds deterministic suggestions from multiple system inputs', () => {
    const suggestions = buildDeterministicSuggestions({
      priorities: [{ id: 'p-1', title: 'Ship onboarding', status: 'Planned' }],
      blockers: [{ id: 'b-1', text: 'Waiting on legal' }],
      opportunities: [{ id: 'o-1', name: 'Acme', stage: 'In Progress', priority: 'High' }],
      contentRows: [{ id: 'c-1', title: 'Founder thread', status: 'Drafting' }],
      notes: [{ id: 'n-1', category: 'idea', text: 'Podcast series', updatedAt: '2026-04-22T12:00:00.000Z' }],
      reminders: [{ id: 'r-1', text: 'Follow up', isDone: false }],
      journalEntry: { feelsHeavy: 'Too many tabs', oneNextThing: '' },
      now: new Date('2026-04-23T10:00:00.000Z'),
    });

    // Capped to 3 and triaged by severity: a named blocker outranks a
    // heavy-journal nudge outranks an in-progress quick-win. Lower-severity
    // suggestions (drafting content, planned priority, unfinished idea) drop
    // off because the user only needs to see what matters most.
    expect(suggestions.map((item) => item.id)).toEqual([
      'blocker-attention',
      'journal-next-step',
      'quick-win',
    ]);
  });

  it('caps visible suggestions to the top three by severity', () => {
    const suggestions = buildDeterministicSuggestions({
      priorities: [{ id: 'p-1', title: 'Ship onboarding', status: 'Planned' }],
      blockers: [],
      opportunities: [],
      contentRows: [{ id: 'c-1', title: 'Founder thread', status: 'Drafting' }],
      notes: [{ id: 'n-1', category: 'idea', text: 'Podcast series', updatedAt: '2026-04-22T12:00:00.000Z' }],
      reminders: [{ id: 'r-1', text: 'Follow up', isDone: false }],
      journalEntry: {},
      now: new Date('2026-04-23T10:00:00.000Z'),
    });

    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].id).toBe('planned-priority');
    expect(suggestions.find((item) => item.id === 'unfinished-idea')).toBeUndefined();
  });

  it('returns fallback suggestion when all sources are empty', () => {
    const suggestions = buildDeterministicSuggestions({
      priorities: [],
      blockers: [],
      opportunities: [],
      contentRows: [],
      notes: [],
      reminders: [],
      journalEntry: {},
      now: new Date('2026-04-23T10:00:00.000Z'),
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].id).toBe('default');
  });
});
