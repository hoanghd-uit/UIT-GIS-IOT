import React from 'react';

export type TimeRangePreset = 'today' | 'yesterday' | 'last-7d' | 'last-30d' | 'custom';

export interface TimeRangeValue {
  preset: TimeRangePreset;
  startIso?: string;
  endIso?: string;
}

export interface TimeRangeSelectorProps {
  value: TimeRangeValue;
  onChange?: (val: TimeRangeValue) => void;
  disabled?: boolean;
  className?: string;
}

const PRESET_OPTIONS: { id: TimeRangePreset; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'yesterday', label: 'Hôm qua' },
  { id: 'last-7d', label: '7 ngày qua' },
  { id: 'last-30d', label: '30 ngày qua' },
  { id: 'custom', label: 'Tùy chọn' },
];

export function TimeRangeSelector({
  value,
  onChange,
  disabled = false,
  className = '',
}: TimeRangeSelectorProps) {
  const handlePresetClick = (preset: TimeRangePreset) => {
    if (disabled || !onChange) return;
    onChange({
      ...value,
      preset,
    });
  };

  return (
    <div
      role="group"
      aria-label="Chọn khoảng thời gian quan sát"
      className={`inline-flex items-center rounded-lg p-1 border ${className}`}
      style={{
        backgroundColor: 'var(--panel-elevated)',
        borderColor: 'var(--border)',
      }}
    >
      {PRESET_OPTIONS.map((opt) => {
        const isActive = value.preset === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => handlePresetClick(opt.id)}
            className={`px-3 py-1 text-xs font-medium rounded transition-all focus:outline-none focus:ring-1 ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{
              backgroundColor: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
