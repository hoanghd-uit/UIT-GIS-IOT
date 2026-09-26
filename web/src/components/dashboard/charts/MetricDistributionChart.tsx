'use client';

import React from 'react';
import { DashboardAvailability, DashboardProvenance } from '@/types/dashboard';
import { DataModeBadge } from '../cards/DataModeBadge';
import { LoadingState } from '../states/LoadingState';
import { EmptyDataState } from '../states/EmptyDataState';
import { UnavailableDataState } from '../states/UnavailableDataState';
import { ErrorState } from '../states/ErrorState';
import { DynamicPie } from './AntChartsDynamic.client';

export interface DistributionDataPoint {
  type: string;
  value: number;
  [key: string]: unknown;
}

export interface MetricDistributionChartProps {
  data?: DistributionDataPoint[];
  metricLabel: string;
  unit?: string;
  typeKey?: string;
  valueKey?: string;
  donut?: boolean;
  provenance?: DashboardProvenance;
  availability?: DashboardAvailability;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  accessibleSummary?: string;
  height?: number;
  className?: string;
}

export function MetricDistributionChart({
  data,
  metricLabel,
  unit,
  typeKey = 'type',
  valueKey = 'value',
  donut = true,
  provenance,
  availability = 'ready',
  loading = false,
  error,
  onRetry,
  accessibleSummary,
  height = 260,
  className = '',
}: MetricDistributionChartProps) {
  // 1. Loading state
  if (loading) {
    return (
      <div className={`p-4 rounded-lg border flex flex-col justify-center min-h-[${height}px] ${className}`} style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}>
        <LoadingState message={`Đang tải biểu đồ phân bổ ${metricLabel}...`} />
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
          description="Nguồn dữ liệu phân bổ cho chỉ số này sẽ được kết nối trong giai đoạn tiếp theo."
        />
      </div>
    );
  }

  // 4. Empty data state
  if (!data || data.length === 0 || availability === 'empty') {
    return (
      <div className={`p-4 rounded-lg border min-h-[${height}px] ${className}`} style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}>
        <EmptyDataState
          title={`Không có dữ liệu phân bổ cho ${metricLabel}`}
          description="Chưa có dữ liệu tỷ lệ phù hợp để hiển thị."
        />
      </div>
    );
  }

  // Accessible summary
  const total = data.reduce((acc, cur) => acc + (Number(cur[valueKey]) || 0), 0);
  const summaryText =
    accessibleSummary ||
    `Biểu đồ phân bổ ${metricLabel} (${unit || ''}) tổng cộng ${total} gồm ${data.length} thành phần.`;

  // Ant Design Charts Pie Config
  const chartConfig: Record<string, unknown> = {
    data,
    angleField: valueKey,
    colorField: typeKey,
    innerRadius: donut ? 0.6 : 0,
    autoFit: true,
    height,
    theme: 'dark',
    legend: {
      color: {
        position: 'right',
        rowPadding: 5,
      },
    },
    tooltip: {
      items: [
        (d: Record<string, unknown>) => ({
          name: String(d[typeKey]),
          value: `${d[valueKey]} ${unit || ''}`,
        }),
      ],
    },
  };

  return (
    <div
      role="region"
      aria-label={`Biểu đồ phân bổ: ${metricLabel}`}
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
          <caption>{`Bảng số liệu phân bổ ${metricLabel}`}</caption>
          <thead>
            <tr>
              <th scope="col">Phân loại</th>
              <th scope="col">{`${metricLabel} (${unit || ''})`}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pt, idx) => (
              <tr key={idx}>
                <td>{String(pt[typeKey])}</td>
                <td>{String(pt[valueKey])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dynamic Client Chart View */}
      <div className="w-full relative" style={{ height: `${height}px` }}>
        <DynamicPie {...chartConfig} />
      </div>
    </div>
  );
}
