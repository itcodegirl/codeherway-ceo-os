import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Capture from './Capture';

describe('src/pages/Capture', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders empty state when no notes exist', () => {
    render(
      <MemoryRouter>
        <Capture />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Capture' })).toBeInTheDocument();
    expect(screen.getByText('No sticky notes yet')).toBeInTheDocument();
  });

  it('creates, edits, and deletes a sticky note with local persistence', () => {
    render(
      <MemoryRouter>
        <Capture />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Note'), {
      target: { value: 'Ship newsletter outline' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'content' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save sticky note' }));

    const noteEditor = screen.getByDisplayValue('Ship newsletter outline');
    expect(noteEditor).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Content note' })).toBeInTheDocument();

    fireEvent.change(noteEditor, {
      target: { value: 'Ship newsletter intro paragraph' },
    });
    expect(screen.getByDisplayValue('Ship newsletter intro paragraph')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Content note' }));
    expect(screen.getByText('No sticky notes yet')).toBeInTheDocument();
  });
});
