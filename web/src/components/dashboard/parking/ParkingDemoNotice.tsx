'use client';

import React from 'react';
import { PARKING_DEMO_FIXTURE_ID } from '@/lib/dashboard/parking-demo-fixtures';

export function ParkingDemoNotice() {
  return (
    <aside
      role="note"
      aria-label="Thông báo chế độ mô phỏng bãi xe"
      className="w-full px-4 py-3 rounded-xl border border-[#FFB121]/30 bg-[#FFB121]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-start sm:items-center gap-2.5">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FFB121]/20 text-[#FFB121] shrink-0 font-bold text-xs"
          aria-hidden="true"
        >
          ℹ
        </span>
        <div className="text-[#E6EDF1] leading-relaxed">
          <span className="font-semibold text-[#FFB121] uppercase tracking-wide mr-1.5">
            Mô phỏng · Demo:
          </span>
          Toàn bộ dữ liệu vị trí đỗ, mật độ xe máy, lưu lượng ra vào và trạng thái camera là kịch bản giả lập tĩnh ({PARKING_DEMO_FIXTURE_ID}).
          Không kết nối thiết bị cảm biến, camera AI, barrier hay thu thập dữ liệu định danh cá nhân (PII).
        </div>
      </div>
      <div className="shrink-0 text-[11px] text-[#A5B0B9] font-mono bg-[#111922]/60 px-2 py-1 rounded border border-[rgba(83,109,126,0.2)]">
        Deterministic v1.0.0
      </div>
    </aside>
  );
}
