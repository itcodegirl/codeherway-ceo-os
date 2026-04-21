import { useEffect } from 'react';

const APP_TITLE = 'CodeHerWay CEO OS';
const DEFAULT_DESCRIPTION =
  'CodeHerWay CEO OS is an executive dashboard to manage opportunities, content operations, weekly priorities, and leadership workflows.';

function upsertMetaTag(attribute, key, content) {
  const selector = `meta[${attribute}="${key}"]`;
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

export function useDocumentTitle(pageTitle, pageDescription = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const resolvedTitle = pageTitle ? `${pageTitle} | ${APP_TITLE}` : APP_TITLE;
    const resolvedDescription = pageDescription?.trim() || DEFAULT_DESCRIPTION;

    document.title = resolvedTitle;
    upsertMetaTag('name', 'description', resolvedDescription);
    upsertMetaTag('property', 'og:title', resolvedTitle);
    upsertMetaTag('property', 'og:description', resolvedDescription);
    upsertMetaTag('name', 'twitter:title', resolvedTitle);
    upsertMetaTag('name', 'twitter:description', resolvedDescription);

    if (typeof window !== 'undefined' && window.location?.href) {
      upsertMetaTag('property', 'og:url', window.location.href);
    }
  }, [pageDescription, pageTitle]);
}
