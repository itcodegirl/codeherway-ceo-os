import { useCallback, useEffect, useMemo, useState } from 'react';
import { aiConfig } from '../lib/openai';
import { emitChiefTelemetry } from '../lib/chiefTelemetry';
import { useChiefGeneration } from './useChiefGeneration';
import { useChiefStructuredAcceptance } from './useChiefStructuredAcceptance';
import { useChiefWorkspace } from './useChiefWorkspace';
import { useIsMountedRef } from './useIsMountedRef';

function getDefaultFeedback() {
  // Don't surface env-var names in user-facing feedback. The proxy-config
  // hint stays in README / Settings; here we only need a calm starting
  // message regardless of deployment state.
  return aiConfig.hasProxyEndpoint
    ? 'Paste your notes, then choose an action to turn them into executive-ready output.'
    : 'Running in local mode — actions return a deterministic local template instead of AI output. The review-and-save workflow still works.';
}

function resolveNotes(nextNotes) {
  return typeof nextNotes === 'string' ? nextNotes : '';
}

export function useChiefOfStaff() {
  const [feedback, setFeedback] = useState(getDefaultFeedback);
  const isMountedRef = useIsMountedRef();

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

  // Run after each successful generation: clear cached signature sets so we
  // re-read the current opportunities/content/priorities, then hydrate the
  // acceptance map against the freshly prepended response. Without this
  // step, regenerating notes that include already-accepted items would
  // surface those items as un-accepted again.
  const handleResponseSaved = useCallback(async (nextResponses) => {
    resetAcceptanceCaches();
    await hydrateAcceptedStructuredItems(nextResponses);
  }, [hydrateAcceptedStructuredItems, resetAcceptanceCaches]);

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
    onAfterResponseSaved: handleResponseSaved,
  });

  const canGenerate = hasNotes && !isGenerating;

  const refreshWorkspace = useCallback(async () => {
    const workspaceResponses = await loadWorkspace();
    if (!isMountedRef.current) {
      return;
    }

    resetAcceptanceState();
    resetAcceptanceCaches();
    // Hydration is fire-and-forget; .catch keeps an unexpected throw from
    // becoming an unhandled rejection.
    hydrateAcceptedStructuredItems(workspaceResponses).catch(() => {});
  }, [hydrateAcceptedStructuredItems, isMountedRef, loadWorkspace, resetAcceptanceCaches, resetAcceptanceState]);

  useEffect(() => {
    refreshWorkspace().catch(() => {});
  }, [refreshWorkspace]);

  useEffect(() => {
    if (!notesText || isGenerating) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      // Quietly confirm the autosave without clobbering a generation result
      // or error message that the user still needs to read.
      setFeedback((current) => {
        if (typeof current === 'string' && /^(Created:|AI unavailable|Unable to)/.test(current)) {
          return current;
        }
        return 'Notes saved. Pick an action when you are ready.';
      });
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
  }, [clearWorkspace, isMountedRef, resetAcceptanceCaches, resetAcceptanceState]);

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
