import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { aiConfig, generateChiefOfStaffResponse, getChiefActionTitle } from '../lib/openai';
import { buildCreateId } from '../lib/utils';
import { emitChiefTelemetry } from '../lib/chiefTelemetry';
import {
  createChiefSession,
  getChiefSource,
  loadChiefWorkspace,
  resetChiefWorkspace,
  saveChiefNotes,
  saveChiefOutput,
} from '../lib/chiefRepository';
import { useChiefStructuredAcceptance } from './useChiefStructuredAcceptance';

function getDefaultFeedback() {
  return aiConfig.hasProxyEndpoint
    ? 'Start by pasting notes. Then choose an action to transform them into executive-ready output.'
    : 'AI proxy is using the default endpoint. For production reliability, configure VITE_OPENAI_PROXY_URL and OPENAI_API_KEY.';
}

function resolveNotes(nextNotes) {
  return typeof nextNotes === 'string' ? nextNotes : '';
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

  const trackTelemetry = useCallback((eventName, payload = {}) => {
    emitChiefTelemetry(eventName, payload);
  }, []);

  const {
    isAcceptingAll,
    acceptStructuredItem,
    acceptAllStructured,
    isStructuredItemAccepted,
    isStructuredItemAccepting,
    hydrateAcceptedStructuredItems,
    resetAcceptanceCaches,
    resetAcceptanceState,
  } = useChiefStructuredAcceptance({
    responses,
    setFeedback,
    setLoadError,
    trackTelemetry,
    isMountedRef,
  });

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const workspace = await loadChiefWorkspace();
      if (!isMountedRef.current) {
        return;
      }

      setNotesState(workspace.notes || '');
      const workspaceResponses = Array.isArray(workspace.responses) ? workspace.responses : [];
      setResponses(workspaceResponses);
      setSource(workspace.source || getChiefSource());
      resetAcceptanceState();
      resetAcceptanceCaches();
      void hydrateAcceptedStructuredItems(workspaceResponses);
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
  }, [hydrateAcceptedStructuredItems, resetAcceptanceCaches, resetAcceptanceState]);

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
      resetAcceptanceState();
      resetAcceptanceCaches();
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setLoadError('Unable to clear workspace right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to clear chief workspace', error);
      }
    }
  }, [resetAcceptanceCaches, resetAcceptanceState]);

  const handleAction = useCallback(async (actionKey) => {
    if (!canGenerate) {
      if (!hasNotes) {
        setFeedback('Paste notes first so we can produce a relevant draft or recommendation.');
        trackTelemetry('generate_blocked_no_notes', { actionKey });
      }
      return;
    }

    setIsGenerating(true);
    setFeedback('Generating a new draft for your current notes.');
    setLoadError('');
    const correlationId = buildCreateId();
    trackTelemetry('generate_started', {
      actionKey,
      notesLength: notesText.length,
      correlationId,
    });

    try {
      const session = await createChiefSession({
        actionKey,
        notes: notesText,
      });

      const nextResponse = await generateChiefOfStaffResponse({
        actionKey,
        notes: notesText,
        correlationId,
      });

      if (!isMountedRef.current) {
        return;
      }

      if (!nextResponse.content) {
        setFeedback('No output generated. Add more context and try again.');
        trackTelemetry('generate_completed_empty', {
          actionKey,
          source: nextResponse.source || 'unknown',
          correlationId: nextResponse.correlationId || correlationId,
          requestId: nextResponse.requestId || '',
        });
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

      trackTelemetry('generate_completed', {
        actionKey,
        source: nextResponse.source || 'unknown',
        correlationId: nextResponse.correlationId || correlationId,
        requestId: nextResponse.requestId || '',
        structuredCounts: {
          priorities: Array.isArray(nextResponse.structuredPayload?.priorities)
            ? nextResponse.structuredPayload.priorities.length
            : 0,
          opportunities: Array.isArray(nextResponse.structuredPayload?.opportunities)
            ? nextResponse.structuredPayload.opportunities.length
            : 0,
          contentItems: Array.isArray(nextResponse.structuredPayload?.contentItems)
            ? nextResponse.structuredPayload.contentItems.length
            : 0,
          tasks: Array.isArray(nextResponse.structuredPayload?.tasks)
            ? nextResponse.structuredPayload.tasks.length
            : 0,
        },
      });
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setFeedback('Unable to generate output right now. Try again in a moment.');
      setLoadError('Unable to generate chief output right now.');
      if (import.meta.env.DEV) {
        console.error('Chief workflow action failed', error);
      }
      trackTelemetry('generate_failed', {
        actionKey,
        correlationId,
      });
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  }, [canGenerate, hasNotes, notesText, trackTelemetry]);

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
      acceptAllStructured,
      isAcceptingAll,
      isStructuredItemAccepted,
      isStructuredItemAccepting,
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
      acceptAllStructured,
      isAcceptingAll,
      isStructuredItemAccepted,
      isStructuredItemAccepting,
      clearWorkspace,
      loadWorkspace,
    ],
  );
}
