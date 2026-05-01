import { useCallback, useEffect, useRef, useState } from 'react';
import {
  WEEKLY_BRIEF_UPDATED_EVENT,
  createWeeklyItem,
  deleteWeeklyItem,
  emitWeeklyBriefUpdated,
  getCurrentWeekStart,
  getWeeklyBriefByWeek,
  resolveWeeklySource,
  saveWeeklyBriefReviewNotes,
  updateWeeklyItem,
} from '../lib/weeklyRepository';
import {
  DEFAULT_REVIEW_NOTES,
  defaultBlockers,
  defaultPriorities,
  defaultWins,
} from '../lib/weeklyData';
import { resolveNextValue, shallowEqualRecordArrays, shallowEqualRecords } from '../lib/stateUtils';

const SILENT_REFRESH_COALESCE_MS = 400;
const WEEKLY_STORAGE_KEYS = new Set([
  'ceo-os-weekly-briefs',
  'ceo-os-weekly-priorities',
  'ceo-os-weekly-wins',
  'ceo-os-weekly-blockers',
  'ceo-os-weekly-review-notes',
]);

function normalizeCollectionPayload(payload, key) {
  const values = Array.isArray(payload?.[key]) ? payload[key] : [];
  return values.map((item) => item);
}

function normalizeArrayValue(nextValue, fallbackValue) {
  return Array.isArray(nextValue) ? nextValue : fallbackValue;
}

