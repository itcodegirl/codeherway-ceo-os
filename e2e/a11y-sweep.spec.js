import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Axe-core a11y sweep across every primary route.
 *
 * Fails only on serious/critical impacts so the suite stays useful as a
 * guardrail without flaking on cosmetic minor issues. The lighter impacts
 * (color-contrast, etc.) are reported in the test output for review but
 * don't block CI.
 */

const primaryRoutes = [
  { path: '/', name: 'Focus Home' },
  { path: '/capture', name: 'Capture' },
  { path: '/journal', name: 'Journal' },
  { path: '/opportunities', name: 'Opportunities' },
  { path: '/content', name: 'Content OS' },
  { path: '/weekly-brief', name: 'Weekly Brief' },
  { path: '/chief-of-staff', name: 'Chief of Staff' },
  { path: '/ops-reliability', name: 'Ops Reliability' },
  { path: '/settings', name: 'Settings' },
];

const BLOCKING_IMPACTS = new Set(['serious', 'critical']);

test.describe('A11y sweep with axe-core', () => {
  for (const route of primaryRoutes) {
    test(`${route.name} (${route.path}) has no serious or critical a11y violations`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.locator('#main-content')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
        .analyze();

      const blocking = results.violations.filter((violation) => (
        BLOCKING_IMPACTS.has(violation.impact || '')
      ));

      if (results.violations.length) {
        console.info(
          `Axe report for ${route.path}: ${results.violations.length} total violations, ` +
            `${blocking.length} blocking.`,
        );
        for (const violation of results.violations) {
          console.info(
            `  [${violation.impact}] ${violation.id} — ${violation.help} (${violation.nodes.length} node(s))`,
          );
        }
      }

      expect(blocking, `Blocking a11y violations on ${route.path}`).toEqual([]);
    });
  }
});
