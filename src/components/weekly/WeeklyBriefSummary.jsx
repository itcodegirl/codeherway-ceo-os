import { useCallback, useMemo, useState } from 'react';
import Button from '../ui/Button';

const COPY_FEEDBACK_RESET_MS = 2400;

function formatReviewSnippet(text, max = 220) {
  if (typeof text !== 'string') {
    return '';
  }
  const collapsed = text.trim().replace(/\s+/g, ' ');
  if (collapsed.length === 0) {
    return '';
  }
  if (collapsed.length <= max) {
    return collapsed;
  }
  return `${collapsed.slice(0, max - 1).trimEnd()}…`;
}

function buildPlainTextBrief({ priorities, wins, blockers, reviewNotes }) {
  const lines = ['Weekly Brief'];

  const inMotion = priorities.filter((item) => item?.status === 'In Progress');
  const headline = inMotion[0] || priorities[0];
  if (headline) {
    lines.push('');
    lines.push(`Focus: ${headline.title || 'Pick one priority for this week.'}`);
  }

  if (priorities.length > 0) {
    lines.push('');
    lines.push('Priorities:');
    priorities.slice(0, 5).forEach((item) => {
      const ownerSuffix = item?.owner ? ` — ${item.owner}` : '';
      const statusSuffix = item?.status ? ` (${item.status})` : '';
      lines.push(`- ${item?.title || 'Untitled priority'}${ownerSuffix}${statusSuffix}`);
    });
  }

  if (wins.length > 0) {
    lines.push('');
    lines.push('Wins:');
    wins.slice(0, 5).forEach((item) => {
      lines.push(`- ${item?.text || 'Untitled win'}`);
    });
  }

  if (blockers.length > 0) {
    lines.push('');
    lines.push('Blockers:');
    blockers.slice(0, 5).forEach((item) => {
      lines.push(`- ${item?.text || 'Unspecified blocker'}`);
    });
  }

  const reflection = formatReviewSnippet(reviewNotes, 600);
  if (reflection) {
    lines.push('');
    lines.push('Reflection:');
    lines.push(reflection);
  }

  return lines.join('\n');
}

function WeeklyBriefSummary({ priorities = [], wins = [], blockers = [], reviewNotes = '' }) {
  const [feedback, setFeedback] = useState('');

  const inMotion = useMemo(
    () => priorities.filter((item) => item?.status === 'In Progress'),
    [priorities],
  );
  const headline = inMotion[0] || priorities[0] || null;
  const reflectionSnippet = useMemo(
    () => formatReviewSnippet(reviewNotes),
    [reviewNotes],
  );
  const hasAnyContent = priorities.length > 0 || wins.length > 0 || blockers.length > 0 || reflectionSnippet;

  const handleCopyBrief = useCallback(async () => {
    const briefText = buildPlainTextBrief({ priorities, wins, blockers, reviewNotes });

    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setFeedback('Clipboard is unavailable in this browser.');
      return;
    }

    try {
      await navigator.clipboard.writeText(briefText);
      setFeedback('Brief copied to clipboard.');
    } catch {
      setFeedback('Copy failed. Try again or copy the brief manually.');
    } finally {
      window.setTimeout(() => setFeedback(''), COPY_FEEDBACK_RESET_MS);
    }
  }, [priorities, wins, blockers, reviewNotes]);

  if (!hasAnyContent) {
    return null;
  }

  return (
    <article className="weekly-summary section-card" aria-label="This week at a glance">
      <header className="weekly-summary__header">
        <div>
          <p className="weekly-summary__eyebrow">This week at a glance</p>
          <h2>Founder brief</h2>
        </div>
        <Button
          type="button"
          size="small"
          variant="ghost"
          onClick={handleCopyBrief}
          icon={{ name: 'copy', size: 14 }}
          ariaLabel="Copy the weekly brief to clipboard"
        >
          Copy brief
        </Button>
      </header>

      {headline ? (
        <p className="weekly-summary__focus">
          <strong>Focus:</strong> {headline.title || 'Pick one priority for this week.'}
        </p>
      ) : null}

      <dl className="weekly-summary__metrics">
        <div>
          <dt>Priorities</dt>
          <dd>{priorities.length} active{inMotion.length > 0 ? ` · ${inMotion.length} in motion` : ''}</dd>
        </div>
        <div>
          <dt>Wins</dt>
          <dd>{wins.length} logged this week</dd>
        </div>
        <div>
          <dt>Blockers</dt>
          <dd>{blockers.length} needing follow-up</dd>
        </div>
      </dl>

      {reflectionSnippet ? (
        <p className="weekly-summary__reflection">
          <span className="weekly-summary__reflection-label">Reflection: </span>
          {reflectionSnippet}
        </p>
      ) : null}

      {feedback ? (
        <p className="helper-text weekly-summary__feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}
    </article>
  );
}

export default WeeklyBriefSummary;
