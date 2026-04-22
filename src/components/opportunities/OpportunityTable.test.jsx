import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OpportunityTable from './OpportunityTable';

describe('OpportunityTable', () => {
  it('opens an item when an interactive row is activated with Enter', () => {
    const onSelect = vi.fn();
    const item = {
      id: 'opp-1',
      name: 'Partnership Expansion',
      company: 'Acme',
      priority: 'High',
      stage: 'In Progress',
      nextStep: 'Send follow-up',
    };

    render(<OpportunityTable items={[item]} onSelect={onSelect} />);

    const row = screen.getByText('Partnership Expansion').closest('tr');
    expect(row).toBeTruthy();

    fireEvent.keyDown(row, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(item);
  });
});
