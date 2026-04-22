import { describe, expect, it } from 'vitest';
import {
  SOURCE_LABEL_SUPABASE,
  SOURCE_NOTICE_SAMPLE_DATA,
  SOURCE_NOTICE_SUPABASE,
  buildSourceNotice,
} from './uiCopy';

describe('src/lib/uiCopy', () => {
  it('returns canonical source labels', () => {
    expect(SOURCE_LABEL_SUPABASE).toBe('Supabase (live persistence).');
    expect(SOURCE_NOTICE_SUPABASE).toBe('Data source: Supabase (live persistence).');
    expect(SOURCE_NOTICE_SAMPLE_DATA).toBe('Sample data - configure Supabase to use real data.');
  });

  it('builds source notice for supabase with default prefix', () => {
    expect(buildSourceNotice('supabase')).toBe('Data source: Supabase (live persistence).');
  });

  it('builds source notice with custom prefixes', () => {
    expect(buildSourceNotice('supabase', { supabasePrefix: 'Weekly data source: ' }))
      .toBe('Weekly data source: Supabase (live persistence).');
    expect(buildSourceNotice('local', { localPrefix: 'Weekly data source: ' }))
      .toBe('Weekly data source: Sample data - configure Supabase to use real data.');
  });
});
