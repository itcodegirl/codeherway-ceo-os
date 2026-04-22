import { expect, test } from '@playwright/test';

async function resetToSeedState(page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByLabel('Primary navigation')).toBeVisible();
}

test.describe('CRUD smoke flows', () => {
  test('opportunities page supports create edit delete from routed entry', async ({ page }) => {
    const createdName = `Playwright Opportunity ${Date.now()}`;
    const editedName = `${createdName} Updated`;

    await resetToSeedState(page);
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Opportunities', exact: true })
      .click();
    await expect(page.getByRole('heading', { name: 'Opportunities' })).toBeVisible();

    await page.getByRole('button', { name: 'Create a new opportunity' }).click();
    const createDialog = page.getByRole('dialog', { name: 'Add Opportunity' });
    await createDialog.getByLabel('Opportunity', { exact: true }).fill(createdName);
    await createDialog.getByLabel('Company', { exact: true }).fill('Playwright Co');
    await createDialog.getByLabel('Priority', { exact: true }).selectOption('High');
    await createDialog.getByLabel('Stage', { exact: true }).selectOption('In Progress');
    await createDialog.getByLabel('Next Step', { exact: true }).fill('Send draft agreement');
    await createDialog.getByRole('button', { name: 'Create opportunity' }).click();

    const table = page.getByRole('table', { name: 'Opportunity pipeline' });
    const createdRow = table.locator('tbody tr').filter({ hasText: createdName }).first();
    await expect(createdRow).toBeVisible();

    await createdRow.click();
    await page.getByRole('button', { name: 'Edit selected opportunity' }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit Opportunity' });
    await editDialog.getByLabel('Opportunity', { exact: true }).fill(editedName);
    await editDialog.getByLabel('Company', { exact: true }).fill('Playwright Labs');
    await editDialog.getByRole('button', { name: 'Save opportunity changes' }).click();

    const editedRow = table.locator('tbody tr').filter({ hasText: editedName }).first();
    await expect(editedRow).toBeVisible();
    await page.getByRole('button', { name: 'Delete selected opportunity' }).click();
    await page.getByRole('button', { name: 'Confirm delete' }).click();

    await expect(table.locator('tbody tr').filter({ hasText: editedName })).toHaveCount(0);
  });

  test('content page supports create edit delete from routed entry', async ({ page }) => {
    const createdTitle = `Playwright Content ${Date.now()}`;
    const editedTitle = `${createdTitle} Updated`;

    await resetToSeedState(page);
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Content OS', exact: true })
      .click();
    await expect(page.getByRole('heading', { name: 'Content OS' })).toBeVisible();

    await page.getByRole('button', { name: 'Create a new content item' }).click();
    const createDialog = page.getByRole('dialog', { name: 'Add Content Item' });
    await createDialog.getByLabel('Title', { exact: true }).fill(createdTitle);
    await createDialog.getByLabel('Platform', { exact: true }).fill('Podcast');
    await createDialog.getByLabel('Status', { exact: true }).selectOption('Editing');
    await createDialog.getByRole('button', { name: 'Create content item' }).click();

    const table = page.getByRole('table', { name: 'Content pipeline' });
    const createdRow = table.locator('tbody tr').filter({ hasText: createdTitle }).first();
    await expect(createdRow).toBeVisible();

    await createdRow.click();
    await page.getByRole('button', { name: 'Edit selected content item' }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit Content Item' });
    await editDialog.getByLabel('Title', { exact: true }).fill(editedTitle);
    await editDialog.getByLabel('Platform', { exact: true }).fill('LinkedIn');
    await editDialog.getByRole('button', { name: 'Save content changes' }).click();

    const editedRow = table.locator('tbody tr').filter({ hasText: editedTitle }).first();
    await expect(editedRow).toBeVisible();
    await page.getByRole('button', { name: 'Delete selected content item' }).click();
    await page.getByRole('button', { name: 'Confirm delete' }).click();

    await expect(table.locator('tbody tr').filter({ hasText: editedTitle })).toHaveCount(0);
  });
});
