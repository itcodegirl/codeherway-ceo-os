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
import { resolveNextValue, shallowEqualRecords } from '../lib/stateUtils';

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

  const loadWeeklyBrief = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setLoadError('');

    try {
      const payload = await getWeeklyBriefByWeek(weekStart);
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setSource(payload.source || resolveWeeklySource());
      setReviewNotesState(typeof payload.reviewNotes === 'string' ? payload.reviewNotes : DEFAULT_REVIEW_NOTES);
      setPrioritiesState(normalizeCollectionPayload(payload, 'priorities'));
      setWinsState(normalizeCollectionPayload(payload, 'wins'));
      setBlockersState(normalizeCollectionPayload(payload, 'blockers'));
    } catch (error) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setLoadError('Unable to load weekly brief right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to load weekly brief', error);
      }
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
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
    const handleWeeklyUpdate = (event) => {
      const updatedWeekStart = event?.detail?.weekStart;
      if (updatedWeekStart && updatedWeekStart !== weekStartRef.current) {
        return;
      }

      loadWeeklyBrief();
    };

    window.addEventListener(WEEKLY_BRIEF_UPDATED_EVENT, handleWeeklyUpdate);
    return () => {
      window.removeEventListener(WEEKLY_BRIEF_UPDATED_EVENT, handleWeeklyUpdate);
    };
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
        setLoadError('Unable to save weekly review notes right now.');
        if (import.meta.env.DEV) {
          console.error('Failed to save weekly review notes', error);
        }
      });

      return normalizedValue;
    });
  }, [weekStart]);

  const setPriorities = useCallback((nextValue) => {
    setPrioritiesState((currentValue) => {
      const resolvedValue = resolveNextValue(nextValue, currentValue);
      const normalizedValue = normalizeArrayValue(resolvedValue, []);

      void persistCollectionDiff('priority', currentValue, normalizedValue).catch((error) => {
        setLoadError('Unable to save weekly priorities right now.');
        if (import.meta.env.DEV) {
          console.error('Failed to persist weekly priorities', error);
        }
      });

      return normalizedValue;
    });
  }, [persistCollectionDiff]);

  const setWins = useCallback((nextValue) => {
    setWinsState((currentValue) => {
      const resolvedValue = resolveNextValue(nextValue, currentValue);
      const normalizedValue = normalizeArrayValue(resolvedValue, []);

      void persistCollectionDiff('win', currentValue, normalizedValue).catch((error) => {
        setLoadError('Unable to save weekly wins right now.');
        if (import.meta.env.DEV) {
          console.error('Failed to persist weekly wins', error);
        }
      });

      return normalizedValue;
    });
  }, [persistCollectionDiff]);

  const setBlockers = useCallback((nextValue) => {
    setBlockersState((currentValue) => {
      const resolvedValue = resolveNextValue(nextValue, currentValue);
      const normalizedValue = normalizeArrayValue(resolvedValue, []);

      void persistCollectionDiff('blocker', currentValue, normalizedValue).catch((error) => {
        setLoadError('Unable to save weekly blockers right now.');
        if (import.meta.env.DEV) {
          console.error('Failed to persist weekly blockers', error);
        }
      });

      return normalizedValue;
    });
  }, [persistCollectionDiff]);

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
