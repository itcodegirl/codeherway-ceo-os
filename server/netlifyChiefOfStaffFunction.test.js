import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { handler } from '../netlify/functions/chief-of-staff.js';
import * as core from './chiefOfStaffProxyCore.js';

describe('netlify chief-of-staff function', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalToken = process.env.CHIEF_STAFF_PROXY_TOKEN;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.CHIEF_STAFF_PROXY_TOKEN;
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
    process.env.CHIEF_STAFF_PROXY_TOKEN = originalToken;
    vi.restoreAllMocks();
  });

  it('forwards method, body, and headers into the shared proxy handler', async () => {
    const coreSpy = vi.spyOn(core, 'handleChiefOfStaffProxy').mockResolvedValue({
      status: 200,
      body: { output_text: 'ok' },
    });

    const result = await handler({
      httpMethod: 'POST',
      body: JSON.stringify({ notes: 'Weekly notes', actionKey: 'draft' }),
      headers: { 'x-chief-staff-token': 'test-token' },
    });

    expect(coreSpy).toHaveBeenCalledWith({
      method: 'POST',
      body: JSON.stringify({ notes: 'Weekly notes', actionKey: 'draft' }),
      headers: { 'x-chief-staff-token': 'test-token' },
    });
    expect(result).toMatchObject({
      statusCode: 200,
      body: JSON.stringify({ output_text: 'ok' }),
    });
  });

  it('returns serialized JSON body even on failures', async () => {
    vi.spyOn(core, 'handleChiefOfStaffProxy').mockResolvedValue({
      status: 405,
      body: { error: 'Method not allowed' },
    });

    const result = await handler({
      httpMethod: 'GET',
      body: null,
      headers: {},
    });

    expect(result).toEqual({
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    });
  });
});
