import { expect, test } from '@playwright/test';

async function resetToSeedState(page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Focus Home', exact: true })).toBeVisible();
}

test.describe('Mobile navigation shell', () => {
  test('keeps compact navigation closed after route changes and history return', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await resetToSeedState(page);

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeHidden();

    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(nav).toBeVisible();

    await nav.getByRole('link', { name: 'Capture', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Capture', exact: true })).toBeVisible();
    await expect(nav).toBeHidden();

    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Focus Home', exact: true })).toBeVisible();
    await expect(nav).toBeHidden();
  });
});
