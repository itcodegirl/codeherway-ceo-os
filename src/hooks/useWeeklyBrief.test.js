import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_REVIEW_NOTES, defaultPriorities } from '../lib/weeklyData';
import { useWeeklyBrief } from './useWeeklyBrief';

const currentWeekStart = '2026-04-20';

function createDeferred() {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });

  return {
    promise,
    resolve,
  };
}

vi.mock('../lib/weeklyRepository', () => ({
  WEEKLY_BRIEF_UPDATED_EVENT: 'ceo-os:weekly-brief-updated',
  createWeeklyItem: vi.fn(),
  deleteWeeklyItem: vi.fn(),
  emitWeeklyBriefUpdated: vi.fn(),
  getCurrentWeekStart: vi.fn(() => currentWeekStart),
  getWeeklyBriefByWeek: vi.fn(),
  resolveWeeklySource: vi.fn(() => 'local'),
  saveWeeklyBriefReviewNotes: vi.fn(),
  updateWeeklyItem: vi.fn(),
}));

import { createWeeklyItem, deleteWeeklyItem, getCurrentWeekStart, getWeeklyBriefByWeek } from '../lib/weeklyRepository';

describe('useWeeklyBrief', () => {
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;

  beforeEach(() => {
    vi.clearAllMocks();
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;

    window.requestAnimationFrame = vi.fn((callback) => {
      callback(0);
      return 7;
    });
    window.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('normalizes malformed persisted payloads on load', async () => {
    getWeeklyBriefByWeek.mockResolvedValue({
      reviewNotes: 1234,
      priorities: null,
      wins: null,
      blockers: null,
      source: 'supabase',
    });

    const { result } = renderHook(() => useWeeklyBrief());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getCurrentWeekStart).toHaveBeenCalled();
    expect(getWeeklyBriefByWeek).toHaveBeenCalledWith(currentWeekStart);
    expect(result.current.source).toBe('supabase');
    expect(result.current.reviewNotes).toBe(DEFAULT_REVIEW_NOTES);
    expect(result.current.priorities).toEqual([]);
    expect(result.current.wins).toEqual([]);
    expect(result.current.blockers).toEqual([]);
  });

  it('normalizes setter payloads before persistence and removes deleted items', async () => {
    getWeeklyBriefByWeek.mockResolvedValue({
      reviewNotes: DEFAULT_REVIEW_NOTES,
      priorities: [...defaultPriorities],
      wins: [],
      blockers: [],
    });

    createWeeklyItem.mockResolvedValue({ id: 'created' });
    deleteWeeklyItem.mockResolvedValue(undefined);
    getCurrentWeekStart.mockReturnValue(currentWeekStart);

    const { result } = renderHook(() => useWeeklyBrief());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPriorities(null);
    });

    await waitFor(() => {
      expect(deleteWeeklyItem).toHaveBeenCalledTimes(defaultPriorities.length);
    });

    defaultPriorities.forEach((item, index) => {
      expect(deleteWeeklyItem).toHaveBeenNthCalledWith(
        index + 1,
        expect.objectContaining({
          weekStart: currentWeekStart,
          itemType: 'priority',
          itemId: String(item.id),
          emitEvent: false,
        }),
      );
    });

    expect(result.current.priorities).toEqual([]);
  });

  it('ignores stale weekly brief responses when a newer refresh finishes later', async () => {
    const firstLoad = createDeferred();
    const secondLoad = createDeferred();

    getWeeklyBriefByWeek
      .mockImplementationOnce(() => firstLoad.promise)
      .mockImplementationOnce(() => secondLoad.promise);

    const { result } = renderHook(() => useWeeklyBrief());

    await waitFor(() => {
      expect(getWeeklyBriefByWeek).toHaveBeenCalledTimes(1);
    });

    act(() => {
      void result.current.refreshWeeklyBrief();
    });

    await waitFor(() => {
      expect(getWeeklyBriefByWeek).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      secondLoad.resolve({
        reviewNotes: 'Newest weekly brief',
        priorities: [{ id: 'priority-2', text: 'Ship roadmap', status: 'Planned' }],
        wins: [],
        blockers: [],
        source: 'supabase',
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.reviewNotes).toBe('Newest weekly brief');
      expect(result.current.source).toBe('supabase');
    });

    await act(async () => {
      firstLoad.resolve({
        reviewNotes: 'Outdated weekly brief',
        priorities: [{ id: 'priority-1', text: 'Old plan', status: 'In Progress' }],
        wins: [],
        blockers: [],
        source: 'local',
      });
      await Promise.resolve();
    });

    expect(result.current.reviewNotes).toBe('Newest weekly brief');
    expect(result.current.priorities).toEqual([{ id: 'priority-2', text: 'Ship roadmap', status: 'Planned' }]);
    expect(result.current.source).toBe('supabase');
  });
});
