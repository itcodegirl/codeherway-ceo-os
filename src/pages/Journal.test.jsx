import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Journal from './Journal';

function readStoredData(key) {
  return JSON.parse(window.localStorage.getItem(key)).data;
}

describe('src/pages/Journal', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all daily prompts', () => {
    render(
      <MemoryRouter>
        <Journal />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Journal' })).toBeInTheDocument();
    expect(screen.getByLabelText('What is on my mind?')).toBeInTheDocument();
    expect(screen.getByLabelText('What feels heavy?')).toBeInTheDocument();
    expect(screen.getByLabelText('What is one thing I can do next?')).toBeInTheDocument();
    expect(screen.getByLabelText('What would make today feel successful?')).toBeInTheDocument();
  });

  it('debounces and auto-saves prompt responses locally after the debounce window', () => {
    render(
      <MemoryRouter>
        <Journal />
      </MemoryRouter>,
    );

    const nextThing = screen.getByLabelText('What is one thing I can do next?');
    fireEvent.change(nextThing, { target: { value: 'Draft one outreach message' } });

    // Mid-debounce: nothing has been persisted yet, but the inline status
    // should advertise the pending save so the user knows their work
    // is still in flight.
    expect(window.localStorage.getItem('ceo-os-journal-entries')).toBeNull();
    expect(screen.getByText('Saving your reflection…')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(700);
    });

    const storagePayload = window.localStorage.getItem('ceo-os-journal-entries') || '';
    expect(storagePayload).toContain('Draft one outreach message');
    expect(screen.getByText('Saved.')).toBeInTheDocument();
  });

  it('flushes the pending save when the user blurs the field', () => {
    render(
      <MemoryRouter>
        <Journal />
      </MemoryRouter>,
    );

    const onMyMind = screen.getByLabelText('What is on my mind?');
    fireEvent.change(onMyMind, { target: { value: 'Captured immediately on blur' } });
    fireEvent.blur(onMyMind);

    const storagePayload = window.localStorage.getItem('ceo-os-journal-entries') || '';
    expect(storagePayload).toContain('Captured immediately on blur');
  });

  it('promotes the journal next-thing into a reminder via the inline button', () => {
    render(
      <MemoryRouter>
        <Journal />
      </MemoryRouter>,
    );

    const nextThingInput = screen.getByLabelText('What is one thing I can do next?');
    const button = screen.getByRole('button', { name: /make a reminder from this/i });
    expect(button).toBeDisabled();

    fireEvent.change(nextThingInput, { target: { value: 'Send Sarah the recap' } });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    const remindersRaw = window.localStorage.getItem('ceo-os-reminders');
    expect(remindersRaw).toBeTruthy();
    const reminders = readStoredData('ceo-os-reminders');
    expect(reminders).toHaveLength(1);
    expect(reminders[0].text).toBe('Send Sarah the recap');
  });

  it('pauses autosave status when a journal entry cannot be saved', () => {
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('storage full');
    });

    try {
      render(
        <MemoryRouter>
          <Journal />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText('What is on my mind?'), {
        target: { value: 'Unsaved reflection' },
      });

      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(screen.getByRole('alert')).toHaveTextContent('Unable to auto-save journal entry right now.');
      expect(screen.getByRole('status')).toHaveTextContent(
        'Autosave is paused. Your latest journal changes are not saved yet.',
      );
    } finally {
      window.localStorage.setItem = originalSetItem;
    }
  });
});
