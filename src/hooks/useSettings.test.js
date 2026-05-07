import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryState = {
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
  getSettingsSource: vi.fn(),
};

vi.mock('../lib/settingsRepository', () => ({
  loadSettings: (...args) => repositoryState.loadSettings(...args),
  saveSettings: (...args) => repositoryState.saveSettings(...args),
  getSettingsSource: (...args) => repositoryState.getSettingsSource(...args),
}));

import { useSettings } from './useSettings';

function createDeferred() {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });

  return {
    promise,
    resolve,
  };
}

describe('useSettings', () => {
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;

  beforeEach(() => {
    vi.clearAllMocks();
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;

    window.requestAnimationFrame = vi.fn((callback) => {
      callback(0);
      return 5;
    });
    window.cancelAnimationFrame = vi.fn();

    repositoryState.getSettingsSource.mockReturnValue('local');
    repositoryState.loadSettings.mockResolvedValue({
      settings: {
        timezone: 'America/Chicago',
        teamName: 'CodeHerWay',
        emailDigest: true,
        keyboardShortcuts: false,
        autoSave: true,
      },
      savedAt: 0,
      source: 'local',
    });
    repositoryState.saveSettings.mockResolvedValue({
      settings: {
        timezone: 'America/Chicago',
        teamName: 'CodeHerWay',
        emailDigest: true,
        keyboardShortcuts: false,
        autoSave: true,
      },
      savedAt: Date.now(),
      source: 'local',
    });
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('resets saving state when timezone validation fails', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.saveSettings({
        timezone: 'Invalid/Timezone',
        teamName: 'CodeHerWay',
        emailDigest: true,
        keyboardShortcuts: false,
        autoSave: true,
      });
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.loadError).toBe('Timezone is invalid.');
    expect(repositoryState.saveSettings).not.toHaveBeenCalled();
  });

  it('queues the latest save request while settings are already saving', async () => {
    const pendingSave = createDeferred();

    repositoryState.saveSettings
      .mockImplementationOnce(() => pendingSave.promise)
      .mockImplementation((nextSettings) => Promise.resolve({
        settings: nextSettings,
        savedAt: 444,
        source: 'local',
      }));

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let firstSave;
    await act(async () => {
      firstSave = result.current.saveSettings({
        timezone: 'America/Chicago',
        teamName: 'CodeHerWay',
        emailDigest: true,
        keyboardShortcuts: false,
        autoSave: true,
      });
      await result.current.saveSettings({
        timezone: 'America/New_York',
        teamName: 'Duplicate Team',
        emailDigest: false,
        keyboardShortcuts: true,
        autoSave: false,
      });
    });

    expect(repositoryState.saveSettings).toHaveBeenCalledTimes(1);

    await act(async () => {
      pendingSave.resolve({
        settings: {
          timezone: 'America/Chicago',
          teamName: 'CodeHerWay',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        savedAt: 333,
        source: 'local',
      });
      await firstSave;
    });

    expect(result.current.isSaving).toBe(false);
    expect(repositoryState.saveSettings).toHaveBeenCalledTimes(2);
    expect(repositoryState.saveSettings).toHaveBeenLastCalledWith({
      timezone: 'America/New_York',
      teamName: 'Duplicate Team',
      emailDigest: false,
      keyboardShortcuts: true,
      autoSave: false,
    });
    expect(result.current.settings.teamName).toBe('Duplicate Team');
    expect(result.current.settings.timezone).toBe('America/New_York');
  });

  it('keeps newer local edits when an older save resolves', async () => {
    const pendingSave = createDeferred();

    repositoryState.saveSettings.mockImplementationOnce(() => pendingSave.promise);

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let savePromise;
    await act(async () => {
      savePromise = result.current.saveSettings({
        timezone: 'America/Chicago',
        teamName: 'CodeHerWay Leadership',
        emailDigest: true,
        keyboardShortcuts: false,
        autoSave: true,
      });
      result.current.updateSetting('timezone', 'UTC');
    });

    await act(async () => {
      pendingSave.resolve({
        settings: {
          timezone: 'America/Chicago',
          teamName: 'CodeHerWay Leadership',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        savedAt: 555,
        source: 'local',
      });
      await savePromise;
    });

    expect(result.current.settings.teamName).toBe('CodeHerWay');
    expect(result.current.settings.timezone).toBe('UTC');
    expect(result.current.savedAt).toBe(555);
  });

  it('keeps local edits when an older settings load resolves', async () => {
    const pendingLoad = createDeferred();

    repositoryState.loadSettings.mockImplementationOnce(() => pendingLoad.promise);

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(repositoryState.loadSettings).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.updateSetting('timezone', 'UTC');
    });

    await act(async () => {
      pendingLoad.resolve({
        settings: {
          timezone: 'America/Chicago',
          teamName: 'CodeHerWay',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        savedAt: 666,
        source: 'local',
      });
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.settings.timezone).toBe('UTC');
    expect(result.current.savedAt).toBe(666);
  });

  it('ignores stale settings loads when a newer refresh resolves first', async () => {
    const firstLoad = createDeferred();
    const secondLoad = createDeferred();

    repositoryState.loadSettings
      .mockImplementationOnce(() => firstLoad.promise)
      .mockImplementationOnce(() => secondLoad.promise);

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(repositoryState.loadSettings).toHaveBeenCalledTimes(1);
    });

    act(() => {
      void result.current.refreshSettings();
    });

    await waitFor(() => {
      expect(repositoryState.loadSettings).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      secondLoad.resolve({
        settings: {
          timezone: 'America/New_York',
          teamName: 'Newer Team',
          emailDigest: false,
          keyboardShortcuts: true,
          autoSave: false,
        },
        savedAt: 222,
        source: 'supabase',
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.settings.teamName).toBe('Newer Team');
      expect(result.current.source).toBe('supabase');
    });

    await act(async () => {
      firstLoad.resolve({
        settings: {
          timezone: 'America/Chicago',
          teamName: 'Older Team',
          emailDigest: true,
          keyboardShortcuts: false,
          autoSave: true,
        },
        savedAt: 111,
        source: 'local',
      });
      await Promise.resolve();
    });

    expect(result.current.settings.teamName).toBe('Newer Team');
    expect(result.current.savedAt).toBe(222);
    expect(result.current.source).toBe('supabase');
  });
});
