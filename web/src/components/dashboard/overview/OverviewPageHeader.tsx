'use client';

import React from 'react';
import { OverviewTimeRangePreset } from '@/types/dashboard-overview';

export interface OverviewPageHeaderProps {
  activePreset: OverviewTimeRangePreset;
  onPresetChange: (preset: OverviewTimeRangePreset) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastFetch?: string | Date | null;
}

export function OverviewPageHeader({
  activePreset,
  onPresetChange,
  onRefresh,
  isRefreshing = false,
  lastFetch,
}: OverviewPageHeaderProps) {
  const presets: { id: OverviewTimeRangePreset; label: string }[] = [
    { id: 'today', label: 'Hôm nay' },
    { id: '7d', label: '7 ngày' },
    { id: '30d', label: '30 ngày' },
  ];

  const formattedLastFetch = React.useMemo(() => {
    if (!lastFetch) return '—';
    if (typeof lastFetch === 'string' && !lastFetch.includes('T') && !lastFetch.includes('-')) {
      return lastFetch;
    }
    try {
      const d = typeof lastFetch === 'string' ? new Date(lastFetch) : lastFetch;
      if (isNaN(d.getTime())) return String(lastFetch);
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return String(lastFetch);
    }
  }, [lastFetch]);

  return (
    <header
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]"
      role="banner"
    >
      {/* Left: Truthful title and subtitle */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
            style={{ backgroundColor: '#4FB9AD' }}
            aria-hidden="true"
          />
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#E6EDF1]">
            Tổng quan · Tòa E
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#A5B0B9] pl-5">
          Cập nhật lần cuối {formattedLastFetch}
        </p>
      </div>

      {/* Right: Controls & Range Selector */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Mixed-source provenance indicator */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1C2B39] text-[#4FB9AD] border border-[rgba(79,185,173,0.3)] cursor-help shrink-0"
          title="Trang tổng hợp: IoT Catalogue (Live), Năng lượng & IAQ & Cảnh báo (Demo), Nước (Chưa khả dụng)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#4FB9AD]" />
          Đa nguồn (Live · Demo)
        </span>

        {/* Time Filter Segmented (Hôm nay / 7 ngày / 30 ngày) */}
        <div
          className="inline-flex items-center p-1 rounded-xl border bg-[#111922] border-[rgba(83,109,126,0.25)] shrink-0"
          role="group"
          aria-label="Lọc thời gian dữ liệu tổng quan"
        >
          {presets.map((p) => {
            const isActive = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetChange(p.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#1C2B39] text-[#E6EDF1] font-semibold shadow-sm border border-[rgba(83,109,126,0.3)]'
                    : 'text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5'
                }`}
                aria-pressed={isActive}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Tùy chọn (Disabled with accessible reason) */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Phạm vi tùy chỉnh chưa khả dụng trong bản Demo"
          className="px-3 py-1.5 rounded-xl border text-xs font-medium text-[#7E8B96] bg-white/[0.02] border-[rgba(83,109,126,0.2)] cursor-not-allowed opacity-60 hidden sm:inline-block"
        >
          Tùy chọn
        </button>

        {/* Refresh button if available */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border text-[#A5B0B9] hover:text-[#E6EDF1] bg-[#111922] hover:bg-white/5 border-[rgba(83,109,126,0.25)] transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu danh mục IoT"
            aria-label="Làm mới danh mục"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#4FB9AD]' : ''}`}
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
          </button>
        )}

        {/* Neutral user initials avatar (from mockup, non-clickable) */}
        <div
          className="w-8 h-8 rounded-full bg-[#1C2B39] border border-[rgba(83,109,126,0.3)] flex items-center justify-center text-xs font-semibold text-[#A5B0B9] select-none"
          title="Tài khoản Quản trị tòa nhà E"
          aria-hidden="true"
        >
          AT
        </div>
      </div>
    </header>
  );
}
