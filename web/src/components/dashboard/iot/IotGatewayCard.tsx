'use client';

import React from 'react';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';

export interface IotGatewayCardProps {
  selectedDeviceId?: string | null;
  selectedGatewayId?: string | null;
  selectedRssi?: number | null;
  selectedSnr?: number | null;
}

export function IotGatewayCard({
  selectedDeviceId,
  selectedGatewayId,
  selectedRssi,
  selectedSnr,
}: IotGatewayCardProps) {
  return (
    <div
      className="flex flex-col justify-between p-5 rounded-xl border h-full"
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-base font-semibold text-[#E6EDF1]">
          Gateway LoRaWAN
        </h3>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#7E8B96]">
          ChirpStack
        </span>
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col justify-center gap-4 py-2">
        {/* If selected device has live gateway ID */}
        {selectedGatewayId ? (
          <div
            className="p-3.5 rounded-xl border flex flex-col gap-2"
            style={{
              backgroundColor: 'var(--panel-elevated)',
              borderColor: 'rgba(79, 185, 173, 0.35)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#4FB9AD]">
                Gateway thiết bị đang chọn:
              </span>
              <span className="w-2 h-2 rounded-full bg-[#43C0AC]" title="Trực tuyến theo telemetry thiết bị" />
            </div>
            <div className="font-mono text-sm font-bold text-[#E6EDF1] break-all">
              {selectedGatewayId}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#A5B0B9] pt-1 border-t border-[rgba(83,109,126,0.2)]">
              {selectedDeviceId && <span>Thiết bị: <strong className="text-[#E6EDF1]">{selectedDeviceId}</strong></span>}
              {selectedRssi != null && <span>RSSI: <strong className="text-[#E6EDF1]">{selectedRssi} dBm</strong></span>}
              {selectedSnr != null && <span>SNR: <strong className="text-[#E6EDF1]">{selectedSnr}</strong></span>}
            </div>
          </div>
        ) : (
          <UnavailableDataState
            title="Chưa có dữ liệu inventory/health"
            description="Gateway ID chỉ khả dụng theo telemetry của thiết bị được chọn; chưa có nguồn xác nhận trạng thái gateway toàn tòa nhà."
            compact
          />
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t text-[11px] text-[#7E8B96] flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <span>Network server: ChirpStack</span>
        <span>Chưa xác thực</span>
      </div>
    </div>
  );
}
