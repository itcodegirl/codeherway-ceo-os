import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets message and hides it after default duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Saved successfully');
    });

    expect(result.current.toastMessage).toBe('Saved successfully');
    expect(result.current.isToastVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.toastMessage).toBe('');
    expect(result.current.isToastVisible).toBe(false);
  });

  it('uses a custom duration when provided', () => {
    const { result } = renderHook(() => useToast(500));

    act(() => {
      result.current.showToast('Temporary notice');
    });

    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(result.current.isToastVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.isToastVisible).toBe(false);
  });

  it('clears previous timer when showing a new toast', () => {
    const { result } = renderHook(() => useToast(500));

    act(() => {
      result.current.showToast('First');
      result.current.showToast('Second');
    });

    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(result.current.toastMessage).toBe('Second');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.toastMessage).toBe('');
  });

  it('can hide toast immediately', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Now visible');
    });

    act(() => {
      result.current.hideToast();
    });

    expect(result.current.toastMessage).toBe('');
    expect(result.current.isToastVisible).toBe(false);
  });
});
