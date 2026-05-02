import { useEffect, useRef, useState } from 'react';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import SummaryCards from '../components/ui/SummaryCards';
import SourceStatusNotice from '../components/ui/SourceStatusNotice';
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
import { buildAutosaveHelperText } from '../lib/uiCopy';
import '../styles/forms.css';
import '../styles/weekly.css';

const REVIEW_NOTES_DEBOUNCE_MS = 600;

function describeReviewNotesStatus({ status, hasPending, hasError }) {
  if (hasError) {
    return { tone: 'error', text: 'Couldn’t save your reflection. We’ll keep trying.' };
  }
  if (hasPending || status === 'saving') {
    return { tone: 'saving', text: 'Saving your reflection…' };
  }
  if (status === 'saved') {
    return { tone: 'saved', text: 'Saved.' };
  }
  return { tone: 'idle', text: 'Notes are saved automatically for this workspace.' };
}

function WeeklyBrief() {
  const {
    source,
    isLoading,
    loadError,
    reviewNotes,
    reviewNotesStatus,
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
  const reviewNotesHelper = buildAutosaveHelperText({
    hasError: Boolean(loadError),
    healthyText: 'Notes are saved automatically for this workspace.',
    pausedText: 'Autosave is paused until the weekly brief saves successfully again.',
  });

  // Debounced review-notes autosave. Local draft mirrors the input synchronously
  // so typing stays instant; commits to the hook fire 600ms after the last keystroke.
  const [reviewNotesDraft, setReviewNotesDraft] = useState(reviewNotes);
  const draftRef = useRef(reviewNotes);
  const debounceTimerRef = useRef(null);
  const [hasPendingSave, setHasPendingSave] = useState(false);

  useEffect(() => {
    if (reviewNotesStatus !== 'saving' && reviewNotes !== draftRef.current) {
      draftRef.current = reviewNotes;
      setReviewNotesDraft(reviewNotes);
    }
  }, [reviewNotes, reviewNotesStatus]);

  useEffect(() => () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
  }, []);

  const handleReviewNotesChange = (event) => {
    const value = event.target.value;
    draftRef.current = value;
    setReviewNotesDraft(value);
    setHasPendingSave(true);
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      setHasPendingSave(false);
      setReviewNotes(draftRef.current);
    }, REVIEW_NOTES_DEBOUNCE_MS);
  };

  const reviewNotesStatusDescriptor = describeReviewNotesStatus({
    status: reviewNotesStatus,
    hasPending: hasPendingSave,
    hasError: Boolean(loadError) || reviewNotesStatus === 'error',
  });

  return (
    <section className="weekly-page">
      <PageHeader
        title="Weekly Brief"
        description="A weekly planning and review checkpoint to keep momentum explicit."
      />

      <SourceStatusNotice
        source={source}
        loadError={loadError}
        onRetry={refreshWeeklyBrief}
        retryAriaLabel="Retry loading weekly brief"
      />
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

      <p className="helper-text">
        Use each section&apos;s <strong>Add</strong> button to open the editor, then use row-level <strong>Edit</strong> and <strong>Delete</strong> actions to manage items.
      </p>

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

        <SectionCard title="Next Review Notes" iconName="weekly">
          <Textarea
            id="weekly-review-notes"
            label="Close-Of-Week Reflection"
            className="form-field weekly-review-notes__field"
            labelClassName="form-field__label"
            controlClassName="weekly-review-notes__control"
            value={reviewNotesDraft}
            onChange={handleReviewNotesChange}
            rows={5}
            placeholder="Capture outcomes at close of week in plain language: what moved, what stalled, and what your next executive move is for the coming seven days."
          />
          {reviewNotesStatusDescriptor.tone !== 'idle' ? (
            <p
              className={`helper-text weekly-review-notes__status weekly-review-notes__status--${reviewNotesStatusDescriptor.tone}`}
              aria-live="polite"
              data-status={reviewNotesStatusDescriptor.tone}
            >
              <span aria-hidden="true" className="weekly-review-notes__status-dot" />
              {reviewNotesStatusDescriptor.text}
            </p>
          ) : null}
          <p className="helper-text" aria-live="polite">{reviewNotesHelper}</p>
        </SectionCard>
      </div>
    </section>
  );
}

export default WeeklyBrief;
