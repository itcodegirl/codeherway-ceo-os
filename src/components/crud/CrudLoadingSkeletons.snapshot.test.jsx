import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CrudCardGridLoadingSkeleton, CrudTableLoadingSkeleton } from './CrudLoadingSkeletons';

describe('CrudLoadingSkeletons snapshots', () => {
  it('matches table loading skeleton snapshot', () => {
    const { container } = render(
      <CrudTableLoadingSkeleton
        ariaLabel="Opportunity pipeline"
        loadingMessage="Loading pipeline rows."
        rows={2}
        columns={[
          { key: 'opportunity', label: 'Opportunity', dataLabel: 'Opportunity' },
          { key: 'company', label: 'Company', dataLabel: 'Company' },
          { key: 'priority', label: 'Priority', dataLabel: 'Priority' },
          { key: 'stage', label: 'Stage / Next Step', dataLabel: 'Stage / Next Step' },
        ]}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches card-grid loading skeleton snapshot', () => {
    const { container } = render(
      <CrudCardGridLoadingSkeleton
        className="content-board"
        ariaLabel="Publishing workflow cards"
        loadingMessage="Loading content cards."
        cards={2}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
