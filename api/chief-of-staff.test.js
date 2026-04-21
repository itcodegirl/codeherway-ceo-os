import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import handler from './chief-of-staff.js';
import * as core from '../server/chiefOfStaffProxyCore.js';

describe('api chief-of-staff handler', () => {
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

  it('forwards method/body/headers and serializes the core response status and body', async () => {
    const coreSpy = vi.spyOn(core, 'handleChiefOfStaffProxy').mockResolvedValue({
      status: 200,
      body: { output_text: 'ok' },
    });
    let statusCode = null;
    let responseBody = null;

    await handler(
      {
        method: 'POST',
      body: { actionKey: 'summarize', notes: 'Weekly notes' },
        headers: { authorization: 'Bearer test-token' },
      },
      {
        status: (code) => {
          statusCode = code;
          return {
            json: (body) => {
              responseBody = body;
            },
          };
        },
      },
    );

    expect(coreSpy).toHaveBeenCalledWith({
      method: 'POST',
      body: { actionKey: 'summarize', notes: 'Weekly notes' },
      headers: { authorization: 'Bearer test-token' },
    });
    expect(statusCode).toBe(200);
    expect(responseBody).toEqual({ output_text: 'ok' });
  });

  it('returns non-200 responses from core unchanged', async () => {
    vi.spyOn(core, 'handleChiefOfStaffProxy').mockResolvedValue({
      status: 401,
      body: { error: 'Missing or invalid proxy authentication token' },
    });
    let statusCode;
    let responseBody;

    await handler(
      { method: 'POST', body: { notes: 'x' }, headers: {} },
      {
        status: (code) => ({
          json: (body) => {
            statusCode = code;
            responseBody = body;
          },
        }),
      },
    );

    expect(statusCode).toBe(401);
    expect(responseBody).toEqual({ error: 'Missing or invalid proxy authentication token' });
  });
});
