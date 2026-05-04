import { render, screen } from '@testing-library/react';
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
});

describe('SyncStatusPill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnlineStatus.mockReturnValue(true);
  });

  it('renders the synced state when source is supabase and online', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'supabase' });
    render(<SyncStatusPill />);
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('renders the local-only state when source is local and online', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'local' });
    render(<SyncStatusPill />);
    expect(screen.getByText('Local only')).toBeInTheDocument();
  });

  it('falls back to local-only when source is unknown and online', () => {
    useWorkspaceSettings.mockReturnValue({ source: undefined });
    render(<SyncStatusPill />);
    expect(screen.getByText('Local only')).toBeInTheDocument();
  });

  it('shows Offline when the browser is offline, regardless of source', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'supabase' });
    useOnlineStatus.mockReturnValue(false);
    render(<SyncStatusPill />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('does not render a pending-writes indicator while the offline queue is unwired', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'supabase' });
    render(<SyncStatusPill />);
    expect(screen.queryByLabelText(/waiting to sync/)).toBeNull();
  });
});
