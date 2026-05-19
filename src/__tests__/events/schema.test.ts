import { describe, it, expect } from 'vitest';
import { eventPayloadSchema, eventBatchSchema } from '@/lib/events/schema';

const SID = '8f2a1c40-1b2e-4d3a-9c11-7e6f5a4b3c2d';

describe('eventPayloadSchema', () => {
  it('accepts a page_view with acquisition context', () => {
    const result = eventPayloadSchema.safeParse({
      anonSessionId: SID,
      eventType: 'page_view',
      acquisition: { utmSource: 'youtube', utmMedium: 'social', referrer: null },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a question_viewed with a known question id + position', () => {
    const result = eventPayloadSchema.safeParse({
      anonSessionId: SID,
      eventType: 'question_viewed',
      questionId: 'fb_01',
      questionPosition: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a question event missing its questionId', () => {
    const result = eventPayloadSchema.safeParse({
      anonSessionId: SID,
      eventType: 'question_answered',
      questionPosition: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown question id', () => {
    const result = eventPayloadSchema.safeParse({
      anonSessionId: SID,
      eventType: 'question_viewed',
      questionId: 'not_a_real_question',
      questionPosition: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects question fields on a non-question event', () => {
    const result = eventPayloadSchema.safeParse({
      anonSessionId: SID,
      eventType: 'page_view',
      questionId: 'fb_01',
      questionPosition: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects resultId on anything but assessment_submitted', () => {
    const result = eventPayloadSchema.safeParse({
      anonSessionId: SID,
      eventType: 'assessment_started',
      resultId: SID,
    });
    expect(result.success).toBe(false);
  });

  it('accepts resultId on assessment_submitted', () => {
    const result = eventPayloadSchema.safeParse({
      anonSessionId: SID,
      eventType: 'assessment_submitted',
      resultId: SID,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed anonSessionId', () => {
    const result = eventPayloadSchema.safeParse({
      anonSessionId: 'not-a-uuid',
      eventType: 'page_view',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a question position outside 1-24', () => {
    const result = eventPayloadSchema.safeParse({
      anonSessionId: SID,
      eventType: 'question_viewed',
      questionId: 'fb_01',
      questionPosition: 25,
    });
    expect(result.success).toBe(false);
  });
});

describe('eventBatchSchema', () => {
  it('accepts a single event', () => {
    expect(
      eventBatchSchema.safeParse({ anonSessionId: SID, eventType: 'page_view' }).success,
    ).toBe(true);
  });

  it('accepts a small batch', () => {
    const batch = Array.from({ length: 5 }, () => ({
      anonSessionId: SID,
      eventType: 'assessment_started' as const,
    }));
    expect(eventBatchSchema.safeParse(batch).success).toBe(true);
  });

  it('rejects a batch larger than 10', () => {
    const batch = Array.from({ length: 11 }, () => ({
      anonSessionId: SID,
      eventType: 'assessment_started' as const,
    }));
    expect(eventBatchSchema.safeParse(batch).success).toBe(false);
  });
});
