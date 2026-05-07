import { WORKSPACE_SETUP_MODES, getWorkspaceSetupMode } from './workspaceSetup';

export const SOURCE_LABEL_SUPABASE = 'Workspace sync is active.';
export const SOURCE_NOTICE_SUPABASE = `Data source: ${SOURCE_LABEL_SUPABASE}`;
export const SOURCE_NOTICE_LOCAL_ONLY = 'This workspace is stored on this device only.';
export const SOURCE_NOTICE_DEMO_DATA = 'Demo data is active on this device. It is not synced.';
export const SOURCE_NOTICE_BLANK_LOCAL = 'Blank local workspace is active on this device.';
export const SOURCE_NOTICE_SAMPLE_DATA = SOURCE_NOTICE_DEMO_DATA;
export const AUTOSAVE_PAUSED_COPY = 'Autosave is paused until this workspace saves successfully again.';

export function resolveLocalSourceNotice(mode = getWorkspaceSetupMode()) {
  if (mode === WORKSPACE_SETUP_MODES.blank) {
    return SOURCE_NOTICE_BLANK_LOCAL;
  }

  if (mode === WORKSPACE_SETUP_MODES.demo) {
    return SOURCE_NOTICE_DEMO_DATA;
  }

  return SOURCE_NOTICE_LOCAL_ONLY;
}

export function buildSourceNotice(source, options = {}) {
  const {
    supabasePrefix = 'Data source: ',
    localPrefix = '',
    localMode,
    localText = '',
  } = options;

  if (source === 'supabase') {
    return `${supabasePrefix}${SOURCE_LABEL_SUPABASE}`;
  }

  return `${localPrefix}${localText || resolveLocalSourceNotice(localMode)}`;
}

export function buildAutosaveHelperText({
  hasError = false,
  healthyText = 'Changes are saved automatically for this workspace.',
  pausedText = AUTOSAVE_PAUSED_COPY,
} = {}) {
  return hasError ? pausedText : healthyText;
}
