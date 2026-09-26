'use client';

import React from 'react';
import { DashboardAvailability, DashboardProvenance } from '@/types/dashboard';
import { DataModeBadge } from '../cards/DataModeBadge';
import { LoadingState } from '../states/LoadingState';
import { EmptyDataState } from '../states/EmptyDataState';
import { UnavailableDataState } from '../states/UnavailableDataState';
import { ErrorState } from '../states/ErrorState';
import { DynamicColumn } from './AntChartsDynamic.client';

export interface BarDataPoint {
  category: string;
  value: number;
  series?: string;
  [key: string]: unknown;
}

export interface MetricBarChartProps {
  data?: BarDataPoint[];
  metricLabel: string;
  unit?: string;
  categoryKey?: string;
  valueKey?: string;
  seriesKey?: string;
  provenance?: DashboardProvenance;
  availability?: DashboardAvailability;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  accessibleSummary?: string;
  height?: number;
  className?: string;
}

export function MetricBarChart({
  data,
  metricLabel,
  unit,
  categoryKey = 'category',
  valueKey = 'value',
  seriesKey,
  provenance,
  availability = 'ready',
  loading = false,
  error,
  onRetry,
  accessibleSummary,
  height = 260,
  className = '',
}: MetricBarChartProps) {
  // 1. Loading state
  if (loading) {
    return (
      <div className={`p-4 rounded-lg border flex flex-col justify-center min-h-[${height}px] ${className}`} style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}>
        <LoadingState message={`Đang tải biểu đồ ${metricLabel}...`} />
      </div>
    );
  }

  // 2. Error state
  if (error || availability === 'error') {
    return (
      <div className={`p-4 rounded-lg border min-h-[${height}px] ${className}`} style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}>
        <ErrorState
          title={`Lỗi nạp biểu đồ ${metricLabel}`}
          error={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  // 3. Unavailable state
  if (availability === 'unavailable') {
    return (
      <div className={`p-4 rounded-lg border min-h-[${height}px] ${className}`} style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}>
        <UnavailableDataState
          title={`Biểu đồ ${metricLabel} chưa được kết nối`}
          description="Nguồn dữ liệu phân loại cho chỉ số này sẽ được kết nối trong giai đoạn tiếp theo."
        />
      </div>
    );
  }

  // 4. Empty data state
  if (!data || data.length === 0 || availability === 'empty') {
    return (
      <div className={`p-4 rounded-lg border min-h-[${height}px] ${className}`} style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}>
        <EmptyDataState
          title={`Không có dữ liệu cho ${metricLabel}`}
          description="Chưa có dữ liệu danh mục nào phù hợp để hiển thị."
        />
      </div>
    );
  }

  // Accessible summary
  const summaryText =
    accessibleSummary ||
    `Biểu đồ phân loại ${metricLabel} (${unit || ''}) gồm ${data.length} danh mục.`;

  // Ant Design Charts Column Config
  const chartConfig: Record<string, unknown> = {
    data,
    xField: categoryKey,
    yField: valueKey,
    autoFit: true,
    height,
    theme: 'dark',
    axis: {
      x: {
        title: false,
      },
      y: {
        title: unit ? `${metricLabel} (${unit})` : metricLabel,
        gridStroke: 'rgba(78, 163, 225, 0.1)',
      },
    },
  };

  if (seriesKey) {
    chartConfig.colorField = seriesKey;
  }

  return (
    <div
      role="region"
      aria-label={`Biểu đồ cột: ${metricLabel}`}
      className={`p-4 rounded-lg border flex flex-col gap-3 ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b pb-2" style={{ borderColor: 'rgba(78, 163, 225, 0.15)' }}>
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            {metricLabel}
          </h4>
          {unit && (
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              ({unit})
            </span>
          )}
        </div>
        {provenance && (
          <DataModeBadge
            mode={provenance.mode}
            provenance={provenance}
            availability={availability}
            size="sm"
          />
        )}
      </div>

      {/* Screen-reader Accessible Summary */}
      <div className="sr-only" aria-live="polite">
        <p>{summaryText}</p>
        <table>
          <caption>{`Bảng số liệu phân loại ${metricLabel}`}</caption>
          <thead>
            <tr>
              <th scope="col">Danh mục</th>
              <th scope="col">{`${metricLabel} (${unit || ''})`}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pt, idx) => (
              <tr key={idx}>
                <td>{String(pt[categoryKey])}</td>
                <td>{String(pt[valueKey])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dynamic Client Chart View */}
      <div className="w-full relative" style={{ height: `${height}px` }}>
        <DynamicColumn {...chartConfig} />
      </div>
    </div>
  );
}
