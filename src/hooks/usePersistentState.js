import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveNextValue } from '../lib/stateUtils';

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

function valuesEqual(left, right) {
  if (Object.is(left, right)) {
    return true;
  }

  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') {
    return false;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    for (let index = 0; index < left.length; index += 1) {
      if (!Object.is(left[index], right[index])) {
        return false;
      }
    }

    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (let index = 0; index < leftKeys.length; index += 1) {
    const key = leftKeys[index];
    if (!Object.prototype.hasOwnProperty.call(right, key)) {
      return false;
    }
    if (!Object.is(left[key], right[key])) {
      return false;
    }
  }

  return true;
}

export function usePersistentState(key, initialValue) {
  const initialValueRef = useRef(initialValue);

  const [state, setState] = useState(() => ({
    key,
    value: loadValue(key, initialValue),
  }));

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    setState((currentState) => {
      if (currentState.key === key) {
        return currentState;
      }

      return {
        key,
        value: loadValue(key, initialValueRef.current),
      };
    });
  }, [key]);

  const value = state.key === key ? state.value : loadValue(key, initialValue);

  const setValue = useCallback((nextValue) => {
    setState((currentState) => {
      const currentValue = currentState.key === key
        ? currentState.value
        : loadValue(key, initialValueRef.current);
      const resolvedValue = resolveNextValue(nextValue, currentValue);

      if (currentState.key === key && valuesEqual(currentState.value, resolvedValue)) {
        return currentState;
      }

      return { key, value: resolvedValue };
    });
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (state.key !== key) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(
        new CustomEvent(PERSISTENT_STATE_EVENT, {
          detail: { key, value },
        }),
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('localStorage save failed', error);
      }
    }
  }, [key, state.key, value]);

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
