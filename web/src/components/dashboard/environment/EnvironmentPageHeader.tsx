'use client';

import React from 'react';
import { EnvironmentTimeRangePreset } from '@/types/dashboard-environment';
import { TimeFilterSegmented, TimeFilterPresetItem } from '@/components/dashboard/controls/TimeFilterSegmented';

export interface EnvironmentPageHeaderProps {
  sourceCount?: number | null;
  activePreset: EnvironmentTimeRangePreset;
  onPresetChange: (preset: EnvironmentTimeRangePreset) => void;
  onSearchClick: () => void;
}

const ENVIRONMENT_TIME_PRESETS: TimeFilterPresetItem[] = [
  { id: '24h', label: '24 giờ' },
  { id: '72h', label: '72 giờ' },
  { id: '7d', label: '7 ngày' },
];

export function EnvironmentPageHeader({
  sourceCount,
  activePreset,
  onPresetChange,
  onSearchClick,
}: EnvironmentPageHeaderProps) {
  // const subtitle =
  //   typeof sourceCount === 'number' && sourceCount > 0
  //     ? `${sourceCount} nguồn Solar candidate · calculation theo request, không lưu PostgreSQL`
  //     : 'Nguồn Solar · trường môi trường raw đang chờ xác nhận semantics';

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#E6EDF1]">
          Môi trường (IAQ) · Tòa E
        </h1>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--primary)' }}
            aria-hidden="true"
          />
          {/* <p className="text-xs sm:text-[13px] text-[#A5B0B9]">{subtitle}</p> */}
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
            title="Dữ liệu Solar trực tiếp từ IoT và tính toán theo request"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            <span>Solar · Live / Derived</span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
            style={{
              backgroundColor: 'rgba(237, 137, 54, 0.12)',
              borderColor: 'rgba(237, 137, 54, 0.35)',
              color: '#FF2121',
            }}
            title="Dữ liệu CO2 và VOC phòng hiển thị từ fixture mẫu"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2121]" />
            <span>CO₂ / VOC · Demo</span>
          </div>
        </div>

        {/* Time Segmented Selector: 24 giờ, 72 giờ, 7 ngày */}
        <TimeFilterSegmented
          activePreset={activePreset}
          presets={ENVIRONMENT_TIME_PRESETS}
          onPresetChange={(presetId) => onPresetChange(presetId as EnvironmentTimeRangePreset)}
          ariaLabel="Khoảng thời gian giám sát môi trường"
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
          title="Tìm kiếm nguồn Solar"
          aria-label="Tìm kiếm nguồn Solar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Neutral Account Avatar Icon */}
        <div
          className="h-10 w-10 flex items-center justify-center rounded-xl border text-[#A5B0B9] select-none"
          style={{
            backgroundColor: 'var(--panel-elevated)',
            borderColor: 'var(--border)',
          }}
          title="Chế độ xem Dashboard"
          aria-label="Tài khoản xem"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
