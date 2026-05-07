import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabaseRuntime', () => {
  const supabaseRuntime = {
    getSupabaseClient: vi.fn(),
    requireSupabaseUserId: vi.fn(),
  };
  return {
    isSupabaseRuntimeEnabled: true,
    getSupabaseRuntime: vi.fn(async () => supabaseRuntime),
    __supabaseRuntime: supabaseRuntime,
  };
});

import { isStaleRecordError } from './staleRecordError';
import * as runtimeModule from './supabaseRuntime';
import {
  createWeeklyItem,
  deleteWeeklyItem,
  getWeeklyBriefByWeek,
  updateWeeklyItem,
} from './weeklyRepository';

function buildWeeklySupabaseClientStub({
  briefRow = { id: 'brief-1', review_notes: 'Weekly notes' },
  itemRows = [],
  createRow = null,
  rowsByExpectedAt = {},
  deletedRowsByExpectedAt = {},
} = {}) {
  const captured = {
    deletes: 0,
    eqs: [],
    inserts: [],
    selects: [],
    updates: [],
  };

  return {
    captured,
    from(table) {
      let operation = 'list';
      const filters = {};

      const builder = {
        insert(payload) {
          operation = 'insert';
          captured.inserts.push([table, payload]);
          return builder;
        },
        update(payload) {
          operation = 'update';
          captured.updates.push([table, payload]);
          return builder;
        },
        delete() {
          operation = 'delete';
          captured.deletes += 1;
          return builder;
        },
        select(value) {
          captured.selects.push([table, value]);
          return builder;
        },
        eq(column, value) {
          filters[column] = value;
          captured.eqs.push([table, column, value]);
          return builder;
        },
        order() {
          return builder;
        },
        async maybeSingle() {
          if (table === 'weekly_briefs') {
            return { data: briefRow, error: null };
          }

          if (operation === 'update') {
            if (filters.updated_at && !rowsByExpectedAt[filters.updated_at]) {
              return { data: null, error: null };
            }
            return {
              data: rowsByExpectedAt[filters.updated_at] || rowsByExpectedAt['*'] || null,
              error: null,
            };
          }

          if (operation === 'delete') {
            if (filters.updated_at && !deletedRowsByExpectedAt[filters.updated_at]) {
              return { data: null, error: null };
            }
            return {
              data: deletedRowsByExpectedAt[filters.updated_at]
                || deletedRowsByExpectedAt['*']
                || { id: filters.id },
              error: null,
            };
          }

          return { data: null, error: null };
        },
        async single() {
          if (operation === 'insert') {
            return { data: createRow, error: null };
          }
          return { data: briefRow, error: null };
        },
        then(resolve, reject) {
          const result = table === 'weekly_brief_items' && operation === 'list'
            ? { data: itemRows, error: null }
            : { data: null, error: null };
          return Promise.resolve(result).then(resolve, reject);
        },
      };

      return builder;
    },
  };
}

