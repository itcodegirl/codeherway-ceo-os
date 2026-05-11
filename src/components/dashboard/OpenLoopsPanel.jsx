import ErrorBoundary from '../ui/ErrorBoundary';
import PanelErrorFallback from '../ui/PanelErrorFallback';

/**
 * Open loops summary card on Focus Home. Pure presentation: receives the
 * pre-built `openLoops` object from Dashboard's `buildOpenLoopsSummary`
 * call site so the panel itself stays free of derivation logic.
 */
function OpenLoopsPanel({ openLoops }) {
  return (
    <ErrorBoundary
      name="Dashboard / Open Loops"
      fallback={(
        <PanelErrorFallback panelName="Open loops" />
      )}
    >
      <article className="focus-panel focus-panel--open-loops" aria-label="Open loops panel">
        <div className="focus-panel__header">
          <h2>Open Loops</h2>
          <span className="signal-node" aria-hidden="true" />
        </div>
        <p className="calm-copy">{openLoops.headline}</p>
        {openLoops.items.length ? (
          <ul className="focus-list focus-list--compact" aria-label="Open loops summary">
            {openLoops.items.slice(0, 4).map((item) => (
              <li key={item.id}>
                <strong>{item.count}</strong> {item.label}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="focus-home__loop-close">
          <strong>One loop worth closing:</strong> {openLoops.suggestedLoop}
        </p>
        <p className="helper-text">{openLoops.canWait}</p>
      </article>
    </ErrorBoundary>
  );
}

export default OpenLoopsPanel;
