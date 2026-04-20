import { useState } from 'react';
import SectionCard from '../components/ui/SectionCard';

function Settings() {
  const [settings, setSettings] = useState({
    timezone: 'America/Chicago',
    teamName: 'CodeHerWay',
    emailDigest: true,
    keyboardShortcuts: false,
    autoSave: true,
  });

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="settings-page">
      <div className="page-intro">
        <h1 className="page-title">Settings</h1>
        <p className="helper-text">Manage preferences that control your executive operating environment.</p>
      </div>

      <div className="settings-grid">
        <SectionCard title="Workspace" actionText="Save Profile">
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

        <SectionCard title="Experience" actionText="Apply">
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
      </div>

      <div className="helper-text">
        Changes persist in browser memory for now and will be synced to your account in the next release.
      </div>
    </section>
  );
}

export default Settings;
