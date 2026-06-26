// Product CTA Cards (spec 009) — Zod validation at the boundary.
// Contract: specs/009-product-cta-cards/contracts/products-admin-api.md
import { z } from 'zod';

/** Short opaque code: 3–6 lowercase alphanumerics. The value placed in ?pr=. */
export const PRODUCT_CODE_RE = /^[a-z0-9]{3,6}$/;

/** Max product codes rendered per session / accepted per submit (research R2). */
export const MAX_PR_CODES = 3;

/** Authoring payload for create/update (admin). `code` is optional on create
 *  (auto-generated when omitted) and re-validated for uniqueness at the DB. */
export const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  status: z.enum(['draft', 'active']).default('draft'),
  code: z.string().regex(PRODUCT_CODE_RE).optional(),
  headline: z.string().trim().min(1).max(120),
  subHeadline: z.string().trim().max(240).nullish(),
  videoUrl: z.string().url().max(2048).nullish(),
  eyebrow: z.string().trim().min(1).max(60),
  ctaHeadline: z.string().trim().min(1).max(120),
  ctaCopy: z.string().trim().min(1).max(600),
  ctaButtonLabel: z.string().trim().min(1).max(40),
  ctaButtonUrl: z.string().url().max(2048),
});

export type ProductInput = z.infer<typeof productSchema>;

/** Partial update — any subset of the authoring fields. */
export const productUpdateSchema = productSchema.partial();

/** Codes carried in the assessment submit body (US2). Each validated; the array
 *  is capped defensively (the client also normalizes + caps). */
export const prCodesSchema = z
  .array(z.string().regex(PRODUCT_CODE_RE))
  .max(MAX_PR_CODES);
