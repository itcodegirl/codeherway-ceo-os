import { useId } from 'react';

function Textarea({
  id,
  label,
  error,
  rows = 4,
  className = '',
  labelClassName = '',
  controlClassName = '',
  ...props
}) {
  const generatedId = useId();
  const textareaId = id || `textarea-${generatedId}`;
  const hasError = Boolean(error);
  const errorId = `${textareaId}-error`;

  return (
    <div className={`input-field ${className}`.trim()}>
      {label ? (
        <label className={`input-field__label ${labelClassName}`.trim()} htmlFor={textareaId}>
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        rows={rows}
        className={`textarea-field__control ${error ? 'textarea-field__control--error' : ''} ${controlClassName}`.trim()}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...props}
      />
      {hasError ? <span id={errorId} className="input-field__error" role="alert">{error}</span> : null}
    </div>
  );
}

export default Textarea;
