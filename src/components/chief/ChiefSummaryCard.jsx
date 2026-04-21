export default function ChiefSummaryCard({ title, summary, onAcceptAll }) {
  return (
    <div className="chief-card chief-summary-card">
      <div className="chief-summary-header">
        <div>
          <p className="chief-eyebrow">Executive Output</p>
          <h3>{title || "Action Plan"}</h3>
        </div>

        <button
          type="button"
          className="chief-accept-all-btn"
          onClick={onAcceptAll}
        >
          Add All to System
        </button>
      </div>

      <p className="chief-summary-text">{summary}</p>
    </div>
  );
}
