import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryState = vi.hoisted(() => ({
  loadSettings: vi.fn(),
  getSettingsSource: vi.fn(),
  SETTINGS_UPDATED_EVENT: 'ceo-os:settings-updated',
}));

vi.mock('../lib/settingsRepository', () => ({
  loadSettings: (...args) => repositoryState.loadSettings(...args),
  getSettingsSource: (...args) => repositoryState.getSettingsSource(...args),
  SETTINGS_UPDATED_EVENT: repositoryState.SETTINGS_UPDATED_EVENT,
}));

import { useWorkspaceSettings } from './useWorkspaceSettings';

describe('useWorkspaceSettings', () => {
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;

  beforeEach(() => {
    vi.clearAllMocks();
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    window.requestAnimationFrame = vi.fn((callback) => {
      callback(0);
      return 1;
    });
    window.cancelAnimationFrame = vi.fn();
    repositoryState.getSettingsSource.mockReturnValue('local');
    repositoryState.loadSettings.mockResolvedValue({
      settings: {
        teamName: 'CodeHerWay',
        timezone: 'America/Chicago',
        emailDigest: true,
        keyboardShortcuts: false,
        autoSave: true,
      },
      source: 'local',
    });
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('loads workspace settings and exposes display-ready values', async () => {
    const { result } = renderHook(() => useWorkspaceSettings());

    await waitFor(() => {
      expect(result.current.teamName).toBe('CodeHerWay');
    });

    expect(result.current.source).toBe('local');
    expect(result.current.timezone).toBe('America/Chicago');
  });

  it('refreshes when settings are updated elsewhere in the app', async () => {
    repositoryState.loadSettings
      .mockResolvedValueOnce({
        settings: {
          teamName: 'CodeHerWay',
          timezone: 'America/Chicago',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        source: 'local',
      })
      .mockResolvedValueOnce({
        settings: {
          teamName: 'CodeHerWay Leadership',
          timezone: 'UTC',
          emailDigest: false,
          keyboardShortcuts: true,
          autoSave: false,
        },
        source: 'supabase',
      });

    const { result } = renderHook(() => useWorkspaceSettings());

    await waitFor(() => {
      expect(result.current.teamName).toBe('CodeHerWay');
    });

    act(() => {
      window.dispatchEvent(new CustomEvent(repositoryState.SETTINGS_UPDATED_EVENT));
    });

    await waitFor(() => {
      expect(result.current.teamName).toBe('CodeHerWay Leadership');
    });

    expect(result.current.timezone).toBe('UTC');
    expect(result.current.source).toBe('supabase');
  });

  it('does not coalesce consecutive explicit settings-updated events', async () => {
    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000);

    repositoryState.loadSettings
      .mockResolvedValueOnce({
        settings: {
          teamName: 'CodeHerWay',
          timezone: 'America/Chicago',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        source: 'local',
      })
      .mockResolvedValueOnce({
        settings: {
          teamName: 'CodeHerWay Leadership',
          timezone: 'America/Chicago',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        source: 'local',
      })
      .mockResolvedValueOnce({
        settings: {
          teamName: 'CodeHerWay Leadership',
          timezone: 'UTC',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        source: 'local',
      });

    try {
      const { result } = renderHook(() => useWorkspaceSettings());

      await waitFor(() => {
        expect(result.current.teamName).toBe('CodeHerWay');
      });

      act(() => {
        window.dispatchEvent(new CustomEvent(repositoryState.SETTINGS_UPDATED_EVENT));
      });

      await waitFor(() => {
        expect(result.current.teamName).toBe('CodeHerWay Leadership');
      });

      act(() => {
        window.dispatchEvent(new CustomEvent(repositoryState.SETTINGS_UPDATED_EVENT));
      });

      await waitFor(() => {
        expect(result.current.timezone).toBe('UTC');
      });

      expect(repositoryState.loadSettings).toHaveBeenCalledTimes(3);
    } finally {
      dateNowSpy.mockRestore();
    }
  });

  it('exposes loadError when loadSettings rejects and clears it on a successful refresh', async () => {
    repositoryState.loadSettings
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        settings: {
          teamName: 'CodeHerWay',
          timezone: 'America/Chicago',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        source: 'supabase',
      });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const { result } = renderHook(() => useWorkspaceSettings());

      await waitFor(() => {
        expect(result.current.loadError).toBe('Unable to load workspace settings right now.');
      });

      await act(async () => {
        await result.current.refreshWorkspaceSettings();
      });

      expect(result.current.loadError).toBe('');
      expect(result.current.source).toBe('supabase');
      expect(result.current.teamName).toBe('CodeHerWay');
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('refreshes on focus, visibility, and relevant storage updates without replacing unchanged settings', async () => {
    const addWindowListener = vi.spyOn(window, 'addEventListener');
    const addDocumentListener = vi.spyOn(document, 'addEventListener');
    const dateNowSpy = vi.spyOn(Date, 'now');
    const capturedWindowHandlers = {};
    const capturedDocumentHandlers = {};
    let nowMs = 1_000;

    dateNowSpy.mockImplementation(() => nowMs);

    repositoryState.loadSettings
      .mockResolvedValueOnce({
        settings: {
          teamName: 'CodeHerWay',
          timezone: 'America/Chicago',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        source: 'local',
      })
      .mockResolvedValueOnce({
        settings: {
          teamName: 'CodeHerWay Local',
          timezone: 'UTC',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        source: 'local',
      })
      .mockResolvedValueOnce({
        settings: {
          teamName: 'CodeHerWay Visibility',
          timezone: 'UTC',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        source: 'supabase',
      });

    addWindowListener.mockImplementation((type, listener) => {
      capturedWindowHandlers[type] = listener;
      return undefined;
    });
    addDocumentListener.mockImplementation((type, listener) => {
      capturedDocumentHandlers[type] = listener;
      return undefined;
    });

    try {
      const { result } = renderHook(() => useWorkspaceSettings());

      await waitFor(() => {
        expect(result.current.teamName).toBe('CodeHerWay');
      });

      const initialSettingsRef = result.current.settings;

      act(() => {
        nowMs += 500;
        capturedWindowHandlers.focus();
      });

      await waitFor(() => {
        expect(result.current.teamName).toBe('CodeHerWay Local');
      });
      expect(result.current.source).toBe('local');

      act(() => {
        nowMs += 500;
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'visible',
        });
        capturedDocumentHandlers.visibilitychange();
      });

      await waitFor(() => {
        expect(result.current.teamName).toBe('CodeHerWay Visibility');
      });
      expect(result.current.source).toBe('supabase');

      repositoryState.loadSettings.mockResolvedValue({
        settings: {
          teamName: 'CodeHerWay Visibility',
          timezone: 'UTC',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        source: 'supabase',
      });

      const refreshedSettingsRef = result.current.settings;

      act(() => {
        nowMs += 500;
        capturedWindowHandlers.storage({ key: 'ceo-os-settings' });
      });

      await waitFor(() => {
        expect(repositoryState.loadSettings).toHaveBeenCalledTimes(4);
      });

      expect(result.current.settings).toBe(refreshedSettingsRef);
      expect(initialSettingsRef).not.toBe(refreshedSettingsRef);
    } finally {
      dateNowSpy.mockRestore();
      addWindowListener.mockRestore();
      addDocumentListener.mockRestore();
    }
  });
});
