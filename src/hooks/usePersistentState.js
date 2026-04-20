import { useEffect, useState } from 'react';

function loadValue(key, initialValue) {
  if (typeof window === 'undefined') {
    return initialValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return initialValue;
    }

    return JSON.parse(item);
  } catch (error) {
    return initialValue;
  }
}

export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => loadValue(key, initialValue));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('localStorage save failed', error);
      }
    }
  }, [key, value]);

  return [value, setValue];
}
