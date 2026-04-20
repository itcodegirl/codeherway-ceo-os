import { useId, useState } from 'react';

function AIPromptBox({ onSubmit, placeholder = 'Ask for a brief, prioritization, or draft prompt...' }) {
  const [value, setValue] = useState('');
  const promptId = useId();

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
      <label htmlFor={promptId} className="sr-only">
        Additional prompt input
      </label>
      <textarea
        id={promptId}
        className="chief-textarea"
        aria-label="AI prompt input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="chief-actions">
        <button type="submit" className="action-button">
          Generate
        </button>
      </div>
    </form>
  );
}

export default AIPromptBox;
