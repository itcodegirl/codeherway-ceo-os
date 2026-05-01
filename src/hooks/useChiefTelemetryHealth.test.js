import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getChiefTelemetrySourceMock,
  listChiefTelemetryEventsMock,
} = vi.hoisted(() => ({
  getChiefTelemetrySourceMock: vi.fn(() => 'local'),
  listChiefTelemetryEventsMock: vi.fn(),
}));

vi.mock('../lib/chiefTelemetryRepository', () => ({
  CHIEF_TELEMETRY_UPDATED_EVENT: 'ceo-os:chief-telemetry-updated',
  getChiefTelemetrySource: getChiefTelemetrySourceMock,
  listChiefTelemetryEvents: listChiefTelemetryEventsMock,
}));

import { useChiefTelemetryHealth } from './useChiefTelemetryHealth';

function createDeferred() {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });

  return {
    promise,
    resolve,
  };
}

describe('useChiefTelemetryHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads telemetry events and derives saved/skipped/failed counters', async () => {
    listChiefTelemetryEventsMock.mockResolvedValue({
      source: 'local',
      events: [
        {
          id: 'event-1',
          event: 'accept_item_saved',
          timestamp: '2026-04-21T08:00:00.000Z',
        },
        {
          id: 'event-2',
          event: 'accept_item_skipped',
          timestamp: '2026-04-21T07:00:00.000Z',
        },
        {
          id: 'event-3',
          event: 'accept_item_failed',
          timestamp: '2026-04-21T06:00:00.000Z',
        },
      ],
    });

    const { result } = renderHook(() => useChiefTelemetryHealth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(listChiefTelemetryEventsMock).toHaveBeenCalledWith({ limit: 50 });
    expect(result.current.source).toBe('local');
    expect(result.current.recentCount).toBe(3);
    expect(result.current.lastEventTimestamp).toBe('2026-04-21T08:00:00.000Z');
    expect(result.current.recentEvents).toHaveLength(3);
    expect(result.current.outcomeCounters).toEqual({
      saved: 1,
      skipped: 1,
      failed: 1,
    });
  });

  it('refreshes telemetry when repository update event is dispatched', async () => {
    listChiefTelemetryEventsMock
      .mockResolvedValueOnce({
        source: 'local',
        events: [
          {
            id: 'event-1',
            event: 'generate_started',
            timestamp: '2026-04-21T07:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        source: 'supabase',
        events: [
          {
            id: 'event-2',
            event: 'generate_completed',
            timestamp: '2026-04-21T09:30:00.000Z',
          },
          {
            id: 'event-1',
            event: 'generate_started',
            timestamp: '2026-04-21T07:00:00.000Z',
          },
        ],
      });

    const { result } = renderHook(() => useChiefTelemetryHealth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.recentCount).toBe(1);

    await act(async () => {
      window.dispatchEvent(new CustomEvent('ceo-os:chief-telemetry-updated'));
    });

    await waitFor(() => {
      expect(listChiefTelemetryEventsMock).toHaveBeenCalledTimes(2);
    });

    expect(result.current.source).toBe('supabase');
    expect(result.current.recentCount).toBe(2);
    expect(result.current.lastEventTimestamp).toBe('2026-04-21T09:30:00.000Z');
  });

  it('ignores stale telemetry responses when a newer refresh resolves first', async () => {
    const firstLoad = createDeferred();
    const secondLoad = createDeferred();

    listChiefTelemetryEventsMock
      .mockImplementationOnce(() => firstLoad.promise)
      .mockImplementationOnce(() => secondLoad.promise);

    const { result } = renderHook(() => useChiefTelemetryHealth());

    await waitFor(() => {
      expect(listChiefTelemetryEventsMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent('ceo-os:chief-telemetry-updated'));
    });

    await waitFor(() => {
      expect(listChiefTelemetryEventsMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      secondLoad.resolve({
        source: 'supabase',
        events: [
          {
            id: 'event-new-1',
            event: 'accept_all_completed',
            saved: 2,
            skipped: 1,
            failed: 0,
            timestamp: '2026-04-30T12:00:00.000Z',
          },
          {
            id: 'event-new-2',
            event: 'generate_completed',
            timestamp: '2026-04-30T11:00:00.000Z',
          },
        ],
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.source).toBe('supabase');
      expect(result.current.recentCount).toBe(2);
    });

    await act(async () => {
      firstLoad.resolve({
        source: 'local',
        events: [
          {
            id: 'event-old',
            event: 'accept_item_failed',
            timestamp: '2026-04-29T08:00:00.000Z',
          },
        ],
      });
      await Promise.resolve();
    });

    expect(result.current.source).toBe('supabase');
    expect(result.current.recentCount).toBe(2);
    expect(result.current.outcomeCounters).toEqual({
      saved: 2,
      skipped: 1,
      failed: 0,
    });
  });
});
