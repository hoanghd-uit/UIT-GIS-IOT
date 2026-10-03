'use client';

import React, { useState } from 'react';
import {
  ParkingCarArea,
  ParkingMotorcycleZone,
  ParkingCarSlot,
} from '@/types/dashboard-parking';
import { PARKING_DEMO_FIXTURE_ID } from '@/lib/dashboard/parking-demo-fixtures';

export interface ParkingOccupancyCardProps {
  carAreas: ParkingCarArea[];
  motorcycleZones: ParkingMotorcycleZone[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  className?: string;
}

export function ParkingOccupancyCard({
  carAreas,
  motorcycleZones,
  selectedEntityId,
  onSelectEntity,
  className = '',
}: ParkingOccupancyCardProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');

  // Find selected slot or zone
  const allSlots: ParkingCarSlot[] = carAreas.flatMap((area) => area.slots);
  const selectedSlot = allSlots.find((s) => s.slotId === selectedEntityId) || null;
  const selectedZone = motorcycleZones.find((z) => z.zoneId === selectedEntityId) || null;

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between gap-4 ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
      aria-label="Sơ đồ hiện trạng đỗ xe Hầm B1"
    >
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(83,109,126,0.18)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#E6EDF1]">
              Hầm B1 · Trạng thái hiện tại
            </h2>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
              title={`Kịch bản mô phỏng tĩnh · Fixture ${PARKING_DEMO_FIXTURE_ID}`}
            >
              Demo
            </span>
          </div>
          {/* <p className="text-xs text-[#7E8B96] mt-0.5">
            Sơ đồ logic vị trí ô tô và phân vùng mật độ xe máy (Không phản ánh vị trí thực tế)
          </p> */}
        </div>

        {/* View Switcher: Sơ đồ vs Bảng */}
        <div className="inline-flex items-center p-0.5 rounded-lg border bg-[#111922] border-[rgba(83,109,126,0.25)] text-xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('visual')}
            className={`px-3 py-1 rounded transition-colors ${viewMode === 'visual'
              ? 'bg-[#1C2B39] text-[#E6EDF1] font-semibold shadow-sm'
              : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
              }`}
            aria-pressed={viewMode === 'visual'}
          >
            Sơ đồ trực quan
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded transition-colors ${viewMode === 'table'
              ? 'bg-[#1C2B39] text-[#E6EDF1] font-semibold shadow-sm'
              : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
              }`}
            aria-pressed={viewMode === 'table'}
          >
            Bảng dữ liệu
          </button>
        </div>
      </div>

      {viewMode === 'visual' ? (
        /* Visual Mode: Car Areas & Motorcycle Zones */
        <div className="flex flex-col gap-5">
          {/* Car Areas Grid */}
          <div className="flex flex-col gap-4">
            {carAreas.map((area) => (
              <div
                key={area.areaId}
                className="p-3.5 rounded-lg bg-[#111922]/60 border border-[rgba(83,109,126,0.2)]"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#E6EDF1]">
                      {area.label}
                    </span>
                    <span className="text-[11px] text-[#7E8B96] hidden sm:inline">
                      — {area.description}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#A5B0B9]">
                    {area.slots.filter((s) => s.occupied).length}/{area.slots.length} vị trí
                  </span>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-8 gap-2">
                  {area.slots.map((slot) => {
                    const isSelected = selectedEntityId === slot.slotId;
                    const isOccupied = slot.occupied;
                    const isEv = slot.vehicleType === 'ev';

                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        onClick={() => onSelectEntity(isSelected ? null : slot.slotId)}
                        aria-label={`Vị trí ${slot.label}: ${isOccupied ? 'Có xe' : 'Trống'}, ${isEv ? 'Trạm sạc EV, ' : ''}Camera ${slot.cameraDemoId || 'không'}`}
                        aria-pressed={isSelected}
                        className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all outline-none focus:ring-2 focus:ring-[#4FB9AD] relative group min-h-[58px] ${isSelected
                          ? 'ring-2 ring-[#4FB9AD] border-[#4FB9AD] bg-[#1C2B39]'
                          : isOccupied
                            ? 'bg-[#15202B] border-[rgba(83,109,126,0.3)] hover:border-[rgba(83,109,126,0.6)]'
                            : 'bg-[#112423]/70 border-[#22C55E]/40 hover:border-[#22C55E]'
                          }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono font-bold text-xs text-[#E6EDF1]">
                            {slot.label}
                          </span>
                          {isEv && (
                            <span
                              className="text-[9px] px-1 rounded bg-[#38BDF8]/20 text-[#38BDF8] font-mono"
                              title="Vị trí tích hợp trạm sạc điện EV"
                            >
                              EV
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span
                            className={`font-medium ${isOccupied ? 'text-[#A5B0B9]' : 'text-[#22C55E] font-semibold'
                              }`}
                          >
                            {isOccupied ? 'Có xe' : 'Trống'}
                          </span>
                          {slot.cameraDemoId && (
                            <span
                              className="text-[9px] text-[#7E8B96] font-mono group-hover:text-[#4FB9AD]"
                              title={`Giám sát bởi ${slot.cameraDemoId}`}
                            >
                              📷
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Motorcycle Zones Grid */}
          <div className="p-3.5 rounded-lg bg-[#111922]/60 border border-[rgba(83,109,126,0.2)]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-[#E6EDF1]">
                Phân vùng xe máy (Ước tính mật độ theo khu vực)
              </span>
              <span className="text-[11px] text-[#7E8B96]">
                3 phân vùng mô phỏng
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {motorcycleZones.map((zone) => {
                const isSelected = selectedEntityId === zone.zoneId;
                const statusColor =
                  zone.status === 'high'
                    ? 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/30'
                    : zone.status === 'moderate'
                      ? 'text-[#FFB121] bg-[#FFB121]/10 border-[#FFB121]/30'
                      : 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30';

                const progressBg =
                  zone.status === 'high'
                    ? 'bg-[#F97316]'
                    : zone.status === 'moderate'
                      ? 'bg-[#FFB121]'
                      : 'bg-[#22C55E]';

                return (
                  <button
                    key={zone.zoneId}
                    type="button"
                    onClick={() => onSelectEntity(isSelected ? null : zone.zoneId)}
                    aria-label={`${zone.label}: Mật độ ước tính ${zone.estimatedDensityPercent}%, ${zone.statusLabel}`}
                    aria-pressed={isSelected}
                    className={`p-3 rounded-lg border text-left transition-all outline-none focus:ring-2 focus:ring-[#4FB9AD] ${isSelected
                      ? 'ring-2 ring-[#4FB9AD] border-[#4FB9AD] bg-[#1C2B39]'
                      : 'bg-[#15202B] border-[rgba(83,109,126,0.3)] hover:border-[rgba(83,109,126,0.6)]'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#E6EDF1] truncate">
                        {zone.label}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusColor}`}
                      >
                        {zone.status === 'high'
                          ? 'Mật độ cao'
                          : zone.status === 'moderate'
                            ? 'Trung bình'
                            : 'Bình thường'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs my-1">
                      <span className="text-[#7E8B96]">Mật độ ước tính:</span>
                      <span className="font-mono font-bold text-sm text-[#E6EDF1]">
                        {zone.estimatedDensityPercent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#111922] overflow-hidden my-1.5">
                      <div
                        className={`h-full rounded-full transition-all ${progressBg}`}
                        style={{ width: `${zone.estimatedDensityPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#7E8B96] mt-2">
                      <span>Sức chứa: ~{zone.capacityEstimate} xe</span>
                      {zone.cameraDemoId && (
                        <span className="font-mono">{zone.cameraDemoId}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Entity Compact Detail Banner */}
          {(selectedSlot || selectedZone) && (
            <div className="p-3 rounded-lg bg-[#1C2B39] border border-[#4FB9AD]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
              {selectedSlot && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#4FB9AD]/20 text-[#4FB9AD] font-mono font-bold flex items-center justify-center shrink-0">
                    {selectedSlot.label}
                  </div>
                  <div>
                    <div className="font-semibold text-[#E6EDF1]">
                      Mã ô đỗ: <span className="font-mono">{selectedSlot.slotId}</span> (Khu {selectedSlot.areaId.split('-')[2]})
                    </div>
                    <div className="text-[11px] text-[#A5B0B9] mt-0.5">
                      Trạng thái: <span className={selectedSlot.occupied ? 'text-[#FFB121]' : 'text-[#22C55E]'}>{selectedSlot.occupied ? 'Có xe' : 'Còn trống'}</span>
                      {selectedSlot.vehicleType === 'ev' && ' · Trạm sạc EV'}
                      {selectedSlot.cameraDemoId && ` · Camera ${selectedSlot.cameraDemoId}`}
                      {selectedSlot.lastStatusChangeLabel && ` · Kịch bản: ${selectedSlot.lastStatusChangeLabel}`}
                    </div>
                  </div>
                </div>
              )}

              {selectedZone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#F97316]/20 text-[#F97316] font-bold flex items-center justify-center shrink-0">
                    🛵
                  </div>
                  <div>
                    <div className="font-semibold text-[#E6EDF1]">
                      {selectedZone.label} (<span className="font-mono">{selectedZone.zoneId}</span>)
                    </div>
                    <div className="text-[11px] text-[#A5B0B9] mt-0.5">
                      Mật độ: <span className="font-bold text-[#E6EDF1]">{selectedZone.estimatedDensityPercent}%</span>
                      {' · '}Sức chứa ước tính: ~{selectedZone.capacityEstimate} xe
                      {selectedZone.cameraDemoId && ` · Camera ${selectedZone.cameraDemoId}`}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => onSelectEntity(null)}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[#A5B0B9] hover:text-[#E6EDF1] text-[11px] self-end sm:self-auto shrink-0 transition-colors"
              >
                Đóng chi tiết
              </button>
            </div>
          )}

          {/* Visual Legend */}
          <div className="pt-2 border-t border-[rgba(83,109,126,0.15)] flex flex-wrap items-center justify-between gap-3 text-xs text-[#7E8B96]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#112423] border border-[#22C55E]" />
                <span className="text-[#A5B0B9]">Còn trống</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#15202B] border border-[rgba(83,109,126,0.4)]" />
                <span className="text-[#A5B0B9]">Có xe</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[9px] px-1 rounded bg-[#38BDF8]/20 text-[#38BDF8] font-mono">EV</span>
                <span className="text-[#A5B0B9]">Trạm sạc</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span>📷</span>
                <span className="text-[#A5B0B9]">Camera minh họa</span>
              </span>
            </div>
            <span className="text-[11px] text-[#7E8B96]">
              * Bấm vào ô hoặc khu vực để xem chi tiết
            </span>
          </div>
        </div>
      ) : (
        /* Accessible Table Mode */
        <div className="flex flex-col gap-4 overflow-x-auto">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A5B0B9] mb-2">
              Danh sách chi tiết vị trí đỗ ô tô
            </h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(83,109,126,0.25)] text-[#7E8B96]">
                  <th scope="col" className="py-2 px-2 font-semibold">Mã ô đỗ</th>
                  <th scope="col" className="py-2 px-2 font-semibold">Tên vị trí</th>
                  <th scope="col" className="py-2 px-2 font-semibold">Khu vực</th>
                  <th scope="col" className="py-2 px-2 font-semibold">Loại vị trí</th>
                  <th scope="col" className="py-2 px-2 font-semibold">Trạng thái mô phỏng</th>
                  <th scope="col" className="py-2 px-2 font-semibold">Camera giám sát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(83,109,126,0.15)] text-[#E6EDF1]">
                {allSlots.map((slot) => (
                  <tr key={slot.slotId} className="hover:bg-white/[0.02]">
                    <td className="py-1.5 px-2 font-mono text-[#A5B0B9]">{slot.slotId}</td>
                    <td className="py-1.5 px-2 font-bold">{slot.label}</td>
                    <td className="py-1.5 px-2 text-[#7E8B96]">{slot.areaId}</td>
                    <td className="py-1.5 px-2">
                      {slot.vehicleType === 'ev' ? (
                        <span className="text-[#38BDF8] font-medium">Sạc điện (EV)</span>
                      ) : (
                        <span>Ô tô tiêu chuẩn</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2">
                      <span className={slot.occupied ? 'text-[#FFB121]' : 'text-[#22C55E] font-medium'}>
                        {slot.occupied ? 'Có xe' : 'Trống'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 font-mono text-xs text-[#7E8B96]">
                      {slot.cameraDemoId || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-[rgba(83,109,126,0.2)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A5B0B9] mb-2">
              Danh sách phân vùng xe máy
            </h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(83,109,126,0.25)] text-[#7E8B96]">
                  <th scope="col" className="py-2 px-2 font-semibold">Mã phân vùng</th>
                  <th scope="col" className="py-2 px-2 font-semibold">Tên phân vùng</th>
                  <th scope="col" className="py-2 px-2 font-semibold">Mật độ ước tính</th>
                  <th scope="col" className="py-2 px-2 font-semibold">Sức chứa ước tính</th>
                  <th scope="col" className="py-2 px-2 font-semibold">Đánh giá mô phỏng</th>
                  <th scope="col" className="py-2 px-2 font-semibold">Camera giám sát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(83,109,126,0.15)] text-[#E6EDF1]">
                {motorcycleZones.map((zone) => (
                  <tr key={zone.zoneId} className="hover:bg-white/[0.02]">
                    <td className="py-1.5 px-2 font-mono text-[#A5B0B9]">{zone.zoneId}</td>
                    <td className="py-1.5 px-2 font-bold">{zone.label}</td>
                    <td className="py-1.5 px-2 font-mono font-bold">{zone.estimatedDensityPercent}%</td>
                    <td className="py-1.5 px-2 text-[#7E8B96]">~{zone.capacityEstimate} xe</td>
                    <td className="py-1.5 px-2">
                      <span className={zone.status === 'high' ? 'text-[#F97316]' : zone.status === 'moderate' ? 'text-[#FFB121]' : 'text-[#22C55E]'}>
                        {zone.statusLabel}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 font-mono text-xs text-[#7E8B96]">
                      {zone.cameraDemoId || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
