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

  it('supports row click and semantic button activation when handler is provided', () => {
    const onSelect = vi.fn();
    const item = {
      id: 'o-2',
      name: 'Hiring role',
      company: 'Bright Labs',
      priority: 'Medium',
      stage: 'Awaiting Reply',
      nextStep: 'Coordinate interviewer',
    };

    const { getAllByRole, getByText } = render(
      <OpportunityTable items={[item]} onSelect={onSelect} />,
    );

    const rows = getAllByRole('row');
    const opportunityRow = rows[1];
    const openButton = getAllByRole('button', { name: /Open/i })[0];

    expect(getByText('Click any row or press Enter/Space to view details.')).toBeInTheDocument();

    fireEvent.click(opportunityRow);
    expect(onSelect).toHaveBeenCalledWith(item);

    fireEvent.click(openButton);
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('supports row keyboard activation with Enter and Space', () => {
    const onSelect = vi.fn();
    const item = {
      id: 'o-3',
      name: 'Process audit',
      company: 'Northwind',
      priority: 'High',
      stage: 'In Progress',
      nextStep: 'Schedule review',
    };

    const { getAllByRole } = render(
      <OpportunityTable items={[item]} onSelect={onSelect} />,
    );

    const rows = getAllByRole('row');
    const interactiveRow = rows[1];

    fireEvent.keyDown(interactiveRow, { key: 'Enter' });
    fireEvent.keyDown(interactiveRow, { key: ' ' });

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenNthCalledWith(1, item);
    expect(onSelect).toHaveBeenNthCalledWith(2, item);
  });

  it('ignores row keyboard handler when keydown originates from open button', () => {
    const onSelect = vi.fn();
    const item = {
      id: 'o-4',
      name: 'Retention plan',
      company: 'Acme',
      priority: 'Medium',
      stage: 'Awaiting Reply',
      nextStep: 'Draft proposal',
    };

    const { getAllByRole } = render(
      <OpportunityTable items={[item]} onSelect={onSelect} />,
    );

    const openButton = getAllByRole('button', { name: /Open/i })[0];

    fireEvent.keyDown(openButton, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledTimes(0);

    fireEvent.click(openButton);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(item);
  });

  it('keeps interaction behavior stable with larger datasets', () => {
    const onSelect = vi.fn();
    const items = Array.from({ length: 200 }, (_, index) => ({
      id: `o-${index + 1}`,
      name: `Opportunity ${index + 1}`,
      company: `Company ${index + 1}`,
      priority: index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low',
      stage: index % 2 === 0 ? 'In Progress' : 'Awaiting Reply',
      nextStep: 'Follow up',
    }));

    const { getAllByRole, container } = render(
      <OpportunityTable items={items} onSelect={onSelect} />,
    );

    const rows = getAllByRole('row');
    expect(rows).toHaveLength(201);

    const openButtons = container.querySelectorAll('.crm-table__open-button');
    expect(openButtons).toHaveLength(200);
    const lastOpenButton = openButtons[199];
    fireEvent.click(lastOpenButton);

    expect(onSelect).toHaveBeenCalledWith(items[199]);
  });

  it('returns null when items are not an array', () => {
    const { container } = render(<OpportunityTable items={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an aging hint for an opportunity awaiting reply > 7 days', () => {
    const updatedAt = Date.now() - 12 * 24 * 60 * 60 * 1000;
    const item = {
      id: 'o-aged',
      name: 'Investor intro',
      company: 'Skylark',
      priority: 'Medium',
      stage: 'Awaiting Reply',
      nextStep: 'Send a nudge',
      updatedAt,
    };

    const { getByLabelText, getByText } = render(
      <OpportunityTable items={[item]} />,
    );

    // The visible text is short ("Waiting 12d") while the aria-label
    // expands the abbreviation for screen readers.
    expect(getByText('Waiting 12d')).toBeInTheDocument();
    expect(getByLabelText(/Awaiting reply for 12 days/)).toBeInTheDocument();
  });

  it('does not render an aging hint within the 7-day window', () => {
    const updatedAt = Date.now() - 2 * 24 * 60 * 60 * 1000;
    const item = {
      id: 'o-fresh',
      name: 'Recent ask',
      company: 'Skylark',
      priority: 'Low',
      stage: 'Awaiting Reply',
      nextStep: 'Follow up later',
      updatedAt,
    };

    const { queryByText } = render(<OpportunityTable items={[item]} />);

    expect(queryByText(/Waiting \d+d/)).toBeNull();
  });

  it('only surfaces the aging hint for "Awaiting Reply" stages', () => {
    const updatedAt = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const item = {
      id: 'o-in-progress',
      name: 'Active deal',
      company: 'Skylark',
      priority: 'High',
      stage: 'In Progress',
      nextStep: 'Ship demo',
      updatedAt,
    };

    const { queryByText } = render(<OpportunityTable items={[item]} />);

    expect(queryByText(/Waiting \d+d/)).toBeNull();
  });
});
