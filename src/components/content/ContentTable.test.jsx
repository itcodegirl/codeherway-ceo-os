import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ContentTable from './ContentTable';

describe('ContentTable', () => {
  it('renders a semantic table for content items', () => {
    const items = [
      { id: 'c-1', title: 'Post draft', platform: 'LinkedIn', status: 'Drafting' },
    ];
    const { getByRole, getAllByRole } = render(
      <ContentTable items={items} />,
    );

    const table = getByRole('table', { name: 'Content pipeline' });
    const rows = getAllByRole('row');

    expect(table).toBeTruthy();
    expect(rows).toHaveLength(2);
    expect(table).toHaveTextContent('Post draft');
  });

  it('supports row click and semantic button activation when handler is provided', () => {
    const onOpenItem = vi.fn();
    const items = [
      { id: 'c-2', title: 'Weekly update', platform: 'Blog', status: 'Scheduled' },
    ];

    const { getAllByRole } = render(
      <ContentTable items={items} onOpenItem={onOpenItem} />,
    );

    const rows = getAllByRole('row');
    const contentRow = rows[1];
    const openButton = getAllByRole('button', { name: /Open/i })[0];

    fireEvent.click(contentRow);
    expect(onOpenItem).toHaveBeenCalledWith(items[0]);

    fireEvent.click(openButton);
    expect(onOpenItem).toHaveBeenCalledTimes(2);
  });

  it('keeps interaction behavior stable with larger datasets', () => {
    const onOpenItem = vi.fn();
    const items = Array.from({ length: 200 }, (_, index) => ({
      id: `c-${index + 1}`,
      title: `Content Item ${index + 1}`,
      platform: 'LinkedIn',
      status: index % 2 === 0 ? 'Drafting' : 'Scheduled',
    }));

    const { getAllByRole, container } = render(
      <ContentTable items={items} onOpenItem={onOpenItem} />,
    );

    const rows = getAllByRole('row');
    expect(rows).toHaveLength(201);

    const openButtons = container.querySelectorAll('.crm-table__open-button');
    expect(openButtons).toHaveLength(200);
    const lastOpenButton = openButtons[199];
    fireEvent.click(lastOpenButton);

    expect(onOpenItem).toHaveBeenCalledWith(items[199]);
  });

  it('returns null when items are not an array', () => {
    const { container } = render(
      <ContentTable items={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
