import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WEEKLY_BRIEF_UPDATED_EVENT,
  createWeeklyItem,
  deleteWeeklyItem,
  getWeeklyBriefByWeek,
  saveWeeklyBriefReviewNotes,
  updateWeeklyItem,
} from './weeklyRepository';

const weekStart = '2026-04-20';

describe('src/lib/weeklyRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('rejects stale local item updates without emitting a fake update event', async () => {
    await createWeeklyItem({
      weekStart,
      itemType: 'priority',
      item: {
        id: 'priority-1',
        title: 'Ship planner',
        owner: 'Jenna',
        status: 'Planned',
      },
      emitEvent: false,
    });

    const updateListener = vi.fn();
    window.addEventListener(WEEKLY_BRIEF_UPDATED_EVENT, updateListener);

    try {
      await expect(updateWeeklyItem({
        weekStart,
        itemType: 'priority',
        itemId: 'missing-priority',
        item: {
          title: 'Stale priority',
          owner: 'Jenna',
          status: 'Done',
        },
      })).rejects.toThrow('Weekly item not found');
    } finally {
      window.removeEventListener(WEEKLY_BRIEF_UPDATED_EVENT, updateListener);
    }

    const brief = await getWeeklyBriefByWeek(weekStart);
    expect(updateListener).not.toHaveBeenCalled();
    expect(brief.priorities).toEqual([
      {
        id: 'priority-1',
        title: 'Ship planner',
        owner: 'Jenna',
        status: 'Planned',
      },
    ]);
  });

  it('rejects stale local item deletes without emitting a fake update event', async () => {
    await createWeeklyItem({
      weekStart,
      itemType: 'win',
      item: {
        id: 'win-1',
        text: 'Published case study',
        category: 'Portfolio',
      },
      emitEvent: false,
    });

    const updateListener = vi.fn();
    window.addEventListener(WEEKLY_BRIEF_UPDATED_EVENT, updateListener);

    try {
      await expect(deleteWeeklyItem({
        weekStart,
        itemType: 'win',
        itemId: 'missing-win',
      })).rejects.toThrow('Weekly item not found');
    } finally {
      window.removeEventListener(WEEKLY_BRIEF_UPDATED_EVENT, updateListener);
    }

    const brief = await getWeeklyBriefByWeek(weekStart);
    expect(updateListener).not.toHaveBeenCalled();
    expect(brief.wins).toEqual([
      {
        id: 'win-1',
        text: 'Published case study',
        category: 'Portfolio',
      },
    ]);
  });

  it('rejects failed local review-note persistence before emitting an update event', async () => {
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('storage full');
    });
    const updateListener = vi.fn();
    window.addEventListener(WEEKLY_BRIEF_UPDATED_EVENT, updateListener);

    try {
      await expect(saveWeeklyBriefReviewNotes({
        weekStart,
        reviewNotes: 'Close the week with a clear next move.',
      })).rejects.toThrow('Failed to persist weekly brief data to localStorage');
    } finally {
      window.localStorage.setItem = originalSetItem;
      window.removeEventListener(WEEKLY_BRIEF_UPDATED_EVENT, updateListener);
    }

    expect(updateListener).not.toHaveBeenCalled();
  });
});
