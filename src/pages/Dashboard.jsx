import { useCallback } from 'react';
import StatCard from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import Toast from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import SourceStatusNotice from '../components/ui/SourceStatusNotice';
import MomentumChart from '../components/dashboard/MomentumChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { isLocalDashboardDemoMode, useDashboardData } from '../hooks/useDashboardData';
import { useDashboardInsights } from '../hooks/useDashboardInsights';
import { useToast } from '../hooks/useToast';
import { useWeeklyBrief } from '../hooks/useWeeklyBrief';
import { contentStatusTone } from '../lib/statusMaps';
import '../styles/dashboard.css';

function Dashboard() {
  const {
    toastMessage,
    isToastVisible,
    showToast,
  } = useToast();
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

  const {
    priorities: weeklyPriorities,
    blockers: weeklyBlockers,
    isLoading: isWeeklyLoading,
    source: weeklySource,
    loadError: weeklyLoadError,
    refreshWeeklyBrief,
  } = useWeeklyBrief();

  const {
    priorityItems,
    dashboardInsights,
    statCards,
    opportunityRows,
    contentRows: dashboardContentRows,
    snapshotRows,
    snapshotText,
    dashboardDemoNote,
  } = useDashboardInsights({
    weeklyPriorities,
    weeklyBlockers,
    opportunityItems,
    contentRows: contentRows,
    isDataLoading: isDataLoading || isWeeklyLoading,
    isLocalDashboardDemoMode,
  });

  const handleCopySnapshot = async () => {
    if (!navigator?.clipboard?.writeText) {
      showToast('Clipboard access is not available in this environment.');
      return;
    }

    try {
      await navigator.clipboard.writeText(snapshotText);
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
      <SourceStatusNotice
        source={weeklySource}
        supabaseText="Weekly data source: Supabase."
        localText="Weekly data source: local persistent storage."
        loadError={weeklyLoadError}
        onRetry={refreshWeeklyBrief}
        retryAriaLabel="Retry loading weekly dashboard data"
      />

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
          iconName="weekly"
          actionText="View Plan"
          actionTo="/weekly-brief"
          actionLabel="Open weekly plan and priority focus"
        >
          <ul className="priority-list">
            {priorityItems.length ? priorityItems.map((item) => (
              <li key={item.id} className="priority-list__item">
                <span className="priority-list__dot" />
                <span>{item.title}</span>
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
          iconName="dashboard"
          actionText="Copy Snapshot"
          onAction={handleCopySnapshot}
          actionLabel="Copy executive snapshot"
        >
          <div className="snapshot-stack" role="list" aria-label="Executive snapshot highlights">
            {snapshotRows.map((item) => (
              <div key={item.id} className="snapshot-row" role="listitem">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          {dashboardDemoNote ? <p className="helper-text">{dashboardDemoNote}</p> : null}
        </SectionCard>

        <SectionCard
          title="Opportunities Pipeline"
          iconName="opportunities"
          actionText="Open CRM"
          actionTo="/opportunities"
          actionLabel="Open opportunities pipeline dashboard"
        >
          <div className="mini-table" role="list" aria-label="Opportunity pipeline snapshot">
            {opportunityRows.length ? (
              opportunityRows.map((item) => (
                <div
                  key={item.id}
                  className="mini-table__row"
                  role="listitem"
                  aria-label={`${item.name} at ${item.company}`}
                >
                  <div>
                    <p className="mini-table__title">{item.name}</p>
                    <p className="mini-table__subtitle">{item.company}</p>
                  </div>
                  <div className="mini-table__meta">
                    <Badge label={item.priority} tone={item.priorityTone} />
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
          iconName="content"
          actionText="Open Content OS"
          actionTo="/content"
          actionLabel="Open content operating system dashboard"
        >
          <div className="mini-table" role="list" aria-label="Content pipeline snapshot">
            {dashboardContentRows.length ? (
              dashboardContentRows.map((item) => (
                <div
                  key={item.id}
                  className="mini-table__row"
                  role="listitem"
                  aria-label={`${item.title} on ${item.platform}`}
                >
                  <div>
                    <p className="mini-table__title">{item.title}</p>
                    <p className="mini-table__subtitle">{item.platform}</p>
                  </div>
                  <div className="mini-table__meta">
                    <Badge
                      label={item.status}
                      tone={contentStatusTone[item.status] || item.statusTone || 'default'}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="helper-text">No content items to display yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Momentum Trend" iconName="dashboard">
          <MomentumChart values={dashboardInsights.momentumValues} />
        </SectionCard>

        <SectionCard title="Recent Activity" iconName="dashboard">
          {dashboardDemoNote ? <p className="helper-text">{dashboardDemoNote}</p> : null}
          <ActivityFeed items={dashboardInsights.recentActivity} />
        </SectionCard>
      </div>

      <Toast className="toast--dashboard" isVisible={isToastVisible} message={toastMessage} />
    </section>
  );
}

export default Dashboard;
