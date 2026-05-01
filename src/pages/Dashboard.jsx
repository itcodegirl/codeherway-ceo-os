import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import SourceStatusNotice from '../components/ui/SourceStatusNotice';
import { isLocalDashboardDemoMode, useDashboardData } from '../hooks/useDashboardData';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToast } from '../hooks/useToast';
import { useWeeklyBrief } from '../hooks/useWeeklyBrief';
import { CAPTURE_NOTES_UPDATED_EVENT, listCaptureNotes } from '../lib/captureRepository';
import {
  getJournalEntryByDate,
  getTodayJournalDateKey,
  JOURNAL_ENTRIES_UPDATED_EVENT,
} from '../lib/journalRepository';
import {
  createReminder,
  deleteReminder,
  getReminderProgress,
  listReminders,
  REMINDERS_UPDATED_EVENT,
  toggleReminder,
} from '../lib/remindersRepository';
import { buildDeterministicSuggestions } from '../lib/suggestions';
import {
  FOCUS_MODES,
  buildMainFocus,
  buildMomentumMessage,
  buildNextMoveQueue,
  buildQuickWin,
  resolveFocusMode,
} from '../lib/focusHomeLogic';
import { SOURCE_NOTICE_SAMPLE_DATA, buildSourceNotice } from '../lib/uiCopy';
import '../styles/dashboard.css';

