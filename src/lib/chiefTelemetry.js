export const CHIEF_TELEMETRY_EVENT = 'ceo-os:chief-telemetry';

export function emitChiefTelemetry(eventName, payload = {}) {
  const normalizedEventName = typeof eventName === 'string' ? eventName.trim() : '';
  if (!normalizedEventName) {
    return null;
  }

  const detail = {
    event: normalizedEventName,
    timestamp: new Date().toISOString(),
    ...(payload && typeof payload === 'object' ? payload : {}),
  };

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(CHIEF_TELEMETRY_EVENT, { detail }));
  }

  if (import.meta.env.DEV) {
    console.info('[chief-telemetry]', detail);
  }

  return detail;
}
