import { useEffect, useState } from 'react';
import { STORAGE_CORRUPTION_EVENT } from '../../lib/storageCorruption';

/**
 * Listens for corrupted-localStorage events and shows a non-blocking banner so
 * the user knows their data was preserved (under a `__corrupt_*` backup key)
 * rather than silently lost. Dismissible per session; reappears on new events.
 */
function StorageCorruptionBanner() {
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    const handleEvent = (event) => {
      const detail = event?.detail;
      if (!detail) return;
      setLatest(detail);
    };
    window.addEventListener(STORAGE_CORRUPTION_EVENT, handleEvent);
    return () => window.removeEventListener(STORAGE_CORRUPTION_EVENT, handleEvent);
  }, []);

  if (!latest) {
    return null;
  }

  return (
    <div
      className="storage-corruption-banner"
      role="status"
      aria-live="polite"
      data-testid="storage-corruption-banner"
    >
      <div className="storage-corruption-banner__body">
        <strong className="storage-corruption-banner__title">Local data was unreadable</strong>
        <p className="storage-corruption-banner__text">
          We couldn’t read part of your saved workspace ({latest.key}). A backup
          {latest.backupKey ? ` was preserved at "${latest.backupKey}"` : ' could not be saved'}
          and your view was reset to defaults. You can keep working — new changes will save normally.
        </p>
      </div>
      <button
        type="button"
        className="storage-corruption-banner__dismiss"
        onClick={() => setLatest(null)}
        aria-label="Dismiss data recovery notice"
      >
        Dismiss
      </button>
    </div>
  );
}

export default StorageCorruptionBanner;
