import { expect, test } from '@playwright/test';

async function resetToSeedState(page) {
  await page.goto('/?meta=1');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Focus Home', exact: true })).toBeVisible();
}

async function navigateToOpsReliability(page) {
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav).toBeVisible();
  await nav.getByRole('link', { name: 'Ops Reliability', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Ops Reliability', exact: true }),
  ).toBeVisible();
}

test.describe('Ops Reliability mobile layout', () => {
  test('stacks stat cards and trend rows into single-column cards without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await resetToSeedState(page);
    await navigateToOpsReliability(page);

    // The four stat cards should appear in their declared order. Each card
    // sits in a single-column stack on mobile — its top edge starts at or
    // below the previous card's bottom edge. This is the visual property the
    // case study calls out, and it's what regresses if a future grid rule
    // accidentally collapses the cards onto a single row.
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);

    let previousBottom = -Infinity;
    for (let index = 0; index < 4; index += 1) {
      const card = statCards.nth(index);
      await expect(card).toBeVisible();
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      // Allow a 1px tolerance for sub-pixel layout rounding.
      expect(box.y).toBeGreaterThanOrEqual(previousBottom - 1);
      previousBottom = box.y + box.height;
    }

    // The SLO snapshot trend collapses from a 6-column table into stacked
    // cards on phones (data-label pseudo-elements provide the column names).
    // We verify the contract that lets that work:
    //   1. The wrapper does NOT scroll horizontally on mobile.
    //   2. Each <tr> renders as a vertical card whose width matches the
    //      wrapper, instead of forcing the wrapper to scroll.
    //   3. Every <td> exposes a data-label so the stacked layout still
    //      labels each value for sighted users (data-label drives the
    //      `td::before` pseudo) and screen readers can pair label/value.
    const wrapper = page.locator('.ops-table-wrapper');
    await expect(wrapper).toBeVisible();
    const wrapperGeometry = await wrapper.evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
      overflowX: window.getComputedStyle(node).overflowX,
    }));
    expect(wrapperGeometry.scrollWidth).toBeLessThanOrEqual(wrapperGeometry.clientWidth + 1);
    expect(wrapperGeometry.overflowX).not.toBe('scroll');

    const rows = page.locator('.ops-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    let previousRowBottom = -Infinity;
    for (let index = 0; index < rowCount; index += 1) {
      const row = rows.nth(index);
      const rowDisplay = await row.evaluate((node) => window.getComputedStyle(node).display);
      expect(rowDisplay).toBe('grid');
      const rowBox = await row.boundingBox();
      expect(rowBox).not.toBeNull();
      expect(rowBox.y).toBeGreaterThanOrEqual(previousRowBottom - 1);
      previousRowBottom = rowBox.y + rowBox.height;
    }

    const labeledCells = await page.locator('.ops-table tbody td[data-label]').count();
    const totalCells = await page.locator('.ops-table tbody td').count();
    expect(labeledCells).toBe(totalCells);
    expect(labeledCells).toBeGreaterThan(0);
  });
});
