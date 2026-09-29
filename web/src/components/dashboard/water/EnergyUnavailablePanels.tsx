'use client';

import React from 'react';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';

export function EnergyUnavailablePanels() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-8 gap-4 w-full">
      {/* Primary Row Left: Điện năng theo giờ (kWh) (~5/8 width) */}
      <div
        role="region"
        aria-label="Điện năng theo giờ: Chưa kết nối smart-meter"
        className="lg:col-span-5 p-5 rounded-xl border flex flex-col justify-between min-h-[380px] transition-all"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(83,109,126,0.2)]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-[#E6EDF1]">
              Điện năng theo giờ (kWh)
            </h3>
          </div>
          <span className="text-[11px] font-medium text-[#7E8B96]">
            Smart-meter tổng
          </span>
        </div>

        <div className="my-auto py-8">
          <UnavailableDataState
            title="Chưa có nguồn smart-meter được phê duyệt"
            description="Biểu đồ phụ tải điện theo giờ và đường mức nền 4 tuần cùng thứ sẽ được kết nối khi có dữ liệu đồng hồ điện thông minh."
            phaseNote="Small Phase 20: Energy deterministic demo."
          />
        </div>

        <div className="pt-2 border-t border-[rgba(83,109,126,0.15)] flex items-center justify-between text-[11px] text-[#7E8B96]">
          <span>Nguồn: Smart meter tổng (chờ tích hợp)</span>
          {/* <span>Dữ liệu thực tế: Chưa kết nối</span> */}
        </div>
      </div>

      {/* Primary Row Right: 7 ngày gần nhất (kWh/ngày) (~3/8 width) */}
      <div
        role="region"
        aria-label="7 ngày gần nhất: Chưa kết nối smart-meter"
        className="lg:col-span-3 p-5 rounded-xl border flex flex-col justify-between min-h-[380px] transition-all"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(83,109,126,0.2)]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-[#E6EDF1]">
              7 ngày gần nhất (kWh/ngày)
            </h3>
          </div>
          {/* <span className="text-[11px] font-medium text-[#7E8B96]">
            Cuối tuần tô đậm
          </span> */}
        </div>

        <div className="my-auto py-8">
          <UnavailableDataState
            title="Unavailable"
            description="Biểu đồ cột tiêu thụ điện 7 ngày gần nhất sẽ được cung cấp trong giai đoạn tích hợp hệ thống điện."
          />
        </div>

        <div className="pt-2 border-t border-[rgba(83,109,126,0.15)] flex items-center justify-between text-[11px] text-[#7E8B96]">
          {/* <span>Phạm vi: 7 ngày</span> */}
          <span>Trạng thái: Chưa có nguồn</span>
        </div>
      </div>
    </div>
  );
}
