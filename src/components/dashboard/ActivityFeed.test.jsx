import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ActivityFeed from './ActivityFeed';

describe('ActivityFeed', () => {
  it('renders an accessible empty state when there are no items', () => {
    render(<ActivityFeed items={[]} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'No activity yet. Add a note or mark a priority complete to begin the feed.',
    );
  });

  it('renders activity entries as a semantic list', () => {
    render(
      <ActivityFeed
        items={[
          {
            id: 'item-1',
            title: 'Priority in motion: Finalize pricing page',
            time: 'Live focus',
            type: 'Planning',
          },
          {
            id: 'item-2',
            title: 'Acme Expansion (In Progress)',
            time: 'Priority: High',
            type: 'Opportunity',
          },
        ]}
      />,
    );

    const activityList = screen.getByRole('list', { name: 'Recent activity feed' });
    const activityItems = within(activityList).getAllByRole('listitem');
    expect(activityItems).toHaveLength(2);
    expect(within(activityItems[0]).getByText('Priority in motion: Finalize pricing page')).toBeInTheDocument();
    expect(within(activityItems[1]).getByText('Priority: High | Opportunity')).toBeInTheDocument();
  });
});
