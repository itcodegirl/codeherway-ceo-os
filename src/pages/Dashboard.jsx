import { useCallback, useMemo } from 'react';
import StatCard from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import Toast from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import MomentumChart from '../components/dashboard/MomentumChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import {
  dashboardDemoData,
  weeklyPriorities as defaultWeeklyPriorities,
  weeklyBlockers as defaultWeeklyBlockers,
} from '../data/mockData';
import { usePersistentState } from '../hooks/usePersistentState';
import { isLocalDashboardDemoMode, useDashboardData } from '../hooks/useDashboardData';
import { useToast } from '../hooks/useToast';
import { contentStatusTone } from '../lib/statusMaps';
import '../styles/dashboard.css';

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

function Dashboard() {
  const {
    toastMessage,
    isToastVisible,
    showToast,
  } = useToast();
  const [storedWeeklyPriorities] = usePersistentState('ceo-os-weekly-priorities', defaultWeeklyPriorities);
  const [storedWeeklyBlockers] = usePersistentState('ceo-os-weekly-blockers', defaultWeeklyBlockers);
  const handleDashboardLoadError = useCallback((error) => {
    showToast('Unable to refresh dashboard data right now.');
    if (import.meta.env.DEV) {
      console.error('Dashboard data load failed', error);
    }
  }, [showToast]);
  const {
    opportunityItems,
    contentRows,
    isDataLoading,
  } = useDashboardData({
    onLoadError: handleDashboardLoadError,
  });

  const weeklyPriorities = useMemo(() => {
    if (!Array.isArray(storedWeeklyPriorities)) {
      return [];
    }

    return storedWeeklyPriorities;
  }, [storedWeeklyPriorities]);

  const weeklyBlockers = useMemo(() => {
    if (!Array.isArray(storedWeeklyBlockers)) {
      return [];
    }

    return storedWeeklyBlockers;
  }, [storedWeeklyBlockers]);

  const priorityItems = useMemo(
    () => weeklyPriorities.slice(0, 3).map((item) => item?.title).filter(Boolean),
    [weeklyPriorities],
  );

  const dashboardInsights = useMemo(() => {
    const inProgressPriorities = weeklyPriorities.filter((item) => item?.status === 'In Progress').length;
    const blockedPriorities = weeklyPriorities.filter((item) => item?.status === 'Blocked').length;
    const blockerCount = weeklyBlockers.length;
    const awaitingReplyCount = opportunityItems.filter((item) => item.stage === 'Awaiting Reply').length;
    const highPriorityCount = opportunityItems.filter((item) => item.priority === 'High').length;
    const scheduledContentCount = contentRows.filter((item) => item.status === 'Scheduled').length;
    const editingContentCount = contentRows.filter((item) => item.status === 'Editing').length;

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
      clampScore(20 + (opportunityItems.length * 10)),
      clampScore(20 + (contentRows.length * 10)),
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
  }, [contentRows, opportunityItems, weeklyBlockers, weeklyPriorities]);

  const statCards = useMemo(() => {
    const highPriorityCount = opportunityItems.filter((item) => item.priority === 'High').length;
    const inProgressCount = opportunityItems.filter((item) => item.stage === 'In Progress').length;
    const awaitingReplyCount = opportunityItems.filter((item) => item.stage === 'Awaiting Reply').length;
    const draftingCount = contentRows.filter((item) => item.status === 'Drafting').length;

    return [
      {
        id: 1,
        label: 'Active Opportunities',
        value: isDataLoading ? '--' : opportunityItems.length,
        change: `${inProgressCount} in progress`,
      },
      {
        id: 2,
        label: 'Content in Pipeline',
        value: isDataLoading ? '--' : contentRows.length,
        change: `${draftingCount} drafting`,
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
        value: isDataLoading ? '--' : `${dashboardInsights.focusScore}%`,
        change: dashboardInsights.focusChange,
      },
    ];
  }, [contentRows, dashboardInsights.focusChange, dashboardInsights.focusScore, isDataLoading, opportunityItems]);

  const handleCopySnapshot = async () => {
    const snapshot = [
      `Strategic Focus: ${dashboardInsights.strategicFocus}`,
      `Top Risk: ${dashboardInsights.topRisk}`,
      `Momentum: ${dashboardInsights.momentumLabel}`,
    ].join('\n');

    if (!navigator?.clipboard?.writeText) {
      showToast('Clipboard access is not available in this environment.');
      return;
    }

    try {
      await navigator.clipboard.writeText(snapshot);
      showToast('Executive snapshot copied to clipboard.');
    } catch (error) {
      showToast('Unable to copy snapshot right now.');
      if (import.meta.env.DEV) {
        console.error('Clipboard copy failed', error);
      }
    }
  };

  return (
    <section className="dashboard-page">
      <PageHeader title="Dashboard" description="Track opportunities, content, and priorities from one executive view." />

      <div className="dashboard-grid dashboard-grid--stats">
        {statCards.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            change={stat.change}
          />
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--main">
        <SectionCard
          title="Top Priorities"
          actionText="View Plan"
          actionTo="/weekly-brief"
          actionLabel="Open weekly plan and priority focus"
        >
          <ul className="priority-list">
            {priorityItems.length ? priorityItems.map((item) => (
              <li key={item} className="priority-list__item">
                <span className="priority-list__dot" />
                <span>{item}</span>
              </li>
            )) : (
              <li className="priority-list__item">
                <span className="priority-list__dot" />
                <span className="helper-text">No weekly priorities yet. Add them from Weekly Brief.</span>
              </li>
            )}
          </ul>
        </SectionCard>

        <SectionCard
          title="Executive Snapshot"
          actionText="Copy Snapshot"
          onAction={handleCopySnapshot}
          actionLabel="Copy executive snapshot"
        >
          <div className="snapshot-stack" role="list" aria-label="Executive snapshot highlights">
            <div className="snapshot-row" role="listitem">
              <span>Strategic Focus</span>
              <strong>{dashboardInsights.strategicFocus}</strong>
            </div>
            <div className="snapshot-row" role="listitem">
              <span>Top Risk</span>
              <strong>{dashboardInsights.topRisk}</strong>
            </div>
            <div className="snapshot-row" role="listitem">
              <span>Momentum</span>
              <strong>{dashboardInsights.momentumLabel}</strong>
            </div>
          </div>
          {isLocalDashboardDemoMode ? <p className="helper-text">{dashboardDemoData.demoNote}</p> : null}
        </SectionCard>

        <SectionCard
          title="Opportunities Pipeline"
          actionText="Open CRM"
          actionTo="/opportunities"
          actionLabel="Open opportunities pipeline dashboard"
        >
          <div className="mini-table" role="list" aria-label="Opportunity pipeline snapshot">
            {opportunityItems.length ? (
              opportunityItems.map((item) => (
                <div key={item.id} className="mini-table__row" role="listitem" aria-label={`${item.name} at ${item.company}`}>
                  <div>
                    <p className="mini-table__title">{item.name}</p>
                    <p className="mini-table__subtitle">{item.company}</p>
                  </div>
                  <div className="mini-table__meta">
                    <Badge label={item.priority} tone={item.priority.toLowerCase()} />
                    <span className="mini-table__stage">{item.stage}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="helper-text">No opportunities to display yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Content Pipeline"
          actionText="Open Content OS"
          actionTo="/content"
          actionLabel="Open content operating system dashboard"
        >
          <div className="mini-table" role="list" aria-label="Content pipeline snapshot">
            {contentRows.length ? (
              contentRows.map((item) => (
                <div key={item.id} className="mini-table__row" role="listitem" aria-label={`${item.title} on ${item.platform}`}>
                  <div>
                    <p className="mini-table__title">{item.title}</p>
                    <p className="mini-table__subtitle">{item.platform}</p>
                  </div>
                  <div className="mini-table__meta">
                    <Badge label={item.status} tone={contentStatusTone[item.status] || 'default'} />
                  </div>
                </div>
              ))
            ) : (
              <p className="helper-text">No content items to display yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Momentum Trend">
          <MomentumChart values={dashboardInsights.momentumValues} />
        </SectionCard>

        <SectionCard title="Recent Activity">
          {isLocalDashboardDemoMode ? <p className="helper-text">{dashboardDemoData.demoNote}</p> : null}
          <ActivityFeed items={dashboardInsights.recentActivity} />
        </SectionCard>
      </div>

      <Toast className="toast--dashboard" isVisible={isToastVisible} message={toastMessage} />
    </section>
  );
}

export default Dashboard;
