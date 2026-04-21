import { useEffect, useMemo, useState } from 'react';
import { opportunities } from '../data/mockData';
import SectionCard from '../components/ui/SectionCard';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import OpportunityTable from '../components/opportunities/OpportunityTable';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import '../styles/opportunities.css';

const stageTone = {
  'In Progress': 'high',
  'Awaiting Reply': 'warning',
  New: 'low',
};

function Opportunities() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

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
      <PageHeader
        title="Opportunities"
        description="Track partnerships, roles, and outreach as an executive-grade pipeline."
      />

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

      <SectionCard title="Pipeline Overview">
        {isLoading ? (
          <div className="crm-table" role="table" aria-label="Opportunity pipeline" aria-busy={isLoading}>
            <p className="sr-only" role="status" aria-live="polite">
              Loading pipeline rows.
            </p>
            <div className="crm-table__header" role="row">
              <p role="columnheader">Opportunity</p>
              <p role="columnheader">Company</p>
              <p role="columnheader">Priority</p>
              <p role="columnheader">Stage / Next Step</p>
            </div>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="crm-table__row" role="row">
                <div className="crm-table__cell" role="cell" data-label="Opportunity">
                  <div className="skeleton-line" />
                </div>
                <div className="crm-table__cell" role="cell" data-label="Company">
                  <div className="skeleton-line" />
                </div>
                <div className="crm-table__cell" role="cell" data-label="Priority">
                  <div className="skeleton-line" />
                </div>
                <div className="crm-table__cell" role="cell" data-label="Stage / Next Step">
                  <div className="skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <EmptyState title="No opportunities yet" description="Add the first opportunity to populate this pipeline." />
        ) : (
          <div>
            <p className="sr-only" role="status" aria-live="polite">
              Showing {opportunities.length} opportunities.
            </p>
            <OpportunityTable items={opportunities} onSelect={setSelectedOpportunity} />
          </div>
        )}
      </SectionCard>

      <Modal
        isOpen={Boolean(selectedOpportunity)}
        title={selectedOpportunity ? selectedOpportunity.name : ''}
        onClose={() => setSelectedOpportunity(null)}
      >
        {selectedOpportunity ? (
          <>
            <p className="helper-text">Company: {selectedOpportunity.company}</p>
            <p className="helper-text">
              Priority: <Badge label={selectedOpportunity.priority} tone={selectedOpportunity.priority.toLowerCase()} />
            </p>
            <p className="helper-text">
              Stage: <Badge label={selectedOpportunity.stage} tone={stageTone[selectedOpportunity.stage] || 'low'} />
            </p>
            <p className="helper-text">Next step: {selectedOpportunity.nextStep}</p>
          </>
        ) : null}
      </Modal>
    </section>
  );
}

export default Opportunities;
