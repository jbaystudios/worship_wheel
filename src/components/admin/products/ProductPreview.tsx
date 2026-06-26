'use client';

// Product CTA Cards (spec 009, US3) — live admin preview.
// Renders the REAL <ProductCard> with the in-progress draft and sample tokens,
// so the admin sees exactly what a visitor will see (true WYSIWYG, FR-013).
// `preview` keeps unknown {tokens} visible to help authors spot typos.
import { ProductCard } from '@/components/results/ProductCard';
import type { Product, ProductCopyTokens } from '@/lib/products/types';

const SAMPLE_TOKENS: ProductCopyTokens = {
  overallScore: 35,
  archetypeName: 'The Uneven Intermediate',
  firstName: 'Alex',
  weakestElement: 'Rhythm',
};

/** The subset of Product fields the form edits. */
export type ProductDraft = Pick<
  Product,
  | 'headline'
  | 'subHeadline'
  | 'videoUrl'
  | 'eyebrow'
  | 'ctaHeadline'
  | 'ctaCopy'
  | 'ctaButtonLabel'
  | 'ctaButtonUrl'
>;

export function ProductPreview({ draft }: { draft: ProductDraft }) {
  const product: Product = {
    id: 'preview',
    code: 'prev',
    name: 'Preview',
    status: 'draft',
    createdAt: '',
    updatedAt: '',
    ...draft,
  };

  return (
    <div className="overflow-hidden rounded-md border border-theme-border bg-theme-bg">
      <ProductCard product={product} tokens={SAMPLE_TOKENS} preview />
    </div>
  );
}
