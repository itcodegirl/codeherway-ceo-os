import {
  act,
  render,
  screen,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, afterEach, vi } from 'vitest';
import Topbar from './Topbar';
import { formatIsoDate } from '../../lib/utils';

describe('src/components/ui/Topbar', () => {
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-20T23:58:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders persistent team name, route title, and locale/date metadata from settings', () => {
    window.localStorage.setItem(
      'ceo-os-settings',
      JSON.stringify({
        timezone: 'UTC',
        teamName: 'Jenna',
      }),
    );

    render(<Topbar pageTitle="Chief of Staff" />);

    expect(screen.getByText('Team: Jenna')).toBeInTheDocument();
    expect(screen.getByText('Chief of Staff')).toBeInTheDocument();
    expect(screen.getByRole('time')).toHaveTextContent(dateFormatter.format(new Date('2026-04-20T23:58:00.000Z')));
    expect(screen.getByRole('time')).toHaveAttribute('dateTime', formatIsoDate(new Date('2026-04-20T23:58:00.000Z'), 'UTC'));
  });

  it('updates displayed date when a minute interval crosses midnight', () => {
    window.localStorage.setItem(
      'ceo-os-settings',
      JSON.stringify({
        timezone: 'UTC',
        teamName: 'Team Alpha',
      }),
    );

    render(<Topbar />);

    const timeElement = screen.getByRole('time');

    expect(timeElement).toHaveTextContent(dateFormatter.format(new Date('2026-04-20T23:58:00.000Z')));

    act(() => {
      vi.advanceTimersByTime(3 * 60 * 1000);
    });

    expect(timeElement).toHaveTextContent(dateFormatter.format(new Date('2026-04-21T00:01:00.000Z')));
    expect(timeElement).toHaveAttribute('dateTime', formatIsoDate(new Date('2026-04-21T00:01:00.000Z'), 'UTC'));
  });

  it('updates on the next minute boundary when close to midnight', () => {
    vi.setSystemTime(new Date('2026-04-20T23:59:45.000Z'));
    window.localStorage.setItem(
      'ceo-os-settings',
      JSON.stringify({
        timezone: 'UTC',
        teamName: 'Team Alpha',
      }),
    );

    render(<Topbar />);

    const timeElement = screen.getByRole('time');

    expect(timeElement).toHaveTextContent(dateFormatter.format(new Date('2026-04-20T23:59:45.000Z')));

    act(() => {
      vi.advanceTimersByTime(16 * 1000);
    });

    expect(timeElement).toHaveTextContent(dateFormatter.format(new Date('2026-04-21T00:00:01.000Z')));
    expect(timeElement).toHaveAttribute('dateTime', formatIsoDate(new Date('2026-04-21T00:00:01.000Z'), 'UTC'));
  });
});
