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

function normalizeCollection(values) {
  return Array.isArray(values) ? values : [];
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

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

function buildQuotedInstruction(prefix, value) {
  const normalized = normalizeText(value);
  const punctuation = /[.!?]$/.test(normalized) ? '' : '.';
  return `${prefix} "${normalized}"${punctuation}`;
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
    };
  }

  const blockedPriority = safePriorities.find((item) => item?.status === 'Blocked' && item?.title);
  if (blockedPriority) {
    return {
      title: blockedPriority.title,
      context: 'This is blocked. Your CEO move is to unblock, delegate, or deliberately park it.',
    };
  }

  const plannedPriority = safePriorities.find((item) => item?.title);
  if (plannedPriority) {
    return {
      title: plannedPriority.title,
      context: 'This is your highest leverage item right now. Start with the smallest visible action.',
    };
  }

  const highPriorityOpportunity = safeOpportunities.find((item) => item?.priority === 'High' && item?.name);
  if (highPriorityOpportunity) {
    return {
      title: `${highPriorityOpportunity.name} (${highPriorityOpportunity.company || 'Opportunity'})`,
      context: 'This opportunity can move quickly with one clear follow-up.',
    };
  }

  const draftContent = safeContentRows.find((item) => item?.title);
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

export function buildNextMoveQueue({
  priorities,
  blockers,
  opportunities,
  contentRows,
  reminders,
  journalEntry,
}) {
  const safePriorities = normalizeCollection(priorities);
  const safeBlockers = normalizeCollection(blockers);
  const safeOpportunities = normalizeCollection(opportunities);
  const safeContentRows = normalizeCollection(contentRows);
  const safeReminders = normalizeCollection(reminders);
  const moves = [];

  const blockedPriority = safePriorities.find((item) => item?.status === 'Blocked' && item?.title);
  const activeBlocker = safeBlockers.find((item) => item?.text);
  const activePriority = safePriorities.find((item) => item?.status === 'In Progress' && item?.title);
  const waitingOpportunity = safeOpportunities.find((item) => item?.stage === 'Awaiting Reply' && item?.name);
  const draftingContent = safeContentRows.find((item) => item?.status === 'Drafting' && item?.title);
  const pendingReminder = findOldestPendingReminder(safeReminders);
  const journalNeedsNextStep = hasText(journalEntry?.feelsHeavy) && !hasText(journalEntry?.oneNextThing);

  if (blockedPriority) {
    moves.push(buildQuotedInstruction('Send one unblock message for', blockedPriority.title));
  }
  if (activeBlocker) {
    moves.push(buildQuotedInstruction('Define one owner and one deadline for:', activeBlocker.text));
  }
  if (activePriority) {
    moves.push(buildQuotedInstruction('Spend 20 focused minutes on', activePriority.title));
  }
  if (waitingOpportunity) {
    moves.push(buildQuotedInstruction('Draft a concise follow-up for', waitingOpportunity.name));
  }
  if (draftingContent) {
    moves.push(buildQuotedInstruction('Write the opening paragraph for', draftingContent.title));
  }
  if (pendingReminder) {
    moves.push(buildQuotedInstruction('Complete or reschedule reminder:', pendingReminder.text));
  }
  if (journalNeedsNextStep) {
    moves.push('Turn today\'s heavy journal note into one tiny next action.');
  }
  moves.push(DEFAULT_NEXT_MOVE);

  return Array.from(new Set(moves));
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

export function buildMomentumMessage({
  inProgressCount = 0,
  blockerCount = 0,
  winsCount = 0,
  completedReminderCount = 0,
  pendingReminderCount = 0,
} = {}) {
  const score = clampScore(
    45
      + (inProgressCount * 14)
      + (winsCount * 10)
      + (completedReminderCount * 6)
      - (pendingReminderCount * 4)
      - (blockerCount * 12),
  );

  if (completedReminderCount > 0 && score >= 60) {
    return { score, text: 'Momentum is visible. Completed reminders are turning intent into proof.' };
  }
  if (score >= 75) {
    return { score, text: 'Momentum is strong. Protect this lane and finish one more step.' };
  }
  if (score >= 55) {
    return { score, text: 'Momentum is building. Keep actions tiny and visibly complete.' };
  }
  return { score, text: 'Momentum is fragile. Use reset mode and complete one two-minute action.' };
}
