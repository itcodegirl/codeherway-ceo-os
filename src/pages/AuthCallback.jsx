import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { useAuthSession } from '../hooks/useAuthSession';
import { isSupabaseConfigured } from '../lib/supabase';

// Magic-link landing page. With `detectSessionInUrl: true` the Supabase
// client extracts the token from the URL automatically, so this route's
// job is to wait for the resulting auth state change and reroute.
function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing, status, error } = useAuthSession();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // If the URL contained no token (or it was already consumed), short-circuit
  // back to the sign-in page after a small grace window so the user can
  // request a fresh link instead of staring at a spinner.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      navigate('/sign-in', { replace: true });
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setHasTimedOut(true);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  if (status === 'error') {
    return (
      <section>
        <PageHeader
          title="Sign in failed"
          description="We could not finish signing you in."
        />
        <p className="form-error" role="alert">
          {error?.message || 'Try requesting a fresh magic link.'}
        </p>
        <Button type="button" onClick={() => navigate('/sign-in', { replace: true })}>
          Back to sign in
        </Button>
      </section>
    );
  }

  if (hasTimedOut && !isAuthenticated && !isInitializing) {
    return (
      <section>
        <PageHeader
          title="Sign-in link not detected"
          description="The link may have expired or already been used on another device."
        />
        <Button type="button" onClick={() => navigate('/sign-in', { replace: true })}>
          Request a new link
        </Button>
      </section>
    );
  }

  return (
    <section>
      <PageHeader title="Signing you in…" description="Hold tight for a moment." />
      <p className="helper-text" role="status" aria-live="polite">
        Finishing your magic-link sign-in…
      </p>
    </section>
  );
}

export default AuthCallback;
