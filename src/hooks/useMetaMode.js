import { useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import {
  META_MODE_STORAGE_KEY,
  readMetaModeFromSearch,
  readMetaModeFromStorage,
  writeMetaModeToStorage,
} from '../lib/metaMode';

function readSessionStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage || null;
  } catch {
    return null;
  }
}

const STORAGE_EVENT_NAME = 'codeherway:meta-mode-change';

function notifyMetaModeChange() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.dispatchEvent(new Event(STORAGE_EVENT_NAME));
  } catch {
    // ignore — environments without window.Event won't run this hook
  }
}

function subscribeToMetaModeStorage(listener) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event) => {
    if (event && event.key && event.key !== META_MODE_STORAGE_KEY) {
      return;
    }

    listener();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(STORAGE_EVENT_NAME, listener);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(STORAGE_EVENT_NAME, listener);
  };
}

function getMetaModeSnapshot() {
  return readMetaModeFromStorage(readSessionStorage()) ? 'meta' : '';
}

function getServerSnapshot() {
  return '';
}

export function useMetaMode() {
  const location = useLocation();
  const persistedSnapshot = useSyncExternalStore(
    subscribeToMetaModeStorage,
    getMetaModeSnapshot,
    getServerSnapshot,
  );
  const persistedMeta = persistedSnapshot === 'meta';
  const searchMeta = readMetaModeFromSearch(location.search);

  useEffect(() => {
    if (!searchMeta || persistedMeta) {
      return;
    }

    writeMetaModeToStorage(readSessionStorage(), true);
    notifyMetaModeChange();
  }, [searchMeta, persistedMeta]);

  return searchMeta || persistedMeta;
}
