import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import SummaryCards from '../components/ui/SummaryCards';
import PrioritiesSection from '../components/weekly/PrioritiesSection';
import WinsSection from '../components/weekly/WinsSection';
import BlockersSection from '../components/weekly/BlockersSection';
import Textarea from '../components/ui/Textarea';
import {
  DEFAULT_REVIEW_NOTES,
  defaultBlockers,
  defaultPriorities,
  defaultWins,
} from '../lib/weeklyData';
import { usePersistentState } from '../hooks/usePersistentState';
import '../styles/forms.css';
import '../styles/weekly.css';

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

      <SummaryCards
        className="weekly-overview"
        cards={[
          {
            id: 'weekly-priorities',
            label: 'Active Priorities',
            value: priorityItems.length,
            description: 'Priorities currently scheduled across roles, content, and partnerships.',
          },
          {
            id: 'weekly-wins',
            label: 'Wins This Week',
            value: winItems.length,
            description: 'Progress markers you can cite in a status update.',
          },
          {
            id: 'weekly-blockers',
            label: 'Open Blockers',
            value: blockerItems.length,
            description: 'Risks that need active follow-up.',
          },
        ]}
      />

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
