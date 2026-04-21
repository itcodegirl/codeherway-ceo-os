import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConfirmDelete } from './useConfirmDelete';

describe('useConfirmDelete', () => {
  it('supports callback + message resolver API', async () => {
    const onConfirm = vi.fn(async (payload) => payload);
    const getMessage = vi.fn((payload) => `Delete ${payload.id}?`);

    const { result } = renderHook(() => useConfirmDelete(onConfirm, getMessage));

    act(() => {
      result.current.requestConfirm({ id: 'item-1', name: 'Opportunity' });
    });

    expect(result.current.isConfirmOpen).toBe(true);
    expect(result.current.confirmMessage).toBe('Delete item-1?');
    expect(getMessage).toHaveBeenCalledWith({ id: 'item-1', name: 'Opportunity' });

    await act(async () => {
      await result.current.confirm();
    });

    expect(onConfirm).toHaveBeenCalledWith({ id: 'item-1', name: 'Opportunity' });
    expect(result.current.isConfirmOpen).toBe(false);
  });

  it('supports object-style API', async () => {
    const onConfirm = vi.fn(async (payload) => payload);

    const { result } = renderHook(() => useConfirmDelete({ onConfirm }));

    act(() => {
      result.current.requestConfirm({
        message: 'Delete manually composed message',
        payload: { id: 'manual' },
      });
    });

    expect(result.current.isConfirmOpen).toBe(true);
    expect(result.current.confirmMessage).toBe('Delete manually composed message');

    await act(async () => {
      await result.current.confirm();
    });

    expect(onConfirm).toHaveBeenCalledWith({
      message: 'Delete manually composed message',
      payload: { id: 'manual' },
    });
    expect(result.current.isConfirmOpen).toBe(false);
  });
});
