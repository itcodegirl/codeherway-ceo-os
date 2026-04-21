import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OpportunityTable from './OpportunityTable';

describe('OpportunityTable', () => {
  it('renders a semantic table for opportunities', () => {
    const items = [
      {
        id: 'o-1',
        name: 'Partnership Call',
        company: 'Acme',
        priority: 'High',
        stage: 'In Progress',
        nextStep: 'Follow up notes',
      },
    ];

    const { getByRole, getAllByRole } = render(
      <OpportunityTable items={items} />,
    );

    const table = getByRole('table', { name: 'Opportunity pipeline' });
    const rows = getAllByRole('row');

    expect(table).toBeTruthy();
    expect(rows).toHaveLength(2);
    expect(table).toHaveTextContent('Partnership Call');
  });

  it('supports row click and keyboard selection when handler is provided', () => {
    const onSelect = vi.fn();
    const item = {
      id: 'o-2',
      name: 'Hiring role',
      company: 'Bright Labs',
      priority: 'Medium',
      stage: 'Awaiting Reply',
      nextStep: 'Coordinate interviewer',
    };

    const { getAllByRole } = render(
      <OpportunityTable items={[item]} onSelect={onSelect} />,
    );

    const rows = getAllByRole('row');
    const opportunityRow = rows[1];

    fireEvent.click(opportunityRow);
    expect(onSelect).toHaveBeenCalledWith(item);

    fireEvent.keyDown(opportunityRow, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(opportunityRow, { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('returns null when items are not an array', () => {
    const { container } = render(<OpportunityTable items={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});