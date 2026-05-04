/**
 * Tiny pub/sub for "did the last write succeed?" UX.
 *
 * Repositories and persistent-state hooks emit either
 *   - notifySaveSucceeded(key)  on a successful write, or
 *   - notifySaveFailed(key, error) on a write that threw.
 *
 * The SaveStatusPill subscribes via `subscribeSaveStatus` and shows a brief
 * "Saved · HH:MM" reassurance or a sticky "Save failed" callout. This is the
 * single piece of UI the user can rely on to know whether their data was
 * persisted.
 *
 * Framework-agnostic so it can be called from non-React modules (repositories).
 */

export const SAVE_STATUS_EVENT = 'ceo-os:save-status';

const SAVED_PHASE = 'saved';
const FAILED_PHASE = 'failed';

function dispatch(detail) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }
  try {
    window.dispatchEvent(new CustomEvent(SAVE_STATUS_EVENT, { detail }));
  } catch {
    // swallow — the bus is purely informational
  }
}

export function notifySaveSucceeded(key) {
  if (typeof key !== 'string' || !key) {
    return;
  }
  dispatch({ phase: SAVED_PHASE, key, at: new Date().toISOString() });
}

export function notifySaveFailed(key, error) {
  if (typeof key !== 'string' || !key) {
    return;
  }
  const message = error && typeof error === 'object'
    ? String(error.message || error.code || 'Unknown save error')
    : String(error || 'Unknown save error');
  dispatch({ phase: FAILED_PHASE, key, at: new Date().toISOString(), message });
}

export function subscribeSaveStatus(handler) {
  if (typeof window === 'undefined' || typeof handler !== 'function') {
    return () => {};
  }
  const wrapped = (event) => {
    const detail = event?.detail;
    if (!detail || typeof detail.phase !== 'string') {
      return;
    }
    handler(detail);
  };
  window.addEventListener(SAVE_STATUS_EVENT, wrapped);
  return () => window.removeEventListener(SAVE_STATUS_EVENT, wrapped);
}

export const SAVE_STATUS_PHASES = Object.freeze({
  SAVED: SAVED_PHASE,
  FAILED: FAILED_PHASE,
});
