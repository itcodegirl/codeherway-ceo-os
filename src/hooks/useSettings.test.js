import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
});
