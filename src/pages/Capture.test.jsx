import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('connects capture composer errors to the note field accessibly', () => {
    render(
      <MemoryRouter>
        <Capture />
      </MemoryRouter>,
    );

    const noteField = screen.getByLabelText('Note');

    expect(noteField).toHaveAccessibleDescription('Capture one thought, task, or idea at a time.');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Auto-saved locally and ready whenever your brain moves fast.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save sticky note' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Add a quick note before saving.');
    expect(noteField).toHaveAttribute('aria-invalid', 'true');
    expect(noteField).toHaveAccessibleDescription(
      'Capture one thought, task, or idea at a time. Add a quick note before saving.',
    );
    expect(noteField).toHaveFocus();
  });

  it('clears composer errors as soon as the note draft changes', () => {
    render(
      <MemoryRouter>
        <Capture />
      </MemoryRouter>,
    );

    const noteField = screen.getByLabelText('Note');

    fireEvent.click(screen.getByRole('button', { name: 'Save sticky note' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Add a quick note before saving.');

    fireEvent.change(noteField, {
      target: { value: 'Capture the next sales call idea' },
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(noteField).not.toHaveAttribute('aria-invalid');
    expect(noteField).toHaveAccessibleDescription('Capture one thought, task, or idea at a time.');
  });

  it('drafts a sticky note as a new content item via the per-note action', async () => {
    render(
      <MemoryRouter>
        <Capture />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Note'), {
      target: { value: 'Q3 launch retrospective post' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'content' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save sticky note' }));

    fireEvent.click(screen.getByRole('button', {
      name: 'Draft Content note on Content OS',
    }));

    expect(await screen.findByText(/Drafted on Content OS/)).toBeInTheDocument();

    const contentRaw = window.localStorage.getItem('ceo-os-content-items');
    expect(contentRaw).toBeTruthy();
    const contentItems = JSON.parse(contentRaw);
    const drafted = contentItems.find((entry) => entry.title === 'Q3 launch retrospective post');
    expect(drafted).toBeDefined();
    expect(drafted.status).toBe('Drafting');
    expect(drafted.platform).toBe('');

    expect(screen.getByDisplayValue('Q3 launch retrospective post')).toBeInTheDocument();
  });

  it('tracks a sticky note as a new opportunity via the per-note action', async () => {
    render(
      <MemoryRouter>
        <Capture />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Note'), {
      target: { value: 'Acme partnership intro from Sarah' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'opportunity' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save sticky note' }));

    fireEvent.click(screen.getByRole('button', {
      name: 'Track Opportunity note as a new opportunity',
    }));

    expect(await screen.findByText(/Tracked as a new opportunity/)).toBeInTheDocument();

    const opportunitiesRaw = window.localStorage.getItem('ceo-os-opportunities');
    expect(opportunitiesRaw).toBeTruthy();
    const opportunities = JSON.parse(opportunitiesRaw);
    const tracked = opportunities.find((entry) => entry.name === 'Acme partnership intro from Sarah');
    expect(tracked).toBeDefined();
    expect(tracked.priority).toBe('Medium');
    expect(tracked.stage).toBe('New');
    expect(tracked.company).toBe('');
    expect(tracked.nextStep).toBe('');

    // The original sticky note stays so the user can keep the long-form context.
    expect(screen.getByDisplayValue('Acme partnership intro from Sarah')).toBeInTheDocument();
  });

  it('does not duplicate opportunities when Track opportunity is double-clicked', async () => {
    render(
      <MemoryRouter>
        <Capture />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Note'), {
      target: { value: 'Conference recap follow-ups' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save sticky note' }));

    const trackButton = screen.getByRole('button', {
      name: /Track .* note as a new opportunity/,
    });

    fireEvent.click(trackButton);
    fireEvent.click(trackButton);
    fireEvent.click(trackButton);

    expect(await screen.findByText(/Tracked as a new opportunity/)).toBeInTheDocument();

    const opportunitiesRaw = window.localStorage.getItem('ceo-os-opportunities');
    const opportunities = JSON.parse(opportunitiesRaw);
    const matching = opportunities.filter((entry) => entry.name === 'Conference recap follow-ups');
    expect(matching).toHaveLength(1);
  });

  it('promotes a sticky note into a reminder via the per-note action', async () => {
    render(
      <MemoryRouter>
        <Capture />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Note'), {
      target: { value: 'Reply to Sarah by Friday' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save sticky note' }));

    fireEvent.click(screen.getByRole('button', { name: 'Make a reminder from Idea note' }));

    expect(await screen.findByText(/Added a reminder from this note/)).toBeInTheDocument();

    const remindersRaw = window.localStorage.getItem('ceo-os-reminders');
    expect(remindersRaw).toBeTruthy();
    const reminders = JSON.parse(remindersRaw);
    expect(reminders).toHaveLength(1);
    expect(reminders[0].text).toBe('Reply to Sarah by Friday');
    expect(reminders[0].isDone).toBe(false);

    // The original sticky note stays — the audit copy says "the sticky stays here".
    expect(screen.getByDisplayValue('Reply to Sarah by Friday')).toBeInTheDocument();
  });

  it('pauses autosave confidence copy when a sticky note cannot be saved', () => {
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('storage full');
    });

    try {
      render(
        <MemoryRouter>
          <Capture />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText('Note'), {
        target: { value: 'This needs to survive' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save sticky note' }));

      expect(screen.getByRole('alert')).toHaveTextContent('Unable to save this note right now.');
      expect(screen.getByText('Autosave is paused until sticky notes save successfully again.')).toBeInTheDocument();
    } finally {
      window.localStorage.setItem = originalSetItem;
    }
  });
});
