'use client';

import React from 'react';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';

export function IotBottomSupportCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 w-full">
      {/* Card 1: Tỷ lệ nhận gói tin theo tầng */}
      <div
        className="flex flex-col justify-between p-5 rounded-xl border min-h-[280px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between border-b pb-3 mb-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold text-[#E6EDF1]">
            Tỷ lệ nhận gói tin theo tầng (24h, %)
          </h3>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#7E8B96]">
            LoRaWAN
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center py-4">
          <UnavailableDataState
            title="Chưa có dữ liệu gói tin theo tầng"
            description="Hạ tầng LoRaWAN hiện tại chưa cung cấp tỷ lệ nhận gói tin phân tách theo từng tầng tòa nhà."
            compact
          />
        </div>

        <div className="pt-3 border-t text-[11px] text-[#7E8B96] flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <span>Mục tiêu: ≥ 95%</span>
          <span>Chờ tích hợp upstream</span>
        </div>
      </div>

      {/* Card 2: Phân bố pin */}
      <div
        className="flex flex-col justify-between p-5 rounded-xl border min-h-[280px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between border-b pb-3 mb-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold text-[#E6EDF1]">
            Phân bố pin (số thiết bị)
          </h3>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#7E8B96]">
            Battery
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center py-4">
          <UnavailableDataState
            title="Chưa có battery percentage chuẩn hóa"
            description="Chưa có nguồn dữ liệu phần trăm pin chuẩn hóa cho toàn bộ thiết bị trong danh mục."
            compact
          />
        </div>

        <div className="pt-3 border-t text-[11px] text-[#7E8B96] flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <span>Phạm vi: Toàn tòa nhà</span>
          <span>Chưa có dữ liệu</span>
        </div>
      </div>

      {/* Card 3: Cập nhật firmware (OTA) */}
      <div
        className="flex flex-col justify-between p-5 rounded-xl border min-h-[280px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between border-b pb-3 mb-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold text-[#E6EDF1]">
            Cập nhật firmware (OTA)
          </h3>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#7E8B96]">
            FOTA
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center py-4">
          <UnavailableDataState
            title="Chưa có firmware/OTA contract"
            description="Chưa có firmware version hoặc hợp đồng OTA từ hệ thống IoT."
            compact
          />
        </div>

        <div className="pt-3 border-t text-[11px] text-[#7E8B96] flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <span>Hiệu chuẩn cảm biến</span>
          <span>Chu kỳ 12 tháng (kế tiếp)</span>
        </div>
      </div>
    </div>
  );
}
