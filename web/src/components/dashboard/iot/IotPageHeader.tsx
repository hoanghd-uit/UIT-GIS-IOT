'use client';

import React from 'react';
import { DataModeBadge } from '@/components/dashboard/cards/DataModeBadge';
import { DashboardProvenance } from '@/types/dashboard';

export interface IotPageHeaderProps {
  provenance?: DashboardProvenance;
  onSearchClick?: () => void;
  activeTimePreset?: string;
  onTimePresetChange?: (preset: string) => void;
}

export function IotPageHeader({
  provenance,
  onSearchClick,
  activeTimePreset = 'today',
  onTimePresetChange,
}: IotPageHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
      {/* Left Title and Subtitle */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#E6EDF1]">
          Hệ thống IoT · Tòa E
        </h1>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--primary)' }}
            aria-hidden="true"
          />
          <p className="text-xs sm:text-[13px] text-[#A5B0B9]">
            Quản lý thiết bị, gateway, firmware
          </p>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Data Provenance Badge */}
        {provenance ? (
          <DataModeBadge
            mode={provenance.mode}
            provenance={provenance}
            size="md"
          />
        ) : (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              backgroundColor: 'rgba(228, 191, 85, 0.08)',
              borderColor: 'rgba(228, 191, 85, 0.35)',
              color: 'var(--warning)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
            <span>Dữ liệu thực</span>
          </div>
        )}

        {/* Time Segmented Selector */}
        <div
          role="group"
          aria-label="Khoảng thời gian giám sát"
          className="inline-flex items-center p-1 rounded-xl border text-xs"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: '7d', label: '7 ngày' },
            { id: '30d', label: '30 ngày' },
            { id: 'custom', label: 'Tùy chọn' },
          ].map((item) => {
            const isActive = activeTimePreset === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTimePresetChange?.(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#17222C] text-[#E6EDF1] shadow-sm border border-[rgba(83,109,126,0.3)]'
                    : 'text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5'
                }`}
                aria-pressed={isActive}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search Catalogue Trigger Button */}
        <button
          type="button"
          onClick={onSearchClick}
          className="h-10 w-10 flex items-center justify-center rounded-xl border text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
          title="Tìm kiếm thiết bị trong danh mục"
          aria-label="Tìm kiếm thiết bị trong danh mục"
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
          title="Tài khoản chưa cấu hình (Chế độ xem)"
          aria-label="Tài khoản quản trị"
        >
          AT
        </button>
      </div>
    </div>
  );
}
