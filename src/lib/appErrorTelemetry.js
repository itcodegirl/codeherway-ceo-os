export const APP_ERROR_TELEMETRY_EVENT = 'ceo-os:app-error';

const APP_ERROR_STORAGE_KEY = 'ceo-os-app-error-events';
const MAX_APP_ERROR_EVENTS = 25;
const MAX_STACK_LINES = 8;

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

function readStoredEvents() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(APP_ERROR_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistStoredEvents(events) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(APP_ERROR_STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Unable to persist app error telemetry.', error);
    }
  }
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

  const current = readStoredEvents();
  const next = [detail, ...current].slice(0, MAX_APP_ERROR_EVENTS);
  persistStoredEvents(next);

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(APP_ERROR_TELEMETRY_EVENT, { detail }));
  }

  if (import.meta.env.DEV) {
    console.error('[app-error-telemetry]', detail);
  }

  return detail;
}

export function listAppErrorTelemetryEvents() {
  return readStoredEvents();
}
