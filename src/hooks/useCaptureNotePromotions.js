import { useMemo } from 'react';
import { createReminder } from '../lib/remindersRepository';
import { createOpportunity } from '../lib/opportunitiesRepository';
import { createContentItem } from '../lib/contentRepository';
import { usePromotionAction } from './usePromotionAction';

/**
 * Bundles the three Capture-sticky → another-surface promotion verbs into
 * one call. Each verb shares the same isRecordKnown lookup against the
 * current notes list, the same onShowToast wiring, and the same empty-text
 * copy. Pulling them into one hook keeps the Capture page composition-only
 * and makes adding future verbs (or removing existing ones) a one-line
 * change to this hook instead of three near-identical spread blocks on the
 * page.
 *
 * Returns three stable callbacks: promoteToReminder, promoteToOpportunity,
 * promoteToContentDraft. Each returns a Promise<boolean> that resolves true
 * on success, false on skip or failure.
 */
export function useCaptureNotePromotions({ notes, showToast }) {
  const isNoteKnown = useMemo(() => (
    (id) => notes.some((entry) => entry.id === id)
  ), [notes]);

  const promoteToReminder = usePromotionAction({
    onShowToast: showToast,
    isRecordKnown: isNoteKnown,
    emptyTextMessage: 'Add some text to this note before promoting it.',
    successMessage: 'Added a reminder from this note. The sticky stays here in case you still need it.',
    failureMessage: 'Unable to create a reminder right now.',
    run: (note) => {
      createReminder({ text: (note.text || '').trim() });
    },
  });

  const promoteToOpportunity = usePromotionAction({
    onShowToast: showToast,
    isRecordKnown: isNoteKnown,
    emptyTextMessage: 'Add some text to this note before promoting it.',
    successMessage: 'Tracked as a new opportunity. Open the Opportunities page to fill in company and next step.',
    failureMessage: 'Unable to track this note as an opportunity right now.',
    run: async (note) => {
      await createOpportunity({
        name: (note.text || '').trim(),
        company: '',
        priority: 'Medium',
        stage: 'New',
        nextStep: '',
      });
    },
  });

  const promoteToContentDraft = usePromotionAction({
    onShowToast: showToast,
    isRecordKnown: isNoteKnown,
    emptyTextMessage: 'Add some text to this note before promoting it.',
    successMessage: 'Drafted on Content OS. Open the Content page to set platform and publish status.',
    failureMessage: 'Unable to draft this note as content right now.',
    run: async (note) => {
      await createContentItem({
        title: (note.text || '').trim(),
        platform: '',
        status: 'Drafting',
      });
    },
  });

  return {
    promoteToReminder,
    promoteToOpportunity,
    promoteToContentDraft,
  };
}
