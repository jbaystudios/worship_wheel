// Zod schema for the funnel event payload (spec 005, US2 / task T024).
// Contract: specs/005-admin-dashboard/contracts/events-api.md
import { z } from 'zod';
import { questions } from '@/data/questions';

const KNOWN_QUESTION_IDS = new Set(questions.map((q) => q.id));

export const EVENT_TYPES = [
  'page_view',
  'assessment_started',
  'question_viewed',
  'question_answered',
  'assessment_submitted',
  'pdf_downloaded',
  'product_cta_shown',
  'product_cta_clicked',
] as const;

const QUESTION_EVENT_TYPES = new Set(['question_viewed', 'question_answered']);
const PRODUCT_EVENT_TYPES = new Set(['product_cta_shown', 'product_cta_clicked']);
const PRODUCT_CODE_RE = /^[a-z0-9]{3,6}$/;

const acquisitionSchema = z.object({
  utmSource: z.string().max(255).nullish(),
  utmMedium: z.string().max(255).nullish(),
  utmCampaign: z.string().max(255).nullish(),
  utmTerm: z.string().max(255).nullish(),
  utmContent: z.string().max(255).nullish(),
  referrer: z.string().max(2048).nullish(),
  landingPath: z.string().max(2048).nullish(),
});

export const eventPayloadSchema = z
  .object({
    anonSessionId: z.string().uuid(),
    eventType: z.enum(EVENT_TYPES),
    clientTs: z.string().datetime().optional(),
    questionId: z.string().max(64).optional(),
    questionPosition: z.number().int().min(1).max(24).optional(),
    resultId: z.string().uuid().optional(),
    productCode: z.string().regex(PRODUCT_CODE_RE).optional(),
    acquisition: acquisitionSchema.optional(),
  })
  .superRefine((val, ctx) => {
    const isQuestionEvent = QUESTION_EVENT_TYPES.has(val.eventType);

    if (isQuestionEvent) {
      if (!val.questionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['questionId'],
          message: 'required for question events',
        });
      } else if (!KNOWN_QUESTION_IDS.has(val.questionId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['questionId'],
          message: 'unknown question id',
        });
      }
      if (val.questionPosition === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['questionPosition'],
          message: 'required for question events',
        });
      }
    } else {
      if (val.questionId !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['questionId'],
          message: 'only allowed on question events',
        });
      }
      if (val.questionPosition !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['questionPosition'],
          message: 'only allowed on question events',
        });
      }
    }

    if (val.resultId !== undefined && val.eventType !== 'assessment_submitted') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resultId'],
        message: 'only allowed on assessment_submitted',
      });
    }

    const isProductEvent = PRODUCT_EVENT_TYPES.has(val.eventType);
    if (isProductEvent && !val.productCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productCode'],
        message: 'required for product events',
      });
    } else if (!isProductEvent && val.productCode !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productCode'],
        message: 'only allowed on product events',
      });
    }
  });

export type ValidatedEvent = z.infer<typeof eventPayloadSchema>;

/** A request may carry a single event or a small batch (max 10). */
export const eventBatchSchema = z.union([
  eventPayloadSchema,
  z.array(eventPayloadSchema).min(1).max(10),
]);
