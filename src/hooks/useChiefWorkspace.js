import { useCallback, useState } from 'react';
import {
  getChiefSource,
  loadChiefWorkspace,
  resetChiefWorkspace,
  saveChiefNotes,
} from '../lib/chiefRepository';

function resolveNotes(nextNotes) {
  return typeof nextNotes === 'string' ? nextNotes : '';
}

export function useChiefWorkspace({ isMountedRef }) {
  const [notes, setNotesState] = useState('');
  const [responses, setResponses] = useState([]);
  const [source, setSource] = useState(getChiefSource());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const workspace = await loadChiefWorkspace();
      if (!isMountedRef.current) {
        return [];
      }

      const workspaceResponses = Array.isArray(workspace.responses) ? workspace.responses : [];
      setNotesState(workspace.notes || '');
      setResponses(workspaceResponses);
      setSource(workspace.source || getChiefSource());
      return workspaceResponses;
    } catch (error) {
      if (!isMountedRef.current) {
        return [];
      }

      setLoadError('Unable to load chief of staff workspace right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to load chief workspace', error);
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isMountedRef]);

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
        return false;
      }

      setNotesState('');
      setResponses([]);
      setLoadError('');
      return true;
    } catch (error) {
      if (!isMountedRef.current) {
        return false;
      }

      setLoadError('Unable to clear workspace right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to clear chief workspace', error);
      }
      return false;
    }
  }, [isMountedRef]);

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
