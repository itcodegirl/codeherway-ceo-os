import { useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SourceStatusNotice from '../components/ui/SourceStatusNotice';
import LastSavedIndicator from '../components/ui/LastSavedIndicator';
import { useSettings } from '../hooks/useSettings';
import { useOfflineWriteQueueSize } from '../hooks/useOfflineWriteQueue';
import { useThemePreference } from '../hooks/useThemePreference';
import { useWorkspaceSetup } from '../hooks/useWorkspaceSetup';
import { useAuthSession } from '../hooks/useAuthSession';
import { isSupabaseConfigured, signOut } from '../lib/supabase';
import { getDeviceTimezone, getSupportedTimezones, resolveTimeZone } from '../lib/settings';
import { SOURCE_NOTICE_DEMO_DATA, SOURCE_NOTICE_LOCAL_ONLY, buildSourceNotice } from '../lib/uiCopy';
import {
  buildWorkspaceBackup,
  buildWorkspaceBackupFileName,
  getLocalWorkspaceDataHealth,
  importWorkspaceBackup,
} from '../lib/workspacePortability';
import '../styles/forms.css';

const THEME_CHOICES = [
  { value: 'system', label: 'Match system', description: 'Follow your OS dark or light setting.' },
  { value: 'dark', label: 'Dark', description: 'The original calm-night palette.' },
  { value: 'light', label: 'Light', description: 'Warm-paper palette for bright environments.' },
];

function formatCount(count, singular, plural = `${singular}s`) {
  const normalized = Number(count) || 0;
  return `${normalized} ${normalized === 1 ? singular : plural}`;
}

function formatSavedAt(savedAt) {
  const timestamp = Number(savedAt);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return 'No local settings save recorded yet.';
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'No local settings save recorded yet.';
  }

  return `Last local settings save: ${date.toLocaleString()}.`;
}

function readFileAsText(file) {
  if (file && typeof file.text === 'function') {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    if (typeof FileReader !== 'function') {
      reject(new Error('Backup import is not available in this browser.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Backup file could not be read.'));
    reader.readAsText(file);
  });
}

