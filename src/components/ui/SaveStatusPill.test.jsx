import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SaveStatusPill from './SaveStatusPill';
import { notifySaveFailed, notifySaveSucceeded } from '../../lib/saveStatusBus';

describe('SaveStatusPill', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing before any save event', () => {
    const { container } = render(<SaveStatusPill />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a saved label after a successful save', () => {
    render(<SaveStatusPill />);
    act(() => {
      notifySaveSucceeded('ceo-os-test');
    });
    expect(screen.getByTestId('save-status-pill')).toHaveTextContent('Saved');
  });

  it('shows a sticky failure label when a save fails', () => {
    render(<SaveStatusPill />);
    act(() => {
      notifySaveFailed('ceo-os-test', new Error('quota exceeded'));
    });
    const pill = screen.getByTestId('save-status-pill');
    expect(pill).toHaveTextContent('Save failed');
    expect(pill).toHaveAttribute('title', expect.stringContaining('quota exceeded'));
  });

  it('keeps the failure visible until the next successful save', () => {
    render(<SaveStatusPill />);
    act(() => {
      notifySaveFailed('ceo-os-test', new Error('boom'));
    });
    expect(screen.getByTestId('save-status-pill')).toHaveTextContent('Save failed');
    act(() => {
      notifySaveSucceeded('ceo-os-test');
    });
    expect(screen.getByTestId('save-status-pill')).toHaveTextContent('Saved');
  });
});
