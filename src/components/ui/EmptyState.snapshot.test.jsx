import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptyState from './EmptyState';
import Icon from './Icon';

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

  it('renders an optional icon decoration without affecting the announced content', () => {
    const { container, getByText } = render(
      <EmptyState
        icon={<Icon name="opportunities" size={20} />}
        title="No opportunities yet"
        description="Add your first opportunity to start tracking outreach and next steps."
      />,
    );

    const iconWrapper = container.querySelector('.empty-state__icon');
    expect(iconWrapper).not.toBeNull();
    expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
    // Title and description still rendered.
    expect(getByText('No opportunities yet')).toBeInTheDocument();
  });
});
