import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SyncStatusPill from './SyncStatusPill';

vi.mock('../../hooks/useWorkspaceSettings', () => ({
  useWorkspaceSettings: vi.fn(),
}));

import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';

describe('SyncStatusPill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the synced state when source is supabase', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'supabase' });
    render(<SyncStatusPill />);
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('renders the local-only state when source is local', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'local' });
    render(<SyncStatusPill />);
    expect(screen.getByText('Local only')).toBeInTheDocument();
  });

  it('falls back to local-only when source is unknown', () => {
    useWorkspaceSettings.mockReturnValue({ source: undefined });
    render(<SyncStatusPill />);
    expect(screen.getByText('Local only')).toBeInTheDocument();
  });
});
