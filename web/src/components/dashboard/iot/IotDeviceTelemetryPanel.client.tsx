'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DashboardDeviceCatalogueItem } from '@/types/dashboard-iot';
import {
  DashboardDeviceTelemetryResponse,
  DashboardTelemetryPreset,
} from '@/types/dashboard-iot-telemetry';
import {
  DASHBOARD_TELEMETRY_PRESETS,
  DEFAULT_TELEMETRY_PRESET,
  computeTelemetryRange,
} from '@/lib/dashboard/iot-telemetry-range';
import { fetchDashboardDeviceTelemetry } from '@/lib/dashboard/iot-telemetry-api';
import { prepareTelemetryChartData } from '@/lib/dashboard/iot-telemetry-chart';
import { TimeRangeSelector } from '@/components/dashboard/controls/TimeRangeSelector';
import { DataModeBadge } from '@/components/dashboard/cards/DataModeBadge';
import { MetricTrendChart } from '@/components/dashboard/charts/MetricTrendChart';
import { LoadingState } from '@/components/dashboard/states/LoadingState';
import { EmptyDataState } from '@/components/dashboard/states/EmptyDataState';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';
import { ErrorState } from '@/components/dashboard/states/ErrorState';
import { IotTelemetryMetricSelector } from './IotTelemetryMetricSelector';
import { IotTelemetryTechnicalDetails } from './IotTelemetryTechnicalDetails';

export interface IotDeviceTelemetryPanelProps {
  device: DashboardDeviceCatalogueItem;
  onClose: () => void;
  onTelemetryLoaded?: (summary: {
    gatewayId?: string | null;
    rssi?: number | null;
    snr?: number | null;
    latestTimestamp?: string | null;
  } | null) => void;
}

function formatDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return isoString;
  }
}

