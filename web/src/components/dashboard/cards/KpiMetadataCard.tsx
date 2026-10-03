import React from 'react';
import { DashboardAvailability, DashboardProvenance } from '@/types/dashboard';
import { DataModeBadge } from './DataModeBadge';

export interface KpiTrend {
  value: number | string;
  direction: 'up' | 'down' | 'neutral';
  label?: string;
}

export interface KpiMetadataCardProps {
  title: string;
  value?: string | number | null;
  unit?: string;
  trend?: KpiTrend;
  provenance?: DashboardProvenance;
  availability?: DashboardAvailability;
  emptyPlaceholder?: string;
  subtitle?: string;
  className?: string;
}

export function KpiMetadataCard({
  title,
  value,
  unit,
  trend,
  provenance,
  availability,
  emptyPlaceholder = '—',
  subtitle,
  className = '',
}: KpiMetadataCardProps) {
  // Invariant BP2-P01-T11: Missing/null/empty/unavailable value must NEVER render as numeric zero (0).
  const isMissingValue = value === undefined || value === null || value === '';
  const isUnavailable = availability === 'unavailable';
  const isEmpty = availability === 'empty';

  const renderValue = () => {
    if (isUnavailable) {
      return (
        <span className="text-sm font-medium italic" style={{ color: 'var(--text-muted)' }}>
          Chưa kết nối
        </span>
      );
    }
    if (isEmpty || isMissingValue) {
      return (
        <span className="text-2xl font-light font-mono" style={{ color: 'var(--text-muted)' }}>
          {emptyPlaceholder}
        </span>
      );
    }
    return (
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight font-mono" style={{ color: 'var(--text-primary)' }}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      role="article"
      aria-label={`${title}: ${isMissingValue || isUnavailable ? 'Chưa có dữ liệu' : `${value} ${unit || ''}`}`}
      className={`flex flex-col justify-between p-4 rounded-lg border transition-all ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Card Header: Title + Provenance / Mode */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider truncate" style={{ color: 'var(--text-muted)' }}>
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {provenance && (
          <div className="shrink-0">
            <DataModeBadge
              mode={provenance.mode}
              provenance={provenance}
              availability={availability}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Card Body: Metric Value */}
      <div className="my-2 min-h-[36px] flex items-center">
        {renderValue()}
      </div>

      {/* Card Footer: Trend or Observation status */}
      <div className="mt-2 pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'rgba(78, 163, 225, 0.15)' }}>
        {trend ? (
          <div className="flex items-center gap-1.5 font-medium">
            <span
              style={{
                color:
                  trend.direction === 'up'
                    ? 'var(--success)'
                    : trend.direction === 'down'
                    ? 'var(--danger)'
                    : 'var(--text-muted)',
              }}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.value}
            </span>
            {trend.label && <span style={{ color: 'var(--text-muted)' }}>{trend.label}</span>}
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>
            {provenance?.observedAt
              ? `Cập nhật: ${new Date(provenance.observedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
              : availability === 'unavailable'
              ? 'Chờ tích hợp nguồn'
              : 'Định dạng chuẩn'}
          </span>
        )}
      </div>
    </div>
  );
}
