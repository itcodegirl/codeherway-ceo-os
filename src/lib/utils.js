import { notifySaveFailed, notifySaveSucceeded } from './saveStatusBus';

let fallbackIdCounter = 0;

export function buildCreateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  fallbackIdCounter = (fallbackIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now().toString(36)}-${fallbackIdCounter.toString(36)}`;
}

export function formatIsoDate(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '0000';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  const day = parts.find((part) => part.type === 'day')?.value || '01';

  return `${year}-${month}-${day}`;
}

export function normalizePath(path) {
  if (!path || typeof path !== 'string') {
    return '/';
  }

  const normalized = path
    .replace(/\/+$/, '')
    .replace(/^\/+/, '/');

  return normalized || '/';
}

/**
 * Best-effort localStorage write. Returns `true` on success, `false` on any
 * failure (quota exceeded, private-browsing block, security restriction).
 *
 * Always emits a `ceo-os:save-status` event via `saveStatusBus` so the
 * `SaveStatusPill` reflects the outcome of the last user-data write — not
 * just the outcome of `usePersistentState` writes. This closes the audit
 * finding that the trust pill only reflected UI-preference writes.
 *
 * Pass `{ silent: true }` for writes that should not surface to the user
 * (e.g. internal telemetry housekeeping).
 */
export function safeLocalStorageSetItem(
  key,
  value,
  warningMessage = 'Failed to persist local data',
  { silent = false } = {},
) {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    if (!silent) {
      notifySaveSucceeded(key);
    }
    return true;
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.warn(warningMessage, error);
    }
    if (!silent) {
      notifySaveFailed(key, error);
    }
    return false;
  }
}

/**
 * Strict localStorage write that throws on failure. Same `saveStatusBus`
 * semantics as `safeLocalStorageSetItem` — repositories that throw on
 * persistence failure will also emit a failure event so the UI does not
 * silently imply a save succeeded.
 */
export function requireLocalStorageSetItem(
  key,
  value,
  errorMessage = 'Failed to persist local data',
  options,
) {
  const didPersist = safeLocalStorageSetItem(key, value, errorMessage, options);

  if (!didPersist) {
    throw new Error(errorMessage);
  }

  return true;
}
