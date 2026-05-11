import { Link } from 'react-router-dom';
import SectionCard from '../ui/SectionCard';
import Button from '../ui/Button';

/**
 * Account / sign-in surface. Renders one of four states:
 *
 *   1. Cloud sync not configured for this build
 *   2. Auth is initializing (Supabase session check in flight)
 *   3. Authenticated — show user + sign-out
 *   4. Not signed in — link to /sign-in
 *
 * The parent page owns the sign-out lifecycle and passes in the current
 * state + error message; this component is pure presentation.
 */
function SettingsAccountSection({
  isCloudConfigured,
  isAuthInitializing,
  isAuthenticated,
  userEmail,
  signOutState,
  signOutError,
  onSignOut,
}) {
  return (
    <SectionCard title="Account" iconName="settings">
      {!isCloudConfigured ? (
        <p className="helper-text">
          Cloud sync is not configured for this build. Local data on this device is the
          source of truth. To enable accounts, set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>, then redeploy.
        </p>
      ) : isAuthInitializing ? (
        <p className="helper-text" role="status" aria-live="polite">
          Checking your session…
        </p>
      ) : isAuthenticated ? (
        <div className="settings-account">
          <p className="helper-text">
            Signed in as <strong>{userEmail || 'authenticated user'}</strong>.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={onSignOut}
            disabled={signOutState === 'pending'}
          >
            {signOutState === 'pending' ? 'Signing out…' : 'Sign out'}
          </Button>
          {signOutError ? (
            <p role="alert" className="form-error">{signOutError}</p>
          ) : null}
        </div>
      ) : (
        <div className="settings-account">
          <p className="helper-text">
            You are not signed in. Cloud sync stays off until you sign in. Local data on
            this device is preserved either way.
          </p>
          <Link to="/sign-in" className="settings-account__signin-link">
            Sign in with magic link
          </Link>
        </div>
      )}
    </SectionCard>
  );
}

export default SettingsAccountSection;
