'use client';

import React, { useState } from 'react';
import { DashboardEnvironmentSourceItem } from '@/types/dashboard-environment';

export interface EnvironmentSourcePickerProps {
  isOpen: boolean;
  onClose: () => void;
  sources: DashboardEnvironmentSourceItem[];
  selectedSourceId: string | null;
  onSelectSource: (deviceId: string) => void;
}

export function EnvironmentSourcePicker({
  isOpen,
  onClose,
  sources,
  selectedSourceId,
  onSelectSource,
}: EnvironmentSourcePickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'solar' | 'sb'>('all');

  if (!isOpen) return null;

  const filteredSources = sources.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      s.deviceId.toLowerCase().includes(term) ||
      (s.sourceLocation.roomId && s.sourceLocation.roomId.toLowerCase().includes(term));

    const matchesFloor =
      selectedFloor === 'all' ||
      s.displayFloorId === selectedFloor ||
      (selectedFloor === 'unmapped' && !s.displayFloorId);

    const matchesType = selectedType === 'all' || s.sourceDeviceType === selectedType;

    return matchesSearch && matchesFloor && matchesType;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up"
        style={{
          backgroundColor: 'var(--panel-elevated)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <h2 id="source-picker-title" className="text-base font-semibold text-[#E6EDF1]">
              Chọn nguồn môi trường
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
              {sources.length} nguồn
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5 transition-colors"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-[var(--border)] flex flex-col gap-3">
          {/* Search Input */}
          <div className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Device EUI / ID, phòng..."
              className="w-full px-3.5 py-2 pl-9 rounded-xl border text-xs text-[#E6EDF1] placeholder-[#7E8B96] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              style={{
                backgroundColor: 'var(--panel-bg)',
                borderColor: 'var(--border)',
              }}
            />
            <svg
              className="w-4 h-4 absolute left-3 top-2.5 text-[#7E8B96]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter options */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            {/* Floor filter buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#7E8B96] text-[11px] mr-1">Tầng:</span>
              {['all', '4', '6', 'unmapped'].map((fl) => (
                <button
                  key={fl}
                  type="button"
                  onClick={() => setSelectedFloor(fl)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    selectedFloor === fl
                      ? 'bg-[#1C2B39] text-[#E6EDF1] font-medium border border-[rgba(83,109,126,0.3)]'
                      : 'text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5'
                  }`}
                >
                  {fl === 'all'
                    ? 'Tất cả'
                    : fl === 'unmapped'
                    ? 'Chưa gán'
                    : `Tầng ${fl}`}
                </button>
              ))}
            </div>

            {/* Type filter buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#7E8B96] text-[11px] mr-1">Loại:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'solar', label: 'Solar' },
                { id: 'sb', label: 'SB' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id as any)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    selectedType === t.id
                      ? 'bg-[var(--primary)]/20 text-[var(--primary)] font-medium border border-[var(--primary)]/40'
                      : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Source List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-2 max-h-[400px]">
          {filteredSources.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7E8B96]">
              Không tìm thấy nguồn môi trường nào phù hợp.
            </div>
          ) : (
            filteredSources.map((source) => {
              const isSelected = selectedSourceId === source.deviceId;
              const floorLabel = source.displayFloorId
                ? `Tầng ${source.displayFloorId}`
                : source.sourceLocation.floorLevel === 0
                ? 'Chưa gán tầng (Tầng 0)'
                : `Tầng nguồn ${source.sourceLocation.floorLevel}`;

              const roomLabel = source.sourceLocation.roomId
                ? `Phòng ${source.sourceLocation.roomId}`
                : null;

              return (
                <button
                  key={source.deviceId}
                  type="button"
                  onClick={() => {
                    onSelectSource(source.deviceId);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)]'
                      : 'hover:bg-white/5 border-[rgba(83,109,126,0.2)]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? undefined : 'var(--panel-bg)',
                  }}
                >
                  <div className="flex flex-col gap-0.5 truncate">
                    <span className="font-mono text-xs font-semibold text-[#E6EDF1] truncate">
                      {source.deviceId}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-[#A5B0B9] flex-wrap">
                      <span>{floorLabel}</span>
                      {roomLabel && (
                        <>
                          <span>·</span>
                          <span className="text-[#E6EDF1]">{roomLabel}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="text-[#7E8B96]">
                        {source.catalogueActive ? 'Catalogue: Hoạt động' : 'Catalogue: Ngưng'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium border uppercase ${
                        source.sourceDeviceType === 'sb'
                          ? 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
                          : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30'
                      }`}
                    >
                      {source.sourceDeviceType}
                    </span>
                    {isSelected && (
                      <span className="text-xs text-[var(--primary)] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] bg-[#111922] flex items-center justify-between text-xs text-[#7E8B96]">
          <span>Áp dụng các nguồn môi trường (solar, sb)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-xs font-medium text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
