import React from 'react';

export interface DashboardPageShellProps {
  pageNumber: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardPageShell({
  pageNumber,
  title,
  description,
  actions,
  badge,
  children,
  className = '',
}: DashboardPageShellProps) {
  return (
    <div className={`flex flex-col gap-6 max-w-7xl mx-auto w-full ${className}`}>
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--panel-elevated)',
                color: 'var(--accent-cyan)',
                border: '1px solid var(--border)',
              }}
            >
              Trang {pageNumber}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            {badge && <div className="ml-2">{badge}</div>}
          </div>
          {description && (
            <p className="text-xs sm:text-sm max-w-3xl" style={{ color: 'var(--text-muted)' }}>
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </header>

      {/* Main Page Content Body */}
      <main className="flex flex-col gap-6">{children}</main>
    </div>
  );
}
