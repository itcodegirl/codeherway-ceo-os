export default function ChiefSummaryCard({
  title,
  summary,
  source = "proxy",
  fallbackReason = "",
  errorCode = "",
  errorMessage = "",
  onAcceptAll,
  isAcceptingAll,
  canAcceptAll = false
}) {
  const isFallback = source === "fallback";
  const sourceLabel = isFallback ? "Local fallback" : "AI generated";
  const warningText = fallbackReason
    || (isFallback ? "AI generation was unavailable. Review this local fallback before using it." : "");

  return (
    <div className="chief-card chief-summary-card">
      <div className="chief-summary-header">
        <div>
          <p className="chief-eyebrow">Executive Output</p>
          <h3>{title || "Action Plan"}</h3>
          <span className={`chief-source-badge ${isFallback ? "chief-source-badge--fallback" : ""}`.trim()}>
            {sourceLabel}
          </span>
        </div>

        <button
          type="button"
          className="chief-accept-all-btn"
          disabled={isAcceptingAll || !canAcceptAll}
          onClick={onAcceptAll}
        >
          {isAcceptingAll ? "Adding..." : "Add All to System"}
        </button>
      </div>

      {isFallback ? (
        <div className="chief-output-warning" role="status">
          <strong>{warningText}</strong>
          {errorCode || errorMessage ? (
            <small>
              {[errorCode, errorMessage].filter(Boolean).join(" - ")}
            </small>
          ) : null}
        </div>
      ) : null}

      <p className="chief-summary-text">{summary}</p>
    </div>
  );
}
