import {
  weeklyPriorities as defaultPriorities,
  weeklyWins as defaultWins,
  weeklyBlockers as defaultBlockers,
} from '../data/mockData';

export {
  defaultPriorities,
  defaultWins,
  defaultBlockers,
};

export const DEFAULT_REVIEW_NOTES = '';

export const PRIORITY_STATUS_OPTIONS = ['Planned', 'In Progress', 'Blocked'];
export const WIN_CATEGORY_OPTIONS = ['Product', 'Execution', 'Engineering'];
export const BLOCKER_SEVERITY_OPTIONS = ['warning', 'high'];

const DEFAULT_EDITOR_FORM_BY_TYPE = {
  priority: {
    title: '',
    owner: 'Team Member',
    status: 'Planned',
  },
  win: {
    text: '',
    category: 'Execution',
  },
  blocker: {
    text: '',
    severity: 'warning',
  },
};

export function getDefaultFormValues(type) {
  return { ...(DEFAULT_EDITOR_FORM_BY_TYPE[type] || {}) };
}
