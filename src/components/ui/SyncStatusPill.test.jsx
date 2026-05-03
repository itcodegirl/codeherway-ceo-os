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

  it('renders +N pending when there are queued writes', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'supabase' });
    useOfflineWriteQueueSize.mockReturnValue(3);
    render(<SyncStatusPill />);
    expect(screen.getByText('Synced')).toBeInTheDocument();
    expect(screen.getByLabelText('3 writes waiting to sync')).toHaveTextContent('+3');
  });

  it('uses singular wording for one pending write', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'supabase' });
    useOfflineWriteQueueSize.mockReturnValue(1);
    render(<SyncStatusPill />);
    expect(screen.getByLabelText('1 write waiting to sync')).toHaveTextContent('+1');
  });

  it('hides the pending pill when the queue is empty', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'supabase' });
    useOfflineWriteQueueSize.mockReturnValue(0);
    render(<SyncStatusPill />);
    expect(screen.queryByLabelText(/waiting to sync/)).toBeNull();
  });
});
