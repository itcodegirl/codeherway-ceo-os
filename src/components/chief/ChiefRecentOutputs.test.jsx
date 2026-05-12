import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ChiefRecentOutputs from './ChiefRecentOutputs';

describe('ChiefRecentOutputs', () => {
  it('renders nothing when there is no history', () => {
    const { container } = render(<ChiefRecentOutputs responses={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there is only a single output (panel already shows it)', () => {
    const { container } = render(
      <ChiefRecentOutputs responses={[{ id: 'a', title: 'Only one', source: 'proxy' }]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('marks the head response as "Latest" and the rest as "N back"', () => {
    render(
      <ChiefRecentOutputs
        responses={[
          { id: 'a', title: 'Newest', source: 'proxy' },
          { id: 'b', title: 'Older', source: 'proxy' },
          { id: 'c', title: 'Oldest', source: 'fallback' },
        ]}
        selectedId="a"
      />,
    );

    expect(screen.getByText(/Latest · AI generated/)).toBeInTheDocument();
    expect(screen.getByText(/1 back · AI generated/)).toBeInTheDocument();
    expect(screen.getByText(/2 back · Local fallback/)).toBeInTheDocument();
  });

  it('marks the selected entry with aria-pressed=true', () => {
    render(
      <ChiefRecentOutputs
        responses={[
          { id: 'a', title: 'Newest', source: 'proxy' },
          { id: 'b', title: 'Older', source: 'proxy' },
        ]}
        selectedId="b"
      />,
    );

    const activeChip = screen.getByRole('button', { pressed: true });
    expect(activeChip).toHaveTextContent('Older');
  });

  it('calls onSelect with the entry id when a chip is clicked', () => {
    const onSelect = vi.fn();
    render(
      <ChiefRecentOutputs
        responses={[
          { id: 'a', title: 'Newest', source: 'proxy' },
          { id: 'b', title: 'Older', source: 'proxy' },
        ]}
        selectedId="a"
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Open ai generated output "Older"/i }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('falls back to "Executive Output" when the title is blank', () => {
    render(
      <ChiefRecentOutputs
        responses={[
          { id: 'a', title: '   ', source: 'proxy' },
          { id: 'b', title: 'Older', source: 'proxy' },
        ]}
        selectedId="a"
      />,
    );

    expect(screen.getByText('Executive Output')).toBeInTheDocument();
  });
});
