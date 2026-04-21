import { weeklyPriorities as defaultPriorities, weeklyWins as defaultWins, weeklyBlockers as defaultBlockers } from '../data/mockData';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import ConfirmModal from '../components/ui/ConfirmModal';
import WeeklyPriorities from '../components/weekly/WeeklyPriorities';
import WeeklyTextList from '../components/weekly/WeeklyTextList';
import WeeklyEditorModal from '../components/weekly/WeeklyEditorModal';
import Textarea from '../components/ui/Textarea';
import { usePersistentState } from '../hooks/usePersistentState';
import { useWeeklyBriefEditor } from '../hooks/useWeeklyBriefEditor';
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

  const {
    editorState,
    formValues,
    formError,
    isEditorOpen,
    isEditing,
    isDeleteConfirmOpen,
    editorTitle,
    deletePrompt,
    closeEditor,
    closeDeleteConfirm,
    openCreateEditor,
    openEditEditor,
    handleFormChange,
    handleDelete,
    handleConfirmDelete,
    handleEditorSubmit,
  } = useWeeklyBriefEditor({
    defaultPriorities,
    defaultWins,
    defaultBlockers,
    setStoredPriorities,
    setStoredWins,
    setStoredBlockers,
  });

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
        <SectionCard
          title="Priority Track"
          actionText="Add Priority"
          onAction={() => openCreateEditor('priority')}
          actionLabel="Add weekly priority"
        >
          {priorityItems.length ? (
            <WeeklyPriorities
              items={priorityItems}
              onEditItem={(item) => openEditEditor('priority', item)}
              onDeleteItem={(item) => handleDelete('priority', item)}
            />
          ) : (
            <p className="helper-text">No priorities yet. Add one to define this week&apos;s focus.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Wins / Momentum"
          actionText="Add Win"
          onAction={() => openCreateEditor('win')}
          actionLabel="Add weekly win"
        >
          {winItems.length ? (
            <WeeklyTextList
              items={winItems}
              itemTypeLabel="win"
              getDotClassName={() => 'weekly-list__dot--success'}
              getPrimaryText={(item) => item.text}
              getSecondaryText={(item) => `Category: ${item.category}`}
              onEditItem={(item) => openEditEditor('win', item)}
              onDeleteItem={(item) => handleDelete('win', item)}
            />
          ) : (
            <p className="helper-text">No wins captured yet. Add one to preserve momentum context.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Top Blockers"
          actionText="Add Blocker"
          onAction={() => openCreateEditor('blocker')}
          actionLabel="Add weekly blocker"
        >
          {blockerItems.length ? (
            <WeeklyTextList
              items={blockerItems}
              itemTypeLabel="blocker"
              getDotClassName={(item) => `weekly-list__dot--${item.severity}`}
              getPrimaryText={(item) => item.text}
              onEditItem={(item) => openEditEditor('blocker', item)}
              onDeleteItem={(item) => handleDelete('blocker', item)}
            />
          ) : (
            <p className="helper-text">No blockers logged. Add blockers to keep risk visible.</p>
          )}
        </SectionCard>

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

      <WeeklyEditorModal
        isOpen={isEditorOpen}
        title={editorTitle}
        editorType={editorState.type}
        formValues={formValues}
        formError={formError}
        isEditing={isEditing}
        onClose={closeEditor}
        onSubmit={handleEditorSubmit}
        onFormChange={handleFormChange}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Item"
        message={deletePrompt}
        onCancel={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        cancelLabel="Cancel"
        confirmLabel="Delete"
        cancelAriaLabel="Cancel item delete"
        confirmAriaLabel="Confirm item delete"
      />
    </section>
  );
}

export default WeeklyBrief;
