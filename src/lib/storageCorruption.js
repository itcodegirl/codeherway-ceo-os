/**
 * Preserves a corrupted localStorage blob under a timestamped backup key so a
 * silent JSON.parse failure does not destroy the user's data without trace.
 *
 * Emits a `ceo-os:storage-corruption` window event so a UI banner can react.
 * Caps the number of preserved backups per key at 3 to avoid quota churn.
 *
 * The list of backup keys for a given main key is tracked in an index entry
 * (`${key}__corrupt_index`) so we never iterate localStorage directly — this
 * keeps behavior consistent across browsers and test mocks.
 */

export const STORAGE_CORRUPTION_EVENT = 'ceo-os:storage-corruption';
export const STORAGE_RESTORED_EVENT = 'ceo-os:storage-restored';
const CORRUPT_BACKUP_PREFIX_SUFFIX = '__corrupt_';
const CORRUPT_INDEX_SUFFIX = '__corrupt_index';
const MAX_BACKUPS_PER_KEY = 3;

let monotonicCounter = 0;

function safeStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readBackupIndex(storage, key) {
  try {
    const raw = storage.getItem(`${key}${CORRUPT_INDEX_SUFFIX}`);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function writeBackupIndex(storage, key, list) {
  try {
    storage.setItem(`${key}${CORRUPT_INDEX_SUFFIX}`, JSON.stringify(list));
  } catch {
    // index write failed; we'll lose precise tracking but the backup still exists
  }
}

function trimOldBackups(storage, key, list) {
  const trimmed = list.slice();
  while (trimmed.length > MAX_BACKUPS_PER_KEY) {
    const oldest = trimmed.shift();
    try {
      storage.removeItem(oldest);
    } catch {
      // ignore trim failures; we tried
    }
  }
  return trimmed;
}

export function preserveCorruptStorageValue(key, rawValue, error) {
  const storage = safeStorage();
  if (!storage || typeof key !== 'string' || rawValue == null) {
    return null;
  }

  monotonicCounter = (monotonicCounter + 1) % 1000;
  const suffix = `${Date.now()}-${String(monotonicCounter).padStart(3, '0')}`;
  const backupKey = `${key}${CORRUPT_BACKUP_PREFIX_SUFFIX}${suffix}`;
  let backupWritten = false;

  try {
    storage.setItem(backupKey, String(rawValue));
    backupWritten = true;
  } catch {
    // Storage may be full; we still want to dispatch the event so the UI can warn.
  }

  if (backupWritten) {
    const currentIndex = readBackupIndex(storage, key);
    currentIndex.push(backupKey);
    const nextIndex = trimOldBackups(storage, key, currentIndex);
    writeBackupIndex(storage, key, nextIndex);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(
        new CustomEvent(STORAGE_CORRUPTION_EVENT, {
          detail: {
            key,
            backupKey: backupWritten ? backupKey : null,
            at: new Date().toISOString(),
            message: error?.message || 'Stored value was unreadable.',
          },
        }),
      );
    } catch {
      // ignore dispatch errors
    }
  }

  if (import.meta.env?.DEV) {
    console.warn(`Preserved corrupt localStorage value for "${key}" at "${backupKey}".`);
  }

  return backupWritten ? backupKey : null;
}

function resolveFallback(fallbackValue) {
  return typeof fallbackValue === 'function' ? fallbackValue() : fallbackValue;
}

export function parseJsonOrPreserveCorruption(key, rawValue, fallbackValue) {
  if (rawValue === null || rawValue === undefined) {
    return resolveFallback(fallbackValue);
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    preserveCorruptStorageValue(key, rawValue, error);
    return resolveFallback(fallbackValue);
  }
}

function parseSuffixTimestamp(backupKey, key) {
  const prefix = `${key}${CORRUPT_BACKUP_PREFIX_SUFFIX}`;
  if (!backupKey.startsWith(prefix)) {
    return null;
  }
  const suffix = backupKey.slice(prefix.length);
  const dashIndex = suffix.indexOf('-');
  const epochPart = dashIndex === -1 ? suffix : suffix.slice(0, dashIndex);
  const epoch = Number(epochPart);
  return Number.isFinite(epoch) ? new Date(epoch).toISOString() : null;
}

/**
 * Returns the surviving backups for a primary key, newest first. Each entry
 * carries the raw stored value so the UI can preview and the user can decide
 * whether to restore.
 */
export function listCorruptBackups(key) {
  const storage = safeStorage();
  if (!storage || typeof key !== 'string' || !key) {
    return [];
  }
  const index = readBackupIndex(storage, key);
  const entries = [];
  for (const backupKey of index) {
    let value = null;
    try {
      value = storage.getItem(backupKey);
    } catch {
      value = null;
    }
    if (value === null) {
      // Already gone (trimmed or evicted); skip.
      continue;
    }
    entries.push({
      backupKey,
      value,
      savedAt: parseSuffixTimestamp(backupKey, key),
    });
  }
  return entries.reverse();
}

/**
 * Restores a previously preserved backup back into the primary key, removes
 * the backup entry from the index, and emits STORAGE_RESTORED_EVENT so any
 * listeners (banner, persistent state hook) can react.
 *
 * Returns true on success, false if the backup is missing or storage refuses
 * the write.
 */
export function restoreCorruptBackup(key, backupKey) {
  const storage = safeStorage();
  if (!storage || typeof key !== 'string' || !key || typeof backupKey !== 'string' || !backupKey) {
    return false;
  }

  let raw = null;
  try {
    raw = storage.getItem(backupKey);
  } catch {
    raw = null;
  }
  if (raw === null) {
    return false;
  }

  try {
    storage.setItem(key, raw);
  } catch {
    return false;
  }

  try {
    storage.removeItem(backupKey);
  } catch {
    // ignore — index removal still happens
  }

  const remaining = readBackupIndex(storage, key).filter((entry) => entry !== backupKey);
  writeBackupIndex(storage, key, remaining);

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(
        new CustomEvent(STORAGE_RESTORED_EVENT, {
          detail: { key, backupKey, at: new Date().toISOString() },
        }),
      );
    } catch {
      // ignore
    }
  }

  return true;
}

/**
 * Drops a backup without restoring it. Used by the recovery UI when the user
 * decides the preserved blob is not worth keeping.
 */
export function discardCorruptBackup(key, backupKey) {
  const storage = safeStorage();
  if (!storage || typeof key !== 'string' || !key || typeof backupKey !== 'string' || !backupKey) {
    return false;
  }

  try {
    storage.removeItem(backupKey);
  } catch {
    // ignore — still remove from the index below
  }

  const remaining = readBackupIndex(storage, key).filter((entry) => entry !== backupKey);
  writeBackupIndex(storage, key, remaining);
  return true;
}
