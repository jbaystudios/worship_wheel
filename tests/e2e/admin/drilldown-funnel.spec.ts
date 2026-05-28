// E2e: Funnel overview → per-question list → per-question detail (spec 007 US1).
// Auth-only routes; tests requiring a signed-in session are skipped unless
// E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are provided.
import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Funnel drill-down — unauthenticated', () => {
  test('deep link to per-question detail redirects to login', async ({ page }) => {
    await page.goto('/admin/funnel/questions/fb_01');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('per-question list redirects to login', async ({ page }) => {
    await page.goto('/admin/funnel/questions');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('Funnel drill-down — authenticated', () => {
  test.skip(
    !adminEmail || !adminPassword,
    'requires E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD',
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/email/i).fill(adminEmail!);
    await page.getByLabel(/password/i).fill(adminPassword!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(\?|$)/);
  });

  test('overview shows headline + callout, no inline per-question table', async ({
    page,
  }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /^Funnel$/ })).toBeVisible();
    await expect(page.getByText(/biggest drop-off/i)).toBeVisible();
    // Per-question table is no longer inline — the "Per-question drop-off"
    // heading from spec 005 must not appear on /admin anymore.
    await expect(page.getByRole('heading', { name: /Per-question drop-off/i })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole('link', { name: /view per-question drop-off/i }),
    ).toBeVisible();
  });

  test('drill-down preserves date range across navigation', async ({ page }) => {
    const url = '/admin?from=2026-04-01&to=2026-04-30';
    await page.goto(url);
    await page.getByRole('link', { name: /view per-question drop-off/i }).click();
    await expect(page).toHaveURL(/from=2026-04-01/);
    await expect(page).toHaveURL(/to=2026-04-30/);

    await page.goBack();
    await expect(page).toHaveURL(/from=2026-04-01/);
    await expect(page).toHaveURL(/to=2026-04-30/);
  });

  test('biggest-drop-off callout links to a question detail page', async ({ page }) => {
    await page.goto('/admin');
    const inspect = page.getByRole('link', { name: /inspect this question/i });
    if ((await inspect.count()) === 0) {
      test.skip(true, 'no funnel data — callout not present');
    }
    await inspect.click();
    await expect(page).toHaveURL(/\/admin\/funnel\/questions\/[^/]+$/);
    await expect(page.getByRole('heading', { name: /Question \d+/ })).toBeVisible();
  });

  test('per-question list → detail → back preserves URL state', async ({ page }) => {
    await page.goto('/admin/funnel/questions?from=2026-04-01&to=2026-04-30');
    const inspect = page.getByRole('link', { name: /inspect question/i }).first();
    if ((await inspect.count()) === 0) {
      test.skip(true, 'no question rows to drill into');
    }
    await inspect.click();
    await expect(page).toHaveURL(/\/admin\/funnel\/questions\/[^/]+\?/);
    await expect(page).toHaveURL(/from=2026-04-01/);
    await page.goBack();
    await expect(page).toHaveURL(/from=2026-04-01/);
  });
});
