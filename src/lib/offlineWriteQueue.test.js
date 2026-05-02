import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OFFLINE_QUEUE_STORAGE_KEY,
  OFFLINE_QUEUE_UPDATED_EVENT,
  clearOfflineQueue,
  drainOfflineQueue,
  enqueueOfflineWrite,
  getOfflineQueue,
  removeOfflineWrite,
} from './offlineWriteQueue';

describe('offlineWriteQueue', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    clearOfflineQueue();
  });

  it('starts empty when no entries are persisted', () => {
    expect(getOfflineQueue()).toEqual([]);
  });

  it('enqueues an entry with id, kind, payload, createdAt, attempts', () => {
    const entry = enqueueOfflineWrite({
      kind: 'opportunity:create',
      payload: { name: 'Acme partnership' },
    });

    expect(entry).toBeTruthy();
    expect(entry.id).toMatch(/^q-\d+-\d{6}$/);
    expect(entry.kind).toBe('opportunity:create');
    expect(entry.payload).toEqual({ name: 'Acme partnership' });
    expect(entry.attempts).toBe(0);
    expect(entry.createdAt).toBeGreaterThan(0);

    const persisted = JSON.parse(window.localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY));
    expect(persisted).toHaveLength(1);
    expect(persisted[0].id).toBe(entry.id);
  });

  it('rejects entries without a kind', () => {
    expect(enqueueOfflineWrite({ kind: '', payload: {} })).toBeNull();
    expect(enqueueOfflineWrite({ payload: {} })).toBeNull();
    expect(getOfflineQueue()).toEqual([]);
  });

  it('emits OFFLINE_QUEUE_UPDATED_EVENT on enqueue with the new size', () => {
    const events = [];
    const listener = (event) => events.push(event.detail);
    window.addEventListener(OFFLINE_QUEUE_UPDATED_EVENT, listener);
    try {
      enqueueOfflineWrite({ kind: 'opportunity:create', payload: { id: 1 } });
      enqueueOfflineWrite({ kind: 'opportunity:create', payload: { id: 2 } });
    } finally {
      window.removeEventListener(OFFLINE_QUEUE_UPDATED_EVENT, listener);
    }

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ kind: 'enqueue', size: 1 });
    expect(events[1]).toMatchObject({ kind: 'enqueue', size: 2 });
  });

  it('removeOfflineWrite removes a single entry by id', () => {
    const a = enqueueOfflineWrite({ kind: 'k', payload: 1 });
    enqueueOfflineWrite({ kind: 'k', payload: 2 });
    expect(getOfflineQueue()).toHaveLength(2);

    expect(removeOfflineWrite(a.id)).toBe(true);
    expect(getOfflineQueue()).toHaveLength(1);
    expect(getOfflineQueue()[0].payload).toBe(2);
  });

  it('clearOfflineQueue empties the queue', () => {
    enqueueOfflineWrite({ kind: 'k', payload: 1 });
    enqueueOfflineWrite({ kind: 'k', payload: 2 });
    clearOfflineQueue();
    expect(getOfflineQueue()).toEqual([]);
  });

  it('drainOfflineQueue replays entries through their handlers and removes successful ones', async () => {
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { name: 'A' } });
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { name: 'B' } });

    const handler = vi.fn().mockResolvedValue();
    const result = await drainOfflineQueue({ 'opportunity:create': handler });

    expect(result).toEqual({ drained: 2, failed: 0, remaining: 0 });
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, { name: 'A' }, expect.objectContaining({ kind: 'opportunity:create' }));
    expect(handler).toHaveBeenNthCalledWith(2, { name: 'B' }, expect.objectContaining({ kind: 'opportunity:create' }));
    expect(getOfflineQueue()).toEqual([]);
  });

  it('drainOfflineQueue stops on the first failure and bumps that entry attempts', async () => {
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { name: 'A' } });
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { name: 'B' } });
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: { name: 'C' } });

    const handler = vi.fn();
    handler.mockResolvedValueOnce();
    handler.mockRejectedValueOnce(new Error('still offline'));
    // Third call must never happen because we stop after the first failure.

    const result = await drainOfflineQueue({ 'opportunity:create': handler });

    expect(result).toEqual({ drained: 1, failed: 1, remaining: 2 });
    expect(handler).toHaveBeenCalledTimes(2);

    const remaining = getOfflineQueue();
    expect(remaining.map((entry) => entry.payload.name)).toEqual(['B', 'C']);
    expect(remaining[0].attempts).toBe(1);
    expect(remaining[1].attempts).toBe(0);
  });

  it('drainOfflineQueue leaves unknown-kind entries in place', async () => {
    enqueueOfflineWrite({ kind: 'unknown:future', payload: {} });
    enqueueOfflineWrite({ kind: 'opportunity:create', payload: {} });

    const handler = vi.fn().mockResolvedValue();
    const result = await drainOfflineQueue({ 'opportunity:create': handler });

    expect(result.drained).toBe(1);
    expect(getOfflineQueue()).toHaveLength(1);
    expect(getOfflineQueue()[0].kind).toBe('unknown:future');
  });

  it('caps the queue at MAX_QUEUE_LENGTH (drops oldest entries first)', () => {
    // Push 205 entries; only the last 200 should survive (FIFO drop).
    for (let index = 0; index < 205; index += 1) {
      enqueueOfflineWrite({ kind: 'k', payload: index });
    }
    const queue = getOfflineQueue();
    expect(queue).toHaveLength(200);
    expect(queue[0].payload).toBe(5);
    expect(queue[queue.length - 1].payload).toBe(204);
  });
});
