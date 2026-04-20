import SectionCard from '../components/ui/SectionCard';
import { usePersistentState } from '../hooks/usePersistentState';

function Settings() {
  const [settings, setSettings] = usePersistentState('ceo-os-settings', {
    timezone: 'America/Chicago',
    teamName: 'CodeHerWay',
    emailDigest: true,
    keyboardShortcuts: false,
    autoSave: true,
  });
  const [savedAt, setSavedAt] = usePersistentState('ceo-os-settings-saved-at', '');

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const markSave = () => {
    const now = new Date().toLocaleString();
    setSavedAt(now);
  };

  const handleSubmit = (event) => {
    markSave();
    event.preventDefault();
  };

  return (
    <section className="settings-page">
      <div className="page-intro">
        <h1 className="page-title">Settings</h1>
        <p className="helper-text">Manage preferences that control your executive operating environment.</p>
      </div>

      <form className="settings-grid" onSubmit={handleSubmit}>
        <SectionCard title="Workspace" actionText="Save Profile" onAction={markSave}>
          <label className="settings-field">
            <span className="settings-field__label">Workspace name</span>
            <input
              type="text"
              value={settings.teamName}
              onChange={(e) => handleChange('teamName', e.target.value)}
              className="settings-input"
              aria-label="Workspace name"
            />
          </label>

          <label className="settings-field">
            <span className="settings-field__label">Timezone</span>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="settings-input"
              aria-label="Workspace timezone"
            />
          </label>
        </SectionCard>

        <SectionCard title="Experience" actionText="Apply" onAction={markSave}>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => handleChange('autoSave', e.target.checked)}
            />
            <span>Enable auto-save for drafts and notes</span>
          </label>

          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.emailDigest}
              onChange={(e) => handleChange('emailDigest', e.target.checked)}
            />
            <span>Send weekly digest reminders</span>
          </label>

          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.keyboardShortcuts}
              onChange={(e) => handleChange('keyboardShortcuts', e.target.checked)}
            />
            <span>Enable keyboard shortcuts</span>
          </label>
        </SectionCard>
      </form>

      <div className="helper-text">
        Changes persist in browser memory for now and will be synced to your account in the next release.
        {savedAt ? <span className="settings-saved-indicator"> Last saved {savedAt}.</span> : null}
      </div>
    </section>
  );
}

export default Settings;
