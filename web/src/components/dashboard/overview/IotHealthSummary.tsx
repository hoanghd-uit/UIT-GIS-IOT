'use client';

import React from 'react';
import Link from 'next/link';
import { OverviewIotHealthData } from '@/types/dashboard-overview';

export interface IotHealthSummaryProps {
  healthData: OverviewIotHealthData;
  className?: string;
}

export function IotHealthSummary({ healthData, className = '' }: IotHealthSummaryProps) {
  const { liveSummary, status } = healthData;

  return (
    <div
      className={`flex flex-col justify-between p-4 sm:p-5 rounded-xl border ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
      aria-label="Sức khỏe hệ thống IoT"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(83,109,126,0.18)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#E6EDF1]">
              Sức khỏe hệ thống IoT
            </h3>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#4FB9AD]/15 text-[#4FB9AD] font-medium border border-[#4FB9AD]/30 shrink-0"
              title="Dữ liệu danh mục trực tiếp từ API IoT backend"
            >
              Live
            </span>
          </div>
          <p className="text-xs text-[#7E8B96] mt-0.5">
            Thông số danh mục thiết bị thực &amp; giới hạn kết nối
          </p>
        </div>
      </div>

      {/* Main Content Grid: Live vs Unavailable */}
      <div className="my-3 flex-1 flex flex-col gap-3">
        {/* Live Catalogue Facts */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A5B0B9] mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4FB9AD]" />
            <span>Chỉ số danh mục thực tế (Live)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-[#111922] border border-[rgba(83,109,126,0.15)] flex justify-between items-center">
              <span className="text-[#A5B0B9]">Đã tiếp nhận:</span>
              <span className="font-mono font-bold text-[#E6EDF1]">
                {status === 'loading' ? '...' : liveSummary.acceptedCount ?? '—'}
              </span>
            </div>
            <div className="p-2 rounded bg-[#111922] border border-[rgba(83,109,126,0.15)] flex justify-between items-center">
              <span className="text-[#A5B0B9]">Từ nguồn:</span>
              <span className="font-mono font-bold text-[#E6EDF1]">
                {status === 'loading' ? '...' : liveSummary.receivedCount ?? '—'}
              </span>
            </div>
            <div className="p-2 rounded bg-[#111922] border border-[rgba(83,109,126,0.15)] flex justify-between items-center">
              <span className="text-[#A5B0B9]">Bỏ qua:</span>
              <span className="font-mono text-[#7E8B96]">
                {status === 'loading' ? '...' : liveSummary.skippedCount ?? '0'}
              </span>
            </div>
            <div className="p-2 rounded bg-[#111922] border border-[rgba(83,109,126,0.15)] flex justify-between items-center">
              <span className="text-[#A5B0B9]">Trùng lặp:</span>
              <span className="font-mono text-[#7E8B96]">
                {status === 'loading' ? '...' : liveSummary.duplicateCount ?? '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Explicitly Unavailable Health Metrics */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7E8B96] mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#536D7E]" />
            <span>Chỉ số vận hành chưa khả dụng</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div
              className="p-2 rounded bg-black/20 border border-white/5 flex justify-between items-center"
              title="Chưa có telemetry heartbeat định kỳ"
            >
              <span className="text-[#7E8B96]">Trực tuyến (Online):</span>
              <span className="font-mono text-[#536D7E]">—</span>
            </div>
            <div
              className="p-2 rounded bg-black/20 border border-white/5 flex justify-between items-center"
              title="Chưa có tính toán tỷ lệ gói tin"
            >
              <span className="text-[#7E8B96]">Tỷ lệ gói tin:</span>
              <span className="font-mono text-[#536D7E]">—</span>
            </div>
            <div
              className="p-2 rounded bg-black/20 border border-white/5 flex justify-between items-center"
              title="Chưa có giám sát ngắt kết nối"
            >
              <span className="text-[#7E8B96]">Mất tín hiệu:</span>
              <span className="font-mono text-[#536D7E]">—</span>
            </div>
            <div
              className="p-2 rounded bg-black/20 border border-white/5 flex justify-between items-center"
              title="Chưa có telemetry gateway & pin"
            >
              <span className="text-[#7E8B96]">Pin / Gateway:</span>
              <span className="font-mono text-[#536D7E]">—</span>
            </div>
          </div>
        </div>

        {/* Technical Caveat */}
        <p className="text-[11px] text-[#7E8B96] bg-white/[0.02] p-2 rounded border border-white/5">
          Trường <span className="font-mono text-[#A5B0B9]">active</span> trong danh mục chỉ phản ánh cấu hình thiết bị, không thay thế đo lường trực tuyến thời gian thực.
        </p>
      </div>

      {/* Bottom Action */}
      <div className="pt-3 border-t border-[rgba(83,109,126,0.18)] flex items-center justify-between text-xs">
        <Link
          href="/dashboard/iot"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4FB9AD] hover:underline"
        >
          <span>Xem trang Thiết bị IoT</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
        <span className="text-[11px] text-[#7E8B96]">
          Page 07
        </span>
      </div>
    </div>
  );
}
