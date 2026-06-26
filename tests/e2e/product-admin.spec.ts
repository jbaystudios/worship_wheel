// E2e: admin product management (spec 009, US3 + US4). Signed-in — skipped
// unless E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are set against a Supabase project
// with the spec-009 migrations applied.
import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Admin products — create, preview, catalogue (US3/US4)', () => {
  test.skip(
    !adminEmail || !adminPassword,
    'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run signed-in product tests',
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(adminEmail!);
    await page.getByLabel('Password').fill(adminPassword!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('Products appears in the root nav', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
  });

  test('create a product with a live preview, then see it in the catalogue', async ({ page }) => {
    await page.goto('/admin/products/new');

    const name = `E2E Offer ${Date.now()}`;
    await page.getByLabel('Internal name').fill(name);
    await page.getByLabel('Headline').fill('The Uneven Intermediate');
    await page.getByLabel('Eyebrow').fill('READY TO LEVEL UP?');
    await page.getByLabel('CTA headline').fill('Start the 90-Day Challenge');
    await page
      .getByLabel(/CTA copy/i)
      .fill('Based on your score of {overallScore}/80, this is for you.');
    await page.getByLabel('Button label').fill('Start the Challenge');
    await page.getByLabel('Button link').fill('https://worshipwheel.com/offer');

    // Live preview renders the real card with the sample score interpolated.
    await expect(page.getByText('Based on your score of 35/80, this is for you.')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Start the 90-Day Challenge' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Create product' }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);

    // The new product is listed (draft by default) with a generated code.
    const row = page.getByRole('row', { name: new RegExp(name) });
    await expect(row).toBeVisible();
    await expect(row.getByText('draft')).toBeVisible();

    // Activate it.
    await row.getByRole('button', { name: 'Activate' }).click();
    await expect(row.getByText('active')).toBeVisible();
  });

  test('validation blocks a save with missing required fields', async ({ page }) => {
    await page.goto('/admin/products/new');
    await page.getByLabel('Internal name').fill('Incomplete');
    await page.getByRole('button', { name: 'Create product' }).click();
    await expect(page.getByText(/fix the highlighted fields/i)).toBeVisible();
  });
});
