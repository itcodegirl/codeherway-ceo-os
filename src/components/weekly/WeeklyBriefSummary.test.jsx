import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WeeklyBriefSummary from './WeeklyBriefSummary';

describe('WeeklyBriefSummary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns nothing when there is no content yet', () => {
    const { container } = render(
      <WeeklyBriefSummary priorities={[]} wins={[]} blockers={[]} reviewNotes="" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows a derived focus, counts, and reflection snippet from current data', () => {
    render(
      <WeeklyBriefSummary
        priorities={[
          { id: 'p-1', title: 'Ship onboarding update', status: 'In Progress' },
          { id: 'p-2', title: 'Hire role coordinator', status: 'Planned' },
        ]}
        wins={[{ id: 'w-1', text: 'Shipped Q4 roadmap doc' }]}
        blockers={[{ id: 'b-1', text: 'Investor intro waiting on schedule' }]}
        reviewNotes="This week the team shipped onboarding flow v2 and unblocked the partner conversation."
      />,
    );

    expect(screen.getByText(/Founder brief/)).toBeInTheDocument();
    expect(screen.getByText(/Ship onboarding update/)).toBeInTheDocument();
    expect(screen.getByText(/2 active/)).toBeInTheDocument();
    expect(screen.getByText(/in motion/)).toBeInTheDocument();
    expect(screen.getByText(/1 logged this week/)).toBeInTheDocument();
    expect(screen.getByText(/1 needing follow-up/)).toBeInTheDocument();
    expect(screen.getByText(/team shipped onboarding flow v2/)).toBeInTheDocument();
  });

  it('copies a plain-text brief to the clipboard and surfaces confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <WeeklyBriefSummary
        priorities={[{ id: 'p-1', title: 'Land the executive deck', owner: 'Founder', status: 'In Progress' }]}
        wins={[{ id: 'w-1', text: 'Demo polished' }]}
        blockers={[]}
        reviewNotes="Pacing feels steady."
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Copy the weekly brief to clipboard/ }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });

    const briefText = writeText.mock.calls[0][0];
    expect(briefText).toMatch(/Weekly Brief/);
    expect(briefText).toMatch(/Focus: Land the executive deck/);
    expect(briefText).toMatch(/- Land the executive deck — Founder \(In Progress\)/);
    expect(briefText).toMatch(/Reflection:/);

    await screen.findByText('Brief copied to clipboard.');

    // The confirmation auto-dismisses after a short delay. Use a generous
    // waitFor budget so this doesn't flake on slower CI runners.
    await waitFor(
      () => {
        expect(screen.queryByText('Brief copied to clipboard.')).toBeNull();
      },
      { timeout: 4000 },
    );
  });
});
