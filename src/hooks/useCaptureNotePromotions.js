import { useMemo } from 'react';
import { createReminder } from '../lib/remindersRepository';
import { createOpportunity } from '../lib/opportunitiesRepository';
import { createContentItem } from '../lib/contentRepository';
import { markCaptureNotePromoted } from '../lib/captureRepository';
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

  // Once a note is successfully promoted we stamp it with `promotedTo` so the
  // capture wall can hide the sticky from its default view. We swallow failures
  // here — the promotion itself already succeeded; missing the archive flag
  // would only mean the sticky stays in the default view, which is recoverable.
  const stampPromoted = (noteId, target) => {
    try {
      markCaptureNotePromoted(noteId, target);
    } catch {
      // ignore — see comment above
    }
  };

  const promoteToReminder = usePromotionAction({
    onShowToast: showToast,
    isRecordKnown: isNoteKnown,
    emptyTextMessage: 'Add some text to this note before promoting it.',
    successMessage: 'Added a reminder from this note. The sticky is archived here.',
    failureMessage: 'Unable to create a reminder right now.',
    run: (note) => {
      createReminder({ text: (note.text || '').trim() });
      stampPromoted(note.id, 'reminder');
    },
  });

  const promoteToOpportunity = usePromotionAction({
    onShowToast: showToast,
    isRecordKnown: isNoteKnown,
    emptyTextMessage: 'Add some text to this note before promoting it.',
    successMessage: 'Tracked as a new opportunity. Sticky archived; open Opportunities to fill in company and next step.',
    failureMessage: 'Unable to track this note as an opportunity right now.',
    run: async (note) => {
      await createOpportunity({
        name: (note.text || '').trim(),
        company: '',
        priority: 'Medium',
        stage: 'New',
        nextStep: '',
      });
      stampPromoted(note.id, 'opportunity');
    },
  });

  const promoteToContentDraft = usePromotionAction({
    onShowToast: showToast,
    isRecordKnown: isNoteKnown,
    emptyTextMessage: 'Add some text to this note before promoting it.',
    successMessage: 'Drafted on Content OS. Sticky archived; open Content to set platform and publish status.',
    failureMessage: 'Unable to draft this note as content right now.',
    run: async (note) => {
      await createContentItem({
        title: (note.text || '').trim(),
        platform: '',
        status: 'Drafting',
      });
      stampPromoted(note.id, 'content');
    },
  });

  return {
    promoteToReminder,
    promoteToOpportunity,
    promoteToContentDraft,
  };
}
