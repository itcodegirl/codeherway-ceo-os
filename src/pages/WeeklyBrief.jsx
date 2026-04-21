import { weeklyPriorities, weeklyWins, weeklyBlockers } from '../data/mockData';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import WeeklyPriorities from '../components/weekly/WeeklyPriorities';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../styles/weekly.css';

function WeeklyBrief() {
  useDocumentTitle('Weekly Brief');

  return (
    <section className="weekly-page">
      <PageHeader
        title="Weekly Brief"
        description="A weekly planning and review checkpoint to keep momentum explicit."
      />

      <div className="weekly-overview">
        <article className="summary-card">
          <p className="summary-card__label">Active Priorities</p>
          <h3 className="summary-card__value">{weeklyPriorities.length}</h3>
          <p className="helper-text">Priorities currently scheduled across roles, content, and partnerships.</p>
        </article>

        <article className="summary-card">
          <p className="summary-card__label">Wins This Week</p>
          <h3 className="summary-card__value">{weeklyWins.length}</h3>
          <p className="helper-text">Progress markers you can cite in a status update.</p>
        </article>

        <article className="summary-card">
          <p className="summary-card__label">Open Blockers</p>
          <h3 className="summary-card__value">{weeklyBlockers.length}</h3>
          <p className="helper-text">Risks that need active follow-up.</p>
        </article>
      </div>

      <div className="weekly-grid">
        <SectionCard title="Priority Track">
          <WeeklyPriorities items={weeklyPriorities} />
        </SectionCard>

        <SectionCard title="Wins / Momentum">
          <ul className="weekly-list">
            {weeklyWins.map((item) => (
              <li key={item.id} className="weekly-list__item">
                <span className="weekly-list__dot weekly-list__dot--success" aria-hidden="true" />
                <div>
                  <p className="weekly-note">{item.text}</p>
                  <p className="helper-text helper-text--offset">
                    Category: {item.category}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Top Blockers">
          <ul className="weekly-list">
            {weeklyBlockers.map((item) => (
              <li key={item.id} className="weekly-list__item">
                <span className={`weekly-list__dot weekly-list__dot--${item.severity}`} aria-hidden="true" />
                <p className="weekly-note">{item.text}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Next Review Notes">
          <p className="weekly-note">
            Capture outcomes at close of week in plain language: what moved, what stalled, and what your next
            executive move is for the coming seven days.
          </p>
        </SectionCard>
      </div>
    </section>
  );
}

export default WeeklyBrief;


