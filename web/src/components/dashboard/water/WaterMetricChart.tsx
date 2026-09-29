'use client';

import React from 'react';
import {
  DashboardWaterReadingItem,
  WaterMetricKey,
} from '@/types/dashboard-water';
import {
  prepareWaterChartData,
  WATER_METRICS_MAP,
} from '@/lib/dashboard/water-chart';
import { MetricTrendChart } from '@/components/dashboard/charts/MetricTrendChart';
import { LoadingState } from '@/components/dashboard/states/LoadingState';
import { EmptyDataState } from '@/components/dashboard/states/EmptyDataState';
import { ErrorState } from '@/components/dashboard/states/ErrorState';

export interface WaterMetricChartProps {
  selectedMeterId: string | null;
  readings: DashboardWaterReadingItem[];
  activeMetric: WaterMetricKey;
  onMetricChange: (metric: WaterMetricKey) => void;
  status: 'idle' | 'loading' | 'refreshing' | 'ready' | 'empty' | 'unavailable' | 'error';
  error?: unknown;
  onRefresh: () => void;
  onRetry?: () => void;
}

const METRIC_TABS: { key: WaterMetricKey; label: string; unit: string }[] = [
  { key: 'instantFlowM3h', label: 'Lưu lượng', unit: 'm³/h' },
  { key: 'forwardVolumeM3', label: 'Lũy kế thuận', unit: 'm³' },
  { key: 'reverseVolumeM3', label: 'Lũy kế nghịch', unit: 'm³' },
  { key: 'temperatureC', label: 'Nhiệt độ', unit: '°C' },
];

export function WaterMetricChart({
  selectedMeterId,
  readings,
  activeMetric,
  onMetricChange,
  status,
  error,
  onRefresh,
  onRetry,
}: WaterMetricChartProps) {
  const metricCfg = WATER_METRICS_MAP[activeMetric] || WATER_METRICS_MAP.instantFlowM3h;
  const { chartPoints, hasData, latestValue, accessibleSummary } =
    prepareWaterChartData(readings, activeMetric);

  const isRefreshing = status === 'refreshing';
  const isLoading = status === 'loading';

  return (
    <div
      role="region"
      aria-label="Biểu đồ dữ liệu đồng hồ nước AVC theo thời gian"
      className="p-4 rounded-xl border flex flex-col justify-between min-h-[460px] transition-all"
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header with Title, Refresh Button, and Metric Selector */}
      <div className="flex flex-col gap-3 pb-3 border-b border-[rgba(83,109,126,0.2)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-[#E6EDF1]">
              Nước · dữ liệu theo thời gian
            </h3>
            {selectedMeterId ? (
              <span className="font-mono text-xs text-[var(--primary)] bg-[rgba(79,185,173,0.12)] px-2 py-0.5 rounded border border-[rgba(79,185,173,0.3)]">
                {selectedMeterId}
              </span>
            ) : (
              <span className="text-xs text-[var(--primary)] bg-[rgba(79,185,173,0.12)] px-2 py-0.5 rounded border border-[rgba(79,185,173,0.3)]">
                Toàn bộ đồng hồ AVC (Tổng hợp)
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isLoading || isRefreshing}
            onClick={onRefresh}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${isLoading || isRefreshing
              ? 'opacity-50 cursor-not-allowed bg-white/5 text-[#7E8B96] border-white/10'
              : 'text-[#E6EDF1] hover:text-white bg-[rgba(23,34,44,0.6)] hover:bg-[rgba(23,34,44,0.9)] border-[rgba(83,109,126,0.3)]'
              }`}
            title="Tải lại dữ liệu mới nhất (không tự động lặp)"
            aria-label="Tải lại dữ liệu telemetry"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--primary)]' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isRefreshing ? 'Đang nạp...' : 'Làm mới'}</span>
          </button>
        </div>

        {/* Metric Selector Pills */}
        <div
          role="group"
          aria-label="Chọn thông số hiển thị trên biểu đồ"
          className="flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {METRIC_TABS.map((tab) => {
            const isActive = activeMetric === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onMetricChange(tab.key)}
                className={`px-3 py-1 text-xs font-medium rounded-lg border whitespace-nowrap transition-all ${isActive
                  ? 'bg-[var(--primary)] text-[#0C1319] border-[var(--primary)] font-semibold shadow-sm'
                  : 'text-[#A5B0B9] hover:text-[#E6EDF1] bg-[rgba(23,34,44,0.5)] border-[rgba(83,109,126,0.25)] hover:bg-white/5'
                  }`}
                aria-pressed={isActive}
              >
                {tab.label} ({tab.unit})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="flex-1 flex flex-col justify-center my-auto py-2">
        {isLoading ? (
          <div className="py-12">
            <LoadingState message={`Đang tải dữ liệu ${metricCfg.label}...`} />
          </div>
        ) : status === 'error' ? (
          <div className="py-8">
            <ErrorState
              title="Lỗi tải dữ liệu đồng hồ"
              error={error}
              onRetry={onRetry || onRefresh}
            />
          </div>
        ) : !hasData ? (
          <div className="py-10">
            <EmptyDataState
              title={`Không có dữ liệu cho ${metricCfg.label}`}
              description="Không tìm thấy bản ghi nào trong khoảng thời gian đã chọn."
            />
          </div>
        ) : (
          <div className="w-full">
            <MetricTrendChart
              data={chartPoints}
              metricLabel={metricCfg.label}
              unit={metricCfg.unit}
              timeKey="time"
              valueKey="value"
              height={260}
              accessibleSummary={accessibleSummary}
              className="border-0 !p-0 !bg-transparent"
            />
          </div>
        )}
      </div>

      {/* Card Footer with Provenance & Caveat */}
      <div className="pt-2.5 mt-2 border-t border-[rgba(83,109,126,0.15)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-[#7E8B96]">
        <span className="truncate">
          {selectedMeterId
            ? metricCfg.qualifier || 'Nguồn: AVC LoRaWAN uplink'
            : 'Nguồn: Tổng hợp từ tất cả đồng hồ AVC (LoRaWAN uplink)'}
        </span>
        {latestValue !== null && (
          <span className="shrink-0 font-mono text-[#E6EDF1]">
            Điểm mới nhất: {latestValue.toLocaleString('vi-VN')} {metricCfg.unit}
          </span>
        )}
      </div>
    </div>
  );
}
