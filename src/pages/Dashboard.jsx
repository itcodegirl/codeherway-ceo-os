import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import SourceStatusNotice from '../components/ui/SourceStatusNotice';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import FocusModeChips from '../components/dashboard/FocusModeChips';
import RemindersPanel from '../components/dashboard/RemindersPanel';
import TodayFocusPanel from '../components/dashboard/TodayFocusPanel';
import OpenLoopsPanel from '../components/dashboard/OpenLoopsPanel';
import BlockersPanel from '../components/dashboard/BlockersPanel';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToast } from '../hooks/useToast';
import { useWeeklyBrief } from '../hooks/useWeeklyBrief';
import { useFocusHomeSignals } from '../hooks/useFocusHomeSignals';
import { usePromotionAction } from '../hooks/usePromotionAction';
import { useWorkspaceSetup } from '../hooks/useWorkspaceSetup';
import { useReminderActions } from '../hooks/useReminderActions';
import {
  createReminder,
  getReminderProgress,
} from '../lib/remindersRepository';
import { createWeeklyItem } from '../lib/weeklyRepository';
import { buildDeterministicSuggestions } from '../lib/suggestions';
import {
  buildOperatingRitual,
  buildMainFocus,
  buildMomentumMessage,
  buildNextMoveRecommendations,
  buildOpenLoopsSummary,
  buildQuickWin,
  buildSafeToIgnoreList,
  resolveFocusMode,
} from '../lib/focusHomeLogic';
import { buildSourceNotice } from '../lib/uiCopy';
import '../styles/dashboard.css';

const REMINDER_ACTION_SETTLE_DELAY_MS = 160;
const FOCUS_TOOLS_DRAWER_ID = 'focus-tools-drawer';

