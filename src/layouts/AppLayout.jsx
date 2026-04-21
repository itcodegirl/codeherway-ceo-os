import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Sidebar from '../components/ui/Sidebar';
import Topbar from '../components/ui/Topbar';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { useSettings } from '../hooks/useSettings';
import { usePageMeta } from '../hooks/usePageMeta';
import { resolveTeamName } from '../lib/settings';

function AppLayout() {
  const location = useLocation();
  const mainRef = useRef(null);
  const { settings } = useSettings();

  const teamName = resolveTeamName(settings?.teamName);
  const appName = `${teamName} CEO OS`;
  usePageMeta(appName);

  useEffect(() => {
    const mainElement = mainRef.current;

    if (!mainElement || typeof mainElement.focus !== 'function') {
      return;
    }

    try {
      mainElement.focus({ preventScroll: true });
    } catch {
      mainElement.focus();
    }
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content" id="main-content" tabIndex="-1" ref={mainRef}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
