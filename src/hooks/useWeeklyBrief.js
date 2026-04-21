import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  WEEKLY_BRIEF_UPDATED_EVENT,
  createWeeklyItem,
  deleteWeeklyItem,
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

function resolveNextValue(nextValue, currentValue) {
  return typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;
}

function normalizeArrayValue(nextValue, fallbackValue) {
  return Array.isArray(nextValue) ? nextValue : fallbackValue;
}

function shallowEqualRecords(left, right) {
  if (Object.is(left, right)) {
    return true;
  }

  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (let index = 0; index < leftKeys.length; index += 1) {
    const key = leftKeys[index];
    if (!Object.prototype.hasOwnProperty.call(right, key)) {
      return false;
    }

    if (!Object.is(left[key], right[key])) {
      return false;
    }
  }

  return true;
}

export function useWeeklyBrief() {
  const weekStart = useMemo(() => getCurrentWeekStart(), []);
  const [source, setSource] = useState(resolveWeeklySource());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviewNotes, setReviewNotesState] = useState(DEFAULT_REVIEW_NOTES);
  const [priorities, setPrioritiesState] = useState(defaultPriorities);
  const [wins, setWinsState] = useState(defaultWins);
  const [blockers, setBlockersState] = useState(defaultBlockers);

  const loadWeeklyBrief = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const payload = await getWeeklyBriefByWeek(weekStart);
      setSource(payload.source || resolveWeeklySource());
      setReviewNotesState(typeof payload.reviewNotes === 'string' ? payload.reviewNotes : DEFAULT_REVIEW_NOTES);
      setPrioritiesState(Array.isArray(payload.priorities) ? payload.priorities : []);
      setWinsState(Array.isArray(payload.wins) ? payload.wins : []);
      setBlockersState(Array.isArray(payload.blockers) ? payload.blockers : []);
    } catch (error) {
      setLoadError('Unable to load weekly brief right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to load weekly brief', error);
      }
    } finally {
      setIsLoading(false);
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
      if (updatedWeekStart && updatedWeekStart !== weekStart) {
        return;
      }

      loadWeeklyBrief();
    };

    window.addEventListener(WEEKLY_BRIEF_UPDATED_EVENT, handleWeeklyUpdate);
    return () => {
      window.removeEventListener(WEEKLY_BRIEF_UPDATED_EVENT, handleWeeklyUpdate);
    };
  }, [loadWeeklyBrief, weekStart]);

  const persistCollectionDiff = useCallback(async (itemType, previousItems, nextItems) => {
    const previousMap = new Map(previousItems.map((item) => [String(item.id), item]));
    const nextMap = new Map(nextItems.map((item) => [String(item.id), item]));

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
      });
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
        });
        continue;
      }

      if (!shallowEqualRecords(previousItem, nextItem)) {
        await updateWeeklyItem({
          weekStart,
          itemType,
          itemId: nextId,
          item: nextItem,
          sortOrder: index,
        });
      }
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
