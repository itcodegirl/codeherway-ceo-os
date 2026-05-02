/**
 * Compact, always-visible workspace sync status. Reads from `useWorkspaceSettings`
 * (which already coordinates Supabase vs. local fallback) so users always know
 * whether their writes are reaching the cloud.
 */

import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';

const TONE_LABELS = {
  supabase: { label: 'Synced', tone: 'ok', description: 'Workspace is syncing to Supabase.' },
  local: { label: 'Local only', tone: 'local', description: 'Working offline. Changes save to this browser.' },
};

function SyncStatusPill() {
  const { source } = useWorkspaceSettings();
  const descriptor = TONE_LABELS[source] || TONE_LABELS.local;

  return (
    <span
      className={`sync-status-pill sync-status-pill--${descriptor.tone}`}
      role="status"
      aria-live="polite"
      title={descriptor.description}
    >
      <span className="sync-status-pill__dot" aria-hidden="true" />
      <span className="sync-status-pill__label">{descriptor.label}</span>
    </span>
  );
}

export default SyncStatusPill;
