import { expect, test } from '@playwright/test';

async function resetToSeedState(page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByLabel('Primary navigation')).toBeVisible();
}

test.describe('Chief workspace flow', () => {
  test('persists founder notes locally and clears them cleanly after reset', async ({ page }) => {
    const notes = 'Founder notes about priorities, pipeline follow-ups, and next week planning.';

    await resetToSeedState(page);
    await page.goto('/chief-of-staff');

    const notesInput = page.getByLabel('Founder notes for chief of staff workspace');
    const buildButton = page.getByRole('button', { name: 'Build Action Plan' });

    await expect(page.getByText('Chief workspace is stored locally on this device right now.')).toBeVisible();
    await expect(page.getByText('Add a few founder notes to generate an action plan.')).toBeVisible();
    await expect(buildButton).toBeDisabled();

    await notesInput.fill(notes);

    await expect(page.getByText('Your notes stay editable. Review every recommendation before using it.')).toBeVisible();
    await expect(buildButton).toBeEnabled();

    await page.reload();

    await expect(notesInput).toHaveValue(notes);
    await expect(buildButton).toBeEnabled();

    await page.getByRole('button', { name: 'Reset Workspace' }).click();

    await expect(notesInput).toHaveValue('');
    await expect(buildButton).toBeDisabled();

    await page.reload();

    await expect(notesInput).toHaveValue('');
    await expect(buildButton).toBeDisabled();
  });
});
