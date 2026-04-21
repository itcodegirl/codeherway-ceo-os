import { useId, useState } from 'react';
import Icon from '../ui/Icon';

function AIPromptBox({ onSubmit, placeholder = 'Ask for a brief, prioritization, or draft prompt...', isDisabled = false }) {
  const [value, setValue] = useState('');
  const trimmedValue = value.trim();
  const promptLabelId = useId();
  const promptFieldId = useId();
  const promptHintId = useId();
  const canSubmit = Boolean(trimmedValue) && !isDisabled;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit?.(trimmedValue);
    setValue('');
  };

  return (
    <form className="section-card" onSubmit={handleSubmit}>
      <label htmlFor={promptFieldId} id={promptLabelId} className="sr-only">
        Additional prompt input
      </label>
      <textarea
        id={promptFieldId}
        className="chief-textarea"
        placeholder={placeholder}
        aria-labelledby={promptLabelId}
        aria-describedby={promptHintId}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <p id={promptHintId} className="helper-text helper-text--offset">
        {isDisabled
          ? 'Wait for the current generation to finish before adding another prompt.'
          : trimmedValue
          ? 'Add a short instruction and press Generate to append a direction to your notes.'
          : 'Enter at least one character to enable Generate.'}
      </p>
      <div className="chief-actions">
        <button
          type="submit"
          className="action-button"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
        >
          Generate
          <Icon name="action" size={14} className="action-button__icon" />
        </button>
      </div>
    </form>
  );
}

export default AIPromptBox;
