import React from 'react';

export interface DashboardSectionProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  description,
  actions,
  children,
  className = '',
}: DashboardSectionProps) {
  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Section Content */}
      <div className="pt-1">{children}</div>
    </section>
  );
}
