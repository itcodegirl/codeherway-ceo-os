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
    title: 'Ship a meaningful progress update for XPAIRK partnership',
    owner: 'Team Member',
    status: 'In Progress',
  },
  {
    id: 2,
    title: "Finalize this week's founder narrative draft",
    owner: 'Team Lead',
    status: 'Planned',
  },
  {
    id: 3,
    title: 'Recruiter follow-up sequence for Studio North',
    owner: 'Team Member',
    status: 'Blocked',
  },
];

export const weeklyWins = [
  {
    id: 1,
    text: 'Shipped baseline dashboard and executive KPI surface with responsive cards.',
    category: 'Product',
  },
  {
    id: 2,
    text: 'Built a clean side nav + top bar pattern with route-level shell consistency.',
    category: 'Execution',
  },
  {
    id: 3,
    text: 'Established a modular style architecture for page-specific CSS refinements.',
    category: 'Engineering',
  },
];

export const weeklyBlockers = [
  {
    id: 1,
    text: 'Partnership proposal follow-up needs a clear owner before Friday.',
    severity: 'warning',
  },
  {
    id: 2,
    text: 'Founder content queue has strong ideas but no protected publishing window.',
    severity: 'warning',
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
    demoSuffix: 'Local sample',
  },
  demoNote: 'Local sample data is active. Connect workspace data to replace sample records.',
};

