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
});
