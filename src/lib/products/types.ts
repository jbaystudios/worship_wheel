// Product CTA Cards (spec 009) — shared product types.
// Data model: specs/009-product-cta-cards/data-model.md

export type ProductStatus = 'draft' | 'active';

/** A campaign-driven offer rendered on the results page. Authored in the admin;
 *  read (active only) by the results page. camelCase mirror of the products row. */
export interface Product {
  id: string;
  code: string;
  name: string;
  status: ProductStatus;
  headline: string;
  subHeadline: string | null;
  videoUrl: string | null;
  eyebrow: string;
  ctaHeadline: string;
  ctaCopy: string;
  ctaButtonLabel: string;
  ctaButtonUrl: string;
  createdAt: string;
  updatedAt: string;
}

/** Per-viewer values interpolated into product copy (research R4). */
export interface ProductCopyTokens {
  overallScore: number;
  archetypeName: string;
  firstName: string;
  weakestElement: string | null;
}

/** A product plus its engagement counts for a date range (admin list). */
export interface ProductWithEngagement extends Product {
  shown: number;
  clicked: number;
  ctr: number;
}
