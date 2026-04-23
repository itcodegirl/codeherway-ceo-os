import { formatIsoDate } from './utils';

function normalizeCollection(values) {
  return Array.isArray(values) ? values : [];
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFromYesterdayOrEarlier(isoValue, todayKey) {
  if (!hasText(isoValue)) {
    return false;
  }

  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return formatIsoDate(parsed) < todayKey;
}

export function buildDeterministicSuggestions({
  priorities,
  blockers,
  opportunities,
  contentRows,
  notes,
  reminders,
  journalEntry,
  now = new Date(),
}) {
  const safePriorities = normalizeCollection(priorities);
  const safeBlockers = normalizeCollection(blockers);
  const safeOpportunities = normalizeCollection(opportunities);
  const safeContentRows = normalizeCollection(contentRows);
  const safeNotes = normalizeCollection(notes);
  const safeReminders = normalizeCollection(reminders);
  const todayKey = formatIsoDate(now);

  const suggestions = [];
  const pendingReminders = safeReminders.filter((item) => !item?.isDone);

  const activeOpportunity = safeOpportunities.find((item) =>
    item?.stage === 'In Progress' || item?.priority === 'High');
  if (activeOpportunity) {
    suggestions.push({
      id: 'quick-win',
      text: 'You have one quick win waiting.',
    });
  }

  if (safeBlockers.length > 0) {
    suggestions.push({
      id: 'blocker-attention',
      text: 'This blocker may need attention.',
      context: safeBlockers[0]?.text || '',
    });
  }

  const unfinishedIdea = safeNotes.find((item) =>
    item?.category === 'idea'
    && hasText(item?.text)
    && isFromYesterdayOrEarlier(item?.updatedAt || item?.createdAt, todayKey));
  if (unfinishedIdea) {
    suggestions.push({
      id: 'unfinished-idea',
      text: 'You have an unfinished idea from yesterday.',
    });
  }

  const draftContent = safeContentRows.find((item) => item?.status === 'Drafting');
  if (draftContent) {
    suggestions.push({
      id: 'draft-content',
      text: 'A content draft is ready for a small next step.',
      context: draftContent?.title || '',
    });
  }

  const plannedPriority = safePriorities.find((item) => item?.status === 'Planned');
  if (plannedPriority) {
    suggestions.push({
      id: 'planned-priority',
      text: 'One planned priority needs a next move.',
      context: plannedPriority?.title || '',
    });
  }

  if (pendingReminders.length > 0) {
    suggestions.push({
      id: 'pending-reminders',
      text: `${pendingReminders.length} reminder${pendingReminders.length > 1 ? 's are' : ' is'} still open.`,
    });
  }

  if (journalEntry && hasText(journalEntry.feelsHeavy) && !hasText(journalEntry.oneNextThing)) {
    suggestions.push({
      id: 'journal-next-step',
      text: 'Your journal mentions weight today. Add one tiny next action.',
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      id: 'default',
      text: 'You are clear for now. Keep momentum by finishing one tiny action.',
    });
  }

  const deduped = [];
  const seen = new Set();
  suggestions.forEach((item) => {
    if (seen.has(item.id)) {
      return;
    }
    seen.add(item.id);
    deduped.push(item);
  });

  return deduped.slice(0, 5);
}
