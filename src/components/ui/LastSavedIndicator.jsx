/**
 * Renders a "Last saved <time>...</time>." span when the supplied `savedAt`
 * is a positive, finite timestamp that parses to a valid Date.
 *
 * Settings.jsx previously inlined this logic as an IIFE inside JSX to
 * guard against:
 *   - non-numeric `savedAt` values (Number(savedAt) returns NaN)
 *   - zero / negative values (treated as "not saved yet")
 *   - `Infinity` (which passes `> 0` but breaks Date)
 *   - corrupted-storage timestamps that produce an Invalid Date
 *     (would throw on `toISOString()` if rendered)
 *
 * Extracting the IIFE into a named component makes the JSX readable
 * and centralises the guards so any future surface (Capture, Journal,
 * Weekly Brief) can adopt the same "Last saved" affordance without
 * duplicating the parse-and-guard dance.
 *
 * Returns `null` when no valid timestamp is available — callers can
 * render it unconditionally without worrying about extra whitespace.
 */
function LastSavedIndicator({ savedAt, className = 'settings-saved-indicator' }) {
  const numeric = Number(savedAt);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  const savedDate = new Date(numeric);
  if (Number.isNaN(savedDate.getTime())) {
    return null;
  }

  return (
    <span className={className}>
      {' '}
      Last saved{' '}
      <time dateTime={savedDate.toISOString()}>{savedDate.toLocaleString()}</time>
      .
    </span>
  );
}

export default LastSavedIndicator;
