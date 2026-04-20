import { useMemo } from 'react';
import { opportunities } from '../data/mockData';
import SectionCard from '../components/ui/SectionCard';

const priorityTone = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
};

const stageTone = {
  'In Progress': 'high',
  'Awaiting Reply': 'warning',
  New: 'low',
};

function Opportunities() {
  const metrics = useMemo(() => {
    return opportunities.reduce(
      (acc, opportunity) => {
        acc.total += 1;
        acc.byPriority[opportunity.priority] += 1;
        acc.byStage[opportunity.stage] += 1;
        return acc;
      },
      {
        total: 0,
        byPriority: { High: 0, Medium: 0, Low: 0 },
        byStage: { 'In Progress': 0, 'Awaiting Reply': 0, New: 0 },
      },
    );
  }, []);

  return (
    <section className="opportunities-page">
      <div className="page-intro">
        <h1 className="page-title">Opportunities</h1>
        <p className="helper-text">Track partnerships, roles, and outreach as an executive-grade pipeline.</p>
      </div>

      <div className="opportunities-summary">
        <article className="summary-card">
          <p className="summary-card__label">Total Opportunities</p>
          <h3 className="summary-card__value">{metrics.total}</h3>
        </article>

        <article className="summary-card">
          <p className="summary-card__label">High Priority</p>
          <h3 className="summary-card__value">{metrics.byPriority.High}</h3>
        </article>

        <article className="summary-card">
          <p className="summary-card__label">In Progress</p>
          <h3 className="summary-card__value">{metrics.byStage['In Progress']}</h3>
        </article>
      </div>

      <SectionCard title="Pipeline Overview" actionText="Add Opportunity">
        <div className="crm-table">
          <div className="crm-table__header">
            <p>Opportunity</p>
            <p>Company</p>
            <p>Priority</p>
            <p>Stage / Next Step</p>
          </div>

          {opportunities.map((item) => (
            <div key={item.id} className="crm-table__row">
              <div className="crm-table__cell">
                <p className="crm-table__title">{item.name}</p>
              </div>
              <div className="crm-table__cell">
                <p className="crm-table__subtitle">{item.company}</p>
              </div>
              <div className="crm-table__cell">
                <span className={`pill pill--${priorityTone[item.priority] || 'low'}`}>
                  {item.priority}
                </span>
              </div>
              <div className="crm-table__cell">
                <p className="crm-table__subtitle">
                  <span className={`pill pill--${stageTone[item.stage] || 'low'}`}>{item.stage}</span>{' '}
                  {item.nextStep}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </section>
  );
}

export default Opportunities;
