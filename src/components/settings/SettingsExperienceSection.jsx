import { useId } from 'react';
import SectionCard from '../ui/SectionCard';

/**
 * Experience toggles. Only the auto-save toggle is wired — the email digest
 * and keyboard shortcuts surfaces were removed because they read as
 * half-finished when the underlying systems are not ready.
 */
function SettingsExperienceSection({ autoSave, fieldsDisabled, onToggle }) {
  const autoSaveToggleId = useId();

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
      <p className="helper-text helper-text--offset">
        Drafts and notes save in the background as you type. Disable to require explicit save actions.
      </p>
    </SectionCard>
  );
}

export default SettingsExperienceSection;
