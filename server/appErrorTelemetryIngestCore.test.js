import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleAppErrorTelemetryIngest } from './appErrorTelemetryIngestCore.js';
import * as telemetryRepository from './appErrorTelemetryIngestRepository.js';

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
    delete process.env.APP_ERROR_TELEMETRY_HMAC_SECRET;
    vi.spyOn(telemetryRepository, 'persistAppErrorTelemetryBatch').mockResolvedValue({
      persisted: false,
      duplicate: false,
      storage: 'transient',
    });
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

  it('requires valid signature when HMAC verification is enabled', async () => {
    process.env.APP_ERROR_TELEMETRY_HMAC_SECRET = 'hmac-secret';
    const payload = createValidPayload();
    const rawBody = JSON.stringify(payload);

    const invalidSignatureResult = await handleAppErrorTelemetryIngest({
      method: 'POST',
      body: payload,
      rawBody,
      headers: {},
    });

    expect(invalidSignatureResult.status).toBe(401);
    expect(invalidSignatureResult.body.error_code).toBe('INGEST_SIGNATURE_INVALID');

    const signature = crypto
      .createHmac('sha256', process.env.APP_ERROR_TELEMETRY_HMAC_SECRET)
      .update(rawBody)
      .digest('hex');

    const validSignatureResult = await handleAppErrorTelemetryIngest({
      method: 'POST',
      body: payload,
      rawBody,
      headers: {
        'x-app-telemetry-signature': `sha256=${signature}`,
      },
    });

    expect(validSignatureResult.status).toBe(202);
    expect(validSignatureResult.body.signature_verified).toBe(true);
    expect(validSignatureResult.body.signature_required).toBe(true);
  });

  it('persists valid payloads and forwards explicit idempotency keys', async () => {
    const persistSpy = vi.spyOn(telemetryRepository, 'persistAppErrorTelemetryBatch').mockResolvedValue({
      persisted: true,
      duplicate: false,
      storage: 'supabase',
    });

    const payload = {
      ...createValidPayload(),
      idempotencyKey: 'custom-idempotency-key',
    };
    const result = await handleAppErrorTelemetryIngest({
      method: 'POST',
      body: payload,
      headers: {},
      rawBody: JSON.stringify(payload),
    });

    expect(result.status).toBe(202);
    expect(result.body).toMatchObject({
      ok: true,
      accepted_count: 1,
      persisted: true,
      duplicate: false,
      storage: 'supabase',
      idempotency_key: 'custom-idempotency-key',
    });
    expect(persistSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'custom-idempotency-key',
        source: 'codeherway-ceo-os',
        eventType: 'app_error',
      }),
    );
    expect(typeof result.body.request_id).toBe('string');
  });

  it('returns a retryable error when persistence fails', async () => {
    vi.spyOn(telemetryRepository, 'persistAppErrorTelemetryBatch').mockRejectedValue(
      new Error('supabase unavailable'),
    );

    const result = await handleAppErrorTelemetryIngest({
      method: 'POST',
      body: createValidPayload(),
      headers: {},
    });

    expect(result.status).toBe(503);
    expect(result.body.error_code).toBe('PERSISTENCE_UNAVAILABLE');
    expect(result.body.retryable).toBe(true);
  });
});
