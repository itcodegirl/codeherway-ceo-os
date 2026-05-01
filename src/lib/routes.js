export const APP_ROUTES = [
  {
    id: 'focus-home',
    label: 'Focus Home',
    path: '/',
    icon: 'dashboard',
    description: 'ADHD-supportive focus command center for momentum, blockers, reminders, and next moves.',
  },
  {
    id: 'capture',
    label: 'Capture',
    path: '/capture',
    icon: 'capture',
    description: 'Capture ideas, tasks, opportunities, and journal fragments fast with sticky-note simplicity.',
  },
  {
    id: 'journal',
    label: 'Journal',
    path: '/journal',
    icon: 'journal',
    description: 'Reflect with calm prompts, name what feels heavy, and choose one supportive next move.',
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    path: '/opportunities',
    icon: 'opportunities',
    description: 'Track partnerships, role pipelines, and strategic outreach in one opportunity workspace.',
  },
  {
    id: 'content',
    label: 'Content OS',
    path: '/content',
    icon: 'content',
    description: 'Plan, monitor, and ship founder content across channels with a clear publishing workflow.',
  },
  {
    id: 'weekly-brief',
    label: 'Weekly Brief',
    path: '/weekly-brief',
    icon: 'weekly',
    description: 'Review weekly priorities, wins, blockers, and next executive moves with clarity.',
  },
  {
    id: 'chief-of-staff',
    label: 'Chief of Staff',
    path: '/chief-of-staff',
    icon: 'chief',
    description: 'Transform notes into executive summaries, action items, and communication-ready drafts.',
  },
  {
    id: 'ops-reliability',
    label: 'Ops Reliability',
    path: '/ops-reliability',
    icon: 'trend',
    description: 'Review route-size and telemetry ingest SLO trends with run-over-run reliability context.',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'settings',
    description: 'Manage workspace profile, timezone, and experience preferences for CEO OS.',
  },
];

export const NAV_ITEMS = APP_ROUTES.map(({ label, path, icon }) => ({
  label,
  path,
  icon,
}));

export function toNestedRoutePath(path) {
  if (path === '/') {
    return '';
  }

  return String(path || '').replace(/^\/+/, '');
}
