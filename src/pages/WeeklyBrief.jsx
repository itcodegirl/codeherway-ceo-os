import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import SummaryCards from '../components/ui/SummaryCards';
import Button from '../components/ui/Button';
import PrioritiesSection from '../components/weekly/PrioritiesSection';
import WinsSection from '../components/weekly/WinsSection';
import BlockersSection from '../components/weekly/BlockersSection';
import Textarea from '../components/ui/Textarea';
import {
  defaultBlockers,
  defaultPriorities,
  defaultWins,
} from '../lib/weeklyData';
import { useWeeklyBrief } from '../hooks/useWeeklyBrief';
import '../styles/forms.css';
import '../styles/weekly.css';

function WeeklyBrief() {
  const {
    source,
    isLoading,
    loadError,
    reviewNotes,
    priorities,
    wins,
    blockers,
    setReviewNotes,
    setPriorities,
    setWins,
    setBlockers,
    refreshWeeklyBrief,
  } = useWeeklyBrief();

  const priorityItems = Array.isArray(priorities) ? priorities : defaultPriorities;
  const winItems = Array.isArray(wins) ? wins : defaultWins;
  const blockerItems = Array.isArray(blockers) ? blockers : defaultBlockers;

  return (
    <section className="weekly-page">
      <PageHeader
        title="Weekly Brief"
        description="A weekly planning and review checkpoint to keep momentum explicit."
      />

      <p className="helper-text weekly-source-note">
        {source === 'supabase'
          ? 'Data source: Supabase (live persistence).'
          : 'Data source: local persistent storage in this browser.'}
      </p>
      {loadError ? (
        <div className="helper-inline-actions">
          <p className="helper-text weekly-error" role="alert">{loadError}</p>
          <Button
            type="button"
            size="small"
            onClick={() => {
              void refreshWeeklyBrief();
            }}
            ariaLabel="Retry loading weekly brief"
          >
            Retry
          </Button>
        </div>
      ) : null}
      {isLoading ? <p className="sr-only" role="status" aria-live="polite">Loading weekly brief.</p> : null}

      <SummaryCards
        className="weekly-overview"
        isLoading={isLoading}
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
          items={priorityItems}
          setItems={setPriorities}
          defaultItems={defaultPriorities}
        />

        <WinsSection
          items={winItems}
          setItems={setWins}
          defaultItems={defaultWins}
        />

        <BlockersSection
          items={blockerItems}
          setItems={setBlockers}
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
