import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SourceStatusNotice from './SourceStatusNotice';

describe('SourceStatusNotice', () => {
  it('renders default local source copy', () => {
    render(<SourceStatusNotice source="local" />);

    expect(screen.getByText('Sample data - configure Supabase to use real data.')).toBeInTheDocument();
  });

  it('renders default supabase source copy', () => {
    render(<SourceStatusNotice source="supabase" />);

    expect(screen.getByText('Data source: Supabase (live persistence).')).toBeInTheDocument();
  });

  it('renders retry action when load error and handler are provided', () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);

    render(
      <SourceStatusNotice
        source="local"
        loadError="Unable to refresh data."
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry loading data' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to refresh data.');
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
