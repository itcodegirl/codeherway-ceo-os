import { hasText, normalizeCollection, normalizeText } from './focusSignalUtils';

export const FOCUS_MODES = [
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

const DEFAULT_NEXT_MOVE = 'Set a 15-minute timer and complete one tiny action without switching tabs.';
const DEFAULT_NEXT_MOVE_REASON = 'Recommended because: a short time-box creates progress without reopening your whole system.';

export const OPERATING_RITUALS = [
  {
    id: 'start-day',
    label: 'Start Day',
    action: 'Choose one main focus, one blocker, and one reminder to protect.',
  },
  {
    id: 'execute',
    label: 'Execute',
    action: 'Work the next smallest action without reopening the whole system.',
  },
  {
    id: 'capture',
    label: 'Capture',
    action: 'Put loose notes, reminders, and decisions into one trusted place.',
  },
  {
    id: 'reset',
    label: 'Reset',
    action: 'Shrink scope, clear one loop, or deliberately park what can wait.',
  },
  {
    id: 'shutdown',
    label: 'Shutdown',
    action: 'Journal, choose tomorrow\'s first move, and close the day cleanly.',
  },
  {
    id: 'weekly',
    label: 'Weekly',
    action: 'Review priorities, wins, blockers, and reset the next week.',
  },
];

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function parseCreatedAt(value) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

function findOldestPendingReminder(reminders) {
  return reminders
    .filter((item) => !item?.isDone && hasText(item?.text))
    .sort((left, right) => parseCreatedAt(left?.createdAt) - parseCreatedAt(right?.createdAt))[0];
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildQuotedInstruction(prefix, value) {
  const normalized = normalizeText(value);
  const punctuation = /[.!?]$/.test(normalized) ? '' : '.';
  return `${prefix} "${normalized}"${punctuation}`;
}

function addUniqueRecommendation(recommendations, recommendation) {
  if (!recommendation?.text) {
    return;
  }

  if (recommendations.some((item) => item.text === recommendation.text)) {
    return;
  }

  recommendations.push(recommendation);
}

function resolveRitualId(now = new Date()) {
  const hour = now instanceof Date && Number.isFinite(now.getTime())
    ? now.getHours()
    : new Date().getHours();

  if (hour >= 5 && hour < 10) {
    return 'start-day';
  }

  if (hour >= 10 && hour < 16) {
    return 'execute';
  }

  if (hour >= 16 && hour < 18) {
    return 'capture';
  }

  if (hour >= 18 && hour < 21) {
    return 'reset';
  }

  return 'shutdown';
}

export function buildOperatingRitual(now = new Date()) {
  const activeId = resolveRitualId(now);
  return OPERATING_RITUALS.filter((item) => item.id !== 'weekly').map((item) => ({
    ...item,
    isActive: item.id === activeId,
  }));
}

export function resolveFocusMode(modeId) {
  return FOCUS_MODES.find((mode) => mode.id === modeId) || FOCUS_MODES[1];
}

export function buildMainFocus(priorities, opportunities, contentRows) {
  const safePriorities = normalizeCollection(priorities);
  const safeOpportunities = normalizeCollection(opportunities);
  const safeContentRows = normalizeCollection(contentRows);

  const inProgressPriority = safePriorities.find((item) => item?.status === 'In Progress' && item?.title);
  if (inProgressPriority) {
    return {
      title: inProgressPriority.title,
      context: 'This is already in motion. Protect your attention until one visible step is done.',
      isEmpty: false,
    };
  }

  const blockedPriority = safePriorities.find((item) => item?.status === 'Blocked' && item?.title);
  if (blockedPriority) {
    return {
      title: blockedPriority.title,
      context: 'This is blocked. Your CEO move is to unblock, delegate, or deliberately park it.',
      isEmpty: false,
    };
  }

  const plannedPriority = safePriorities.find((item) => item?.title);
  if (plannedPriority) {
    return {
      title: plannedPriority.title,
      context: 'This is your highest leverage item right now. Start with the smallest visible action.',
      isEmpty: false,
    };
  }

  const highPriorityOpportunity = safeOpportunities.find((item) => item?.priority === 'High' && item?.name);
  if (highPriorityOpportunity) {
    return {
      title: `${highPriorityOpportunity.name} (${highPriorityOpportunity.company || 'Opportunity'})`,
      context: 'This opportunity can move quickly with one clear follow-up.',
      isEmpty: false,
    };
  }

  const draftContent = safeContentRows.find((item) => item?.title);
  if (draftContent) {
    return {
      title: draftContent.title,
      context: 'Shipping this content keeps your founder signal active.',
      isEmpty: false,
    };
  }

  // Empty state: nothing is in motion yet. The Dashboard surfaces a calm
  // Chief-of-Staff hint here so first-time founders discover that they can
  // paste raw notes and let the AI draft a starting structure.
  return {
    title: 'Create one calming priority for today',
    context: 'Start with a 10-minute planning pass and commit to one realistic next move.',
    isEmpty: true,
  };
}

export function buildNextMoveQueue({
  priorities,
  blockers,
  opportunities,
  contentRows,
  reminders,
  journalEntry,
} = {}) {
  return buildNextMoveRecommendations({
    priorities,
    blockers,
    opportunities,
    contentRows,
    reminders,
    journalEntry,
  }).map((item) => item.text);
}

export function buildNextMoveRecommendations({
  priorities,
  blockers,
  opportunities,
  contentRows,
  reminders,
  journalEntry,
} = {}) {
  const safePriorities = normalizeCollection(priorities);
  const safeBlockers = normalizeCollection(blockers);
  const safeOpportunities = normalizeCollection(opportunities);
  const safeContentRows = normalizeCollection(contentRows);
  const safeReminders = normalizeCollection(reminders);
  const recommendations = [];

  const blockedPriority = safePriorities.find((item) => item?.status === 'Blocked' && item?.title);
  const activeBlocker = safeBlockers.find((item) => item?.text);
  const activePriority = safePriorities.find((item) => item?.status === 'In Progress' && item?.title);
  const waitingOpportunity = safeOpportunities.find((item) => item?.stage === 'Awaiting Reply' && item?.name);
  const draftingContent = safeContentRows.find((item) => item?.status === 'Drafting' && item?.title);
  const pendingReminder = findOldestPendingReminder(safeReminders);
  const journalNeedsNextStep = hasText(journalEntry?.feelsHeavy) && !hasText(journalEntry?.oneNextThing);

  if (blockedPriority) {
    addUniqueRecommendation(recommendations, {
      text: buildQuotedInstruction('Send one unblock message for', blockedPriority.title),
      reason: 'Recommended because: this priority is blocked and needs one clear unblock message.',
    });
  }
  if (activeBlocker) {
    addUniqueRecommendation(recommendations, {
      text: buildQuotedInstruction('Define one owner and one deadline for:', activeBlocker.text),
      reason: 'Recommended because: an open blocker needs an owner and deadline before it becomes background stress.',
    });
  }
  if (activePriority) {
    addUniqueRecommendation(recommendations, {
      text: buildQuotedInstruction('Spend 20 focused minutes on', activePriority.title),
      reason: 'Recommended because: this priority is already in progress, so one visible step protects momentum.',
    });
  }
  if (waitingOpportunity) {
    addUniqueRecommendation(recommendations, {
      text: buildQuotedInstruction('Draft a concise follow-up for', waitingOpportunity.name),
      reason: 'Recommended because: this opportunity is waiting on a reply and a concise follow-up can move it forward.',
    });
  }
  if (draftingContent) {
    addUniqueRecommendation(recommendations, {
      text: buildQuotedInstruction('Write the opening paragraph for', draftingContent.title),
      reason: 'Recommended because: this draft is open and one paragraph lowers the publishing friction.',
    });
  }
  if (pendingReminder) {
    addUniqueRecommendation(recommendations, {
      text: buildQuotedInstruction('Complete or reschedule reminder:', pendingReminder.text),
      reason: 'Recommended because: your oldest unfinished reminder is still open.',
    });
  }
  if (journalNeedsNextStep) {
    addUniqueRecommendation(recommendations, {
      text: 'Turn today\'s heavy journal note into one tiny next action.',
      reason: 'Recommended because: today\'s journal names heaviness but not the next step yet.',
    });
  }
  addUniqueRecommendation(recommendations, {
    text: DEFAULT_NEXT_MOVE,
    reason: DEFAULT_NEXT_MOVE_REASON,
  });

  return recommendations;
}

export function buildSafeToIgnoreList({
  priorities,
  opportunities,
  contentRows,
  reminders,
} = {}) {
  const safePriorities = normalizeCollection(priorities);
  const safeOpportunities = normalizeCollection(opportunities);
  const safeContentRows = normalizeCollection(contentRows);
  const safeReminders = normalizeCollection(reminders);
  const items = [];

  const laterReminders = safeReminders.filter((item) => !item?.isDone && hasText(item?.text)).slice(1);
  if (laterReminders.length > 0) {
    items.push(`${pluralize(laterReminders.length, 'later reminder')} can wait until this focus block ends.`);
  }

  const lowerPriorityOpportunities = safeOpportunities.filter((item) => (
    item?.priority !== 'High'
    && item?.stage !== 'In Progress'
    && item?.stage !== 'Awaiting Reply'
    && hasText(item?.name)
  ));
  if (lowerPriorityOpportunities.length > 0) {
    items.push(`${pluralize(lowerPriorityOpportunities.length, 'lower-priority opportunity', 'lower-priority opportunities')} can stay parked for now.`);
  }

  const draftingContent = safeContentRows.filter((item) => item?.status === 'Drafting' && hasText(item?.title));
  if (draftingContent.length > 1) {
    items.push(`${pluralize(draftingContent.length - 1, 'extra content draft')} can wait unless publishing is today's focus.`);
  }

  const plannedPriorities = safePriorities.filter((item) => item?.status === 'Planned' && hasText(item?.title));
  if (plannedPriorities.length > 1) {
    items.push(`${pluralize(plannedPriorities.length - 1, 'planned priority', 'planned priorities')} can wait behind the current move.`);
  }

  return items.slice(0, 3);
}

export function buildOpenLoopsSummary({
  blockers,
  captureNotes,
  contentRows,
  journalEntry,
  opportunities,
  reminders,
} = {}) {
  const safeBlockers = normalizeCollection(blockers);
  const safeCaptureNotes = normalizeCollection(captureNotes);
  const safeContentRows = normalizeCollection(contentRows);
  const safeOpportunities = normalizeCollection(opportunities);
  const safeReminders = normalizeCollection(reminders);

  const pendingReminders = safeReminders.filter((item) => !item?.isDone && hasText(item?.text));
  const activeBlockers = safeBlockers.filter((item) => hasText(item?.text));
  const unprocessedNotes = safeCaptureNotes.filter((item) => hasText(item?.text) && !hasText(item?.promotedTo));
  const waitingOpportunities = safeOpportunities.filter((item) => item?.stage === 'Awaiting Reply' && hasText(item?.name));
  const draftingContent = safeContentRows.filter((item) => item?.status === 'Drafting' && hasText(item?.title));
  const journalNeedsNextStep = hasText(journalEntry?.feelsHeavy) && !hasText(journalEntry?.oneNextThing);

  const items = [
    { id: 'reminders', label: 'Pending reminders', count: pendingReminders.length },
    { id: 'blockers', label: 'Blockers', count: activeBlockers.length },
    { id: 'capture', label: 'Unprocessed capture notes', count: unprocessedNotes.length },
    { id: 'opportunities', label: 'Waiting opportunities', count: waitingOpportunities.length },
    { id: 'content', label: 'Drafting content', count: draftingContent.length },
    { id: 'journal', label: 'Journal needs a next thing', count: journalNeedsNextStep ? 1 : 0 },
  ].filter((item) => item.count > 0);

  const total = items.reduce((sum, item) => sum + item.count, 0);
  const suggestedLoop = activeBlockers[0]?.text
    ? buildQuotedInstruction('Clarify the next owner for', activeBlockers[0].text)
    : pendingReminders[0]?.text
      ? buildQuotedInstruction('Complete or reschedule', pendingReminders[0].text)
      : unprocessedNotes[0]?.text
        ? buildQuotedInstruction('Process capture note', unprocessedNotes[0].text)
        : waitingOpportunities[0]?.name
          ? buildQuotedInstruction('Send one follow-up for', waitingOpportunities[0].name)
          : draftingContent[0]?.title
            ? buildQuotedInstruction('Lower friction on draft', draftingContent[0].title)
            : journalNeedsNextStep
              ? 'Name one next thing from today\'s heavy journal note.'
              : 'No loop needs closing right now.';

  return {
    total,
    headline: total > 0
      ? `${pluralize(total, 'open loop')} visible.`
      : 'No open loops need action right now.',
    items,
    suggestedLoop,
    canWait: total > 1
      ? 'The rest can wait until this focus block ends.'
      : 'Nothing else needs attention during this focus block.',
  };
}

export function buildQuickWin(wins, opportunities, contentRows) {
  const safeWins = normalizeCollection(wins);
  const safeOpportunities = normalizeCollection(opportunities);
  const safeContentRows = normalizeCollection(contentRows);

  const firstWin = safeWins.find((item) => item?.text);
  if (firstWin) {
    return `Celebrate and build on this: ${firstWin.text}`;
  }

  const inProgressOpportunity = safeOpportunities.find((item) => item?.stage === 'In Progress' && item?.name);
  if (inProgressOpportunity) {
    return `Quick win waiting: send an update for "${inProgressOpportunity.name}".`;
  }

  const scheduledContent = safeContentRows.find((item) => item?.status === 'Scheduled' && item?.title);
  if (scheduledContent) {
    return `Quick win waiting: repurpose "${scheduledContent.title}" for a second channel.`;
  }

  return 'Quick win waiting: close one tiny loop before opening a new one.';
}

// Momentum is built only from positive completion signals. Naming a blocker
// or capturing a pending reminder is itself a healthy act and used to be
// penalised here; users learnt to under-log to keep the number up. Both
// negative weights are gone, and the bottom-tier copy no longer calls the
// user's day "fragile". `blockerCount` / `pendingReminderCount` are accepted
// for backwards-compatibility with existing call sites.
//
// The numeric `score` is kept on the return value as an internal/analytics
// signal but is no longer surfaced in the UI: a 0–100 score conflicts with
// the calm-OS thesis (it invites optimisation-thinking). The Dashboard now
// reads `label` and `state` instead, which describe the day in words.
export function buildMomentumMessage({
  inProgressCount = 0,
  winsCount = 0,
  completedReminderCount = 0,
  // eslint-disable-next-line no-unused-vars
  blockerCount = 0,
  // eslint-disable-next-line no-unused-vars
  pendingReminderCount = 0,
} = {}) {
  const score = clampScore(
    35
      + (inProgressCount * 12)
      + (winsCount * 14)
      + (completedReminderCount * 8),
  );

  if (completedReminderCount > 0 && score >= 60) {
    return {
      score,
      state: 'visible',
      label: 'Visible',
      text: 'Today is visible. Completed reminders are turning intent into proof.',
    };
  }
  if (score >= 75) {
    return {
      score,
      state: 'in-motion',
      label: 'In motion',
      text: 'Things are moving. Protect this lane and finish one more step.',
    };
  }
  if (score >= 55) {
    return {
      score,
      state: 'steady',
      label: 'Steady',
      text: 'Steady progress. Keep actions tiny and visibly complete.',
    };
  }
  return {
    score,
    state: 'quiet',
    label: 'Quiet day',
    text: 'Today is a quiet day. One small visible step is enough.',
  };
}
