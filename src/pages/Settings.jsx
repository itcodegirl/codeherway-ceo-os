import { useId, useMemo, useRef, useState } from 'react';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SourceStatusNotice from '../components/ui/SourceStatusNotice';
import SettingsAccountSection from '../components/settings/SettingsAccountSection';
import SettingsThemeSection from '../components/settings/SettingsThemeSection';
import SettingsWorkspaceDataSection from '../components/settings/SettingsWorkspaceDataSection';
import SettingsExperienceSection from '../components/settings/SettingsExperienceSection';
import { useSettings } from '../hooks/useSettings';
import { useOfflineWriteQueueSize } from '../hooks/useOfflineWriteQueue';
import { useThemePreference } from '../hooks/useThemePreference';
import { useWorkspaceSetup } from '../hooks/useWorkspaceSetup';
import { useAuthSession } from '../hooks/useAuthSession';
import { isSupabaseConfigured, signOut } from '../lib/supabase';
import { getDeviceTimezone, getSupportedTimezones, resolveTimeZone } from '../lib/settings';
import { buildSourceNotice, SOURCE_NOTICE_LOCAL_ONLY } from '../lib/uiCopy';
import {
  buildWorkspaceBackup,
  buildWorkspaceBackupFileName,
  getLocalWorkspaceDataHealth,
  importWorkspaceBackup,
} from '../lib/workspacePortability';
import '../styles/forms.css';

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
    ? "Backups cover this browser's local fallback data. Synced Supabase records stay in Supabase."
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
        <SettingsAccountSection
          isCloudConfigured={isSupabaseConfigured && !isAuthDisabled}
          isAuthInitializing={isAuthInitializing}
          isAuthenticated={isAuthenticated}
          userEmail={user?.email}
          signOutState={signOutState}
          signOutError={signOutError}
          onSignOut={handleSignOut}
        />

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

        <SettingsThemeSection
          themePreference={themePreference}
          onThemePreferenceChange={setThemePreference}
        />

        <SettingsWorkspaceDataSection
          hasWorkspaceSetupChoice={hasWorkspaceSetupChoice}
          isDemoMode={isDemoMode}
          onStartBlankWorkspace={startBlankWorkspace}
          onLoadDemoWorkspace={loadDemoWorkspace}
          onClearDemoData={clearDemoData}
          dataHealth={dataHealth}
          pendingSyncCount={pendingSyncCount}
          formatSavedAt={formatSavedAt}
          backupScopeCopy={backupScopeCopy}
          healthIssueCopy={healthIssueCopy}
          pendingSyncCopy={pendingSyncCopy}
          onExportBackup={handleExportBackup}
          onImportClick={handleImportClick}
          onImportBackup={handleImportBackup}
          importInputRef={importInputRef}
          portabilityStatus={portabilityStatus}
        />

        <SettingsExperienceSection
          autoSave={settings.autoSave}
          fieldsDisabled={fieldsDisabled}
          onToggle={handleToggle}
        />

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
        {Number.isFinite(Number(savedAt)) && Number(savedAt) > 0 ? (() => {
          const savedDate = new Date(Number(savedAt));
          // Guard against corrupted timestamps (e.g. legacy storage) — an
          // invalid Date here would crash the page on toISOString().
          if (Number.isNaN(savedDate.getTime())) {
            return null;
          }
          return (
            <span className="settings-saved-indicator">
              {' '}
              Last saved <time dateTime={savedDate.toISOString()}>{savedDate.toLocaleString()}</time>.
            </span>
          );
        })() : null}
      </div>
    </section>
  );
}

export default Settings;
