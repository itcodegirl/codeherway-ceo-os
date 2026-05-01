export const SOURCE_LABEL_SUPABASE = 'Live workspace sync is enabled.';
export const SOURCE_NOTICE_SUPABASE = `Data source: ${SOURCE_LABEL_SUPABASE}`;
export const SOURCE_NOTICE_SAMPLE_DATA = 'Local sample data is active. Connect workspace data to replace sample records.';

export function buildSourceNotice(source, options = {}) {
  const {
    supabasePrefix = 'Data source: ',
    localPrefix = '',
  } = options;

  if (source === 'supabase') {
    return `${supabasePrefix}${SOURCE_LABEL_SUPABASE}`;
  }

  return `${localPrefix}${SOURCE_NOTICE_SAMPLE_DATA}`;
}