export function useWeeklyBrief() {
  const [weekStart, setWeekStart] = useState(() => getCurrentWeekStart());
  const weekStartRef = useRef(weekStart);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const lastSilentRefreshAtRef = useRef(0);
  const [source, setSource] = useState(resolveWeeklySource());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviewNotes, setReviewNotesState] = useState(DEFAULT_REVIEW_NOTES);
  const [priorities, setPrioritiesState] = useState(defaultPriorities);
  const [wins, setWinsState] = useState(defaultWins);
  const [blockers, setBlockersState] = useState(defaultBlockers);

  useEffect(() => {
    weekStartRef.current = weekStart;
  }, [weekStart]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const msUntilNextMinute = 60 * 1000 - (Date.now() % (60 * 1000));
    let intervalId = null;

    const checkAndUpdateWeek = () => {
      const currentWeekStart = getCurrentWeekStart();
      if (currentWeekStart !== weekStartRef.current) {
        setWeekStart(currentWeekStart);
      }
    };

    const timerId = window.setTimeout(() => {
      checkAndUpdateWeek();
      intervalId = window.setInterval(checkAndUpdateWeek, 60 * 1000);
    }, msUntilNextMinute);

    return () => {
      window.clearTimeout(timerId);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const loadWeeklyBrief = useCallback(async ({ silent = false } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!silent) {
      setIsLoading(true);
      setLoadError('');
    }

    try {
      const payload = await getWeeklyBriefByWeek(weekStart);
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      const nextSource = payload.source || resolveWeeklySource();
      const nextReviewNotes = typeof payload.reviewNotes === 'string'
        ? payload.reviewNotes
        : DEFAULT_REVIEW_NOTES;
      const nextPriorities = normalizeCollectionPayload(payload, 'priorities');
      const nextWins = normalizeCollectionPayload(payload, 'wins');
      const nextBlockers = normalizeCollectionPayload(payload, 'blockers');

      setLoadError('');
      setSource((current) => (current === nextSource ? current : nextSource));
      setReviewNotesState((current) => (current === nextReviewNotes ? current : nextReviewNotes));
      setPrioritiesState((current) => (
        shallowEqualRecordArrays(current, nextPriorities) ? current : nextPriorities
      ));
      setWinsState((current) => (
        shallowEqualRecordArrays(current, nextWins) ? current : nextWins
      ));
      setBlockersState((current) => (
        shallowEqualRecordArrays(current, nextBlockers) ? current : nextBlockers
      ));
    } catch (error) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setLoadError('Unable to load weekly brief right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to load weekly brief', error);
      }
    } finally {
      if (!silent && isMountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [weekStart]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      loadWeeklyBrief();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadWeeklyBrief]);

  useEffect(() => {
    const requestSilentRefresh = () => {
      const now = Date.now();
      if (now - lastSilentRefreshAtRef.current < SILENT_REFRESH_COALESCE_MS) {
        return;
      }

      lastSilentRefreshAtRef.current = now;
      void loadWeeklyBrief({ silent: true });
    };

    const handleWeeklyUpdate = (event) => {
      const updatedWeekStart = event?.detail?.weekStart;
      if (updatedWeekStart && updatedWeekStart !== weekStartRef.current) {
        return;
      }

      requestSilentRefresh();
    };

    const handleStorageChange = (event) => {
      if (event?.key === null || WEEKLY_STORAGE_KEYS.has(event?.key)) {
        requestSilentRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestSilentRefresh();
      }
    };

    window.addEventListener(WEEKLY_BRIEF_UPDATED_EVENT, handleWeeklyUpdate);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', requestSilentRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener(WEEKLY_BRIEF_UPDATED_EVENT, handleWeeklyUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', requestSilentRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadWeeklyBrief]);

  const recoverAfterPersistenceFailure = useCallback((message, logLabel, error) => {
    setLoadError(message);
    if (import.meta.env.DEV) {
      console.error(logLabel, error);
    }
    void loadWeeklyBrief({ silent: true });
  }, [loadWeeklyBrief]);

  const persistCollectionDiff = useCallback(async (itemType, previousItems, nextItems) => {
    const previousMap = new Map(previousItems.map((item) => [String(item.id), item]));
    const nextMap = new Map(nextItems.map((item) => [String(item.id), item]));
    let hasChanges = false;

    const deletedItemIds = [];
    previousMap.forEach((_, id) => {
      if (!nextMap.has(id)) {
        deletedItemIds.push(id);
      }
    });

    for (let index = 0; index < deletedItemIds.length; index += 1) {
      await deleteWeeklyItem({
        weekStart,
        itemType,
        itemId: deletedItemIds[index],
        emitEvent: false,
      });
      hasChanges = true;
    }

    for (let index = 0; index < nextItems.length; index += 1) {
      const nextItem = nextItems[index];
      const nextId = String(nextItem.id);
      const previousItem = previousMap.get(nextId);

      if (!previousItem) {
        await createWeeklyItem({
          weekStart,
          itemType,
          item: nextItem,
          sortOrder: index,
          emitEvent: false,
        });
        hasChanges = true;
        continue;
      }

      if (!shallowEqualRecords(previousItem, nextItem)) {
        await updateWeeklyItem({
          weekStart,
          itemType,
          itemId: nextId,
          item: nextItem,
          sortOrder: index,
          emitEvent: false,
        });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      emitWeeklyBriefUpdated({
        weekStart,
        source: resolveWeeklySource(),
        mutation: 'sync_items',
        itemType,
      });
    }
  }, [weekStart]);

  const setReviewNotes = useCallback((nextValue) => {
    setReviewNotesState((currentValue) => {
      const resolvedValue = resolveNextValue(nextValue, currentValue);
      const normalizedValue = typeof resolvedValue === 'string' ? resolvedValue : DEFAULT_REVIEW_NOTES;

      void saveWeeklyBriefReviewNotes({
        weekStart,
        reviewNotes: normalizedValue,
      }).catch((error) => {
        recoverAfterPersistenceFailure(
          'Unable to save weekly review notes right now.',
          'Failed to save weekly review notes',
          error,
        );
      });

      return normalizedValue;
    });
  }, [recoverAfterPersistenceFailure, weekStart]);

  const setPriorities = useCallback((nextValue) => {
    setPrioritiesState((currentValue) => {
      const resolvedValue = resolveNextValue(nextValue, currentValue);
      const normalizedValue = normalizeArrayValue(resolvedValue, []);

      void persistCollectionDiff('priority', currentValue, normalizedValue).catch((error) => {
        recoverAfterPersistenceFailure(
          'Unable to save weekly priorities right now.',
          'Failed to persist weekly priorities',
          error,
        );
      });

      return normalizedValue;
    });
  }, [persistCollectionDiff, recoverAfterPersistenceFailure]);

  const setWins = useCallback((nextValue) => {
    setWinsState((currentValue) => {
      const resolvedValue = resolveNextValue(nextValue, currentValue);
      const normalizedValue = normalizeArrayValue(resolvedValue, []);

      void persistCollectionDiff('win', currentValue, normalizedValue).catch((error) => {
        recoverAfterPersistenceFailure(
          'Unable to save weekly wins right now.',
          'Failed to persist weekly wins',
          error,
        );
      });

      return normalizedValue;
    });
  }, [persistCollectionDiff, recoverAfterPersistenceFailure]);

  const setBlockers = useCallback((nextValue) => {
    setBlockersState((currentValue) => {
      const resolvedValue = resolveNextValue(nextValue, currentValue);
      const normalizedValue = normalizeArrayValue(resolvedValue, []);

      void persistCollectionDiff('blocker', currentValue, normalizedValue).catch((error) => {
        recoverAfterPersistenceFailure(
          'Unable to save weekly blockers right now.',
          'Failed to persist weekly blockers',
          error,
        );
      });

      return normalizedValue;
    });
  }, [persistCollectionDiff, recoverAfterPersistenceFailure]);

  return {
    weekStart,
    source,
    isLoading,
    loadError,
    reviewNotes,
    priorities,
    wins,
    blockers,
    setReviewNotes,
    setPriorities,
    setWins,
    setBlockers,
    refreshWeeklyBrief: loadWeeklyBrief,
  };
}
