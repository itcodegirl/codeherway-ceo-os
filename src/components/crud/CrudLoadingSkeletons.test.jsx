import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CrudCardGridLoadingSkeleton, CrudTableLoadingSkeleton } from './CrudLoadingSkeletons';

describe('CrudLoadingSkeletons', () => {
  it('renders a table skeleton with declared columns and loading announcement', () => {
    render(
      <CrudTableLoadingSkeleton
        ariaLabel="Opportunity pipeline"
        loadingMessage="Loading pipeline rows."
        rows={2}
        columns={[
          { key: 'opportunity', label: 'Opportunity' },
          { key: 'company', label: 'Company' },
        ]}
      />,
    );

    expect(screen.getByRole('table', { name: 'Opportunity pipeline' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading pipeline rows.')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Opportunity' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
  });

  it('renders a card-grid skeleton with expected list semantics', () => {
    render(
      <CrudCardGridLoadingSkeleton
        className="content-board"
        ariaLabel="Publishing workflow cards"
        loadingMessage="Loading content cards."
        cards={2}
      />,
    );

    expect(screen.getByRole('list', { name: 'Publishing workflow cards' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading content cards.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
