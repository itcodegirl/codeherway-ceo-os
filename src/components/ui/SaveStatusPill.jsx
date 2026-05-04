import { useEffect, useMemo, useState } from 'react';
import { SAVE_STATUS_PHASES, subscribeSaveStatus } from '../../lib/saveStatusBus';

const SAVED_VISIBLE_MS = 4000;

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Small reassurance pill that confirms the last persisted write. Sits in the
 * topbar next to SyncStatusPill. Three states:
 *
 *   - hidden       : initial, before any save
 *   - "Saved · HH:MM" : 4s after a successful save, then collapses
 *   - "Save failed" : sticky alert until the next successful save
 *
 * The trust win is visibility on FAILURE. Without this pill, localStorage
 * quota errors are swallowed in dev console only and the user thinks their
 * data is safe.
 */
function SaveStatusPill() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let collapseTimer = null;
    const unsubscribe = subscribeSaveStatus((detail) => {
      if (detail.phase === SAVE_STATUS_PHASES.FAILED) {
        if (collapseTimer) {
          window.clearTimeout(collapseTimer);
          collapseTimer = null;
        }
        setStatus({ phase: 'failed', at: detail.at, message: detail.message });
        return;
      }

      if (detail.phase === SAVE_STATUS_PHASES.SAVED) {
        setStatus({ phase: 'saved', at: detail.at });
        if (collapseTimer) {
          window.clearTimeout(collapseTimer);
        }
        collapseTimer = window.setTimeout(() => {
          setStatus((current) => (
            current && current.phase === 'saved' ? { ...current, collapsed: true } : current
          ));
          collapseTimer = null;
        }, SAVED_VISIBLE_MS);
      }
    });

    return () => {
      unsubscribe();
      if (collapseTimer) {
        window.clearTimeout(collapseTimer);
      }
    };
  }, []);

  const display = useMemo(() => {
    if (!status) return null;
    if (status.phase === 'failed') {
      return {
        tone: 'failed',
        label: 'Save failed',
        title: status.message
          ? `Last save failed at ${formatTime(status.at)}: ${status.message}`
          : `Last save failed at ${formatTime(status.at)}.`,
      };
    }
    if (status.phase === 'saved') {
      return {
        tone: 'saved',
        label: status.collapsed ? `Saved · ${formatTime(status.at)}` : 'Saved',
        title: `Last save at ${formatTime(status.at)}.`,
      };
    }
    return null;
  }, [status]);

  if (!display) {
    return null;
  }

  return (
    <span
      className={`save-status-pill save-status-pill--${display.tone}`}
      role="status"
      aria-live="polite"
      title={display.title}
      data-testid="save-status-pill"
    >
      <span className="save-status-pill__dot" aria-hidden="true" />
      <span className="save-status-pill__label">{display.label}</span>
    </span>
  );
}

export default SaveStatusPill;
