import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONTENT_ITEMS_UPDATED_EVENT,
  createContentItem,
  deleteContentItem,
  listContentItems,
  updateContentItem,
} from './contentRepository';

describe('src/lib/contentRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('rejects stale local content updates without emitting a fake update event', async () => {
    const created = await createContentItem({
      title: 'Launch recap post',
      platform: 'LinkedIn',
      status: 'Drafting',
    });
    const updateListener = vi.fn();
    window.addEventListener(CONTENT_ITEMS_UPDATED_EVENT, updateListener);

    try {
      await expect(updateContentItem('missing-content', {
        title: 'Ghost content',
        platform: 'Email',
        status: 'Drafting',
      })).rejects.toThrow('Content item not found');
    } finally {
      window.removeEventListener(CONTENT_ITEMS_UPDATED_EVENT, updateListener);
    }

    const items = await listContentItems();
    expect(updateListener).not.toHaveBeenCalled();
    expect(items.some((item) => item.id === created.id && item.title === created.title)).toBe(true);
    expect(items.some((item) => item.title === 'Ghost content')).toBe(false);
  });

  it('rejects stale local content deletes without emitting a fake update event', async () => {
    const created = await createContentItem({
      title: 'Founder note thread',
      platform: 'Threads',
      status: 'Queued',
    });
    const updateListener = vi.fn();
    window.addEventListener(CONTENT_ITEMS_UPDATED_EVENT, updateListener);

    try {
      await expect(deleteContentItem('missing-content')).rejects.toThrow('Content item not found');
    } finally {
      window.removeEventListener(CONTENT_ITEMS_UPDATED_EVENT, updateListener);
    }

    const items = await listContentItems();
    expect(updateListener).not.toHaveBeenCalled();
    expect(items.some((item) => item.id === created.id && item.title === created.title)).toBe(true);
  });
});
