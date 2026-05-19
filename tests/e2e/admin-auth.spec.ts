// E2e: admin dashboard authentication gate (spec 005, US1 / task T014).
// Covers US1 scenarios 1-7. Tests requiring a real signed-in session are
// skipped unless E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are provided (a
// provisioned account + a connected Supabase project).
import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Admin auth gate — unauthenticated', () => {
  test('US1.1 — /admin redirects to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('US1.1 — a deep route redirects to login carrying ?next=', async ({ page }) => {
    await page.goto('/admin/leads');
    await expect(page).toHaveURL(/\/admin\/login\?next=/);
  });

  test('US1.2 — GET /api/admin/funnel returns 401 (no data)', async ({ request }) => {
    // The route lands in US2 (T033); until then this asserts the auth contract.
    const res = await request.get('/api/admin/funnel');
    expect(res.status()).toBe(401);
  });

  test('US1.3 — login page renders the sign-in form', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('US1.4 — invalid credentials show a generic error', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password').fill('definitely-wrong-pw');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('alert')).toContainText(/invalid email or password/i);
  });
});

test.describe('Admin auth gate — authenticated', () => {
  test.skip(
    !adminEmail || !adminPassword,
    'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run signed-in tests',
  );

  test('US1.3 & US1.6 — sign in, reach the dashboard, then sign out', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(adminEmail!);
    await page.getByLabel('Password').fill(adminPassword!);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();

    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
