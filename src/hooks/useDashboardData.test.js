import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/opportunitiesRepository', () => ({
  getOpportunitiesSource: () => 'local',
  listOpportunities: vi.fn(),
  OPPORTUNITIES_UPDATED_EVENT: 'ceo-os:opportunities-updated',
}));

vi.mock('../lib/contentRepository', () => ({
  getContentSource: () => 'local',
  listContentItems: vi.fn(),
  CONTENT_ITEMS_UPDATED_EVENT: 'ceo-os:content-items-updated',
}));

import { useDashboardData } from './useDashboardData';
import { listOpportunities } from '../lib/opportunitiesRepository';
import { listContentItems } from '../lib/contentRepository';

describe('useDashboardData', () => {
  it('loads opportunities and content data on mount', async () => {
    listOpportunities.mockResolvedValue([{ id: 'o-1', name: 'Opportunity A' }]);
    listContentItems.mockResolvedValue([{ id: 'c-1', title: 'Status Update' }]);
    const onLoadError = vi.fn();

    const { result } = renderHook(() => useDashboardData({ onLoadError }));

    await waitFor(() => {
      expect(result.current.isDataLoading).toBe(false);
    });

    expect(onLoadError).not.toHaveBeenCalled();
    expect(result.current.opportunityItems).toEqual([{ id: 'o-1', name: 'Opportunity A' }]);
    expect(result.current.contentRows).toEqual([{ id: 'c-1', title: 'Status Update' }]);
    expect(listOpportunities).toHaveBeenCalledTimes(1);
  });

  it('refreshes data in response to storage and domain-specific events with coalescing', async () => {
    listOpportunities.mockResolvedValue([{ id: 'o-1', name: 'Opportunity A' }]);
    listContentItems.mockResolvedValue([{ id: 'c-1', title: 'Status Update' }]);

    const addWindowListener = vi.spyOn(window, 'addEventListener');
    const addDocumentListener = vi.spyOn(document, 'addEventListener');
    const capturedWindowHandlers = {};
    const capturedDocumentHandlers = {};

    addWindowListener.mockImplementation((type, listener) => {
      capturedWindowHandlers[type] = listener;
      return undefined;
    });
    addDocumentListener.mockImplementation((type, listener) => {
      capturedDocumentHandlers[type] = listener;
      return undefined;
    });

    try {
      const { result, unmount } = renderHook(() => useDashboardData({}));

      await waitFor(() => {
        expect(result.current.isDataLoading).toBe(false);
      });

      expect(typeof capturedWindowHandlers.focus).toBe('function');
      expect(typeof capturedDocumentHandlers.visibilitychange).toBe('function');
      expect(addWindowListener).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(addWindowListener).toHaveBeenCalledWith(
        'ceo-os:opportunities-updated',
        expect.any(Function),
      );
      expect(addDocumentListener).toHaveBeenCalled();
      expect(capturedDocumentHandlers.visibilitychange).toBeDefined();

      listOpportunities.mockReset();
      listContentItems.mockReset();

      listOpportunities.mockResolvedValue([{ id: 'o-2', name: 'Opportunity B' }]);
      listContentItems.mockResolvedValue([{ id: 'c-2', title: 'Weekly Recap' }]);

      act(() => {
        capturedWindowHandlers.focus();
        capturedWindowHandlers.focus();
        capturedDocumentHandlers.visibilitychange();
      });

      await waitFor(() => {
        expect(listOpportunities).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(listContentItems).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(result.current.opportunityItems[0].id).toBe('o-2');
      });
      await waitFor(() => {
        expect(result.current.contentRows[0].id).toBe('c-2');
      });

      unmount();
    } finally {
      addWindowListener.mockRestore();
      addDocumentListener.mockRestore();
    }
  });

  it('calls onLoadError when dashboard load fails', async () => {
    const onLoadError = vi.fn();
    listOpportunities.mockRejectedValue(new Error('list failed'));
    listContentItems.mockResolvedValue([]);

    renderHook(() => useDashboardData({ onLoadError }));

    await waitFor(() => {
      expect(onLoadError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('keeps refresh listeners stable across rerenders and uses the latest onLoadError callback', async () => {
    const firstOnLoadError = vi.fn();
    const secondOnLoadError = vi.fn();
    listOpportunities.mockResolvedValue([{ id: 'o-1', name: 'Opportunity A' }]);
    listContentItems.mockResolvedValue([{ id: 'c-1', title: 'Status Update' }]);

    const addWindowListener = vi.spyOn(window, 'addEventListener');
    const addDocumentListener = vi.spyOn(document, 'addEventListener');
    const capturedWindowHandlers = {};

    addWindowListener.mockImplementation((type, listener) => {
      capturedWindowHandlers[type] = listener;
      return undefined;
    });

    try {
      const { result, rerender } = renderHook(
        ({ onLoadError }) => useDashboardData({ onLoadError }),
        {
          initialProps: { onLoadError: firstOnLoadError },
        },
      );

      await waitFor(() => {
        expect(result.current.isDataLoading).toBe(false);
      });

      const windowListenerCountBeforeRerender = addWindowListener.mock.calls.length;
      const documentListenerCountBeforeRerender = addDocumentListener.mock.calls.length;

      rerender({ onLoadError: secondOnLoadError });

      expect(addWindowListener.mock.calls.length).toBe(windowListenerCountBeforeRerender);
      expect(addDocumentListener.mock.calls.length).toBe(documentListenerCountBeforeRerender);

      listOpportunities.mockRejectedValue(new Error('refresh failed'));
      listContentItems.mockResolvedValue([]);

      act(() => {
        capturedWindowHandlers.focus();
      });

      await waitFor(() => {
        expect(secondOnLoadError).toHaveBeenCalledWith(expect.any(Error));
      });
      expect(firstOnLoadError).not.toHaveBeenCalled();
    } finally {
      addWindowListener.mockRestore();
      addDocumentListener.mockRestore();
    }
  });

  it('keeps state references stable when silent refresh data is unchanged', async () => {
    const initialOpportunities = [{ id: 'o-1', name: 'Opportunity A', stage: 'In Progress' }];
    const initialContent = [{ id: 'c-1', title: 'Status Update', status: 'Drafting' }];

    listOpportunities.mockResolvedValue(initialOpportunities);
    listContentItems.mockResolvedValue(initialContent);

    const addWindowListener = vi.spyOn(window, 'addEventListener');
    const capturedWindowHandlers = {};

    addWindowListener.mockImplementation((type, listener) => {
      capturedWindowHandlers[type] = listener;
      return undefined;
    });

    try {
      const { result } = renderHook(() => useDashboardData({}));

      await waitFor(() => {
        expect(result.current.isDataLoading).toBe(false);
      });

      const opportunitiesRef = result.current.opportunityItems;
      const contentRef = result.current.contentRows;
      const opportunityCallCountBeforeRefresh = listOpportunities.mock.calls.length;
      const contentCallCountBeforeRefresh = listContentItems.mock.calls.length;

      listOpportunities.mockResolvedValue([{ id: 'o-1', name: 'Opportunity A', stage: 'In Progress' }]);
      listContentItems.mockResolvedValue([{ id: 'c-1', title: 'Status Update', status: 'Drafting' }]);

      act(() => {
        capturedWindowHandlers.focus();
      });

      await waitFor(() => {
        expect(listOpportunities.mock.calls.length).toBeGreaterThan(opportunityCallCountBeforeRefresh);
      });
      await waitFor(() => {
        expect(listContentItems.mock.calls.length).toBeGreaterThan(contentCallCountBeforeRefresh);
      });

      expect(result.current.opportunityItems).toBe(opportunitiesRef);
      expect(result.current.contentRows).toBe(contentRef);
    } finally {
      addWindowListener.mockRestore();
    }
  });
});
