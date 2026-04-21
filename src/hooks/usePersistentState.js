import { useEffect, useState } from 'react';

function resolveInitialValue(initialValue) {
  return typeof initialValue === 'function' ? initialValue() : initialValue;
}

function loadValue(key, initialValue) {
  if (typeof window === 'undefined') {
    return resolveInitialValue(initialValue);
  }

  try {
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return resolveInitialValue(initialValue);
    }

    return JSON.parse(item);
  } catch {
    return resolveInitialValue(initialValue);
  }
}

function resolveNextValue(nextValue, currentValue) {
  return typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;
}

export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => ({
    key,
    value: loadValue(key, initialValue),
  }));

  const value = state.key === key ? state.value : loadValue(key, initialValue);

  const setValue = (nextValue) => {
    setState((currentState) => {
      const currentValue =
        currentState.key === key ? currentState.value : loadValue(key, initialValue);

      return {
        key,
        value: resolveNextValue(nextValue, currentValue),
      };
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('localStorage save failed', error);
      }
    }
  }, [key, value]);

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
        setState({ key, value: resolveInitialValue(initialValue) });
        return;
      }

      try {
        setState({ key, value: JSON.parse(event.newValue) });
      } catch {
        setState({ key, value: resolveInitialValue(initialValue) });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [value, setValue];
}
