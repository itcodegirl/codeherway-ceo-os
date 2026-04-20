import { useId } from 'react';

function Textarea({
  id,
  label,
  error,
  rows = 4,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const textareaId = id || `textarea-${generatedId}`;

  return (
    <div className={`input-field ${className}`.trim()}>
      {label ? (
        <label className="input-field__label" htmlFor={textareaId}>
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        rows={rows}
        className={`textarea-field__control ${error ? 'textarea-field__control--error' : ''}`}
        {...props}
      />
      {error ? <span className="input-field__error">{error}</span> : null}
    </div>
  );
}

export default Textarea;
