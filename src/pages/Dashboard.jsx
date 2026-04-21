import { useEffect, useMemo, useRef, useState } from 'react';
import StatCard from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import Toast from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import MomentumChart from '../components/dashboard/MomentumChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { priorities } from '../data/mockData';
import { listOpportunities } from '../lib/opportunitiesRepository';
import { listContentItems } from '../lib/contentRepository';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../styles/dashboard.css';

const contentStatusTone = {
  Drafting: 'low',
  Editing: 'warning',
  Scheduled: 'high',
};

const recentActivity = [
  { id: 'a1', title: 'Sent XPAIRK follow-up email', time: 'Today, 9:15 AM', type: 'Opportunity' },
  { id: 'a2', title: 'Moved Founder Update to Editing', time: 'Yesterday, 5:40 PM', type: 'Content' },
  { id: 'a3', title: 'Updated weekly blocker notes', time: 'Yesterday, 3:10 PM', type: 'Planning' },
];

function Dashboard() {
  useDocumentTitle(
    'Dashboard',
    'Track opportunities, content, and priorities from one executive view.',
  );

  const [toastMessage, setToastMessage] = useState('');
  const [opportunityItems, setOpportunityItems] = useState([]);
  const [contentRows, setContentRows] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const toastTimerRef = useRef(null);

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
      { id: 4, label: 'Weekly Focus Score', value: '86%', change: '+8% from last week' },
    ];
  }, [contentRows, isDataLoading, opportunityItems]);

  const showToast = (message) => {
    setToastMessage(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('');
    }, 2200);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadDashboardData = async () => {
      setIsDataLoading(true);

      try {
        const [nextOpportunities, nextContentRows] = await Promise.all([
          listOpportunities(),
          listContentItems(),
        ]);

        if (!isActive) {
          return;
        }

        setOpportunityItems(nextOpportunities);
        setContentRows(nextContentRows);
      } catch (error) {
        if (!isActive) {
          return;
        }

        showToast('Unable to refresh dashboard data right now.');
        if (import.meta.env.DEV) {
          console.error('Dashboard data load failed', error);
        }
      } finally {
        if (isActive) {
          setIsDataLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isActive = false;
    };
  }, []);

  const handleCopySnapshot = async () => {
    const snapshot = [
      'Strategic Focus: Platform + Partnerships',
      'Top Risk: Follow-up delays',
      'Momentum: Strong this week',
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
            {priorities.map((item) => (
              <li key={item} className="priority-list__item">
                <span className="priority-list__dot" />
                <span>{item}</span>
              </li>
            ))}
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
              <strong>Platform + Partnerships</strong>
            </div>
            <div className="snapshot-row" role="listitem">
              <span>Top Risk</span>
              <strong>Follow-up delays</strong>
            </div>
            <div className="snapshot-row" role="listitem">
              <span>Momentum</span>
              <strong>Strong this week</strong>
            </div>
          </div>
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
          <MomentumChart values={[12, 18, 9, 16, 14, 22]} />
        </SectionCard>

        <SectionCard title="Recent Activity">
          <ActivityFeed items={recentActivity} />
        </SectionCard>
      </div>

      <Toast className="toast--dashboard" isVisible={Boolean(toastMessage)} message={toastMessage} />
    </section>
  );
}

export default Dashboard;
