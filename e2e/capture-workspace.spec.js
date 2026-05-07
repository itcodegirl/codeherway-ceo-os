import { expect, test } from '@playwright/test';

async function resetToSeedState(page) {
  await page.goto('/capture');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Capture', exact: true })).toBeVisible();
}

test.describe('Capture workspace', () => {
  test('shows accessible empty-submit feedback and persists a sticky note after reload', async ({ page }) => {
    const noteText = `Playwright sticky note ${Date.now()}`;

    await resetToSeedState(page);

    const noteField = page.getByRole('textbox', { name: 'Note' });
    await page.getByRole('button', { name: 'Save sticky note' }).click();

    await expect(page.getByRole('alert')).toContainText('Add a quick note before saving.');
    await expect(noteField).toHaveAttribute('aria-invalid', 'true');

    await noteField.fill(noteText);
    await page.getByRole('combobox', { name: 'Category' }).selectOption('task');
    await page.getByRole('button', { name: 'Save sticky note' }).click();

    const savedNoteField = page.locator('.sticky-note textarea').first();
    await expect(savedNoteField).toHaveValue(noteText);
    await expect(page.getByText(
      'Auto-saved locally and ready whenever your brain moves fast.',
    )).toBeVisible();

    await page.reload();
    await expect(page.locator('.sticky-note textarea').first()).toHaveValue(noteText);

    await page.getByRole('button', { name: 'Delete Task note' }).click();
    await expect(page.getByText('No sticky notes yet')).toBeVisible();
  });
});
