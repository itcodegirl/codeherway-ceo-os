import ChiefSummaryCard from "./ChiefSummaryCard";
import ChiefPriorityList from "./ChiefPriorityList";
import ChiefOpportunityList from "./ChiefOpportunityList";
import ChiefContentList from "./ChiefContentList";
import ChiefTaskList from "./ChiefTaskList";
import EmptyOutputState from "./EmptyOutputState";
import OutputLoadingState from "./OutputLoadingState";

export default function ChiefOutputPanel({
  isGenerating,
  result,
  onAcceptPriority,
  onAcceptOpportunity,
  onAcceptContent,
  onAcceptTask,
  onAcceptAll,
  isPriorityAccepted,
  isPriorityAccepting,
  isOpportunityAccepted,
  isOpportunityAccepting,
  isContentAccepted,
  isContentAccepting,
  isTaskAccepted,
  isTaskAccepting
}) {
  if (isGenerating) {
    return <OutputLoadingState />;
  }

  if (!result) {
    return <EmptyOutputState />;
  }

  const structured = result.structured || {};
  const priorities = structured.priorities || [];
  const opportunities = structured.opportunities || [];
  const contentItems = structured.contentItems || [];
  const tasks = structured.tasks || [];

  return (
    <section className="chief-output-panel">
      <ChiefSummaryCard
        title={result.title}
        summary={result.summary}
        onAcceptAll={onAcceptAll}
      />

      <ChiefPriorityList
        items={priorities}
        onAccept={onAcceptPriority}
        isAccepted={isPriorityAccepted}
        isAccepting={isPriorityAccepting}
      />
      <ChiefOpportunityList
        items={opportunities}
        onAccept={onAcceptOpportunity}
        isAccepted={isOpportunityAccepted}
        isAccepting={isOpportunityAccepting}
      />
      <ChiefContentList
        items={contentItems}
        onAccept={onAcceptContent}
        isAccepted={isContentAccepted}
        isAccepting={isContentAccepting}
      />
      <ChiefTaskList
        items={tasks}
        onAccept={onAcceptTask}
        isAccepted={isTaskAccepted}
        isAccepting={isTaskAccepting}
      />
    </section>
  );
}
