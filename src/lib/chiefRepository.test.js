import { describe, expect, it, vi, beforeEach } from 'vitest';

async function loadChiefRepositoryWithSupabaseMock(mockDefinition) {
  vi.resetModules();
  vi.doMock('./supabase', () => mockDefinition);
  return import('./chiefRepository');
}

describe('chiefRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('falls back to local storage when Supabase auth is required while loading workspace', async () => {
    const authRequiredError = new Error('Auth required');
    authRequiredError.code = 'SUPABASE_AUTH_REQUIRED';

    window.localStorage.setItem('ceo-os-chief-notes', 'Legacy notes');
    window.localStorage.setItem(
      'ceo-os-chief-responses',
      JSON.stringify([
        {
          id: 'r1',
          title: 'Legacy output',
          content: 'Legacy content',
          source: 'proxy',
          structuredPayload: {
            priorities: [],
            opportunities: [],
            contentItems: [],
            tasks: [],
          },
        },
      ]),
    );

    const { loadChiefWorkspace } = await loadChiefRepositoryWithSupabaseMock({
      isSupabaseConfigured: true,
      supabaseClient: {},
      requireSupabaseUserId: vi.fn(async () => {
        throw authRequiredError;
      }),
    });

    const workspace = await loadChiefWorkspace();

    expect(workspace.source).toBe('local');
    expect(workspace.notes).toBe('Legacy notes');
    expect(workspace.responses).toEqual([
      {
        id: 'r1',
        title: 'Legacy output',
        content: 'Legacy content',
        source: 'proxy',
        structuredPayload: {
          priorities: [],
          opportunities: [],
          contentItems: [],
          tasks: [],
        },
      },
    ]);
  });

  it('creates a local session and persists notes when Supabase auth is required', async () => {
    const authRequiredError = new Error('Auth required');
    authRequiredError.code = 'SUPABASE_AUTH_REQUIRED';

    const { createChiefSession } = await loadChiefRepositoryWithSupabaseMock({
      isSupabaseConfigured: true,
      supabaseClient: {},
      requireSupabaseUserId: vi.fn(async () => {
        throw authRequiredError;
      }),
    });

    const session = await createChiefSession({
      actionKey: 'summarize',
      notes: 'Temporary notes',
    });

    expect(session.source).toBe('local');
    expect(window.localStorage.getItem('ceo-os-chief-notes')).toBe('Temporary notes');
    expect(typeof session.id).toBe('string');
    expect(session.id).toBeTruthy();
  });

  it('saves output to local storage when Supabase auth is required', async () => {
    const authRequiredError = new Error('Auth required');
    authRequiredError.code = 'SUPABASE_AUTH_REQUIRED';

    const { saveChiefOutput } = await loadChiefRepositoryWithSupabaseMock({
      isSupabaseConfigured: true,
      supabaseClient: {},
      requireSupabaseUserId: vi.fn(async () => {
        throw authRequiredError;
      }),
    });

    const output = await saveChiefOutput({
      sessionId: 'session-1',
      outputType: 'response',
      title: 'Fallback response',
      content: 'Fallback output text',
      structuredPayload: {
        priorities: [],
        opportunities: [],
        contentItems: [],
        tasks: [],
      },
      source: 'proxy',
    });

    const persistedRaw = window.localStorage.getItem('ceo-os-chief-responses');
    const persisted = JSON.parse(persistedRaw);

    expect(output.title).toBe('Fallback response');
    expect(Array.isArray(persisted)).toBe(true);
    expect(persisted).toHaveLength(1);
    expect(persisted[0].title).toBe('Fallback response');
  });
});
