import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const showToastSpy = vi.fn();

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    toastMessage: '',
    isToastVisible: false,
    showToast: showToastSpy,
  }),
}));

vi.mock('../hooks/useDashboardData', () => ({
  isLocalDashboardDemoMode: false,
  useDashboardData: vi.fn(),
}));

vi.mock('../hooks/useWeeklyBrief', () => ({
  useWeeklyBrief: vi.fn(),
}));

vi.mock('../hooks/useWorkspaceSetup', () => ({
  useWorkspaceSetup: vi.fn(),
}));

vi.mock('../lib/weeklyRepository', () => ({
  createWeeklyItem: vi.fn(() => Promise.resolve({ id: 'priority-new', title: 'mock' })),
}));

import Dashboard from './Dashboard';
import { useDashboardData } from '../hooks/useDashboardData';
import { useWeeklyBrief } from '../hooks/useWeeklyBrief';
import { useWorkspaceSetup } from '../hooks/useWorkspaceSetup';
import { listReminders } from '../lib/remindersRepository';
import { createWeeklyItem } from '../lib/weeklyRepository';

describe('src/pages/Dashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
    showToastSpy.mockReset();
    createWeeklyItem.mockClear();
    vi.useRealTimers();
    useWorkspaceSetup.mockReturnValue({
      hasChoice: true,
      isDemoMode: true,
      startBlankWorkspace: vi.fn(),
      loadDemoWorkspace: vi.fn(),
    });

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

  it('renders the reduced top-fold (focus, blockers, next move, reminders) on first paint', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Focus Home' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: "Today's Main Focus" })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Next Smallest Action' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Blockers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Reminders' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Operating rhythm' })).toBeInTheDocument();
    expect(screen.getByText('Choose one main focus, one blocker, and one reminder to protect.')).toBeInTheDocument();
    expect(screen.getByText('Finalize pricing page')).toBeInTheDocument();
    expect(screen.getByText('Recommended because: this priority is blocked and needs one clear unblock message.')).toBeInTheDocument();
    expect(screen.queryByText('This blocker may need attention.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show suggestions' }));
    expect(screen.getByText('This blocker may need attention.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add a quick reminder')).toHaveAccessibleDescription(
      'Keep it small enough to finish today. No reminder progress yet.',
    );

    // Focus tools (Quick Win, Reset, focus-mode chips) are tucked into the
    // collapsed drawer to keep the top fold calm.
    expect(screen.queryByRole('heading', { level: 2, name: 'Quick Win' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: "I'm Overwhelmed Reset" })).not.toBeInTheDocument();

    const drawerToggle = screen.getByRole('button', { name: 'Show focus tools' });
    expect(drawerToggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(drawerToggle);

    expect(screen.getByRole('heading', { level: 2, name: 'Quick Win' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: "I'm Overwhelmed Reset" })).toBeInTheDocument();
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

    const nextMovePanel = screen.getByRole('heading', { name: 'Next Smallest Action' }).closest('.focus-panel');
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
    const nextMovePanel = screen.getByRole('heading', { name: 'Next Smallest Action' }).closest('.focus-panel');
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

  it('switches to overwhelmed mode, auto-opens the focus tools drawer, and shows reset guidance', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    // Drawer is collapsed by default.
    expect(screen.getByRole('button', { name: 'Show focus tools' })).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: "I'm overwhelmed" }));

    // The "I'm overwhelmed" button is on the top fold (so users can reach it
    // in one click) but the reset *steps* live in the drawer to keep the
    // top fold calm. The button auto-opens the drawer so the steps are
    // available without a second click.
    expect(screen.getByRole('button', { name: 'Hide focus tools' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Reset mode is open. You only need one completed step right now.')).toBeInTheDocument();
    expect(screen.getByText(/Pause for 60 seconds/i)).toBeInTheDocument();
  });

  it('supports keyboard mode switching across support-state radios (in the focus tools drawer)', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    // Focus-mode chips were moved off the top fold and into the drawer to
    // keep first-paint clean. Open the drawer first.
    fireEvent.click(screen.getByRole('button', { name: 'Show focus tools' }));

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
    vi.useFakeTimers();

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

    act(() => {
      vi.advanceTimersByTime(160);
    });

    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('1 of 1 reminders complete (100%)')).toBeInTheDocument();

    // Completed reminders auto-hide so the list does not pile up. The user
    // can still bring them back via the toggle.
    expect(screen.queryByText('Send recap email')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /show 1 completed/i }));
    expect(screen.getByText('Send recap email')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(160);
    });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Send recap email' }));

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(screen.getByText('0 of 1 reminders complete (0%)')).toBeInTheDocument();
    expect(screen.queryByText('No reminders yet. Add one small commitment.')).not.toBeInTheDocument();
  });

  it('prevents duplicate reminder submits while the first save is settling', () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Add a quick reminder'), {
      target: { value: 'Confirm founder testimonial quote' },
    });

    const reminderForm = screen.getByRole('button', { name: 'Add' }).closest('form');
    fireEvent.submit(reminderForm);
    fireEvent.submit(reminderForm);

    expect(listReminders()).toHaveLength(1);
    expect(screen.getAllByText('Confirm founder testimonial quote')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Adding reminder' })).toBeDisabled();
    expect(showToastSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
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

    // Quick-win calm copy lives in the drawer.
    fireEvent.click(screen.getByRole('button', { name: 'Show focus tools' }));
    expect(screen.getByText('Quick win waiting: close one tiny loop before opening a new one.')).toBeInTheDocument();
  });

  it('offers a first-run local workspace choice before the user commits to demo data', () => {
    const startBlankWorkspace = vi.fn();
    const loadDemoWorkspace = vi.fn();
    useWorkspaceSetup.mockReturnValue({
      hasChoice: false,
      isDemoMode: true,
      startBlankWorkspace,
      loadDemoWorkspace,
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Choose how this device starts' })).toBeInTheDocument();
    expect(screen.getByText('Import backup: coming soon')).toBeInTheDocument();
    expect(screen.getByText('Connect Supabase: setup required')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start blank' }));
    expect(startBlankWorkspace).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Load demo workspace' }));
    expect(loadDemoWorkspace).toHaveBeenCalledTimes(1);
  });

  it('promotes a pending reminder into a weekly priority via the per-item action', async () => {
    const refreshWeeklyBrief = vi.fn().mockResolvedValue();
    useWeeklyBrief.mockReturnValue({
      priorities: [],
      blockers: [],
      wins: [],
      isLoading: false,
      source: 'local',
      loadError: '',
      refreshWeeklyBrief,
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Add a quick reminder'), {
      target: { value: 'Send investor follow-up' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    const promoteButton = screen.getByRole('button', {
      name: 'Promote reminder Send investor follow-up to a weekly priority',
    });

    await act(async () => {
      fireEvent.click(promoteButton);
    });

    expect(createWeeklyItem).toHaveBeenCalledTimes(1);
    expect(createWeeklyItem).toHaveBeenCalledWith({
      itemType: 'priority',
      item: {
        title: 'Send investor follow-up',
        owner: 'You',
        status: 'In Progress',
      },
    });
    expect(refreshWeeklyBrief).toHaveBeenCalledWith({ silent: true });
    expect(showToastSpy).toHaveBeenCalledWith(
      expect.stringContaining("Added to this week's priorities"),
    );

    // The reminder should remain in the list — promotion does not delete it.
    expect(screen.getByText('Send investor follow-up')).toBeInTheDocument();
  });

  it('does not duplicate the priority when the user double-clicks Promote', async () => {
    let resolveCreate;
    createWeeklyItem.mockImplementation(() => new Promise((resolve) => {
      resolveCreate = () => resolve({ id: 'priority-new', title: 'mock' });
    }));
    const refreshWeeklyBrief = vi.fn().mockResolvedValue();
    useWeeklyBrief.mockReturnValue({
      priorities: [],
      blockers: [],
      wins: [],
      isLoading: false,
      source: 'local',
      loadError: '',
      refreshWeeklyBrief,
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Add a quick reminder'), {
      target: { value: 'Reach out to Sarah' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    const promoteButton = screen.getByRole('button', {
      name: 'Promote reminder Reach out to Sarah to a weekly priority',
    });

    fireEvent.click(promoteButton);
    fireEvent.click(promoteButton);
    fireEvent.click(promoteButton);

    expect(createWeeklyItem).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCreate();
      await Promise.resolve();
    });
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

  it('keeps the focus tools drawer collapsed by default and toggles via the disclosure button', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    // Drawer body is hidden until the user opens it.
    expect(screen.queryByRole('heading', { level: 2, name: 'Quick Win' })).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Show focus tools' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(screen.getByRole('heading', { level: 2, name: 'Quick Win' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide focus tools' })).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Hide focus tools' }));
    expect(screen.queryByRole('heading', { level: 2, name: 'Quick Win' })).not.toBeInTheDocument();
  });
});
