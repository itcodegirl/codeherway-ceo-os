import { useId } from 'react';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SourceStatusNotice from '../components/ui/SourceStatusNotice';
import { useSettings } from '../hooks/useSettings';
import { SOURCE_NOTICE_SAMPLE_DATA } from '../lib/uiCopy';
import '../styles/forms.css';

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
  const canSave = timezoneIsValid && !isSaving;

  const handleChange = (key, value) => {
    updateSetting(key, value);
  };

  const markSave = async () => {
    if (!canSave) {
      return;
    }

    await saveSettings(settings);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    void markSave();
  };

  return (
    <section className="settings-page">
      <PageHeader
        title="Settings"
        description="Manage preferences that control your executive operating environment."
      />
      <SourceStatusNotice
        source={source}
        loadError={loadError}
        onRetry={refreshSettings}
        retryAriaLabel="Retry loading settings"
        retryDisabled={isLoading || isSaving}
      />
      {isLoading ? <p className="sr-only" role="status" aria-live="polite">Loading settings.</p> : null}

      <form className="settings-grid" onSubmit={handleSubmit}>
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
            disabled={isSaving}
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
              disabled={isSaving}
              error={!timezoneIsValid ? 'Timezone is invalid. Example: America/Chicago.' : ''}
              title={
                timezoneIsValid
                  ? 'Use an IANA timezone, for example America/Chicago.'
                  : 'Enter a valid IANA timezone, for example America/Chicago.'
              }
              onBlur={normalizeTimezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
            />
            <span className="helper-text helper-text--offset" role={!timezoneIsValid ? 'alert' : undefined}>
              {timezoneIsValid
                ? 'Use IANA format such as America/Chicago.'
                : 'Timezone is invalid. Example: America/Chicago.'}
            </span>
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
              disabled={isSaving}
              onChange={(e) => handleChange('autoSave', e.target.checked)}
            />
            <span>Enable auto-save for drafts and notes</span>
          </label>

          <label className="settings-toggle" htmlFor={emailDigestToggleId}>
            <input
              id={emailDigestToggleId}
              type="checkbox"
              checked={settings.emailDigest}
              disabled={isSaving}
              onChange={(e) => handleChange('emailDigest', e.target.checked)}
            />
            <span>Send weekly digest reminders</span>
          </label>

          <label className="settings-toggle" htmlFor={shortcutsToggleId}>
            <input
              id={shortcutsToggleId}
              type="checkbox"
              checked={settings.keyboardShortcuts}
              disabled={isSaving}
              onChange={(e) => handleChange('keyboardShortcuts', e.target.checked)}
            />
            <span>Enable keyboard shortcuts</span>
          </label>
        </SectionCard>

        <div className="settings-actions">
          <Button
            type="submit"
            disabled={!canSave}
            ariaLabel="Save settings"
            icon={{ name: 'check', size: 14 }}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      <div className="helper-text" role="status" aria-live="polite">
        {source === 'supabase'
          ? 'Changes sync to your Supabase profile.'
          : SOURCE_NOTICE_SAMPLE_DATA}
        {savedAt ? (
          <span className="settings-saved-indicator">
            {' '}
            Last saved <time dateTime={new Date(savedAt).toISOString()}>{new Date(savedAt).toLocaleString()}</time>.
          </span>
        ) : null}
      </div>
    </section>
  );
}

export default Settings;

