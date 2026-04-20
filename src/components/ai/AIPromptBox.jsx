import { useId, useState } from 'react';

function AIPromptBox({ onSubmit, placeholder = 'Ask for a brief, prioritization, or draft prompt...' }) {
  const [value, setValue] = useState('');
  const promptLabelId = useId();
  const promptFieldId = useId();
  const promptHintId = useId();

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!value.trim()) {
      return;
    }

    onSubmit?.(value.trim());
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
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <p id={promptHintId} className="helper-text helper-text--offset">
        Add a short instruction and press Generate to append a direction to your notes.
      </p>
      <div className="chief-actions">
        <button type="submit" className="action-button">
          Generate
        </button>
      </div>
    </form>
  );
}

export default AIPromptBox;
