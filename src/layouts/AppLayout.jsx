import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Sidebar from '../components/ui/Sidebar';
import Topbar from '../components/ui/Topbar';
import ErrorBoundary from '../components/ui/ErrorBoundary';

const APP_NAME = 'CodeHerWay CEO OS';
const DEFAULT_PAGE_META = {
  title: `Dashboard | ${APP_NAME}`,
  description:
    'CodeHerWay CEO OS is an executive dashboard to manage opportunities, content operations, weekly priorities, and leadership workflows.',
};

const PAGE_META_BY_ROUTE = {
  '/': {
    title: `Dashboard | ${APP_NAME}`,
    description: 'Executive overview of key priorities, momentum, opportunities, and content pipeline.',
  },
  '/opportunities': {
    title: `Opportunities | ${APP_NAME}`,
    description: 'Track partnerships, role pipelines, and strategic outreach in one opportunity workspace.',
  },
  '/content': {
    title: `Content OS | ${APP_NAME}`,
    description: 'Plan, monitor, and ship founder content across channels with a clear publishing workflow.',
  },
  '/weekly-brief': {
    title: `Weekly Brief | ${APP_NAME}`,
    description: 'Review weekly priorities, wins, blockers, and next executive moves with clarity.',
  },
  '/chief-of-staff': {
    title: `Chief of Staff | ${APP_NAME}`,
    description: 'Transform notes into executive summaries, action items, and communication-ready drafts.',
  },
  '/settings': {
    title: `Settings | ${APP_NAME}`,
    description: 'Manage workspace profile, timezone, and experience preferences for CEO OS.',
  },
};

function setMetaTag({ selector, attribute, key, value }) {
  const head = document.head;
  if (!head) {
    return;
  }

  let tag = head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    head.appendChild(tag);
  }

  tag.setAttribute('content', value);
}

function setCanonical(url) {
  const head = document.head;
  if (!head) {
    return;
  }

  let canonical = head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    head.appendChild(canonical);
  }

  canonical.setAttribute('href', url);
}

function AppLayout() {
  const location = useLocation();
  const mainRef = useRef(null);

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
    const meta = PAGE_META_BY_ROUTE[location.pathname] || DEFAULT_PAGE_META;
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
