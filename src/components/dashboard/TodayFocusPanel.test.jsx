import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import TodayFocusPanel from './TodayFocusPanel';

function renderPanel(props) {
  return render(
    <MemoryRouter>
      <TodayFocusPanel {...props} />
    </MemoryRouter>,
  );
}

describe('TodayFocusPanel', () => {
  it('renders the focus title and context', () => {
    renderPanel({
      mainFocus: {
        title: 'Ship onboarding flow',
        context: 'This is already in motion.',
        isEmpty: false,
      },
      isFocusDataLoading: false,
    });

    expect(screen.getByText('Ship onboarding flow')).toBeInTheDocument();
    expect(screen.getByText('This is already in motion.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /chief of staff/i })).not.toBeInTheDocument();
  });

  it('surfaces a Chief-of-Staff link only when the focus is empty', () => {
    renderPanel({
      mainFocus: {
        title: 'Create one calming priority for today',
        context: 'Start with a 10-minute planning pass.',
        isEmpty: true,
      },
      isFocusDataLoading: false,
    });

    const link = screen.getByRole('link', { name: /chief of staff/i });
    expect(link).toHaveAttribute('href', '/chief-of-staff');
  });

  it('renders an aria-live status while loading focus context', () => {
    renderPanel({
      mainFocus: { title: 'x', context: 'y', isEmpty: false },
      isFocusDataLoading: true,
    });

    expect(screen.getByText(/loading your focus context/i)).toBeInTheDocument();
  });
});
