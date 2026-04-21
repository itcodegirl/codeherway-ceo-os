import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { buildDefaultPageMeta, resolvePageMeta, setCanonical, setMetaTag } from '../lib/pageMeta';

export function usePageMeta(appName) {
  const location = useLocation();

  useEffect(() => {
    const meta = resolvePageMeta(appName, location.pathname);
    const normalizedAppName = appName || 'CEO OS';
    const defaultMeta = buildDefaultPageMeta(normalizedAppName);
    const fallbackMeta = resolvePageMeta(normalizedAppName, '/');

    const resolvedMeta = meta || fallbackMeta || defaultMeta;
    document.title = resolvedMeta.title;

    setMetaTag({
      selector: 'meta[name="description"]',
      attribute: 'name',
      key: 'description',
      value: resolvedMeta.description,
    });
    setMetaTag({
      selector: 'meta[property="og:title"]',
      attribute: 'property',
      key: 'og:title',
      value: resolvedMeta.title,
    });
    setMetaTag({
      selector: 'meta[property="og:description"]',
      attribute: 'property',
      key: 'og:description',
      value: resolvedMeta.description,
    });
    setMetaTag({
      selector: 'meta[property="og:site_name"]',
      attribute: 'property',
      key: 'og:site_name',
      value: normalizedAppName,
    });
    setMetaTag({
      selector: 'meta[name="twitter:title"]',
      attribute: 'name',
      key: 'twitter:title',
      value: resolvedMeta.title,
    });
    setMetaTag({
      selector: 'meta[name="twitter:description"]',
      attribute: 'name',
      key: 'twitter:description',
      value: resolvedMeta.description,
    });

    if (typeof window === 'undefined') {
      return;
    }

    const currentUrl = `${window.location.origin}${location.pathname}`;
    setMetaTag({
      selector: 'meta[property="og:url"]',
      attribute: 'property',
      key: 'og:url',
      value: currentUrl,
    });
    setCanonical(currentUrl);
  }, [appName, location.pathname]);

  return null;
}

export default usePageMeta;
