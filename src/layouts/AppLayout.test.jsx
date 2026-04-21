import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './AppLayout';

describe('src/layouts/AppLayout', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    window.localStorage.clear();
  });

  it('updates document title and route-level metadata for content pages', () => {
    render(
      <MemoryRouter initialEntries={['/content']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="content" element={<div>Content page</div>} />
            <Route index element={<div>Dashboard page</div>} />
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

  it('falls back to dashboard metadata for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unmatched']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="*" element={<div>Fallback page</div>} />
            <Route index element={<div>Dashboard page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(document.title).toBe('Dashboard | CodeHerWay CEO OS');

    const description = document.head.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toBe(
      'CodeHerWay CEO OS is an executive dashboard to manage opportunities, content operations, weekly priorities, and leadership workflows.',
    );
  });

  it('keeps skip-link target valid and restores main focus on route navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/content']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="content" element={<div>Content page</div>} />
            <Route index element={<div>Dashboard page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const skipLink = screen.getByRole('link', { name: 'Skip to content' });
    const main = document.getElementById('main-content');
    const dashboardNavLink = screen.getByRole('link', { name: 'Dashboard' });

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
    expect(document.title).toBe('Dashboard | CodeHerWay CEO OS');
  });
});
