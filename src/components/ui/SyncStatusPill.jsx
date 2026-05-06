/**
 * Compact, always-visible workspace sync status.
 *
 *   - useWorkspaceSettings().source     — Supabase vs local repository fallback.
 *   - useOnlineStatus()                 — navigator online/offline.
 *   - useOfflineWriteQueueSize()        — count of writes that failed
 *                                         transiently and are queued to
 *                                         replay on the next reconnect.
 *
 * Tones: Offline > Local only > Pending sync > Synced. When pending writes are
 * queued AND the workspace is connected to Supabase (source === 'supabase'),
 * the pill changes label so we never imply the workspace is fully synced while
 * writes are still waiting to replay.
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
  const showPending = pendingCount > 0 && source === 'supabase' && isOnline;
  const label = showPending ? 'Pending sync' : descriptor.label;
  const pendingLabel = showPending ? ` · ${pendingCount} waiting` : '';
  const pendingTitle = showPending
    ? ` ${pendingCount} supported write${pendingCount === 1 ? ' is' : 's are'} waiting to sync.`
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
        {label}
        {pendingLabel}
      </span>
    </span>
  );
}

export default SyncStatusPill;
