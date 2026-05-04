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
import { updateOpportunity } from './opportunitiesRepository';

function buildSupabaseClientStub({ rowsByExpectedAt }) {
  const captured = { eqs: [] };
  return {
    captured,
    from(_table) {
      const filters = {};
      const builder = {
        update(_payload) {
          return builder;
        },
        eq(column, value) {
          filters[column] = value;
          captured.eqs.push([column, value]);
          return builder;
        },
        select(_cols) {
          return builder;
        },
        async maybeSingle() {
          // The stub keeps a map of "expected updated_at -> row". If the
          // caller didn't pass an expected stamp we still let the update
          // through (legacy contract).
          if (filters.updated_at && !rowsByExpectedAt[filters.updated_at]) {
            return { data: null, error: null };
          }
          const data = rowsByExpectedAt[filters.updated_at]
            || rowsByExpectedAt['*']
            || null;
          return { data, error: null };
        },
      };
      return builder;
    },
  };
}

describe('updateOpportunity (Supabase optimistic locking)', () => {
  beforeEach(() => {
    runtimeModule.__supabaseRuntime.getSupabaseClient.mockReset();
    runtimeModule.__supabaseRuntime.requireSupabaseUserId.mockResolvedValue('user-1');
    runtimeModule.getSupabaseRuntime.mockResolvedValue(runtimeModule.__supabaseRuntime);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('passes expected updated_at to Supabase and returns the fresh row when it matches', async () => {
    const expectedMs = Date.UTC(2026, 4, 1, 12, 0, 0);
    const expectedIso = new Date(expectedMs).toISOString();
    const stub = buildSupabaseClientStub({
      rowsByExpectedAt: {
        [expectedIso]: {
          id: 'opp-1',
          name: 'Renamed',
          company: 'Acme',
          priority: 'High',
          stage: 'New',
          next_step: 'Email the team',
          updated_at: '2026-05-01T12:01:00.000Z',
        },
      },
    });
    runtimeModule.__supabaseRuntime.getSupabaseClient.mockResolvedValue(stub);

    const result = await updateOpportunity(
      'opp-1',
      { name: 'Renamed', company: 'Acme', priority: 'High', stage: 'New', nextStep: 'Email the team' },
      { expectedUpdatedAt: expectedMs },
    );

    expect(stub.captured.eqs).toContainEqual(['updated_at', expectedIso]);
    expect(result).toMatchObject({ name: 'Renamed' });
    expect(result.updatedAt).toBe(Date.parse('2026-05-01T12:01:00.000Z'));
  });

  it('throws StaleRecordError when the row was changed elsewhere', async () => {
    const expectedMs = Date.UTC(2026, 4, 1, 12, 0, 0);
    const stub = buildSupabaseClientStub({ rowsByExpectedAt: { /* no match */ } });
    runtimeModule.__supabaseRuntime.getSupabaseClient.mockResolvedValue(stub);

    let captured;
    try {
      await updateOpportunity(
        'opp-1',
        { name: 'Renamed', company: 'Acme', priority: 'High', stage: 'New', nextStep: 'Email' },
        { expectedUpdatedAt: expectedMs },
      );
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeDefined();
    expect(isStaleRecordError(captured)).toBe(true);
  });

  it('skips the optimistic-locking filter when no expected stamp is supplied', async () => {
    const stub = buildSupabaseClientStub({
      rowsByExpectedAt: {
        '*': {
          id: 'opp-1',
          name: 'Renamed',
          company: 'Acme',
          priority: 'High',
          stage: 'New',
          next_step: 'Email',
          updated_at: '2026-05-01T12:01:00.000Z',
        },
      },
    });
    runtimeModule.__supabaseRuntime.getSupabaseClient.mockResolvedValue(stub);

    await updateOpportunity('opp-1', {
      name: 'Renamed', company: 'Acme', priority: 'High', stage: 'New', nextStep: 'Email',
    });

    const updatedAtFilters = stub.captured.eqs.filter(([col]) => col === 'updated_at');
    expect(updatedAtFilters).toHaveLength(0);
  });
});
