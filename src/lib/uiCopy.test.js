import { describe, expect, it } from 'vitest';
import {
  SOURCE_LABEL_SUPABASE,
  SOURCE_NOTICE_SAMPLE_DATA,
  SOURCE_NOTICE_SUPABASE,
  AUTOSAVE_PAUSED_COPY,
  buildAutosaveHelperText,
  buildSourceNotice,
} from './uiCopy';

describe('src/lib/uiCopy', () => {
  it('returns canonical source labels', () => {
    expect(SOURCE_LABEL_SUPABASE).toBe('Live workspace sync is enabled.');
    expect(SOURCE_NOTICE_SUPABASE).toBe('Data source: Live workspace sync is enabled.');
    expect(SOURCE_NOTICE_SAMPLE_DATA)
      .toBe('Local sample data is active on this device. It is not synced to an account.');
    expect(AUTOSAVE_PAUSED_COPY).toBe('Autosave is paused until this workspace saves successfully again.');
  });

  it('builds source notice for supabase with default prefix', () => {
    expect(buildSourceNotice('supabase')).toBe('Data source: Live workspace sync is enabled.');
  });

  it('builds source notice with custom prefixes', () => {
    expect(buildSourceNotice('supabase', { supabasePrefix: 'Weekly data source: ' }))
      .toBe('Weekly data source: Live workspace sync is enabled.');
    expect(buildSourceNotice('local', { localPrefix: 'Weekly data source: ' }))
      .toBe('Weekly data source: Local sample data is active on this device. It is not synced to an account.');
  });

  it('builds autosave helper text from save health', () => {
    expect(buildAutosaveHelperText({
      healthyText: 'Notes are saved automatically for this workspace.',
    })).toBe('Notes are saved automatically for this workspace.');

    expect(buildAutosaveHelperText({
      hasError: true,
      healthyText: 'Notes are saved automatically for this workspace.',
    })).toBe(AUTOSAVE_PAUSED_COPY);

    expect(buildAutosaveHelperText({
      hasError: true,
      pausedText: 'Autosave needs attention.',
    })).toBe('Autosave needs attention.');
  });
});
