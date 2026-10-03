import React from 'react';

export interface DashboardPageShellProps {
  pageNumber?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  hidePageBadge?: boolean;
  hideDivider?: boolean;
  subtitleWithDot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function DashboardPageShell({
  pageNumber,
  title,
  description,
  actions,
  badge,
  hidePageBadge = false,
  hideDivider = false,
  subtitleWithDot = false,
  children,
  className = '',
}: DashboardPageShellProps) {
  return (
    <div className={`flex flex-col gap-6 w-full ${className}`}>
      {/* Page Header */}
      <header
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
          hideDivider ? '' : 'border-b pb-4'
        }`}
        style={hideDivider ? undefined : { borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            {!hidePageBadge && pageNumber && (
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--panel-elevated)',
                  color: 'var(--primary)',
                  border: '1px solid var(--border)',
                }}
              >
                Trang {pageNumber}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            {badge && <div className="ml-1">{badge}</div>}
          </div>
          {description && (
            <div className="flex items-center gap-2 mt-0.5">
              {subtitleWithDot && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--primary)' }}
                  aria-hidden="true"
                />
              )}
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                {description}
              </p>
            </div>
          )}
        </div>

        {actions && <div className="flex items-center gap-3 shrink-0 flex-wrap">{actions}</div>}
      </header>

      {/* Main Page Content Body */}
      <main className="flex flex-col gap-6 w-full">{children}</main>
    </div>
  );
}

