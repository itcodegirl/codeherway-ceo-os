import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import Sidebar from '../components/ui/Sidebar';
import Topbar from '../components/ui/Topbar';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { usePersistentState } from '../hooks/usePersistentState';
import { DEFAULT_SETTINGS, resolveTeamName } from '../lib/settings';
import { buildPageMetaByRoute, setCanonical, setMetaTag } from '../lib/pageMeta';

function AppLayout() {
  const location = useLocation();
  const mainRef = useRef(null);
  const [settings] = usePersistentState('ceo-os-settings', DEFAULT_SETTINGS);

  const teamName = resolveTeamName(settings?.teamName);
  const appName = `${teamName} CEO OS`;
  const pageMetaByRoute = useMemo(() => buildPageMetaByRoute(appName), [appName]);
  const defaultPageMeta = useMemo(
    () => ({
      title: `Dashboard | ${appName}`,
      description:
        `${appName} is an executive dashboard to manage opportunities, content operations, weekly priorities, and leadership workflows.`,
    }),
    [appName],
  );

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

  useEffect(() => {
    const meta = pageMetaByRoute[location.pathname] || defaultPageMeta;
    document.title = meta.title;

    setMetaTag({
      selector: 'meta[name="description"]',
      attribute: 'name',
      key: 'description',
      value: meta.description,
    });
    setMetaTag({
      selector: 'meta[property="og:title"]',
      attribute: 'property',
      key: 'og:title',
      value: meta.title,
    });
    setMetaTag({
      selector: 'meta[property="og:description"]',
      attribute: 'property',
      key: 'og:description',
      value: meta.description,
    });
    setMetaTag({
      selector: 'meta[property="og:site_name"]',
      attribute: 'property',
      key: 'og:site_name',
      value: appName,
    });
    setMetaTag({
      selector: 'meta[name="twitter:title"]',
      attribute: 'name',
      key: 'twitter:title',
      value: meta.title,
    });
    setMetaTag({
      selector: 'meta[name="twitter:description"]',
      attribute: 'name',
      key: 'twitter:description',
      value: meta.description,
    });

    if (typeof window !== 'undefined') {
      const currentUrl = `${window.location.origin}${location.pathname}`;
      setMetaTag({
        selector: 'meta[property="og:url"]',
        attribute: 'property',
        key: 'og:url',
        value: currentUrl,
      });
      setCanonical(currentUrl);
    }
  }, [appName, defaultPageMeta, location.pathname, pageMetaByRoute]);

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
