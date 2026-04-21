export default function ChiefSectionCard({ title, count, children }) {
  return (
    <div className="chief-card chief-section-card">
      <div className="chief-section-header">
        <h4>{title}</h4>
        <span className="chief-count-badge">{count}</span>
      </div>

      <div className="chief-section-body">{children}</div>
    </div>
  );
}
