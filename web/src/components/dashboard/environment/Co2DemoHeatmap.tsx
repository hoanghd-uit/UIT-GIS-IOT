'use client';

import React, { useState } from 'react';
import { CO2_DEMO_FIXTURE } from '@/lib/dashboard/environment-demo-fixtures';

export interface Co2DemoHeatmapProps {
  className?: string;
}

export function Co2DemoHeatmap({ className = '' }: Co2DemoHeatmapProps) {
  const [selectedFloor, setSelectedFloor] = useState<string>('Tất cả');
  const [activeCell, setActiveCell] = useState<{
    roomId: string;
    roomName: string;
    floor: string;
    hour: string;
    value: number;
  } | null>(null);
  const [showTableView, setShowTableView] = useState<boolean>(false);

  const filteredRooms =
    selectedFloor === 'Tất cả'
      ? CO2_DEMO_FIXTURE.rooms
      : CO2_DEMO_FIXTURE.rooms.filter((r) => r.floor === selectedFloor);

  const getCellColor = (value: number) => {
    if (value <= CO2_DEMO_FIXTURE.thresholds.co2GoodMax) {
      // Good (< 800 ppm): dark teal tint
      return {
        bg: 'rgba(79, 185, 173, 0.22)',
        text: '#4FB9AD',
        border: 'rgba(79, 185, 173, 0.35)',
        status: 'Tốt (< 800 ppm)',
      };
    } else if (value <= CO2_DEMO_FIXTURE.thresholds.co2ModerateMax) {
      // Moderate (800 - 1000 ppm): dark amber tint
      return {
        bg: 'rgba(228, 191, 85, 0.22)',
        text: '#E4BF55',
        border: 'rgba(228, 191, 85, 0.35)',
        status: 'Theo dõi (800–1000 ppm)',
      };
    } else {
      // Warning (> 1000 ppm): dark orange/coral tint
      return {
        bg: 'rgba(237, 137, 54, 0.25)',
        text: '#ED8936',
        border: 'rgba(237, 137, 54, 0.45)',
        status: 'Cảnh báo (> 1000 ppm)',
      };
    }
  };

  return (
    <div
      className={`flex flex-col justify-between p-5 rounded-xl border ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header with Title, Badge, and Floor Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold text-[#E6EDF1]">
            CO₂ theo phòng x giờ
          </h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#ED8936]/15 text-[#ED8936] border border-[#ED8936]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ED8936]" />
            Demo
          </span>
        </div>

        {/* Floor Pills and Table View Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center p-0.5 rounded-lg border bg-[#111922] border-[rgba(83,109,126,0.2)]">
            {CO2_DEMO_FIXTURE.floors.map((floor) => {
              const isSelected = selectedFloor === floor;
              return (
                <button
                  key={floor}
                  type="button"
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${isSelected
                    ? 'bg-[#1C2B39] text-[#E6EDF1] shadow-sm'
                    : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
                    }`}
                  aria-pressed={isSelected}
                >
                  {floor}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowTableView(!showTableView)}
            className="px-2.5 py-1 rounded-lg border text-xs font-medium text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5 transition-colors border-[rgba(83,109,126,0.3)]"
            title="Chuyển đổi dạng bảng dễ tiếp cận"
            aria-expanded={showTableView}
          >
            {showTableView ? 'Xem Heatmap' : 'Xem Bảng'}
          </button>
        </div>
      </div>

      {/* Main Heatmap Visual Grid or Accessible Table */}
      <div className="my-4 overflow-x-auto">
        {!showTableView ? (
          <div className="min-w-[640px]">
            {/* Hour Header Row */}
            <div className="grid grid-cols-[140px_repeat(10,1fr)] gap-1.5 mb-1.5 text-center text-xs font-medium text-[#7E8B96]">
              <div className="text-left pl-2">Phòng</div>
              {CO2_DEMO_FIXTURE.hours.map((hour) => (
                <div key={hour} className="py-1">
                  {hour}
                </div>
              ))}
            </div>

            {/* Room Rows */}
            <div className="flex flex-col gap-1.5">
              {filteredRooms.map((room) => (
                <div
                  key={room.roomId}
                  className="grid grid-cols-[140px_repeat(10,1fr)] gap-1.5 items-center"
                >
                  {/* Room Label */}
                  <div
                    className="text-left text-xs font-medium text-[#E6EDF1] truncate pl-2"
                    title={`${room.roomName} (${room.roomId}) · ${room.floor}`}
                  >
                    <span className="text-[#A5B0B9] text-[11px] block">{room.floor}</span>
                    {room.roomName}
                  </div>

                  {/* Hourly Value Cells */}
                  {room.hourlyValues.map((point) => {
                    const style = getCellColor(point.value);
                    const isSelected =
                      activeCell?.roomId === room.roomId && activeCell?.hour === point.hour;

                    return (
                      <button
                        key={point.hour}
                        type="button"
                        onClick={() =>
                          setActiveCell({
                            roomId: room.roomId,
                            roomName: room.roomName,
                            floor: room.floor,
                            hour: point.hour,
                            value: point.value,
                          })
                        }
                        className={`h-9 rounded flex items-center justify-center text-xs font-mono font-medium transition-all ${isSelected
                          ? 'ring-2 ring-white scale-105 z-10 shadow-lg'
                          : 'hover:brightness-125'
                          }`}
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                        }}
                        title={`${room.roomName} lúc ${point.hour}: ${point.value} ppm (${style.status})`}
                        aria-label={`${room.roomName} lúc ${point.hour}: ${point.value} ppm`}
                      >
                        {point.value}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Accessible Table Alternative */
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A5B0B9] border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[#E6EDF1]">
                  <th className="py-2 px-3 font-semibold">Mã phòng</th>
                  <th className="py-2 px-3 font-semibold">Tên phòng</th>
                  <th className="py-2 px-3 font-semibold">Tầng</th>
                  {CO2_DEMO_FIXTURE.hours.map((h) => (
                    <th key={h} className="py-2 px-2 font-semibold text-center">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => (
                  <tr
                    key={room.roomId}
                    className="border-b border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="py-2 px-3 font-mono text-[11px] text-[#7E8B96]">
                      {room.roomId}
                    </td>
                    <td className="py-2 px-3 font-medium text-[#E6EDF1]">
                      {room.roomName}
                    </td>
                    <td className="py-2 px-3">{room.floor}</td>
                    {room.hourlyValues.map((pt) => {
                      const color = getCellColor(pt.value);
                      return (
                        <td
                          key={pt.hour}
                          className="py-2 px-2 text-center font-mono"
                          style={{ color: color.text }}
                        >
                          {pt.value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Popover / Callout when a cell is clicked */}
      {activeCell && (
        <div className="my-2 p-3 rounded-lg bg-[#141F28] border border-[rgba(83,109,126,0.3)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: getCellColor(activeCell.value).text }}
            />
            <div>
              <span className="font-semibold text-[#E6EDF1]">{activeCell.roomName}</span>{' '}
              <span className="text-[#A5B0B9]">({activeCell.roomId} · {activeCell.floor})</span>{' '}
              lúc <span className="font-mono text-[#E6EDF1] font-semibold">{activeCell.hour}</span>:{' '}
              <span className="font-mono font-bold text-sm text-[#E6EDF1]">
                {activeCell.value} ppm
              </span>{' '}
              —{' '}
              <span style={{ color: getCellColor(activeCell.value).text }}>
                {getCellColor(activeCell.value).status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] text-[#7E8B96]">Nguồn: {CO2_DEMO_FIXTURE.fixtureId}</span>
            <button
              type="button"
              onClick={() => setActiveCell(null)}
              className="text-[#7E8B96] hover:text-[#E6EDF1] px-1.5 py-0.5 rounded text-xs"
              aria-label="Đóng chi tiết điểm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#A5B0B9]">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[#7E8B96] font-medium">Quy chuẩn CO₂:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[rgba(79,185,173,0.5)] border border-[#4FB9AD]" />
            <span>&lt; 800 ppm (Tốt)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[rgba(228,191,85,0.5)] border border-[#E4BF55]" />
            <span>800–1.000 ppm (Theo dõi)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[rgba(237,137,54,0.5)] border border-[#ED8936]" />
            <span>&gt; 1.000 ppm (Cảnh báo)</span>
          </div>
        </div>
        <p className="text-[11px] text-[#7E8B96]">
          * Dữ liệu mô phỏng theo giờ làm việc tiêu chuẩn
        </p>
      </div>
    </div>
  );
}
