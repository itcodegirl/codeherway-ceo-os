export const PRIORITY_STATUS_OPTIONS = ['Planned', 'In Progress', 'Blocked'];
export const WIN_CATEGORY_OPTIONS = ['Product', 'Execution', 'Engineering'];
export const BLOCKER_SEVERITY_OPTIONS = ['warning', 'high'];

export const DEFAULT_EDITOR_STATE = {
  type: '',
  itemId: '',
};

function buildItemId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

const EDITOR_STRATEGIES = {
  priority: {
    addTitle: 'Add Priority',
    editTitle: 'Edit Priority',
    getDefaultFormValues: () => ({
      title: '',
      owner: 'Jenna',
      status: 'Planned',
    }),
    getFormValuesForEdit: (item) => ({
      title: item.title || '',
      owner: item.owner || 'Jenna',
      status: item.status || 'Planned',
    }),
    createPayload: (formValues, existingId) => {
      const title = (formValues.title || '').trim();
      const owner = (formValues.owner || '').trim();
      const status = formValues.status || 'Planned';

      if (!title || !owner) {
        return { error: 'Title and owner are required.' };
      }

      return {
        payload: {
          id: existingId || buildItemId('priority'),
          title,
          owner,
          status,
        },
      };
    },
  },
  win: {
    addTitle: 'Add Win',
    editTitle: 'Edit Win',
    getDefaultFormValues: () => ({
      text: '',
      category: 'Execution',
    }),
    getFormValuesForEdit: (item) => ({
      text: item.text || '',
      category: item.category || 'Execution',
    }),
    createPayload: (formValues, existingId) => {
      const text = (formValues.text || '').trim();
      const category = (formValues.category || '').trim() || 'Execution';

      if (!text) {
        return { error: 'Win text is required.' };
      }

      return {
        payload: {
          id: existingId || buildItemId('win'),
          text,
          category,
        },
      };
    },
  },
  blocker: {
    addTitle: 'Add Blocker',
    editTitle: 'Edit Blocker',
    getDefaultFormValues: () => ({
      text: '',
      severity: 'warning',
    }),
    getFormValuesForEdit: (item) => ({
      text: item.text || '',
      severity: item.severity || 'warning',
    }),
    createPayload: (formValues, existingId) => {
      const text = (formValues.text || '').trim();
      const severity = formValues.severity || 'warning';

      if (!text) {
        return { error: 'Blocker text is required.' };
      }

      return {
        payload: {
          id: existingId || buildItemId('blocker'),
          text,
          severity,
        },
      };
    },
  },
};

function getStrategy(type) {
  return EDITOR_STRATEGIES[type] || null;
}

export function getDefaultFormValues(type) {
  const strategy = getStrategy(type);
  return strategy ? strategy.getDefaultFormValues() : {};
}

export function getFormValuesForEdit(type, item) {
  const strategy = getStrategy(type);
  return strategy ? strategy.getFormValuesForEdit(item) : {};
}

export function getEditorTitle(type, isEditing) {
  const strategy = getStrategy(type);
  if (!strategy) {
    return 'Edit Item';
  }

  return isEditing ? strategy.editTitle : strategy.addTitle;
}

export function createEditorPayload(type, formValues, existingId) {
  const strategy = getStrategy(type);
  if (!strategy) {
    return { error: 'Select a valid item type before saving.' };
  }

  return strategy.createPayload(formValues, existingId);
}
