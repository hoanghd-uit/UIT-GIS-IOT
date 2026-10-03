import React from 'react';

export type TimeRangePreset =
  | 'today'
  | 'yesterday'
  | 'last-24h'
  | 'last-72h'
  | 'last-7d'
  | 'last-30d'
  | 'custom'
  | string;

export interface TimeRangeValue {
  preset: TimeRangePreset;
  startIso?: string;
  endIso?: string;
}

export interface TimeRangeOption {
  id: string;
  label: string;
}

export interface TimeRangeSelectorProps {
  value: TimeRangeValue;
  onChange?: (val: TimeRangeValue) => void;
  disabled?: boolean;
  className?: string;
  options?: TimeRangeOption[];
}

const DEFAULT_PRESET_OPTIONS: TimeRangeOption[] = [
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
  options,
}: TimeRangeSelectorProps) {
  const activeOptions = options && options.length > 0 ? options : DEFAULT_PRESET_OPTIONS;

  const handlePresetClick = (preset: string) => {
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
      {activeOptions.map((opt) => {
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
