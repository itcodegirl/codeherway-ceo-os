import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  APP_ERROR_TELEMETRY_EVENT,
  emitAppErrorTelemetry,
  listAppErrorTelemetryEvents,
} from './appErrorTelemetry';

describe('src/lib/appErrorTelemetry', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('persists and dispatches error boundary telemetry details', () => {
    const listener = vi.fn();
    window.addEventListener(APP_ERROR_TELEMETRY_EVENT, listener);

    const detail = emitAppErrorTelemetry(
      new Error('Test boundary error'),
      { componentStack: '\n in Dashboard\n in AppLayout' },
      { boundary: 'AppLayout' },
    );

    expect(detail).toMatchObject({
      event: 'ui_error_boundary',
      name: 'Error',
      message: 'Test boundary error',
      context: { boundary: 'AppLayout' },
    });
    expect(typeof detail.timestamp).toBe('string');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toMatchObject({
      event: 'ui_error_boundary',
      message: 'Test boundary error',
    });

    expect(listAppErrorTelemetryEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'ui_error_boundary',
          message: 'Test boundary error',
          name: 'Error',
        }),
      ]),
    );

    window.removeEventListener(APP_ERROR_TELEMETRY_EVENT, listener);
  });

  it('retains only the latest 25 events', () => {
    Array.from({ length: 30 }).forEach((_, index) => {
      emitAppErrorTelemetry(new Error(`error-${index + 1}`), null, { batch: 'overflow-test' });
    });

    const events = listAppErrorTelemetryEvents();
    expect(events).toHaveLength(25);
    expect(events[0].message).toBe('error-30');
    expect(events[24].message).toBe('error-6');
  });
});
