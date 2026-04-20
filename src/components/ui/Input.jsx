import { useId } from 'react';

function Input({
  id,
  label,
  error,
  type = 'text',
  className = '',
  ...props
}) {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  const hasError = Boolean(error);
  const errorId = `${inputId}-error`;

  return (
    <div className={`input-field ${className}`.trim()}>
      {label ? (
        <label className="input-field__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        type={type}
        className={`input-field__control ${error ? 'input-field__control--error' : ''}`}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...props}
      />
      {hasError ? <span id={errorId} className="input-field__error" role="alert">{error}</span> : null}
    </div>
  );
}

export default Input;
