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

test.describe('Admin dashboard — leads view (US5)', () => {
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
    await page.goto('/admin/leads');
  });

  test('renders the leads view with search, sync filter, and export', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Leads' })).toBeVisible();
    await expect(page.getByLabel('Search leads')).toBeVisible();
    await expect(page.getByRole('combobox', { name: /sync status/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /export csv/i })).toBeVisible();
  });

  test('search input updates the URL with ?q=', async ({ page }) => {
    await page.getByLabel('Search leads').fill('charl');
    await page.getByRole('button', { name: /^search$/i }).click();
    await expect(page).toHaveURL(/[?&]q=charl/);
  });

  test('sync-status filter updates the URL', async ({ page }) => {
    await page.getByRole('combobox', { name: /sync status/i }).selectOption('failed');
    await expect(page).toHaveURL(/syncStatus=failed/);
  });

  test('export link points at the CSV endpoint with the active filters', async ({ page }) => {
    const exportLink = page.getByRole('link', { name: /export csv/i });
    const href = await exportLink.getAttribute('href');
    expect(href).toMatch(/^\/api\/admin\/leads\/export\?/);
    expect(href).toMatch(/from=\d{4}-\d{2}-\d{2}/);
    expect(href).toMatch(/to=\d{4}-\d{2}-\d{2}/);
  });

  test('CSV export response has the right Content-Type and Content-Disposition', async ({ request }) => {
    // Calls the API directly to avoid Playwright's download-handling timing —
    // headers are what we care about, and they're independent of the file size.
    const response = await request.get(
      '/api/admin/leads/export?from=2026-01-01&to=2026-12-31',
    );
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/text\/csv/);
    expect(response.headers()['content-disposition']).toMatch(/attachment; filename="worship-wheel-leads_/);
    const body = await response.text();
    // Header row is always present even when the filtered set is empty.
    expect(body.split('\r\n')[0]).toBe(
      'First Name,Email,Completed At,Overall Score,Overall %,Balance Score,Archetype,Traffic Source,Keap Sync Status,Results URL',
    );
  });

  test('shows the sync-health panel — failed rows or a healthy empty state', async ({ page }) => {
    const failed = page.getByText(/syncs? needs? attention/i);
    const healthy = page.getByText(/all leads synced to keap/i);
    await expect(failed.or(healthy)).toBeVisible();
  });
});
