'use client';

import React, { useState } from 'react';
import { FloorConfig, FloorCell, CellCo2State } from '@/types/dashboard-overview';
import { getCellCo2State } from '@/lib/dashboard/overview-selectors';

export interface InteractiveFloorGridProps {
  floorConfig: FloorConfig;
  selectedCellId: string | null;
  onSelectCell: (cellId: string) => void;
  className?: string;
}

export function InteractiveFloorGrid({
  floorConfig,
  selectedCellId,
  onSelectCell,
  className = '',
}: InteractiveFloorGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Derive state for all cells on this floor
  const cellStates: CellCo2State[] = floorConfig.cells.map((cell) => getCellCo2State(cell));

  const getStatusColor = (status: CellCo2State['status'], isSelected: boolean) => {
    switch (status) {
      case 'good':
        return {
          bg: isSelected ? 'rgba(79, 185, 173, 0.25)' : 'rgba(79, 185, 173, 0.12)',
          border: isSelected ? '#4FB9AD' : 'rgba(79, 185, 173, 0.35)',
          text: '#4FB9AD',
          dot: '#4FB9AD',
          label: 'Tốt (≤ 800 ppm)',
        };
      case 'moderate':
        return {
          bg: isSelected ? 'rgba(228, 191, 85, 0.25)' : 'rgba(228, 191, 85, 0.12)',
          border: isSelected ? '#E4BF55' : 'rgba(228, 191, 85, 0.35)',
          text: '#E4BF55',
          dot: '#E4BF55',
          label: 'Trung bình (801–1.000 ppm)',
        };
      case 'warning':
        return {
          bg: isSelected ? 'rgba(255, 33, 33, 0.28)' : 'rgba(255, 33, 33, 0.14)',
          border: isSelected ? '#FF2121' : 'rgba(255, 33, 33, 0.45)',
          text: '#FF2121',
          dot: '#FF2121',
          label: 'Cảnh báo (> 1.000 ppm)',
        };
      case 'unavailable':
      default:
        return {
          bg: isSelected ? 'rgba(83, 109, 126, 0.25)' : 'rgba(83, 109, 126, 0.08)',
          border: isSelected ? '#7E8B96' : 'rgba(83, 109, 126, 0.2)',
          text: '#7E8B96',
          dot: '#536D7E',
          label: 'Chưa có dữ liệu',
        };
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, cell: FloorCell) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectCell(cell.cellId);
    }
  };

  return (
    <div
      className={`flex flex-col justify-between p-4 sm:p-5 rounded-xl border ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Top Header: Title, Metric Tab, View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(83,109,126,0.18)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[#E6EDF1]">
              Không gian theo tầng
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF2121]/10 text-[#FF2121] font-medium border border-[#FF2121]/30 shrink-0">
              Demo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Metric Badge (Only CO2 is supported in Phase 07) */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1C2B39] text-[#4FB9AD] border border-[rgba(79,185,173,0.3)]"
            title="Chỉ số CO2 demo được ánh xạ từ fixture page03-co2-demo-v1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4FB9AD]" />
            Chỉ số: CO₂
          </div>

          {/* Toggle View: Grid vs Accessible Table */}
          <div className="inline-flex items-center p-0.5 rounded-lg border bg-[#111922] border-[rgba(83,109,126,0.25)] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 rounded transition-colors ${viewMode === 'grid'
                ? 'bg-[#1C2B39] text-[#E6EDF1] font-semibold'
                : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
                }`}
              aria-pressed={viewMode === 'grid'}
              title="Xem dạng ma trận 2D"
            >
              Ma trận 2D
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded transition-colors ${viewMode === 'table'
                ? 'bg-[#1C2B39] text-[#E6EDF1] font-semibold'
                : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
                }`}
              aria-pressed={viewMode === 'table'}
              title="Xem dạng bảng tiếp cận (Accessible Table)"
            >
              Bảng dữ liệu
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Grid Matrix or Accessible Table */}
      <div className="my-4 flex-1">
        {viewMode === 'grid' ? (
          <div
            role="grid"
            aria-label={`Ma trận logic không gian ${floorConfig.label}`}
            className="grid gap-2.5 overflow-x-auto pb-1"
            style={{
              gridTemplateColumns: `repeat(${floorConfig.columns}, minmax(130px, 1fr))`,
            }}
          >
            {floorConfig.cells.map((cell) => {
              const state = getCellCo2State(cell);
              const isSelected = cell.cellId === selectedCellId;
              const colorInfo = getStatusColor(state.status, isSelected);

              // Distinct presentation based on cell kind
              if (cell.kind === 'corridor') {
                return (
                  <div
                    key={cell.cellId}
                    role="gridcell"
                    aria-label={`${cell.label}: Hành lang di chuyển`}
                    tabIndex={0}
                    onClick={() => onSelectCell(cell.cellId)}
                    onKeyDown={(e) => handleKeyDown(e, cell)}
                    className={`flex flex-col justify-center items-center p-3 rounded-lg border text-center transition-all cursor-pointer min-h-[92px] ${isSelected ? 'ring-2 ring-[#4FB9AD]' : ''
                      }`}
                    style={{
                      backgroundColor: isSelected ? 'rgba(83, 109, 126, 0.22)' : 'rgba(83, 109, 126, 0.06)',
                      borderColor: isSelected ? '#4FB9AD' : 'rgba(83, 109, 126, 0.2)',
                      borderStyle: 'dashed',
                    }}
                  >
                    <span className="text-[11px] font-medium text-[#7E8B96]">
                      {cell.label}
                    </span>
                    <span className="text-[10px] text-[#536D7E] mt-0.5">
                      Hành lang chung
                    </span>
                  </div>
                );
              }

              if (cell.kind === 'service') {
                return (
                  <div
                    key={cell.cellId}
                    role="gridcell"
                    aria-label={`${cell.label}: Khu vực kỹ thuật & thang`}
                    tabIndex={0}
                    onClick={() => onSelectCell(cell.cellId)}
                    onKeyDown={(e) => handleKeyDown(e, cell)}
                    className={`flex flex-col justify-center items-center p-3 rounded-lg border text-center transition-all cursor-pointer min-h-[92px] ${isSelected ? 'ring-2 ring-[#4FB9AD]' : ''
                      }`}
                    style={{
                      backgroundColor: isSelected ? 'rgba(83, 109, 126, 0.25)' : 'rgba(83, 109, 126, 0.08)',
                      borderColor: isSelected ? '#4FB9AD' : 'rgba(83, 109, 126, 0.25)',
                    }}
                  >
                    <span className="text-[11px] font-medium text-[#A5B0B9]">
                      {cell.label}
                    </span>
                    <span className="text-[10px] text-[#7E8B96] mt-0.5">
                      Kỹ thuật / Thang
                    </span>
                  </div>
                );
              }

              // Standard Room Cell
              return (
                <button
                  key={cell.cellId}
                  role="gridcell"
                  type="button"
                  tabIndex={0}
                  onClick={() => onSelectCell(cell.cellId)}
                  onKeyDown={(e) => handleKeyDown(e, cell)}
                  aria-selected={isSelected}
                  aria-label={`${cell.label}: ${state.co2Value !== null
                    ? `${state.co2Value} ppm, trạng thái ${colorInfo.label}`
                    : 'Chưa gắn cảm biến'
                    }`}
                  className={`flex flex-col justify-between p-3 rounded-lg border text-left transition-all cursor-pointer min-h-[92px] group focus:outline-none focus:ring-2 focus:ring-[#4FB9AD] ${isSelected ? 'ring-2 ring-[#4FB9AD] shadow-md' : 'hover:border-[#4FB9AD]/40'
                    }`}
                  style={{
                    backgroundColor: colorInfo.bg,
                    borderColor: colorInfo.border,
                  }}
                >
                  <div className="flex items-start justify-between gap-1 w-full">
                    <span className="text-xs font-bold text-[#E6EDF1] group-hover:text-[#4FB9AD] transition-colors">
                      {cell.label}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: colorInfo.dot }}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="my-1">
                    {state.co2Value !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-base font-bold font-mono tracking-tight"
                          style={{ color: colorInfo.text }}
                        >
                          {state.co2Value}
                        </span>
                        <span className="text-[10px] text-[#A5B0B9]">ppm</span>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-[#7E8B96]">
                        —
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-[#7E8B96] truncate">
                    {state.co2Value !== null ? colorInfo.label.split(' ')[0] : 'Chưa có số liệu'}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Accessible Table Alternative */
          <div className="overflow-x-auto max-h-[300px] border border-[rgba(83,109,126,0.2)] rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#111922] text-[#A5B0B9] uppercase text-[10px] border-b border-[rgba(83,109,126,0.2)]">
                <tr>
                  <th className="px-3 py-2">Mã ô</th>
                  <th className="px-3 py-2">Tên không gian</th>
                  <th className="px-3 py-2">Phân loại</th>
                  <th className="px-3 py-2">Nồng độ CO₂</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(83,109,126,0.12)]">
                {floorConfig.cells.map((cell) => {
                  const state = getCellCo2State(cell);
                  const isSelected = cell.cellId === selectedCellId;
                  const colorInfo = getStatusColor(state.status, isSelected);

                  return (
                    <tr
                      key={cell.cellId}
                      className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-[#1C2B39]/60 font-semibold' : ''
                        }`}
                    >
                      <td className="px-3 py-2 font-mono text-[#7E8B96]">{cell.cellId}</td>
                      <td className="px-3 py-2 text-[#E6EDF1]">{cell.label}</td>
                      <td className="px-3 py-2 text-[#A5B0B9] capitalize">
                        {cell.kind === 'room'
                          ? 'Phòng học / làm việc'
                          : cell.kind === 'corridor'
                            ? 'Hành lang'
                            : 'Kỹ thuật'}
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: colorInfo.text }}>
                        {state.co2Value !== null ? `${state.co2Value} ppm` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="inline-flex items-center gap-1 text-[11px]"
                          style={{ color: colorInfo.text }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: colorInfo.dot }}
                          />
                          {colorInfo.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectCell(cell.cellId)}
                          className="text-[11px] text-[#4FB9AD] hover:underline"
                        >
                          {isSelected ? 'Đang chọn' : 'Chọn xem'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Legend and Technical Disclosure */}
      <div className="pt-3 border-t border-[rgba(83,109,126,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4FB9AD]" />
            <span className="text-[#A5B0B9]">Tốt (≤ 800)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E4BF55]" />
            <span className="text-[#A5B0B9]">Trung bình (801–1.000)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF2121]" />
            <span className="text-[#A5B0B9]">Cảnh báo (&gt; 1.000)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#536D7E]" />
            <span className="text-[#7E8B96]">Chưa có dữ liệu</span>
          </div>
        </div>

        {/* <div className="text-[11px] text-[#7E8B96]">
          Dữ liệu demo · Fixture page01-floor-grid-demo-v1 &amp; page03-co2-demo-v1
        </div> */}
      </div>
    </div>
  );
}
