/**
 * Compact, always-visible workspace sync status. Combines three signals:
 *   - useWorkspaceSettings().source — Supabase vs local repository fallback.
 *   - useOnlineStatus()             — navigator online/offline.
 *   - useOfflineWriteQueueSize()    — count of writes waiting to replay.
 *
 * Tones: Offline > Local only > Synced. When the offline-write queue is
 * non-empty, the pill appends "+N pending" so the user can see at a glance
 * that some writes have not reached the cloud yet.
 */

import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useOfflineWriteQueueSize } from '../../hooks/useOfflineWriteQueue';
import { describeSyncStatus } from '../../lib/syncStatusDescriptors';

function SyncStatusPill() {
  const { source } = useWorkspaceSettings();
  const isOnline = useOnlineStatus();
  const pendingWrites = useOfflineWriteQueueSize();
  const descriptor = describeSyncStatus(source, isOnline);
  const hasPending = pendingWrites > 0;

  const pendingLabel = hasPending
    ? `${pendingWrites} write${pendingWrites === 1 ? '' : 's'} waiting to sync`
    : null;
  const title = pendingLabel
    ? `${descriptor.description} ${pendingLabel}.`
    : descriptor.description;

  return (
    <span
      className={
        `sync-status-pill sync-status-pill--${descriptor.tone}${
          hasPending ? ' sync-status-pill--has-pending' : ''
        }`
      }
      role="status"
      aria-live="polite"
      title={title}
      data-online={isOnline ? 'true' : 'false'}
      data-pending={hasPending ? 'true' : 'false'}
    >
      <span className="sync-status-pill__dot" aria-hidden="true" />
      <span className="sync-status-pill__label">{descriptor.label}</span>
      {hasPending ? (
        <span className="sync-status-pill__pending" aria-label={pendingLabel}>
          {`+${pendingWrites}`}
        </span>
      ) : null}
    </span>
  );
}

export default SyncStatusPill;
