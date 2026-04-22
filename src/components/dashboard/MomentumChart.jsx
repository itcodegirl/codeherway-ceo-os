const DEFAULT_POINT_LABELS = [
  'Opportunity',
  'Content',
  'Execution',
  'Risk',
  'Pipeline',
  'Focus',
];
const AXIS_TICKS = [0, 25, 50, 75, 100];

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
    <figure className="momentum-chart-panel" role="group" aria-label={ariaLabel}>
      <figcaption className="sr-only">Momentum trend chart by category with values from 0 to 100.</figcaption>
      <div className="momentum-chart" role="list" aria-label="Momentum categories">
        <div className="momentum-axis" aria-hidden="true">
          {AXIS_TICKS.map((tick) => (
            <div key={tick} className="momentum-axis__tick">
              <span className="momentum-axis__label">{tick}</span>
            </div>
          ))}
        </div>
        <div className="momentum-points" role="presentation">
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
                title={`${label}: ${normalizedValue}`}
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
      </div>
      <table className="sr-only" aria-label="Momentum trend data table">
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {points.map((value, index) => {
            const normalizedValue = Math.max(0, Math.min(100, Number(value) || 0));
            const label = resolvePointLabel(index);

            return (
              <tr key={`row-${index}`}>
                <th scope="row">{label}</th>
                <td>{normalizedValue}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </figure>
  );
}

export default MomentumChart;
