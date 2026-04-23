import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { aiConfig } from '../lib/openai';
import { emitChiefTelemetry } from '../lib/chiefTelemetry';
import { useChiefGeneration } from './useChiefGeneration';
import { useChiefStructuredAcceptance } from './useChiefStructuredAcceptance';
import { useChiefWorkspace } from './useChiefWorkspace';

function getDefaultFeedback() {
  return aiConfig.hasProxyEndpoint
    ? 'Start by pasting notes. Then choose an action to transform them into executive-ready output.'
    : 'AI proxy is using the default endpoint. For production reliability, configure VITE_OPENAI_PROXY_URL and OPENAI_API_KEY.';
}

function resolveNotes(nextNotes) {
  return typeof nextNotes === 'string' ? nextNotes : '';
}

export function useChiefOfStaff() {
  const [feedback, setFeedback] = useState(getDefaultFeedback);
  const isMountedRef = useRef(true);

  const {
    notes,
    responses,
    source,
    isLoading,
    loadError,
    setResponses,
    setLoadError,
    setNotes,
    appendPrompt,
    loadWorkspace,
    clearWorkspace,
  } = useChiefWorkspace({ isMountedRef });

  const hasHistory = responses.length > 0;
  const notesText = resolveNotes(notes);
  const hasNotes = notesText.trim().length > 0;

  const trackTelemetry = useCallback((eventName, payload = {}) => {
    emitChiefTelemetry(eventName, payload);
  }, []);

  const {
    isGenerating,
    handleAction,
  } = useChiefGeneration({
    isMountedRef,
    canGenerate: hasNotes,
    hasNotes,
    notesText,
    setFeedback,
    setLoadError,
    setResponses,
    trackTelemetry,
  });

  const canGenerate = hasNotes && !isGenerating;

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

  const refreshWorkspace = useCallback(async () => {
    const workspaceResponses = await loadWorkspace();
    if (!isMountedRef.current) {
      return;
    }

    resetAcceptanceState();
    resetAcceptanceCaches();
    void hydrateAcceptedStructuredItems(workspaceResponses);
  }, [hydrateAcceptedStructuredItems, loadWorkspace, resetAcceptanceCaches, resetAcceptanceState]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void refreshWorkspace();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [refreshWorkspace]);

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

  const handleClearWorkspace = useCallback(async () => {
    const didClear = await clearWorkspace();
    if (!didClear || !isMountedRef.current) {
      return;
    }

    setFeedback(getDefaultFeedback());
    resetAcceptanceState();
    resetAcceptanceCaches();
  }, [clearWorkspace, resetAcceptanceCaches, resetAcceptanceState]);

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
      clearWorkspace: handleClearWorkspace,
      refreshWorkspace,
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
      handleClearWorkspace,
      refreshWorkspace,
    ],
  );
}
