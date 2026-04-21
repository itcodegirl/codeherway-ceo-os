import { useId } from 'react';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const DEFAULT_SETTINGS = {
  timezone: 'America/Chicago',
  teamName: 'CodeHerWay',
  emailDigest: true,
  keyboardShortcuts: false,
  autoSave: true,
};

function Settings() {
  useDocumentTitle(
    'Settings',
    'Manage preferences that control your executive operating environment.',
  );

  const [settings, setSettings] = usePersistentState('ceo-os-settings', DEFAULT_SETTINGS);
  const [savedAt, setSavedAt] = usePersistentState('ceo-os-settings-saved-at', 0);
  const teamNameFieldId = useId();
  const timezoneFieldId = useId();
  const autoSaveToggleId = useId();
  const emailDigestToggleId = useId();
  const shortcutsToggleId = useId();

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const markSave = () => {
    setSavedAt(Date.now());
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    markSave();
  };

  return (
    <section className="settings-page">
      <PageHeader
        title="Settings"
        description="Manage preferences that control your executive operating environment."
      />

      <form className="settings-grid" onSubmit={handleSubmit}>
        <SectionCard
          title="Workspace"
          actionText="Save Profile"
          onAction={markSave}
          actionLabel="Save workspace profile details"
        >
          <label className="settings-field" htmlFor={teamNameFieldId}>
            <span className="settings-field__label">Workspace name</span>
            <input
              id={teamNameFieldId}
              type="text"
              name="teamName"
              autoComplete="organization"
              value={settings.teamName}
              required
              minLength={2}
              onChange={(e) => handleChange('teamName', e.target.value)}
              className="settings-input"
            />
          </label>

          <label className="settings-field" htmlFor={timezoneFieldId}>
            <span className="settings-field__label">
              Timezone
            </span>
            <input
              id={timezoneFieldId}
              type="text"
              name="timezone"
              autoComplete="off"
              value={settings.timezone}
              required
              minLength={2}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="settings-input"
            />
          </label>
        </SectionCard>

        <SectionCard
          title="Experience"
          actionText="Apply"
          onAction={markSave}
          actionLabel="Save workspace and accessibility settings"
        >
          <label className="settings-toggle" htmlFor={autoSaveToggleId}>
            <input
              id={autoSaveToggleId}
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => handleChange('autoSave', e.target.checked)}
            />
            <span>Enable auto-save for drafts and notes</span>
          </label>

          <label className="settings-toggle" htmlFor={emailDigestToggleId}>
            <input
              id={emailDigestToggleId}
              type="checkbox"
              checked={settings.emailDigest}
              onChange={(e) => handleChange('emailDigest', e.target.checked)}
            />
            <span>Send weekly digest reminders</span>
          </label>

          <label className="settings-toggle" htmlFor={shortcutsToggleId}>
            <input
              id={shortcutsToggleId}
              type="checkbox"
              checked={settings.keyboardShortcuts}
              onChange={(e) => handleChange('keyboardShortcuts', e.target.checked)}
            />
            <span>Enable keyboard shortcuts</span>
          </label>
        </SectionCard>
      </form>

      <div className="helper-text" role="status" aria-live="polite">
        Changes persist in browser memory for now and will be synced to your account in the next release.
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
