import { describe, expect, it } from 'vitest';
import {
  APP_ROUTES,
  NAV_GROUPS,
  NAV_ITEMS,
  buildNavGroups,
  filterRoutesByMetaMode,
  toMetaModePath,
  toNestedRoutePath,
} from './routes';
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

  it('adds the meta mode query flag to navigation paths', () => {
    expect(toMetaModePath('/')).toBe('/?meta=1');
    expect(toMetaModePath('/ops-reliability')).toBe('/ops-reliability?meta=1');
    expect(toMetaModePath('/ops-reliability?view=trend')).toBe('/ops-reliability?view=trend&meta=1');
    expect(toMetaModePath('/ops-reliability?meta=1')).toBe('/ops-reliability?meta=1');
  });

  it('groups navigation items by their assigned group, in declared order', () => {
    const groups = buildNavGroups(undefined, { isMetaMode: true });
    const groupIds = groups.map((group) => group.id);
    expect(groupIds).toEqual(['today', 'this-week', 'workspace', 'account']);

    const settingsGroup = groups.find((group) => group.id === 'account');
    expect(settingsGroup.items.map((item) => item.path)).toContain('/settings');
    expect(settingsGroup.items.map((item) => item.path)).toContain('/ops-reliability');

    const todayGroup = groups.find((group) => group.id === 'today');
    expect(todayGroup.items[0].path).toBe('/');
  });

  it('hides meta-flagged routes from default sidebar nav and exposes them in meta mode', () => {
    const defaultGroups = buildNavGroups();
    const defaultPaths = defaultGroups.flatMap((group) => group.items.map((item) => item.path));
    expect(defaultPaths).not.toContain('/ops-reliability');

    const metaGroups = buildNavGroups(undefined, { isMetaMode: true });
    const metaPaths = metaGroups.flatMap((group) => group.items.map((item) => item.path));
    expect(metaPaths).toContain('/ops-reliability');
    expect(metaGroups.flatMap((group) => group.items)).toContainEqual(expect.objectContaining({
      path: '/ops-reliability',
      meta: true,
    }));
  });

  it('filterRoutesByMetaMode hides meta-flagged routes by default and exposes them in meta mode', () => {
    const defaultIds = filterRoutesByMetaMode(APP_ROUTES, false).map((route) => route.id);
    expect(defaultIds).not.toContain('ops-reliability');

    const metaIds = filterRoutesByMetaMode(APP_ROUTES, true).map((route) => route.id);
    expect(metaIds).toContain('ops-reliability');
  });

  it('exposes a stable NAV_GROUPS export covering non-meta routes', () => {
    const allGroupedPaths = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.path));
    const visibleRoutes = APP_ROUTES.filter((route) => !route.meta);
    expect(new Set(allGroupedPaths)).toEqual(new Set(visibleRoutes.map((route) => route.path)));
  });
});
