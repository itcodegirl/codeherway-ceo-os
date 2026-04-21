import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateChiefOfStaffResponse } from './openai';

function createProxyResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
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
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.structuredPayload).toEqual({
      priorities: [],
      opportunities: [],
      contentItems: [],
      tasks: [],
    });
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
});
