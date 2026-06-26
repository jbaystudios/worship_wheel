// Product CTA Cards (spec 009, US3) — create a product.
import Link from 'next/link';
import { ProductForm } from '@/components/admin/products/ProductForm';

export const dynamic = 'force-dynamic';

export default function NewProductPage() {
  return (
    <section className="flex flex-col gap-space-5">
      <div>
        <Link
          href="/admin/products"
          className="cursor-pointer text-text-sm text-theme-text-muted transition-colors hover:text-theme-text"
        >
          ← Products
        </Link>
        <h1 className="mt-space-1 text-h5 font-bold text-theme-text">New product</h1>
        <p className="mt-space-1 text-text-sm text-theme-text-muted">
          Fill in the offer. The preview updates live. A unique code is generated
          on save unless you set one. New products start as <strong>Draft</strong>.
        </p>
      </div>
      <ProductForm />
    </section>
  );
}
