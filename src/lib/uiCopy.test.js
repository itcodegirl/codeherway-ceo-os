import { describe, expect, it } from 'vitest';
import {
  SOURCE_LABEL_SUPABASE,
  SOURCE_NOTICE_SAMPLE_DATA,
  SOURCE_NOTICE_SUPABASE,
  buildSourceNotice,
} from './uiCopy';

describe('src/lib/uiCopy', () => {
  it('returns canonical source labels', () => {
    expect(SOURCE_LABEL_SUPABASE).toBe('Live workspace sync is enabled.');
    expect(SOURCE_NOTICE_SUPABASE).toBe('Data source: Live workspace sync is enabled.');
    expect(SOURCE_NOTICE_SAMPLE_DATA)
      .toBe('Local sample data is active. Connect workspace data to replace sample records.');
  });

  it('builds source notice for supabase with default prefix', () => {
    expect(buildSourceNotice('supabase')).toBe('Data source: Live workspace sync is enabled.');
  });

  it('builds source notice with custom prefixes', () => {
    expect(buildSourceNotice('supabase', { supabasePrefix: 'Weekly data source: ' }))
      .toBe('Weekly data source: Live workspace sync is enabled.');
    expect(buildSourceNotice('local', { localPrefix: 'Weekly data source: ' }))
      .toBe('Weekly data source: Local sample data is active. Connect workspace data to replace sample records.');
  });
});
