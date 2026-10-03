'use client';

import React, { useState, useEffect } from 'react';
import {
  DashboardEnvironmentReadingsResponse,
  EnvironmentRawMetricKey,
} from '@/types/dashboard-environment';
import { prepareEnvironmentChartData } from '@/lib/dashboard/environment-chart';
import { MetricTrendChart } from '@/components/dashboard/charts/MetricTrendChart';

export interface EnvironmentSourceDetailProps {
  data: DashboardEnvironmentReadingsResponse | null;
  status: 'idle' | 'loading' | 'refreshing' | 'ready' | 'empty' | 'unavailable' | 'error';
  onClose: () => void;
  onRefresh?: () => void;
  className?: string;
}

const SOLAR_TABS: Array<{ key: EnvironmentRawMetricKey; label: string; unit: string }> = [
  { key: 'rawTemperature', label: 'Nhiệt độ thô', unit: '°C' },
  { key: 'rawHumidity', label: 'Độ ẩm thô', unit: '%' },
  { key: 'lux', label: 'Độ rọi', unit: 'lux' },
  { key: 'rssi', label: 'RSSI', unit: 'dBm' },
  { key: 'snr', label: 'SNR', unit: 'dB' },
];

const SB_TABS: Array<{ key: EnvironmentRawMetricKey; label: string; unit: string }> = [
  { key: 'rawCo2', label: 'CO₂', unit: 'ppm' },
  { key: 'rawVoc', label: 'VOC Index', unit: 'index' },
  { key: 'rawVoltage', label: 'Điện áp pin', unit: 'V' },
  { key: 'rawVisible', label: 'Visible', unit: 'count' },
  { key: 'rawIr', label: 'IR', unit: 'count' },
  { key: 'rssi', label: 'RSSI', unit: 'dBm' },
  { key: 'snr', label: 'SNR', unit: 'dB' },
];

