import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BlockersPanel from './BlockersPanel';

describe('BlockersPanel', () => {
  it('renders each blocker as a list item', () => {
    render(<BlockersPanel blockerItems={['Acme legal review', 'Hiring contract draft']} />);

    expect(screen.getByText('Acme legal review')).toBeInTheDocument();
    expect(screen.getByText('Hiring contract draft')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows an affirmative empty state instead of an empty bullet list', () => {
    render(<BlockersPanel blockerItems={[]} />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Nothing is blocking you right now/i),
    ).toBeInTheDocument();
  });

  it('tolerates a missing blockers prop without crashing', () => {
    render(<BlockersPanel />);

    expect(
      screen.getByText(/Nothing is blocking you right now/i),
    ).toBeInTheDocument();
  });
});
