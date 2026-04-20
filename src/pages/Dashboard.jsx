import { useEffect, useRef, useState } from 'react';
import StatCard from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import Toast from '../components/ui/Toast';
import { stats, priorities, opportunities, contentItems } from '../data/mockData';

function Dashboard() {
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

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
      console.error('Clipboard copy failed', error);
    }
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-grid dashboard-grid--stats">
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            change={stat.change}
          />
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--main">
        <SectionCard title="Top Priorities" actionText="View Plan" actionTo="/weekly-brief">
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
          <div className="snapshot-stack">
            <div className="snapshot-row">
              <span>Strategic Focus</span>
              <strong>Platform + Partnerships</strong>
            </div>
            <div className="snapshot-row">
              <span>Top Risk</span>
              <strong>Follow-up delays</strong>
            </div>
            <div className="snapshot-row">
              <span>Momentum</span>
              <strong>Strong this week</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Opportunities Pipeline" actionText="Open CRM" actionTo="/opportunities">
          <div className="mini-table">
            {opportunities.map((item) => (
              <div key={item.id} className="mini-table__row">
                <div>
                  <p className="mini-table__title">{item.name}</p>
                  <p className="mini-table__subtitle">{item.company}</p>
                </div>
                <div className="mini-table__meta">
                  <span className={`pill pill--${item.priority.toLowerCase()}`}>
                    {item.priority}
                  </span>
                  <span className="mini-table__stage">{item.stage}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Content Pipeline" actionText="Open Content OS" actionTo="/content">
          <div className="mini-table">
            {contentItems.map((item) => (
              <div key={item.id} className="mini-table__row">
                <div>
                  <p className="mini-table__title">{item.title}</p>
                  <p className="mini-table__subtitle">{item.platform}</p>
                </div>
                <div className="mini-table__meta">
                  <span className="mini-table__stage">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <Toast className="toast--dashboard" isVisible={Boolean(toastMessage)} message={toastMessage} />
    </section>
  );
}

export default Dashboard;
