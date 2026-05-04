import { useEffect, useState } from 'react';
import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';

const DISMISS_KEY = 'ceo-os-local-only-notice-dismissed-v1';

function isDismissed() {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function markDismissed() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // ignore — notice will simply re-render next session
  }
}

/**
 * Surfaces the "this workspace is local-only" reality so users do not
 * mistake the app's silent localStorage fallback for cloud sync. Shown
 * once per browser when the resolved settings source is `local`; dismissible.
 *
 * Pairs with the SyncStatusPill: the pill is the always-on dot, this
 * banner is the one-time explanation of what "Local only" implies for
 * multi-device usage.
 */
function LocalOnlyNotice() {
  const { source } = useWorkspaceSettings();
  const [dismissed, setDismissed] = useState(() => isDismissed());

  useEffect(() => {
    if (source !== 'local') {
      return undefined;
    }
    setDismissed(isDismissed());
    return undefined;
  }, [source]);

  if (source !== 'local' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    markDismissed();
    setDismissed(true);
  };

  return (
    <div
      className="local-only-notice"
      role="status"
      aria-live="polite"
      data-testid="local-only-notice"
    >
      <div className="local-only-notice__body">
        <strong className="local-only-notice__title">This workspace is local-only</strong>
        <p className="local-only-notice__text">
          Your data is stored in this browser. It will not sync to your other devices.
          Configure a Supabase workspace in Settings to enable cloud sync.
        </p>
      </div>
      <button
        type="button"
        className="local-only-notice__dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss local-only notice"
      >
        Got it
      </button>
    </div>
  );
}

export default LocalOnlyNotice;
