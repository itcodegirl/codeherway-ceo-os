import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useOpsSloTrend', () => ({
  useOpsSloTrend: vi.fn(),
}));

import OpsReliability from './OpsReliability';
import { useOpsSloTrend } from '../hooks/useOpsSloTrend';

describe('src/pages/OpsReliability', () => {
  it('renders stats and trend rows from snapshot data', () => {
    useOpsSloTrend.mockReturnValue({
      snapshots: [
        {
          runId: 'run-2',
          capturedAt: '2026-04-22T13:15:00.000Z',
          routeTrendOutcome: 'success',
          telemetryHealthOutcome: 'success',
          telemetryEndpointSloOutcome: 'failure',
          telemetryEndpointSloP95Ms: 1320,
          telemetryEndpointSloMaxP95Ms: 1200,
          telemetryEndpointSloNon2xxRatePct: 8,
          telemetryEndpointSloMaxNon2xxRatePct: 5,
        },
      ],
      isLoading: false,
      loadError: '',
      source: 'local',
      refreshSnapshots: vi.fn(),
    });

    render(
      <MemoryRouter>
        <OpsReliability />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Ops Reliability' })).toBeInTheDocument();
    expect(screen.getByText('Snapshots Tracked')).toBeInTheDocument();
    expect(screen.getByText('Degraded')).toBeInTheDocument();
    expect(screen.getAllByText('1320ms')).toHaveLength(2);
    expect(screen.getAllByText('8.00%')).toHaveLength(2);
  });

  it('shows loading copy while snapshots are loading', () => {
    useOpsSloTrend.mockReturnValue({
      snapshots: [],
      isLoading: true,
      loadError: '',
      source: 'local',
      refreshSnapshots: vi.fn(),
    });

    render(
      <MemoryRouter>
        <OpsReliability />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading reliability snapshots...')).toBeInTheDocument();
  });
});
