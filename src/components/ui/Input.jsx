function Input({
  id,
  label,
  error,
  type = 'text',
  className = '',
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

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
