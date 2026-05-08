import ErrorBoundary from '../ui/ErrorBoundary';

/**
 * Blockers list on Focus Home. Pure presentation: receives a flat array of
 * blocker strings from the Dashboard.
 */
function BlockersPanel({ blockerItems }) {
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
        <ul className="focus-list">
          {blockerItems.map((item, index) => (
            <li key={`blocker-${index + 1}`}>{item}</li>
          ))}
        </ul>
      </article>
    </ErrorBoundary>
  );
}

export default BlockersPanel;
