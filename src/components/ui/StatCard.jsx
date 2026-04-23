function resolveToneClass(tone) {
  if (tone === 'positive') {
    return 'stat-card--tone-positive';
  }

  if (tone === 'warning') {
    return 'stat-card--tone-warning';
  }

  return '';
}

function StatCard({
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

export default StatCard;
