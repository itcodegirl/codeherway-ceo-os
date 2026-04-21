import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createElement } from 'react';
import { usePageMeta } from './usePageMeta';
import { buildDefaultPageMeta, buildPageMetaByRoute } from '../lib/pageMeta';

function createAppRouter(route) {
  return function Wrapper({ children }) {
    return createElement(MemoryRouter, { initialEntries: [route] }, children);
  };
}

describe('src/hooks/usePageMeta', () => {
  it('applies route-specific metadata and canonical URL', () => {
    const { unmount } = renderHook(() => usePageMeta('Acme CEO OS'), {
      wrapper: createAppRouter('/chief-of-staff'),
    });

    const meta = buildPageMetaByRoute('Acme CEO OS')['/chief-of-staff'];

    expect(document.title).toBe(meta.title);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(meta.description);
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(meta.title);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      `${window.location.origin}/chief-of-staff`,
    );

    unmount();
  });

  it('falls back to default metadata for unknown routes', () => {
    renderHook(() => usePageMeta('Acme CEO OS'), {
      wrapper: createAppRouter('/unknown'),
    });

    const defaultMeta = buildDefaultPageMeta('Acme CEO OS');

    expect(document.title).toBe(defaultMeta.title);
    expect(document.querySelector('meta[name="twitter:description"]')?.getAttribute('content')).toBe(
      defaultMeta.description,
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${window.location.origin}/unknown`,
    );
  });
});
