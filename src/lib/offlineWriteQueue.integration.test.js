import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearOfflineQueue,
  drainOfflineQueue,
  enqueueOfflineWrite,
  getOfflineQueue,
} from './offlineWriteQueue';

/**
 * Worked-example test: shows how a repository integrates the offline write
 * queue. This is the contract repository code will follow once the
 * Supabase paths are wired in a follow-up. Keeping it as a test makes the
 * intended shape executable and prevents the queue's API from drifting.
 */
describe('offlineWriteQueue integration shape', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearOfflineQueue();
  });

  afterEach(() => {
    clearOfflineQueue();
  });

  it('replays queued writes in the order they were enqueued', async () => {
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { name: 'First' } });
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { name: 'Second' } });
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { name: 'Third' } });

    const seen = [];
    const handler = vi.fn((payload) => {
      seen.push(payload.name);
      return Promise.resolve({ id: payload.name });
    });

    const result = await drainOfflineQueue({ 'opportunity:create': handler });

    expect(result).toEqual({ drained: 3, failed: 0, remaining: 0 });
    expect(seen).toEqual(['First', 'Second', 'Third']);
    expect(getOfflineQueue()).toEqual([]);
  });

  it('preserves later entries when an earlier replay fails so a future drain can retry', async () => {
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { name: 'A' } });
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { name: 'B' } });
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { name: 'C' } });

    const handler = vi.fn();
    handler.mockResolvedValueOnce(); // A drains
    handler.mockRejectedValueOnce(new Error('still offline')); // B fails -> stop
    // C is never attempted.

    const result = await drainOfflineQueue({ 'opportunity:create': handler });
    expect(result).toEqual({ drained: 1, failed: 1, remaining: 2 });

    const after = getOfflineQueue();
    expect(after.map((entry) => entry.payload.name)).toEqual(['B', 'C']);

    // A second drain when the network recovers should pick up B + C from
    // where the first drain stopped.
    handler.mockClear();
    handler.mockResolvedValue();
    const second = await drainOfflineQueue({ 'opportunity:create': handler });

    expect(second).toEqual({ drained: 2, failed: 0, remaining: 0 });
    expect(handler).toHaveBeenCalledTimes(2);
    expect(getOfflineQueue()).toEqual([]);
  });

  it('routes payloads to handlers by kind so multiple repositories can coexist on one queue', async () => {
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { id: 'opp-1' } });
    enqueueOfflineWrite({ kind: 'content:create', payload: { id: 'content-1' } });
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { id: 'opp-2' } });

    const opportunityHandler = vi.fn().mockResolvedValue();
    const contentHandler = vi.fn().mockResolvedValue();

    const result = await drainOfflineQueue({
      'opportunity:create': opportunityHandler,
      'content:create': contentHandler,
    });

    expect(result.drained).toBe(3);
    expect(opportunityHandler).toHaveBeenCalledTimes(2);
    expect(contentHandler).toHaveBeenCalledTimes(1);
    expect(opportunityHandler.mock.calls.map(([payload]) => payload.id)).toEqual(['opp-1', 'opp-2']);
    expect(contentHandler.mock.calls[0][0].id).toBe('content-1');
  });
});