export function IotDeviceTelemetryPanel({
  device,
  onClose,
  onTelemetryLoaded,
}: IotDeviceTelemetryPanelProps) {
  const isSupportedType = device.sourceDeviceType === 'solar' || device.sourceDeviceType === 'avc';

  const [preset, setPreset] = useState<DashboardTelemetryPreset>(DEFAULT_TELEMETRY_PRESET);
  const [selectedMetric, setSelectedMetric] = useState<string>(
    device.sourceDeviceType === 'avc' ? 'instant_flow_m3h' : 'current_uA',
  );
  const [data, setData] = useState<DashboardDeviceTelemetryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const requestGenRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Notify parent of telemetry summary for table and gateway card
  useEffect(() => {
    if (data?.latestSample) {
      onTelemetryLoaded?.({
        gatewayId: data.latestSample.gatewayId ?? null,
        rssi: data.latestSample.rssiDbm ?? null,
        snr: data.latestSample.snrDb ?? null,
        latestTimestamp: data.latestSample.observedAt ?? null,
      });
    } else {
      onTelemetryLoaded?.(null);
    }
  }, [data, onTelemetryLoaded]);


  // Update default metric when selected device type changes
  useEffect(() => {
    setSelectedMetric(device.sourceDeviceType === 'avc' ? 'instant_flow_m3h' : 'current_uA');
  }, [device.externalDeviceId, device.sourceDeviceType]);


  const loadTelemetry = useCallback(
    async (targetPreset: DashboardTelemetryPreset, isRefresh = false) => {
      if (!isSupportedType) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const currentGen = ++requestGenRef.current;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (!isRefresh) {
        setData(null);
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const range = computeTelemetryRange(targetPreset);

      try {
        const result = await fetchDashboardDeviceTelemetry({
          deviceId: device.externalDeviceId,
          start: range.start,
          stop: range.stop,
          signal: controller.signal,
        });

        if (currentGen !== requestGenRef.current) return;

        if (!result.success) {
          setError(result.error.message);
          return;
        }

        setData(result.data);
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        if (currentGen !== requestGenRef.current) return;
        setError('Không thể tải telemetry thiết bị do lỗi mạng hoặc gián đoạn kết nối.');
      } finally {
        if (currentGen === requestGenRef.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [device.externalDeviceId, isSupportedType],
  );

  // Trigger on device or preset change
  useEffect(() => {
    if (!isSupportedType) {
      setData(null);
      setLoading(false);
      setIsRefreshing(false);
      setError(null);
      return;
    }

    loadTelemetry(preset, false);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [preset, isSupportedType, loadTelemetry]);

  const handleRefresh = () => {
    loadTelemetry(preset, true);
  };

  const handlePresetChange = (newVal: { preset: string }) => {
    const validPreset = newVal.preset as DashboardTelemetryPreset;
    setPreset(validPreset);
  };

  // Metric options mapping for trend chart
  const activeMetricMeta = useMemo(() => {
    if (device.sourceDeviceType === 'solar') {
      if (selectedMetric === 'lux') {
        return { label: 'Độ sáng', unit: 'lx', key: 'lux' };
      }
      return { label: 'Dòng điện', unit: 'µA', key: 'currentUa' };
    }
    // AVC
    if (selectedMetric === 'temp_c') {
      return { label: 'Nhiệt độ đo được', unit: '°C', key: 'tempC' };
    }
    if (selectedMetric === 'fwd_volume_m3') {
      return { label: 'Thể tích tích lũy chiều thuận', unit: 'm³', key: 'fwdVolumeM3' };
    }
    if (selectedMetric === 'rev_volume_m3') {
      return { label: 'Thể tích tích lũy chiều ngược', unit: 'm³', key: 'revVolumeM3' };
    }
    return { label: 'Lưu lượng tức thời', unit: 'm³/h', key: 'instantFlowM3h' };
  }, [device.sourceDeviceType, selectedMetric]);

  // Prepare chart data copy (chronologically sorted oldest-first)
  const chartData = useMemo(() => {
    const readings = (data?.telemetry as any)?.readings || [];
    return prepareTelemetryChartData({
      readings,
      metricKey: activeMetricMeta.key,
      metricLabel: activeMetricMeta.label,
      unit: activeMetricMeta.unit,
      queryRange: data?.queryRange,
      isTruncated: data?.coverage.isTruncated,
    });
  }, [data, activeMetricMeta]);

  return (
    <div
      role="region"
      aria-label={`Chi tiết telemetry thiết bị ${device.externalDeviceId}`}
      className="mt-6 p-5 rounded-xl border flex flex-col gap-4 shadow-sm"
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="font-mono text-sm px-2 py-0.5 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)]">
                {device.externalDeviceId}
              </span>
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded font-medium uppercase font-mono"
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                color: 'var(--primary)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
              }}
            >
              {device.sourceDeviceType}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono uppercase bg-[rgba(255,255,255,0.04)] text-muted-foreground">
              {device.category}
            </span>
            {device.displayFloorId && (
              <span className="text-xs text-muted-foreground font-medium">
                Tầng {device.displayFloorId}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {device.sourceDeviceType === 'solar'
              ? 'Tấm pin năng lượng mặt trời — Giám sát dòng điện và độ sáng thời gian thực'
              : device.sourceDeviceType === 'avc'
              ? 'Đồng hồ nước AVC — Giám sát lưu lượng và chỉ số đo nước'
              : `Thiết bị danh mục ${device.sourceDeviceType}`}
          </span>
        </div>

        {/* Controls: Range Selector + Refresh + Close */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isSupportedType && (
            <>
              <TimeRangeSelector
                value={{ preset }}
                onChange={handlePresetChange}
                disabled={loading}
                options={DASHBOARD_TELEMETRY_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
              />
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                className="px-3 py-1 text-xs font-medium rounded border transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none"
                style={{
                  backgroundColor: 'var(--panel-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                title="Làm mới dữ liệu telemetry với khoảng thời gian trượt mới nhất"
              >
                <svg
                  className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{isRefreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--panel-elevated)',
              borderColor: 'var(--border)',
            }}
            title="Đóng bảng telemetry thiết bị"
            aria-label="Đóng bảng telemetry"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Unsupported Type Screen (e.g. NFC or unknown) */}
      {!isSupportedType && (
        <UnavailableDataState
          title={`Loại thiết bị '${device.sourceDeviceType}' chưa hỗ trợ telemetry trên Dashboard`}
          description="Trong giai đoạn Big Phase 02 / Phase 03, Dashboard chỉ tích hợp dữ liệu telemetry trực tiếp cho thiết bị pin mặt trời (solar) và đồng hồ nước (avc). Thiết bị NFC và các loại khác tiếp tục hiển thị trong danh mục nhưng chưa có biểu đồ telemetry."
          phaseNote="Quy định Phase 03: Thiết bị NFC và các cảm biến chưa hỗ trợ không thực hiện cuộc gọi mạng telemetry từ Dashboard."
        />
      )}

      {/* Loading State */}
      {isSupportedType && loading && !isRefreshing && (
        <LoadingState message={`Đang nạp telemetry cho thiết bị ${device.externalDeviceId}...`} />
      )}

      {/* Error State */}
      {isSupportedType && error && !loading && (
        <ErrorState
          title="Không thể tải telemetry thiết bị"
          message={error}
          onRetry={() => loadTelemetry(preset, false)}
          retryLabel="Thử lại"
        />
      )}

      {/* Empty Data State */}
      {isSupportedType && !loading && !error && data?.availability === 'empty' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Cửa sổ truy vấn: <span className="font-mono text-foreground">{formatDate(data.provenance.windowStart)}</span> đến{' '}
              <span className="font-mono text-foreground">{formatDate(data.provenance.windowEnd)}</span>
            </span>
            <DataModeBadge mode="live" availability="empty" provenance={data.provenance} size="sm" />
          </div>
          <EmptyDataState
            title="Không có bản tin telemetry nào"
            description={`Thiết bị ${device.externalDeviceId} không phát bản tin nào trong khoảng thời gian đã chọn.`}
          />
        </div>
      )}

      {/* Ready State */}
      {isSupportedType && !loading && !error && data?.availability === 'ready' && (
        <div className="space-y-4">
          {/* Provenance & Time Meta Banner */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="text-muted-foreground">
              Khoảng thời gian:{' '}
              <span className="font-mono text-foreground">{formatDate(data.queryRange.start)}</span> —{' '}
              <span className="font-mono text-foreground">{formatDate(data.queryRange.stop)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-mono">
                Cập nhật lúc: {formatDate(data.provenance.fetchedAt)}
              </span>
              <DataModeBadge
                mode="live"
                availability="ready"
                provenance={data.provenance}
                size="sm"
              />
            </div>
          </div>

          {/* Common Latest Sample Cards (Section 8.1) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--panel-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                Bản tin telemetry mới nhất
              </div>
              <div className="text-xs font-mono font-semibold text-foreground mt-1">
                {formatDate(data.latestSample?.observedAt)}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                Thời điểm ghi nhận bản tin
              </div>
            </div>

            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--panel-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                Gateway thu nhận
              </div>
              <div className="text-xs font-mono font-semibold text-foreground mt-1 truncate" title={data.latestSample?.gatewayId ?? ''}>
                {data.latestSample?.gatewayId ?? '—'}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                Định danh trạm thu LoRaWAN
              </div>
            </div>

            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--panel-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                Cường độ tín hiệu (RSSI)
              </div>
              <div className="text-xs font-mono font-semibold text-foreground mt-1">
                {data.latestSample?.rssiDbm !== null && data.latestSample?.rssiDbm !== undefined
                  ? `${data.latestSample.rssiDbm} dBm`
                  : '—'}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                Chỉ số suy hao sóng LoRa
              </div>
            </div>

            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--panel-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                Tỷ số tín hiệu/nhiễu (SNR)
              </div>
              <div className="text-xs font-mono font-semibold text-foreground mt-1">
                {data.latestSample?.snrDb !== null && data.latestSample?.snrDb !== undefined
                  ? `${data.latestSample.snrDb} dB`
                  : '—'}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                Chất lượng đường truyền
              </div>
            </div>
          </div>

          {/* Caveat Banner (if present) */}
          {((data.provenance.caveats && data.provenance.caveats.length > 0) ||
            data.coverage.isTruncated ||
            data.coverage.reachedLimit ||
            data.coverage.invalidCount > 0) && (
            <div
              role="region"
              aria-label="Lưu ý chất lượng dữ liệu"
              className="p-3 rounded-lg border text-xs flex items-start gap-2.5"
              style={{
                backgroundColor: 'rgba(234, 179, 8, 0.08)',
                borderColor: 'rgba(234, 179, 8, 0.3)',
                color: 'var(--warning)',
              }}
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1 space-y-1">
                <div className="font-semibold">Lưu ý chất lượng dữ liệu:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {data.coverage.isTruncated && (
                    <li>Dữ liệu bị cắt ngắn từ nguồn upstream (truncated: true). Một số bản tin có thể chưa hiển thị đầy đủ.</li>
                  )}
                  {data.coverage.reachedLimit && (
                    <li>Đã đạt giới hạn tối đa 1.000 bản tin trong khoảng thời gian truy vấn.</li>
                  )}
                  {data.coverage.invalidCount > 0 && (
                    <li>Có {data.coverage.invalidCount} bản tin bị bỏ qua do lỗi cấu trúc hoặc định danh.</li>
                  )}
                  {data.provenance.caveats?.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Metric Selector Cards */}
          <IotTelemetryMetricSelector
            deviceType={data.deviceType}
            telemetry={data.telemetry}
            selectedMetric={selectedMetric}
            onSelectMetric={setSelectedMetric}
          />

          {/* Historical Trend Chart (MetricTrendChart / @ant-design/charts) */}
          <div className="w-full">
            <MetricTrendChart
              data={chartData.points}
              metricLabel={activeMetricMeta.label}
              unit={activeMetricMeta.unit}
              accessibleSummary={chartData.accessibleSummary}
              provenance={data.provenance}
              availability={data.availability}
              height={260}
            />
          </div>

          {/* Technical Details Disclosure */}
          <IotTelemetryTechnicalDetails
            deviceType={data.deviceType}
            latestReading={((data.telemetry as any)?.readings || [])[0] ?? null}
          />

          {/* Coverage Summary Footer */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t text-[11px] text-muted-foreground font-mono" style={{ borderColor: 'var(--border)' }}>
            <div>
              Tổng bản tin nhận:{' '}
              <span className="text-foreground font-semibold">{data.coverage.returnedCount}</span> (hợp lệ:{' '}
              <span className="text-emerald-400 font-semibold">{data.coverage.validCount}</span>
              {data.coverage.invalidCount > 0 ? (
                <>
                  , bỏ qua:{' '}
                  <span className="text-rose-400 font-semibold">{data.coverage.invalidCount}</span>
                </>
              ) : null}
              )
            </div>
            {data.coverage.earliestTimestamp && data.coverage.latestTimestamp && (
              <div>
                Bao phủ:{' '}
                <span className="text-foreground">{formatDate(data.coverage.earliestTimestamp)}</span> —{' '}
                <span className="text-foreground">{formatDate(data.coverage.latestTimestamp)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
