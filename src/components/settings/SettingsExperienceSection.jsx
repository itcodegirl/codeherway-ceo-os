import { useId } from 'react';
import SectionCard from '../ui/SectionCard';

/**
 * Experience toggles. The auto-save toggle is wired through the page's
 * `onToggle(key, value)` callback. The email digest and keyboard shortcuts
 * toggles are intentionally disabled — labelled "coming soon" — because the
 * underlying systems are not wired yet. Keeping them visible communicates
 * roadmap without pretending the features work.
 */
function SettingsExperienceSection({ autoSave, fieldsDisabled, onToggle }) {
  const autoSaveToggleId = useId();
  const emailDigestToggleId = useId();
  const shortcutsToggleId = useId();
  const emailDigestComingSoonId = useId();
  const shortcutsComingSoonId = useId();

  return (
    <SectionCard title="Experience" iconName="settings">
      <label className="settings-toggle" htmlFor={autoSaveToggleId}>
        <input
          id={autoSaveToggleId}
          type="checkbox"
          checked={autoSave}
          disabled={fieldsDisabled}
          onChange={(event) => onToggle('autoSave', event.target.checked)}
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
  );
}

export default SettingsExperienceSection;
