import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OPPORTUNITIES_UPDATED_EVENT,
  createOpportunity,
  deleteOpportunity,
  listOpportunities,
  updateOpportunity,
} from './opportunitiesRepository';

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
