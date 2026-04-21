import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WeeklyTextList from './WeeklyTextList';

describe('WeeklyTextList', () => {
  it('renders list content and triggers edit/delete actions', () => {
    const onEditItem = vi.fn();
    const onDeleteItem = vi.fn();
    const item = { id: 'win-1', text: 'Shipped launch update', category: 'Execution' };

    render(
      <WeeklyTextList
        items={[item]}
        itemTypeLabel="win"
        getDotClassName={() => 'weekly-list__dot--success'}
        getPrimaryText={(entry) => entry.text}
        getSecondaryText={(entry) => `Category: ${entry.category}`}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
      />,
    );

    expect(screen.getByText('Shipped launch update')).toBeInTheDocument();
    expect(screen.getByText('Category: Execution')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit win Shipped launch update' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete win Shipped launch update' }));

    expect(onEditItem).toHaveBeenCalledWith(item);
    expect(onDeleteItem).toHaveBeenCalledWith(item);
  });
});
