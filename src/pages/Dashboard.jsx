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
  listReminders,
  REMINDERS_UPDATED_EVENT,
  toggleReminder,
} from '../lib/remindersRepository';
import { buildDeterministicSuggestions } from '../lib/suggestions';
import { buildSourceNotice } from '../lib/uiCopy';
import '../styles/dashboard.css';

const FOCUS_MODES = [
  {
    id: 'focused',
    label: 'Focused',
    support: 'You are in execution mode. Keep scope tiny and finish one concrete move.',
  },
  {
    id: 'planning',
    label: 'Planning',
    support: 'Clarify one outcome, choose one next action, then start before perfect.',
  },
  {
    id: 'reflection',
    label: 'Reflection',
    support: 'Look at what worked, what felt heavy, and adjust gently for tomorrow.',
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    support: 'You are not behind. Shrink the task, breathe, and complete one two-minute step.',
  },
];

function findMainFocus(priorities, opportunities, contentRows) {
  const inProgressPriority = priorities.find((item) => item?.status === 'In Progress' && item?.title);
  if (inProgressPriority) {
    return {
      title: inProgressPriority.title,
      context: 'This is already in motion. Protect your attention until one visible step is done.',
    };
  }

  const plannedPriority = priorities.find((item) => item?.title);
  if (plannedPriority) {
    return {
      title: plannedPriority.title,
      context: 'This is your highest leverage item right now. Start with the smallest visible action.',
    };
  }

  const highPriorityOpportunity = opportunities.find((item) => item?.priority === 'High' && item?.name);
  if (highPriorityOpportunity) {
    return {
      title: `${highPriorityOpportunity.name} (${highPriorityOpportunity.company || 'Opportunity'})`,
      context: 'This opportunity can move quickly with one clear follow-up.',
    };
  }

  const draftContent = contentRows.find((item) => item?.title);
  if (draftContent) {
    return {
      title: draftContent.title,
      context: 'Shipping this content keeps your founder signal active.',
    };
  }

  return {
    title: 'Create one calming priority for today',
    context: 'Start with a 10-minute planning pass and commit to one realistic next move.',
  };
}

function buildNextMoveQueue({ priorities, blockers, opportunities, contentRows }) {
  const moves = [];
  const blockedPriority = priorities.find((item) => item?.status === 'Blocked' && item?.title);
  const activeBlocker = blockers.find((item) => item?.text);
  const activePriority = priorities.find((item) => item?.status === 'In Progress' && item?.title);
  const waitingOpportunity = opportunities.find((item) => item?.stage === 'Awaiting Reply' && item?.name);
  const draftingContent = contentRows.find((item) => item?.status === 'Drafting' && item?.title);

  if (blockedPriority) {
    moves.push(`Send one unblock message for "${blockedPriority.title}".`);
  }
  if (activeBlocker) {
    moves.push(`Define one owner and one deadline for: "${activeBlocker.text}".`);
  }
  if (activePriority) {
    moves.push(`Spend 20 focused minutes on "${activePriority.title}".`);
  }
  if (waitingOpportunity) {
    moves.push(`Draft a concise follow-up for "${waitingOpportunity.name}".`);
  }
  if (draftingContent) {
    moves.push(`Write the opening paragraph for "${draftingContent.title}".`);
  }
  moves.push('Set a 15-minute timer and complete one tiny action without switching tabs.');

  return Array.from(new Set(moves));
}

function buildQuickWin(wins, opportunities, contentRows) {
  const firstWin = wins.find((item) => item?.text);
  if (firstWin) {
    return `Celebrate and build on this: ${firstWin.text}`;
  }

  const inProgressOpportunity = opportunities.find((item) => item?.stage === 'In Progress' && item?.name);
  if (inProgressOpportunity) {
    return `Quick win waiting: send an update for "${inProgressOpportunity.name}".`;
  }

  const scheduledContent = contentRows.find((item) => item?.status === 'Scheduled' && item?.title);
  if (scheduledContent) {
    return `Quick win waiting: repurpose "${scheduledContent.title}" for a second channel.`;
  }

  return 'Quick win waiting: close one tiny loop before opening a new one.';
}

function buildMomentumMessage({ inProgressCount, blockerCount, winsCount }) {
  const score = Math.max(0, Math.min(100, 45 + (inProgressCount * 14) + (winsCount * 10) - (blockerCount * 12)));
  if (score >= 75) {
    return { score, text: 'Momentum is strong. Protect this lane and finish one more step.' };
  }
  if (score >= 55) {
    return { score, text: 'Momentum is building. Keep actions tiny and visibly complete.' };
  }
  return { score, text: 'Momentum is fragile. Use reset mode and complete one two-minute action.' };
}

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
    const activeMode = FOCUS_MODES.find((mode) => mode.id === focusMode);
    return activeMode?.support || FOCUS_MODES[1].support;
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
    () => findMainFocus(weeklyPriorities, opportunityItems, contentRows),
    [contentRows, opportunityItems, weeklyPriorities],
  );

  const pendingReminders = useMemo(
    () => reminders.filter((item) => !item?.isDone),
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
  }), [weeklyBlockers.length, weeklyPriorities, weeklyWins.length]);

  const blockerItems = useMemo(() => {
    if (weeklyBlockers.length === 0) {
      return ['No blockers logged. Keep protecting this focus window.'];
    }
    return weeklyBlockers.slice(0, 3).map((item) => item?.text || 'Unspecified blocker');
  }, [weeklyBlockers]);

  const displayedNextMove = nextMove || nextMoveQueue[0] || 'Choose one tiny action and start a 15-minute timer.';

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
    ? 'Demo mode is active. Connect live data when you are ready.'
    : '';

  const isFocusDataLoading = isDataLoading || isWeeklyLoading;

  const resetSteps = useMemo(() => [
    'Pause for 60 seconds. Release jaw and shoulders.',
    `Do this next: ${displayedNextMove}`,
    'Set a 15-minute timer. Ignore everything else until it ends.',
  ], [displayedNextMove]);

  const handleFocusModeKeyDown = (event, currentIndex) => {
    const key = event.key;
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) {
      return;
    }

    event.preventDefault();
    let nextIndex = currentIndex;
    if (key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % FOCUS_MODES.length;
    } else if (key === 'ArrowLeft') {
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

  const modeClassName = FOCUS_MODES.some((mode) => mode.id === focusMode)
    ? focusMode
    : 'planning';

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
            <span className="signal-node">Focus</span>
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
            <span className="signal-node">Blockers</span>
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
            <span className="signal-node">Reset</span>
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

          <ul className="focus-reminder-list">
            {pendingReminders.length ? pendingReminders.map((item) => (
              <li key={item.id} className="focus-reminder-list__item">
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
            <span className="signal-node">Momentum</span>
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
            <span className="signal-node">Next Move</span>
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

