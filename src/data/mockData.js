export const stats = [
	{ id: 1, label: 'Active Opportunities', value: 12, change: '+3 this week' },
	{ id: 2, label: 'Content in Pipeline', value: 18, change: '+5 drafts' },
	{ id: 3, label: 'Follow-Ups Due', value: 4, change: '2 high priority' },
	{ id: 4, label: 'Weekly Focus Score', value: '86%', change: '+8% from last week' },
];

export const priorities = [
	'Finalize CEO OS dashboard layout',
	'Send follow-up for XPAIRK partnership',
	'Draft LinkedIn post for CodeHerWay leadership positioning',
];

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
    owner: 'Jenna',
    status: 'In Progress',
  },
  {
    id: 2,
    title: 'Finalize this week’s founder narrative draft',
    owner: 'You',
    status: 'Planned',
  },
  {
    id: 3,
    title: 'Recruiter follow-up sequence for Studio North',
    owner: 'Jenna',
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
    text: 'Opportunities and weekly brief workflows still need full CRUD interactions.',
    severity: 'warning',
  },
  {
    id: 2,
    text: 'AI workspace is presenting static copy and lacks action wiring.',
    severity: 'warning',
  },
];
