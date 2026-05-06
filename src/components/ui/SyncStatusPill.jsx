/**
 * Compact, always-visible workspace sync status.
 *
 *   - useWorkspaceSettings().source       — Supabase vs local repository fallback.
 *   - useWorkspaceSettings().loadError    — surfaces failed Supabase loads.
 *   - useOnlineStatus()                   — navigator online/offline.
 *   - useOfflineWriteQueueSize()          — count of writes that failed
 *                                           transiently and are queued to
 *                                           replay on the next reconnect.
 *
 * Tones: Offline > Sync error > Local only > Synced. When pending writes are
 * queued AND the workspace is connected to Supabase (source === 'supabase'),
 * the pill shows a "+N pending" suffix so the user knows their data hasn't
 * fully landed remotely. We only show the suffix when the queue can actually
 * drain — local-only or fully offline workspaces hide it because the queue
 * has nowhere to push to.
 *
 * When loadError is present the pill renders as a button, exposing the
 * refresh callback as an explicit retry CTA so the user can recover from a
 * transient Supabase failure without leaving the page.
 */

import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useOfflineWriteQueueSize } from '../../hooks/useOfflineWriteQueue';
import { describeSyncStatus } from '../../lib/syncStatusDescriptors';

function SyncStatusPill() {
  const { source, loadError, refreshWorkspaceSettings } = useWorkspaceSettings();
  const isOnline = useOnlineStatus();
  const pendingCount = useOfflineWriteQueueSize();
  const hasLoadError = Boolean(loadError);
  const descriptor = describeSyncStatus(source, isOnline, hasLoadError);
  // Only advertise the queue when there is somewhere for it to drain.
  const showPending = pendingCount > 0 && source === 'supabase';
  const pendingLabel = showPending ? ` · +${pendingCount} pending` : '';
  const pendingTitle = showPending
    ? ` ${pendingCount} write${pendingCount === 1 ? '' : 's'} are waiting to sync.`
    : '';
  const titleText = hasLoadError && loadError
    ? `${loadError} ${descriptor.description}${pendingTitle}`
    : `${descriptor.description}${pendingTitle}`;

  if (hasLoadError && isOnline) {
    return (
      <button
        type="button"
        className={`sync-status-pill sync-status-pill--${descriptor.tone} sync-status-pill--retry${
          showPending ? ' sync-status-pill--has-pending' : ''
        }`}
        title={titleText}
        aria-label={`${descriptor.label}. Retry loading workspace settings.`}
        data-online={isOnline ? 'true' : 'false'}
        data-pending={showPending ? String(pendingCount) : undefined}
        onClick={() => {
          void refreshWorkspaceSettings();
        }}
      >
        <span className="sync-status-pill__dot" aria-hidden="true" />
        <span className="sync-status-pill__label">
          {descriptor.label}
          {pendingLabel}
        </span>
      </button>
    );
  }

  return (
    <span
      className={`sync-status-pill sync-status-pill--${descriptor.tone}${
        showPending ? ' sync-status-pill--has-pending' : ''
      }`}
      role="status"
      aria-live="polite"
      title={titleText}
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
