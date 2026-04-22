import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadChiefTelemetryRepositoryWithSupabaseMock(mockDefinition) {
  vi.resetModules();
  vi.doMock('./supabase', () => mockDefinition);
  return import('./chiefTelemetryRepository');
}

describe('src/lib/chiefTelemetryRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('records and lists telemetry events from local storage when Supabase is not configured', async () => {
    const {
      CHIEF_TELEMETRY_UPDATED_EVENT,
      listChiefTelemetryEvents,
      recordChiefTelemetryEvent,
    } = await loadChiefTelemetryRepositoryWithSupabaseMock({
      isSupabaseConfigured: false,
      supabaseClient: null,
      requireSupabaseUserId: vi.fn(),
    });

    const listener = vi.fn();
    window.addEventListener(CHIEF_TELEMETRY_UPDATED_EVENT, listener);

    const savedEvent = await recordChiefTelemetryEvent({
      event: 'generate_completed',
      actionKey: 'plan',
      source: 'proxy',
      requestId: 'request-1',
      correlationId: 'correlation-1',
      structuredCounts: {
        priorities: 2,
      },
    });

    const listed = await listChiefTelemetryEvents({ limit: 10 });

    expect(savedEvent).toMatchObject({
      event: 'generate_completed',
      actionKey: 'plan',
      source: 'proxy',
      requestId: 'request-1',
      correlationId: 'correlation-1',
    });
    expect(typeof savedEvent.id).toBe('string');
    expect(typeof savedEvent.timestamp).toBe('string');

    expect(listed.source).toBe('local');
    expect(listed.events).toHaveLength(1);
    expect(listed.events[0]).toMatchObject({
      event: 'generate_completed',
      actionKey: 'plan',
      source: 'proxy',
      requestId: 'request-1',
      correlationId: 'correlation-1',
      structuredCounts: {
        priorities: 2,
      },
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toMatchObject({
      source: 'local',
      event: expect.objectContaining({
        event: 'generate_completed',
      }),
    });

    window.removeEventListener(CHIEF_TELEMETRY_UPDATED_EVENT, listener);
  });

  it('ignores invalid telemetry events safely', async () => {
    const { listChiefTelemetryEvents, recordChiefTelemetryEvent } = await loadChiefTelemetryRepositoryWithSupabaseMock({
      isSupabaseConfigured: false,
      supabaseClient: null,
      requireSupabaseUserId: vi.fn(),
    });

    const invalidResult = await recordChiefTelemetryEvent({ event: '   ' });
    const listed = await listChiefTelemetryEvents({ limit: 10 });

    expect(invalidResult).toBeNull();
    expect(listed.events).toEqual([]);
  });

  it('falls back to local telemetry when Supabase auth is required', async () => {
    const authRequiredError = new Error('Auth required');
    authRequiredError.code = 'SUPABASE_AUTH_REQUIRED';

    const { listChiefTelemetryEvents } = await loadChiefTelemetryRepositoryWithSupabaseMock({
      isSupabaseConfigured: true,
      supabaseClient: {},
      requireSupabaseUserId: vi.fn(async () => {
        throw authRequiredError;
      }),
    });

    window.localStorage.setItem(
      'ceo-os-chief-telemetry-events',
      JSON.stringify([
        {
          id: 'evt-local-1',
          event: 'accept_item_saved',
          timestamp: '2026-04-20T10:00:00.000Z',
          section: 'opportunities',
        },
      ]),
    );

    const listed = await listChiefTelemetryEvents({ limit: 5 });

    expect(listed.source).toBe('local');
    expect(listed.events).toEqual([
      {
        id: 'evt-local-1',
        event: 'accept_item_saved',
        timestamp: '2026-04-20T10:00:00.000Z',
        section: 'opportunities',
      },
    ]);
  });
});
