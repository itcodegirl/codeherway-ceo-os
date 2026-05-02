import { FOCUS_MODES } from '../../lib/focusHomeLogic';

const FOCUS_MODE_NAV_KEYS = new Set([
  'ArrowRight',
  'ArrowDown',
  'ArrowLeft',
  'ArrowUp',
  'Home',
  'End',
]);

function nextIndexFor(currentIndex, key) {
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    return (currentIndex + 1) % FOCUS_MODES.length;
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    return (currentIndex - 1 + FOCUS_MODES.length) % FOCUS_MODES.length;
  }
  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return FOCUS_MODES.length - 1;
  }
  return currentIndex;
}

function FocusModeChips({ focusMode, onFocusModeChange, supportCopy }) {
  const handleFocusModeKeyDown = (event, currentIndex) => {
    const key = event.key;
    if (!FOCUS_MODE_NAV_KEYS.has(key)) {
      return;
    }

    event.preventDefault();
    const nextMode = FOCUS_MODES[nextIndexFor(currentIndex, key)];
    onFocusModeChange(nextMode.id);

    const container = event.currentTarget?.closest?.('.focus-mode__chips');
    const nextButton = container?.querySelector?.(`[data-focus-mode="${nextMode.id}"]`);
    nextButton?.focus?.();
  };

  return (
    <section className="focus-mode" aria-label="ADHD support layer">
      <div className="focus-mode__chips" role="radiogroup" aria-label="Choose your support mode">
        {FOCUS_MODES.map((mode, index) => (
          <button
            key={mode.id}
            data-focus-mode={mode.id}
            type="button"
            role="radio"
            aria-checked={focusMode === mode.id}
            tabIndex={focusMode === mode.id ? 0 : -1}
            className={focusMode === mode.id ? 'focus-chip focus-chip--active' : 'focus-chip'}
            onClick={() => onFocusModeChange(mode.id)}
            onKeyDown={(event) => handleFocusModeKeyDown(event, index)}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <p className="supportive-copy">{supportCopy}</p>
    </section>
  );
}

export default FocusModeChips;
