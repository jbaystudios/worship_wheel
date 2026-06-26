'use client';

// Dashboard navigation with active-route highlighting (spec 005 + spec 007).
// Funnel section spans `/admin` root plus the new `/admin/funnel/*` drill-downs.
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  matches: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin',
    label: 'Funnel',
    matches: (p) => p === '/admin' || p.startsWith('/admin/funnel'),
  },
  {
    href: '/admin/acquisition',
    label: 'Acquisition',
    matches: (p) => p.startsWith('/admin/acquisition'),
  },
  {
    href: '/admin/outcomes',
    label: 'Outcomes',
    matches: (p) => p.startsWith('/admin/outcomes'),
  },
  {
    href: '/admin/leads',
    label: 'Leads',
    matches: (p) => p.startsWith('/admin/leads'),
  },
  // spec 009 — product catalogue (campaign CTA cards). Root-level alongside the
  // stats sections above.
  {
    href: '/admin/products',
    label: 'Products',
    matches: (p) => p.startsWith('/admin/products'),
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-space-2" aria-label="Dashboard sections">
      {NAV_ITEMS.map(({ href, label, matches }) => {
        const active = matches(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`cursor-pointer rounded-sm px-space-3 py-space-2 text-text-sm font-medium transition-colors ${
              active
                ? 'bg-accent-500 text-neutral-950'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
