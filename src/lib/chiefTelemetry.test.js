import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHIEF_TELEMETRY_EVENT, emitChiefTelemetry } from './chiefTelemetry';

describe('src/lib/chiefTelemetry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null for invalid event names', () => {
    expect(emitChiefTelemetry('')).toBeNull();
    expect(emitChiefTelemetry(null)).toBeNull();
  });

  it('dispatches a browser event with normalized telemetry details', async () => {
    const listener = vi.fn();
    window.addEventListener(CHIEF_TELEMETRY_EVENT, listener);

    const result = emitChiefTelemetry('generate_started', { actionKey: 'plan' });

    await Promise.resolve();

    expect(result).toMatchObject({
      event: 'generate_started',
      actionKey: 'plan',
    });
    expect(typeof result.timestamp).toBe('string');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toMatchObject({
      event: 'generate_started',
      actionKey: 'plan',
    });

    window.removeEventListener(CHIEF_TELEMETRY_EVENT, listener);
  });
});
