import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

function createMatchMediaMock({
  matches = false,
  useLegacyListeners = false,
} = {}) {
  const listeners = new Set();
  const addEventListener = vi.fn((eventName, callback) => {
    if (eventName === 'change') {
      listeners.add(callback);
    }
  });
  const removeEventListener = vi.fn((eventName, callback) => {
    if (eventName === 'change') {
      listeners.delete(callback);
    }
  });
  const addListener = vi.fn((callback) => {
    listeners.add(callback);
  });
  const removeListener = vi.fn((callback) => {
    listeners.delete(callback);
  });

  const mediaQueryList = {
    matches,
    media: '(max-width: 860px)',
    onchange: null,
    addEventListener: useLegacyListeners ? undefined : addEventListener,
    removeEventListener: useLegacyListeners ? undefined : removeEventListener,
    addListener,
    removeListener,
    dispatch(matchesValue) {
      listeners.forEach((callback) => callback({ matches: matchesValue }));
    },
  };

  const matchMedia = vi.fn(() => mediaQueryList);

  return {
    matchMedia,
    mediaQueryList,
    addListener,
    removeListener,
  };
}

function SidebarRouteHarness() {
  const navigate = useNavigate();

  return (
    <>
      <Sidebar />
      <button type="button" onClick={() => navigate('/capture')}>
        Programmatic route change
      </button>
      <button type="button" onClick={() => navigate('/')}>
        Return to focus
      </button>
    </>
  );
}

describe('src/components/ui/Sidebar', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('supports compact-menu keyboard close with Escape and restores toggle focus', () => {
    const { matchMedia } = createMatchMediaMock({ matches: true });
    window.matchMedia = matchMedia;

    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>,
    );

    const navElement = document.getElementById('primary-navigation');
    const toggleButton = screen.getByRole('button', { name: 'Open navigation menu' });

    expect(navElement).toHaveAttribute('hidden');

    fireEvent.click(toggleButton);

    const closeButton = screen.getByRole('button', { name: 'Close navigation menu' });
    const dashboardLink = screen.getByRole('link', { name: 'Focus Home' });

    dashboardLink.focus();
    expect(document.activeElement).toBe(dashboardLink);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(closeButton).toHaveFocus();
    expect(navElement).toHaveAttribute('hidden');
  });

  it('falls back to legacy media query listeners when addEventListener is unavailable', () => {
    const { matchMedia, addListener, removeListener } = createMatchMediaMock({
      useLegacyListeners: true,
    });
    window.matchMedia = matchMedia;

    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(addListener).toHaveBeenCalledTimes(1);

    unmount();

    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it('collapses compact navigation when the route changes programmatically', () => {
    const { matchMedia } = createMatchMediaMock({ matches: true });
    window.matchMedia = matchMedia;

    render(
      <MemoryRouter initialEntries={['/']}>
        <SidebarRouteHarness />
      </MemoryRouter>,
    );

    const navElement = document.getElementById('primary-navigation');
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(navElement).not.toHaveAttribute('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Programmatic route change' }));
    expect(navElement).toHaveAttribute('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Return to focus' }));
    expect(navElement).toHaveAttribute('hidden');
  });
});
