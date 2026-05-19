'use client';

// Dashboard navigation with active-route highlighting (spec 005, US1).
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'Funnel' },
  { href: '/admin/acquisition', label: 'Acquisition' },
  { href: '/admin/outcomes', label: 'Outcomes' },
  { href: '/admin/leads', label: 'Leads' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-space-2" aria-label="Dashboard sections">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
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
