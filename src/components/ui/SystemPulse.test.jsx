import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SystemPulse from './SystemPulse';

vi.mock('../../hooks/useSystemPulse', () => ({
  useSystemPulse: () => ({
    isLoading: false,
    nextMove: 'This blocker may need attention.',
    items: [
      { id: 'focus', label: 'Focus', value: '2', tone: 'positive' },
      { id: 'momentum', label: 'Momentum', value: '3', tone: 'positive' },
      { id: 'blockers', label: 'Blockers', value: '1', tone: 'warning' },
      { id: 'ideas', label: 'Ideas', value: '4', tone: 'positive' },
      { id: 'reset', label: 'Reset', value: '2', tone: 'warning' },
    ],
  }),
}));

describe('src/components/ui/SystemPulse', () => {
  it('renders shared command signal and pulse nodes', () => {
    render(<SystemPulse />);

    expect(screen.getByText('Command Signal')).toBeInTheDocument();
    expect(screen.getByText('This blocker may need attention.')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'System pulse indicators' })).toBeInTheDocument();
    expect(screen.getByText('Focus')).toBeInTheDocument();
    expect(screen.getByText('Momentum')).toBeInTheDocument();
    expect(screen.getByText('Blockers')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Focus: 2' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Blockers: 1' })).toBeInTheDocument();
  });
});
