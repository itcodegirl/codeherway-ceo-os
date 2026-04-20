function Button({
  type = 'button',
  variant = 'default',
  size = 'default',
  onClick,
  disabled = false,
  children,
  ariaLabel,
  className = '',
  ...props
}) {
  const classList = [
    'action-button',
    variant === 'ghost' ? 'action-button--ghost' : '',
    size === 'small' ? 'action-button--small' : '',
    size === 'large' ? 'action-button--large' : '',
    disabled ? 'action-button--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <button
      type={type}
      className={classList}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
