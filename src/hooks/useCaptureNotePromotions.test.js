import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCaptureNotePromotions } from './useCaptureNotePromotions';

describe('useCaptureNotePromotions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exposes three stable callbacks for the three promotion verbs', () => {
    const { result } = renderHook(() => useCaptureNotePromotions({
      notes: [{ id: 'n-1', text: 'Hello', category: 'idea' }],
      showToast: vi.fn(),
    }));

    expect(typeof result.current.promoteToReminder).toBe('function');
    expect(typeof result.current.promoteToOpportunity).toBe('function');
    expect(typeof result.current.promoteToContentDraft).toBe('function');
  });

  it('promoteToReminder writes a reminder via createReminder', async () => {
    const showToast = vi.fn();
    const { result } = renderHook(() => useCaptureNotePromotions({
      notes: [{ id: 'n-1', text: 'Reach out to Maya', category: 'idea' }],
      showToast,
    }));

    let outcome;
    await act(async () => {
      outcome = await result.current.promoteToReminder({
        id: 'n-1',
        text: 'Reach out to Maya',
        category: 'idea',
      });
    });

    expect(outcome).toBe(true);
    const reminders = JSON.parse(window.localStorage.getItem('ceo-os-reminders'));
    expect(reminders).toHaveLength(1);
    expect(reminders[0].text).toBe('Reach out to Maya');
    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('Added a reminder from this note'),
    );
  });

  it('promoteToOpportunity writes an opportunity with the right defaults', async () => {
    const showToast = vi.fn();
    const { result } = renderHook(() => useCaptureNotePromotions({
      notes: [{ id: 'n-1', text: 'Acme partnership', category: 'opportunity' }],
      showToast,
    }));

    await act(async () => {
      await result.current.promoteToOpportunity({
        id: 'n-1',
        text: 'Acme partnership',
        category: 'opportunity',
      });
    });

    const opportunities = JSON.parse(window.localStorage.getItem('ceo-os-opportunities'));
    const tracked = opportunities.find((entry) => entry.name === 'Acme partnership');
    expect(tracked).toBeDefined();
    expect(tracked.priority).toBe('Medium');
    expect(tracked.stage).toBe('New');
    expect(tracked.company).toBe('');
    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('Tracked as a new opportunity'),
    );
  });

  it('promoteToContentDraft writes a content item with the right defaults', async () => {
    const showToast = vi.fn();
    const { result } = renderHook(() => useCaptureNotePromotions({
      notes: [{ id: 'n-1', text: 'Q3 launch recap', category: 'content' }],
      showToast,
    }));

    await act(async () => {
      await result.current.promoteToContentDraft({
        id: 'n-1',
        text: 'Q3 launch recap',
        category: 'content',
      });
    });

    const contentItems = JSON.parse(window.localStorage.getItem('ceo-os-content-items'));
    const drafted = contentItems.find((entry) => entry.title === 'Q3 launch recap');
    expect(drafted).toBeDefined();
    expect(drafted.status).toBe('Drafting');
    expect(drafted.platform).toBe('');
    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('Drafted on Content OS'),
    );
  });

  it('skips when the note id is no longer in the supplied notes list', async () => {
    const showToast = vi.fn();
    const { result } = renderHook(() => useCaptureNotePromotions({
      notes: [{ id: 'n-1', text: 'Still here', category: 'idea' }],
      showToast,
    }));

    let outcome;
    await act(async () => {
      outcome = await result.current.promoteToReminder({
        id: 'gone-in-another-tab',
        text: 'Stale id',
        category: 'idea',
      });
    });

    expect(outcome).toBe(false);
    expect(window.localStorage.getItem('ceo-os-reminders')).toBeNull();
    expect(showToast).not.toHaveBeenCalled();
  });
});
