import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONTENT_ITEMS_UPDATED_EVENT,
  clearLocalContentDemoData,
  createContentItem,
  deleteContentItem,
  listContentItems,
  updateContentItem,
} from './contentRepository';
import { saveWorkspaceSetupMode } from './workspaceSetup';

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

  it('stamps and bumps updatedAt on local content writes', async () => {
    const created = await createContentItem({
      title: 'Founder note',
      platform: 'Newsletter',
      status: 'Drafting',
    });
    expect(created.updatedAt).toBeGreaterThan(0);

    await new Promise((resolve) => setTimeout(resolve, 5));
    const updated = await updateContentItem(
      created.id,
      { ...created, title: 'Founder note (revised)' },
      { expectedUpdatedAt: created.updatedAt },
    );

    expect(updated.updatedAt).toBeGreaterThan(created.updatedAt);
    expect(updated.title).toBe('Founder note (revised)');
  });

  it('rejects a local content update when the expected updatedAt is stale', async () => {
    const created = await createContentItem({
      title: 'Two-tab content',
      platform: 'Newsletter',
      status: 'Drafting',
    });

    await new Promise((resolve) => setTimeout(resolve, 2));
    await updateContentItem(
      created.id,
      { ...created, title: 'Tab B saved first' },
      { expectedUpdatedAt: created.updatedAt },
    );

    const updateListener = vi.fn();
    window.addEventListener(CONTENT_ITEMS_UPDATED_EVENT, updateListener);
    try {
      await expect(
        updateContentItem(
          created.id,
          { ...created, title: 'Tab A tried second' },
          { expectedUpdatedAt: created.updatedAt },
        ),
      ).rejects.toMatchObject({ name: 'StaleRecordError' });
    } finally {
      window.removeEventListener(CONTENT_ITEMS_UPDATED_EVENT, updateListener);
    }

    const items = await listContentItems();
    const persisted = items.find((item) => item.id === created.id);
    expect(persisted.title).toBe('Tab B saved first');
    expect(updateListener).not.toHaveBeenCalled();
  });

  it('does not auto-seed demo content after the workspace starts blank', async () => {
    saveWorkspaceSetupMode('blank');

    await expect(listContentItems()).resolves.toEqual([]);
  });

  it('clears known demo content without deleting user-created records', async () => {
    const created = await createContentItem({
      title: 'Real founder note',
      platform: 'Newsletter',
      status: 'Drafting',
    });

    clearLocalContentDemoData();

    const items = await listContentItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: created.id, title: 'Real founder note' });
  });
});
