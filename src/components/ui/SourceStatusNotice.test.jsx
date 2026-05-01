import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SOURCE_NOTICE_SAMPLE_DATA } from '../../lib/uiCopy';
import SourceStatusNotice from './SourceStatusNotice';

describe('SourceStatusNotice', () => {
  it('renders local source copy by default', () => {
    render(<SourceStatusNotice />);

    expect(screen.getByText(SOURCE_NOTICE_SAMPLE_DATA)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(SOURCE_NOTICE_SAMPLE_DATA);
  });

  it('renders supabase source copy when source is supabase', () => {
    render(
      <SourceStatusNotice
        source="supabase"
        supabaseText="Weekly data source: Supabase."
      />,
    );

    expect(screen.getByText('Weekly data source: Supabase.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Weekly data source: Supabase.');
  });

  it('shows alert and retry action when loadError is present', () => {
    const onRetry = vi.fn();

    render(
      <SourceStatusNotice
        loadError="Unable to load weekly brief right now."
        onRetry={onRetry}
        retryAriaLabel="Retry loading weekly dashboard data"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load weekly brief right now.');

    fireEvent.click(screen.getByRole('button', { name: 'Retry loading weekly dashboard data' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry action when no retry callback is provided', () => {
    render(<SourceStatusNotice loadError="Source unavailable" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Source unavailable');
    expect(screen.queryByRole('button', { name: 'Retry loading data' })).not.toBeInTheDocument();
  });
});
