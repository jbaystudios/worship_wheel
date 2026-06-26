// Product CTA Cards (spec 009, US3) — edit a product.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/products/data';
import { ProductForm } from '@/components/admin/products/ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <section className="flex flex-col gap-space-5">
      <div>
        <Link
          href="/admin/products"
          className="cursor-pointer text-text-sm text-theme-text-muted transition-colors hover:text-theme-text"
        >
          ← Products
        </Link>
        <div className="mt-space-1 flex flex-wrap items-center gap-space-3">
          <h1 className="text-h5 font-bold text-theme-text">Edit product</h1>
          <code className="rounded-sm bg-theme-bg-2 px-space-2 py-space-1 text-text-sm text-accent-400">
            ?pr={product.code}
          </code>
        </div>
      </div>
      <ProductForm product={product} />
    </section>
  );
}
