'use client';

import React from 'react';
import { AlertTimeRangePreset } from '@/types/dashboard-alerts';
import { ALERT_DEMO_FIXTURE_ID } from '@/lib/dashboard/alert-demo-fixtures';

export interface AlertCenterPageHeaderProps {
  activePreset: AlertTimeRangePreset;
  onPresetChange: (preset: AlertTimeRangePreset) => void;
  onSearchClick: () => void;
}

export function AlertCenterPageHeader({
  activePreset,
  onPresetChange,
  onSearchClick,
}: AlertCenterPageHeaderProps) {
  const presets: { id: AlertTimeRangePreset; label: string }[] = [
    { id: 'today', label: 'Hôm nay' },
    { id: '7d', label: '7 ngày' },
    { id: '30d', label: '30 ngày' },
  ];

  return (
    <header
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]"
      role="banner"
    >
      {/* Left: Title and Aligned Subtitle */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full inline-block shrink-0 shadow-sm"
            style={{ backgroundColor: '#4FB9AD' }}
            aria-hidden="true"
          />
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#E6EDF1]">
            Trung tâm cảnh báo
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#A5B0B9] pl-4">
          Demo layout
        </p>
      </div>

      {/* Right Action Group */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Global Demo Badge with Tooltip */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFB121]/15 text-[#FFB121] border border-[#FFB121]/30 cursor-help shrink-0"
          title={`Chế độ dữ liệu Demo · Fixture ${ALERT_DEMO_FIXTURE_ID}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFB121]" />
          Demo
        </span>

        {/* Time Filter Segmented (Hôm nay / 7 ngày / 30 ngày) */}
        <div
          className="inline-flex items-center p-1 rounded-xl border bg-[#111922] border-[rgba(83,109,126,0.25)] shrink-0"
          role="group"
          aria-label="Lọc thời gian cảnh báo demo"
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
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Phạm vi tùy chỉnh chưa khả dụng trong bản Demo"
          className="px-3 py-1.5 rounded-xl border text-xs font-medium text-[#7E8B96] bg-white/[0.02] border-[rgba(83,109,126,0.2)] cursor-not-allowed opacity-60 hidden sm:inline-block"
        >
          Tùy chọn
        </button>

        {/* Quick Search Button: Focuses List Search */}
        <button
          type="button"
          onClick={onSearchClick}
          className="p-2 rounded-xl border text-[#A5B0B9] hover:text-[#E6EDF1] bg-[#111922] hover:bg-white/5 border-[rgba(83,109,126,0.25)] transition-colors"
          title="Tìm kiếm cảnh báo"
          aria-label="Tập trung vào ô tìm kiếm cảnh báo"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        {/* Neutral Avatar AT (Disabled) */}
        <div
          className="w-8 h-8 rounded-full border border-[rgba(83,109,126,0.3)] bg-[#17222C] text-[#A5B0B9] text-xs font-semibold flex items-center justify-center cursor-default shrink-0 select-none"
          title="Tài khoản Quản trị viên (Demo)"
          aria-label="Tài khoản Quản trị viên"
        >
          AT
        </div>
      </div>
    </header>
  );
}
