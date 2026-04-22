import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCrudPage } from './useCrudPage';

function createSubmitEvent() {
  return {
    preventDefault: vi.fn(),
  };
}

describe('useCrudPage', () => {
  it('loads items and handles create, update, and delete lifecycle', async () => {
    const listItems = vi.fn(() => Promise.resolve([{ id: '1', name: 'Opportunity A' }]));
    const createItem = vi.fn((payload) => Promise.resolve({ id: '2', ...payload }));
    const updateItem = vi.fn((id, payload) => Promise.resolve({ id, ...payload }));
    const deleteItem = vi.fn((id) => Promise.resolve({ id }));

    const { result } = renderHook(() => useCrudPage({
      listFn: listItems,
      createFn: createItem,
      updateFn: updateItem,
      deleteFn: deleteItem,
      defaultFormValues: { name: '', status: '' },
      mapItemToFormValues: (item) => ({ name: item.name, status: item.status || '' }),
      mapFormValuesToPayload: (values) => values,
      validatePayload: () => '',
      getDeleteLabel: (item) => item.name,
      messages: {
        load: 'Unable to load.',
        save: 'Unable to save.',
        delete: 'Unable to delete.',
      },
      logPrefix: 'unit test',
    }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.items).toEqual([{ id: '1', name: 'Opportunity A' }]);

    act(() => {
      result.current.handleOpenCreateModal();
      result.current.handleFormChange('name', 'Opportunity B');
      result.current.handleFormChange('status', 'Draft');
    });

    await act(async () => {
      await result.current.handleFormSubmit(createSubmitEvent());
    });

    expect(createItem).toHaveBeenCalledWith({ name: 'Opportunity B', status: 'Draft' });
    expect(result.current.items).toEqual([
      { id: '2', name: 'Opportunity B', status: 'Draft' },
      { id: '1', name: 'Opportunity A' },
    ]);

    act(() => {
      result.current.setSelectedItem({ id: '2', name: 'Opportunity B', status: 'Draft' });
    });

    await waitFor(() => {
      expect(result.current.selectedItem?.id).toBe('2');
    });

    act(() => {
      result.current.handleOpenEditModal();
    });

    act(() => {
      result.current.handleFormChange('status', 'Active');
    });

    await act(async () => {
      await result.current.handleFormSubmit(createSubmitEvent());
    });

    expect(updateItem).toHaveBeenCalledWith('2', { name: 'Opportunity B', status: 'Active' });
    expect(result.current.items.find((item) => item.id === '2')).toEqual({ id: '2', name: 'Opportunity B', status: 'Active' });

    act(() => {
      result.current.handleOpenDeleteConfirm();
    });

    await act(async () => {
      await result.current.handleConfirmDeleteSelected();
    });

    expect(deleteItem).toHaveBeenCalledWith('2');
    expect(result.current.items.find((item) => item.id === '2')).toBeUndefined();
    expect(result.current.selectedItem).toBeNull();
  });

  it('surfaces load errors', async () => {
    const listItems = vi.fn(() => Promise.reject(new Error('load failed')));

    const { result } = renderHook(() => useCrudPage({
      listFn: listItems,
      createFn: () => Promise.resolve({ id: '1' }),
      updateFn: () => Promise.resolve({ id: '1' }),
      deleteFn: () => Promise.resolve({ id: '1' }),
      defaultFormValues: {},
      mapFormValuesToPayload: (values) => values,
      validatePayload: () => '',
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.loadError).toBe('Unable to load items right now.');
    expect(result.current.items).toEqual([]);
  });

  it('handles missing list function as a recoverable load error', async () => {
    const { result } = renderHook(() => useCrudPage({
      createFn: () => Promise.resolve({ id: '1' }),
      updateFn: () => Promise.resolve({ id: '1' }),
      deleteFn: () => Promise.resolve({ id: '1' }),
      defaultFormValues: {},
      mapFormValuesToPayload: (values) => values,
      validatePayload: () => '',
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.loadError).toBe('Unable to load items right now.');
    expect(result.current.items).toEqual([]);
  });

  it('surfaces save errors when create returns malformed data', async () => {
    const listItems = vi.fn(() => Promise.resolve([]));
    const createItem = vi.fn(() => Promise.resolve({ name: 'Missing Id' }));
    const updateItem = vi.fn(() => Promise.resolve({ id: '1', name: 'Valid' }));
    const deleteItem = vi.fn(() => Promise.resolve({ id: '1' }));

    const { result } = renderHook(() => useCrudPage({
      listFn: listItems,
      createFn: createItem,
      updateFn: updateItem,
      deleteFn: deleteItem,
      defaultFormValues: { name: '' },
      mapFormValuesToPayload: (values) => values,
      validatePayload: () => '',
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handleOpenCreateModal();
      result.current.handleFormChange('name', 'Draft item');
    });

    await act(async () => {
      await result.current.handleFormSubmit(createSubmitEvent());
    });

    expect(result.current.formError).toBe('Unable to save item right now.');
    expect(result.current.items).toEqual([]);
  });
});
