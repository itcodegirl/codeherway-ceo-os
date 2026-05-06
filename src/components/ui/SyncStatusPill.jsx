/**
 * Compact, always-visible workspace sync status.
 *
 *   - useWorkspaceSettings().source     — Supabase vs local repository fallback.
 *   - useOnlineStatus()                 — navigator online/offline.
 *   - useOfflineWriteQueueSize()        — count of writes that failed
 *                                         transiently and are queued to
 *                                         replay on the next reconnect.
 *
 * Tones: Offline > Local only > Synced. When pending writes are queued AND
 * the workspace is connected to Supabase (source === 'supabase'), the pill
 * shows a "+N pending" suffix so the user knows their data hasn't fully
 * landed remotely. We only show the suffix when the queue can actually
 * drain — local-only or fully offline workspaces hide it because the queue
 * has nowhere to push to.
 */

import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useOfflineWriteQueueSize } from '../../hooks/useOfflineWriteQueue';
import { describeSyncStatus } from '../../lib/syncStatusDescriptors';

function SyncStatusPill() {
  const { source } = useWorkspaceSettings();
  const isOnline = useOnlineStatus();
  const pendingCount = useOfflineWriteQueueSize();
  const descriptor = describeSyncStatus(source, isOnline);
  // Only advertise the queue when there is somewhere for it to drain.
  const showPending = pendingCount > 0 && source === 'supabase';
  const pendingLabel = showPending ? ` · +${pendingCount} pending` : '';
  const pendingTitle = showPending
    ? ` ${pendingCount} write${pendingCount === 1 ? '' : 's'} are waiting to sync.`
    : '';

  return (
    <span
      className={`sync-status-pill sync-status-pill--${descriptor.tone}${
        showPending ? ' sync-status-pill--has-pending' : ''
      }`}
      role="status"
      aria-live="polite"
      title={`${descriptor.description}${pendingTitle}`}
      data-online={isOnline ? 'true' : 'false'}
      data-pending={showPending ? String(pendingCount) : undefined}
    >
      <span className="sync-status-pill__dot" aria-hidden="true" />
      <span className="sync-status-pill__label">
        {descriptor.label}
        {pendingLabel}
      </span>
    </span>
  );
}

export default SyncStatusPill;
