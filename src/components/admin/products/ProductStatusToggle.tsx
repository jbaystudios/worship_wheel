'use client';

// Product CTA Cards (spec 009, US4) — activate/deactivate a product inline.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductStatus } from '@/lib/products/types';

interface Props {
  id: string;
  status: ProductStatus;
}

export function ProductStatusToggle({ id, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const next: ProductStatus = status === 'active' ? 'draft' : 'active';

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="cursor-pointer rounded-sm border border-theme-border px-space-3 py-space-1 text-text-sm font-medium text-theme-text-muted transition-colors hover:text-theme-text disabled:opacity-60"
    >
      {busy ? '…' : next === 'active' ? 'Activate' : 'Deactivate'}
    </button>
  );
}
