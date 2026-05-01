import { describe, expect, it } from 'vitest';
import { APP_ROUTES, NAV_ITEMS, toNestedRoutePath } from './routes';
import { buildPageMetaByRoute } from './pageMeta';

describe('src/lib/routes', () => {
  it('keeps navigation paths unique and aligned with route metadata', () => {
    const paths = APP_ROUTES.map((route) => route.path);
    const uniquePaths = new Set(paths);
    const pageMeta = buildPageMetaByRoute('CodeHerWay CEO OS');

    expect(uniquePaths.size).toBe(paths.length);
    APP_ROUTES.forEach((route) => {
      expect(route.label).toBeTruthy();
      expect(route.icon).toBeTruthy();
      expect(pageMeta[route.path]).toMatchObject({
        title: `${route.label} | CodeHerWay CEO OS`,
        description: route.description,
      });
    });
  });

  it('derives primary navigation items from app route definitions', () => {
    expect(NAV_ITEMS).toEqual(
      APP_ROUTES.map(({ label, path, icon }) => ({
        label,
        path,
        icon,
      })),
    );
  });

  it('derives nested React Router paths from public route paths', () => {
    expect(toNestedRoutePath('/')).toBe('');
    expect(toNestedRoutePath('/chief-of-staff')).toBe('chief-of-staff');
    expect(toNestedRoutePath('settings')).toBe('settings');
  });
});
