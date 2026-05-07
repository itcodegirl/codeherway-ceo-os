import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Journal from './Journal';

function readStoredData(key) {
  return JSON.parse(window.localStorage.getItem(key)).data;
}

describe('src/pages/Journal', () => {
  beforeEach(() => {
    window.localStorage.clear();
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

  it('auto-saves prompt responses locally', () => {
    render(
      <MemoryRouter>
        <Journal />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('What is one thing I can do next?'), {
      target: { value: 'Draft one outreach message' },
    });

    const storagePayload = window.localStorage.getItem('ceo-os-journal-entries') || '';
    expect(storagePayload).toContain('Draft one outreach message');
    expect(screen.getByRole('status')).toHaveTextContent('Auto-saved');
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

      expect(screen.getByRole('alert')).toHaveTextContent('Unable to auto-save journal entry right now.');
      expect(screen.getByRole('status')).toHaveTextContent(
        'Autosave is paused. Your latest journal changes are not saved yet.',
      );
    } finally {
      window.localStorage.setItem = originalSetItem;
    }
  });
});
