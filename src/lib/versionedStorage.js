import {
  createVersionedStorageEnvelope,
  getStorageSchema,
  readVersionedStoragePayload,
} from './dataSchema';
import { parseJsonOrPreserveCorruption } from './storageCorruption';
import { requireLocalStorageSetItem, safeLocalStorageSetItem } from './utils';

function getBrowserLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

export function getVersionedStorageKey(domain) {
  const schema = getStorageSchema(domain);
  if (!schema) {
    throw new Error(`Unknown storage schema domain: ${domain}`);
  }

  return schema.key;
}

export function readVersionedLocalStorage(domain, fallbackValue) {
  const storage = getBrowserLocalStorage();
  if (!storage) {
    return fallbackValue;
  }

  const storageKey = getVersionedStorageKey(domain);

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) {
      return fallbackValue;
    }

    const parsed = parseJsonOrPreserveCorruption(storageKey, raw, null);
    const { data, isDomainMismatch } = readVersionedStoragePayload(domain, parsed);
    if (isDomainMismatch) {
      return fallbackValue;
    }

    return data ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function writeVersionedLocalStorage(domain, data, errorMessage) {
  const storageKey = getVersionedStorageKey(domain);
  requireLocalStorageSetItem(
    storageKey,
    JSON.stringify(createVersionedStorageEnvelope(domain, data)),
    errorMessage,
  );
}

export function safeWriteVersionedLocalStorage(domain, data, warningMessage) {
  const storageKey = getVersionedStorageKey(domain);
  return safeLocalStorageSetItem(
    storageKey,
    JSON.stringify(createVersionedStorageEnvelope(domain, data)),
    warningMessage,
  );
}
