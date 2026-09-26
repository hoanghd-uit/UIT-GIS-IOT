'use client';

import React from 'react';
import { SolarTelemetryData, AvcTelemetryData } from '@/types/iot-telemetry';

export interface IotTelemetryMetricSelectorProps {
  deviceType: 'solar' | 'avc';
  telemetry: SolarTelemetryData | AvcTelemetryData;
  selectedMetric: string;
  onSelectMetric: (metric: string) => void;
}

function formatDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  } catch {
    return isoString;
  }
}

export function IotTelemetryMetricSelector({
  deviceType,
  telemetry,
  selectedMetric,
  onSelectMetric,
}: IotTelemetryMetricSelectorProps) {
  if (deviceType === 'solar') {
    const solar = telemetry as SolarTelemetryData;
    const currentVal = solar.hero.value;
    const currentTs = solar.hero.sampleTimestamp;
    const luxVal = solar.secondarySelector.value;
    const luxTs = solar.secondarySelector.sampleTimestamp;

    const metrics = [
      {
        id: 'current_uA',
        label: solar.hero.label || 'Dòng điện',
        unit: solar.hero.unit,
        value: currentVal !== null && currentVal !== undefined ? currentVal.toLocaleString('vi-VN') : '—',
        timestamp: currentTs,
        badge: null,
      },
      {
        id: 'lux',
        label: solar.secondarySelector.label || 'Độ sáng',
        unit: solar.secondarySelector.unit,
        value: luxVal !== null && luxVal !== undefined ? luxVal.toLocaleString('vi-VN') : '—',
        timestamp: luxTs,
        badge: null,
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {metrics.map((m) => {
          const isSelected = selectedMetric === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMetric(m.id)}
              className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer relative ${
                isSelected ? 'ring-2 ring-cyan-500 shadow-md' : 'hover:border-cyan-500/50'
              }`}
              style={{
                backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'var(--panel-elevated)',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
              }}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {m.label}
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)]" style={{ color: 'var(--text-primary)' }}>
                  {m.unit}
                </span>
              </div>
              <div className="text-xl font-bold font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {m.value}{' '}
                <span className="text-xs font-normal text-muted-foreground">{m.unit}</span>
              </div>
              <div className="mt-2 text-[10px] font-mono flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                <span>Mẫu gần nhất:</span>
                <span>{formatDate(m.timestamp)}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // AVC Water Meter
  const avc = telemetry as AvcTelemetryData;
  const flowVal = avc.hero.value;
  const flowTs = avc.hero.sampleTimestamp;
  const tempVal = avc.secondarySelectors.tempC.value;
  const tempTs = avc.secondarySelectors.tempC.sampleTimestamp;
  const fwdVal = avc.secondarySelectors.fwdVolume.value;
  const fwdTs = avc.secondarySelectors.fwdVolume.sampleTimestamp;
  const revVal = avc.secondarySelectors.revVolume.value;
  const revTs = avc.secondarySelectors.revVolume.sampleTimestamp;

  const avcMetrics = [
    {
      id: 'instant_flow_m3h',
      label: avc.hero.label || 'Lưu lượng tức thời',
      unit: avc.hero.unit,
      value: flowVal !== null && flowVal !== undefined ? flowVal.toLocaleString('vi-VN') : '—',
      timestamp: flowTs,
      badge: 'Chưa xác nhận phần cứng',
    },
    {
      id: 'temp_c',
      label: avc.secondarySelectors.tempC.label || 'Nhiệt độ đo được',
      unit: avc.secondarySelectors.tempC.unit,
      value: tempVal !== null && tempVal !== undefined ? tempVal.toLocaleString('vi-VN') : '—',
      timestamp: tempTs,
      badge: 'Vị trí đo chưa xác định',
    },
    {
      id: 'fwd_volume_m3',
      label: avc.secondarySelectors.fwdVolume.label || 'Thể tích thuận',
      unit: avc.secondarySelectors.fwdVolume.unit,
      value: fwdVal !== null && fwdVal !== undefined ? fwdVal.toLocaleString('vi-VN') : '—',
      timestamp: fwdTs,
      badge: 'Tích lũy chưa xác nhận',
    },
    {
      id: 'rev_volume_m3',
      label: avc.secondarySelectors.revVolume.label || 'Thể tích ngược',
      unit: avc.secondarySelectors.revVolume.unit,
      value: revVal !== null && revVal !== undefined ? revVal.toLocaleString('vi-VN') : '—',
      timestamp: revTs,
      badge: 'Tích lũy chưa xác nhận',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {avcMetrics.map((m) => {
        const isSelected = selectedMetric === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelectMetric(m.id)}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative ${
              isSelected ? 'ring-2 ring-cyan-500 shadow-md' : 'hover:border-cyan-500/50'
            }`}
            style={{
              backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'var(--panel-elevated)',
              borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
            }}
            aria-pressed={isSelected}
          >
            <div className="flex items-start justify-between gap-1 mb-1">
              <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-muted)' }} title={m.label}>
                {m.label}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[rgba(255,255,255,0.06)] shrink-0" style={{ color: 'var(--text-primary)' }}>
                {m.unit}
              </span>
            </div>
            <div className="text-lg font-bold font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {m.value}{' '}
              <span className="text-xs font-normal text-muted-foreground">{m.unit}</span>
            </div>
            {m.badge && (
              <div className="mt-1">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-medium inline-block"
                  style={{
                    backgroundColor: 'rgba(234, 179, 8, 0.12)',
                    color: 'var(--warning)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                  }}
                >
                  {m.badge}
                </span>
              </div>
            )}
            <div className="mt-2 text-[10px] font-mono flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
              <span>Thời điểm:</span>
              <span>{formatDate(m.timestamp)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
