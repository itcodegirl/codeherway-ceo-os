import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateChiefOfStaffResponse } from './openai';

function createProxyResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  };
}

function createProxyErrorResponse(status, payload) {
  return {
    ok: false,
    status,
    text: async () => JSON.stringify(payload),
  };
}

describe('src/lib/openai', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it('normalizes and de-duplicates direct structured payload fields', async () => {
    globalThis.fetch.mockResolvedValue(
      createProxyResponse({
        output_text: 'Executive summary output.',
        structured_payload: {
          priorities: [
            { title: '  Ship weekly brief  ', owner: 'Jenna' },
            { text: 'Ship weekly brief', owner: 'Jenna' },
            '',
          ],
          opportunities: [
            { name: 'Partnership intro', company: ' Acme ' },
            { title: 'Partnership intro', company: 'Acme' },
          ],
          contentItems: [
            { title: 'Founder update', platform: 'LinkedIn' },
            { summary: 'Founder update', channel: 'LinkedIn' },
          ],
          tasks: [
            { task: 'Follow up with product' },
            { title: 'Follow up with product', owner: 'Jenna' },
          ],
        },
      }),
    );

    const result = await generateChiefOfStaffResponse({
      actionKey: 'summarize',
      notes: 'Highlight this week progress',
    });

    expect(result.source).toBe('proxy');
    expect(result.structuredPayload.priorities).toEqual([
      { title: 'Ship weekly brief', owner: 'Jenna' },
    ]);
    expect(result.structuredPayload.opportunities).toEqual([
      { name: 'Partnership intro', company: 'Acme' },
    ]);
    expect(result.structuredPayload.contentItems).toEqual([
      { title: 'Founder update', platform: 'LinkedIn' },
    ]);
    expect(result.structuredPayload.tasks).toEqual([
      { title: 'Follow up with product' },
      { title: 'Follow up with product', owner: 'Jenna' },
    ]);
  });

  it('parses structured payload sections from fenced JSON text when direct payload is missing', async () => {
    globalThis.fetch.mockResolvedValue(
      createProxyResponse({
        output_text: [
          '```json',
          '{"priorities":[{"title":"Ship onboarding updates"}],"tasks":["Send launch recap"]}',
          '```',
        ].join('\n'),
      }),
    );

    const result = await generateChiefOfStaffResponse({
      actionKey: 'actions',
      notes: 'Need concrete next actions',
    });

    expect(result.source).toBe('proxy');
    expect(result.structuredPayload.priorities).toEqual([
      { title: 'Ship onboarding updates' },
    ]);
    expect(result.structuredPayload.tasks).toEqual([
      { title: 'Send launch recap' },
    ]);
  });

  it('returns fallback content with an empty structured payload when proxy output text is missing', async () => {
    globalThis.fetch.mockResolvedValue(
      createProxyResponse({
        structured_payload: {
          priorities: [{ title: '' }],
          opportunities: [null],
        },
      }),
    );

    const result = await generateChiefOfStaffResponse({
      actionKey: 'priorities',
      notes: 'Decide focus areas',
    });

    expect(result.source).toBe('fallback');
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.structuredPayload).toEqual({
      priorities: [],
      opportunities: [],
      contentItems: [],
      tasks: [],
    });
  });

  it('falls back when the proxy request times out or aborts', async () => {
    globalThis.fetch.mockRejectedValue({ name: 'AbortError' });

    const result = await generateChiefOfStaffResponse({
      actionKey: 'summarize',
      notes: 'Summarize this quickly',
    });

    expect(result.source).toBe('fallback');
    expect(result.errorCode).toBe('CHIEF_PROXY_TIMEOUT');
    expect(result.errorMessage).toBe('The AI request timed out before a response came back.');
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.structuredPayload).toEqual({
      priorities: [],
      opportunities: [],
      contentItems: [],
      tasks: [],
    });
  });

  it('preserves proxy failure details when returning local fallback content', async () => {
    globalThis.fetch.mockResolvedValue(
      createProxyErrorResponse(500, {
        error: 'OPENAI_API_KEY is not configured on the server',
        error_code: 'OPENAI_API_KEY_MISSING',
        request_id: 'req-missing-key',
        correlation_id: 'corr-missing-key',
      }),
    );

    const result = await generateChiefOfStaffResponse({
      actionKey: 'plan',
      notes: 'Need a reliable plan even when AI is unavailable',
      correlationId: 'corr-client',
    });

    expect(result.source).toBe('fallback');
    expect(result.errorCode).toBe('OPENAI_API_KEY_MISSING');
    expect(result.errorMessage).toBe('OPENAI_API_KEY is not configured on the server');
    expect(result.requestId).toBe('req-missing-key');
    expect(result.correlationId).toBe('corr-missing-key');
    expect(result.fallbackReason).toBe('AI generation is unavailable; this is a local template fallback.');
  });

  it('extracts output from structured tool content when output_text is not present', async () => {
    globalThis.fetch.mockResolvedValue(
      createProxyResponse({
        output: [
          {
            content: [
              { type: 'output_text', text: ['Step 1: summarize', 'Step 2: recommend'] },
              { type: 'other_text', text: 'ignored by parser' },
            ],
          },
        ],
      }),
    );

    const result = await generateChiefOfStaffResponse({
      actionKey: 'actions',
      notes: 'Need practical weekly priorities',
    });

    expect(result.source).toBe('proxy');
    expect(result.content).toBe('Step 1: summarize\n\nStep 2: recommend');
    expect(result.structuredPayload).toEqual({
      priorities: [],
      opportunities: [],
      contentItems: [],
      tasks: [],
    });
  });

  it('normalizes partially valid structured payloads and preserves safe fallback content', async () => {
    globalThis.fetch.mockResolvedValue(
      createProxyResponse({
        structured_payload: {
          priorities: [{ title: '  Ship onboarding updates  ' }, '', null, { title: 'Ship onboarding updates' }],
          opportunities: [{ name: '  Partner One  ', company: '  Acme ' }, { title: '' }, null],
          contentItems: [{}, { title: 'Founder Update', platform: ' LinkedIn ' }, { name: 'Legacy' }],
          tasks: ['   Send update to design', 4, { task: '' }, { title: '  Close loop' }],
        },
      }),
    );

    const result = await generateChiefOfStaffResponse({
      actionKey: 'actions',
      notes: 'Clarify cross-team priorities for next week.',
    });

    expect(result.source).toBe('fallback');
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.structuredPayload.priorities).toEqual([
      { title: 'Ship onboarding updates' },
    ]);
    expect(result.structuredPayload.opportunities).toEqual([
      { name: 'Partner One', company: 'Acme' },
    ]);
    expect(result.structuredPayload.contentItems).toEqual([
      { title: 'Founder Update', platform: 'LinkedIn' },
      { title: 'Legacy' },
    ]);
    expect(result.structuredPayload.tasks).toEqual([
      { title: 'Send update to design' },
      { title: '4' },
      { title: 'Close loop' },
    ]);
  });

  it('forwards correlation ids and returns request metadata from proxy responses', async () => {
    globalThis.fetch.mockResolvedValue(
      createProxyResponse({
        request_id: 'server-request-123',
        correlation_id: 'corr-server-123',
        output_text: 'Decision engine response',
      }),
    );

    const result = await generateChiefOfStaffResponse({
      actionKey: 'summarize',
      notes: 'Summarize this week',
      correlationId: 'corr-client-abc',
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/chief-of-staff',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-chief-correlation-id': 'corr-client-abc',
        }),
      }),
    );
    expect(result.requestId).toBe('server-request-123');
    expect(result.correlationId).toBe('corr-server-123');
  });
});
