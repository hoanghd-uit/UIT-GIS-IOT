'use client';

import React from 'react';
import Link from 'next/link';
import { FloorConfig, FloorCell, CellCo2State } from '@/types/dashboard-overview';
import { getCellCo2State } from '@/lib/dashboard/overview-selectors';

export interface FloorMetadataPanelProps {
  floorConfig: FloorConfig;
  selectedCell: FloorCell | null;
  className?: string;
}

export function FloorMetadataPanel({
  floorConfig,
  selectedCell,
  className = '',
}: FloorMetadataPanelProps) {
  const cellState: CellCo2State | null = selectedCell ? getCellCo2State(selectedCell) : null;

  return (
    <div
      className={`flex flex-col justify-between p-4 sm:p-5 rounded-xl border ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
      aria-label="Thông tin chi tiết không gian đã chọn"
    >
      {/* Top Header */}
      <div className="pb-3 border-b border-[rgba(83,109,126,0.18)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: '#4FB9AD' }}
              aria-hidden="true"
            />
            <h3 className="text-sm sm:text-base font-bold text-[#E6EDF1]">
              {selectedCell ? selectedCell.label : `Chi tiết ${floorConfig.label}`}
            </h3>
          </div>
          {selectedCell ? (
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-[#1C2B39] text-[#A5B0B9] border border-[rgba(83,109,126,0.3)]">
              {selectedCell.cellId}
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#7E8B96] border border-white/10">
              Chưa chọn ô
            </span>
          )}
        </div>
        <p className="text-xs text-[#7E8B96] mt-0.5">
          {selectedCell?.description || `Tòa nhà E · UIT Campus Digital Twin`}
        </p>
      </div>

      {/* Body Content */}
      <div className="my-4 flex-1 flex flex-col justify-center">
        {!selectedCell ? (
          /* Empty / Unselected State */
          <div className="flex flex-col items-center justify-center text-center p-6 rounded-lg bg-black/20 border border-[rgba(83,109,126,0.15)]">
            <svg
              className="w-10 h-10 text-[#536D7E] mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            <p className="text-sm font-medium text-[#E6EDF1]">
              Chưa chọn ô không gian
            </p>
            <p className="text-xs text-[#7E8B96] mt-1 max-w-[260px]">
              Nhấp hoặc dùng phím di chuyển trên ma trận 2D của {floorConfig.label} để xem nồng độ CO₂ và thông tin cảm biến.
            </p>
            <div className="mt-4 pt-3 border-t border-[rgba(83,109,126,0.15)] w-full text-xs text-[#A5B0B9] flex justify-around">
              <div>
                <span className="font-mono font-bold text-[#E6EDF1]">{floorConfig.roomCount}</span> phòng
              </div>
              <div>
                <span className="font-mono font-bold text-[#E6EDF1]">{floorConfig.rows}x{floorConfig.columns}</span> ma trận
              </div>
            </div>
          </div>
        ) : cellState?.co2Value !== null ? (
          /* Mapped Room with CO2 Data */
          <div className="flex flex-col gap-3.5">
            {/* Value & Status Card */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.2)]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A5B0B9]">
                  Nồng độ CO₂ hiện thời
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span
                    className="text-3xl font-bold font-mono tracking-tight"
                    style={{
                      color:
                        cellState?.status === 'warning'
                          ? '#FF2121'
                          : cellState?.status === 'moderate'
                            ? '#E4BF55'
                            : '#4FB9AD',
                    }}
                  >
                    {cellState?.co2Value?.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-xs text-[#A5B0B9]">ppm</span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <span
                  className="px-2 py-0.5 rounded text-xs font-semibold"
                  style={{
                    backgroundColor:
                      cellState?.status === 'warning'
                        ? 'rgba(255, 33, 33, 0.15)'
                        : cellState?.status === 'moderate'
                          ? 'rgba(228, 191, 85, 0.15)'
                          : 'rgba(79, 185, 173, 0.15)',
                    color:
                      cellState?.status === 'warning'
                        ? '#FF2121'
                        : cellState?.status === 'moderate'
                          ? '#E4BF55'
                          : '#4FB9AD',
                    border: `1px solid ${cellState?.status === 'warning'
                      ? 'rgba(255, 33, 33, 0.3)'
                      : cellState?.status === 'moderate'
                        ? 'rgba(228, 191, 85, 0.3)'
                        : 'rgba(79, 185, 173, 0.3)'
                      }`,
                  }}
                >
                  {cellState?.status === 'warning'
                    ? 'Cảnh báo'
                    : cellState?.status === 'moderate'
                      ? 'Trung bình'
                      : 'Tốt'}
                </span>
                <span className="text-[10px] text-[#7E8B96] font-mono">
                  Mã phòng: {selectedCell.label}
                </span>
              </div>
            </div>

            {/* Hourly Trend Micro-bars */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#A5B0B9] mb-1.5">
                <span>Diễn biến CO₂ trong ngày (08:00 – 17:00)</span>
                <span className="font-mono text-[10px]">10 mốc giờ</span>
              </div>
              <div className="grid grid-cols-10 gap-1 items-end h-16 p-2 rounded-lg bg-black/20 border border-[rgba(83,109,126,0.15)]">
                {cellState?.hourlyValues.map((h) => {
                  const maxCo2 = 1400;
                  const heightPercent = Math.min(100, Math.max(15, (h.value / maxCo2) * 100));
                  const isWarning = h.value > 1000;
                  const isModerate = h.value > 800 && h.value <= 1000;
                  const barColor = isWarning ? '#FF2121' : isModerate ? '#E4BF55' : '#4FB9AD';

                  return (
                    <div
                      key={h.hour}
                      className="flex flex-col items-center h-full justify-end group relative"
                    >
                      <div
                        className="w-full rounded-t transition-all group-hover:opacity-80"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: barColor,
                        }}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                        <div className="bg-[#1C2B39] text-[#E6EDF1] text-[10px] font-mono px-1.5 py-0.5 rounded shadow border border-[rgba(83,109,126,0.3)] whitespace-nowrap">
                          {h.hour}: {h.value} ppm
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-[#7E8B96] mt-1 px-1">
                <span>08:00</span>
                <span>12:00</span>
                <span>17:00</span>
              </div>
            </div>

            {/* Technical Disclaimers */}
            {/* <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-[#7E8B96]">
              Dữ liệu demo.
            </div> */}
          </div>
        ) : (
          /* Unmapped Room / Corridor / Service Cell */
          <div className="flex flex-col gap-3 p-4 rounded-lg bg-black/20 border border-[rgba(83,109,126,0.15)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#536D7E]" />
              <span className="text-xs font-semibold text-[#A5B0B9]">
                {selectedCell.kind === 'corridor'
                  ? 'Hành lang di chuyển'
                  : selectedCell.kind === 'service'
                    ? 'Khu vực kỹ thuật'
                    : 'Phòng chưa gắn cảm biến CO₂'}
              </span>
            </div>
            <p className="text-xs text-[#7E8B96]">
              {selectedCell.kind === 'room'
                ? 'Không gian này chưa được gán cảm biến môi trường vật lý. Hệ thống giữ trạng thái "Chưa có dữ liệu" để đảm bảo tính trung thực kỹ thuật.'
                : 'Khu vực hành lang và kỹ thuật phụ trợ không tham gia tính điểm chỉ số chất lượng không khí phòng học.'}
            </p>
            <div className="text-[11px] font-mono text-[#536D7E]">
              Tọa độ logic: Hàng {selectedCell.row + 1}, Cột {selectedCell.column + 1}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Link Action */}
      <div className="pt-3 border-t border-[rgba(83,109,126,0.18)] flex items-center justify-between text-xs">
        <Link
          href="/dashboard/environment"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4FB9AD] hover:underline"
        >
          <span>Xem trang Môi trường</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
        {/* <span className="text-[11px] text-[#7E8B96]">
          Page 03 IAQ
        </span> */}
      </div>
    </div>
  );
}
