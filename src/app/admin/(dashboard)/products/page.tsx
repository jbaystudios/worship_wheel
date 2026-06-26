// Product CTA Cards (spec 009, US4 + US5) — product catalogue.
// Lists every product with its code, status, and engagement (shown/clicked/CTR)
// for the selected date range. Server Component; the DateRangePicker drives it.
import Link from 'next/link';
import { parseRange, defaultRange } from '@/lib/analytics/date-range';
import { listProducts } from '@/lib/products/data';
import { getProductEngagement } from '@/lib/admin/product-engagement';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { EmptyState } from '@/components/admin/states/EmptyState';
import { ProductStatusToggle } from '@/components/admin/products/ProductStatusToggle';
import type { ProductWithEngagement } from '@/lib/products/types';

export const dynamic = 'force-dynamic';

function asString(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { from?: string | string[]; to?: string | string[] };
}) {
  let range;
  try {
    range = parseRange({ from: asString(searchParams.from), to: asString(searchParams.to) });
  } catch {
    range = defaultRange();
  }

  let rows: ProductWithEngagement[] | null = null;
  let loadError: string | null = null;
  try {
    const [products, engagement] = await Promise.all([
      listProducts(),
      getProductEngagement(range),
    ]);
    const byCode = new Map(engagement.map((e) => [e.code, e]));
    rows = products.map((p) => {
      const e = byCode.get(p.code);
      return { ...p, shown: e?.shown ?? 0, clicked: e?.clicked ?? 0, ctr: e?.ctr ?? 0 };
    });
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <section className="flex flex-col gap-space-5">
      <div className="flex flex-wrap items-end justify-between gap-space-3">
        <div>
          <h1 className="text-h5 font-bold text-theme-text">Products</h1>
          <p className="mt-space-1 text-text-sm text-theme-text-muted">
            Campaign CTA cards. Drop a product&apos;s code into an email link as{' '}
            <code className="text-accent-400">?pr=code</code> to show it on results.
          </p>
        </div>
        <div className="flex items-center gap-space-3">
          <DateRangePicker from={range.from} to={range.to} includeInternal={false} />
          <Link
            href="/admin/products/new"
            className="shrink-0 cursor-pointer whitespace-nowrap rounded-sm bg-accent-500 px-space-4 py-space-2 text-text-sm font-bold text-neutral-950 transition-colors hover:bg-accent-400"
          >
            New product
          </Link>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-md border border-error-500/40 bg-error-500/[0.06] px-space-5 py-space-4">
          <p className="text-text-base font-bold text-error-400">Products unavailable</p>
          <p className="mt-space-1 text-text-sm text-theme-text-muted">
            Could not load products — confirm the spec-009 Supabase migrations have
            been applied. Details: {loadError}
          </p>
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title="No products yet"
          message="Create your first product to promote it on the results page via a ?pr= campaign link."
        />
      ) : rows ? (
        <div className="overflow-x-auto rounded-md border border-theme-border">
          <table className="w-full text-left text-text-sm">
            <thead className="border-b border-theme-border text-theme-text-muted">
              <tr>
                <th className="px-space-4 py-space-3 font-medium">Code</th>
                <th className="px-space-4 py-space-3 font-medium">Name</th>
                <th className="px-space-4 py-space-3 font-medium">Status</th>
                <th className="px-space-4 py-space-3 font-medium text-right">Shown</th>
                <th className="px-space-4 py-space-3 font-medium text-right">Clicks</th>
                <th className="px-space-4 py-space-3 font-medium text-right">CTR</th>
                <th className="px-space-4 py-space-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-theme-border/60 last:border-0">
                  <td className="px-space-4 py-space-3">
                    <code className="text-accent-400">{p.code}</code>
                  </td>
                  <td className="px-space-4 py-space-3 text-theme-text">{p.name}</td>
                  <td className="px-space-4 py-space-3">
                    <span
                      className={`inline-flex rounded-sm px-space-2 py-space-1 text-text-sm font-medium ${
                        p.status === 'active'
                          ? 'bg-success-500/15 text-success-400'
                          : 'bg-neutral-700/40 text-theme-text-muted'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-space-4 py-space-3 text-right tabular-nums text-theme-text">{p.shown}</td>
                  <td className="px-space-4 py-space-3 text-right tabular-nums text-theme-text">{p.clicked}</td>
                  <td className="px-space-4 py-space-3 text-right tabular-nums text-theme-text-muted">
                    {(p.ctr * 100).toFixed(1)}%
                  </td>
                  <td className="px-space-4 py-space-3">
                    <div className="flex items-center justify-end gap-space-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="cursor-pointer rounded-sm border border-theme-border px-space-3 py-space-1 text-text-sm font-medium text-theme-text-muted transition-colors hover:text-theme-text"
                      >
                        Edit
                      </Link>
                      <ProductStatusToggle id={p.id} status={p.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
