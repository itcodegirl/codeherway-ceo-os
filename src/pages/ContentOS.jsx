import { useEffect, useState } from 'react';
import { contentItems } from '../data/mockData';
import SectionCard from '../components/ui/SectionCard';
import EmptyState from '../components/ui/EmptyState';
import '../styles/content.css';

function ContentOS() {
  const [isLoading, setIsLoading] = useState(true);

  const statusCounts = {
    Drafting: contentItems.filter((item) => item.status === 'Drafting').length,
    Editing: contentItems.filter((item) => item.status === 'Editing').length,
    Scheduled: contentItems.filter((item) => item.status === 'Scheduled').length,
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 280);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="content-page">
      <div className="page-intro">
        <h1 className="page-title">Content OS</h1>
        <p className="helper-text">
          Plan, track, and ship founder content across platforms with a clear publishing workflow.
        </p>
      </div>

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

      <SectionCard title="Publishing Workflow" actionText="Add Content">
        {isLoading ? (
          <div className="content-board">
            <p className="sr-only" role="status" aria-live="polite">
              Loading content cards.
            </p>
            {Array.from({ length: 3 }).map((_, index) => (
              <article className="content-card" key={index}>
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
          <div className="content-board">
            {contentItems.map((item) => (
              <article key={item.id} className="content-card">
                <div className="content-card__header">
                  <div>
                    <h3 className="content-card__title">{item.title}</h3>
                    <p className="content-card__platform">{item.platform}</p>
                  </div>

                  <span className={`content-status content-status--${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>

                <div className="content-card__footer">
                  <span className="content-card__meta-label">Channel</span>
                  <strong>{item.platform}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </section>
  );
}

export default ContentOS;
