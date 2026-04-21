import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_TOAST_DURATION_MS = 2200;

export function useToast(durationMs = DEFAULT_TOAST_DURATION_MS) {
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
