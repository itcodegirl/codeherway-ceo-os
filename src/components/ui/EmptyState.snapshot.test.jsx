import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptyState from './EmptyState';

describe('EmptyState snapshots', () => {
  it('matches empty state snapshot without action', () => {
    const { container } = render(
      <EmptyState
        title="No opportunities yet"
        description="Add your first opportunity to start tracking outreach and next steps."
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches empty state snapshot with action', () => {
    const { container } = render(
      <EmptyState
        title="No content items yet"
        description="Add your first draft to begin tracking your publishing pipeline."
        action={<button type="button">Add Content</button>}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
