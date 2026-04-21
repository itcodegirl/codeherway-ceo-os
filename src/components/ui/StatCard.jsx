function StatCard({ label, value, change }) {
  return (
    <article className="stat-card">
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__change">{change}</p>
    </article>
  );
}

export default StatCard;
