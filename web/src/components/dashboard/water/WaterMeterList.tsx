'use client';

import React, { useState, forwardRef } from 'react';
import { DashboardWaterMeterItem } from '@/types/dashboard-water';
import { LoadingState } from '@/components/dashboard/states/LoadingState';
import { EmptyDataState } from '@/components/dashboard/states/EmptyDataState';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';
import { ErrorState } from '@/components/dashboard/states/ErrorState';

export interface WaterMeterListProps {
  meters: DashboardWaterMeterItem[];
  selectedMeterId: string | null;
  onSelectMeter: (meterId: string) => void;
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'unavailable' | 'error';
  error?: unknown;
  onRetry?: () => void;
}

// Dummy floor distribution data matching mockup
const DUMMY_FLOOR_DATA = [
  { floor: 'Tầng mái (HVAC)', val: 412, max: 450 },
  { floor: 'T1', val: 186, max: 450 },
  { floor: 'T2', val: 158, max: 450 },
  { floor: 'T3', val: 171, max: 450 },
  { floor: 'T4', val: 204, max: 450 },
  { floor: 'T5', val: 149, max: 450 },
  { floor: 'T6', val: 118, max: 450 },
];

export const WaterMeterList = forwardRef<HTMLInputElement, WaterMeterListProps>(
  function WaterMeterList(
    { meters, selectedMeterId, onSelectMeter, status, error, onRetry },
    ref,
  ) {
    const [activeTab, setActiveTab] = useState<'meters' | 'floors'>('meters');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMeters = meters.filter((m) => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        m.deviceId.toLowerCase().includes(q) ||
        (m.displayFloorId && m.displayFloorId.toLowerCase().includes(q))
      );
    });

    return (
      <div
        role="region"
        aria-label="Danh sách đồng hồ nước AVC và phân bố tiêu thụ"
        className="p-4 rounded-xl border flex flex-col justify-between min-h-[460px] transition-all"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Card Header with View Tabs */}
        <div className="flex flex-col gap-2 pb-3 border-b border-[rgba(83,109,126,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-[rgba(23,34,44,0.6)] border border-[rgba(83,109,126,0.25)] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('meters')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'meters'
                  ? 'bg-[#17222C] text-[#E6EDF1] shadow-sm'
                  : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
                  }`}
                aria-pressed={activeTab === 'meters'}
              >
                Đồng hồ AVC (Live)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('floors')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'floors'
                  ? 'bg-[#17222C] text-[#E6EDF1] shadow-sm'
                  : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
                  }`}
                aria-pressed={activeTab === 'floors'}
              >
                Phân bố tầng (Mẫu)
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Live AVC Meters */}
        {activeTab === 'meters' && (
          <div className="flex-1 flex flex-col gap-3 pt-3">
            {/* Search Input */}
            <div className="relative">
              <input
                ref={ref}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã đồng hồ..."
                className="w-full px-3 py-1.5 pl-8 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-[#E6EDF1] placeholder-[#7E8B96]"
                style={{
                  backgroundColor: 'var(--panel-elevated)',
                  borderColor: 'var(--border)',
                }}
                aria-label="Tìm mã đồng hồ nước"
              />
              <svg
                className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#7E8B96]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* List Body State Handling */}
            {status === 'loading' ? (
              <div className="my-auto py-8">
                <LoadingState message="Đang nạp danh sách đồng hồ AVC..." />
              </div>
            ) : status === 'unavailable' ? (
              <div className="my-auto py-8">
                <UnavailableDataState
                  title="Dịch vụ danh mục chưa khả dụng"
                  description="Không thể kết nối đến danh mục đồng hồ nước AVC."
                />
              </div>
            ) : status === 'error' ? (
              <div className="my-auto py-8">
                <ErrorState
                  title="Lỗi tải danh mục đồng hồ"
                  error={error}
                  onRetry={onRetry}
                />
              </div>
            ) : meters.length === 0 ? (
              <div className="my-auto py-8">
                <EmptyDataState
                  title="Chưa có đồng hồ nước AVC"
                  description="Hệ thống chưa ghi nhận đồng hồ nước AVC nào cho Tòa E."
                />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[310px] space-y-2 pr-1 custom-scrollbar">
                {/* Item 'Tất cả': ALWAYS on top of list AVC devices */}
                <div
                  tabIndex={0}
                  role="button"
                  aria-pressed={!selectedMeterId}
                  onClick={() => onSelectMeter('')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectMeter('');
                    }
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-left ${!selectedMeterId
                    ? 'border-[var(--primary)] bg-[rgba(79,185,173,0.12)]'
                    : 'border-[rgba(83,109,126,0.25)] hover:border-[rgba(83,109,126,0.5)] bg-[rgba(23,34,44,0.4)]'
                    }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${!selectedMeterId ? 'bg-[var(--primary)]' : 'bg-[#7E8B96]'
                          }`}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-semibold truncate text-[#E6EDF1]">
                        Tất cả ({meters.length} đồng hồ)
                      </span>
                    </div>
                    <span className="text-[11px] text-[#A5B0B9] mt-0.5 ml-3.5 truncate">
                      Toàn bộ tòa nhà E · Tổng hợp
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${!selectedMeterId
                        ? 'bg-[rgba(67,192,172,0.12)] text-[#43C0AC] border-[rgba(67,192,172,0.3)]'
                        : 'bg-white/5 text-[#7E8B96] border-white/10'
                        }`}
                    >
                      Tổng hợp
                    </span>
                    {!selectedMeterId && (
                      <span className="text-xs text-[var(--primary)] font-bold">✓</span>
                    )}
                  </div>
                </div>

                {filteredMeters.length === 0 && searchTerm ? (
                  <div className="py-4 text-center text-xs text-[#7E8B96]">
                    Không tìm thấy đồng hồ khớp với &quot;{searchTerm}&quot;
                  </div>
                ) : (
                  filteredMeters.map((meter) => {
                    const isSelected = selectedMeterId === meter.deviceId;
                    const floorLabel = meter.displayFloorId
                      ? `Tầng ${meter.displayFloorId}`
                      : meter.sourceLocation.floorLevel === 0
                        ? 'Chưa gán tầng (Tầng 0)'
                        : `Tầng nguồn ${meter.sourceLocation.floorLevel}`;

                    return (
                      <div
                        key={meter.deviceId}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        onClick={() => onSelectMeter(isSelected ? '' : meter.deviceId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectMeter(isSelected ? '' : meter.deviceId);
                          }
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-left ${isSelected
                          ? 'border-[var(--primary)] bg-[rgba(79,185,173,0.12)]'
                          : 'border-[rgba(83,109,126,0.25)] hover:border-[rgba(83,109,126,0.5)] bg-[rgba(23,34,44,0.4)]'
                          }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-[var(--primary)]' : 'bg-[#7E8B96]'
                                }`}
                              aria-hidden="true"
                            />
                            <span className="font-mono text-xs font-semibold truncate text-[#E6EDF1]">
                              {meter.deviceId}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#A5B0B9] mt-0.5 ml-3.5 truncate">
                            {floorLabel}
                          </span>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${meter.catalogueActive
                              ? 'bg-[rgba(67,192,172,0.12)] text-[#43C0AC] border-[rgba(67,192,172,0.3)]'
                              : 'bg-white/5 text-[#7E8B96] border-white/10'
                              }`}
                            title="Trạng thái đăng ký trong danh mục thiết bị (không phải trạng thái online)"
                          >
                            {meter.catalogueActive ? 'Đăng ký' : 'Chưa bật'}
                          </span>
                          {isSelected && (
                            <span className="text-xs text-[var(--primary)] font-bold">✓</span>
                          )}
                        </div>
                      </div>
                    );
                  }))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Dummy Floor Distribution (Mockup Reference) */}
        {activeTab === 'floors' && (
          <div className="flex-1 flex flex-col justify-between pt-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#A5B0B9] pb-1">
                <span>Vị trí tầng</span>
                <span>Tiêu thụ (kWh)</span>
              </div>
              {DUMMY_FLOOR_DATA.map((item) => {
                const pct = Math.round((item.val / item.max) * 100);
                return (
                  <div key={item.floor} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs text-[#E6EDF1]">
                      <span className="truncate">{item.floor}</span>
                      <span className="font-mono font-medium text-[#4FB9AD]">
                        {item.val}
                      </span>
                    </div>
                    <div className="w-full bg-[rgba(83,109,126,0.2)] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#4FB9AD] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#ED8936]/15 text-[#ED8936] border border-[#ED8936]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ED8936]" />
              Demo
            </span>
          </div>
        )}

        {/* Card Footer Helper */}
        <div className="pt-2.5 mt-2 border-t border-[rgba(83,109,126,0.15)] flex items-center justify-between text-[11px] text-[#7E8B96]">
          <span>{activeTab === 'meters' ? 'Nguồn: Danh mục AVC' : 'Chế độ: Minh họa mockup'}</span>
          <span>{activeTab === 'meters' ? 'Phân loại: Water' : 'Chưa có cảm biến tầng'}</span>
        </div>
      </div>
    );
  },
);
