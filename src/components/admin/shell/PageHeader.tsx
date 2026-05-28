// PageHeader — uniform header for every admin page (spec 007).
// Title (H5), description (Text Small, muted), optional breadcrumb, right-slot.
import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  rightSlot?: ReactNode;
}

export function PageHeader({ title, description, breadcrumb, rightSlot }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-space-2 border-b border-theme-border pb-space-4">
      {breadcrumb && <div className="text-text-sm text-theme-text-muted">{breadcrumb}</div>}
      <div className="flex flex-wrap items-end justify-between gap-space-3">
        <div className="flex flex-col gap-space-1">
          <h1 className="text-h5 font-bold text-theme-text">{title}</h1>
          {description && (
            <p className="text-text-sm text-theme-text-muted">{description}</p>
          )}
        </div>
        {rightSlot && <div className="flex items-center gap-space-2">{rightSlot}</div>}
      </div>
    </header>
  );
}
