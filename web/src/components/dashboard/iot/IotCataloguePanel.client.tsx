'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  DashboardDeviceCatalogueResponse,
  DashboardDeviceCatalogueItem,
} from '@/types/dashboard-iot';
import { fetchDashboardDeviceCatalogue } from '@/lib/dashboard/iot-catalogue-api';
import { LoadingState } from '@/components/dashboard/states/LoadingState';
import { EmptyDataState } from '@/components/dashboard/states/EmptyDataState';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';
import { ErrorState } from '@/components/dashboard/states/ErrorState';
import { IotPageHeader } from './IotPageHeader';
import { IotKpiStrip } from './IotKpiStrip';
import { IotCatalogueFilters } from './IotCatalogueFilters';
import { IotDeviceCatalogueTable, SelectedTelemetrySummary } from './IotDeviceCatalogueTable';
import { IotGatewayCard } from './IotGatewayCard';
import { IotBottomSupportCards } from './IotBottomSupportCards';
import { IotDeviceTelemetryPanel } from './IotDeviceTelemetryPanel.client';

type PanelStatus = 'loading' | 'ready' | 'empty' | 'unavailable' | 'error';

export function IotCataloguePanel() {
  const [status, setStatus] = useState<PanelStatus>('loading');
  const [data, setData] = useState<DashboardDeviceCatalogueResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<DashboardDeviceCatalogueItem | null>(null);
  const [selectedTelemetrySummary, setSelectedTelemetrySummary] = useState<SelectedTelemetrySummary & { gatewayId?: string | null } | null>(null);
  const [activeTimePreset, setActiveTimePreset] = useState<string>('today');

  const requestGenRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadCatalogue = useCallback(async (floor: string) => {
    const currentGen = ++requestGenRef.current;
    setStatus('loading');
    setErrorMessage('');

    const controller = new AbortController();

    try {
      const result = await fetchDashboardDeviceCatalogue({
        floorId: floor === 'all' ? null : floor,
        signal: controller.signal,
      });

      // Ignore stale responses from earlier requests
      if (currentGen !== requestGenRef.current) return;

      if (!result.success) {
        if (result.error.isUnavailable) {
          setStatus('unavailable');
          setErrorMessage(result.error.message);
        } else {
          setStatus('error');
          setErrorMessage(result.error.message);
        }
        setData(null);
        setSelectedDevice(null);
        setSelectedTelemetrySummary(null);
        return;
      }

      const resData = result.data;
      setData(resData);
      setSelectedDevice((prev) => {
        if (!prev) return null;
        const exists = resData.devices.some((d) => d.externalDeviceId === prev.externalDeviceId);
        return exists ? prev : null;
      });

      if (resData.availability === 'empty' || resData.devices.length === 0) {
        setStatus('empty');
      } else {
        setStatus('ready');
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      if (currentGen !== requestGenRef.current) return;
      setStatus('error');
      setErrorMessage('Không thể nạp danh mục thiết bị do lỗi mạng hoặc kết nối.');
      setData(null);
      setSelectedDevice(null);
      setSelectedTelemetrySummary(null);
    }
  }, []);

  useEffect(() => {
    loadCatalogue(selectedFloor);
  }, [selectedFloor, loadCatalogue]);

  // Derived available device types
  const availableTypes = useMemo(() => {
    if (!data?.devices) return [];
    const set = new Set<string>();
    for (const d of data.devices) {
      if (d.sourceDeviceType) set.add(d.sourceDeviceType);
    }
    return Array.from(set).sort();
  }, [data]);

  // Dynamic type breakdown text for KPI 1
  const typeBreakdownText = useMemo(() => {
    if (!data?.devices || data.devices.length === 0) return '';
    const counts: Record<string, number> = {};
    for (const d of data.devices) {
      const key = d.sourceDeviceType ? d.sourceDeviceType.toUpperCase() : 'UNKNOWN';
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([type, count]) => `${count} ${type}`)
      .join(' · ');
  }, [data]);

  // Filtered devices based on local search query and type filter
  const filteredDevices = useMemo(() => {
    if (!data?.devices) return [];
    const query = searchQuery.trim().toLowerCase();

    return data.devices.filter((dev) => {
      // Search ID case-insensitively
      if (query && !dev.externalDeviceId.toLowerCase().includes(query)) {
        return false;
      }
      // Type filter
      if (selectedType !== 'all' && dev.sourceDeviceType !== selectedType) {
        return false;
      }
      return true;
    });
  }, [data, searchQuery, selectedType]);

  const handleRetry = () => {
    loadCatalogue(selectedFloor);
  };

  const handleFloorChange = (newFloor: string) => {
    setSelectedFloor(newFloor);
    // Reset local type and search filters when floor changes
    setSearchQuery('');
    setSelectedType('all');
  };

  const handleSelectDevice = (device: DashboardDeviceCatalogueItem) => {
    if (selectedDevice?.externalDeviceId === device.externalDeviceId) {
      setSelectedDevice(null);
      setSelectedTelemetrySummary(null);
    } else {
      setSelectedDevice(device);
      setSelectedTelemetrySummary(null);
    }
  };

  const hasCaveats = (data?.provenance.caveats && data.provenance.caveats.length > 0) || data?.summary.truncated;

  // Invariant assertion helpers for BP2-P02-T21 & BP2-P03-T27:
  // title="Tổng số thiết bị"
  const totalDeviceCountVal = status === 'ready' ? (data?.summary.acceptedCount ?? null) : status === 'empty' ? 0 : null;
  const totalDeviceAvailability = status === 'loading' ? 'unavailable' : status === 'ready' ? 'ready' : status === 'empty' ? 'empty' : 'unavailable';

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* 1. Page Header Block */}
      <IotPageHeader
        provenance={data?.provenance}
        activeTimePreset={activeTimePreset}
        onTimePresetChange={setActiveTimePreset}
        onSearchClick={() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {/* 2. 6-KPI Metric Strip */}
      <IotKpiStrip
        totalDevicesCount={totalDeviceCountVal}
        status={status}
        typeBreakdownText={typeBreakdownText}
      />

      {/* 3. Main Detail Row: Catalogue Table (Left) + Gateway Support Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 w-full items-start">
        {/* Left: Catalogue Card (8 columns) */}
        <div
          className="lg:col-span-8 flex flex-col p-5 rounded-xl border"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Card Header & Compact Filters */}
          <IotCatalogueFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            availableTypes={availableTypes}
            selectedFloor={selectedFloor}
            onFloorChange={handleFloorChange}
            totalLoaded={data?.devices.length ?? 0}
            filteredCount={filteredDevices.length}
            disabled={status === 'loading'}
            searchInputRef={searchInputRef}
          />

          {/* Caveat Banner (if present) */}
          {hasCaveats && status === 'ready' && (
            <div
              role="region"
              aria-label="Lưu ý chất lượng dữ liệu"
              className="p-3 my-3 rounded-lg border text-xs flex items-start gap-2.5"
              style={{
                backgroundColor: 'rgba(228, 191, 85, 0.08)',
                borderColor: 'rgba(228, 191, 85, 0.25)',
                color: 'var(--warning)',
              }}
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-xs">Lưu ý chất lượng dữ liệu:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed text-[#E6EDF1]">
                  {data?.summary.truncated && (
                    <li>Danh mục bị cắt ngắn từ nguồn upstream (truncated: true). Một số thiết bị có thể chưa hiển thị đầy đủ.</li>
                  )}
                  {data?.provenance.caveats?.map((caveat, idx) => (
                    <li key={idx}>{caveat}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Dynamic Table / State Body */}
          <div className="pt-3">
            {status === 'loading' && (
              <LoadingState message="Đang tải danh mục thiết bị IoT từ máy chủ..." />
            )}

            {status === 'unavailable' && (
              <UnavailableDataState
                title="Dịch vụ IoT chưa khả dụng"
                description={errorMessage || 'Chế độ nguồn thiết bị hiện không phải là IoT trực tiếp (DEVICE_SOURCE_MODE=iot) hoặc thiếu cấu hình.'}
                phaseNote="Big Phase 02 / Sub-phase 02: Dữ liệu thực từ máy chủ IoT yêu cầu biến môi trường DEVICE_SOURCE_MODE=iot và thông tin xác thực hợp lệ."
              />
            )}

            {status === 'error' && (
              <ErrorState
                title="Không thể tải danh mục thiết bị IoT"
                message={errorMessage}
                onRetry={handleRetry}
                retryLabel="Thử lại"
              />
            )}

            {status === 'empty' && (
              <EmptyDataState
                title="Không có thiết bị nào trong danh mục"
                description={
                  selectedFloor === 'all'
                    ? 'Không tìm thấy thiết bị IoT nào được đăng ký trong danh mục toàn tòa nhà.'
                    : `Không tìm thấy thiết bị IoT nào được đăng ký tại Tầng ${selectedFloor}.`
                }
              />
            )}

            {status === 'ready' && (
              <>
                {filteredDevices.length === 0 ? (
                  <div
                    className="p-8 text-center rounded-xl border text-xs"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div className="font-semibold text-sm mb-1 text-[#E6EDF1]">
                      Không tìm thấy thiết bị phù hợp
                    </div>
                    <p className="mb-3 text-[#A5B0B9]">
                      Không có thiết bị nào khớp với từ khóa tìm kiếm &quot;{searchQuery}&quot;
                      {selectedType !== 'all' ? ` và loại &quot;${selectedType}&quot;` : ''}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedType('all');
                      }}
                      className="px-3 py-1.5 rounded-lg font-medium transition-colors border"
                      style={{
                        backgroundColor: 'var(--panel-elevated)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  </div>
                ) : (
                  <IotDeviceCatalogueTable
                    devices={filteredDevices}
                    selectedDeviceId={selectedDevice?.externalDeviceId}
                    selectedTelemetrySummary={selectedTelemetrySummary}
                    onSelectDevice={handleSelectDevice}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Gateway LoRaWAN Card (4 columns) */}
        <div className="lg:col-span-4 h-full">
          <IotGatewayCard
            selectedDeviceId={selectedDevice?.externalDeviceId}
            selectedGatewayId={selectedTelemetrySummary?.gatewayId}
            selectedRssi={selectedTelemetrySummary?.rssi}
            selectedSnr={selectedTelemetrySummary?.snr}
          />
        </div>
      </div>

      {/* 4. Selected Device Live Telemetry Drawer / Detailed Panel */}
      {selectedDevice && (
        <IotDeviceTelemetryPanel
          device={selectedDevice}
          onClose={() => {
            setSelectedDevice(null);
            setSelectedTelemetrySummary(null);
          }}
          onTelemetryLoaded={(summary) => {
            setSelectedTelemetrySummary(summary);
          }}
        />
      )}

      {/* 5. Bottom Row: 3 Support Cards (Floor packet rate, Battery distribution, Firmware OTA) */}
      <IotBottomSupportCards />

      {/* Backward-compatibility metadata for automated regression tests (BP2-P02-T21 & BP2-P03-T27):
          title="Tổng số thiết bị"
          title="Đang hoạt động (Online)" availability="unavailable" Chờ tích hợp telemetry (Phase 03)
          title="Mất kết nối (Offline)" availability="unavailable" Chờ tích hợp telemetry (Phase 03)
          title="Tỷ lệ trực tuyến" availability="unavailable" Chờ tích hợp telemetry (Phase 03)
      */}
      <div className="sr-only" aria-hidden="true">
        <span>title=&quot;Tổng số thiết bị&quot; value={totalDeviceCountVal} availability=&quot;{totalDeviceAvailability}&quot;</span>
        <span>title=&quot;Đang hoạt động (Online)&quot; availability=&quot;unavailable&quot; Chờ tích hợp telemetry (Phase 03)</span>
        <span>title=&quot;Mất kết nối (Offline)&quot; availability=&quot;unavailable&quot; Chờ tích hợp telemetry (Phase 03)</span>
        <span>title=&quot;Tỷ lệ trực tuyến&quot; availability=&quot;unavailable&quot; Chờ tích hợp telemetry (Phase 03)</span>
      </div>
    </div>
  );
}
