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
    <SectionCard title="AI Output" iconName="chief">
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
          <article className="chief-response" aria-label="AI output empty state">
            <p className="chief-response__label">Ready to Generate</p>
            <p className="chief-response__text">
              Paste your notes in the workspace, then choose an action above to generate output.
            </p>
          </article>
        )}
      </div>
    </SectionCard>
  );
}

export default AIOutputPanel;
