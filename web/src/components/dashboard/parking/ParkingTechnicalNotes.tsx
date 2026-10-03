'use client';

import React from 'react';
import { ParkingTechnicalNote } from '@/types/dashboard-parking';
import { PARKING_DEMO_FIXTURE_ID } from '@/lib/dashboard/parking-demo-fixtures';

export interface ParkingTechnicalNotesProps {
  notes: ParkingTechnicalNote[];
  className?: string;
}

export function ParkingTechnicalNotes({
  notes,
  className = '',
}: ParkingTechnicalNotesProps) {
  const iconMap: Record<string, string> = {
    'NOTE-01': '🚗',
    'NOTE-02': '🛵',
    'NOTE-03': '🔒',
    'NOTE-04': '⚙️',
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl border flex flex-col gap-4 ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
      aria-label="Ghi chú kỹ thuật và giới hạn kịch bản mô phỏng"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(83,109,126,0.18)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#E6EDF1]">
              Ghi chú kỹ thuật
            </h3>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
              title={`Chế độ Demo · Fixture ${PARKING_DEMO_FIXTURE_ID}`}
            >
              Demo
            </span>
          </div>
          <p className="text-xs text-[#7E8B96] mt-0.5">
            Toàn bộ page Parking này đang là Demo
          </p>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {notes.map((note) => {
          const icon = iconMap[note.id] || 'ℹ️';
          return (
            <div
              key={note.id}
              className="p-3.5 rounded-lg bg-[#111922]/60 border border-[rgba(83,109,126,0.2)] flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-base" aria-hidden="true">
                  {icon}
                </span>
                <h4 className="text-xs font-bold text-[#E6EDF1] leading-snug">
                  {note.title}
                </h4>
              </div>
              <p className="text-xs text-[#A5B0B9] leading-relaxed">
                {note.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
