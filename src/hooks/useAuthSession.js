import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient, getSupabaseSession, isSupabaseConfigured } from '../lib/supabase';

const STATUS_INITIAL = 'initial';
const STATUS_AUTHENTICATED = 'authenticated';
const STATUS_UNAUTHENTICATED = 'unauthenticated';
const STATUS_DISABLED = 'disabled';
const STATUS_ERROR = 'error';

// Subscribes to Supabase auth state and exposes a read model the shell
// can branch on. When Supabase is not configured we report `disabled` so
// local-first callers can short-circuit without throwing.
export function useAuthSession() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(isSupabaseConfigured ? STATUS_INITIAL : STATUS_DISABLED);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Initial state already matches `disabled`; no setState needed here.
      return undefined;
    }

    let unsubscribe = () => {};
    let cancelled = false;

    (async () => {
      try {
        const initialSession = await getSupabaseSession();
        if (cancelled || !isMountedRef.current) {
          return;
        }
        setSession(initialSession);
        setStatus(initialSession ? STATUS_AUTHENTICATED : STATUS_UNAUTHENTICATED);
      } catch (caught) {
        if (cancelled || !isMountedRef.current) {
          return;
        }
        setError(caught);
        setStatus(STATUS_ERROR);
      }

      const supabaseClient = await getSupabaseClient();
      if (cancelled || !supabaseClient || !isMountedRef.current) {
        return;
      }

      const { data } = supabaseClient.auth.onAuthStateChange((event, nextSession) => {
        if (!isMountedRef.current) {
          return;
        }
        setSession(nextSession);
        if (event === 'SIGNED_OUT') {
          setStatus(STATUS_UNAUTHENTICATED);
          return;
        }
        setStatus(nextSession ? STATUS_AUTHENTICATED : STATUS_UNAUTHENTICATED);
      });

      unsubscribe = () => {
        data?.subscription?.unsubscribe?.();
      };
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user || null,
    isAuthenticated: status === STATUS_AUTHENTICATED,
    isInitializing: status === STATUS_INITIAL,
    isDisabled: status === STATUS_DISABLED,
    status,
    error,
  };
}
