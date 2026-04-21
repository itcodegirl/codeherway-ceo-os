import { weeklyPriorities as defaultPriorities, weeklyWins as defaultWins, weeklyBlockers as defaultBlockers } from '../data/mockData';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import PrioritiesSection from '../components/weekly/PrioritiesSection';
import WinsSection from '../components/weekly/WinsSection';
import BlockersSection from '../components/weekly/BlockersSection';
import Textarea from '../components/ui/Textarea';
import { usePersistentState } from '../hooks/usePersistentState';
import '../styles/weekly.css';

const DEFAULT_REVIEW_NOTES = '';

function WeeklyBrief() {
  const [storedPriorities, setStoredPriorities] = usePersistentState('ceo-os-weekly-priorities', defaultPriorities);
  const [storedWins, setStoredWins] = usePersistentState('ceo-os-weekly-wins', defaultWins);
  const [storedBlockers, setStoredBlockers] = usePersistentState('ceo-os-weekly-blockers', defaultBlockers);
  const [reviewNotes, setReviewNotes] = usePersistentState('ceo-os-weekly-review-notes', DEFAULT_REVIEW_NOTES);

  const priorityItems = Array.isArray(storedPriorities) ? storedPriorities : defaultPriorities;
  const winItems = Array.isArray(storedWins) ? storedWins : defaultWins;
  const blockerItems = Array.isArray(storedBlockers) ? storedBlockers : defaultBlockers;

  return (
    <section className="weekly-page">
      <PageHeader
        title="Weekly Brief"
        description="A weekly planning and review checkpoint to keep momentum explicit."
      />

      <p className="helper-text weekly-source-note" role="status" aria-live="polite">
        Data source: local persistent storage in this browser.
      </p>

      <div className="weekly-overview">
        <article className="summary-card">
          <p className="summary-card__label">Active Priorities</p>
          <h3 className="summary-card__value">{priorityItems.length}</h3>
          <p className="helper-text">Priorities currently scheduled across roles, content, and partnerships.</p>
        </article>

        <article className="summary-card">
          <p className="summary-card__label">Wins This Week</p>
          <h3 className="summary-card__value">{winItems.length}</h3>
          <p className="helper-text">Progress markers you can cite in a status update.</p>
        </article>

        <article className="summary-card">
          <p className="summary-card__label">Open Blockers</p>
          <h3 className="summary-card__value">{blockerItems.length}</h3>
          <p className="helper-text">Risks that need active follow-up.</p>
        </article>
      </div>

      <div className="weekly-grid">
        <PrioritiesSection
          items={storedPriorities}
          setItems={setStoredPriorities}
          defaultItems={defaultPriorities}
        />

        <WinsSection
          items={storedWins}
          setItems={setStoredWins}
          defaultItems={defaultWins}
        />

        <BlockersSection
          items={storedBlockers}
          setItems={setStoredBlockers}
          defaultItems={defaultBlockers}
        />

        <SectionCard title="Next Review Notes">
          <Textarea
            id="weekly-review-notes"
            label="Close-Of-Week Reflection"
            className="form-field weekly-review-notes__field"
            labelClassName="form-field__label"
            controlClassName="weekly-review-notes__control"
            value={reviewNotes}
            onChange={(event) => setReviewNotes(event.target.value)}
            rows={5}
            placeholder="Capture outcomes at close of week in plain language: what moved, what stalled, and what your next executive move is for the coming seven days."
          />
          <p className="helper-text">Notes are saved automatically in your browser.</p>
        </SectionCard>
      </div>
    </section>
  );
}

export default WeeklyBrief;
