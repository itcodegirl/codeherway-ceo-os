import Icon from './Icon';

function Button({
  type = 'button',
  variant = 'default',
  size = 'default',
  onClick,
  disabled = false,
  children,
  ariaLabel,
  className = '',
  icon = null,
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
      {icon ? <Icon name={icon.name || 'action'} size={icon.size || 14} className="action-button__icon" /> : null}
    </button>
  );
}

export default Button;
