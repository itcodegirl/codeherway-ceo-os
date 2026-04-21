import { useEffect, useRef, useState } from 'react';

const PERSISTENT_STATE_EVENT = 'ceo-os:persistent-state';

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

function valuesEqual(left, right) {
  if (Object.is(left, right)) {
    return true;
  }

  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

export function usePersistentState(key, initialValue) {
  const initialValueRef = useRef(initialValue);

  const [state, setState] = useState(() => ({
    key,
    value: loadValue(key, initialValue),
  }));

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [key, initialValue]);

  const value = state.key === key ? state.value : loadValue(key, initialValue);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const setValue = (nextValue) => {
    const resolvedValue = resolveNextValue(nextValue, valueRef.current);

    setState((currentState) => {
      if (currentState.key === key && valuesEqual(currentState.value, resolvedValue)) {
        return currentState;
      }

      return { key, value: resolvedValue };
    });

    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(resolvedValue));
      window.dispatchEvent(
        new CustomEvent(PERSISTENT_STATE_EVENT, {
          detail: { key, value: resolvedValue },
        }),
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('localStorage save failed', error);
      }
    }
  };

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
        setState((currentState) => {
          const nextValue = resolveInitialValue(initialValueRef.current);

          if (currentState.key === key && valuesEqual(currentState.value, nextValue)) {
            return currentState;
          }

          return { key, value: nextValue };
        });
        return;
      }

      try {
        const parsedValue = JSON.parse(event.newValue);
        setState((currentState) => {
          if (currentState.key === key && valuesEqual(currentState.value, parsedValue)) {
            return currentState;
          }

          return { key, value: parsedValue };
        });
      } catch {
        setState((currentState) => {
          const nextValue = resolveInitialValue(initialValueRef.current);

          if (currentState.key === key && valuesEqual(currentState.value, nextValue)) {
            return currentState;
          }

          return { key, value: nextValue };
        });
      }
    };

    const handleInPageStateChange = (event) => {
      const detail = event?.detail;
      if (!detail || detail.key !== key) {
        return;
      }

      setState((currentState) => {
        if (currentState.key === key && valuesEqual(currentState.value, detail.value)) {
          return currentState;
        }

        return { key, value: detail.value };
      });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(PERSISTENT_STATE_EVENT, handleInPageStateChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(PERSISTENT_STATE_EVENT, handleInPageStateChange);
    };
  }, [key]);

  return [value, setValue];
}
