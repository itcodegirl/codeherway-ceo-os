const DEFAULT_POINT_LABELS = [
  'Opportunity',
  'Content',
  'Execution',
  'Risk',
  'Pipeline',
  'Focus',
];

function resolvePointLabel(index) {
  return DEFAULT_POINT_LABELS[index] || `Metric ${index + 1}`;
}

function MomentumChart({ values = [] }) {
  const points = Array.isArray(values) ? values : [];
  const ariaLabel = points.length
    ? `Momentum trend chart values by metric: ${points.join(', ')}`
    : 'Momentum trend chart has no points yet';

  if (!points.length) {
    return (
      <p className="helper-text momentum-chart__empty" role="status" aria-live="polite">
        No momentum data points yet.
      </p>
    );
  }

  return (
    <div className="momentum-chart" role="list" aria-label={ariaLabel}>
      <span className="sr-only">Momentum trend chart points with labels and values.</span>
      {points.map((value, index) => {
        const normalizedValue = Math.max(0, Math.min(100, Number(value) || 0));
        const label = resolvePointLabel(index);
        const height = Math.max(24, normalizedValue) * 1.35;
        return (
          <div
            key={index}
            className="momentum-point"
            role="listitem"
            aria-label={`${label}: ${normalizedValue}`}
          >
            <span className="momentum-point__value">{normalizedValue}</span>
            <div
              className="momentum-bar"
              style={{ '--bar-height': `${height}px` }}
              aria-hidden="true"
            />
            <span className="momentum-point__label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default MomentumChart;
