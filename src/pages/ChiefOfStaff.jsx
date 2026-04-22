import ChiefOutputPanel from "../components/chief/ChiefOutputPanel";
import ChiefTelemetryDiagnostics from "../components/chief/ChiefTelemetryDiagnostics";
import Button from "../components/ui/Button";
import { useChiefOfStaff } from "../hooks/useChiefOfStaff";
import { useChiefTelemetryHealth } from "../hooks/useChiefTelemetryHealth";
import { normalizeChiefOutput } from "../lib/normalizeChiefOutput";
import "../styles/chief-of-staff.css";

function parseStructuredText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function toPanelResult(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const parsedContent = parseStructuredText(entry.content);

  return normalizeChiefOutput({
    title: parsedContent?.title || entry.title || "Executive Action Plan",
    summary: parsedContent?.summary || entry.content || "",
    source: entry.source || "proxy",
    structured: entry.structuredPayload || parsedContent?.structured || {}
  });
}

export default function ChiefOfStaff() {
  const {
    notes,
    setNotes,
    responses,
    feedback,
    loadError,
    isGenerating,
    isAcceptingAll,
    handleAction,
    acceptStructuredItem,
    acceptAllStructured,
    isStructuredItemAccepted,
    isStructuredItemAccepting,
    clearWorkspace
  } = useChiefOfStaff();

  const {
    source: telemetrySource,
    recentCount: telemetryRecentCount,
    lastEventTimestamp: telemetryLastEventTimestamp,
    lastRequestId: telemetryLastRequestId,
    lastCorrelationId: telemetryLastCorrelationId,
    recentEvents: telemetryRecentEvents,
    outcomeCounters: telemetryOutcomeCounters,
    isLoading: isTelemetryLoading,
    error: telemetryError
  } = useChiefTelemetryHealth();

  const latestResponse = Array.isArray(responses) && responses.length ? responses[0] : null;
  const result = toPanelResult(latestResponse);

  const feedbackMessage = loadError || feedback;

  return (
    <section className="chief-page-grid">
      <h1 className="sr-only">Chief of Staff</h1>
      <div className="chief-left-column">
        <div className="chief-card chief-input-card">
          <div className="chief-input-header">
            <div>
              <p className="chief-eyebrow">Prompt Workspace</p>
              <h3>Turn founder notes into action</h3>
            </div>

            <Button type="button" variant="ghost" size="small" onClick={clearWorkspace} disabled={isGenerating}>
              Reset Workspace
            </Button>
          </div>

          <p className="chief-helper-text">
            Paste notes, founder thoughts, meeting takeaways, or rough strategy
            ideas.
          </p>

          <textarea
            className="chief-notes-input"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Paste founder notes, meeting takeaways, risks, priorities, or rough ideas here..."
            disabled={isGenerating}
            aria-disabled={isGenerating}
          />

          <div
            className={`chief-action-grid ${isGenerating ? "chief-action-grid--disabled" : ""}`.trim()}
            aria-busy={isGenerating}
          >
            <Button
              type="button"
              onClick={() => handleAction("plan")}
              disabled={!notes.trim() || isGenerating}
              icon={{ name: "weekly", size: 14 }}
            >
              {isGenerating ? "Building Action Plan..." : "Build Action Plan"}
            </Button>
          </div>

          <p className="chief-feedback-text" role="status" aria-live="polite">
            {isGenerating ? "Generating recommendations from your notes..." : feedbackMessage}
          </p>

          <ChiefTelemetryDiagnostics
            source={telemetrySource}
            recentCount={telemetryRecentCount}
            lastEventTimestamp={telemetryLastEventTimestamp}
            lastRequestId={telemetryLastRequestId}
            lastCorrelationId={telemetryLastCorrelationId}
            recentEvents={telemetryRecentEvents}
            outcomeCounters={telemetryOutcomeCounters}
            isLoading={isTelemetryLoading}
            error={telemetryError}
          />
        </div>
      </div>

      <div className="chief-right-column">
        <ChiefOutputPanel
          isGenerating={isGenerating}
          result={result}
          onAcceptPriority={(item) => acceptStructuredItem("priorities", item)}
          onAcceptOpportunity={(item) =>
            acceptStructuredItem("opportunities", item)
          }
          onAcceptContent={(item) => acceptStructuredItem("contentItems", item)}
          onAcceptTask={(item) => acceptStructuredItem("tasks", item)}
          onAcceptAll={() => acceptAllStructured(result?.structured)}
          isAcceptingAll={isAcceptingAll}
          isPriorityAccepted={(item) =>
            isStructuredItemAccepted("priorities", item)
          }
          isPriorityAccepting={(item) =>
            isStructuredItemAccepting("priorities", item)
          }
          isOpportunityAccepted={(item) =>
            isStructuredItemAccepted("opportunities", item)
          }
          isOpportunityAccepting={(item) =>
            isStructuredItemAccepting("opportunities", item)
          }
          isContentAccepted={(item) =>
            isStructuredItemAccepted("contentItems", item)
          }
          isContentAccepting={(item) =>
            isStructuredItemAccepting("contentItems", item)
          }
          isTaskAccepted={(item) => isStructuredItemAccepted("tasks", item)}
          isTaskAccepting={(item) => isStructuredItemAccepting("tasks", item)}
        />
      </div>
    </section>
  );
}
