import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import SourceStatusNotice from '../components/ui/SourceStatusNotice';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import FocusModeChips from '../components/dashboard/FocusModeChips';
import RemindersPanel from '../components/dashboard/RemindersPanel';
import { isLocalDashboardDemoMode, useDashboardData } from '../hooks/useDashboardData';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToast } from '../hooks/useToast';
import { useWeeklyBrief } from '../hooks/useWeeklyBrief';
import { useFocusHomeSignals } from '../hooks/useFocusHomeSignals';
import { usePromotionAction } from '../hooks/usePromotionAction';
import {
  createReminder,
  deleteReminder,
  getReminderProgress,
  toggleReminder,
  updateReminderText,
} from '../lib/remindersRepository';
import { createWeeklyItem } from '../lib/weeklyRepository';
import { buildDeterministicSuggestions } from '../lib/suggestions';
import {
  buildMainFocus,
  buildMomentumMessage,
  buildNextMoveQueue,
  buildQuickWin,
  resolveFocusMode,
} from '../lib/focusHomeLogic';
import { SOURCE_NOTICE_SAMPLE_DATA, buildSourceNotice } from '../lib/uiCopy';
import '../styles/dashboard.css';

const REMINDER_ACTION_SETTLE_DELAY_MS = 160;

function isReminderNotFoundError(error) {
  return error instanceof Error && error.message === 'Reminder not found';
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
  const { captureNotes, journalEntry, reminders } = useFocusHomeSignals();
  const [reminderDraft, setReminderDraft] = useState('');
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const nextMoveCursorRef = useRef(0);
  const isAddingReminderRef = useRef(false);
  const addReminderReleaseTimerRef = useRef(null);

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

  const supportCopy = useMemo(() => {
    const activeMode = resolveFocusMode(focusMode);
    return activeMode.support;
  }, [focusMode]);

  const nextMoveQueue = useMemo(() => buildNextMoveQueue({
    priorities: weeklyPriorities,
    blockers: weeklyBlockers,
    opportunities: opportunityItems,
    contentRows,
    reminders,
    journalEntry,
  }), [
    contentRows,
    journalEntry,
    opportunityItems,
    reminders,
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

  useEffect(() => () => {
    if (addReminderReleaseTimerRef.current !== null) {
      window.clearTimeout(addReminderReleaseTimerRef.current);
    }
  }, []);

  const scheduleReminderFormRelease = useCallback(() => {
    if (addReminderReleaseTimerRef.current !== null) {
      window.clearTimeout(addReminderReleaseTimerRef.current);
    }

    addReminderReleaseTimerRef.current = window.setTimeout(() => {
      isAddingReminderRef.current = false;
      setIsAddingReminder(false);
      addReminderReleaseTimerRef.current = null;
    }, REMINDER_ACTION_SETTLE_DELAY_MS);
  }, []);

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
    if (isAddingReminderRef.current) {
      return;
    }

    const nextText = reminderDraft.trim();
    if (!nextText) {
      showToast('Add reminder text before saving.');
      return;
    }

    isAddingReminderRef.current = true;
    setIsAddingReminder(true);

    try {
      createReminder({ text: nextText });
      setReminderDraft('');
    } catch {
      showToast('Unable to save reminder right now.');
    } finally {
      scheduleReminderFormRelease();
    }
  };

  const handleToggleReminder = (id, isDone) => {
    if (!reminders.some((item) => item.id === id)) {
      return;
    }

    try {
      toggleReminder(id, isDone);
    } catch (error) {
      if (!isReminderNotFoundError(error)) {
        showToast('Unable to update reminder right now.');
      }
    }
  };

  const handleDeleteReminder = (id) => {
    if (!reminders.some((item) => item.id === id)) {
      return;
    }

    try {
      deleteReminder(id);
    } catch (error) {
      if (!isReminderNotFoundError(error)) {
        showToast('Unable to delete reminder right now.');
      }
    }
  };

  const handleEditReminder = (id, nextText) => {
    if (!reminders.some((item) => item.id === id)) {
      return false;
    }
    const trimmed = typeof nextText === 'string' ? nextText.trim() : '';
    if (!trimmed) {
      showToast('Reminder text cannot be empty.');
      return false;
    }
    try {
      updateReminderText(id, trimmed);
      return true;
    } catch (error) {
      if (!isReminderNotFoundError(error)) {
        showToast('Unable to update reminder right now.');
      }
      return false;
    }
  };

  const handlePromoteReminderToPriority = usePromotionAction({
    onShowToast: showToast,
    isRecordKnown: (id) => reminders.some((item) => item.id === id),
    emptyTextMessage: 'Add reminder text before promoting it.',
    successMessage: "Added to this week's priorities. The reminder stays here.",
    failureMessage: 'Unable to promote this reminder right now.',
    run: async (reminder) => {
      await createWeeklyItem({
        itemType: 'priority',
        item: {
          title: (reminder.text || '').trim(),
          owner: 'You',
          status: 'In Progress',
        },
      });
      await refreshWeeklyBrief({ silent: true });
    },
  });

  const dashboardDemoNote = isLocalDashboardDemoMode
    ? SOURCE_NOTICE_SAMPLE_DATA
    : '';

  const isFocusDataLoading = isDataLoading || isWeeklyLoading;

  const resetSteps = useMemo(() => [
    'Pause for 60 seconds. Release jaw and shoulders.',
    `Do this next: ${displayedNextMove}`,
    'Set a 15-minute timer. Ignore everything else until it ends.',
  ], [displayedNextMove]);

  const modeClassName = resolveFocusMode(focusMode).id;

  return (
    <section
      className={`dashboard-page focus-home-page focus-home-page--${modeClassName}`}
      aria-busy={isFocusDataLoading}
    >
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

      <FocusModeChips
        focusMode={focusMode}
        onFocusModeChange={setFocusMode}
        supportCopy={supportCopy}
      />

      <div className="focus-home__grid">
        <ErrorBoundary
          name="Dashboard / Today focus"
          fallback={(
            <article className="focus-panel focus-panel--main" aria-label="Today focus panel">
              <p className="calm-copy">This panel ran into an error. Refresh the page to retry.</p>
            </article>
          )}
        >
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

          {isFocusDataLoading ? (
            <p className="helper-text" role="status" aria-live="polite">
              Loading your focus context...
            </p>
          ) : null}
          {dashboardDemoNote ? <p className="helper-text">{dashboardDemoNote}</p> : null}
        </article>
        </ErrorBoundary>

        <ErrorBoundary
          name="Dashboard / Blockers"
          fallback={(
            <article className="focus-panel" aria-label="Blockers panel">
              <p className="calm-copy">This panel ran into an error. Refresh the page to retry.</p>
            </article>
          )}
        >
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
        </ErrorBoundary>

        <ErrorBoundary
          name="Dashboard / Reminders"
          fallback={(
            <article className="focus-panel" aria-label="Reminders panel">
              <p className="calm-copy">Reminders couldn’t load. Refresh the page to retry.</p>
            </article>
          )}
        >
          <RemindersPanel
            reminderDraft={reminderDraft}
            onReminderDraftChange={setReminderDraft}
            isAddingReminder={isAddingReminder}
            onAddReminderSubmit={handleAddReminder}
            reminderProgress={reminderProgress}
            visibleReminders={visibleReminders}
            suggestions={suggestions}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={handleDeleteReminder}
            onPromoteReminder={handlePromoteReminderToPriority}
            onEditReminder={handleEditReminder}
          />
        </ErrorBoundary>

        <ErrorBoundary
          name="Dashboard / Momentum"
          fallback={(
            <article className="focus-panel" aria-label="Momentum panel">
              <p className="calm-copy">This panel ran into an error. Refresh the page to retry.</p>
            </article>
          )}
        >
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
        </ErrorBoundary>

        <ErrorBoundary
          name="Dashboard / Reset"
          fallback={(
            <article className="focus-panel focus-panel--reset" aria-label="Reset panel">
              <p className="calm-copy">Reset steps couldn’t load. Refresh the page to retry.</p>
            </article>
          )}
        >
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
        </ErrorBoundary>
      </div>

      <Toast className="toast--dashboard" isVisible={isToastVisible} message={toastMessage} />
    </section>
  );
}

export default Dashboard;

