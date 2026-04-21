import { useEffect, useId, useRef, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import AIOutputPanel from '../components/chief/AIOutputPanel';
import PromptWorkspace from '../components/chief/PromptWorkspace';
import '../styles/forms.css';
import '../styles/chief-of-staff.css';
import { usePersistentState } from '../hooks/usePersistentState';
import { aiConfig, generateChiefOfStaffResponse, getChiefActionTitle } from '../lib/openai';

const INITIAL_NOTES = '';
const INITIAL_RESPONSES = [];

function ChiefOfStaff() {
  const notesFieldId = useId();

  const [notes, setNotes] = usePersistentState('ceo-os-chief-notes', INITIAL_NOTES);
  const [responses, setResponses] = usePersistentState('ceo-os-chief-responses', INITIAL_RESPONSES);
  const [feedback, setFeedback] = useState(
    aiConfig.hasProxyEndpoint
      ? 'Start by pasting notes. Then choose an action to transform them into executive-ready output.'
      : 'AI proxy is using the default endpoint. For production reliability, configure VITE_OPENAI_PROXY_URL and OPENAI_API_KEY.',
  );
  const isMountedRef = useRef(true);
  const notesText = typeof notes === 'string' ? notes : '';
  const responseItems = Array.isArray(responses) ? responses : [];

  const hasHistory = responseItems.length > 0;
  const [isGenerating, setIsGenerating] = useState(false);
  const hasNotes = notesText.trim().length > 0;
  const canGenerate = hasNotes && !isGenerating;

  useEffect(() => {
    if (!notesText || isGenerating) return;
    const timer = window.setTimeout(() => {
      setFeedback('Draft pipeline ready. Continue refining as needed.');
    }, 2500);
    return () => clearTimeout(timer);
  }, [notesText, isGenerating]);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  const handleAction = async (actionKey) => {
    if (!canGenerate) {
      if (!hasNotes) {
        setFeedback('Paste notes first so we can produce a relevant draft or recommendation.');
      }
      return;
    }

    setIsGenerating(true);
    setFeedback('Generating a new draft for your current notes.');

    try {
      const nextResponse = await generateChiefOfStaffResponse({
        actionKey,
        notes: notesText,
      });

      if (!isMountedRef.current) {
        return;
      }

      if (!nextResponse.content) {
        setFeedback('No output generated. Add more context and try again.');
        return;
      }

      const next = {
        id: `${Date.now()}-${actionKey}`,
        title: nextResponse.title || getChiefActionTitle(actionKey),
        content: nextResponse.content,
      };

      setResponses((current) => [next, ...(Array.isArray(current) ? current : [])]);

      if (nextResponse.source === 'proxy') {
        setFeedback(`Created: ${next.title}. Review and edit before sending.`);
      } else {
        setFeedback(`Created: ${next.title}. Using local fallback output.`);
      }
    } catch (error) {
      setFeedback('Unable to generate output right now. Try again in a moment.');
      if (import.meta.env.DEV) {
        console.error('Chief of Staff generation failed', error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  };

  return (
    <section className="chief-page">
      <PageHeader
        title="Chief of Staff"
        description="Convert rough notes into executive text, action recommendations, and draft-ready material."
      />

      <div className="chief-grid">
        <PromptWorkspace
          notesFieldId={notesFieldId}
          notes={notesText}
          onNotesChange={setNotes}
          isGenerating={isGenerating}
          canGenerate={canGenerate}
          onAction={handleAction}
          onAppendPrompt={(value) =>
            setNotes((existing) => {
              const normalizedExisting = typeof existing === 'string' ? existing.trimEnd() : '';
              return normalizedExisting ? `${normalizedExisting}\n\n${value}` : value;
            })
          }
        />
        <AIOutputPanel
          isGenerating={isGenerating}
          feedback={feedback}
          hasHistory={hasHistory}
          responses={responseItems}
        />
      </div>
    </section>
  );
}

export default ChiefOfStaff;
