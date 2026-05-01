import { expect, test } from '@playwright/test';

async function resetToSeedState(page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Focus Home', exact: true })).toBeVisible();
}

test.describe('Focus Home execution flow', () => {
  test('supports keyboard mode switching and reversible reminder completion feedback', async ({ page }) => {
    await resetToSeedState(page);

    const planningMode = page.getByRole('radio', { name: 'Planning' });
    const reflectionMode = page.getByRole('radio', { name: 'Reflection' });

    await expect(planningMode).toHaveAttribute('aria-checked', 'true');
    await expect(planningMode).toHaveAttribute('tabindex', '0');

    await planningMode.focus();
    await page.keyboard.press('ArrowRight');

    await expect(reflectionMode).toHaveAttribute('aria-checked', 'true');
    await expect(reflectionMode).toHaveAttribute('tabindex', '0');
    await expect(reflectionMode).toBeFocused();

    await page.getByLabel('Add reminder').fill('Send launch recap');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('0 of 1 reminders complete (0%)')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Send launch recap' }).click();

    await expect(page.getByText('1 of 1 reminders complete (100%)')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Send launch recap' })).toBeChecked();

    await page.getByRole('checkbox', { name: 'Send launch recap' }).click();

    await expect(page.getByText('0 of 1 reminders complete (0%)')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Send launch recap' })).not.toBeChecked();
    await expect(page.getByText('No reminders yet. Add one small commitment.')).toBeHidden();
  });
});
