'use client';

import React from 'react';

export interface IotCatalogueFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  availableTypes: string[];
  selectedFloor: string;
  onFloorChange: (floor: string) => void;
  totalLoaded: number;
  filteredCount: number;
  disabled?: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function IotCatalogueFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  availableTypes,
  selectedFloor,
  onFloorChange,
  totalLoaded,
  filteredCount,
  disabled = false,
  searchInputRef,
}: IotCatalogueFiltersProps) {
  const hasActiveLocalFilter = searchQuery.trim() !== '' || selectedType !== 'all' || selectedFloor !== 'all';

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 w-full pb-3 border-b border-[rgba(83,109,126,0.18)]">
      {/* Left: Card Title with Counts and Filter Pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-[#E6EDF1] flex items-center gap-1.5 whitespace-nowrap">
          <span>Danh sách thiết bị</span>
          <span className="text-xs font-mono text-[#A5B0B9]">
            ({filteredCount} / {totalLoaded})
          </span>
        </h2>

        {/* Filter Pills from Mockup */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border)] text-xs">
          <button
            type="button"
            className="px-2.5 py-1 rounded-md font-medium bg-[#17222C] text-[#E6EDF1] border border-[rgba(79,185,173,0.3)] shadow-sm"
          >
            Tất cả
          </button>
          <button
            type="button"
            disabled
            className="px-2.5 py-1 rounded-md text-[#7E8B96] opacity-50 cursor-not-allowed"
            title="Chưa có nguồn trạng thái sự cố"
          >
            Có sự cố
          </button>
          <button
            type="button"
            disabled
            className="px-2.5 py-1 rounded-md text-[#7E8B96] opacity-50 cursor-not-allowed"
            title="Chưa xác nhận dữ liệu pin"
          >
            Pin yếu
          </button>
        </div>
      </div>

      {/* Right: Secondary Compact Controls (Floor, Type, Search) */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Floor Selection Dropdown */}
        <select
          id="iot-floor-filter"
          value={selectedFloor}
          onChange={(e) => onFloorChange(e.target.value)}
          disabled={disabled}
          className="px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-colors"
          style={{
            backgroundColor: 'var(--panel-elevated)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
          aria-label="Lọc theo tầng"
        >
          <option value="all">Tất cả tầng</option>
          <option value="4">Tầng 4</option>
          <option value="6">Tầng 6</option>
        </select>

        {/* Type Selection Dropdown */}
        <select
          id="iot-type-filter"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          disabled={disabled}
          className="px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-colors"
          style={{
            backgroundColor: 'var(--panel-elevated)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
          aria-label="Lọc theo loại thiết bị"
        >
          <option value="all">Tất cả loại ({availableTypes.length})</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {/* Search by Device ID */}
        <div className="relative min-w-[170px] max-w-[220px]">
          <input
            ref={searchInputRef as React.RefObject<HTMLInputElement>}
            id="iot-search-id"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm mã thiết bị..."
            disabled={disabled}
            className="w-full pl-7 pr-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-colors"
            style={{
              backgroundColor: 'var(--panel-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <svg
            className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#7E8B96]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Clear Filters */}
        {hasActiveLocalFilter && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onTypeChange('all');
              if (selectedFloor !== 'all') onFloorChange('all');
            }}
            className="px-2 py-1.5 rounded-lg text-xs font-medium text-[#7E8B96] hover:text-[#E6EDF1] hover:bg-white/5 transition-colors border border-transparent"
            title="Xóa tất cả bộ lọc tìm kiếm"
          >
            Xóa lọc
          </button>
        )}
      </div>
    </div>
  );
}

