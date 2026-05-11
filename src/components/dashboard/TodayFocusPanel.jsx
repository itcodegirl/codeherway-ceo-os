import { Link } from 'react-router-dom';
import ErrorBoundary from '../ui/ErrorBoundary';
import PanelErrorFallback from '../ui/PanelErrorFallback';

/**
 * Today's main focus card on Focus Home. Pure presentation: receives the
 * pre-built `mainFocus` object from buildMainFocus and a loading flag.
 *
 * When mainFocus.isEmpty is true (no priority, opportunity, or content in
 * motion yet), the panel surfaces a Chief-of-Staff hint so first-time
 * founders discover that they can paste raw notes and let the AI draft a
 * starting structure for them.
 */
function TodayFocusPanel({ mainFocus, isFocusDataLoading }) {
  return (
    <ErrorBoundary
      name="Dashboard / Today focus"
      fallback={(
        <PanelErrorFallback panelName="Today focus" panelClassName="focus-panel focus-panel--main" />
      )}
    >
      <article className="focus-panel focus-panel--main" aria-label="Today focus panel">
        <div className="focus-panel__header">
          <h2>Today's Main Focus</h2>
          <span className="signal-node" aria-hidden="true" />
        </div>
        <p className="focus-home__main-focus">{mainFocus.title}</p>
        <p className="calm-copy">{mainFocus.context}</p>
        {mainFocus.isEmpty ? (
          <p className="focus-home__empty-hint">
            Or paste raw notes into{' '}
            <Link className="focus-home__empty-hint-link" to="/chief-of-staff">
              Chief of Staff
            </Link>{' '}
            and let it draft a starting structure for you.
          </p>
        ) : null}
        {isFocusDataLoading ? (
          <p className="helper-text" role="status" aria-live="polite">
            Loading your focus context...
          </p>
        ) : null}
      </article>
    </ErrorBoundary>
  );
}

export default TodayFocusPanel;
