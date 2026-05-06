/**
 * Compact, always-visible workspace sync status.
 *
 *   - useWorkspaceSettings().source       — Supabase vs local repository fallback.
 *   - useWorkspaceSettings().loadError    — surfaces failed Supabase loads.
 *   - useOnlineStatus()                   — navigator online/offline.
 *
 * Tones: Offline > Sync error > Local only > Synced. The offline write queue
 * exists in `lib/offlineWriteQueue` but is not yet wired into mutation paths,
 * so the pill deliberately does NOT advertise pending writes — claiming
 * "N writes waiting" while nothing drains them would mislead the user about
 * their data state. Re-introduce the pending pill only when the queue is wired
 * end-to-end (enqueue on failure + drain on reconnect).
 *
 * When loadError is present the pill renders as a button, exposing the
 * refresh callback as an explicit retry CTA so the user can recover from a
 * transient Supabase failure without leaving the page.
 */

import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { describeSyncStatus } from '../../lib/syncStatusDescriptors';

function SyncStatusPill() {
  const { source, loadError, refreshWorkspaceSettings } = useWorkspaceSettings();
  const isOnline = useOnlineStatus();
  const hasLoadError = Boolean(loadError);
  const descriptor = describeSyncStatus(source, isOnline, hasLoadError);
  const className = `sync-status-pill sync-status-pill--${descriptor.tone}`;
  const titleText = hasLoadError && loadError
    ? `${loadError} ${descriptor.description}`
    : descriptor.description;

  if (hasLoadError && isOnline) {
    return (
      <button
        type="button"
        className={`${className} sync-status-pill--retry`}
        title={titleText}
        aria-label={`${descriptor.label}. Retry loading workspace settings.`}
        data-online={isOnline ? 'true' : 'false'}
        onClick={() => {
          void refreshWorkspaceSettings();
        }}
      >
        <span className="sync-status-pill__dot" aria-hidden="true" />
        <span className="sync-status-pill__label">{descriptor.label}</span>
      </button>
    );
  }

  return (
    <span
      className={className}
      role="status"
      aria-live="polite"
      title={titleText}
      data-online={isOnline ? 'true' : 'false'}
    >
      <span className="sync-status-pill__dot" aria-hidden="true" />
      <span className="sync-status-pill__label">{descriptor.label}</span>
    </span>
  );
}

export default SyncStatusPill;
