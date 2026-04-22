import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OpportunityCrudPage from './OpportunityCrudPage';

vi.mock('../../hooks/useCrudPage', () => ({
  useCrudPage: vi.fn(),
}));

vi.mock('../../lib/opportunitiesRepository', () => ({
  createOpportunity: vi.fn(),
  deleteOpportunity: vi.fn(),
  getOpportunitiesSource: vi.fn(),
  listOpportunities: vi.fn(),
  updateOpportunity: vi.fn(),
}));

import { useCrudPage } from '../../hooks/useCrudPage';
import { getOpportunitiesSource } from '../../lib/opportunitiesRepository';

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
      name: '',
      company: '',
      priority: 'Medium',
      stage: 'New',
      nextStep: '',
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

describe('OpportunityCrudPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state with source note and pipeline skeleton', () => {
    useCrudPage.mockReturnValue(
      createCrudState({
        isLoading: true,
      }),
    );
    getOpportunitiesSource.mockReturnValue('local');

    renderWithRouter(<OpportunityCrudPage />);

    expect(screen.getByRole('heading', { name: 'Opportunities' })).toBeInTheDocument();
    expect(screen.getByText('Loading opportunities data.')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Opportunity pipeline' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Sample data - configure Supabase to use real data.')).toBeInTheDocument();
  });

  it('renders empty and error state content when there are no opportunities', () => {
    useCrudPage.mockReturnValue(
      createCrudState({
        loadError: 'Unable to load opportunities right now.',
        items: [],
      }),
    );
    getOpportunitiesSource.mockReturnValue('supabase');

    renderWithRouter(<OpportunityCrudPage />);

    expect(screen.getByText('Data source: Supabase (live persistence).')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load opportunities right now.');
    expect(screen.getByText('No opportunities yet')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /add opportunity/i }).length).toBeGreaterThan(0);
  });

  it('renders opportunity rows when data is available', () => {
    useCrudPage.mockReturnValue(
      createCrudState({
        items: [
          {
            id: 'opp-1',
            name: 'Advisory Partnership',
            company: 'Studio North',
            priority: 'High',
            stage: 'In Progress',
            nextStep: 'Send deck follow-up',
          },
        ],
      }),
    );
    getOpportunitiesSource.mockReturnValue('local');

    renderWithRouter(<OpportunityCrudPage />);

    expect(screen.getByRole('table', { name: 'Opportunity pipeline' })).toBeInTheDocument();
    expect(screen.getByText('Advisory Partnership')).toBeInTheDocument();
    expect(screen.getByText('Studio North')).toBeInTheDocument();
  });
});
