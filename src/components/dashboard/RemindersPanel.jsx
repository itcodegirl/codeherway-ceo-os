import { useMemo, useState } from 'react';
import Button from '../ui/Button';

function ReminderRow({
  item,
  onToggleReminder,
  onPromoteReminder,
  onDeleteReminder,
  onEditReminder,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);

  const startEdit = () => {
    setDraft(item.text);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(item.text);
    setIsEditing(false);
  };

  const saveEdit = () => {
    const next = typeof draft === 'string' ? draft.trim() : '';
    if (!next || next === item.text) {
      cancelEdit();
      return;
    }
    if (typeof onEditReminder === 'function') {
      const ok = onEditReminder(item.id, next);
      if (ok === false) {
        return;
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEdit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  };

  const className = item.isDone
    ? 'focus-reminder-list__item focus-reminder-list__item--done'
    : 'focus-reminder-list__item';

  return (
    <li className={className}>
      <label>
        <input
          type="checkbox"
          checked={item.isDone}
          onChange={(event) => onToggleReminder(item.id, event.target.checked)}
        />
        {isEditing ? (
          <input
            type="text"
            className="focus-reminder-list__edit"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label={`Edit reminder ${item.text}`}
          />
        ) : (
          <span>{item.text}</span>
        )}
      </label>
      <div className="focus-reminder-list__actions">
        {!isEditing && typeof onEditReminder === 'function' && !item.isDone ? (
          <button
            type="button"
            className="focus-reminder-list__edit-button"
            aria-label={`Edit reminder ${item.text}`}
            onClick={startEdit}
          >
            Edit
          </button>
        ) : null}
        {!isEditing && typeof onPromoteReminder === 'function' && !item.isDone ? (
          <button
            type="button"
            className="focus-reminder-list__promote"
            aria-label={`Promote reminder ${item.text} to a weekly priority`}
            onClick={() => onPromoteReminder(item)}
          >
            Promote
          </button>
        ) : null}
        {!isEditing ? (
          <button
            type="button"
            className="focus-reminder-list__delete"
            aria-label={`Delete reminder ${item.text}`}
            onClick={() => onDeleteReminder(item.id)}
          >
            Remove
          </button>
        ) : null}
      </div>
    </li>
  );
}

function RemindersPanel({
  reminderDraft,
  onReminderDraftChange,
  isAddingReminder,
  onAddReminderSubmit,
  reminderProgress,
  visibleReminders,
  suggestions,
  onToggleReminder,
  onDeleteReminder,
  onPromoteReminder,
  onEditReminder,
}) {
  // Keep completed reminders hidden by default so the list doesn't grow into
  // a backlog of finished work. Users can opt-in to seeing them.
  const [showCompleted, setShowCompleted] = useState(false);
  // Single pass over visibleReminders for both derived values. Dashboard
  // re-renders frequently (focus mode, next-move clicks, debounced reminder
  // adds) so keeping this O(n) once instead of twice avoids waste.
  const { completedCount, filteredReminders } = useMemo(() => {
    let completed = 0;
    const filtered = [];
    for (const item of visibleReminders) {
      if (item.isDone) {
        completed += 1;
        if (showCompleted) {
          filtered.push(item);
        }
      } else {
        filtered.push(item);
      }
    }
    return { completedCount: completed, filteredReminders: filtered };
  }, [visibleReminders, showCompleted]);
  const hasItems = filteredReminders.length > 0;

  return (
    <article
      className="focus-panel"
      aria-label="Reminders panel"
      aria-busy={isAddingReminder ? 'true' : undefined}
    >
      <div className="focus-panel__header">
        <h2>Reminders</h2>
        <span className="signal-node" aria-hidden="true" />
      </div>
      <form className="focus-reminder-form" onSubmit={onAddReminderSubmit}>
        <label className="sr-only" htmlFor="focus-reminder-input">
          Add reminder
        </label>
        <input
          id="focus-reminder-input"
          type="text"
          value={reminderDraft}
          onChange={(event) => onReminderDraftChange(event.target.value)}
          placeholder="Add a quick reminder"
          aria-describedby="focus-reminder-helper focus-reminder-progress"
          disabled={isAddingReminder}
        />
        <Button
          type="submit"
          size="small"
          icon={{ name: 'add' }}
          disabled={isAddingReminder}
          ariaLabel={isAddingReminder ? 'Adding reminder' : undefined}
        >
          {isAddingReminder ? 'Adding...' : 'Add'}
        </Button>
      </form>
      <p id="focus-reminder-helper" className="helper-text focus-reminder-helper">
        Keep it small enough to finish today.
      </p>

      <p id="focus-reminder-progress" className="focus-reminder-progress" aria-live="polite">
        {reminderProgress.total > 0
          ? `${reminderProgress.completed} of ${reminderProgress.total} reminders complete (${reminderProgress.completionRate}%)`
          : 'No reminder progress yet.'}
      </p>

      {completedCount > 0 ? (
        <button
          type="button"
          className="focus-reminder-list__toggle-completed"
          aria-pressed={showCompleted}
          onClick={() => setShowCompleted((prev) => !prev)}
        >
          {showCompleted
            ? `Hide ${completedCount} completed`
            : `Show ${completedCount} completed`}
        </button>
      ) : null}

      <ul className="focus-reminder-list">
        {hasItems ? filteredReminders.map((item) => (
          <ReminderRow
            key={item.id}
            item={item}
            onToggleReminder={onToggleReminder}
            onPromoteReminder={onPromoteReminder}
            onDeleteReminder={onDeleteReminder}
            onEditReminder={onEditReminder}
          />
        )) : (
          <li className="focus-reminder-list__item focus-reminder-list__item--empty">
            <span>No reminders yet. Add one small commitment.</span>
          </li>
        )}
      </ul>

      <p className="focus-home__subheading">Suggestions</p>
      <ul className="focus-list" aria-live="polite">
        {suggestions.map((item) => (
          <li key={item.id}>
            <p>{item.text}</p>
            {item.context ? <p className="helper-text">{item.context}</p> : null}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default RemindersPanel;
