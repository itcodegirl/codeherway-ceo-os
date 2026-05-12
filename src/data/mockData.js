export const opportunities = [
  {
    id: 1,
    name: 'XPAIRK Partnership',
    company: 'XPAIRK',
    stage: 'In Progress',
    priority: 'High',
    nextStep: 'Send proposal follow-up',
  },
  {
    id: 2,
    name: 'Frontend Developer Role',
    company: 'Studio North',
    stage: 'Awaiting Reply',
    priority: 'Medium',
    nextStep: 'Check in with recruiter',
  },
  {
    id: 3,
    name: 'Podcast Guest Opportunity',
    company: 'Women in Product Media',
    stage: 'New',
    priority: 'Low',
    nextStep: 'Review invite and respond',
  },
];

export const contentItems = [
  {
    id: 1,
    title: 'Why Women Belong in Tech Leadership',
    platform: 'LinkedIn',
    status: 'Drafting',
  },
  {
    id: 2,
    title: 'CodeHerWay Founder Update',
    platform: 'Blog',
    status: 'Editing',
  },
  {
    id: 3,
    title: 'CEO OS Build in Public Post',
    platform: 'LinkedIn',
    status: 'Scheduled',
  },
];

export const weeklyPriorities = [
  {
    id: 1,
    title: 'Send the XPAIRK partnership proposal and book the follow-up call',
    owner: '',
    status: 'In Progress',
  },
  {
    id: 2,
    title: "Finish this week's founder narrative draft and schedule it",
    owner: '',
    status: 'Planned',
  },
  {
    id: 3,
    title: 'Close out the Studio North recruiter conversation',
    owner: '',
    status: 'Blocked',
  },
];

export const weeklyWins = [
  {
    id: 1,
    text: 'Closed the first paid pilot — revenue is real now.',
    category: 'Revenue',
  },
  {
    id: 2,
    text: 'Shipped the onboarding flow the team has been asking for.',
    category: 'Product',
  },
  {
    id: 3,
    text: 'Said no to a distracting partnership without burning the bridge.',
    category: 'Personal',
  },
];

export const weeklyBlockers = [
  {
    id: 1,
    text: 'Partnership proposal is stuck — no one owns the follow-up.',
    severity: 'owner',
  },
  {
    id: 2,
    text: 'Strong content ideas, but no protected window to write.',
    severity: 'time',
  },
];

export const dashboardDemoData = {
  recentActivity: [
    {
      id: 'demo-activity-priority',
      title: 'Priority in motion: Align weekly founder operating rhythm',
      time: 'Today',
      type: 'Planning',
    },
    {
      id: 'demo-activity-opportunity',
      title: 'Opportunity advanced: XPAIRK Partnership (In Progress)',
      time: 'Priority: High',
      type: 'Opportunity',
    },
    {
      id: 'demo-activity-content',
      title: 'Content queued: CEO OS Build in Public Post (Scheduled)',
      time: 'LinkedIn',
      type: 'Content',
    },
  ],
  executiveSnapshotFallback: {
    strategicFocus: 'Set this week\'s primary priority',
    topRisk: 'No critical risks logged',
    momentum: 'Needs attention',
  },
  focusScore: {
    demoSuffix: 'Local demo',
  },
  demoNote: 'Demo data is active on this device. It is not synced.',
};

