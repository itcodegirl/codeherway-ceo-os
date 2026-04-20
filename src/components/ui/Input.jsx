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
        {...props}
      />
      {error ? <span className="input-field__error">{error}</span> : null}
    </div>
  );
}

export default Input;
