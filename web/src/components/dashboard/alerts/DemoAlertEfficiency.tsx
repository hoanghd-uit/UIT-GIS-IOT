'use client';

import React from 'react';
import { AlertHandlingEfficiency } from '@/types/dashboard-alerts';

export interface DemoAlertEfficiencyProps {
  efficiency: AlertHandlingEfficiency;
  className?: string;
}

export function DemoAlertEfficiency({
  efficiency,
  className = '',
}: DemoAlertEfficiencyProps) {
  return (
    <div
      className={`flex flex-col justify-between p-5 rounded-xl border ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#E6EDF1]">
            Hiệu quả xử lý
          </h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FF2121]/15 text-[#FF2121] border border-[#FF2121]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2121]" />
            Demo
          </span>
        </div>
        {/* <span className="text-[11px] text-[#7E8B96]">Mô phỏng hiệu suất vận hành</span> */}
      </div>

      {/* 4 Compact Tiles Grid */}
      <div className="my-3 grid grid-cols-2 gap-3 flex-1 items-center">
        {/* Tile 1: Thời gian nhận TB */}
        <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.25)] flex flex-col justify-between">
          <span className="text-[11px] text-[#A5B0B9]">Thời gian nhận TB</span>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {efficiency.avgAcknowledgeMinutes}
            </span>
            <span className="text-[11px] text-[#7E8B96]">phút</span>
          </div>
          <span className="text-[10px] text-[#7E8B96]">Từ lúc phát hiện</span>
        </div>

        {/* Tile 2: Thời gian xử lý TB */}
        <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.25)] flex flex-col justify-between">
          <span className="text-[11px] text-[#A5B0B9]">Thời gian xử lý TB</span>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {efficiency.avgResolutionMinutes}
            </span>
            <span className="text-[11px] text-[#7E8B96]">phút</span>
          </div>
          <span className="text-[10px] text-[#7E8B96]">Đến khi khắc phục</span>
        </div>

        {/* Tile 3: Tỷ lệ đạt SLA */}
        <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.25)] flex flex-col justify-between">
          <span className="text-[11px] text-[#A5B0B9]">Tỷ lệ đạt SLA</span>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-[var(--primary)]">
              {efficiency.withinSlaRate}%
            </span>
          </div>
          <span className="text-[10px] text-[#7E8B96]">Đúng hạn cam kết</span>
        </div>

        {/* Tile 4: Tỷ lệ rà soát (False positive) */}
        <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.25)] flex flex-col justify-between">
          <span className="text-[11px] text-[#A5B0B9]">Tỷ lệ rà soát lại</span>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#E4BF55]">
              {efficiency.reviewFalsePositiveRate}%
            </span>
          </div>
          <span className="text-[10px] text-[#7E8B96]">Báo động không cần thiết</span>
        </div>
      </div>

      {/* Footer */}
      {/* <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[#7E8B96]">
        <span>Chỉ số ước tính từ dữ liệu mẫu</span>
        <span>Không cam kết vận hành thật</span>
      </div> */}
    </div>
  );
}
