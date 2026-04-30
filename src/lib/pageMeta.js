import { APP_ROUTES } from './routes';

export function buildPageMetaByRoute(appName) {
  return APP_ROUTES.reduce((routeMap, route) => ({
    ...routeMap,
    [route.path]: {
      title: `${route.label} | ${appName}`,
      description: route.description,
    },
  }), {});
}

export function buildDefaultPageMeta(appName) {
  return {
    title: `Focus Home | ${appName}`,
    description:
      `${appName} is a connected command center for focus, momentum, blockers, ideas, and weekly execution.`,
  };
}

function normalizePathname(pathname = '') {
  if (typeof pathname !== 'string') {
    return '/';
  }

  const normalized = `/${pathname.trim().replace(/^\/+/, '').split('/').filter(Boolean).join('/')}`.replace(/\/\/+/g, '/');
  if (!normalized || normalized === '/') {
    return '/';
  }

  return normalized;
}

export function resolvePageMeta(appName, pathname) {
  const map = buildPageMetaByRoute(appName);
  const normalizedPathname = normalizePathname(pathname);
  return map[normalizedPathname] || buildDefaultPageMeta(appName);
}

export function setMetaTag({ selector, attribute, key, value }) {
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

export function setCanonical(url) {
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
