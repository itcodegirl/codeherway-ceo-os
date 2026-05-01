import { useCallback, useRef, useState } from 'react';
import {
  getChiefSource,
  loadChiefWorkspace,
  resetChiefWorkspace,
  saveChiefNotes,
} from '../lib/chiefRepository';
import { resolveNextValue } from '../lib/stateUtils';

function resolveNotes(nextNotes) {
  return typeof nextNotes === 'string' ? nextNotes : '';
}

function normalizeWorkspaceResponses(nextResponses) {
  if (!Array.isArray(nextResponses)) {
    return [];
  }

  return nextResponses.filter((item) => item && typeof item === 'object');
}

export function useChiefWorkspace({ isMountedRef }) {
  const [notes, setNotesState] = useState('');
  const [responses, setResponsesState] = useState([]);
  const [source, setSource] = useState(getChiefSource());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestIdRef = useRef(0);

  const beginWorkspaceRequest = useCallback(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    return requestId;
  }, []);

  const invalidatePendingWorkspaceLoad = useCallback(() => {
    const requestId = beginWorkspaceRequest();
    setIsLoading(false);
    return requestId;
  }, [beginWorkspaceRequest]);

  const loadWorkspace = useCallback(async () => {
    const requestId = beginWorkspaceRequest();
    setIsLoading(true);
    setLoadError('');

    try {
      const workspace = await loadChiefWorkspace();
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return [];
      }

      const workspaceResponses = normalizeWorkspaceResponses(workspace.responses);
      setNotesState(resolveNotes(workspace.notes));
      setResponsesState(workspaceResponses);
      setSource(workspace.source || getChiefSource());
      return workspaceResponses;
    } catch (error) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return [];
      }

      setLoadError('Unable to load chief of staff workspace right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to load chief workspace', error);
      }
      return [];
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [beginWorkspaceRequest, isMountedRef]);

  const setResponses = useCallback((nextValue) => {
    invalidatePendingWorkspaceLoad();
    setResponsesState((currentValue) => {
      const resolvedValue = resolveNextValue(nextValue, currentValue);
      return normalizeWorkspaceResponses(resolvedValue);
    });
  }, [invalidatePendingWorkspaceLoad]);

  const setNotes = useCallback((nextNotes) => {
    invalidatePendingWorkspaceLoad();
    const normalizedNotes = resolveNotes(nextNotes);
    setNotesState(normalizedNotes);
    void saveChiefNotes(normalizedNotes).catch((error) => {
      setLoadError('Unable to save notes right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to persist chief notes', error);
      }
    });
  }, [invalidatePendingWorkspaceLoad]);

  const appendPrompt = useCallback((value) => {
    const normalizedPrompt = resolveNotes(value).trim();
    if (!normalizedPrompt) {
      return;
    }

    invalidatePendingWorkspaceLoad();
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
  }, [invalidatePendingWorkspaceLoad]);

  const clearWorkspace = useCallback(async () => {
    const requestId = invalidatePendingWorkspaceLoad();

    try {
      await resetChiefWorkspace();
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return false;
      }

      setNotesState('');
      setResponsesState([]);
      setLoadError('');
      return true;
    } catch (error) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return false;
      }

      setLoadError('Unable to clear workspace right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to clear chief workspace', error);
      }
      return false;
    }
  }, [invalidatePendingWorkspaceLoad, isMountedRef]);

  return {
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
  };
}