function Settings() {
  const {
    settings,
    savedAt,
    source,
    isLoading,
    isSaving,
    loadError,
    timezoneIsValid,
    normalizeTimezone,
    updateSetting,
    saveSettings,
    refreshSettings,
  } = useSettings();
  const teamNameFieldId = useId();
  const timezoneFieldId = useId();
  const timezoneListId = useId();
  const supportedTimezones = useMemo(() => getSupportedTimezones(), []);
  const autoSaveToggleId = useId();
  const emailDigestToggleId = useId();
  const shortcutsToggleId = useId();
  const emailDigestComingSoonId = useId();
  const shortcutsComingSoonId = useId();
  const themeRadiogroupId = useId();
  const importInputId = useId();
  const importInputRef = useRef(null);
  const [, setDataHealthRefreshKey] = useState(0);
  const [portabilityStatus, setPortabilityStatus] = useState({ tone: '', message: '' });
  const { preference: themePreference, setThemePreference } = useThemePreference();
  const pendingSyncCount = useOfflineWriteQueueSize();
  const {
    hasChoice: hasWorkspaceSetupChoice,
    isDemoMode,
    startBlankWorkspace,
    loadDemoWorkspace,
    clearDemoData,
  } = useWorkspaceSetup();
  const { user, isAuthenticated, isInitializing: isAuthInitializing, isDisabled: isAuthDisabled } = useAuthSession();
  const [signOutState, setSignOutState] = useState('idle');
  const [signOutError, setSignOutError] = useState('');

  const handleSignOut = async () => {
    if (signOutState === 'pending') {
      return;
    }
    setSignOutState('pending');
    setSignOutError('');
    try {
      await signOut();
      setSignOutState('idle');
    } catch (caught) {
      setSignOutError(caught?.message || 'Sign out failed.');
      setSignOutState('error');
    }
  };
  const fieldsDisabled = isSaving || isLoading;
  const canSave = timezoneIsValid && !fieldsDisabled;
  const saveButtonLabel = isSaving
    ? 'Saving settings'
    : timezoneIsValid
      ? 'Save settings'
      : 'Save settings unavailable until timezone is valid';
  const canPersistSettings = (nextSettings = settings) => Boolean(
    resolveTimeZone(nextSettings?.timezone),
  );
  const dataHealth = getLocalWorkspaceDataHealth();
  const backupScopeCopy = source === 'supabase'
    ? 'Backups cover this browser\'s local fallback data. Synced Supabase records stay in Supabase.'
    : 'Backups cover the local workspace data stored in this browser.';
  const healthIssueCopy = dataHealth.invalidStoreCount > 0
    ? `${formatCount(dataHealth.invalidStoreCount, 'local store')} needs recovery and will not be exported.`
    : 'No local data recovery issues detected.';
  const pendingSyncCopy = pendingSyncCount > 0
    ? `${formatCount(pendingSyncCount, 'supported write')} waiting to sync.`
    : 'No supported writes waiting to sync.';

  const handleChange = (key, value) => {
    updateSetting(key, value);
  };

  const markSave = async (nextSettings = settings) => {
    if (!canPersistSettings(nextSettings)) {
      return;
    }

    await saveSettings(nextSettings);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    void markSave({
      ...settings,
      teamName: formData.get('teamName'),
      timezone: formData.get('timezone'),
    });
  };

  const handleToggle = (key, value) => {
    handleChange(key, value);
    const nextSettings = { ...settings, [key]: value };
    if (canPersistSettings(nextSettings)) {
      void saveSettings(nextSettings);
    }
  };

  const handleExportBackup = () => {
    try {
      const backup = buildWorkspaceBackup();
      if (
        typeof Blob !== 'function'
        || typeof window === 'undefined'
        || !window.URL
        || typeof window.URL.createObjectURL !== 'function'
      ) {
        setPortabilityStatus({
          tone: 'error',
          message: 'Backup export is not available in this browser.',
        });
        return;
      }

      const backupContent = JSON.stringify(backup, null, 2);
      const blob = new Blob([backupContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = buildWorkspaceBackupFileName(backup.exportedAt);
      link.rel = 'noopener';
      link.click();
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 0);

      setDataHealthRefreshKey((current) => current + 1);
      setPortabilityStatus({
        tone: 'success',
        message: `${formatCount(backup.summary.includedStoreCount, 'local store')} exported. Pending sync is reported in the file, not replayed from backups.`,
      });
    } catch (error) {
      setPortabilityStatus({
        tone: 'error',
        message: error?.message || 'Backup export failed.',
      });
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportBackup = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      const backupText = await readFileAsText(file);
      const result = importWorkspaceBackup(backupText);
      setDataHealthRefreshKey((current) => current + 1);
      await refreshSettings();
      setPortabilityStatus({
        tone: 'success',
        message: `${formatCount(result.importedStoreCount, 'local store')} imported. Matching local stores were replaced; Supabase data was not changed.`,
      });
    } catch (error) {
      setPortabilityStatus({
        tone: 'error',
        message: error?.message || 'Backup import failed.',
      });
    } finally {
      input.value = '';
    }
  };

  return (
    <section className="settings-page">
      <PageHeader
        title="Settings"
        description="Manage preferences that control your executive operating environment."
      />
      <SourceStatusNotice
        source={source}
        supabaseText={buildSourceNotice('supabase', { supabasePrefix: '' })}
        localText={SOURCE_NOTICE_LOCAL_ONLY}
        loadError={loadError}
        onRetry={refreshSettings}
        retryAriaLabel="Retry loading settings"
        retryDisabled={isLoading || isSaving}
      />
      {isLoading ? (
        <p className="helper-text" role="status" aria-live="polite">
          Loading settings...
        </p>
      ) : null}

      <form className="settings-grid" onSubmit={handleSubmit} aria-busy={isSaving || isLoading}>
        <SectionCard
          title="Account"
          iconName="settings"
        >
          {!isSupabaseConfigured || isAuthDisabled ? (
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
                Signed in as <strong>{user?.email || 'authenticated user'}</strong>.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={handleSignOut}
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

        <SectionCard
          title="Workspace"
          iconName="settings"
        >
          <Input
            id={teamNameFieldId}
            type="text"
            name="teamName"
            label="Workspace name"
            className="form-field"
            autoComplete="organization"
            value={settings.teamName}
            required
            minLength={2}
            disabled={fieldsDisabled}
            onChange={(e) => handleChange('teamName', e.target.value)}
          />

          <div className="form-field">
            <Input
              id={timezoneFieldId}
              type="text"
              name="timezone"
              label="Timezone"
              autoComplete="off"
              list={timezoneListId}
              value={settings.timezone}
              required
              minLength={2}
              disabled={fieldsDisabled}
              error={!timezoneIsValid ? 'Timezone is invalid. Pick one from the list, for example America/Chicago.' : ''}
              title={
                timezoneIsValid
                  ? 'Use an IANA timezone, for example America/Chicago.'
                  : 'Enter a valid IANA timezone, for example America/Chicago.'
              }
              onBlur={() => {
                normalizeTimezone();
              }}
              onChange={(e) => handleChange('timezone', e.target.value)}
            />
            <datalist id={timezoneListId}>
              {supportedTimezones.map((zone) => (
                <option key={zone} value={zone} />
              ))}
            </datalist>
            <div className="settings-timezone-actions">
              <Button
                type="button"
                size="small"
                variant="ghost"
                disabled={fieldsDisabled}
                onClick={() => handleChange('timezone', getDeviceTimezone())}
              >
                Use device timezone
              </Button>
              {timezoneIsValid ? (
                <span className="helper-text helper-text--offset">
                  Start typing to filter the IANA list (for example, "Chicago" or "Tokyo").
                </span>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Theme"
          iconName="settings"
        >
          <fieldset
            className="settings-theme"
            aria-describedby={`${themeRadiogroupId}-helper`}
          >
            <legend className="settings-theme__legend">Display theme</legend>
            <div className="settings-theme__choices" role="radiogroup">
              {THEME_CHOICES.map((choice) => {
                const isActive = themePreference === choice.value;
                const radioId = `${themeRadiogroupId}-${choice.value}`;
                return (
                  <label
                    key={choice.value}
                    htmlFor={radioId}
                    className={
                      isActive
                        ? 'settings-theme__choice settings-theme__choice--active'
                        : 'settings-theme__choice'
                    }
                  >
                    <input
                      id={radioId}
                      type="radio"
                      name={themeRadiogroupId}
                      value={choice.value}
                      checked={isActive}
                      onChange={() => setThemePreference(choice.value)}
                    />
                    <span className="settings-theme__choice-label">{choice.label}</span>
                    <span className="settings-theme__choice-description">{choice.description}</span>
                  </label>
                );
              })}
            </div>
            <p id={`${themeRadiogroupId}-helper`} className="helper-text helper-text--muted">
              Stored in this browser. Changes apply immediately.
            </p>
          </fieldset>
        </SectionCard>

        <SectionCard
          title="Workspace Data"
          iconName="section"
        >
          <div className="settings-workspace-setup">
            <p className="helper-text">
              {hasWorkspaceSetupChoice
                ? isDemoMode
                  ? SOURCE_NOTICE_DEMO_DATA
                  : 'Blank local workspace is active on this device.'
                : 'No setup choice has been saved yet. Demo records are shown for review until you choose.'}
            </p>
            <div className="settings-workspace-setup__actions">
              <Button type="button" size="small" onClick={startBlankWorkspace} icon={{ name: 'check', size: 14 }}>
                Start blank
              </Button>
              <Button type="button" size="small" variant="ghost" onClick={loadDemoWorkspace} icon={{ name: 'section', size: 14 }}>
                Load demo workspace
              </Button>
              <Button
                type="button"
                size="small"
                variant="ghost"
                onClick={clearDemoData}
                disabled={!isDemoMode}
                ariaLabel={isDemoMode ? 'Clear demo data from this device' : 'Clear demo data unavailable'}
              >
                Clear demo data
              </Button>
            </div>
            <div className="settings-workspace-setup__unavailable" aria-label="Unavailable setup paths">
              <span>Connect Supabase account: setup required</span>
            </div>
          </div>

          <div className="settings-data-health" role="group" aria-label="Local data health">
            <div className="settings-data-health__summary" role="list">
              <span role="listitem">
                <strong>{dataHealth.localRecordCount}</strong>
                Local records
              </span>
              <span role="listitem">
                <strong>{dataHealth.restorableStoreCount}</strong>
                Backup stores
              </span>
              <span role="listitem">
                <strong>{pendingSyncCount}</strong>
                Pending sync
              </span>
            </div>
            <p className="helper-text">
              {backupScopeCopy} {healthIssueCopy} {pendingSyncCopy}
            </p>
            <p className="helper-text helper-text--muted">
              {formatSavedAt(dataHealth.lastSettingsSavedAt)}
            </p>
            <div className="settings-workspace-setup__actions">
              <Button
                type="button"
                size="small"
                onClick={handleExportBackup}
                disabled={!dataHealth.isAvailable}
                ariaLabel="Export local workspace backup"
                icon={{ name: 'copy', size: 14 }}
              >
                Export backup
              </Button>
              <Button
                type="button"
                size="small"
                variant="ghost"
                onClick={handleImportClick}
                disabled={!dataHealth.isAvailable}
                ariaLabel="Import local workspace backup"
                icon={{ name: 'section', size: 14 }}
              >
                Import backup
              </Button>
              <input
                id={importInputId}
                ref={importInputRef}
                className="settings-backup-file"
                type="file"
                accept="application/json,.json"
                aria-label="Import local workspace backup file"
                onChange={handleImportBackup}
              />
            </div>
            <p className="helper-text helper-text--muted">
              Import replaces matching local stores only. It does not delete other local data or migrate anything into Supabase.
            </p>
            {portabilityStatus.message ? (
              <p
                className={`helper-text settings-backup-status settings-backup-status--${portabilityStatus.tone}`}
                role={portabilityStatus.tone === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                {portabilityStatus.message}
              </p>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Experience"
          iconName="settings"
        >
          <label className="settings-toggle" htmlFor={autoSaveToggleId}>
            <input
              id={autoSaveToggleId}
              type="checkbox"
              checked={settings.autoSave}
              disabled={fieldsDisabled}
              onChange={(e) => handleToggle('autoSave', e.target.checked)}
            />
            <span>Enable auto-save for drafts and notes</span>
          </label>

          <label className="settings-toggle" htmlFor={emailDigestToggleId}>
            <input
              id={emailDigestToggleId}
              type="checkbox"
              checked={false}
              disabled
              aria-describedby={emailDigestComingSoonId}
              readOnly
            />
            <span>Weekly digest reminders (coming soon)</span>
          </label>
          <p id={emailDigestComingSoonId} className="helper-text helper-text--offset">
            Email delivery is not wired yet, so this stays unavailable until reminders can actually send.
          </p>

          <label className="settings-toggle" htmlFor={shortcutsToggleId}>
            <input
              id={shortcutsToggleId}
              type="checkbox"
              checked={false}
              disabled
              aria-describedby={shortcutsComingSoonId}
              readOnly
            />
            <span>Keyboard shortcuts (coming soon)</span>
          </label>
          <p id={shortcutsComingSoonId} className="helper-text helper-text--offset">
            Shortcuts will return once every command has tested keyboard behavior.
          </p>
        </SectionCard>

        <div className="settings-actions">
          <Button
            type="submit"
            disabled={!canSave}
            ariaLabel={saveButtonLabel}
            icon={{ name: 'check', size: 14 }}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      <div className="helper-text" role="status" aria-live="polite">
        {source === 'supabase'
          ? 'Settings save to your synced workspace.'
          : 'Settings are stored on this device.'}
        <LastSavedIndicator savedAt={savedAt} />
      </div>
    </section>
  );
}

export default Settings;

