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
}: IotCatalogueFiltersProps) {
  const hasActiveLocalFilter = searchQuery.trim() !== '' || selectedType !== 'all';

  return (
    <div
      className="p-3.5 rounded-lg border mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Floor Selection */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="iot-floor-filter" className="font-medium whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
            Phạm vi tầng:
          </label>
          <select
            id="iot-floor-filter"
            value={selectedFloor}
            onChange={(e) => onFloorChange(e.target.value)}
            disabled={disabled}
            className="px-2.5 py-1.5 rounded border text-xs font-medium focus:outline-none focus:ring-1 transition-colors"
            style={{
              backgroundColor: 'var(--panel-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">Toàn bộ danh mục (Tất cả)</option>
            <option value="4">Tầng 4 (Building E)</option>
            <option value="6">Tầng 6 (Building E)</option>
          </select>
        </div>

        {/* Separator on desktop */}
        <div className="hidden md:block w-px h-5" style={{ backgroundColor: 'var(--border)' }} />

        {/* Search by Device ID */}
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <input
            id="iot-search-id"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã thiết bị (Device ID)..."
            disabled={disabled}
            className="w-full pl-8 pr-2.5 py-1.5 rounded border text-xs focus:outline-none focus:ring-1 transition-colors"
            style={{
              backgroundColor: 'var(--panel-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
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

        {/* Filter by Device Type */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="iot-type-filter" className="font-medium whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
            Loại thiết bị:
          </label>
          <select
            id="iot-type-filter"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            disabled={disabled}
            className="px-2.5 py-1.5 rounded border text-xs font-medium focus:outline-none focus:ring-1 transition-colors"
            style={{
              backgroundColor: 'var(--panel-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">Tất cả loại ({availableTypes.length})</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Local Filters button */}
        {hasActiveLocalFilter && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onTypeChange('all');
            }}
            className="px-2 py-1 rounded text-[11px] font-medium transition-colors"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-muted)',
            }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Summary Count Indicator */}
      <div className="flex items-center gap-1 text-[11px] font-medium whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
        <span>Hiển thị:</span>
        <strong className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
          {filteredCount}
        </strong>
        <span>/</span>
        <span className="font-mono">{totalLoaded}</span>
        <span>thiết bị</span>
      </div>
    </div>
  );
}
