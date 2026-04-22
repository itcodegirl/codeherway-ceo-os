import { describe, expect, it } from 'vitest';
import { extractChiefResponseText } from './chiefResponseText.js';

describe('shared/chiefResponseText', () => {
  it('returns empty string for invalid payloads', () => {
    expect(extractChiefResponseText(null)).toBe('');
    expect(extractChiefResponseText(undefined)).toBe('');
    expect(extractChiefResponseText('invalid')).toBe('');
  });

  it('extracts string output_text directly', () => {
    expect(extractChiefResponseText({ output_text: '  Executive summary  ' })).toBe('Executive summary');
  });

  it('extracts nested output_text arrays', () => {
    expect(
      extractChiefResponseText({
        output_text: ['Step 1', ['Step 2', 'Step 3']],
      }),
    ).toBe('Step 1\n\nStep 2\n\nStep 3');
  });

  it('extracts output text from output content parts', () => {
    expect(
      extractChiefResponseText({
        output: [
          {
            content: [
              { type: 'output_text', text: 'Alpha' },
              { type: 'other', text: 'Ignored' },
            ],
          },
          {
            content: [
              { type: 'output_text', text: ['Beta', 'Gamma'] },
            ],
          },
        ],
      }),
    ).toBe('Alpha\n\nBeta\n\nGamma');
  });
});
