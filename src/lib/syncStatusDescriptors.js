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

export function describeSyncStatus(source, isOnline) {
  if (!isOnline) {
    return OFFLINE_DESCRIPTOR;
  }
  return SOURCE_DESCRIPTORS[source] || SOURCE_DESCRIPTORS.local;
}
