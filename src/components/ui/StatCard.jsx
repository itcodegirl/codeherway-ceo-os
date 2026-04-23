import { memo } from 'react';

function resolveToneClass(tone) {
  if (tone === 'positive') {
    return 'stat-card--tone-positive';
  }

  if (tone === 'warning') {
    return 'stat-card--tone-warning';
  }

  return '';
}

function StatCardComponent({
  label,
  value,
  change,
  tone = 'neutral',
}) {
  const toneClassName = resolveToneClass(tone);
  const className = toneClassName ? `stat-card ${toneClassName}` : 'stat-card';

  return (
    <article className={className}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__change">{change}</p>
    </article>
  );
}

const StatCard = memo(StatCardComponent);

export default StatCard;
