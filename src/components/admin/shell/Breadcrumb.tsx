'use client';

// Breadcrumb — back-to-parent affordance that preserves the parent's URL state
// via <DrilldownLink>. Spec 007 contracts/url-state.md propagation rules.
import { DrilldownLink } from '@/components/admin/drilldown/DrilldownLink';

interface BreadcrumbProps {
  parentHref: string;
  parentLabel: string;
}

export function Breadcrumb({ parentHref, parentLabel }: BreadcrumbProps) {
  return (
    <DrilldownLink
      href={parentHref}
      className="inline-flex items-center gap-space-1 text-text-sm text-theme-text-muted transition-colors hover:text-theme-text"
      ariaLabel={`Back to ${parentLabel}`}
    >
      <span aria-hidden="true">←</span>
      <span>Back to {parentLabel}</span>
    </DrilldownLink>
  );
}