function Dashboard() {
  const { showToast } = useToast();
  const [focusMode, setFocusMode] = usePersistentState('ceo-os-focus-mode', 'planning');
  // Audit follow-up: the top fold now leads with the operating step, one
  // focus, one next move, open loops, blockers, and reminders. Focus-mode
  // chips, quick-win + momentum, and the
  // overwhelmed-reset steps are kept in a collapsed drawer the user can
  // open. The drawer auto-opens whenever the user reaches for it (e.g.
  // clicks the "I'm overwhelmed" button) so we do not gate emergency
  // affordances behind a click.
  const [isFocusToolsExpanded, setIsFocusToolsExpanded] = usePersistentState(
    'ceo-os-focus-tools-expanded',
    false,
  );
  const [nextMove, setNextMove] = useState('');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const { captureNotes, journalEntry, reminders } = useFocusHomeSignals();
  const {
    hasChoice: hasWorkspaceSetupChoice,
    startBlankWorkspace,
    loadDemoWorkspace,
  } = useWorkspaceSetup();
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

  const operatingRitual = useMemo(() => buildOperatingRitual(), []);
  const currentOperatingStep = useMemo(
    () => operatingRitual.find((step) => step.isActive) || operatingRitual[0],
    [operatingRitual],
  );

  const nextMoveRecommendations = useMemo(() => buildNextMoveRecommendations({
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
  const nextMoveQueue = useMemo(
    () => nextMoveRecommendations.map((item) => item.text),
    [nextMoveRecommendations],
  );

  const safeToIgnoreItems = useMemo(() => buildSafeToIgnoreList({
    priorities: weeklyPriorities,
    opportunities: opportunityItems,
    contentRows,
    reminders,
  }), [
    contentRows,
    opportunityItems,
    reminders,
    weeklyPriorities,
  ]);

  const openLoops = useMemo(() => buildOpenLoopsSummary({
    blockers: weeklyBlockers,
    captureNotes,
    contentRows,
    journalEntry,
    opportunities: opportunityItems,
    reminders,
  }), [
    captureNotes,
    contentRows,
    journalEntry,
    opportunityItems,
    reminders,
    weeklyBlockers,
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

  // The panel owns its empty-state copy now, so we just feed it the real
  // (possibly empty) list of blocker strings. Trimming to 3 keeps the focus
  // window short — the rest live on the Weekly Brief.
  const blockerItems = useMemo(
    () => weeklyBlockers.slice(0, 3).map((item) => item?.text || 'Unspecified blocker'),
    [weeklyBlockers],
  );

  const activeNextMove = nextMove && nextMoveQueue.includes(nextMove) ? nextMove : '';
  const displayedNextMove = activeNextMove || nextMoveQueue[0] || 'Choose one tiny action and start a 15-minute timer.';
  const displayedNextMoveReason = nextMoveRecommendations.find((item) => item.text === displayedNextMove)?.reason
    || 'Recommended because: one tiny visible action is the calmest way to restart momentum.';

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
    // The reset steps live in the focus-tools drawer to keep the top fold
    // calm. Auto-open the drawer here so the user reaches the steps in one
    // click instead of two.
    setIsFocusToolsExpanded(true);
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

  const reminderActions = useReminderActions({ reminders, showToast });

  const handlePromoteReminderToPriority = usePromotionAction({
    onShowToast: showToast,
    isRecordKnown: reminderActions.isReminderKnown,
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

  const showFirstRunSetup = weeklySource === 'local' && !hasWorkspaceSetupChoice;

  const isFocusDataLoading = isDataLoading || isWeeklyLoading;

  const resetSteps = useMemo(() => [
    'Pause for 60 seconds. Release jaw and shoulders.',
    `Do this next: ${displayedNextMove}`,
    'Set a 15-minute timer. Ignore everything else until it ends.',
  ], [displayedNextMove]);

  const modeClassName = resolveFocusMode(focusMode).id;
  const toggleFocusTools = useCallback(() => {
    setIsFocusToolsExpanded((current) => !current);
  }, [setIsFocusToolsExpanded]);

  const handleStartBlankWorkspace = useCallback(() => {
    Promise.resolve(startBlankWorkspace())
      .then(() => {
        showToast('Blank local workspace ready. Demo records are cleared from this device.');
      })
      .catch(() => {
        showToast('Unable to update local workspace setup right now.');
      });
  }, [showToast, startBlankWorkspace]);

  const handleLoadDemoWorkspace = useCallback(() => {
    Promise.resolve(loadDemoWorkspace())
      .then(() => {
        showToast('Demo workspace loaded on this device.');
      })
      .catch(() => {
        showToast('Unable to load demo workspace right now.');
      });
  }, [loadDemoWorkspace, showToast]);

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
        supabaseText={buildSourceNotice('supabase', { supabasePrefix: '' })}
        localText={buildSourceNotice('local')}
        loadError={weeklyLoadError}
        onRetry={refreshWeeklyBrief}
        retryAriaLabel="Retry loading focus command center data"
      />

      {showFirstRunSetup ? (
        <section className="focus-home__setup" aria-label="Choose local workspace setup">
          <div>
            <h2>Choose how this device starts</h2>
            <p className="helper-text">
              Demo data is active on this device. Start blank for real use, or keep the demo workspace for review.
            </p>
          </div>
          <div className="focus-home__setup-actions">
            <Button type="button" onClick={handleStartBlankWorkspace} icon={{ name: 'check', size: 14 }}>
              Start blank
            </Button>
            <Button type="button" variant="ghost" onClick={handleLoadDemoWorkspace} icon={{ name: 'section', size: 14 }}>
              Load demo workspace
            </Button>
          </div>
          <p className="helper-text">
            Restore from a JSON backup or connect a Supabase workspace from Settings &gt; Workspace data.
          </p>
        </section>
      ) : null}

      <section className="focus-home__ritual" aria-label="Daily operating rhythm">
        <div className="focus-home__ritual-header">
          <h2>Current Operating Step</h2>
          <p className="helper-text">
            {currentOperatingStep?.label}: {currentOperatingStep?.action}
          </p>
        </div>
        <p className="focus-home__loop-label">Start Day &gt; Execute &gt; Capture &gt; Reset &gt; Shutdown</p>
        {/*
         * Audit feedback: the full 5-step ritual was always rendered above
         * the panel grid, adding density before the user reached any
         * actionable content. Wrap it in a collapsible <details> so the
         * loop label still teaches the rhythm, but the breakdown is
         * one-click away rather than always-on.
         */}
        <details className="focus-home__ritual-details">
          <summary className="focus-home__ritual-summary">Show full ritual</summary>
          <ol className="focus-home__ritual-list">
            {operatingRitual.map((step) => (
              <li
                key={step.id}
                className={step.isActive ? 'focus-home__ritual-item focus-home__ritual-item--active' : 'focus-home__ritual-item'}
                aria-current={step.isActive ? 'step' : undefined}
              >
                <span className="focus-home__ritual-label">
                  {step.label}
                  {step.isActive ? ' now' : ''}
                </span>
                <span className="focus-home__ritual-action">{step.action}</span>
              </li>
            ))}
          </ol>
        </details>
      </section>

      <div className="focus-home__grid">
        <TodayFocusPanel
          mainFocus={mainFocus}
          isFocusDataLoading={isFocusDataLoading}
        />

        <ErrorBoundary
          name="Dashboard / Next move"
          fallback={(
            <article className="focus-panel" aria-label="Next move panel">
              <p className="calm-copy">This panel ran into an error. Refresh the page to retry.</p>
            </article>
          )}
        >
          <article className="focus-panel focus-panel--next-move" aria-label="Next move panel">
            <div className="focus-panel__header">
              <h2>Next Smallest Action</h2>
              <span className="signal-node" aria-hidden="true" />
            </div>
            <p className="focus-home__next-move-text">{displayedNextMove}</p>
            <p className="focus-home__next-move-reason">{displayedNextMoveReason}</p>
            <div className="focus-home__safe-ignore" aria-label="Safe to ignore for now">
              <p className="focus-home__subheading">Safe to ignore for now</p>
              <ul className="focus-home__safe-ignore-list">
                {(safeToIgnoreItems.length
                  ? safeToIgnoreItems
                  : ['Nothing else needs attention during this focus block.']
                ).map((item, index) => (
                  <li key={`safe-ignore-${index + 1}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="focus-home__actions">
              <Button type="button" onClick={handleTellMeWhatToDoNext} icon={{ name: 'action' }}>
                Tell me what to do next
              </Button>
              <Button type="button" variant="ghost" onClick={handleOverwhelmedReset} icon={{ name: 'warning' }}>
                I'm overwhelmed
              </Button>
            </div>
          </article>
        </ErrorBoundary>

        <OpenLoopsPanel openLoops={openLoops} />

        <BlockersPanel blockerItems={blockerItems} />

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
            onToggleReminder={reminderActions.toggle}
            onDeleteReminder={reminderActions.remove}
            onPromoteReminder={handlePromoteReminderToPriority}
            onEditReminder={reminderActions.edit}
            onSnoozeReminder={reminderActions.snooze}
            onWakeReminder={reminderActions.wake}
          />
        </ErrorBoundary>
      </div>

      {/*
       * Focus tools drawer — kept off the top fold to reduce cognitive load.
       * Holds the focus-mode chips, quick-win/momentum readouts, and the
       * overwhelmed-reset steps. Auto-opened when the user clicks
       * "I'm overwhelmed" so emergency support is one click away.
       */}
      <section
        className={`focus-home__drawer${isFocusToolsExpanded ? ' focus-home__drawer--open' : ''}`}
        aria-label="Focus tools"
      >
        <button
          type="button"
          className="focus-home__drawer-toggle"
          aria-expanded={isFocusToolsExpanded}
          aria-controls={FOCUS_TOOLS_DRAWER_ID}
          onClick={toggleFocusTools}
        >
          {isFocusToolsExpanded ? 'Hide focus tools' : 'Show focus tools'}
        </button>

        <div
          id={FOCUS_TOOLS_DRAWER_ID}
          className="focus-home__drawer-body"
          hidden={!isFocusToolsExpanded}
        >
          <FocusModeChips
            focusMode={focusMode}
            onFocusModeChange={setFocusMode}
            supportCopy={supportCopy}
          />

          <div className="focus-home__drawer-grid">
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
                <p
                  className={`focus-home__momentum-pill focus-home__momentum-pill--${momentum.state}`}
                >
                  <span className="focus-home__momentum-pill-dot" aria-hidden="true" />
                  <span className="sr-only">Today: </span>
                  {momentum.label}
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
        </div>
      </section>

    </section>
  );
}

export default Dashboard;
