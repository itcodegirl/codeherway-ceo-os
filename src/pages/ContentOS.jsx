import { useEffect, useMemo, useState } from 'react';
import { contentItems } from '../data/mockData';
import SectionCard from '../components/ui/SectionCard';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import ContentTable from '../components/content/ContentTable';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import '../styles/content.css';

const statusTone = {
  Drafting: 'low',
  Editing: 'warning',
  Scheduled: 'high',
};

function ContentOS() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const statusCounts = useMemo(
    () =>
      contentItems.reduce(
        (counts, item) => {
          if (counts[item.status] !== undefined) {
            counts[item.status] += 1;
          }
          return counts;
        },
        { Drafting: 0, Editing: 0, Scheduled: 0 },
      ),
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 280);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="content-page">
      <PageHeader
        title="Content OS"
        description="Plan, track, and ship founder content across platforms with a clear publishing workflow."
      />

      {isLoading ? <p className="sr-only" role="status" aria-live="polite">Loading content board data.</p> : null}

      {isLoading ? (
        <div className="content-summary" aria-busy={isLoading}>
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
        <div className="content-summary">
          <article className="summary-card">
            <p className="summary-card__label">Drafting</p>
            <h3 className="summary-card__value">{statusCounts.Drafting}</h3>
          </article>

          <article className="summary-card">
            <p className="summary-card__label">Editing</p>
            <h3 className="summary-card__value">{statusCounts.Editing}</h3>
          </article>

          <article className="summary-card">
            <p className="summary-card__label">Scheduled</p>
            <h3 className="summary-card__value">{statusCounts.Scheduled}</h3>
          </article>
        </div>
      )}

      <SectionCard title="Publishing Workflow">
        {isLoading ? (
          <div className="content-board" role="list" aria-label="Publishing workflow cards" aria-busy={isLoading}>
            <p className="sr-only" role="status" aria-live="polite">
              Loading content cards.
            </p>
            {Array.from({ length: 3 }).map((_, index) => (
              <article className="content-card" key={index} role="listitem">
                <div className="content-card__header">
                  <div>
                    <div className="skeleton-line skeleton-line--value" />
                    <div className="skeleton-line skeleton-line--offset" />
                  </div>
                  <div className="skeleton-line skeleton-line--meta-wide" />
                </div>
                <div className="content-card__footer">
                  <div className="skeleton-line skeleton-line--meta-narrow" />
                  <div className="skeleton-line skeleton-line--meta-narrow" />
                </div>
              </article>
            ))}
          </div>
        ) : contentItems.length === 0 ? (
          <EmptyState title="No content items yet" description="Add your first draft, and your workflow cards will appear here." />
        ) : (
          <ContentTable items={contentItems} onOpenItem={setSelectedItem} />
        )}
      </SectionCard>

      <Modal isOpen={Boolean(selectedItem)} title={selectedItem ? selectedItem.title : ''} onClose={() => setSelectedItem(null)}>
        {selectedItem ? (
          <>
            <p className="helper-text">Platform: {selectedItem.platform}</p>
            <p className="helper-text">
              Status: <Badge label={selectedItem.status} tone={statusTone[selectedItem.status] || 'default'} />
            </p>
          </>
        ) : null}
      </Modal>
    </section>
  );
}

export default ContentOS;
