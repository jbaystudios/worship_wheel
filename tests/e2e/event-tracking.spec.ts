// E2e: assessment funnel event tracking (spec 005, US2 / task T023).
// Verifies the assessment emits funnel events and that a tracking failure
// never blocks the assessment (FR-021). These assertions observe the client's
// outgoing /api/events requests, so they do not require a connected database.
import { test, expect } from '@playwright/test';

test.describe('Assessment funnel event tracking', () => {
  test('emits a page_view event on assessment load', async ({ page }) => {
    const eventRequest = page.waitForRequest(
      (req) => req.url().includes('/api/events') && req.method() === 'POST',
      { timeout: 10_000 },
    );
    await page.goto('/assessment');
    const req = await eventRequest;
    expect(req.postData() ?? '').toContain('page_view');
  });

  test('emits assessment_started + question events when a question is answered', async ({
    page,
  }) => {
    const payloads: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/events') && req.method() === 'POST') {
        payloads.push(req.postData() ?? '');
      }
    });

    await page.goto('/assessment');
    // The first question is single-select — clicking an option advances the funnel.
    await page.getByRole('button').first().click();

    await expect
      .poll(() => payloads.join('|'), { timeout: 10_000 })
      .toContain('assessment_started');
    expect(payloads.join('|')).toContain('question_answered');
  });

  test('the assessment still works when event tracking fails (non-blocking)', async ({
    page,
  }) => {
    // Make every event request fail outright.
    await page.route('**/api/events', (route) => route.abort());

    await page.goto('/assessment');
    // The first question renders despite tracking being dead.
    await expect(page.getByText('1 / 24')).toBeVisible();

    // Answering still auto-advances to question 2.
    await page.getByRole('button').first().click();
    await expect(page.getByText('2 / 24')).toBeVisible({ timeout: 5_000 });
  });
});
