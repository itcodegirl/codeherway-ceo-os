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

vi.mock('../../hooks/useOfflineWriteQueue', () => ({
  useOfflineWriteQueueSize: vi.fn(),
}));

import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useOfflineWriteQueueSize } from '../../hooks/useOfflineWriteQueue';

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
    useOfflineWriteQueueSize.mockReturnValue(0);
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

  it('does not show a pending suffix when the queue is empty', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'supabase' });
    useOfflineWriteQueueSize.mockReturnValue(0);
    render(<SyncStatusPill />);
    expect(screen.queryByText(/pending/i)).toBeNull();
  });

  it('shows pending sync when the offline queue has entries and the workspace is online + supabase-backed', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'supabase' });
    useOfflineWriteQueueSize.mockReturnValue(3);
    render(<SyncStatusPill />);
    expect(screen.getByText(/Pending sync/)).toBeInTheDocument();
    expect(screen.getByText(/3 waiting/)).toBeInTheDocument();
    expect(screen.queryByText(/^Synced$/)).toBeNull();
  });

  it('does not advertise queued writes while offline because replay cannot drain yet', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'supabase' });
    useOnlineStatus.mockReturnValue(false);
    useOfflineWriteQueueSize.mockReturnValue(2);
    render(<SyncStatusPill />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.queryByText(/waiting/i)).toBeNull();
  });

  it('does NOT show pending suffix in local-only mode (queue has nowhere to drain)', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'local' });
    useOfflineWriteQueueSize.mockReturnValue(2);
    render(<SyncStatusPill />);
    expect(screen.getByText('Local only')).toBeInTheDocument();
    expect(screen.queryByText(/pending/i)).toBeNull();
  });
});
