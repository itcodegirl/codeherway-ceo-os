import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LocalOnlyNotice from './LocalOnlyNotice';

vi.mock('../../hooks/useWorkspaceSettings', () => ({
  useWorkspaceSettings: vi.fn(),
}));

import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';

const DISMISS_KEY = 'ceo-os-local-only-notice-dismissed-v1';

describe('LocalOnlyNotice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.removeItem(DISMISS_KEY);
  });

  afterEach(() => {
    window.localStorage.removeItem(DISMISS_KEY);
  });

  it('renders nothing when the workspace is syncing to Supabase', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'supabase' });
    const { container } = render(<LocalOnlyNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an explanatory notice when the workspace is local-only', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'local' });
    render(<LocalOnlyNotice />);
    expect(screen.getByTestId('local-only-notice')).toHaveTextContent('local-only');
  });

  it('persists dismissal so the notice stays hidden across renders', () => {
    useWorkspaceSettings.mockReturnValue({ source: 'local' });
    const { rerender } = render(<LocalOnlyNotice />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss local-only notice/i }));
    expect(screen.queryByTestId('local-only-notice')).toBeNull();

    rerender(<LocalOnlyNotice />);
    expect(screen.queryByTestId('local-only-notice')).toBeNull();
    expect(window.localStorage.getItem(DISMISS_KEY)).toBe('1');
  });
});
