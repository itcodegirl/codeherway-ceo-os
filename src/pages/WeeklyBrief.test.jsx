import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WeeklyBrief from './WeeklyBrief';

vi.mock('../hooks/useWeeklyBrief', () => ({
  useWeeklyBrief: vi.fn(),
}));

import { useWeeklyBrief } from '../hooks/useWeeklyBrief';

function createWeeklyState(overrides = {}) {
  return {
    source: 'local',
    isLoading: false,
    loadError: '',
    reviewNotes: 'Review the week.',
    priorities: [],
    wins: [],
    blockers: [],
    setReviewNotes: vi.fn(),
    setPriorities: vi.fn(),
    setWins: vi.fn(),
    setBlockers: vi.fn(),
    refreshWeeklyBrief: vi.fn(),
    ...overrides,
  };
}

function renderWeeklyBrief() {
  return render(
    <MemoryRouter>
      <WeeklyBrief />
    </MemoryRouter>,
  );
}

describe('src/pages/WeeklyBrief', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows normal autosave confidence copy when the workspace is healthy', () => {
    useWeeklyBrief.mockReturnValue(createWeeklyState());

    renderWeeklyBrief();

    expect(screen.getByText('Notes are saved automatically for this workspace.')).toBeInTheDocument();
  });

  it('shows paused-autosave copy when weekly persistence has an error', () => {
    useWeeklyBrief.mockReturnValue(createWeeklyState({
      loadError: 'Unable to save weekly review notes right now.',
    }));

    renderWeeklyBrief();

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to save weekly review notes right now.');
    expect(screen.getByText('Autosave is paused until the weekly brief saves successfully again.')).toBeInTheDocument();
  });
});
