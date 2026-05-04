import { hasText, normalizeCollection } from './focusSignalUtils';
import { formatIsoDate } from './utils';

// Severity weights drive triage so the focus surface foregrounds the things
// that actually need a decision (named blockers, heavy journal entries,
// in-progress work) over passive observations ("you have an unfinished idea").
// Higher = surfaces first.
const SEVERITY_BY_ID = {
  'blocker-attention': 100,
  'journal-next-step': 80,
  'quick-win': 70,
  'planned-priority': 60,
  'draft-content': 50,
  'pending-reminders': 40,
  'unfinished-idea': 30,
  default: 0,
};

const MAX_VISIBLE_SUGGESTIONS = 3;

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
  suggestions.forEach((item, index) => {
    if (seen.has(item.id)) {
      return;
    }
    seen.add(item.id);
    deduped.push({
      ...item,
      // Stable secondary key so equal-severity items keep their original order.
      __order: index,
    });
  });

  // Sort by severity (high first), keep insertion order on ties for
  // deterministic output, then cap the visible list. Strip the internal key
  // before returning so callers only see the public suggestion shape.
  return deduped
    .sort((left, right) => {
      const leftSeverity = SEVERITY_BY_ID[left.id] ?? 0;
      const rightSeverity = SEVERITY_BY_ID[right.id] ?? 0;
      if (leftSeverity !== rightSeverity) {
        return rightSeverity - leftSeverity;
      }
      return left.__order - right.__order;
    })
    .slice(0, MAX_VISIBLE_SUGGESTIONS)
    // eslint-disable-next-line no-unused-vars
    .map(({ __order, ...rest }) => rest);
}
