import { useId } from 'react';

function Select({
  id,
  label,
  error,
  className = '',
  labelClassName = '',
  controlClassName = '',
  children,
  ...props
}) {
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;
  const hasError = Boolean(error);
  const errorId = `${selectId}-error`;

  return (
    <div className={`input-field ${className}`.trim()}>
      {label ? (
        <label className={`input-field__label ${labelClassName}`.trim()} htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={`input-field__control ${hasError ? 'input-field__control--error' : ''} ${controlClassName}`.trim()}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...props}
      >
        {children}
      </select>
      {hasError ? <span id={errorId} className="input-field__error" role="alert">{error}</span> : null}
    </div>
  );
}

export default Select;
