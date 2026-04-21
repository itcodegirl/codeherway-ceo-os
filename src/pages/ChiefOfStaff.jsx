import { useEffect, useId, useRef, useState } from 'react';
import AIResponseCard from '../components/ai/AIResponseCard';
import AIPromptBox from '../components/ai/AIPromptBox';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
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
      : 'AI proxy not configured. Actions will run in local fallback mode.',
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
        <SectionCard title="Prompt Workspace">
          <div aria-busy={isGenerating}>
            <Textarea
              id={notesFieldId}
              label="Paste notes and context"
              className="settings-field"
              labelClassName="settings-field__label"
              controlClassName="chief-textarea"
              placeholder="Paste notes, priorities, meeting takeaways, or rough ideas..."
              rows={10}
              disabled={isGenerating}
              aria-disabled={isGenerating}
              value={notesText}
              onChange={(event) => setNotes(event.target.value)}
            />

            <div className="chief-actions">
              <Button
                onClick={() => handleAction('summarize')}
                disabled={!canGenerate}
                aria-label="Generate an executive summary from current notes"
                icon={{ name: 'action', size: 14 }}
              >
                Summarize This Week
              </Button>
              <Button
                onClick={() => handleAction('draft')}
                disabled={!canGenerate}
                aria-label="Generate a LinkedIn post draft from current notes"
                icon={{ name: 'action', size: 14 }}
              >
                Draft LinkedIn Post
              </Button>
              <Button
                onClick={() => handleAction('actions')}
                disabled={!canGenerate}
                aria-label="Generate action items from current notes"
                icon={{ name: 'action', size: 14 }}
              >
                Convert to Action Items
              </Button>
              <Button
                onClick={() => handleAction('priorities')}
                disabled={!canGenerate}
                aria-label="Generate next-priority recommendations from current notes"
                icon={{ name: 'action', size: 14 }}
              >
                Suggest Next Priorities
              </Button>
            </div>

            <AIPromptBox
              onSubmit={(value) =>
                setNotes((existing) => {
                  const normalizedExisting = typeof existing === 'string' ? existing.trimEnd() : '';
                  return normalizedExisting ? `${normalizedExisting}\n\n${value}` : value;
                })
              }
              placeholder="Ask for a specific rewrite, tone, or structure..."
              isDisabled={isGenerating}
            />
          </div>
        </SectionCard>

        <SectionCard title="AI Output">
          <div aria-busy={isGenerating}>
            <p className="helper-text" role="status" aria-live="polite">
              {feedback}
            </p>

            {isGenerating ? (
              <div className="skeleton-line skeleton-line--panel" />
            ) : hasHistory ? (
              responseItems.map((entry) => (
                <AIResponseCard key={entry.id} title={entry.title} content={entry.content} />
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
      </div>
    </section>
  );
}

export default ChiefOfStaff;
