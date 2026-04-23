import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleAppErrorTelemetryIngest } from './appErrorTelemetryIngestCore.js';

describe('server/appErrorTelemetryIngestCore', () => {
  const originalEnv = { ...process.env };

  function createValidPayload() {
    return {
      source: 'codeherway-ceo-os',
      eventType: 'app_error',
      sentAt: '2026-04-22T20:00:00.000Z',
      events: [
        {
          event: 'ui_error_boundary',
          timestamp: '2026-04-22T20:00:00.000Z',
          name: 'TypeError',
          message: 'Cannot read properties of undefined',
          route: '/dashboard',
          componentStack: 'in Dashboard',
          context: { boundary: 'AppLayout' },
        },
      ],
    };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.APP_ERROR_TELEMETRY_INGEST_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects non-POST methods with taxonomy error code', async () => {
    const result = await handleAppErrorTelemetryIngest({
      method: 'GET',
      body: null,
      headers: {},
    });

    expect(result.status).toBe(405);
    expect(result.body.error_code).toBe('METHOD_NOT_ALLOWED');
    expect(typeof result.body.request_id).toBe('string');
  });

  it('rejects invalid JSON strings', async () => {
    const result = await handleAppErrorTelemetryIngest({
      method: 'POST',
      body: '{not json}',
      headers: {},
    });

    expect(result.status).toBe(400);
    expect(result.body.error_code).toBe('INVALID_BODY');
  });

  it('rejects malformed event payloads with validation message', async () => {
    const payload = createValidPayload();
    payload.events[0].timestamp = 'bad timestamp';

    const result = await handleAppErrorTelemetryIngest({
      method: 'POST',
      body: payload,
      headers: {},
    });

    expect(result.status).toBe(400);
    expect(result.body.error_code).toBe('INVALID_PAYLOAD');
    expect(result.body.error).toContain('events[0].timestamp');
  });

  it('requires ingest token when configured', async () => {
    process.env.APP_ERROR_TELEMETRY_INGEST_TOKEN = 'secret';

    const invalidTokenResult = await handleAppErrorTelemetryIngest({
      method: 'POST',
      body: createValidPayload(),
      headers: {},
    });

    expect(invalidTokenResult.status).toBe(401);
    expect(invalidTokenResult.body.error_code).toBe('INGEST_AUTH_INVALID');

    const validTokenResult = await handleAppErrorTelemetryIngest({
      method: 'POST',
      body: createValidPayload(),
      headers: {
        'x-app-telemetry-token': 'secret',
      },
    });

    expect(validTokenResult.status).toBe(202);
    expect(validTokenResult.body.accepted_count).toBe(1);
  });

  it('accepts valid payload and returns ack contract', async () => {
    const result = await handleAppErrorTelemetryIngest({
      method: 'POST',
      body: createValidPayload(),
      headers: {},
    });

    expect(result.status).toBe(202);
    expect(result.body).toMatchObject({
      ok: true,
      accepted_count: 1,
    });
    expect(typeof result.body.request_id).toBe('string');
  });
});