function Dashboard() {
  const {
    toastMessage,
    isToastVisible,
    showToast,
  } = useToast();
  const [focusMode, setFocusMode] = usePersistentState('ceo-os-focus-mode', 'planning');
  const [nextMove, setNextMove] = useState('');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [captureNotes, setCaptureNotes] = useState(() => listCaptureNotes());
  const [journalEntry, setJournalEntry] = useState(() => getJournalEntryByDate(getTodayJournalDateKey()));
  const [reminders, setReminders] = useState(() => listReminders());
  const [reminderDraft, setReminderDraft] = useState('');
  const nextMoveCursorRef = useRef(0);

  const handleDashboardLoadError = useCallback((error) => {
    showToast('Unable to refresh your focus data right now.');
    if (import.meta.env.DEV) {
      console.error('Dashboard data load failed', error);
    }
  }, [showToast]);

  const {
    opportunityItems,
    contentRows,
    isDataLoading,
  } = useDashboardData({
    onLoadError: handleDashboardLoadError,
  });

  const {
    priorities: weeklyPriorities,
    blockers: weeklyBlockers,
    wins: weeklyWins,
    isLoading: isWeeklyLoading,
    source: weeklySource,
    loadError: weeklyLoadError,
    refreshWeeklyBrief,
  } = useWeeklyBrief();

  useEffect(() => {
    const syncCaptureNotes = () => {
      setCaptureNotes(listCaptureNotes());
    };
    const syncJournalEntry = () => {
      setJournalEntry(getJournalEntryByDate(getTodayJournalDateKey()));
    };
    const syncReminders = () => {
      setReminders(listReminders());
    };

    window.addEventListener(CAPTURE_NOTES_UPDATED_EVENT, syncCaptureNotes);
    window.addEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, syncJournalEntry);
    window.addEventListener(REMINDERS_UPDATED_EVENT, syncReminders);

    return () => {
      window.removeEventListener(CAPTURE_NOTES_UPDATED_EVENT, syncCaptureNotes);
      window.removeEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, syncJournalEntry);
      window.removeEventListener(REMINDERS_UPDATED_EVENT, syncReminders);
    };
  }, []);

  const supportCopy = useMemo(() => {
    const activeMode = resolveFocusMode(focusMode);
    return activeMode.support;
  }, [focusMode]);

  const nextMoveQueue = useMemo(() => buildNextMoveQueue({
    priorities: weeklyPriorities,
    blockers: weeklyBlockers,
    opportunities: opportunityItems,
    contentRows,
  }), [
    contentRows,
    opportunityItems,
    weeklyBlockers,
    weeklyPriorities,
  ]);

  const mainFocus = useMemo(
    () => buildMainFocus(weeklyPriorities, opportunityItems, contentRows),
    [contentRows, opportunityItems, weeklyPriorities],
  );

  const visibleReminders = useMemo(
    () => [...reminders].sort((left, right) => {
      if (Boolean(left?.isDone) === Boolean(right?.isDone)) {
        return 0;
      }

      return left?.isDone ? 1 : -1;
    }),
    [reminders],
  );
  const reminderProgress = useMemo(
    () => getReminderProgress(reminders),
    [reminders],
  );

  const suggestions = useMemo(() => buildDeterministicSuggestions({
    priorities: weeklyPriorities,
    blockers: weeklyBlockers,
    opportunities: opportunityItems,
    contentRows,
    notes: captureNotes,
    reminders,
    journalEntry,
  }), [
    captureNotes,
    contentRows,
    journalEntry,
    opportunityItems,
    reminders,
    weeklyBlockers,
    weeklyPriorities,
  ]);

  const quickWin = useMemo(
    () => buildQuickWin(weeklyWins, opportunityItems, contentRows),
    [contentRows, opportunityItems, weeklyWins],
  );

  const momentum = useMemo(() => buildMomentumMessage({
    inProgressCount: weeklyPriorities.filter((item) => item?.status === 'In Progress').length,
    blockerCount: weeklyBlockers.length,
    winsCount: weeklyWins.length,
    completedReminderCount: reminderProgress.completed,
    pendingReminderCount: reminderProgress.pending,
  }), [
    reminderProgress.completed,
    reminderProgress.pending,
    weeklyBlockers.length,
    weeklyPriorities,
    weeklyWins.length,
  ]);

  const blockerItems = useMemo(() => {
    if (weeklyBlockers.length === 0) {
      return ['No blockers logged. Keep protecting this focus window.'];
    }
    return weeklyBlockers.slice(0, 3).map((item) => item?.text || 'Unspecified blocker');
  }, [weeklyBlockers]);

  const activeNextMove = nextMove && nextMoveQueue.includes(nextMove) ? nextMove : '';
  const displayedNextMove = activeNextMove || nextMoveQueue[0] || 'Choose one tiny action and start a 15-minute timer.';

  const handleTellMeWhatToDoNext = () => {
    const move = nextMoveQueue[nextMoveCursorRef.current % nextMoveQueue.length]
      || 'Take one deep breath, choose one action, and complete it before context-switching.';
    nextMoveCursorRef.current += 1;
    setNextMove(move);
    showToast('Next move ready. Keep it tiny and time-boxed.');
  };

  const handleOverwhelmedReset = () => {
    setFocusMode('overwhelmed');
    setIsResetOpen(true);
    setNextMove(nextMoveQueue[0] || 'Do one two-minute task, then reassess.');
    showToast('Reset mode enabled. Start small and skip perfection today.');
  };

  const handleAddReminder = (event) => {
    event.preventDefault();
    const nextText = reminderDraft.trim();
    if (!nextText) {
      showToast('Add reminder text before saving.');
      return;
    }

    try {
      createReminder({ text: nextText });
      setReminderDraft('');
    } catch {
      showToast('Unable to save reminder right now.');
    }
  };

  const handleToggleReminder = (id, isDone) => {
    try {
      toggleReminder(id, isDone);
    } catch {
      showToast('Unable to update reminder right now.');
    }
  };

  const handleDeleteReminder = (id) => {
    try {
      deleteReminder(id);
    } catch {
      showToast('Unable to delete reminder right now.');
    }
  };

  const dashboardDemoNote = isLocalDashboardDemoMode
    ? SOURCE_NOTICE_SAMPLE_DATA
    : '';

  const isFocusDataLoading = isDataLoading || isWeeklyLoading;

  const resetSteps = useMemo(() => [
    'Pause for 60 seconds. Release jaw and shoulders.',
    `Do this next: ${displayedNextMove}`,
    'Set a 15-minute timer. Ignore everything else until it ends.',
  ], [displayedNextMove]);

  const handleFocusModeKeyDown = (event, currentIndex) => {
    const key = event.key;
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(key)) {
      return;
    }

    event.preventDefault();
    let nextIndex = currentIndex;
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % FOCUS_MODES.length;
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + FOCUS_MODES.length) % FOCUS_MODES.length;
    } else if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = FOCUS_MODES.length - 1;
    }

    const nextMode = FOCUS_MODES[nextIndex];
    setFocusMode(nextMode.id);
    const container = event.currentTarget?.closest?.('.focus-mode__chips');
    const nextButton = container?.querySelector?.(`[data-focus-mode="${nextMode.id}"]`);
    nextButton?.focus?.();
  };

  const modeClassName = resolveFocusMode(focusMode).id;

  return (
    <section className={`dashboard-page focus-home-page focus-home-page--${modeClassName}`}>
      <PageHeader
        title="Focus Home"
        description="Today / Focus Command Center for clear execution, supportive resets, and daily momentum."
      />
      <SourceStatusNotice
        source={weeklySource}
        supabaseText={buildSourceNotice('supabase', { supabasePrefix: 'Weekly data source: ' })}
        localText={buildSourceNotice('local', { localPrefix: 'Weekly data source: ' })}
        loadError={weeklyLoadError}
        onRetry={refreshWeeklyBrief}
        retryAriaLabel="Retry loading focus command center data"
      />

      <section className="focus-mode" aria-label="ADHD support layer">
        <div className="focus-mode__chips" role="radiogroup" aria-label="Choose your support mode">
          {FOCUS_MODES.map((mode, index) => (
            <button
              key={mode.id}
              data-focus-mode={mode.id}
              type="button"
              role="radio"
              aria-checked={focusMode === mode.id}
              tabIndex={focusMode === mode.id ? 0 : -1}
              className={focusMode === mode.id ? 'focus-chip focus-chip--active' : 'focus-chip'}
              onClick={() => setFocusMode(mode.id)}
              onKeyDown={(event) => handleFocusModeKeyDown(event, index)}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className="supportive-copy">{supportCopy}</p>
      </section>

      <div className="focus-home__grid">
        <article className="focus-panel focus-panel--main" aria-label="Today focus panel">
          <div className="focus-panel__header">
            <h2>Today's Main Focus</h2>
            <span className="signal-node" aria-hidden="true" />
          </div>
          <p className="focus-home__main-focus">{mainFocus.title}</p>
          <p className="calm-copy">{mainFocus.context}</p>
          <div className="focus-home__actions">
            <Button type="button" onClick={handleTellMeWhatToDoNext} icon={{ name: 'action' }}>
              Tell me what to do next
            </Button>
            <Button type="button" variant="ghost" onClick={handleOverwhelmedReset} icon={{ name: 'warning' }}>
              I'm overwhelmed
            </Button>
          </div>

          <div className="focus-home__next-move">
            <p className="focus-home__subheading">Next Smallest Action</p>
            <p>{displayedNextMove}</p>
          </div>

          {isFocusDataLoading ? <p className="helper-text">Loading your focus context...</p> : null}
          {dashboardDemoNote ? <p className="helper-text">{dashboardDemoNote}</p> : null}
        </article>

        <article className="focus-panel" aria-label="Blockers panel">
          <div className="focus-panel__header">
            <h2>Blockers</h2>
            <span className="signal-node" aria-hidden="true" />
          </div>
          <ul className="focus-list">
            {blockerItems.map((item, index) => (
              <li key={`blocker-${index + 1}`}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="focus-panel" aria-label="Reminders panel">
          <div className="focus-panel__header">
            <h2>Reminders</h2>
            <span className="signal-node" aria-hidden="true" />
          </div>
          <form className="focus-reminder-form" onSubmit={handleAddReminder}>
            <label className="sr-only" htmlFor="focus-reminder-input">
              Add reminder
            </label>
            <input
              id="focus-reminder-input"
              type="text"
              value={reminderDraft}
              onChange={(event) => setReminderDraft(event.target.value)}
              placeholder="Add a quick reminder"
            />
            <Button type="submit" size="small" icon={{ name: 'add' }}>
              Add
            </Button>
          </form>

          <p className="focus-reminder-progress" aria-live="polite">
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
                    onChange={(event) => handleToggleReminder(item.id, event.target.checked)}
                  />
                  <span>{item.text}</span>
                </label>
                <button
                  type="button"
                  className="focus-reminder-list__delete"
                  aria-label={`Delete reminder ${item.text}`}
                  onClick={() => handleDeleteReminder(item.id)}
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

        <article className="focus-panel" aria-label="Momentum panel">
          <div className="focus-panel__header">
            <h2>Quick Win</h2>
            <span className="signal-node" aria-hidden="true" />
          </div>
          <p className="focus-home__quick-win">{quickWin}</p>
          <p className="focus-home__momentum-score">
            Momentum: <strong>{momentum.score}%</strong>
          </p>
          <p className="calm-copy">{momentum.text}</p>
        </article>

        <article className="focus-panel focus-panel--reset" aria-live="polite">
          <div className="focus-panel__header">
            <h2>I'm Overwhelmed Reset</h2>
            <span className="signal-node" aria-hidden="true" />
          </div>
          <p className="supportive-copy">
            {isResetOpen
              ? 'Reset mode is open. You only need one completed step right now.'
              : 'Use this reset anytime pressure spikes. No guilt, just the next tiny move.'}
          </p>
          <ol className="focus-list focus-list--ordered">
            {resetSteps.map((step, index) => (
              <li key={`reset-${index + 1}`}>{step}</li>
            ))}
          </ol>
        </article>
      </div>

      <Toast className="toast--dashboard" isVisible={isToastVisible} message={toastMessage} />
    </section>
  );
}

export default Dashboard;

