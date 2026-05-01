import { expect, test } from '@playwright/test';

async function resetToSeedState(page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Focus Home', exact: true })).toBeVisible();
}

test.describe('Settings shell sync', () => {
  test('updates shell branding and timezone metadata after saving workspace settings', async ({ page }) => {
    await resetToSeedState(page);
    await page.goto('/settings');

    await page.getByLabel('Workspace name').fill('CodeHerWay Leadership');
    await page.getByLabel('Timezone').fill('UTC');
    await page.getByRole('button', { name: 'Save settings' }).click();

    await expect(page.getByText('Team: CodeHerWay Leadership')).toBeVisible();
    await expect(page.getByText('Time zone: UTC')).toBeVisible();
    await expect(page.getByText(/Last saved/i)).toBeVisible();

    await page.getByRole('link', { name: 'Chief of Staff', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Chief of Staff', exact: true })).toBeVisible();
    await expect(page.getByText('Team: CodeHerWay Leadership')).toBeVisible();
    await expect(page.getByText('Time zone: UTC')).toBeVisible();
    await expect(page.getByText('CodeHerWay Leadership').first()).toBeVisible();
  });
});
