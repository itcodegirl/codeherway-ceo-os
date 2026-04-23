export function buildCreateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return String(Date.now());
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

export function safeLocalStorageSetItem(key, value, warningMessage = 'Failed to persist local data') {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.warn(warningMessage, error);
    }
    return false;
  }
}
