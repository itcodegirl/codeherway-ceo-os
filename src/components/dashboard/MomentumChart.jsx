function MomentumChart({ values = [] }) {
  const points = values.length ? values : [12, 18, 9, 16, 14, 22];

  return (
    <div className="momentum-chart">
      {points.map((value, index) => {
        const height = Math.max(24, Math.min(100, value)) * 1.35;
        return (
          <div
            key={`${value}-${index}`}
            className="momentum-bar"
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}

export default MomentumChart;
