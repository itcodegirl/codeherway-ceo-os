import ChiefOutputPanel from "../components/chief/ChiefOutputPanel";
import { useChiefDemoState } from "../hooks/useChiefDemoState";
import "../styles/chief-of-staff.css";

export default function ChiefOfStaff() {
  const {
    notes,
    setNotes,
    isGenerating,
    result,
    handleBuildActionPlan,
    resetWorkspace
  } = useChiefDemoState();

  const acceptHandlers = {
    onAcceptPriority: async (item) => console.log("Priority accepted:", item),
    onAcceptOpportunity: async (item) =>
      console.log("Opportunity accepted:", item),
    onAcceptContent: async (item) => console.log("Content accepted:", item),
    onAcceptTask: async (item) => console.log("Task accepted:", item),
    onAcceptAll: async () => console.log("Accept all clicked")
  };

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
        </div>
      </div>

      <div className="chief-right-column">
        <ChiefOutputPanel
          isGenerating={isGenerating}
          result={result}
          onAcceptPriority={acceptHandlers.onAcceptPriority}
          onAcceptOpportunity={acceptHandlers.onAcceptOpportunity}
          onAcceptContent={acceptHandlers.onAcceptContent}
          onAcceptTask={acceptHandlers.onAcceptTask}
          onAcceptAll={acceptHandlers.onAcceptAll}
        />
      </div>
    </section>
  );
}
