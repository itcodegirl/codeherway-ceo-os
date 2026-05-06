/**
 * Pure helper that maps a workspace source + online state into the descriptor
 * used by SyncStatusPill. Lives in lib so the component file only exports a
 * component (keeps Vite Fast Refresh happy).
 */

const SOURCE_DESCRIPTORS = {
  supabase: {
    label: 'Synced',
    tone: 'ok',
    description: 'Workspace is syncing to Supabase.',
  },
  local: {
    label: 'Local only',
    tone: 'local',
    description: 'Changes save to this browser. Connect a workspace to sync across devices.',
  },
};

const OFFLINE_DESCRIPTOR = {
  label: 'Offline',
  tone: 'offline',
  description: 'No network connection detected. Changes save locally and will be available when you reload.',
};

const ERROR_DESCRIPTOR = {
  label: 'Sync error',
  tone: 'error',
  description: 'Workspace settings failed to load. Showing the last available snapshot — click to retry.',
};

export function describeSyncStatus(source, isOnline, hasLoadError = false) {
  if (!isOnline) {
    return OFFLINE_DESCRIPTOR;
  }
  if (hasLoadError) {
    return ERROR_DESCRIPTOR;
  }
  return SOURCE_DESCRIPTORS[source] || SOURCE_DESCRIPTORS.local;
}
