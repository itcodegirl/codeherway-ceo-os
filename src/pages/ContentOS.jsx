import { contentItems } from '../data/mockData';
import SectionCard from '../components/ui/SectionCard';
import '../styles/content.css';

function ContentOS() {
  const statusCounts = {
    Drafting: contentItems.filter((item) => item.status === 'Drafting').length,
    Editing: contentItems.filter((item) => item.status === 'Editing').length,
    Scheduled: contentItems.filter((item) => item.status === 'Scheduled').length,
  };

  return (
    <section className="content-page">
      <div className="page-intro">
        <h1 className="page-title">Content OS</h1>
        <p className="helper-text">
          Plan, track, and ship founder content across platforms with a clear publishing workflow.
        </p>
      </div>

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

      <SectionCard title="Publishing Workflow" actionText="Add Content">
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
      </SectionCard>
    </section>
  );
}

export default ContentOS;
