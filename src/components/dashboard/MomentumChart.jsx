function MomentumChart({ values = [] }) {
  const points = values.length ? values : [12, 18, 9, 16, 14, 22];
  const ariaLabel = `Momentum trend chart values: ${points.join(', ')}`;

  return (
    <div className="momentum-chart" role="img" aria-label={ariaLabel}>
      <span className="sr-only">Momentum trend chart points: {points.join(', ')}</span>
      {points.map((value, index) => {
        const height = Math.max(24, Math.min(100, value)) * 1.35;
        return (
          <div
            key={`${value}-${index}`}
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
