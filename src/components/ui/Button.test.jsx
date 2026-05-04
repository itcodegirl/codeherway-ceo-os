import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';

describe('Button loading state', () => {
  it('marks the button busy and disables clicks while loading', () => {
    const handleClick = vi.fn();
    render(
      <Button loading onClick={handleClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders the spinner instead of the trailing icon while loading', () => {
    const { container, rerender } = render(
      <Button icon={{ name: 'check' }}>Save</Button>,
    );
    expect(container.querySelector('.action-button__icon')).toBeTruthy();
    expect(container.querySelector('.action-button__spinner')).toBeNull();

    rerender(
      <Button loading icon={{ name: 'check' }}>Save</Button>,
    );
    expect(container.querySelector('.action-button__spinner')).toBeTruthy();
    expect(container.querySelector('.action-button__icon')).toBeNull();
  });
});
