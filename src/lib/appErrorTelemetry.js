export const APP_ERROR_TELEMETRY_EVENT = 'ceo-os:app-error';

const APP_ERROR_STORAGE_KEY = 'ceo-os-app-error-events';
const APP_ERROR_REMOTE_QUEUE_KEY = 'ceo-os-app-error-remote-queue';
const MAX_APP_ERROR_EVENTS = 25;
const MAX_REMOTE_QUEUE_EVENTS = 100;
const MAX_REMOTE_BATCH_SIZE = 10;
const MAX_STACK_LINES = 8;

let isFlushInFlight = false;
let flushTimerId = null;

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStack(stack) {
  const normalizedStack = normalizeText(stack);
  if (!normalizedStack) {
    return '';
  }

  return normalizedStack
    .split('\n')
    .slice(0, MAX_STACK_LINES)
    .join('\n');
}

function sanitizeError(error) {
  if (!error || typeof error !== 'object') {
    return {
      name: 'UnknownError',
      message: '',
      stack: '',
    };
  }

  return {
    name: normalizeText(error.name) || 'UnknownError',
    message: normalizeText(error.message),
    stack: normalizeStack(error.stack),
  };
}

function sanitizeInfo(info) {
  if (!info || typeof info !== 'object') {
    return '';
  }

  return normalizeStack(info.componentStack);
}

function readStoredArray(storageKey) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredArray(storageKey, items) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Unable to persist ${storageKey}.`, error);
    }
  }
}

function getRemoteTelemetryEndpoint() {
  return normalizeText(import.meta.env.VITE_APP_ERROR_TELEMETRY_URL);
}

export function isAppErrorTelemetryRemoteEnabled() {
  return Boolean(
    getRemoteTelemetryEndpoint()
    && typeof fetch === 'function',
  );
}

function enqueueRemoteTelemetryEvent(eventDetail) {
  if (!isAppErrorTelemetryRemoteEnabled()) {
    return;
  }

  const currentQueue = readStoredArray(APP_ERROR_REMOTE_QUEUE_KEY);
  const nextQueue = [...currentQueue, eventDetail].slice(-MAX_REMOTE_QUEUE_EVENTS);
  writeStoredArray(APP_ERROR_REMOTE_QUEUE_KEY, nextQueue);
}

function dequeueRemoteBatch(batchSize = MAX_REMOTE_BATCH_SIZE) {
  const currentQueue = readStoredArray(APP_ERROR_REMOTE_QUEUE_KEY);
  if (!currentQueue.length) {
    return [];
  }

  return currentQueue.slice(0, Math.max(1, batchSize));
}

function removeRemoteBatch(batchSize) {
  const currentQueue = readStoredArray(APP_ERROR_REMOTE_QUEUE_KEY);
  if (!currentQueue.length) {
    return;
  }

  const nextQueue = currentQueue.slice(Math.max(1, batchSize));
  writeStoredArray(APP_ERROR_REMOTE_QUEUE_KEY, nextQueue);
}

async function postRemoteBatch(events) {
  if (!events.length) {
    return true;
  }

  const endpoint = getRemoteTelemetryEndpoint();
  if (!endpoint || typeof fetch !== 'function') {
    return false;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'codeherway-ceo-os',
      eventType: 'app_error',
      sentAt: new Date().toISOString(),
      events,
    }),
    keepalive: true,
  });

  return Boolean(response?.ok);
}

export async function flushAppErrorTelemetryRemote() {
  if (flushTimerId) {
    clearTimeout(flushTimerId);
    flushTimerId = null;
  }

  if (!isAppErrorTelemetryRemoteEnabled() || isFlushInFlight) {
    return false;
  }

  const batch = dequeueRemoteBatch();
  if (!batch.length) {
    return true;
  }

  isFlushInFlight = true;

  try {
    const didSend = await postRemoteBatch(batch);
    if (didSend) {
      removeRemoteBatch(batch.length);
      return true;
    }

    if (import.meta.env.DEV) {
      console.warn('App error telemetry remote sink rejected a batch.');
    }
    return false;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to flush app error telemetry remote batch.', error);
    }
    return false;
  } finally {
    isFlushInFlight = false;
  }
}

export function listPendingAppErrorTelemetryRemoteEvents() {
  return readStoredArray(APP_ERROR_REMOTE_QUEUE_KEY);
}

export function resetAppErrorTelemetryStateForTests() {
  if (flushTimerId) {
    clearTimeout(flushTimerId);
    flushTimerId = null;
  }
  isFlushInFlight = false;
}

function scheduleRemoteFlush() {
  if (!isAppErrorTelemetryRemoteEnabled() || typeof window === 'undefined') {
    return;
  }

  if (flushTimerId) {
    window.clearTimeout(flushTimerId);
  }

  flushTimerId = window.setTimeout(() => {
    flushTimerId = null;
    void flushAppErrorTelemetryRemote();
  }, 500);
}

export function emitAppErrorTelemetry(error, info, context = {}) {
  const normalizedContext = context && typeof context === 'object' ? context : {};
  const sanitizedError = sanitizeError(error);
  const componentStack = sanitizeInfo(info);
  const detail = {
    event: 'ui_error_boundary',
    timestamp: new Date().toISOString(),
    route: typeof window !== 'undefined' ? window.location?.pathname || '' : '',
    ...sanitizedError,
    componentStack,
    context: normalizedContext,
  };

  const current = readStoredArray(APP_ERROR_STORAGE_KEY);
  const next = [detail, ...current].slice(0, MAX_APP_ERROR_EVENTS);
  writeStoredArray(APP_ERROR_STORAGE_KEY, next);

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(APP_ERROR_TELEMETRY_EVENT, { detail }));
  }

  enqueueRemoteTelemetryEvent(detail);
  scheduleRemoteFlush();

  if (import.meta.env.DEV) {
    console.error('[app-error-telemetry]', detail);
  }

  return detail;
}

export function listAppErrorTelemetryEvents() {
  return readStoredArray(APP_ERROR_STORAGE_KEY);
}
