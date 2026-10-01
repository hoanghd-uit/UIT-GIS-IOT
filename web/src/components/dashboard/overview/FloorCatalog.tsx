'use client';

import React from 'react';
import { FloorConfig } from '@/types/dashboard-overview';

export interface FloorCatalogProps {
  floors: FloorConfig[];
  selectedFloorId: string;
  onSelectFloor: (floorId: string) => void;
  className?: string;
}

export function FloorCatalog({
  floors,
  selectedFloorId,
  onSelectFloor,
  className = '',
}: FloorCatalogProps) {
  return (
    <nav
      aria-label="Danh mục các tầng tòa nhà E"
      className={`flex flex-row md:flex-col gap-2 p-1.5 rounded-xl bg-[#111922] border border-[rgba(83,109,126,0.25)] ${className}`}
    >
      <div className="hidden md:block px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#A5B0B9] border-b border-[rgba(83,109,126,0.15)] mb-1">
        Chọn tầng
      </div>
      {floors.map((floor) => {
        const isSelected = floor.floorId === selectedFloorId;
        return (
          <button
            key={floor.floorId}
            type="button"
            onClick={() => onSelectFloor(floor.floorId)}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
              isSelected
                ? 'bg-[#1C2B39] text-[#E6EDF1] font-semibold border border-[rgba(79,185,173,0.4)] shadow-sm'
                : 'text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5 border border-transparent'
            }`}
            aria-pressed={isSelected}
            aria-label={`${floor.label}: ${floor.roomCount} phòng logic`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  isSelected ? 'bg-[#4FB9AD]' : 'bg-[#536D7E]/50'
                }`}
                aria-hidden="true"
              />
              <span className="text-xs sm:text-sm font-medium">{floor.label}</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                isSelected
                  ? 'bg-[#4FB9AD]/15 text-[#4FB9AD]'
                  : 'bg-white/5 text-[#7E8B96]'
              }`}
            >
              {floor.roomCount} phòng
            </span>
          </button>
        );
      })}
    </nav>
  );
}
