import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ContentTable from './ContentTable';

describe('ContentTable', () => {
  it('opens an item when an interactive row is activated with Space', () => {
    const onOpenItem = vi.fn();
    const item = {
      id: 'content-1',
      title: 'Founder Update',
      platform: 'LinkedIn',
      status: 'Drafting',
    };

    render(<ContentTable items={[item]} onOpenItem={onOpenItem} />);

    const row = screen.getByText('Founder Update').closest('tr');
    expect(row).toBeTruthy();

    fireEvent.keyDown(row, { key: ' ' });

    expect(onOpenItem).toHaveBeenCalledTimes(1);
    expect(onOpenItem).toHaveBeenCalledWith(item);
  });
});
