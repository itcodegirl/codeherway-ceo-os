import { useEffect, useId, useRef, useState } from 'react';
import AIResponseCard from '../components/ai/AIResponseCard';
import AIPromptBox from '../components/ai/AIPromptBox';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import '../styles/chief-of-staff.css';
import { usePersistentState } from '../hooks/usePersistentState';

const INITIAL_NOTES = '';
const INITIAL_RESPONSES = [];

const actionPrompts = {
  summarize: {
    title: 'Executive Summary',
    make: ({ notes }) =>
      `Executive Summary: ${notes
        .split('.')
        .filter(Boolean)
        .slice(0, 2)
        .join('. ')
        .concat(notes.includes('.') ? '' : '.')}`,
  },
  draft: {
    title: 'Draft Starter',
    make: ({ notes }) =>
      `Draft idea: ${notes.slice(0, 140) || 'Share context and goals, then we can draft a sharper version.'}`,
  },
  actions: {
    title: 'Action Item List',
    make: () =>
      `Action items derived from your notes:\n- Confirm next owner for each critical point\n- Assign a target date for each blocked item\n- Define the top 3 priorities for the next 72 hours`,
  },
  priorities: {
    title: 'Priority Recommendation',
    make: () =>
      `Priority recommendation: based on your current context, lead with high-urgency follow-ups, then lock a content artifact for this week, then clear one strategic blocker.`,
  },
};

function ChiefOfStaff() {
  const notesFieldId = useId();

  const [notes, setNotes] = usePersistentState('ceo-os-chief-notes', INITIAL_NOTES);
  const [responses, setResponses] = usePersistentState('ceo-os-chief-responses', INITIAL_RESPONSES);
  const [feedback, setFeedback] = useState(
    'Start by pasting notes. Then choose an action to transform them into executive-ready output.',
  );
  const generationTimerRef = useRef(null);
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

  useEffect(() => () => {
    if (generationTimerRef.current !== null) {
      clearTimeout(generationTimerRef.current);
    }
  }, []);

  const handleAction = (actionKey) => {
    if (!canGenerate) {
      if (!hasNotes) {
        setFeedback('Paste notes first so we can produce a relevant draft or recommendation.');
      }
      return;
    }

    const responseFactory = actionPrompts[actionKey];
    const item = responseFactory.make({ notes: notesText });
    const next = {
      id: `${Date.now()}-${actionKey}`,
      title: responseFactory.title,
      content: item,
    };

    setIsGenerating(true);
    setFeedback('Generating a new draft for your current notes.');

    if (generationTimerRef.current !== null) {
      clearTimeout(generationTimerRef.current);
    }

    generationTimerRef.current = window.setTimeout(() => {
      setResponses((current) => [next, ...(Array.isArray(current) ? current : [])]);
      setFeedback(`Created: ${responseFactory.title}. Review and edit before sending.`);
      setIsGenerating(false);
      generationTimerRef.current = null;
    }, 420);
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
            <label className="settings-field" htmlFor={notesFieldId}>
              <span className="settings-field__label">Paste notes and context</span>
              <textarea
                id={notesFieldId}
                className="chief-textarea"
                placeholder="Paste notes, priorities, meeting takeaways, or rough ideas..."
                rows="10"
                disabled={isGenerating}
                aria-disabled={isGenerating}
                value={notesText}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>

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
              <SectionCard title="Starter Copy">
                <p className="chief-response__text">
                  This week's momentum is strong. Core product structure is in place, and the next move is to
                  convert these notes into editable plans and content that can be shipped this week.
                </p>
              </SectionCard>
            )}
          </div>
        </SectionCard>
      </div>
    </section>
  );
}

export default ChiefOfStaff;
