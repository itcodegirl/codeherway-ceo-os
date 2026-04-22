export const SOURCE_LABEL_SUPABASE = 'Supabase (live persistence).';
export const SOURCE_NOTICE_SUPABASE = `Data source: ${SOURCE_LABEL_SUPABASE}`;
export const SOURCE_NOTICE_SAMPLE_DATA = 'Sample data - configure Supabase to use real data.';

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
