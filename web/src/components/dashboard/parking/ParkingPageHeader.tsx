'use client';

import React from 'react';
import { ParkingTimeRangePreset } from '@/types/dashboard-parking';
import { PARKING_DEMO_FIXTURE_ID, PARKING_DEMO_FIXTURE_VERSION } from '@/lib/dashboard/parking-demo-fixtures';

export interface ParkingPageHeaderProps {
  activePreset: ParkingTimeRangePreset;
  onPresetChange: (preset: ParkingTimeRangePreset) => void;
}

export function ParkingPageHeader({
  activePreset,
  onPresetChange,
}: ParkingPageHeaderProps) {
  const presets: { id: ParkingTimeRangePreset; label: string }[] = [
    { id: 'today', label: 'Hôm nay' },
    { id: '7d', label: '7 ngày' },
    { id: '30d', label: '30 ngày' },
  ];

  return (
    <header
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]"
      role="banner"
    >
      {/* Left: Aligned title and demo scenario subtitle */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
            style={{ backgroundColor: '#4FB9AD' }}
            aria-hidden="true"
          />
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#E6EDF1]">
            Bãi xe · Hầm B1
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#A5B0B9] pl-5">
          Kịch bản mô phỏng bãi đỗ xe Tòa E
        </p>
      </div>

      {/* Right: Controls & Range Selector */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Prominent Demo Disclosure Badge */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFB121]/15 text-[#FFB121] border border-[#FFB121]/30 cursor-help shrink-0"
          title={`Toàn bộ dữ liệu hiển thị là kịch bản mô phỏng (Demo) · Fixture ${PARKING_DEMO_FIXTURE_ID}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFB121]" />
          Demo
        </span>

        {/* Time Filter Segmented (Hôm nay / 7 ngày / 30 ngày) */}
        <div
          className="inline-flex items-center p-1 rounded-xl border bg-[#111922] border-[rgba(83,109,126,0.25)] shrink-0"
          role="group"
          aria-label="Lọc khoảng thời gian dữ liệu bãi xe"
        >
          {presets.map((p) => {
            const isActive = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetChange(p.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${isActive
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
        {/* <button
          type="button"
          disabled
          aria-disabled="true"
          title="Phạm vi tùy chỉnh chưa khả dụng trong bản Demo"
          className="px-3 py-1.5 rounded-xl border text-xs font-medium text-[#7E8B96] bg-white/[0.02] border-[rgba(83,109,126,0.2)] cursor-not-allowed opacity-60 hidden sm:inline-block"
        >
          Tùy chọn
        </button> */}

        {/* Neutral user avatar */}
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
