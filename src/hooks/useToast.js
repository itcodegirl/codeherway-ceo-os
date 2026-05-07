import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const DEFAULT_TOAST_DURATION_MS = 2200;

export const ToastContext = createContext(null);

// Internal: build a fresh toast state (message + timer + show/hide).
// Used both by the shared provider and by the standalone fallback.
export function useStandaloneToast(durationMs = DEFAULT_TOAST_DURATION_MS) {
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (!timerRef.current) {
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const hideToast = useCallback(() => {
    clearTimer();
    setMessage('');
  }, [clearTimer]);

  const showToast = useCallback((nextMessage) => {
    setMessage(nextMessage);
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setMessage('');
      timerRef.current = null;
    }, durationMs);
  }, [clearTimer, durationMs]);

  useEffect(() => () => {
    clearTimer();
  }, [clearTimer]);

  return {
    toastMessage: message,
    isToastVisible: Boolean(message),
    showToast,
    hideToast,
  };
}

// Public hook. When a ToastProvider is mounted (the production app shell),
// every caller — page, hook, repository wrapper — routes through the same
// shared instance, so messages never compete with per-component toasts.
// Tests that render a hook in isolation (no provider) still get a
// self-contained instance with the same shape, preserving the legacy API.
export function useToast(durationMs = DEFAULT_TOAST_DURATION_MS) {
  const context = useContext(ToastContext);
  const fallback = useStandaloneToast(durationMs);
  return context || fallback;
}
