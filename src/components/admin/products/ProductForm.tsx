'use client';

// Product CTA Cards (spec 009, US3) — create/edit form with live preview.
// Left: fields. Right: <ProductPreview> (the real card) updating on every
// keystroke. Submits to the admin products API (POST create / PATCH update).
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductPreview, type ProductDraft } from '@/components/admin/products/ProductPreview';
import type { Product, ProductStatus } from '@/lib/products/types';

interface ProductFormProps {
  /** Present in edit mode; absent when creating. */
  product?: Product;
}

interface FieldErrors {
  [field: string]: string[] | undefined;
}

const inputClass =
  'w-full rounded-sm border border-theme-border bg-theme-bg-2 px-space-3 py-space-2 text-text-sm text-theme-text placeholder:text-neutral-400 focus:border-accent-500 focus:outline-none';
const labelClass = 'flex flex-col gap-space-1 text-text-sm font-medium text-theme-text';

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const editing = Boolean(product);

  const [name, setName] = useState(product?.name ?? '');
  const [code, setCode] = useState(product?.code ?? '');
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'draft');
  const [headline, setHeadline] = useState(product?.headline ?? '');
  const [subHeadline, setSubHeadline] = useState(product?.subHeadline ?? '');
  const [videoUrl, setVideoUrl] = useState(product?.videoUrl ?? '');
  const [eyebrow, setEyebrow] = useState(product?.eyebrow ?? '');
  const [ctaHeadline, setCtaHeadline] = useState(product?.ctaHeadline ?? '');
  const [ctaCopy, setCtaCopy] = useState(product?.ctaCopy ?? '');
  const [ctaButtonLabel, setCtaButtonLabel] = useState(product?.ctaButtonLabel ?? '');
  const [ctaButtonUrl, setCtaButtonUrl] = useState(product?.ctaButtonUrl ?? '');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const draft: ProductDraft = useMemo(
    () => ({
      headline,
      subHeadline: subHeadline || null,
      videoUrl: videoUrl || null,
      eyebrow,
      ctaHeadline,
      ctaCopy,
      ctaButtonLabel,
      ctaButtonUrl,
    }),
    [headline, subHeadline, videoUrl, eyebrow, ctaHeadline, ctaCopy, ctaButtonLabel, ctaButtonUrl],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const payload: Record<string, unknown> = {
      name,
      status,
      headline,
      subHeadline: subHeadline || null,
      videoUrl: videoUrl || null,
      eyebrow,
      ctaHeadline,
      ctaCopy,
      ctaButtonLabel,
      ctaButtonUrl,
    };
    if (code.trim()) payload.code = code.trim().toLowerCase();

    const url = editing ? `/api/admin/products/${product!.id}` : '/api/admin/products';
    const method = editing ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/admin/products');
        router.refresh();
        return;
      }

      const body = await res.json().catch(() => ({}));
      if (res.status === 422 && body.fields) {
        setErrors(body.fields);
        setFormError('Please fix the highlighted fields.');
      } else if (res.status === 409) {
        setErrors({ code: ['That code is already taken.'] });
        setFormError('That code is already taken.');
      } else {
        setFormError(body.message || `Save failed (${res.status}).`);
      }
    } catch {
      setFormError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const err = (field: string) =>
    errors[field]?.length ? (
      <span className="text-text-sm text-error-400">{errors[field]![0]}</span>
    ) : null;

  return (
    <div className="grid grid-cols-1 gap-space-6 lg:grid-cols-2">
      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-space-4">
        {formError && (
          <div className="rounded-sm border border-error-500/40 bg-error-500/[0.06] px-space-3 py-space-2 text-text-sm text-error-400">
            {formError}
          </div>
        )}

        <label className={labelClass}>
          Internal name
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunday Ready Challenge (admin only)" />
          {err('name')}
        </label>

        <div className="grid grid-cols-2 items-end gap-space-3">
          <label className={labelClass}>
            <span>
              Code{' '}
              {!editing && (
                <span className="font-normal text-theme-text-muted">(optional)</span>
              )}
            </span>
            <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. src" />
            {err('code')}
          </label>
          <label className={labelClass}>
            Status
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)}>
              <option value="draft">Draft (hidden)</option>
              <option value="active">Active (live)</option>
            </select>
            {err('status')}
          </label>
        </div>

        <label className={labelClass}>
          Headline
          <input className={inputClass} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="The Uneven Intermediate" />
          {err('headline')}
        </label>

        <label className={labelClass}>
          Sub-headline (optional)
          <textarea className={inputClass} rows={2} value={subHeadline} onChange={(e) => setSubHeadline(e.target.value)} />
          {err('subHeadline')}
        </label>

        <label className={labelClass}>
          Video URL (optional — Vimeo)
          <input className={inputClass} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://vimeo.com/123456789" />
          {err('videoUrl')}
        </label>

        <label className={labelClass}>
          Eyebrow
          <input className={inputClass} value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} placeholder="READY TO LEVEL UP?" />
          {err('eyebrow')}
        </label>

        <label className={labelClass}>
          CTA headline
          <input className={inputClass} value={ctaHeadline} onChange={(e) => setCtaHeadline(e.target.value)} placeholder="Start the 90-Day Challenge" />
          {err('ctaHeadline')}
        </label>

        <label className={labelClass}>
          CTA copy (supports {'{overallScore}'}, {'{archetypeName}'}, {'{firstName}'}, {'{weakestElement}'})
          <textarea className={inputClass} rows={3} value={ctaCopy} onChange={(e) => setCtaCopy(e.target.value)} placeholder="Based on your score of {overallScore}/80, ..." />
          {err('ctaCopy')}
        </label>

        <div className="flex flex-col gap-space-4">
          <label className={labelClass}>
            Button label
            <input className={inputClass} value={ctaButtonLabel} onChange={(e) => setCtaButtonLabel(e.target.value)} placeholder="Start the Challenge" />
            {err('ctaButtonLabel')}
          </label>
          <label className={labelClass}>
            Button link
            <input className={inputClass} value={ctaButtonUrl} onChange={(e) => setCtaButtonUrl(e.target.value)} placeholder="https://..." />
            {err('ctaButtonUrl')}
          </label>
        </div>

        <div className="flex items-center gap-space-3">
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer rounded-sm bg-accent-500 px-space-5 py-space-2 text-text-sm font-bold text-neutral-950 transition-colors hover:bg-accent-400 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="cursor-pointer rounded-sm border border-theme-border px-space-4 py-space-2 text-text-sm font-medium text-theme-text-muted transition-colors hover:text-theme-text"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Live preview */}
      <div className="flex flex-col gap-space-2">
        <span className="text-text-sm font-medium uppercase tracking-[0.15em] text-theme-text-muted">
          Live preview
        </span>
        <div className="lg:sticky lg:top-space-4">
          <ProductPreview draft={draft} />
        </div>
      </div>
    </div>
  );
}
