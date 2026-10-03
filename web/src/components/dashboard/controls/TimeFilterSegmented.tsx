'use client';

import React from 'react';

export interface TimeFilterPresetItem {
  id: string;
  label: string;
}

export const DEFAULT_IOT_TIME_PRESETS: TimeFilterPresetItem[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: 'custom', label: 'Tùy chọn' },
];

export interface TimeFilterSegmentedProps {
  activePreset: string;
  onPresetChange?: (presetId: string) => void;
  presets?: TimeFilterPresetItem[];
  ariaLabel?: string;
  className?: string;
}

/**
 * Reusable segmented time range filter UI block.
 * Pixel-identical shared component used across /dashboard/iot and /dashboard/energy-water.
 */
export function TimeFilterSegmented({
  activePreset,
  onPresetChange,
  presets = DEFAULT_IOT_TIME_PRESETS,
  ariaLabel = 'Khoảng thời gian giám sát',
  className = '',
}: TimeFilterSegmentedProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center p-1 rounded-xl border text-xs ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {presets.map((item) => {
        const isActive = activePreset === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onPresetChange?.(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-[#17222C] text-[#E6EDF1] shadow-sm border border-[rgba(83,109,126,0.3)]'
                : 'text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5'
            }`}
            aria-pressed={isActive}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