describe('weeklyRepository Supabase timestamp coverage', () => {
  beforeEach(() => {
    runtimeModule.__supabaseRuntime.getSupabaseClient.mockReset();
    runtimeModule.__supabaseRuntime.requireSupabaseUserId.mockResolvedValue('user-1');
    runtimeModule.getSupabaseRuntime.mockResolvedValue(runtimeModule.__supabaseRuntime);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads updated_at from Supabase weekly item rows', async () => {
    const stub = buildWeeklySupabaseClientStub({
      itemRows: [
        {
          id: 'priority-1',
          item_type: 'priority',
          title: 'Ship launch plan',
          owner: 'Jenna',
          status: 'Planned',
          updated_at: '2026-05-01T14:00:00.000Z',
        },
      ],
    });
    runtimeModule.__supabaseRuntime.getSupabaseClient.mockResolvedValue(stub);

    const brief = await getWeeklyBriefByWeek('2026-04-27');

    const itemSelect = stub.captured.selects.find(([table]) => table === 'weekly_brief_items')?.[1] || '';
    expect(itemSelect).toContain('updated_at');
    expect(brief.priorities).toEqual([
      expect.objectContaining({
        id: 'priority-1',
        title: 'Ship launch plan',
        updatedAt: Date.parse('2026-05-01T14:00:00.000Z'),
      }),
    ]);
  });

  it('returns updatedAt from the Supabase create path', async () => {
    const stub = buildWeeklySupabaseClientStub({
      createRow: {
        id: 'win-1',
        item_type: 'win',
        description: 'Published case study',
        category: 'Portfolio',
        updated_at: '2026-05-01T14:05:00.000Z',
      },
    });
    runtimeModule.__supabaseRuntime.getSupabaseClient.mockResolvedValue(stub);

    const created = await createWeeklyItem({
      weekStart: '2026-04-27',
      itemType: 'win',
      item: { text: 'Published case study', category: 'Portfolio' },
    });

    const itemSelect = stub.captured.selects.find(([table]) => table === 'weekly_brief_items')?.[1] || '';
    expect(itemSelect).toContain('updated_at');
    expect(created.updatedAt).toBe(Date.parse('2026-05-01T14:05:00.000Z'));
  });

  it('passes expected updated_at to Supabase item updates and returns the fresh row', async () => {
    const expectedMs = Date.UTC(2026, 4, 1, 14, 0, 0);
    const expectedIso = new Date(expectedMs).toISOString();
    const stub = buildWeeklySupabaseClientStub({
      rowsByExpectedAt: {
        [expectedIso]: {
          id: 'blocker-1',
          item_type: 'blocker',
          description: 'Waiting on partner',
          severity: 'high',
          updated_at: '2026-05-01T14:07:00.000Z',
        },
      },
    });
    runtimeModule.__supabaseRuntime.getSupabaseClient.mockResolvedValue(stub);

    const updated = await updateWeeklyItem({
      weekStart: '2026-04-27',
      itemType: 'blocker',
      itemId: 'blocker-1',
      item: { text: 'Waiting on partner', severity: 'high' },
      expectedUpdatedAt: expectedMs,
    });

    expect(stub.captured.eqs).toContainEqual(['weekly_brief_items', 'updated_at', expectedIso]);
    expect(updated).toMatchObject({
      id: 'blocker-1',
      text: 'Waiting on partner',
      updatedAt: Date.parse('2026-05-01T14:07:00.000Z'),
    });
  });

  it('throws StaleRecordError when a Supabase weekly item changed before update', async () => {
    const stub = buildWeeklySupabaseClientStub({ rowsByExpectedAt: {} });
    runtimeModule.__supabaseRuntime.getSupabaseClient.mockResolvedValue(stub);

    let captured;
    try {
      await updateWeeklyItem({
        weekStart: '2026-04-27',
        itemType: 'priority',
        itemId: 'priority-1',
        item: { title: 'Stale priority', owner: 'Jenna', status: 'Planned' },
        expectedUpdatedAt: Date.UTC(2026, 4, 1, 14, 0, 0),
      });
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeDefined();
    expect(isStaleRecordError(captured)).toBe(true);
  });

  it('rejects Supabase deletes when the expected updated_at no longer matches', async () => {
    const expectedMs = Date.UTC(2026, 4, 1, 14, 0, 0);
    const expectedIso = new Date(expectedMs).toISOString();
    const stub = buildWeeklySupabaseClientStub({ deletedRowsByExpectedAt: {} });
    runtimeModule.__supabaseRuntime.getSupabaseClient.mockResolvedValue(stub);

    let captured;
    try {
      await deleteWeeklyItem({
        weekStart: '2026-04-27',
        itemType: 'priority',
        itemId: 'priority-1',
        expectedUpdatedAt: expectedMs,
      });
    } catch (error) {
      captured = error;
    }

    expect(stub.captured.eqs).toContainEqual(['weekly_brief_items', 'updated_at', expectedIso]);
    expect(captured).toBeDefined();
    expect(isStaleRecordError(captured)).toBe(true);
  });
});
