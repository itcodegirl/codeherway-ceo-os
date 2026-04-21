import { useId } from 'react';
import PageHeader from '../components/ui/PageHeader';
import AIOutputPanel from '../components/chief/AIOutputPanel';
import PromptWorkspace from '../components/chief/PromptWorkspace';
import '../styles/forms.css';
import '../styles/chief-of-staff.css';
import { useChiefOfStaff } from '../hooks/useChiefOfStaff';

function ChiefOfStaff() {
  const notesFieldId = useId();
  const {
    notes,
    responses,
    feedback,
    source,
    isLoading,
    isGenerating,
    loadError,
    hasHistory,
    canGenerate,
    setNotes,
    appendPrompt,
    handleAction,
    acceptStructuredItem,
    clearWorkspace,
  } = useChiefOfStaff();

  return (
    <section className="chief-page">
      <PageHeader
        title="Chief of Staff"
        description="Convert rough notes into executive text, action recommendations, and draft-ready material."
        actionText="Reset Workspace"
        onAction={clearWorkspace}
        actionLabel="Clear chief of staff notes and generated outputs"
      />
      <p className="helper-text">
        {source === 'supabase'
          ? 'Data source: Supabase (live persistence).'
          : 'Data source: local persistent storage in this browser.'}
      </p>
      {loadError ? <p className="helper-text" role="alert">{loadError}</p> : null}
      {isLoading ? <p className="sr-only" role="status" aria-live="polite">Loading chief workspace.</p> : null}

      <div className="chief-grid">
        <PromptWorkspace
          notesFieldId={notesFieldId}
          notes={notes}
          onNotesChange={setNotes}
          isGenerating={isGenerating}
          canGenerate={canGenerate}
          onAction={handleAction}
          onAppendPrompt={appendPrompt}
        />
        <AIOutputPanel
          isGenerating={isGenerating}
          feedback={feedback}
          hasHistory={hasHistory}
          responses={responses}
          onAcceptStructuredItem={acceptStructuredItem}
        />
      </div>
    </section>
  );
}

export default ChiefOfStaff;
