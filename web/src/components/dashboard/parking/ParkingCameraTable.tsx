'use client';

import React from 'react';
import { ParkingCameraDevice } from '@/types/dashboard-parking';
import { PARKING_DEMO_FIXTURE_ID } from '@/lib/dashboard/parking-demo-fixtures';

export interface ParkingCameraTableProps {
  cameras: ParkingCameraDevice[];
  className?: string;
}

export function ParkingCameraTable({
  cameras,
  className = '',
}: ParkingCameraTableProps) {
  return (
    <div
      className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between gap-3 ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
      aria-label="Danh sách thiết bị camera mô phỏng"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(83,109,126,0.18)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#E6EDF1]">
              Camera giám sát mô phỏng
            </h3>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
              title={`Chế độ Demo · Fixture ${PARKING_DEMO_FIXTURE_ID}`}
            >
              Demo
            </span>
          </div>
          {/* <p className="text-xs text-[#7E8B96] mt-0.5">
            Danh sách thiết bị giả lập trong kịch bản; không phản ánh kết nối phần cứng thực tế
          </p> */}
        </div>

        <span className="text-xs font-mono text-[#A5B0B9] px-2 py-0.5 rounded bg-[#111922] border border-[rgba(83,109,126,0.2)]">
          {cameras.length} vị trí
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto my-1">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(83,109,126,0.2)] text-[#7E8B96]">
              <th scope="col" className="py-2 px-2 font-semibold">Mã thiết bị</th>
              <th scope="col" className="py-2 px-2 font-semibold">Khu vực bao quát</th>
              <th scope="col" className="py-2 px-2 font-semibold">Chu kỳ suy luận</th>
              <th scope="col" className="py-2 px-2 font-semibold">Trạng thái kịch bản</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(83,109,126,0.1)] text-[#E6EDF1]">
            {cameras.map((cam) => {
              const isInspection = cam.demoStatus === 'simulated_inspection';
              return (
                <tr key={cam.cameraDemoId} className="hover:bg-white/[0.02]">
                  <td className="py-2 px-2 font-mono font-bold text-[#4FB9AD] whitespace-nowrap">
                    {cam.cameraDemoId}
                  </td>
                  <td
                    className="py-2 px-2 max-w-[160px] truncate"
                    title={`${cam.label} (${cam.demoCoverageLabel})`}
                  >
                    {cam.demoCoverageLabel}
                  </td>
                  <td className="py-2 px-2 font-mono text-[#A5B0B9] whitespace-nowrap">
                    {cam.demoInferenceIntervalSeconds}s / chu kỳ
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${isInspection
                        ? 'bg-[#FFB121]/15 text-[#FFB121] border-[#FFB121]/30'
                        : 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isInspection ? 'bg-[#FFB121]' : 'bg-[#22C55E]'
                          }`}
                        aria-hidden="true"
                      />
                      {cam.demoStatusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer caveat */}
      <div className="pt-2 border-t border-[rgba(83,109,126,0.15)] flex items-center justify-between text-[11px] text-[#7E8B96]">
        {/* <span>* Toàn bộ mã camera sử dụng tiền tố DEMO-</span> */}
        <span>Không truyền phát luồng video RTSP/WebRTC</span>
      </div>
    </div>
  );
}
