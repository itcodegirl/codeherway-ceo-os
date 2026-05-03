import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StickyNoteCard from './StickyNoteCard';

const fakeFormatCategoryLabel = (category) => {
  const value = String(category || '').trim();
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : 'Idea';
};

const fakeFormatRelativeDate = () => 'Just now';

const baseProps = {
  note: { id: 'note-1', text: 'Test sticky', category: 'idea', updatedAt: 0 },
  categoryOptions: ['idea', 'task', 'content', 'opportunity', 'journal'],
  formatCategoryLabel: fakeFormatCategoryLabel,
  formatRelativeDate: fakeFormatRelativeDate,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe('StickyNoteCard', () => {
  it('renders text, category tag, and the always-on Delete action', () => {
    render(<StickyNoteCard {...baseProps} />);

    expect(screen.getByDisplayValue('Test sticky')).toBeInTheDocument();
    // The category tag renders its label inside .sticky-note__tag.
    expect(document.querySelector('.sticky-note__tag')).toHaveTextContent('Idea');
    expect(screen.getByRole('button', { name: 'Delete Idea note' })).toBeInTheDocument();
  });

  it('only renders promotion buttons when their handlers are supplied', () => {
    render(<StickyNoteCard {...baseProps} />);
    expect(screen.queryByRole('button', { name: /Make a reminder/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Track .* opportunity/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Draft .* on Content OS/ })).toBeNull();
  });

  it('renders all four promotion buttons when handlers are supplied', () => {
    render(<StickyNoteCard
      {...baseProps}
      onPromoteToReminder={vi.fn()}
      onPromoteToOpportunity={vi.fn()}
      onPromoteToContentDraft={vi.fn()}
    />);

    expect(screen.getByRole('button', { name: 'Make a reminder from Idea note' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Track Idea note as a new opportunity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Draft Idea note on Content OS' })).toBeInTheDocument();
  });

  it('forwards text edits and category changes through onEdit', () => {
    const onEdit = vi.fn();
    render(<StickyNoteCard {...baseProps} onEdit={onEdit} />);

    fireEvent.change(screen.getByDisplayValue('Test sticky'), {
      target: { value: 'Test sticky updated' },
    });
    expect(onEdit).toHaveBeenLastCalledWith('note-1', {
      text: 'Test sticky updated',
      category: 'idea',
    });

    fireEvent.change(screen.getByLabelText('Edit note category'), {
      target: { value: 'task' },
    });
    expect(onEdit).toHaveBeenLastCalledWith('note-1', {
      text: 'Test sticky',
      category: 'task',
    });
  });

  it('invokes onDelete with the note id', () => {
    const onDelete = vi.fn();
    render(<StickyNoteCard {...baseProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Idea note' }));
    expect(onDelete).toHaveBeenCalledWith('note-1');
  });
});
