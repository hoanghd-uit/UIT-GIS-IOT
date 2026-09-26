'use client';

import React from 'react';
import { DashboardAvailability, DashboardProvenance } from '@/types/dashboard';
import { DataModeBadge } from '../cards/DataModeBadge';
import { LoadingState } from '../states/LoadingState';
import { EmptyDataState } from '../states/EmptyDataState';
import { UnavailableDataState } from '../states/UnavailableDataState';
import { ErrorState } from '../states/ErrorState';
import { DynamicLine } from './AntChartsDynamic.client';

export interface TrendDataPoint {
  timestamp: string;
  value: number;
  category?: string;
  [key: string]: unknown;
}

export interface MetricTrendChartProps {
  data?: TrendDataPoint[];
  metricLabel: string;
  unit?: string;
  timeKey?: string;
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

export function MetricTrendChart({
  data,
  metricLabel,
  unit,
  timeKey = 'timestamp',
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
}: MetricTrendChartProps) {
  // 1. Loading state
  if (loading) {
    return (
      <div className={`p-4 rounded-lg border flex flex-col justify-center min-h-[${height}px] ${className}`} style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}>
        <LoadingState message={`Đang tải xu hướng ${metricLabel}...`} />
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
          description="Nguồn dữ liệu xu hướng cho chỉ số này sẽ được kết nối trong giai đoạn tiếp theo."
        />
      </div>
    );
  }

  // 4. Empty data state
  if (!data || data.length === 0 || availability === 'empty') {
    return (
      <div className={`p-4 rounded-lg border min-h-[${height}px] ${className}`} style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}>
        <EmptyDataState
          title={`Không có dữ liệu xu hướng cho ${metricLabel}`}
          description="Chưa ghi nhận điểm dữ liệu nào trong khoảng thời gian đã chọn."
        />
      </div>
    );
  }

  // Build accessible table / summary description
  const summaryText =
    accessibleSummary ||
    `Biểu đồ xu hướng ${metricLabel} (${unit || ''}) gồm ${data.length} điểm dữ liệu từ ${data[0]?.[timeKey]} đến ${data[data.length - 1]?.[timeKey]}.`;

  // Ant Design Charts Line Config
  const chartConfig: Record<string, unknown> = {
    data,
    xField: timeKey,
    yField: valueKey,
    autoFit: true,
    height,
    theme: 'dark',
    style: {
      lineWidth: 2,
    },
    axis: {
      x: {
        title: false,
        labelSpacing: 8,
      },
      y: {
        title: unit ? `${metricLabel} (${unit})` : metricLabel,
        gridStroke: 'rgba(78, 163, 225, 0.1)',
      },
    },
    tooltip: {
      showMarkers: true,
    },
  };

  if (seriesKey) {
    chartConfig.colorField = seriesKey;
  }

  return (
    <div
      role="region"
      aria-label={`Biểu đồ xu hướng: ${metricLabel}`}
      className={`p-4 rounded-lg border flex flex-col gap-3 ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Chart Header */}
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
          <caption>{`Bảng số liệu ${metricLabel}`}</caption>
          <thead>
            <tr>
              <th scope="col">Thời điểm</th>
              <th scope="col">{`${metricLabel} (${unit || ''})`}</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((pt, idx) => (
              <tr key={idx}>
                <td>{String(pt[timeKey])}</td>
                <td>{String(pt[valueKey])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dynamic Client Chart View */}
      <div className="w-full relative" style={{ height: `${height}px` }}>
        <DynamicLine {...chartConfig} />
      </div>
    </div>
  );
}
