import { useMemo } from 'react';
import { dashboardDemoData } from '../data/mockData';

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function shortenText(text, maxLength = 64) {
  const normalized = (text || '').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

export function useDashboardInsights({
  weeklyPriorities,
  weeklyBlockers,
  opportunityItems,
  contentRows,
  isDataLoading,
  isLocalDashboardDemoMode,
}) {
  const dashboardCounts = useMemo(() => {
    const counts = {
      inProgressPriorities: 0,
      blockedPriorities: 0,
      blockerCount: weeklyBlockers.length,
      awaitingReplyCount: 0,
      highPriorityCount: 0,
      inProgressOpportunityCount: 0,
      scheduledContentCount: 0,
      editingContentCount: 0,
      draftingContentCount: 0,
      opportunityCount: opportunityItems.length,
      contentCount: contentRows.length,
    };

    weeklyPriorities.forEach((item) => {
      if (item?.status === 'In Progress') {
        counts.inProgressPriorities += 1;
      }

      if (item?.status === 'Blocked') {
        counts.blockedPriorities += 1;
      }
    });

    opportunityItems.forEach((item) => {
      if (item?.stage === 'Awaiting Reply') {
        counts.awaitingReplyCount += 1;
      }

      if (item?.stage === 'In Progress') {
        counts.inProgressOpportunityCount += 1;
      }

      if (item?.priority === 'High') {
        counts.highPriorityCount += 1;
      }
    });

    contentRows.forEach((item) => {
      if (item?.status === 'Scheduled') {
        counts.scheduledContentCount += 1;
      }

      if (item?.status === 'Editing') {
        counts.editingContentCount += 1;
      }

      if (item?.status === 'Drafting') {
        counts.draftingContentCount += 1;
      }
    });

    return counts;
  }, [contentRows, opportunityItems, weeklyBlockers.length, weeklyPriorities]);

  const priorityItems = useMemo(
    () =>
      weeklyPriorities
        .slice(0, 3)
        .map((item, index) => ({
          id: item?.id ?? item?.title ?? `priority-${index}`,
          title: item?.title,
        }))
        .filter((item) => item.title),
    [weeklyPriorities],
  );

  const dashboardInsightValues = useMemo(() => {
    const {
      inProgressPriorities,
      blockedPriorities,
      blockerCount,
      awaitingReplyCount,
      highPriorityCount,
      scheduledContentCount,
      editingContentCount,
      opportunityCount,
      contentCount,
    } = dashboardCounts;

    const focusScore = clampScore(
      Math.round(
        55
          + (inProgressPriorities * 12)
          + (scheduledContentCount * 6)
          + (editingContentCount * 3)
          - (blockedPriorities * 10)
          - (blockerCount * 8)
          - (awaitingReplyCount * 4),
      ),
    );

    let momentumLabel = dashboardDemoData.executiveSnapshotFallback.momentum;
    if (focusScore >= 80) {
      momentumLabel = 'Strong this week';
    } else if (focusScore >= 60) {
      momentumLabel = 'Steady progress';
    }

    const leadPriority = weeklyPriorities.find((item) => item?.title);
    const leadOpportunity = opportunityItems.find((item) => item.priority === 'High') || opportunityItems[0];
    const leadContent = contentRows.find((item) => item.status === 'Scheduled') || contentRows[0];
    const topBlocker = weeklyBlockers.find((item) => item?.text);

    const strategicFocus = leadPriority?.title
      ? shortenText(leadPriority.title)
      : leadOpportunity?.name
        ? `Advance ${shortenText(leadOpportunity.name, 52)}`
        : leadContent?.title
          ? `Publish ${shortenText(leadContent.title, 52)}`
          : dashboardDemoData.executiveSnapshotFallback.strategicFocus;

    const topRisk = topBlocker?.text
      ? shortenText(topBlocker.text, 72)
      : blockedPriorities > 0
        ? `${blockedPriorities} blocked priorities`
        : awaitingReplyCount > 0
          ? `${awaitingReplyCount} opportunities awaiting reply`
          : dashboardDemoData.executiveSnapshotFallback.topRisk;

    const computedRecentActivity = [
      leadPriority?.title
        ? {
          id: `activity-priority-${leadPriority.id || 'current'}`,
          title: `Priority in motion: ${shortenText(leadPriority.title, 56)}`,
          time: 'Live focus',
          type: 'Planning',
        }
        : null,
      leadOpportunity?.name
        ? {
          id: `activity-opportunity-${leadOpportunity.id || 'current'}`,
          title: `${shortenText(leadOpportunity.name, 48)} (${leadOpportunity.stage})`,
          time: `Priority: ${leadOpportunity.priority}`,
          type: 'Opportunity',
        }
        : null,
      leadContent?.title
        ? {
          id: `activity-content-${leadContent.id || 'current'}`,
          title: `${shortenText(leadContent.title, 52)} (${leadContent.status})`,
          time: leadContent.platform || 'Content queue',
          type: 'Content',
        }
        : null,
      topBlocker?.text
        ? {
          id: `activity-blocker-${topBlocker.id || 'current'}`,
          title: `Risk noted: ${shortenText(topBlocker.text, 52)}`,
          time: 'Needs resolution',
          type: 'Risk',
        }
        : null,
    ].filter(Boolean).slice(0, 3);
    const recentActivity = computedRecentActivity.length ? computedRecentActivity : dashboardDemoData.recentActivity;

    const momentumValues = [
      clampScore(20 + (opportunityCount * 10)),
      clampScore(20 + (contentCount * 10)),
      clampScore(25 + (inProgressPriorities * 18)),
      clampScore(90 - ((blockedPriorities * 15) + (blockerCount * 12))),
      clampScore(30 + (highPriorityCount * 12) - (awaitingReplyCount * 8)),
      focusScore,
    ];

    const scoreContext = blockerCount + blockedPriorities;
    const focusChangeBase = scoreContext > 0
      ? `${scoreContext} active risk${scoreContext > 1 ? 's' : ''}`
      : `${inProgressPriorities} priorities in progress`;
    const focusChange = isLocalDashboardDemoMode
      ? `${focusChangeBase} - ${dashboardDemoData.focusScore.demoSuffix}`
      : focusChangeBase;

    return {
      focusScore,
      focusChange,
      strategicFocus,
      topRisk,
      momentumLabel,
      recentActivity,
      momentumValues,
    };
  }, [contentRows, dashboardCounts, isLocalDashboardDemoMode, opportunityItems, weeklyBlockers, weeklyPriorities]);

  const statCards = useMemo(() => {
    const {
      highPriorityCount,
      inProgressOpportunityCount,
      awaitingReplyCount,
      draftingContentCount,
      opportunityCount,
      contentCount,
    } = dashboardCounts;

    return [
      {
        id: 1,
        label: 'Active Opportunities',
        value: isDataLoading ? '--' : opportunityCount,
        change: `${inProgressOpportunityCount} in progress`,
      },
      {
        id: 2,
        label: 'Content in Pipeline',
        value: isDataLoading ? '--' : contentCount,
        change: `${draftingContentCount} drafting`,
      },
      {
        id: 3,
        label: 'Follow-Ups Due',
        value: isDataLoading ? '--' : awaitingReplyCount,
        change: `${highPriorityCount} high priority`,
      },
      {
        id: 4,
        label: 'Weekly Focus Score',
        value: isDataLoading ? '--' : `${dashboardInsightValues.focusScore}%`,
        change: dashboardInsightValues.focusChange,
      },
    ];
  }, [
    dashboardCounts,
    dashboardInsightValues.focusChange,
    dashboardInsightValues.focusScore,
    isDataLoading,
  ]);

  return {
    dashboardCounts,
    priorityItems,
    dashboardInsights: dashboardInsightValues,
    statCards,
  };
}
