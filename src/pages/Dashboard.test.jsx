import { fireEvent, render, screen } from '@testing-library/react';
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

vi.mock('../hooks/useWeeklyBrief', () => ({
  useWeeklyBrief: vi.fn(),
}));

import Dashboard from './Dashboard';
import { useDashboardData } from '../hooks/useDashboardData';
import { useWeeklyBrief } from '../hooks/useWeeklyBrief';

describe('src/pages/Dashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();

    useWeeklyBrief.mockReturnValue({
      priorities: [
        { id: 'p-1', title: 'Finalize pricing page', status: 'In Progress' },
        { id: 'p-2', title: 'Ship onboarding updates', status: 'Planned' },
        { id: 'p-3', title: 'Review partner terms', status: 'Blocked' },
      ],
      blockers: [
        { id: 'b-1', text: 'Waiting on legal review.' },
      ],
      wins: [
        { id: 'w-1', text: 'Closed speaker slot for founder panel.' },
      ],
      isLoading: false,
      source: 'local',
      loadError: '',
      refreshWeeklyBrief: vi.fn(),
    });

    useDashboardData.mockReturnValue({
      opportunityItems: [
        { id: 'o-1', name: 'Acme Expansion', company: 'Acme', priority: 'High', stage: 'Awaiting Reply' },
      ],
      contentRows: [
        { id: 'c-1', title: 'Founder Letter', platform: 'LinkedIn', status: 'Drafting' },
      ],
      isDataLoading: false,
    });
  });

  it('renders focus command center core sections with supportive copy', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Focus Home' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: "Today's Main Focus" })).toBeInTheDocument();
    expect(screen.getByText('Next Smallest Action')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Blockers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Reminders' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Quick Win' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: "I'm Overwhelmed Reset" })).toBeInTheDocument();
    expect(screen.getByText('Finalize pricing page')).toBeInTheDocument();
    expect(screen.getByText('This blocker may need attention.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add a quick reminder')).toHaveAccessibleDescription(
      'Keep it small enough to finish today. No reminder progress yet.',
    );
    expect(screen.getByText(/You are in execution mode|Clarify one outcome|Look at what worked|You are not behind/i)).toBeInTheDocument();
  });

  it('cycles next move suggestions when asked what to do next', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    const cta = screen.getByRole('button', { name: 'Tell me what to do next' });
    fireEvent.click(cta);

    const nextMovePanel = screen.getByText('Next Smallest Action').closest('.focus-home__next-move');
    expect(nextMovePanel).toHaveTextContent(/Spend 20 focused minutes|Send one unblock message|Draft a concise follow-up/i);
  });

  it('replaces a selected next move when the underlying focus data changes', () => {
    useDashboardData.mockReturnValue({
      opportunityItems: [],
      contentRows: [],
      isDataLoading: false,
    });
    useWeeklyBrief.mockReturnValue({
      priorities: [
        { id: 'p-old', title: 'Blocked Launch', status: 'Blocked' },
      ],
      blockers: [],
      wins: [],
      isLoading: false,
      source: 'local',
      loadError: '',
      refreshWeeklyBrief: vi.fn(),
    });

    const { rerender } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tell me what to do next' }));
    const nextMovePanel = screen.getByText('Next Smallest Action').closest('.focus-home__next-move');
    expect(nextMovePanel).toHaveTextContent('Send one unblock message for "Blocked Launch".');

    useWeeklyBrief.mockReturnValue({
      priorities: [
        { id: 'p-new', title: 'Current Focus', status: 'In Progress' },
      ],
      blockers: [],
      wins: [],
      isLoading: false,
      source: 'local',
      loadError: '',
      refreshWeeklyBrief: vi.fn(),
    });

    rerender(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(nextMovePanel).toHaveTextContent('Spend 20 focused minutes on "Current Focus".');
    expect(nextMovePanel).not.toHaveTextContent('Blocked Launch');
  });

  it('switches to overwhelmed mode and opens reset guidance', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: "I'm overwhelmed" }));

    expect(screen.getByText('Reset mode is open. You only need one completed step right now.')).toBeInTheDocument();
    expect(screen.getByText(/Pause for 60 seconds/i)).toBeInTheDocument();
  });

  it('supports keyboard mode switching across support-state radios', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    const planningChip = screen.getByRole('radio', { name: 'Planning' });
    expect(planningChip).toHaveAttribute('aria-checked', 'true');
    expect(planningChip).toHaveAttribute('tabIndex', '0');

    fireEvent.keyDown(planningChip, { key: 'ArrowDown' });
    const reflectionChip = screen.getByRole('radio', { name: 'Reflection' });
    expect(reflectionChip).toHaveAttribute('aria-checked', 'true');
    expect(reflectionChip).toHaveAttribute('tabIndex', '0');
    expect(planningChip).toHaveAttribute('tabIndex', '-1');
    expect(reflectionChip).toHaveFocus();

    fireEvent.keyDown(reflectionChip, { key: 'ArrowUp' });
    expect(planningChip).toHaveAttribute('aria-checked', 'true');
    expect(planningChip).toHaveFocus();
  });

  it('adds reminders and allows marking them complete or pending again', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Add a quick reminder'), {
      target: { value: 'Send recap email' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Send recap email')).toBeInTheDocument();
    expect(screen.getByText('0 of 1 reminders complete (0%)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('1 of 1 reminders complete (100%)')).toBeInTheDocument();
    expect(screen.getByText('Send recap email')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Send recap email' }));
    expect(screen.getByText('0 of 1 reminders complete (0%)')).toBeInTheDocument();
    expect(screen.queryByText('No reminders yet. Add one small commitment.')).not.toBeInTheDocument();
  });

  it('shows calm fallback states when no linked records exist', () => {
    useDashboardData.mockReturnValue({
      opportunityItems: [],
      contentRows: [],
      isDataLoading: false,
    });

    useWeeklyBrief.mockReturnValue({
      priorities: [],
      blockers: [],
      wins: [],
      isLoading: false,
      source: 'local',
      loadError: '',
      refreshWeeklyBrief: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText('Create one calming priority for today')).toBeInTheDocument();
    expect(screen.getByText('No blockers logged. Keep protecting this focus window.')).toBeInTheDocument();
    expect(screen.getByText('No reminder progress yet.')).toBeInTheDocument();
    expect(screen.getByText('No reminders yet. Add one small commitment.')).toBeInTheDocument();
    expect(screen.getByText('You are clear for now. Keep momentum by finishing one tiny action.')).toBeInTheDocument();
  });

  it('announces loading focus context without hiding the command center', () => {
    useDashboardData.mockReturnValue({
      opportunityItems: [],
      contentRows: [],
      isDataLoading: true,
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading your focus context...')).toHaveAttribute('role', 'status');
    expect(document.querySelector('.focus-home-page')).toHaveAttribute('aria-busy', 'true');
  });
});
