import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Journal from './Journal';

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
});
