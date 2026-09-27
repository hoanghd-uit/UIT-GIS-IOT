'use client';

import React from 'react';
import { WaterTimeRangePreset } from '@/types/dashboard-water';
import { TimeFilterSegmented } from '@/components/dashboard/controls/TimeFilterSegmented';

export interface EnergyWaterPageHeaderProps {
  meterCount?: number | null;
  activePreset: WaterTimeRangePreset;
  onPresetChange: (preset: WaterTimeRangePreset) => void;
  onSearchClick: () => void;
}

export function EnergyWaterPageHeader({
  meterCount,
  activePreset,
  onPresetChange,
  onSearchClick,
}: EnergyWaterPageHeaderProps) {
  const subtitle =
    typeof meterCount === 'number' && meterCount > 0
      ? `${meterCount} đồng hồ nước AVC · dữ liệu theo khoảng thời gian đã chọn`
      : 'Đồng hồ nước AVC · chọn đồng hồ để xem dữ liệu trực tiếp';

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#E6EDF1]">
          Năng lượng & Nước · Tòa E
        </h1>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--primary)' }}
            aria-hidden="true"
          />
          <p className="text-xs sm:text-[13px] text-[#A5B0B9]">{subtitle}</p>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Domain Data Mode Badges */}
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
            style={{
              backgroundColor: 'rgba(79, 185, 173, 0.12)',
              borderColor: 'rgba(79, 185, 173, 0.35)',
              color: 'var(--primary)',
            }}
            title="Dữ liệu nước trực tiếp từ cảm biến AVC"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            <span>Nước · Live</span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
            style={{
              backgroundColor: 'rgba(165, 176, 185, 0.08)',
              borderColor: 'rgba(165, 176, 185, 0.25)',
              color: '#A5B0B9',
            }}
            title="Dữ liệu điện chưa có nguồn smart-meter được phê duyệt"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#7E8B96]" />
            <span>Năng lượng · Chưa có nguồn</span>
          </div>
        </div>

        {/* Time Segmented Selector: Hôm nay, 7 ngày, 30 ngày, Tùy chọn (Reused from /iot) */}
        <TimeFilterSegmented
          activePreset={activePreset}
          onPresetChange={(presetId) => onPresetChange(presetId as WaterTimeRangePreset)}
          ariaLabel="Khoảng thời gian giám sát"
        />

        {/* Search Trigger Button */}
        <button
          type="button"
          onClick={onSearchClick}
          className="h-10 w-10 flex items-center justify-center rounded-xl border text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
          title="Tìm kiếm đồng hồ nước AVC"
          aria-label="Tìm kiếm đồng hồ nước AVC"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Account Avatar */}
        <button
          type="button"
          className="h-10 w-10 flex items-center justify-center rounded-xl border text-xs font-semibold font-mono text-[#E6EDF1] transition-colors focus:outline-none"
          style={{
            backgroundColor: 'var(--panel-elevated)',
            borderColor: 'var(--border)',
          }}
          title="Tài khoản (Chế độ xem)"
          aria-label="Tài khoản"
        >
          AT
        </button>
      </div>
    </div>
  );
}
