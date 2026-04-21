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

  it('supports row click and keyboard selection when handler is provided', () => {
    const onOpenItem = vi.fn();
    const items = [
      { id: 'c-2', title: 'Weekly update', platform: 'Blog', status: 'Scheduled' },
    ];

    const { getAllByRole } = render(
      <ContentTable items={items} onOpenItem={onOpenItem} />,
    );

    const rows = getAllByRole('row');
    const contentRow = rows[1];

    fireEvent.click(contentRow);
    expect(onOpenItem).toHaveBeenCalledWith(items[0]);

    fireEvent.keyDown(contentRow, { key: 'Enter' });
    expect(onOpenItem).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(contentRow, { key: ' ' });
    expect(onOpenItem).toHaveBeenCalledTimes(3);
  });

  it('keeps interaction behavior stable with larger datasets', () => {
    const onOpenItem = vi.fn();
    const items = Array.from({ length: 200 }, (_, index) => ({
      id: `c-${index + 1}`,
      title: `Content Item ${index + 1}`,
      platform: 'LinkedIn',
      status: index % 2 === 0 ? 'Drafting' : 'Scheduled',
    }));

    const { getAllByRole } = render(
      <ContentTable items={items} onOpenItem={onOpenItem} />,
    );

    const rows = getAllByRole('row');
    expect(rows).toHaveLength(201);

    const lastRow = rows[200];
    fireEvent.keyDown(lastRow, { key: 'Enter' });

    expect(onOpenItem).toHaveBeenCalledWith(items[199]);
  });

  it('returns null when items are not an array', () => {
    const { container } = render(
      <ContentTable items={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
