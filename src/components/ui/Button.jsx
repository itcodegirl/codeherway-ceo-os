import Icon from './Icon';

function Button({
  type = 'button',
  variant = 'default',
  size = 'default',
  onClick,
  disabled = false,
  loading = false,
  children,
  ariaLabel,
  className = '',
  icon = null,
  ...props
}) {
  const isLoading = Boolean(loading);
  const isDisabled = Boolean(disabled) || isLoading;
  const classList = [
    'action-button',
    variant === 'ghost' ? 'action-button--ghost' : '',
    size === 'small' ? 'action-button--small' : '',
    size === 'large' ? 'action-button--large' : '',
    isDisabled ? 'action-button--disabled' : '',
    isLoading ? 'action-button--loading' : '',
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
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
      data-loading={isLoading ? 'true' : undefined}
      {...props}
    >
      {isLoading ? (
        <span className="action-button__spinner" aria-hidden="true" />
      ) : null}
      {children}
      {icon && !isLoading ? (
        <Icon name={icon.name || 'spark'} size={icon.size || 14} className="action-button__icon" />
      ) : null}
    </button>
  );
}

export default Button;