export function EnvironmentSourceDetail({
  data,
  status,
  onClose,
  onRefresh,
  className = '',
}: EnvironmentSourceDetailProps) {
  const isSb = data?.sourceDeviceType === 'sb';
  const metricTabs = isSb ? SB_TABS : SOLAR_TABS;

  const [selectedMetric, setSelectedMetric] = useState<EnvironmentRawMetricKey>(
    isSb ? 'rawCo2' : 'rawTemperature',
  );

  // Sync selected metric default when source device type changes
  useEffect(() => {
    if (isSb) {
      if (!SB_TABS.some((t) => t.key === selectedMetric)) {
        setSelectedMetric('rawCo2');
      }
    } else {
      if (!SOLAR_TABS.some((t) => t.key === selectedMetric)) {
        setSelectedMetric('rawTemperature');
      }
    }
  }, [isSb, selectedMetric]);

  const isLoading = status === 'loading';
  const readings = data?.readings || [];
  const latest = data?.latestSample;
  const chartData = prepareEnvironmentChartData(readings, selectedMetric);
  const activeTabInfo = metricTabs.find((t) => t.key === selectedMetric) || metricTabs[0];

  return (
    <div
      className={`p-5 rounded-xl border flex flex-col gap-4 animate-fade-in ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7E8B96]">
                {isSb ? 'Chi tiết nguồn Smart Building (SB):' : 'Chi tiết nguồn Solar:'}
              </span>
              <span className="font-mono text-sm font-bold text-[#E6EDF1]">
                {data?.sourceId || '—'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30">
                Live
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-medium border uppercase ${
                  isSb
                    ? 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
                    : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30'
                }`}
              >
                {data?.sourceDeviceType || 'solar'}
              </span>
            </div>
            <p className="text-[11px] text-[#A5B0B9]">
              Dữ liệu telemetry đo đạc theo khoảng thời gian thực tế
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg border text-xs font-medium text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5 transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--border)' }}
            >
              {isLoading ? 'Đang tải...' : 'Làm mới'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg border text-xs font-medium text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border)' }}
            aria-label="Đóng bảng chi tiết"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {metricTabs.map((tab) => {
          const isSelected = selectedMetric === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedMetric(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-[#1C2B39] text-[#E6EDF1] border border-[rgba(83,109,126,0.3)] shadow-sm'
                  : 'text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5'
              }`}
            >
              {tab.label}
              {tab.unit ? ` (${tab.unit})` : ''}
            </button>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="w-full">
        <MetricTrendChart
          data={chartData}
          metricLabel={activeTabInfo.label}
          unit={activeTabInfo.unit}
          loading={isLoading}
          availability={data?.availability || 'ready'}
          height={260}
          timeKey="timestamp"
          valueKey="value"
        />
      </div>

      {/* Technical Metadata Cards */}
      {isSb ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.2)] flex flex-col gap-1">
            <span className="text-[11px] text-[#7E8B96]">CO₂ hiện tại</span>
            <span className="font-mono text-base font-bold text-[#E6EDF1]">
              {latest?.rawCo2 != null ? `${latest.rawCo2} ppm` : '—'}
            </span>
            <span className="text-[10px] text-[#A5B0B9]">Giả định ppm tiêu chuẩn</span>
          </div>

          <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.2)] flex flex-col gap-1">
            <span className="text-[11px] text-[#7E8B96]">Chỉ số VOC</span>
            <span className="font-mono text-base font-bold text-[#E6EDF1]">
              {latest?.rawVoc != null ? `${latest.rawVoc}` : '—'}
            </span>
            <span className="text-[10px] text-[#A5B0B9]">Chỉ số tương đối (index)</span>
          </div>

          <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.2)] flex flex-col gap-1">
            <span className="text-[11px] text-[#7E8B96]">Điện áp pin</span>
            <span className="font-mono text-base font-bold text-[#E6EDF1]">
              {latest?.rawVoltage != null ? `${latest.rawVoltage} V` : '—'}
            </span>
            <span className="text-[10px] text-[#A5B0B9]">Đo điện áp pin</span>
          </div>

          <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.2)] flex flex-col gap-1">
            <span className="text-[11px] text-[#7E8B96]">Quang học & Radio</span>
            <span className="font-mono text-xs font-bold text-[#E6EDF1]">
              Vis: {latest?.rawVisible ?? '—'} / IR: {latest?.rawIr ?? '—'}
            </span>
            <span className="text-[10px] text-[#A5B0B9]">
              RSSI: {latest?.rssiDbm != null ? `${latest.rssiDbm} dBm` : '—'}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.2)] flex flex-col gap-1">
            <span className="text-[11px] text-[#7E8B96]">Raw Temperature</span>
            <span className="font-mono text-base font-bold text-[#E6EDF1]">
              {latest?.rawTemperature != null ? `${latest.rawTemperature} °C` : '—'}
            </span>
            <span className="text-[10px] text-[#A5B0B9]">Theo hợp đồng §3.6</span>
          </div>

          <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.2)] flex flex-col gap-1">
            <span className="text-[11px] text-[#7E8B96]">Raw Humidity</span>
            <span className="font-mono text-base font-bold text-[#E6EDF1]">
              {latest?.rawHumidity != null ? `${latest.rawHumidity} %` : '—'}
            </span>
            <span className="text-[10px] text-[#A5B0B9]">Theo hợp đồng §3.6</span>
          </div>

          <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.2)] flex flex-col gap-1">
            <span className="text-[11px] text-[#7E8B96]">Độ rọi (Lux)</span>
            <span className="font-mono text-base font-bold text-[#E6EDF1]">
              {latest?.lux != null ? `${latest.lux} lux` : '—'}
            </span>
            <span className="text-[10px] text-[#A5B0B9]">Quang thông / m²</span>
          </div>

          <div className="p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.2)] flex flex-col gap-1">
            <span className="text-[11px] text-[#7E8B96]">Radio (RSSI / SNR)</span>
            <span className="font-mono text-base font-bold text-[#E6EDF1]">
              {latest?.rssiDbm != null ? `${latest.rssiDbm} dBm` : '—'}
            </span>
            <span className="text-[10px] text-[#A5B0B9]">
              {latest?.snrDb != null ? `SNR: ${latest.snrDb} dB` : 'Chưa có SNR'}
            </span>
          </div>
        </div>
      )}

      {/* Caveats Disclosure */}
      <div className="p-3 rounded-lg bg-[#17222C] border border-[rgba(83,109,126,0.3)] text-xs text-[#A5B0B9] flex flex-col gap-1">
        <span className="font-semibold text-[#E6EDF1] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
          Lưu ý quan trọng về tính chân thực của dữ liệu:
        </span>
        <ul className="list-disc pl-5 text-[11px] text-[#7E8B96] flex flex-col gap-0.5">
          {isSb ? (
            <>
              <li>
                Chỉ số CO₂ từ nguồn Smart Building (SB) được giả định dùng đơn vị tiêu chuẩn ppm (chưa có xác nhận kỹ thuật từ đội ngũ phần cứng).
              </li>
              <li>
                Chỉ số VOC là chỉ số tương đối (VOC index), không biểu thị nồng độ tuyệt đối mg/m³ hay ppb.
              </li>
            </>
          ) : (
            <>
              <li>
                Trường nhiệt độ và độ ẩm ở trên là các trường dữ liệu thô từ Solar telemetry theo tài liệu §3.6.
              </li>
              <li>
                Thiết bị Solar không được coi là cảm biến vi khí hậu phòng cụ thể và không dùng để đánh giá tuân thủ quy chuẩn phòng.
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
