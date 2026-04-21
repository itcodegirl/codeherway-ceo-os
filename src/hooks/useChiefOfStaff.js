import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { aiConfig, generateChiefOfStaffResponse, getChiefActionTitle } from '../lib/openai';
import { createOpportunity } from '../lib/opportunitiesRepository';
import { createContentItem } from '../lib/contentRepository';
import { createWeeklyItem, getCurrentWeekStart } from '../lib/weeklyRepository';
import { buildCreateId } from '../lib/utils';
import {
  createChiefSession,
  getChiefSource,
  loadChiefWorkspace,
  resetChiefWorkspace,
  saveChiefNotes,
  saveChiefOutput,
} from '../lib/chiefRepository';

function getDefaultFeedback() {
  return aiConfig.hasProxyEndpoint
    ? 'Start by pasting notes. Then choose an action to transform them into executive-ready output.'
    : 'AI proxy is using the default endpoint. For production reliability, configure VITE_OPENAI_PROXY_URL and OPENAI_API_KEY.';
}

function resolveNotes(nextNotes) {
  return typeof nextNotes === 'string' ? nextNotes : '';
}

function resolveStructuredText(item) {
  if (typeof item === 'string') {
    return item.trim();
  }

  if (!item || typeof item !== 'object') {
    return '';
  }

  return (
    item.title
    || item.name
    || item.text
    || item.summary
    || item.task
    || ''
  ).toString().trim();
}

export function useChiefOfStaff() {
  const [notes, setNotesState] = useState('');
  const [responses, setResponses] = useState([]);
  const [feedback, setFeedback] = useState(getDefaultFeedback);
  const [source, setSource] = useState(getChiefSource());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadError, setLoadError] = useState('');
  const isMountedRef = useRef(true);

  const hasHistory = responses.length > 0;
  const notesText = resolveNotes(notes);
  const hasNotes = notesText.trim().length > 0;
  const canGenerate = hasNotes && !isGenerating;

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const workspace = await loadChiefWorkspace();
      if (!isMountedRef.current) {
        return;
      }

      setNotesState(workspace.notes || '');
      setResponses(Array.isArray(workspace.responses) ? workspace.responses : []);
      setSource(workspace.source || getChiefSource());
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setLoadError('Unable to load chief of staff workspace right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to load chief workspace', error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      loadWorkspace();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadWorkspace]);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (!notesText || isGenerating) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFeedback('Draft pipeline ready. Continue refining as needed.');
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isGenerating, notesText]);

  const setNotes = useCallback((nextNotes) => {
    const normalizedNotes = resolveNotes(nextNotes);
    setNotesState(normalizedNotes);
    void saveChiefNotes(normalizedNotes).catch((error) => {
      setLoadError('Unable to save notes right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to persist chief notes', error);
      }
    });
  }, []);

  const appendPrompt = useCallback((value) => {
    const normalizedPrompt = resolveNotes(value).trim();
    if (!normalizedPrompt) {
      return;
    }

    setNotesState((existing) => {
      const normalizedExisting = resolveNotes(existing).trimEnd();
      const next = normalizedExisting ? `${normalizedExisting}\n\n${normalizedPrompt}` : normalizedPrompt;
      void saveChiefNotes(next).catch((error) => {
        setLoadError('Unable to save notes right now.');
        if (import.meta.env.DEV) {
          console.error('Failed to persist chief notes', error);
        }
      });
      return next;
    });
  }, []);

  const clearWorkspace = useCallback(async () => {
    try {
      await resetChiefWorkspace();
      if (!isMountedRef.current) {
        return;
      }

      setNotesState('');
      setResponses([]);
      setFeedback(getDefaultFeedback());
      setLoadError('');
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setLoadError('Unable to clear workspace right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to clear chief workspace', error);
      }
    }
  }, []);

  const handleAction = useCallback(async (actionKey) => {
    if (!canGenerate) {
      if (!hasNotes) {
        setFeedback('Paste notes first so we can produce a relevant draft or recommendation.');
      }
      return;
    }

    setIsGenerating(true);
    setFeedback('Generating a new draft for your current notes.');
    setLoadError('');

    try {
      const session = await createChiefSession({
        actionKey,
        notes: notesText,
      });

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

      const savedOutput = await saveChiefOutput({
        sessionId: session.id,
        outputType: 'response',
        title: nextResponse.title || getChiefActionTitle(actionKey),
        content: nextResponse.content,
        structuredPayload: nextResponse.structuredPayload || {},
        source: nextResponse.source || 'proxy',
      });

      if (!isMountedRef.current) {
        return;
      }

      setResponses((current) => [savedOutput, ...current]);
      if (nextResponse.source === 'proxy') {
        setFeedback(`Created: ${savedOutput.title}. Review and edit before sending.`);
      } else {
      setFeedback(`Created: ${savedOutput.title}. Using local fallback output.`);
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setFeedback('Unable to generate output right now. Try again in a moment.');
      setLoadError('Unable to generate chief output right now.');
      if (import.meta.env.DEV) {
        console.error('Chief workflow action failed', error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  }, [canGenerate, hasNotes, notesText]);

  const acceptStructuredItem = useCallback(async (section, item) => {
    const sectionKey = typeof section === 'string' ? section : '';
    const itemValue = item && typeof item === 'object' ? item : resolveStructuredText(item);

    try {
      if (sectionKey === 'opportunities') {
        const name = resolveStructuredText(itemValue);
        if (!name) {
          setFeedback('This opportunity entry is missing a name.');
          return;
        }

        await createOpportunity({
          name,
          company: itemValue.company || '',
          priority: itemValue.priority || 'Medium',
          stage: itemValue.stage || 'New',
          nextStep: itemValue.nextStep || itemValue.next_step || '',
        });
        setFeedback('Added an opportunity from the structured AI output.');
        return;
      }

      if (sectionKey === 'contentItems') {
        const title = resolveStructuredText(itemValue);
        if (!title) {
          setFeedback('This content entry is missing a title.');
          return;
        }

        await createContentItem({
          title,
          platform: itemValue.platform || itemValue.channel || '',
          status: itemValue.status || 'Drafting',
        });
        setFeedback('Added a content item from the structured AI output.');
        return;
      }

      if (sectionKey === 'priorities' || sectionKey === 'tasks') {
        const title = resolveStructuredText(itemValue);
        if (!title) {
          setFeedback('This priority entry is missing a title.');
          return;
        }

        await createWeeklyItem({
          weekStart: getCurrentWeekStart(),
          itemType: 'priority',
          item: {
            id: buildCreateId(),
            title,
            owner: itemValue.owner || 'Team Member',
            status: itemValue.status || 'Planned',
          },
        });
        setFeedback('Added a weekly priority from the structured AI output.');
      }
    } catch (error) {
      setLoadError('Unable to accept this structured AI item right now.');
      setFeedback('Unable to save this item right now. Try again.');
      if (import.meta.env.DEV) {
        console.error('Failed to accept structured AI item', error);
      }
    }
  }, []);

  return useMemo(
    () => ({
      notes: notesText,
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
      refreshWorkspace: loadWorkspace,
    }),
    [
      notesText,
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
      loadWorkspace,
    ],
  );
}
