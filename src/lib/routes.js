export const NAV_GROUP_DEFINITIONS = [
  { id: 'today', label: 'Today' },
  { id: 'this-week', label: 'This week' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'account', label: 'Account' },
];

export const APP_ROUTES = [
  {
    id: 'focus-home',
    label: 'Focus Home',
    path: '/',
    icon: 'dashboard',
    group: 'today',
    description: 'ADHD-supportive focus command center for momentum, blockers, reminders, and next moves.',
  },
  {
    id: 'capture',
    label: 'Capture',
    path: '/capture',
    icon: 'capture',
    group: 'today',
    description: 'Capture ideas, tasks, opportunities, and journal fragments fast with sticky-note simplicity.',
  },
  {
    id: 'journal',
    label: 'Journal',
    path: '/journal',
    icon: 'journal',
    group: 'today',
    description: 'Reflect with calm prompts, name what feels heavy, and choose one supportive next move.',
  },
  {
    id: 'weekly-brief',
    label: 'Weekly Brief',
    path: '/weekly-brief',
    icon: 'weekly',
    group: 'this-week',
    description: 'Review weekly priorities, wins, blockers, and next executive moves with clarity.',
  },
  {
    id: 'chief-of-staff',
    label: 'Chief of Staff',
    path: '/chief-of-staff',
    icon: 'chief',
    group: 'this-week',
    description: 'Transform notes into executive summaries, action items, and communication-ready drafts.',
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    path: '/opportunities',
    icon: 'opportunities',
    group: 'workspace',
    description: 'Track partnerships, role pipelines, and strategic outreach in one opportunity workspace.',
  },
  {
    id: 'content',
    label: 'Content OS',
    path: '/content',
    icon: 'content',
    group: 'workspace',
    description: 'Plan, monitor, and ship founder content across channels with a clear publishing workflow.',
  },
  {
    id: 'ops-reliability',
    label: 'Ops Reliability',
    path: '/ops-reliability',
    icon: 'trend',
    group: 'account',
    description: 'Review route-size and telemetry ingest SLO trends with run-over-run reliability context.',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'settings',
    group: 'account',
    description: 'Manage workspace profile, timezone, and experience preferences for CEO OS.',
  },
];

export const NAV_ITEMS = APP_ROUTES.map(({ label, path, icon }) => ({
  label,
  path,
  icon,
}));

export function buildNavGroups(routes = APP_ROUTES) {
  return NAV_GROUP_DEFINITIONS
    .map((group) => ({
      ...group,
      items: routes
        .filter((route) => route.group === group.id)
        .map(({ label, path, icon }) => ({ label, path, icon })),
    }))
    .filter((group) => group.items.length > 0);
}

export const NAV_GROUPS = buildNavGroups();

export function toNestedRoutePath(path) {
  if (path === '/') {
    return '';
  }

  return String(path || '').replace(/^\/+/, '');
}
