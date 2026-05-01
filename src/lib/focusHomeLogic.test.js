import { describe, expect, it } from 'vitest';
import {
  buildMainFocus,
  buildMomentumMessage,
  buildNextMoveQueue,
  buildQuickWin,
  resolveFocusMode,
} from './focusHomeLogic';

describe('focusHomeLogic', () => {
  it('resolves focus mode copy with a calm planning fallback', () => {
    expect(resolveFocusMode('overwhelmed')).toMatchObject({
      id: 'overwhelmed',
      support: expect.stringContaining('You are not behind'),
    });
    expect(resolveFocusMode('unknown-mode')).toMatchObject({
      id: 'planning',
    });
  });

  it('prioritizes active work before opportunities, content, and fallback focus', () => {
    expect(
      buildMainFocus(
        [{ title: 'Launch pricing update', status: 'In Progress' }],
        [{ name: 'Investor intro', priority: 'High' }],
        [{ title: 'Founder note' }],
      ),
    ).toMatchObject({
      title: 'Launch pricing update',
    });

    expect(
      buildMainFocus(
        [],
        [{ name: 'Investor intro', company: 'Acme', priority: 'High' }],
        [{ title: 'Founder note' }],
      ),
    ).toMatchObject({
      title: 'Investor intro (Acme)',
    });

    expect(buildMainFocus(null, undefined, false)).toMatchObject({
      title: 'Create one calming priority for today',
    });
  });

  it('builds a stable next-move queue from the highest-friction work signals', () => {
    const queue = buildNextMoveQueue({
      priorities: [
        { title: 'Partner launch', status: 'Blocked' },
        { title: 'Customer update', status: 'In Progress' },
      ],
      blockers: [{ text: 'Legal review is waiting.' }],
      opportunities: [{ name: 'Acme renewal', stage: 'Awaiting Reply' }],
      contentRows: [{ title: 'Weekly memo', status: 'Drafting' }],
    });

    expect(queue).toEqual([
      'Send one unblock message for "Partner launch".',
      'Define one owner and one deadline for: "Legal review is waiting.".',
      'Spend 20 focused minutes on "Customer update".',
      'Draft a concise follow-up for "Acme renewal".',
      'Write the opening paragraph for "Weekly memo".',
      'Set a 15-minute timer and complete one tiny action without switching tabs.',
    ]);
  });

  it('keeps quick wins and momentum scoring deterministic with missing inputs', () => {
    expect(buildQuickWin(null, [{ name: 'Launch deal', stage: 'In Progress' }], [])).toBe(
      'Quick win waiting: send an update for "Launch deal".',
    );
    expect(buildQuickWin(undefined, undefined, undefined)).toBe(
      'Quick win waiting: close one tiny loop before opening a new one.',
    );

    expect(buildMomentumMessage({
      inProgressCount: 3,
      winsCount: 2,
      completedReminderCount: 2,
    })).toMatchObject({
      score: 100,
      text: 'Momentum is visible. Completed reminders are turning intent into proof.',
    });

    expect(buildMomentumMessage({
      blockerCount: 5,
      pendingReminderCount: 5,
    })).toMatchObject({
      score: 0,
      text: 'Momentum is fragile. Use reset mode and complete one two-minute action.',
    });
  });
});
