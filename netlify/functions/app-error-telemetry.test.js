import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from './app-error-telemetry.js';
import * as core from '../../server/appErrorTelemetryIngestCore.js';

describe('netlify app-error-telemetry function', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards netlify event fields to the shared telemetry ingest core', async () => {
    const coreSpy = vi.spyOn(core, 'handleAppErrorTelemetryIngest').mockResolvedValue({
      status: 400,
      body: { error: 'events must be an array', error_code: 'INVALID_PAYLOAD' },
    });

    const result = await handler({
      httpMethod: 'POST',
      body: JSON.stringify({ source: 'x' }),
      headers: { 'x-app-telemetry-token': 'token' },
    });

    expect(coreSpy).toHaveBeenCalledWith({
      method: 'POST',
      body: JSON.stringify({ source: 'x' }),
      headers: { 'x-app-telemetry-token': 'token' },
    });
    expect(result).toEqual({
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'events must be an array', error_code: 'INVALID_PAYLOAD' }),
    });
  });
});
