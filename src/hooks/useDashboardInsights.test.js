import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { dashboardDemoData } from '../data/mockData';
import { useDashboardInsights } from './useDashboardInsights';

describe('useDashboardInsights', () => {
  it('normalizes null or undefined collections and still produces stable rows', () => {
    const { result } = renderHook(() => useDashboardInsights({
      weeklyPriorities: null,
      weeklyBlockers: undefined,
      opportunityItems: undefined,
      contentRows: null,
      isDataLoading: true,
      isLocalDashboardDemoMode: false,
    }));

    expect(result.current.dashboardCounts).toEqual({
      inProgressPriorities: 0,
      blockedPriorities: 0,
      blockerCount: 0,
      awaitingReplyCount: 0,
      highPriorityCount: 0,
      inProgressOpportunityCount: 0,
      scheduledContentCount: 0,
      editingContentCount: 0,
      draftingContentCount: 0,
      opportunityCount: 0,
      contentCount: 0,
    });
    expect(result.current.priorityItems).toEqual([]);
    expect(result.current.opportunityRows).toEqual([]);
    expect(result.current.contentRows).toEqual([]);
    expect(result.current.statCards.every((card) => card.value !== undefined)).toBe(true);
    expect(result.current.statCards.map((card) => card.value)).toEqual(['--', '--', '--', '--']);
    expect(result.current.snapshotText).toBe([
      `Strategic Focus: ${dashboardDemoData.executiveSnapshotFallback.strategicFocus}`,
      `Top Risk: ${dashboardDemoData.executiveSnapshotFallback.topRisk}`,
      `Momentum: ${dashboardDemoData.executiveSnapshotFallback.momentum}`,
    ].join('\n'));
    expect(result.current.snapshotRows).toEqual([
      {
        id: 'strategic-focus',
        label: 'Strategic Focus',
        value: dashboardDemoData.executiveSnapshotFallback.strategicFocus,
      },
      {
        id: 'top-risk',
        label: 'Top Risk',
        value: dashboardDemoData.executiveSnapshotFallback.topRisk,
      },
      {
        id: 'momentum',
        label: 'Momentum',
        value: dashboardDemoData.executiveSnapshotFallback.momentum,
      },
    ]);
  });

  it('derives focus score and recent activity from loaded collections', () => {
    const { result } = renderHook(() => useDashboardInsights({
      weeklyPriorities: [
        {
          id: 'p1',
          title: 'Publish launch deck',
          status: 'In Progress',
        },
      ],
      weeklyBlockers: [
        {
          id: 'b1',
          text: 'Waiting on legal review for launch page',
        },
      ],
      opportunityItems: [
        {
          id: 'o1',
          name: 'Acme Expansion',
          company: 'Acme',
          priority: 'High',
          stage: 'In Progress',
        },
      ],
      contentRows: [
        {
          id: 'c1',
          title: 'Founder Update',
          platform: 'LinkedIn',
          status: 'Scheduled',
        },
      ],
      isDataLoading: false,
      isLocalDashboardDemoMode: true,
    }));

    expect(result.current.dashboardCounts).toMatchObject({
      inProgressPriorities: 1,
      scheduledContentCount: 1,
      opportunityCount: 1,
      contentCount: 1,
      highPriorityCount: 1,
      inProgressOpportunityCount: 1,
      blockerCount: 1,
    });
    expect(result.current.statCards.map((card) => card.value)).toEqual([
      1,
      1,
      0,
      '65%',
    ]);
    expect(result.current.dashboardInsights.focusScore).toBe(65);
    expect(result.current.dashboardInsights.focusChange).toContain('1 active risk');
    expect(result.current.snapshotText).toContain('Strategic Focus: Publish launch deck');
    expect(result.current.snapshotText).toContain('Top Risk: Waiting on legal review for launch page');
  });
});
