import { describe, expect, it } from 'vitest';
import {
  MAX_STRUCTURED_ITEMS_PER_SECTION,
  createEmptyStructuredPayload,
  normalizeStructuredPayload,
  parseJsonCandidate,
  parseStructuredPayloadFromText,
} from './chiefStructuredPayload.js';

describe('shared/chiefStructuredPayload', () => {
  it('returns empty structured payload for invalid input', () => {
    expect(normalizeStructuredPayload(null)).toEqual(createEmptyStructuredPayload());
    expect(normalizeStructuredPayload('invalid')).toEqual(createEmptyStructuredPayload());
    expect(normalizeStructuredPayload([])).toEqual(createEmptyStructuredPayload());
  });

  it('normalizes and de-duplicates mixed structured items', () => {
    const normalized = normalizeStructuredPayload({
      priorities: [
        { title: '  Ship weekly brief  ', owner: ' Jenna ' },
        { text: 'Ship weekly brief', owner: 'Jenna' },
        '',
      ],
      opportunities: [
        { name: 'Partnership intro', company: ' Acme ' },
        { title: 'Partnership intro', company: 'Acme' },
      ],
      contentItems: [
        { title: 'Founder update', platform: ' LinkedIn ' },
        { summary: 'Founder update', channel: 'LinkedIn' },
      ],
      tasks: [
        { task: 'Follow up with design' },
        { title: 'Follow up with design', owner: 'Jenna' },
      ],
    });

    expect(normalized.priorities).toEqual([
      { title: 'Ship weekly brief', owner: 'Jenna' },
    ]);
    expect(normalized.opportunities).toEqual([
      { name: 'Partnership intro', company: 'Acme' },
    ]);
    expect(normalized.contentItems).toEqual([
      { title: 'Founder update', platform: 'LinkedIn' },
    ]);
    expect(normalized.tasks).toEqual([
      { title: 'Follow up with design' },
      { title: 'Follow up with design', owner: 'Jenna' },
    ]);
  });

  it('caps section length at MAX_STRUCTURED_ITEMS_PER_SECTION', () => {
    const tasks = Array.from({ length: MAX_STRUCTURED_ITEMS_PER_SECTION + 6 }, (_, index) => ({
      title: `Task ${index + 1}`,
    }));

    const normalized = normalizeStructuredPayload({ tasks });

    expect(normalized.tasks).toHaveLength(MAX_STRUCTURED_ITEMS_PER_SECTION);
    expect(normalized.tasks[0]).toEqual({ title: 'Task 1' });
    expect(normalized.tasks.at(-1)).toEqual({ title: `Task ${MAX_STRUCTURED_ITEMS_PER_SECTION}` });
  });

  it('parses fenced JSON payloads from text responses', () => {
    const parsed = parseStructuredPayloadFromText([
      '```json',
      '{"priorities":[{"title":"Ship onboarding updates"}],"tasks":["Send launch recap"]}',
      '```',
    ].join('\n'));

    expect(parsed).toEqual({
      priorities: [{ title: 'Ship onboarding updates' }],
      tasks: ['Send launch recap'],
    });
  });

  it('parses markdown heading and bullet formats into sections', () => {
    const parsed = parseStructuredPayloadFromText([
      '## Priorities',
      '- Finalize pricing page',
      '### Opportunities',
      '1. Partnership follow-up',
      '## Content Items:',
      '- Founder update draft',
      '## Tasks',
      '- Review launch checklist',
    ].join('\n'));

    expect(parsed).toEqual({
      priorities: [{ title: 'Finalize pricing page' }],
      opportunities: [{ title: 'Partnership follow-up' }],
      contentItems: [{ title: 'Founder update draft' }],
      tasks: [{ title: 'Review launch checklist' }],
    });
  });

  it('parses JSON candidates safely', () => {
    expect(parseJsonCandidate('')).toBeNull();
    expect(parseJsonCandidate('not-json')).toBeNull();
    expect(parseJsonCandidate('["a"]')).toEqual(['a']);
    expect(parseJsonCandidate('{"a":1}')).toEqual({ a: 1 });
  });
});
