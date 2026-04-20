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
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('localStorage save failed', error);
      }
    }
  }, [key, value]);

  useEffect(() => {
    setValue(loadValue(key, initialValue));
  }, [key, initialValue]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorageChange = (event) => {
      if (event.storageArea !== window.localStorage) {
        return;
      }

      if (event.key !== key && event.key !== null) {
        return;
      }

      if (event.key === null || event.newValue === null) {
        setValue(initialValue);
        return;
      }

      try {
        setValue(JSON.parse(event.newValue));
      } catch (error) {
        setValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [value, setValue];
}
