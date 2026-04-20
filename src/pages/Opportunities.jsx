import { useEffect, useMemo, useState } from 'react';
import { opportunities } from '../data/mockData';
import SectionCard from '../components/ui/SectionCard';
import EmptyState from '../components/ui/EmptyState';
import '../styles/opportunities.css';

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
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 260);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="opportunities-page">
      <div className="page-intro">
        <h1 className="page-title">Opportunities</h1>
        <p className="helper-text">Track partnerships, roles, and outreach as an executive-grade pipeline.</p>
      </div>

      {isLoading ? <p className="sr-only" role="status" aria-live="polite">Loading opportunities data.</p> : null}

      {isLoading ? (
        <div className="opportunities-summary" aria-busy={isLoading}>
          <article className="summary-card">
            <div className="skeleton-line skeleton-line--label" />
            <div className="skeleton-line skeleton-line--value" />
          </article>
          <article className="summary-card">
            <div className="skeleton-line skeleton-line--label" />
            <div className="skeleton-line skeleton-line--value" />
          </article>
          <article className="summary-card">
            <div className="skeleton-line skeleton-line--label" />
            <div className="skeleton-line skeleton-line--value" />
          </article>
        </div>
      ) : (
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
      )}

      <SectionCard
        title="Pipeline Overview"
        actionText="Add Opportunity"
        actionTo="/opportunities"
        actionLabel="Open the opportunities pipeline creator"
      >
        {isLoading ? (
          <div className="crm-table" role="table" aria-label="Opportunity pipeline" aria-busy={isLoading}>
            <p className="sr-only" role="status" aria-live="polite">
              Loading pipeline rows.
            </p>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="crm-table__row">
                <div className="crm-table__cell" role="cell" data-label="Opportunity">
                  <div className="skeleton-line" />
                </div>
                <div className="crm-table__cell" role="cell" data-label="Company">
                  <div className="skeleton-line" />
                </div>
                <div className="crm-table__cell" role="cell" data-label="Priority">
                  <div className="skeleton-line" />
                </div>
                <div className="crm-table__cell" role="cell" data-label="Stage / Next step">
                  <div className="skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <EmptyState title="No opportunities yet" description="Add the first opportunity to populate this pipeline." />
        ) : (
          <div className="crm-table" role="table" aria-label="Opportunity pipeline">
            <p className="sr-only" role="status" aria-live="polite">
              Showing {opportunities.length} opportunities.
            </p>
            <div className="crm-table__header" role="row">
              <p role="columnheader">Opportunity</p>
              <p role="columnheader">Company</p>
              <p role="columnheader">Priority</p>
              <p role="columnheader">Stage / Next Step</p>
            </div>

            {opportunities.map((item) => (
              <div key={item.id} className="crm-table__row" role="row">
                <div className="crm-table__cell" role="cell" data-label="Opportunity">
                  <p className="crm-table__title">{item.name}</p>
                </div>
                <div className="crm-table__cell" role="cell" data-label="Company">
                  <p className="crm-table__subtitle">{item.company}</p>
                </div>
                <div className="crm-table__cell" role="cell" data-label="Priority">
                  <span className={`pill pill--${priorityTone[item.priority] || 'low'}`}>
                    {item.priority}
                  </span>
                </div>
                <div className="crm-table__cell" role="cell" data-label="Stage / Next Step">
                  <p className="crm-table__subtitle">
                    <span className={`pill pill--${stageTone[item.stage] || 'low'}`}>{item.stage}</span>{' '}
                    {item.nextStep}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </section>
  );
}

export default Opportunities;
