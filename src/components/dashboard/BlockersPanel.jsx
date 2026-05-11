import ErrorBoundary from '../ui/ErrorBoundary';

/**
 * Blockers list on Focus Home. Pure presentation: receives a flat array of
 * blocker strings from the Dashboard.
 *
 * When `blockerItems` is empty, render a quiet affirmative state rather than
 * stuffing a placeholder string into the bullet list — a "No blockers" line
 * styled as a list item reads like another blocker, which is the opposite of
 * what the calm thesis wants here.
 */
function BlockersPanel({ blockerItems }) {
  const items = Array.isArray(blockerItems) ? blockerItems : [];
  const hasBlockers = items.length > 0;

  return (
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
        {hasBlockers ? (
          <ul className="focus-list">
            {items.map((item, index) => (
              <li key={`blocker-${index + 1}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="focus-panel__affirmative calm-copy">
            <span className="focus-panel__affirmative-dot" aria-hidden="true" />
            Nothing is blocking you right now. Keep protecting this focus window.
          </p>
        )}
      </article>
    </ErrorBoundary>
  );
}

export default BlockersPanel;
