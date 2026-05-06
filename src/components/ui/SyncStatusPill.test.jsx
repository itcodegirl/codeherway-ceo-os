import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SyncStatusPill from './SyncStatusPill';
import { describeSyncStatus } from '../../lib/syncStatusDescriptors';

vi.mock('../../hooks/useWorkspaceSettings', () => ({
  useWorkspaceSettings: vi.fn(),
}));

vi.mock('../../hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(),
}));

import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

function workspaceSettingsValue(overrides = {}) {
  return {
    source: 'local',
    loadError: '',
    refreshWorkspaceSettings: vi.fn(),
    ...overrides,
  };
}

describe('describeSyncStatus', () => {
  it('returns the offline descriptor regardless of source when offline', () => {
    expect(describeSyncStatus('supabase', false).label).toBe('Offline');
    expect(describeSyncStatus('local', false).label).toBe('Offline');
  });

  it('returns synced when supabase and online', () => {
    expect(describeSyncStatus('supabase', true).label).toBe('Synced');
  });

  it('returns local-only when source is local and online', () => {
    expect(describeSyncStatus('local', true).label).toBe('Local only');
  });

  it('falls back to local-only for unknown sources when online', () => {
    expect(describeSyncStatus(undefined, true).label).toBe('Local only');
  });

  it('returns the error descriptor when online but a load error is present', () => {
    expect(describeSyncStatus('supabase', true, true).label).toBe('Sync error');
    expect(describeSyncStatus('local', true, true).tone).toBe('error');
  });

  it('still prefers offline over error when both are true', () => {
    expect(describeSyncStatus('supabase', false, true).label).toBe('Offline');
  });
});

describe('SyncStatusPill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnlineStatus.mockReturnValue(true);
  });

  it('renders the synced state when source is supabase and online', () => {
    useWorkspaceSettings.mockReturnValue(workspaceSettingsValue({ source: 'supabase' }));
    render(<SyncStatusPill />);
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('renders the local-only state when source is local and online', () => {
    useWorkspaceSettings.mockReturnValue(workspaceSettingsValue({ source: 'local' }));
    render(<SyncStatusPill />);
    expect(screen.getByText('Local only')).toBeInTheDocument();
  });

  it('falls back to local-only when source is unknown and online', () => {
    useWorkspaceSettings.mockReturnValue(workspaceSettingsValue({ source: undefined }));
    render(<SyncStatusPill />);
    expect(screen.getByText('Local only')).toBeInTheDocument();
  });

  it('shows Offline when the browser is offline, regardless of source', () => {
    useWorkspaceSettings.mockReturnValue(workspaceSettingsValue({ source: 'supabase' }));
    useOnlineStatus.mockReturnValue(false);
    render(<SyncStatusPill />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('does not render a pending-writes indicator while the offline queue is unwired', () => {
    useWorkspaceSettings.mockReturnValue(workspaceSettingsValue({ source: 'supabase' }));
    render(<SyncStatusPill />);
    expect(screen.queryByLabelText(/waiting to sync/)).toBeNull();
  });

  it('renders a retry button when loadError is present and online', () => {
    const refreshWorkspaceSettings = vi.fn();
    useWorkspaceSettings.mockReturnValue(workspaceSettingsValue({
      source: 'supabase',
      loadError: 'Unable to load workspace settings right now.',
      refreshWorkspaceSettings,
    }));

    render(<SyncStatusPill />);

    const retryButton = screen.getByRole('button', { name: /Sync error\. Retry loading workspace settings\./i });
    expect(retryButton).toHaveTextContent('Sync error');
    expect(retryButton).toHaveAttribute(
      'title',
      expect.stringContaining('Unable to load workspace settings right now.'),
    );

    fireEvent.click(retryButton);
    expect(refreshWorkspaceSettings).toHaveBeenCalledTimes(1);
  });

  it('still shows Offline (not a retry button) when loadError occurs while offline', () => {
    useWorkspaceSettings.mockReturnValue(workspaceSettingsValue({
      source: 'supabase',
      loadError: 'Unable to load workspace settings right now.',
    }));
    useOnlineStatus.mockReturnValue(false);

    render(<SyncStatusPill />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
