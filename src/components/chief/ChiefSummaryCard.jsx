function formatCount(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function joinWithAnd(parts) {
  if (parts.length <= 1) {
    return parts[0] || "";
  }
  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function buildAcceptanceSummary(counts = {}) {
  const destinations = [];
  if (counts.priorities > 0) {
    destinations.push(`${formatCount(counts.priorities, "priority", "priorities")} to Weekly Brief`);
  }
  if (counts.opportunities > 0) {
    destinations.push(`${formatCount(counts.opportunities, "opportunity", "opportunities")} to Opportunities`);
  }
  if (counts.contentItems > 0) {
    destinations.push(`${formatCount(counts.contentItems, "content item")} to Content OS`);
  }
  if (counts.tasks > 0) {
    destinations.push(`${formatCount(counts.tasks, "task")} to Weekly Brief`);
  }

  if (!destinations.length) {
    return "No structured items are ready to add.";
  }

  return `Add all will add ${joinWithAnd(destinations)}. Exact matches are skipped.`;
}

export default function ChiefSummaryCard({
  title,
  summary,
  source = "proxy",
  fallbackReason = "",
  errorCode = "",
  errorMessage = "",
  onAcceptAll,
  isAcceptingAll,
  canAcceptAll = false,
  structuredCounts = {}
}) {
  const isFallback = source === "fallback";
  const sourceLabel = isFallback ? "Local fallback" : "AI generated";
  const warningText = fallbackReason
    || (isFallback ? "AI generation was unavailable. Review this local fallback before using it." : "");
  const acceptanceSummary = buildAcceptanceSummary(structuredCounts);

  return (
    <div className="chief-card chief-summary-card">
      <div className="chief-summary-header">
        <div>
          <p className="chief-eyebrow">Executive Output</p>
          <h2>{title || "Action Plan"}</h2>
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

      {canAcceptAll ? (
        <div className="chief-acceptance-summary" role="note">
          <p>Review before adding. {acceptanceSummary}</p>
        </div>
      ) : null}

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
