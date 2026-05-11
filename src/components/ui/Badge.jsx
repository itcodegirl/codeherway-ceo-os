const toneClasses = {
  high: 'pill--high',
  medium: 'pill--medium',
  low: 'pill--low',
  warning: 'pill--warning',
  default: '',
};

function Badge({ label, tone = 'default', className = '', ariaLabel }) {
  // Aging / "Waiting Nd" badges and similar contextual signals benefit from
  // a screen-reader-friendly aria-label that expands the abbreviation.
  // Decorative tone badges still pass through the visible label.
  const accessibleLabel = typeof ariaLabel === 'string' && ariaLabel.length > 0 ? ariaLabel : undefined;
  return (
    <span
      className={`pill ${toneClasses[tone] || toneClasses.default} ${className}`.trim()}
      aria-label={accessibleLabel}
    >
      {label}
    </span>
  );
}

export default Badge;
