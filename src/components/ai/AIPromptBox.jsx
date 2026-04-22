import { useId, useState } from 'react';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';

function AIPromptBox({ onSubmit, placeholder = 'Ask for a brief, prioritization, or draft prompt...', isDisabled = false }) {
  const [value, setValue] = useState('');
  const trimmedValue = value.trim();
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
      <Textarea
        id={promptFieldId}
        label="Additional prompt input"
        labelClassName="sr-only"
        controlClassName="chief-textarea"
        placeholder={placeholder}
        aria-describedby={promptHintId}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        rows={4}
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
        <Button
          type="submit"
          disabled={!canSubmit}
          ariaLabel="Generate follow-up instruction"
          icon={{ name: 'spark', size: 14 }}
        >
          Generate
        </Button>
      </div>
    </form>
  );
}

export default AIPromptBox;
