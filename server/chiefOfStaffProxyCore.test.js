import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { handleChiefOfStaffProxy } from './chiefOfStaffProxyCore.js';

describe('handleChiefOfStaffProxy', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalProxyToken = process.env.CHIEF_STAFF_PROXY_TOKEN;

  const makeResponse = (options = {}) => {
    const {
      ok = true,
      status = 200,
      body = {},
    } = options;

    return {
      ok,
      status,
      json: vi.fn().mockResolvedValue(body),
    };
  };

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.CHIEF_STAFF_PROXY_TOKEN;
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
    process.env.CHIEF_STAFF_PROXY_TOKEN = originalProxyToken;
    vi.restoreAllMocks();
  });

  it('rejects unsupported HTTP methods', async () => {
    const result = await handleChiefOfStaffProxy({ method: 'GET', body: '{}' });

    expect(result).toMatchObject({
      status: 405,
      body: { error: 'Method not allowed' },
    });
  });

  it('returns a config error without OPENAI_API_KEY', async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await handleChiefOfStaffProxy({
      method: 'POST',
      body: { notes: 'hello', actionKey: 'summarize' },
    });

    expect(result).toMatchObject({
      status: 500,
      body: { error: 'OPENAI_API_KEY is not configured on the server' },
    });
  });

  it('enforces optional proxy token when configured', async () => {
    process.env.CHIEF_STAFF_PROXY_TOKEN = 'expected-token';

    const unauthenticated = await handleChiefOfStaffProxy({
      method: 'POST',
      body: { notes: 'sample notes for review', actionKey: 'summarize' },
    });

    expect(unauthenticated).toMatchObject({
      status: 401,
      body: { error: 'Missing or invalid proxy authentication token' },
    });
  });

  it('returns validation error for missing notes', async () => {
    const result = await handleChiefOfStaffProxy({ method: 'POST', body: {} });

    expect(result).toMatchObject({
      status: 400,
      body: { error: 'Notes are required' },
    });
  });

  it('returns validation error for non-object bodies', async () => {
    const result = await handleChiefOfStaffProxy({ method: 'POST', body: 'invalid' });

    expect(result).toMatchObject({
      status: 400,
      body: { error: 'Request body must be a JSON object' },
    });
  });

  it('returns upstream failure details on non-200 responses', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      makeResponse({
        ok: false,
        status: 429,
        body: { error: { message: 'rate limited' } },
      }),
    );

    const result = await handleChiefOfStaffProxy({
      method: 'POST',
      body: { notes: 'sample notes for review', actionKey: 'summarize' },
    });

    expect(result.status).toBe(429);
    expect(result.body).toMatchObject({
      error: 'OpenAI request failed',
    });
  });

  it('returns success payload from upstream', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      makeResponse({
        ok: true,
        status: 200,
        body: { output_text: 'all good' },
      }),
    );

    const result = await handleChiefOfStaffProxy({
      method: 'POST',
      body: { notes: 'sample notes for review', actionKey: 'summarize' },
    });

    expect(result).toEqual({
      status: 200,
      body: { output_text: 'all good' },
    });
  });

  it('accepts proxy token when configured and headers are valid', async () => {
    process.env.CHIEF_STAFF_PROXY_TOKEN = 'expected-token';

    vi.spyOn(global, 'fetch').mockResolvedValue(
      makeResponse({
        ok: true,
        status: 200,
        body: { output_text: 'all good' },
      }),
    );

    const result = await handleChiefOfStaffProxy({
      method: 'POST',
      body: { notes: 'sample notes for review', actionKey: 'summarize' },
      headers: {
        authorization: 'Bearer expected-token',
      },
    });

    expect(result).toEqual({
      status: 200,
      body: { output_text: 'all good' },
    });
  });

  it('returns network error when upstream request fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network failure'));

    const result = await handleChiefOfStaffProxy({
      method: 'POST',
      body: { notes: 'sample notes for review', actionKey: 'summarize' },
    });

    expect(result).toMatchObject({
      status: 502,
      body: { error: 'Unable to reach OpenAI' },
    });
  });
});
