import AIResponseCard from '../ai/AIResponseCard';
import SectionCard from '../ui/SectionCard';

function AIOutputPanel({
  isGenerating,
  feedback,
  hasHistory,
  responses,
  onAcceptStructuredItem,
  isStructuredItemAccepted,
  isStructuredItemAccepting,
}) {
  return (
    <SectionCard title="AI Output">
      <div aria-busy={isGenerating}>
        <p className="helper-text" role="status" aria-live="polite">
          {feedback}
        </p>

        {isGenerating ? (
          <div className="skeleton-line skeleton-line--panel" />
        ) : hasHistory ? (
          responses.map((entry) => (
            <AIResponseCard
              key={entry.id}
              title={entry.title}
              content={entry.content}
              structuredPayload={entry.structuredPayload}
              onAcceptStructuredItem={onAcceptStructuredItem}
              isStructuredItemAccepted={isStructuredItemAccepted}
              isStructuredItemAccepting={isStructuredItemAccepting}
            />
          ))
        ) : (
          <article className="chief-response" aria-label="Starter copy">
            <p className="chief-response__label">Starter Copy</p>
            <p className="chief-response__text">
              This week's momentum is strong. Core product structure is in place, and the next move is to
              convert these notes into editable plans and content that can be shipped this week.
            </p>
          </article>
        )}
      </div>
    </SectionCard>
  );
}

export default AIOutputPanel;
