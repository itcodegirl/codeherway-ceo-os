export const WORKSPACE_SETUP_STORAGE_KEY = 'ceo-os-workspace-setup';
export const WORKSPACE_SETUP_UPDATED_EVENT = 'ceo-os:workspace-setup-updated';

export const WORKSPACE_SETUP_MODES = {
  blank: 'blank',
  demo: 'demo',
};

const VALID_MODES = new Set(Object.values(WORKSPACE_SETUP_MODES));

function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

function emitWorkspaceSetupUpdated(detail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(WORKSPACE_SETUP_UPDATED_EVENT, { detail }));
}

function normalizeMode(value) {
  return VALID_MODES.has(value) ? value : '';
}

export function getWorkspaceSetupChoice() {
  const storage = getStorage();
  if (!storage) {
    return '';
  }

  try {
    const raw = storage.getItem(WORKSPACE_SETUP_STORAGE_KEY);
    if (!raw) {
      return '';
    }

    const parsed = JSON.parse(raw);
    return normalizeMode(parsed?.mode || parsed);
  } catch {
    return '';
  }
}

export function hasWorkspaceSetupChoice() {
  return Boolean(getWorkspaceSetupChoice());
}

export function getWorkspaceSetupMode() {
  return getWorkspaceSetupChoice() || WORKSPACE_SETUP_MODES.demo;
}

export function isDemoWorkspaceEnabled() {
  return getWorkspaceSetupMode() === WORKSPACE_SETUP_MODES.demo;
}

export function saveWorkspaceSetupMode(mode) {
  const normalizedMode = normalizeMode(mode);
  if (!normalizedMode) {
    return getWorkspaceSetupMode();
  }

  const storage = getStorage();
  if (!storage) {
    return normalizedMode;
  }

  const payload = {
    mode: normalizedMode,
    updatedAt: new Date().toISOString(),
  };

  storage.setItem(WORKSPACE_SETUP_STORAGE_KEY, JSON.stringify(payload));
  emitWorkspaceSetupUpdated(payload);
  return normalizedMode;
}
