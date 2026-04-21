import ChiefOutputPanel from "../components/chief/ChiefOutputPanel";
import { useChiefDemoState } from "../hooks/useChiefDemoState";
import "../styles/chief-of-staff.css";

export default function ChiefOfStaff() {
  const {
    notes,
    setNotes,
    isGenerating,
    feedback,
    result,
    handleBuildActionPlan,
    resetWorkspace,
    acceptPriority,
    acceptOpportunity,
    acceptContent,
    acceptTask,
    acceptAll,
    isPriorityAccepted,
    isPriorityAccepting,
    isOpportunityAccepted,
    isOpportunityAccepting,
    isContentAccepted,
    isContentAccepting,
    isTaskAccepted,
    isTaskAccepting
  } = useChiefDemoState();

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

            <button type="button" onClick={resetWorkspace}>
              Reset Workspace
            </button>
          </div>

          <p className="chief-helper-text">
            Paste notes, founder thoughts, meeting takeaways, or rough strategy
            ideas.
          </p>

          <textarea
            className="chief-notes-input"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="I need to follow up with XPAIRK, write a LinkedIn post, and figure out hiring strategy..."
          />

          <div className="chief-action-grid">
            <button
              type="button"
              onClick={handleBuildActionPlan}
              disabled={!notes.trim() || isGenerating}
            >
              {isGenerating ? "Building Action Plan..." : "Build Action Plan"}
            </button>
          </div>

          <p className="chief-feedback-text" role="status" aria-live="polite">
            {feedback}
          </p>
        </div>
      </div>

      <div className="chief-right-column">
        <ChiefOutputPanel
          isGenerating={isGenerating}
          result={result}
          onAcceptPriority={acceptPriority}
          onAcceptOpportunity={acceptOpportunity}
          onAcceptContent={acceptContent}
          onAcceptTask={acceptTask}
          onAcceptAll={acceptAll}
          isPriorityAccepted={isPriorityAccepted}
          isPriorityAccepting={isPriorityAccepting}
          isOpportunityAccepted={isOpportunityAccepted}
          isOpportunityAccepting={isOpportunityAccepting}
          isContentAccepted={isContentAccepted}
          isContentAccepting={isContentAccepting}
          isTaskAccepted={isTaskAccepted}
          isTaskAccepting={isTaskAccepting}
        />
      </div>
    </section>
  );
}
