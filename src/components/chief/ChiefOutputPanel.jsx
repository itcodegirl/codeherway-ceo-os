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
  onAcceptAll
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

      <ChiefPriorityList items={priorities} onAccept={onAcceptPriority} />
      <ChiefOpportunityList
        items={opportunities}
        onAccept={onAcceptOpportunity}
      />
      <ChiefContentList items={contentItems} onAccept={onAcceptContent} />
      <ChiefTaskList items={tasks} onAccept={onAcceptTask} />
    </section>
  );
}
