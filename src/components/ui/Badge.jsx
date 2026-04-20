const toneClasses = {
  high: 'pill--high',
  medium: 'pill--medium',
  low: 'pill--low',
  warning: 'pill--warning',
  default: '',
};

function Badge({ label, tone = 'default', className = '' }) {
  return (
    <span className={`pill ${toneClasses[tone] || toneClasses.default} ${className}`.trim()}>
      {label}
    </span>
  );
}

export default Badge;
