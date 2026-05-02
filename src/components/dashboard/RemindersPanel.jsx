import Button from '../ui/Button';

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
}) {
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

      <ul className="focus-reminder-list">
        {visibleReminders.length ? visibleReminders.map((item) => (
          <li
            key={item.id}
            className={item.isDone
              ? 'focus-reminder-list__item focus-reminder-list__item--done'
              : 'focus-reminder-list__item'}
          >
            <label>
              <input
                type="checkbox"
                checked={item.isDone}
                onChange={(event) => onToggleReminder(item.id, event.target.checked)}
              />
              <span>{item.text}</span>
            </label>
            <button
              type="button"
              className="focus-reminder-list__delete"
              aria-label={`Delete reminder ${item.text}`}
              onClick={() => onDeleteReminder(item.id)}
            >
              Remove
            </button>
          </li>
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
