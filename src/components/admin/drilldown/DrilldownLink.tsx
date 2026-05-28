'use client';

// DrilldownLink — composes a destination URL by inheriting the parent's
// dashboard state and layering caller-supplied overrides. Section-local
// filters (search, sort, page, pageSize, syncState, archetypeId, sourceKey)
// reset on inherit; pass them explicitly via `overrides` to carry them across.
//
// Spec 007 — contracts/url-state.md propagation rules.
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type ReactNode } from 'react';
import {
  type DashboardState,
  decode,
  href,
  inherit,
} from '@/lib/admin/url-state';

export interface DrilldownLinkProps {
  href: string; // destination pathname (no query string)
  overrides?: Partial<DashboardState>;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
  ariaLabel?: string;
}

export function DrilldownLink({
  href: pathname,
  overrides,
  className,
  children,
  prefetch,
  ariaLabel,
}: DrilldownLinkProps) {
  const params = useSearchParams();
  const parent = decode(asRecord(params));
  const next = inherit(parent, overrides);
  return (
    <Link
      href={href(pathname, next)}
      className={className}
      prefetch={prefetch}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}

function asRecord(p: ReturnType<typeof useSearchParams>): Record<string, string> {
  const out: Record<string, string> = {};
  if (!p) return out;
  p.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}
