import { useCallback, useRef } from 'react';

/**
 * Shared per-record cross-page promotion guard.
 *
 * Cross-page promotion verbs (Capture → Reminder, Capture → Opportunity,
 * Reminder → Weekly Priority) all share the same control-flow needs:
 *
 *   1. Skip if the source record is missing or no longer in the current
 *      collection (e.g. deleted in another tab between render and click).
 *   2. Skip if the same record is already being promoted (rapid double-click).
 *   3. Run the async promotion, surface a calm toast on success or failure.
 *   4. Always release the in-flight slot so the user can retry after a
 *      transient failure.
 *
 * This hook encodes that flow once. Callers supply the collection lookup,
 * the async work, and the toast handler. Returns a stable callback that
 * accepts the source record.
 *
 * Usage:
 *
 *   const promote = usePromotionAction({
 *     onShowToast: showToast,
 *     getRecordId: (note) => note.id,
 *     isRecordKnown: (id) => notes.some((n) => n.id === id),
 *     run: async (note) => createReminder({ text: note.text }),
 *     successMessage: 'Added a reminder from this note.',
 *     failureMessage: 'Unable to create a reminder right now.',
 *   });
 */
export function usePromotionAction({
  onShowToast,
  getRecordId = (record) => record?.id,
  isRecordKnown = () => true,
  run,
  successMessage,
  failureMessage,
  emptyTextMessage,
  resolveText = (record) => record?.text || '',
}) {
  const inFlightIdsRef = useRef(new Set());

  return useCallback(async (record) => {
    const id = getRecordId(record);
    if (!id || !isRecordKnown(id)) {
      return false;
    }

    if (inFlightIdsRef.current.has(id)) {
      return false;
    }

    if (typeof run !== 'function') {
      return false;
    }

    if (typeof emptyTextMessage === 'string') {
      const text = String(resolveText(record) || '').trim();
      if (!text) {
        onShowToast?.(emptyTextMessage);
        return false;
      }
    }

    inFlightIdsRef.current.add(id);
    try {
      await run(record);
      if (successMessage) {
        onShowToast?.(successMessage);
      }
      return true;
    } catch {
      if (failureMessage) {
        onShowToast?.(failureMessage);
      }
      return false;
    } finally {
      inFlightIdsRef.current.delete(id);
    }
  }, [
    emptyTextMessage,
    failureMessage,
    getRecordId,
    isRecordKnown,
    onShowToast,
    resolveText,
    run,
    successMessage,
  ]);
}
