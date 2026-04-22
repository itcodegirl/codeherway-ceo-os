import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContentCrudPage from './ContentCrudPage';

vi.mock('../../hooks/useCrudPage', () => ({
  useCrudPage: vi.fn(),
}));

vi.mock('../../lib/contentRepository', () => ({
  createContentItem: vi.fn(),
  deleteContentItem: vi.fn(),
  getContentSource: vi.fn(),
  listContentItems: vi.fn(),
  updateContentItem: vi.fn(),
}));

import { useCrudPage } from '../../hooks/useCrudPage';
import { getContentSource } from '../../lib/contentRepository';

function createCrudState(overrides = {}) {
  return {
    isLoading: false,
    items: [],
    selectedItem: null,
    setSelectedItem: vi.fn(),
    isFormOpen: false,
    isDeleteConfirmOpen: false,
    isSaving: false,
    isDeleting: false,
    formValues: {
      title: '',
      platform: '',
      status: 'Drafting',
    },
    formError: '',
    loadError: '',
    handleOpenCreateModal: vi.fn(),
    handleOpenEditModal: vi.fn(),
    handleCloseFormModal: vi.fn(),
    handleFormChange: vi.fn(),
    handleFormSubmit: vi.fn((event) => event?.preventDefault?.()),
    handleOpenDeleteConfirm: vi.fn(),
    handleCloseDeleteConfirm: vi.fn(),
    handleConfirmDeleteSelected: vi.fn(),
    deletePrompt: 'Delete this item? This cannot be undone.',
    ...overrides,
  };
}

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ContentCrudPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state with source note and board skeleton', () => {
    useCrudPage.mockReturnValue(
      createCrudState({
        isLoading: true,
      }),
    );
    getContentSource.mockReturnValue('local');

    renderWithRouter(<ContentCrudPage />);

    expect(screen.getByRole('heading', { name: 'Content OS' })).toBeInTheDocument();
    expect(screen.getByText('Loading content board data.')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Publishing workflow cards' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Sample data - configure Supabase to use real data.')).toBeInTheDocument();
  });

  it('renders empty and error state content when there are no items', () => {
    useCrudPage.mockReturnValue(
      createCrudState({
        loadError: 'Unable to load content items right now.',
        items: [],
      }),
    );
    getContentSource.mockReturnValue('supabase');

    renderWithRouter(<ContentCrudPage />);

    expect(screen.getByText('Data source: Supabase (live persistence).')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load content items right now.');
    expect(screen.getByText('No content items yet')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /add content/i }).length).toBeGreaterThan(0);
  });

  it('renders content rows when data is available', () => {
    useCrudPage.mockReturnValue(
      createCrudState({
        items: [
          {
            id: 'content-1',
            title: 'Founder Weekly Brief',
            platform: 'LinkedIn',
            status: 'Editing',
          },
        ],
      }),
    );
    getContentSource.mockReturnValue('local');

    renderWithRouter(<ContentCrudPage />);

    expect(screen.getByRole('table', { name: 'Content pipeline' })).toBeInTheDocument();
    expect(screen.getByText('Founder Weekly Brief')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });
});
