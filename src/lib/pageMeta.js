export function buildPageMetaByRoute(appName) {
  return {
    '/': {
      title: `Focus Home | ${appName}`,
      description: 'ADHD-supportive focus command center for momentum, blockers, reminders, and next moves.',
    },
    '/opportunities': {
      title: `Opportunities | ${appName}`,
      description: 'Track partnerships, role pipelines, and strategic outreach in one opportunity workspace.',
    },
    '/capture': {
      title: `Capture | ${appName}`,
      description: 'Capture ideas, tasks, opportunities, and journal fragments fast with sticky-note simplicity.',
    },
    '/content': {
      title: `Content OS | ${appName}`,
      description: 'Plan, monitor, and ship founder content across channels with a clear publishing workflow.',
    },
    '/weekly-brief': {
      title: `Weekly Brief | ${appName}`,
      description: 'Review weekly priorities, wins, blockers, and next executive moves with clarity.',
    },
    '/chief-of-staff': {
      title: `Chief of Staff | ${appName}`,
      description: 'Transform notes into executive summaries, action items, and communication-ready drafts.',
    },
    '/ops-reliability': {
      title: `Ops Reliability | ${appName}`,
      description: 'Review route-size and telemetry ingest SLO trends with run-over-run reliability context.',
    },
    '/settings': {
      title: `Settings | ${appName}`,
      description: 'Manage workspace profile, timezone, and experience preferences for CEO OS.',
    },
  };
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
