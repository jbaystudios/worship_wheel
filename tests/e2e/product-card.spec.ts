// E2e: product card display, capture & analytics (spec 009, US1/US2/US5).
//
// Requires a live stack with the spec-009 migrations applied AND an ACTIVE
// seed product whose code is provided via E2E_PRODUCT_CODE (plus its expected
// CTA headline via E2E_PRODUCT_CTA_HEADLINE). Skipped otherwise. The full
// capture→persist→render path is exercised by completing the assessment with a
// ?pr= code; here we assert the public-facing behaviour that doesn't require
// reading the DB directly.
import { test, expect } from '@playwright/test';

const code = process.env.E2E_PRODUCT_CODE;
const ctaHeadline = process.env.E2E_PRODUCT_CTA_HEADLINE;

test.describe('Product CTA card (US1/US2)', () => {
  test.skip(
    !code || !ctaHeadline,
    'Set E2E_PRODUCT_CODE + E2E_PRODUCT_CTA_HEADLINE (an active seed product) to run',
  );

  test('a ?pr= code captured at entry renders the card after completing the assessment', async ({
    page,
  }) => {
    // Enter via a campaign link carrying the product code.
    await page.goto(`/assessment?pr=${code}`);

    // Answer all 24 questions by selecting the first available option each time.
    for (let i = 0; i < 24; i++) {
      const firstOption = page.getByRole('radio').first().or(page.getByRole('checkbox').first());
      await firstOption.click();
      const next = page.getByRole('button', { name: /next|continue|see my results/i });
      if (await next.isVisible().catch(() => false)) await next.click();
    }

    // Email gate → submit.
    await page.getByLabel(/first name/i).fill('Alex');
    await page.getByLabel(/email/i).fill(`e2e+${Date.now()}@example.com`);
    await page.getByRole('button', { name: /see my results|submit|get my results/i }).click();

    // Lands on the canonical results page (no query string) — the card still shows
    // because the code was persisted on the session.
    await expect(page).toHaveURL(/\/results\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: ctaHeadline! })).toBeVisible();

    // Reopening the same shareable result still shows the card.
    await page.reload();
    await expect(page.getByRole('heading', { name: ctaHeadline! })).toBeVisible();
  });
});

test.describe('No product code (SC-003)', () => {
  test('organic results page shows no product card', async ({ page }) => {
    // The bare /results sessionStorage fallback never resolves products.
    await page.goto('/results');
    // Either the empty state or a result — but never a product CTA button.
    await expect(page.getByRole('link', { name: /start the challenge/i })).toHaveCount(0);
  });
});
