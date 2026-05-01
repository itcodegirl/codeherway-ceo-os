import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './AppLayout';

describe('src/layouts/AppLayout', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    document.head.innerHTML = '';
    window.localStorage.clear();
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleErrorSpy = undefined;
  });

  it('updates document title and route-level metadata for content pages', () => {
    render(
      <MemoryRouter initialEntries={['/content']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="content" element={<div>Content page</div>} />
            <Route index element={<div>Focus Home page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(document.title).toBe('Content OS | CodeHerWay CEO OS');

    const description = document.head.querySelector('meta[name="description"]');
    const ogTitle = document.head.querySelector('meta[property="og:title"]');
    const twitterTitle = document.head.querySelector('meta[name="twitter:title"]');
    const canonical = document.head.querySelector('link[rel="canonical"]');

    expect(description?.getAttribute('content')).toBe(
      'Plan, monitor, and ship founder content across channels with a clear publishing workflow.',
    );
    expect(ogTitle?.getAttribute('content')).toBe('Content OS | CodeHerWay CEO OS');
    expect(twitterTitle?.getAttribute('content')).toBe('Content OS | CodeHerWay CEO OS');
    expect(canonical?.getAttribute('href')).toBe(`${window.location.origin}/content`);
  });

  it('falls back to focus-home metadata for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unmatched']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="*" element={<div>Fallback page</div>} />
            <Route index element={<div>Focus Home page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(document.title).toBe('Focus Home | CodeHerWay CEO OS');

    const description = document.head.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toBe(
      'CodeHerWay CEO OS is a connected command center for focus, momentum, blockers, ideas, and weekly execution.',
    );
  });

  it('keeps skip-link target valid and restores main focus on route navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/content']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="content" element={<div>Content page</div>} />
            <Route index element={<div>Focus Home page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const skipLink = screen.getByRole('link', { name: 'Skip to content' });
    const main = document.getElementById('main-content');
    const dashboardNavLink = screen.getByRole('link', { name: 'Focus Home' });

    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(main).toHaveAttribute('tabindex', '-1');

    await waitFor(() => {
      expect(main).toHaveFocus();
    });

    fireEvent.click(skipLink);

    fireEvent.click(dashboardNavLink);

    await waitFor(() => {
      expect(main).toHaveFocus();
    });
    expect(document.title).toBe('Focus Home | CodeHerWay CEO OS');
  });

  it('resets route error state after navigating away from a failed view', async () => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BrokenView() {
      throw new Error('Broken route for reset test');
    }

    render(
      <MemoryRouter initialEntries={['/broken']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="broken" element={<BrokenView />} />
            <Route index element={<div>Focus Home page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong in this view.');

    fireEvent.click(screen.getByRole('link', { name: 'Focus Home' }));

    await waitFor(() => {
      expect(screen.getByText('Focus Home page')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('can retry a transient focus-home crash when return-home keeps the same path', async () => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    function TransientFocusHome() {
      if (shouldThrow) {
        throw new Error('Focus Home failed once');
      }

      return <div>Recovered Focus Home</div>;
    }

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<TransientFocusHome />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong in this view.');

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Return to Focus Home' }));

    await waitFor(() => {
      expect(screen.getByText('Recovered Focus Home')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
