import { useId } from 'react';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SourceStatusNotice from '../components/ui/SourceStatusNotice';
import { useSettings } from '../hooks/useSettings';
import { useThemePreference } from '../hooks/useThemePreference';
import { useWorkspaceSetup } from '../hooks/useWorkspaceSetup';
import { resolveTimeZone } from '../lib/settings';
import { SOURCE_NOTICE_DEMO_DATA, SOURCE_NOTICE_LOCAL_ONLY, buildSourceNotice } from '../lib/uiCopy';
import '../styles/forms.css';

const THEME_CHOICES = [
  { value: 'system', label: 'Match system', description: 'Follow your OS dark or light setting.' },
  { value: 'dark', label: 'Dark', description: 'The original calm-night palette.' },
  { value: 'light', label: 'Light', description: 'Warm-paper palette for bright environments.' },
];

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
  const autoSaveToggleId = useId();
  const emailDigestToggleId = useId();
  const shortcutsToggleId = useId();
  const emailDigestComingSoonId = useId();
  const shortcutsComingSoonId = useId();
  const themeRadiogroupId = useId();
  const { preference: themePreference, setThemePreference } = useThemePreference();
  const {
    hasChoice: hasWorkspaceSetupChoice,
    isDemoMode,
    startBlankWorkspace,
    loadDemoWorkspace,
    clearDemoData,
  } = useWorkspaceSetup();
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
              value={settings.timezone}
              required
              minLength={2}
              disabled={fieldsDisabled}
              error={!timezoneIsValid ? 'Timezone is invalid. Example: America/Chicago.' : ''}
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
            {timezoneIsValid ? (
              <span className="helper-text helper-text--offset">
                Use IANA format such as America/Chicago.
              </span>
            ) : null}
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
              <span>Import from local backup: coming soon</span>
              <span>Connect Supabase account: setup required</span>
            </div>
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

