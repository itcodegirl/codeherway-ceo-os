import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../components/ui/Sidebar';
import Topbar from '../components/ui/Topbar';
import SystemPulse from '../components/ui/SystemPulse';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { useSettings } from '../hooks/useSettings';
import { usePageMeta } from '../hooks/usePageMeta';
import { resolvePageMeta } from '../lib/pageMeta';
import { resolveTeamName } from '../lib/settings';

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const { settings } = useSettings();

  const teamName = resolveTeamName(settings?.teamName);
  const appName = `${teamName} CEO OS`;
  const currentPageTitle = useMemo(() => {
    const pageMeta = resolvePageMeta(appName, location.pathname);
    const topbarTitle = String(pageMeta?.title || '').split('|')[0].trim();
    return topbarTitle || 'Focus Home';
  }, [appName, location.pathname]);

  usePageMeta(appName);

  const handleReturnHome = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

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
        <Topbar pageTitle={currentPageTitle} />
        <SystemPulse />
        <main className="app-content" id="main-content" tabIndex="-1" ref={mainRef}>
          <ErrorBoundary
            key={location.pathname}
            resetKey={location.key}
            name={currentPageTitle}
            onReturnHome={handleReturnHome}
          >
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
