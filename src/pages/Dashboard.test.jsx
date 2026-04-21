import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    toastMessage: '',
    isToastVisible: false,
    showToast: vi.fn(),
  }),
}));

vi.mock('../hooks/useDashboardData', () => ({
  isLocalDashboardDemoMode: false,
  useDashboardData: vi.fn(),
}));

vi.mock('../hooks/usePersistentState', () => ({
  usePersistentState: vi.fn(),
}));

import Dashboard from './Dashboard';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePersistentState } from '../hooks/usePersistentState';

describe('src/pages/Dashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();

    usePersistentState.mockImplementation((key, initialValue) => {
      if (key === 'ceo-os-weekly-priorities') {
        return [[
          { id: 'p-1', title: 'Finalize pricing page', status: 'In Progress' },
          { id: 'p-2', title: 'Ship onboarding updates', status: 'In Progress' },
          { id: 'p-3', title: 'Review partner terms', status: 'Blocked' },
        ], vi.fn()];
      }

      if (key === 'ceo-os-weekly-blockers') {
        return [[
          { id: 'b-1', text: 'Waiting on legal review.' },
          { id: 'b-2', text: 'Missing benchmark update.' },
        ], vi.fn()];
      }

      return [initialValue, vi.fn()];
    });

    useDashboardData.mockReturnValue({
      opportunityItems: [
        { id: 'o-1', name: 'Acme Expansion', company: 'Acme', priority: 'High', stage: 'Awaiting Reply' },
        { id: 'o-2', name: 'Northwind Pilot', company: 'Northwind', priority: 'Medium', stage: 'In Progress' },
        { id: 'o-3', name: 'Globex Retainer', company: 'Globex', priority: 'Low', stage: 'Discovery' },
      ],
      contentRows: [
        { id: 'c-1', title: 'Founder Letter', platform: 'LinkedIn', status: 'Scheduled' },
        { id: 'c-2', title: 'Roadmap Post', platform: 'Blog', status: 'Editing' },
        { id: 'c-3', title: 'Launch Notes', platform: 'Email', status: 'Drafting' },
      ],
      isDataLoading: false,
    });
  });

  it('renders expected KPI cards and derived focus score details', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    const activeOpportunitiesCard = screen.getByText('Active Opportunities').closest('.stat-card');
    expect(within(activeOpportunitiesCard).getByText('3')).toBeInTheDocument();
    expect(within(activeOpportunitiesCard).getByText('1 in progress')).toBeInTheDocument();

    const contentPipelineCard = screen.getByText('Content in Pipeline').closest('.stat-card');
    expect(within(contentPipelineCard).getByText('3')).toBeInTheDocument();
    expect(within(contentPipelineCard).getByText('1 drafting')).toBeInTheDocument();

    const followUpsCard = screen.getByText('Follow-Ups Due').closest('.stat-card');
    expect(within(followUpsCard).getByText('1')).toBeInTheDocument();
    expect(within(followUpsCard).getByText('1 high priority')).toBeInTheDocument();

    const focusScoreCard = screen.getByText('Weekly Focus Score').closest('.stat-card');
    expect(within(focusScoreCard).getByText('58%')).toBeInTheDocument();
    expect(within(focusScoreCard).getByText('3 active risks')).toBeInTheDocument();

    expect(screen.getAllByText('Finalize pricing page').length).toBeGreaterThan(0);
    expect(screen.getByText('Waiting on legal review.')).toBeInTheDocument();
  });
});
