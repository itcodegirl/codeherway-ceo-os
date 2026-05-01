import { useEffect, useRef } from 'react';

export function useIsMountedRef(onUnmount) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      onUnmount?.();
    };
  }, [onUnmount]);

  return isMountedRef;
}
