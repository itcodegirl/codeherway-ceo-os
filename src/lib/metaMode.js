// Lightweight feature gate so admin / ops surfaces stay invisible to a
// first-time portfolio reviewer but remain reachable for the team via a
// `?meta=1` URL flag. Once the flag has been observed in the URL the choice
// persists for the session so the user can navigate around without losing
// access.

export const META_MODE_QUERY_PARAM = 'meta';
export const META_MODE_QUERY_VALUE = '1';
export const META_MODE_STORAGE_KEY = 'codeherway:meta-mode';

export function readMetaModeFromSearch(search) {
  if (typeof search !== 'string' || !search) {
    return false;
  }

  try {
    const normalized = search.startsWith('?') ? search : `?${search}`;
    const params = new URLSearchParams(normalized);
    return params.get(META_MODE_QUERY_PARAM) === META_MODE_QUERY_VALUE;
  } catch {
    return false;
  }
}

export function readMetaModeFromStorage(storage) {
  if (!storage || typeof storage.getItem !== 'function') {
    return false;
  }

  try {
    return storage.getItem(META_MODE_STORAGE_KEY) === META_MODE_QUERY_VALUE;
  } catch {
    return false;
  }
}

export function writeMetaModeToStorage(storage, value) {
  if (!storage || typeof storage.setItem !== 'function') {
    return;
  }

  try {
    storage.setItem(
      META_MODE_STORAGE_KEY,
      value ? META_MODE_QUERY_VALUE : '0',
    );
  } catch {
    // sessionStorage can throw in private modes / sandboxed iframes — in that
    // case we silently fall back to per-render derivation.
  }
}
