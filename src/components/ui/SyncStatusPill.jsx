/**
 * Compact, always-visible workspace sync status.
 *
 *   - useWorkspaceSettings().source — Supabase vs local repository fallback.
 *   - useOnlineStatus()             — navigator online/offline.
 *
 * Tones: Offline > Local only > Synced. The offline write queue exists in
 * `lib/offlineWriteQueue` but is not yet wired into mutation paths, so the
 * pill deliberately does NOT advertise pending writes — claiming "N writes
 * waiting" while nothing drains them would mislead the user about their
 * data state. Re-introduce the pending pill only when the queue is wired
 * end-to-end (enqueue on failure + drain on reconnect).
 */

import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { describeSyncStatus } from '../../lib/syncStatusDescriptors';

function SyncStatusPill() {
  const { source } = useWorkspaceSettings();
  const isOnline = useOnlineStatus();
  const descriptor = describeSyncStatus(source, isOnline);

  return (
    <span
      className={`sync-status-pill sync-status-pill--${descriptor.tone}`}
      role="status"
      aria-live="polite"
      title={descriptor.description}
      data-online={isOnline ? 'true' : 'false'}
    >
      <span className="sync-status-pill__dot" aria-hidden="true" />
      <span className="sync-status-pill__label">{descriptor.label}</span>
    </span>
  );
}

export default SyncStatusPill;
