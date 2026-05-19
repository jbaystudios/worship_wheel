// E2e: admin dashboard views (spec 005). Signed-in tests — skipped unless
// E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are set (a provisioned account + a
// connected Supabase project with migrations applied).
//
// US3/US4/US5 extend this file with their own describe blocks.
import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Admin dashboard — funnel view (US2)', () => {
  test.skip(
    !adminEmail || !adminPassword,
    'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run signed-in dashboard tests',
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(adminEmail!);
    await page.getByLabel('Password').fill(adminPassword!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('renders the funnel view with date-range controls', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Funnel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Last 30 days' })).toBeVisible();
  });

  test('a date-range preset updates the URL', async ({ page }) => {
    await page.getByRole('button', { name: 'Last 7 days' }).click();
    await expect(page).toHaveURL(/from=\d{4}-\d{2}-\d{2}.*to=\d{4}-\d{2}-\d{2}/);
  });

  test('shows the per-question drop-off table or an empty state', async ({ page }) => {
    const dropoff = page.getByRole('heading', { name: /per-question drop-off/i });
    const empty = page.getByText(/no visitors in this range/i);
    await expect(dropoff.or(empty)).toBeVisible();
  });

  // SC-007: funnel counts must match seeded sessions within ±1%. Requires a
  // database seeding fixture (insert known assessment_events rows, incl. bot
  // and honeypot rows that must be excluded). Implement alongside the seeding
  // harness — see tasks T036 / T055.
  test.fixme('funnel counts match seeded sessions within ±1% (SC-007)', async () => {});
});

test.describe('Admin dashboard — acquisition view (US3)', () => {
  test.skip(
    !adminEmail || !adminPassword,
    'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run signed-in dashboard tests',
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(adminEmail!);
    await page.getByLabel('Password').fill(adminPassword!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto('/admin/acquisition');
  });

  test('renders the acquisition view with date-range controls', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Acquisition' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Last 30 days' })).toBeVisible();
  });

  test('shows the source table or an empty state', async ({ page }) => {
    const sources = page.getByRole('columnheader', { name: 'Source' });
    const empty = page.getByText(/no traffic in this range/i);
    await expect(sources.or(empty)).toBeVisible();
  });
});

test.describe('Admin dashboard — outcomes view (US4)', () => {
  test.skip(
    !adminEmail || !adminPassword,
    'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run signed-in dashboard tests',
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(adminEmail!);
    await page.getByLabel('Password').fill(adminPassword!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto('/admin/outcomes');
  });

  test('renders the outcomes view with date-range controls', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /audience & outcomes/i }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Last 30 days' })).toBeVisible();
  });

  test('shows the outcome distributions or an empty state', async ({ page }) => {
    const charts = page.getByText('Average score per element');
    const empty = page.getByText(/no completed assessments in this range/i);
    await expect(charts.or(empty)).toBeVisible();
  });
});
