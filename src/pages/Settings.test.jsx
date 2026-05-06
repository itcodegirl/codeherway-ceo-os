import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Settings from './Settings';

vi.mock('../hooks/useSettings', () => ({
  useSettings: vi.fn(),
}));

vi.mock('../hooks/useWorkspaceSetup', () => ({
  useWorkspaceSetup: vi.fn(),
}));

import { useSettings } from '../hooks/useSettings';
import { useWorkspaceSetup } from '../hooks/useWorkspaceSetup';

function createSettingsState(overrides = {}) {
  return {
    settings: {
      teamName: 'CodeHerWay',
      timezone: 'America/Chicago',
      emailDigest: true,
      keyboardShortcuts: false,
      autoSave: true,
    },
    savedAt: 0,
    source: 'local',
    isLoading: false,
    isSaving: false,
    loadError: '',
    timezoneIsValid: true,
    normalizeTimezone: vi.fn(),
    updateSetting: vi.fn(),
    saveSettings: vi.fn(),
    refreshSettings: vi.fn(),
    ...overrides,
  };
}

function renderSettings() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  );
}

describe('src/pages/Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceSetup.mockReturnValue({
      hasChoice: true,
      isDemoMode: true,
      startBlankWorkspace: vi.fn(),
      loadDemoWorkspace: vi.fn(),
      clearDemoData: vi.fn(),
    });
  });

  it('announces saving state through form busy state and button name', () => {
    useSettings.mockReturnValue(createSettingsState({
      isSaving: true,
    }));

    const { container } = renderSettings();

    expect(screen.getByRole('button', { name: 'Saving settings' })).toBeDisabled();
    expect(container.querySelector('form')).toHaveAttribute('aria-busy', 'true');
  });

  it('explains why saving is unavailable when timezone is invalid', () => {
    useSettings.mockReturnValue(createSettingsState({
      settings: {
        teamName: 'CodeHerWay',
        timezone: 'Invalid/Timezone',
        emailDigest: true,
        keyboardShortcuts: false,
        autoSave: true,
      },
      timezoneIsValid: false,
    }));

    renderSettings();

    expect(screen.getByRole('button', {
      name: 'Save settings unavailable until timezone is valid',
    })).toBeDisabled();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Timezone is invalid. Example: America/Chicago.');
  });

  it('sends changed workspace fields through the settings hook', () => {
    const updateSetting = vi.fn();
    const saveSettings = vi.fn();
    useSettings.mockReturnValue(createSettingsState({
      updateSetting,
      saveSettings,
    }));

    renderSettings();

    fireEvent.change(screen.getByLabelText('Workspace name'), {
      target: { value: 'CodeHerWay Studio' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(updateSetting).toHaveBeenCalledWith('teamName', 'CodeHerWay Studio');
    expect(saveSettings).toHaveBeenCalledTimes(1);
  });

  it('shows explicit local data setup actions and coming-soon paths', () => {
    const clearDemoData = vi.fn();
    useSettings.mockReturnValue(createSettingsState());
    useWorkspaceSetup.mockReturnValue({
      hasChoice: true,
      isDemoMode: true,
      startBlankWorkspace: vi.fn(),
      loadDemoWorkspace: vi.fn(),
      clearDemoData,
    });

    renderSettings();

    expect(screen.getByText('Demo workspace is active on this device.')).toBeInTheDocument();
    expect(screen.getByText('Import from local backup: coming soon')).toBeInTheDocument();
    expect(screen.getByText('Connect Supabase account: setup required')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear demo data from this device' }));
    expect(clearDemoData).toHaveBeenCalledTimes(1);
  });
});
