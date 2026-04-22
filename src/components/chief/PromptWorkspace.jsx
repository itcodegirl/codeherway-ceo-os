import AIPromptBox from '../ai/AIPromptBox';
import Button from '../ui/Button';
import SectionCard from '../ui/SectionCard';
import Textarea from '../ui/Textarea';

function PromptWorkspace({
  notesFieldId,
  notes,
  onNotesChange,
  onAppendPrompt,
  onAction,
  isGenerating,
  canGenerate,
}) {
  return (
    <SectionCard title="Prompt Workspace">
      <div aria-busy={isGenerating}>
        <Textarea
          id={notesFieldId}
          label="Paste notes and context"
          className="form-field"
          labelClassName="form-field__label"
          controlClassName="chief-textarea"
          placeholder="Paste notes, priorities, meeting takeaways, or rough ideas..."
          rows={10}
          disabled={isGenerating}
          aria-disabled={isGenerating}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
        />

        <div className="chief-actions">
          <Button
            onClick={() => onAction('summarize')}
            disabled={!canGenerate}
            aria-label="Generate an executive summary from current notes"
            icon={{ name: 'spark', size: 14 }}
          >
            Summarize This Week
          </Button>
          <Button
            onClick={() => onAction('draft')}
            disabled={!canGenerate}
            aria-label="Generate a LinkedIn post draft from current notes"
            icon={{ name: 'content', size: 14 }}
          >
            Draft LinkedIn Post
          </Button>
          <Button
            onClick={() => onAction('actions')}
            disabled={!canGenerate}
            aria-label="Generate action items from current notes"
            icon={{ name: 'add', size: 14 }}
          >
            Convert to Action Items
          </Button>
          <Button
            onClick={() => onAction('priorities')}
            disabled={!canGenerate}
            aria-label="Generate next-priority recommendations from current notes"
            icon={{ name: 'weekly', size: 14 }}
          >
            Suggest Next Priorities
          </Button>
        </div>

        <AIPromptBox
          onSubmit={onAppendPrompt}
          placeholder="Ask for a specific rewrite, tone, or structure..."
          isDisabled={isGenerating}
        />
      </div>
    </SectionCard>
  );
}

export default PromptWorkspace;
