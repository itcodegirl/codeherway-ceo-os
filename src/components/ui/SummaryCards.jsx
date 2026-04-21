function SummaryCards({
  className = '',
  cards = [],
  isLoading = false,
  loadingCount = 3,
  loadingKeyPrefix = 'summary',
}) {
  const normalizedCards = Array.isArray(cards) ? cards : [];

  return (
    <div className={className} aria-busy={isLoading || undefined}>
      {isLoading
        ? Array.from({ length: loadingCount }).map((_, index) => (
          <article className="summary-card" key={`${loadingKeyPrefix}-loading-${index}`}>
            <div className="skeleton-line skeleton-line--label" />
            <div className="skeleton-line skeleton-line--value" />
          </article>
        ))
        : normalizedCards.map((card) => (
          <article className="summary-card" key={card.id || card.label}>
            <p className="summary-card__label">{card.label}</p>
            <p className="summary-card__value">{card.value}</p>
            {card.description ? <p className="helper-text">{card.description}</p> : null}
          </article>
        ))}
    </div>
  );
}

export default SummaryCards;
