function MomentumChart({ values = [] }) {
  const points = Array.isArray(values) ? values : [];
  const ariaLabel = points.length
    ? `Momentum trend chart values: ${points.join(', ')}`
    : 'Momentum trend chart has no points yet';

  return (
    <div className="momentum-chart" role="img" aria-label={ariaLabel}>
      <span className="sr-only">Momentum trend chart points: {points.join(', ')}</span>
      {points.map((value, index) => {
        const height = Math.max(24, Math.min(100, value)) * 1.35;
        return (
          <div
            key={index}
            className="momentum-bar"
            style={{ '--bar-height': `${height}px` }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

export default MomentumChart;
