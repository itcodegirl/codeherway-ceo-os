export default function ChiefSectionCard({ title, count, children }) {
  return (
    <div className="chief-card chief-section-card">
      <div className="chief-section-header">
        <h3>{title}</h3>
        <span className="chief-count-badge">{count}</span>
      </div>

      <div className="chief-section-body">{children}</div>
    </div>
  );
}
