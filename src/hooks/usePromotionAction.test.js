import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePromotionAction } from './usePromotionAction';

describe('usePromotionAction', () => {
  it('runs the promotion and surfaces the success message', async () => {
    const onShowToast = vi.fn();
    const run = vi.fn().mockResolvedValue();

    const { result } = renderHook(() => usePromotionAction({
      onShowToast,
      isRecordKnown: () => true,
      run,
      successMessage: 'Promoted.',
      failureMessage: 'Could not promote.',
    }));

    let outcome;
    await act(async () => {
      outcome = await result.current({ id: 'r-1', text: 'Hello' });
    });

    expect(outcome).toBe(true);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith({ id: 'r-1', text: 'Hello' });
    expect(onShowToast).toHaveBeenCalledWith('Promoted.');
  });

  it('skips when the record id is missing', async () => {
    const run = vi.fn();
    const onShowToast = vi.fn();
    const { result } = renderHook(() => usePromotionAction({
      onShowToast,
      run,
      isRecordKnown: () => true,
    }));

    await act(async () => {
      await result.current({ text: 'no id here' });
    });

    expect(run).not.toHaveBeenCalled();
    expect(onShowToast).not.toHaveBeenCalled();
  });

  it('skips when the record is no longer known to the caller', async () => {
    const run = vi.fn();
    const onShowToast = vi.fn();
    const { result } = renderHook(() => usePromotionAction({
      onShowToast,
      run,
      isRecordKnown: () => false,
      failureMessage: 'unused',
    }));

    await act(async () => {
      await result.current({ id: 'gone', text: 'deleted in another tab' });
    });

    expect(run).not.toHaveBeenCalled();
    expect(onShowToast).not.toHaveBeenCalled();
  });

  it('skips and toasts when text is empty and emptyTextMessage is supplied', async () => {
    const run = vi.fn();
    const onShowToast = vi.fn();
    const { result } = renderHook(() => usePromotionAction({
      onShowToast,
      isRecordKnown: () => true,
      run,
      emptyTextMessage: 'Add text first.',
    }));

    await act(async () => {
      await result.current({ id: 'r-1', text: '   ' });
    });

    expect(run).not.toHaveBeenCalled();
    expect(onShowToast).toHaveBeenCalledWith('Add text first.');
  });

  it('rejects rapid double-clicks on the same id while a call is in flight', async () => {
    let resolveRun;
    const run = vi.fn(() => new Promise((resolve) => {
      resolveRun = resolve;
    }));
    const onShowToast = vi.fn();

    const { result } = renderHook(() => usePromotionAction({
      onShowToast,
      isRecordKnown: () => true,
      run,
      successMessage: 'Done.',
    }));

    // Fire first call without awaiting (it stays pending until resolveRun).
    let firstPromise;
    act(() => {
      firstPromise = result.current({ id: 'r-1', text: 'one' });
    });

    // While the first call is pending, two more clicks must resolve to false
    // without entering run().
    await expect(result.current({ id: 'r-1', text: 'one' })).resolves.toBe(false);
    await expect(result.current({ id: 'r-1', text: 'one' })).resolves.toBe(false);
    expect(run).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRun();
      await firstPromise;
    });

    expect(onShowToast).toHaveBeenCalledWith('Done.');

    // After release a fresh click on the same id is allowed again.
    run.mockResolvedValueOnce();
    await act(async () => {
      await result.current({ id: 'r-1', text: 'one again' });
    });
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('surfaces the failure message and releases the in-flight slot when run throws', async () => {
    const run = vi.fn().mockRejectedValue(new Error('network'));
    const onShowToast = vi.fn();

    const { result } = renderHook(() => usePromotionAction({
      onShowToast,
      isRecordKnown: () => true,
      run,
      failureMessage: 'Try again.',
      successMessage: 'should not fire',
    }));

    let outcome;
    await act(async () => {
      outcome = await result.current({ id: 'r-1', text: 'x' });
    });

    expect(outcome).toBe(false);
    expect(onShowToast).toHaveBeenCalledWith('Try again.');
    expect(onShowToast).not.toHaveBeenCalledWith('should not fire');

    // Slot should be released so a retry succeeds.
    run.mockResolvedValueOnce();
    await act(async () => {
      outcome = await result.current({ id: 'r-1', text: 'x' });
    });
    expect(outcome).toBe(true);
  });

  it('does not call the success toast if the component unmounts mid-run', async () => {
    let resolveRun;
    const run = vi.fn(() => new Promise((resolve) => {
      resolveRun = resolve;
    }));
    const onShowToast = vi.fn();

    const { result, unmount } = renderHook(() => usePromotionAction({
      onShowToast,
      isRecordKnown: () => true,
      run,
      successMessage: 'should NOT fire after unmount',
      failureMessage: 'should NOT fire after unmount either',
    }));

    let pendingPromise;
    act(() => {
      pendingPromise = result.current({ id: 'r-1', text: 'one' });
    });

    // Simulate the parent unmounting while run() is still pending.
    unmount();

    await act(async () => {
      resolveRun();
      await pendingPromise;
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(onShowToast).not.toHaveBeenCalled();
  });

  it('does not call the failure toast if the component unmounts mid-run', async () => {
    let rejectRun;
    const run = vi.fn(() => new Promise((_, reject) => {
      rejectRun = reject;
    }));
    const onShowToast = vi.fn();

    const { result, unmount } = renderHook(() => usePromotionAction({
      onShowToast,
      isRecordKnown: () => true,
      run,
      successMessage: 'unused',
      failureMessage: 'silenced after unmount',
    }));

    let pendingPromise;
    act(() => {
      pendingPromise = result.current({ id: 'r-1', text: 'one' });
    });

    unmount();

    await act(async () => {
      rejectRun(new Error('boom'));
      await pendingPromise.catch(() => {});
    });

    expect(onShowToast).not.toHaveBeenCalled();
  });
});
