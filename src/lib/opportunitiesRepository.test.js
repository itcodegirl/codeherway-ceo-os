import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OPPORTUNITIES_UPDATED_EVENT,
  createOpportunity,
  deleteOpportunity,
  listOpportunities,
  updateOpportunity,
} from './opportunitiesRepository';
import { StaleRecordError, isStaleRecordError } from './staleRecordError';

describe('src/lib/opportunitiesRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('rejects stale local opportunity updates without emitting a fake update event', async () => {
    const created = await createOpportunity({
      name: 'Portfolio partner',
      company: 'CodeHerWay',
      priority: 'High',
      stage: 'New',
      nextStep: 'Send intro',
    });
    const updateListener = vi.fn();
    window.addEventListener(OPPORTUNITIES_UPDATED_EVENT, updateListener);

    try {
      await expect(updateOpportunity('missing-opportunity', {
        name: 'Ghost opportunity',
        company: 'Nowhere',
        priority: 'Low',
        stage: 'New',
        nextStep: 'None',
      })).rejects.toThrow('Opportunity not found');
    } finally {
      window.removeEventListener(OPPORTUNITIES_UPDATED_EVENT, updateListener);
    }

    const items = await listOpportunities();
    expect(updateListener).not.toHaveBeenCalled();
    expect(items.some((item) => item.id === created.id && item.name === created.name)).toBe(true);
    expect(items.some((item) => item.name === 'Ghost opportunity')).toBe(false);
  });

  it('stamps updatedAt on local create and bumps it on local update', async () => {
    const created = await createOpportunity({
      name: 'Updated lead',
      company: 'Bookings',
      priority: 'High',
      stage: 'New',
      nextStep: 'Send brief',
    });
    expect(created.updatedAt).toBeTypeOf('number');
    expect(created.updatedAt).toBeGreaterThan(0);

    // Allow the clock to advance so we can prove updatedAt changes.
    await new Promise((resolve) => setTimeout(resolve, 5));

    const updated = await updateOpportunity(
      created.id,
      { ...created, nextStep: 'Send revised brief' },
      { expectedUpdatedAt: created.updatedAt },
    );

    expect(updated.updatedAt).toBeGreaterThan(created.updatedAt);
    expect(updated.nextStep).toBe('Send revised brief');
  });

  it('rejects a local update when the expected updatedAt is stale', async () => {
    const created = await createOpportunity({
      name: 'Conflict lead',
      company: 'TwoTabs',
      priority: 'Medium',
      stage: 'New',
      nextStep: 'Trigger conflict',
    });

    // Simulate another tab advancing the persisted record.
    await new Promise((resolve) => setTimeout(resolve, 2));
    await updateOpportunity(
      created.id,
      { ...created, nextStep: 'Tab B wrote here first' },
      { expectedUpdatedAt: created.updatedAt },
    );

    // Now simulate Tab A trying to save with the original timestamp.
    const updateListener = vi.fn();
    window.addEventListener(OPPORTUNITIES_UPDATED_EVENT, updateListener);
    try {
      await expect(
        updateOpportunity(
          created.id,
          { ...created, nextStep: 'Tab A wrote here second' },
          { expectedUpdatedAt: created.updatedAt },
        ),
      ).rejects.toMatchObject({ name: 'StaleRecordError' });
    } finally {
      window.removeEventListener(OPPORTUNITIES_UPDATED_EVENT, updateListener);
    }

    expect(updateListener).not.toHaveBeenCalled();
    const items = await listOpportunities();
    const persisted = items.find((item) => item.id === created.id);
    expect(persisted.nextStep).toBe('Tab B wrote here first');
  });

  it('skips the stale check when no expectedUpdatedAt is supplied (back-compat)', async () => {
    const created = await createOpportunity({
      name: 'Compat lead',
      company: 'Legacy',
      priority: 'Low',
      stage: 'New',
      nextStep: 'Untracked',
    });

    const updated = await updateOpportunity(created.id, {
      ...created,
      nextStep: 'Updated without timestamp',
    });

    expect(updated.nextStep).toBe('Updated without timestamp');
    expect(isStaleRecordError(new StaleRecordError())).toBe(true);
  });

  it('rejects stale local opportunity deletes without emitting a fake update event', async () => {
    const created = await createOpportunity({
      name: 'Conference lead',
      company: 'Founder Summit',
      priority: 'Medium',
      stage: 'Follow-up',
      nextStep: 'Book call',
    });
    const updateListener = vi.fn();
    window.addEventListener(OPPORTUNITIES_UPDATED_EVENT, updateListener);

    try {
      await expect(deleteOpportunity('missing-opportunity')).rejects.toThrow('Opportunity not found');
    } finally {
      window.removeEventListener(OPPORTUNITIES_UPDATED_EVENT, updateListener);
    }

    const items = await listOpportunities();
    expect(updateListener).not.toHaveBeenCalled();
    expect(items.some((item) => item.id === created.id && item.name === created.name)).toBe(true);
  });
});
