import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { handleChiefOfStaffProxy } from './chiefOfStaffProxyCore.js';

function createFetchResponse({ ok = true, status = 200, payload = {} } = {}) {
  return {
    ok,
    status,
    json: async () => payload,
  };
}

describe('server/chiefOfStaffProxyCore', () => {
  const previousEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...previousEnv };
    delete process.env.CHIEF_STAFF_PROXY_TOKEN;
    delete process.env.CHIEF_STAFF_RATE_LIMIT_PER_MINUTE;
    process.env.OPENAI_API_KEY = 'test-key';
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = { ...previousEnv };
  });

  it('returns taxonomy error code and request id for invalid methods', async () => {
    const result = await handleChiefOfStaffProxy({
      method: 'GET',
      body: null,
      headers: {},
    });

    expect(result.status).toBe(405);
    expect(result.body.error_code).toBe('METHOD_NOT_ALLOWED');
    expect(typeof result.body.request_id).toBe('string');
    expect(result.body.request_id.length).toBeGreaterThan(0);
    expect(typeof result.body.correlation_id).toBe('string');
    expect(result.body.correlation_id.length).toBeGreaterThan(0);
  });

  it('classifies upstream timeout failures with explicit error code', async () => {
    globalThis.fetch.mockRejectedValue({ name: 'AbortError' });

    const result = await handleChiefOfStaffProxy({
      method: 'POST',
      body: { notes: 'Generate summary', actionKey: 'summarize' },
      headers: {},
    });

    expect(result.status).toBe(504);
    expect(result.body.error_code).toBe('OPENAI_TIMEOUT');
    expect(typeof result.body.request_id).toBe('string');
    expect(typeof result.body.correlation_id).toBe('string');
  });

  it('classifies upstream non-OK responses and preserves error details', async () => {
    globalThis.fetch.mockResolvedValue(
      createFetchResponse({
        ok: false,
        status: 429,
        payload: { error: { message: 'Rate limit from upstream' } },
      }),
    );

    const result = await handleChiefOfStaffProxy({
      method: 'POST',
      body: { notes: 'Generate summary', actionKey: 'summarize' },
      headers: {},
    });

    expect(result.status).toBe(429);
    expect(result.body.error_code).toBe('OPENAI_FAILED');
    expect(result.body.details).toEqual({ message: 'Rate limit from upstream' });
    expect(typeof result.body.request_id).toBe('string');
    expect(typeof result.body.correlation_id).toBe('string');
  });

  it('adds request id and correlation id to successful proxy responses', async () => {
    globalThis.fetch.mockResolvedValue(
      createFetchResponse({
        ok: true,
        status: 200,
        payload: { output_text: 'Executive summary output' },
      }),
    );

    const result = await handleChiefOfStaffProxy({
      method: 'POST',
      body: { notes: 'Generate summary', actionKey: 'summarize' },
      headers: {},
    });

    expect(result.status).toBe(200);
    expect(result.body.output_text).toBe('Executive summary output');
    expect(typeof result.body.request_id).toBe('string');
    expect(typeof result.body.correlation_id).toBe('string');
  });

  it('reuses incoming correlation id and forwards it upstream', async () => {
    globalThis.fetch.mockResolvedValue(
      createFetchResponse({
        ok: true,
        status: 200,
        payload: { output_text: 'Executive summary output' },
      }),
    );

    const result = await handleChiefOfStaffProxy({
      method: 'POST',
      body: { notes: 'Generate summary', actionKey: 'summarize' },
      headers: {
        'x-chief-correlation-id': 'corr-inbound-777',
      },
    });

    expect(result.status).toBe(200);
    expect(result.body.correlation_id).toBe('corr-inbound-777');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-chief-correlation-id': 'corr-inbound-777',
        }),
      }),
    );
  });
});
