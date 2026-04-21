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

export function getDefaultFormValues(type) {
  switch (type) {
    case 'priority':
      return {
        title: '',
        owner: 'Jenna',
        status: 'Planned',
      };
    case 'win':
      return {
        text: '',
        category: 'Execution',
      };
    case 'blocker':
      return {
        text: '',
        severity: 'warning',
      };
    default:
      return {};
  }
}

export function getFormValuesForEdit(type, item) {
  switch (type) {
    case 'priority':
      return {
        title: item.title || '',
        owner: item.owner || 'Jenna',
        status: item.status || 'Planned',
      };
    case 'win':
      return {
        text: item.text || '',
        category: item.category || 'Execution',
      };
    case 'blocker':
      return {
        text: item.text || '',
        severity: item.severity || 'warning',
      };
    default:
      return {};
  }
}

export function getEditorTitle(type, isEditing) {
  switch (type) {
    case 'priority':
      return isEditing ? 'Edit Priority' : 'Add Priority';
    case 'win':
      return isEditing ? 'Edit Win' : 'Add Win';
    case 'blocker':
      return isEditing ? 'Edit Blocker' : 'Add Blocker';
    default:
      return 'Edit Item';
  }
}

export function createEditorPayload(type, formValues, existingId) {
  if (type === 'priority') {
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
  }

  if (type === 'win') {
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
  }

  if (type === 'blocker') {
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
  }

  return { error: 'Select a valid item type before saving.' };
}
