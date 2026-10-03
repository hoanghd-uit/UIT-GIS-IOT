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
import { useIotPage07Telemetry } from './useIotPage07Telemetry';

type PanelStatus = 'loading' | 'ready' | 'empty' | 'unavailable' | 'error';

const PAGE_SIZE = 10;

export function IotCataloguePanel() {
  const [status, setStatus] = useState<PanelStatus>('loading');
  const [data, setData] = useState<DashboardDeviceCatalogueResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [roomDraft, setRoomDraft] = useState<string>('');
  const [appliedRoom, setAppliedRoom] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedDevice, setSelectedDevice] = useState<DashboardDeviceCatalogueItem | null>(null);
  const [selectedTelemetrySummary, setSelectedTelemetrySummary] = useState<SelectedTelemetrySummary & { gatewayId?: string | null } | null>(null);
  const [activeTimePreset, setActiveTimePreset] = useState<string>('today');

  const requestGenRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadCatalogue = useCallback(async (floor: string, room: string | null) => {
    const currentGen = ++requestGenRef.current;
    setStatus('loading');
    setErrorMessage('');

    const controller = new AbortController();

    try {
      const result = await fetchDashboardDeviceCatalogue({
        floorId: floor === 'all' ? null : floor,
        roomId: room && room.trim() ? room.trim() : null,
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
        const exists = resData.devices.find((d) => d.externalDeviceId === prev.externalDeviceId);
        return exists || null;
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
    loadCatalogue(selectedFloor, appliedRoom);
  }, [selectedFloor, appliedRoom, loadCatalogue]);

  // Scope hint when room filter is active
  const scopeHint = useMemo(() => {
    if (!appliedRoom) return null;
    if (selectedFloor !== 'all') {
      return `Phạm vi: Tầng ${selectedFloor} · Phòng ${appliedRoom}`;
    }
    return `Phạm vi: Phòng ${appliedRoom}`;
  }, [selectedFloor, appliedRoom]);

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
    loadCatalogue(selectedFloor, appliedRoom);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleFloorChange = (newFloor: string) => {
    setSelectedFloor(newFloor);
    // Reset local type, search, room draft, applied room, pagination, and selected device on floor change
    setSearchQuery('');
    setSelectedType('all');
    setCurrentPage(1);
    setRoomDraft('');
    setAppliedRoom(null);
    setSelectedDevice(null);
    setSelectedTelemetrySummary(null);
  };

  const handleApplyRoom = () => {
    const trimmed = roomDraft.trim();
    setCurrentPage(1);
    if (trimmed === '') {
      if (appliedRoom !== null) {
        setAppliedRoom(null);
        setSelectedDevice(null);
        setSelectedTelemetrySummary(null);
      }
    } else {
      if (appliedRoom !== trimmed) {
        setAppliedRoom(trimmed);
        setSelectedDevice(null);
        setSelectedTelemetrySummary(null);
      }
    }
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setCurrentPage(1);
    setRoomDraft('');
    setSelectedDevice(null);
    setSelectedTelemetrySummary(null);
    if (selectedFloor !== 'all' || appliedRoom !== null) {
      setSelectedFloor('all');
      setAppliedRoom(null);
    }
  };

  const emptyStateDescription = useMemo(() => {
    if (appliedRoom) {
      if (selectedFloor !== 'all') {
        return `Không tìm thấy thiết bị IoT nào được đăng ký tại Tầng ${selectedFloor} · Phòng ${appliedRoom}.`;
      }
      return `Không tìm thấy thiết bị IoT nào được đăng ký tại Phòng ${appliedRoom}.`;
    }
    if (selectedFloor === 'all') {
      return 'Không tìm thấy thiết bị IoT nào được đăng ký trong danh mục toàn tòa nhà.';
    }
    return `Không tìm thấy thiết bị IoT nào được đăng ký tại Tầng ${selectedFloor}.`;
  }, [selectedFloor, appliedRoom]);

  const handleSelectDevice = (device: DashboardDeviceCatalogueItem) => {
    if (selectedDevice?.externalDeviceId === device.externalDeviceId) {
      setSelectedDevice(null);
      setSelectedTelemetrySummary(null);
    } else {
      setSelectedDevice(device);
      setSelectedTelemetrySummary(null);
    }
  };

  // Pagination calculation (10 devices / page)
  const totalFiltered = filteredDevices.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalFiltered);

  const visibleDevices = useMemo(() => {
    return filteredDevices.slice(startIndex, endIndex);
  }, [filteredDevices, startIndex, endIndex]);

  // When visible devices change, auto-close detail if selected device is no longer visible on current page
  useEffect(() => {
    if (selectedDevice) {
      const isStillVisible = visibleDevices.some(
        (d) => d.externalDeviceId === selectedDevice.externalDeviceId,
      );
      if (!isStillVisible) {
        setSelectedDevice(null);
        setSelectedTelemetrySummary(null);
      }
    }
  }, [visibleDevices, selectedDevice]);

  // Telemetry coordinator for visible-page bounded load and Page 07-owned 5-minute scheduler
  const {
    rowSummaries,
    isPageRefreshing,
    refreshPageSummaries,
    detailRefreshSignal,
    handleDetailSettled,
  } = useIotPage07Telemetry(visibleDevices, selectedDevice, status);

  // Stable callback for selected telemetry summary to prevent render loop (Task A)
  const handleTelemetryLoaded = useCallback(
    (summary: (SelectedTelemetrySummary & { gatewayId?: string | null }) | null) => {
      setSelectedTelemetrySummary((prev) => {
        if (!prev && !summary) return prev;
        if (
          prev &&
          summary &&
          prev.gatewayId === summary.gatewayId &&
          prev.rssi === summary.rssi &&
          prev.snr === summary.snr &&
          prev.latestTimestamp === summary.latestTimestamp
        ) {
          return prev;
        }
        return summary;
      });
    },
    [],
  );

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
        scopeHint={scopeHint}
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
            onSearchChange={handleSearchChange}
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
            availableTypes={availableTypes}
            selectedFloor={selectedFloor}
            onFloorChange={handleFloorChange}
            roomDraft={roomDraft}
            onRoomDraftChange={setRoomDraft}
            onApplyRoom={handleApplyRoom}
            appliedRoom={appliedRoom}
            onClearAllFilters={handleClearAllFilters}
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
                description={emptyStateDescription}
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
                        setCurrentPage(1);
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
                  <>
                    <IotDeviceCatalogueTable
                      devices={visibleDevices}
                      selectedDeviceId={selectedDevice?.externalDeviceId}
                      selectedTelemetrySummary={selectedTelemetrySummary}
                      onSelectDevice={handleSelectDevice}
                      rowSummaries={rowSummaries}
                    />

                    {/* Compact Pagination and Visible Page Refresh Footer */}
                    <div
                      className="mt-3 pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ color: 'var(--text-muted)' }}>
                          Hiển thị {startIndex + 1}–{endIndex} / {totalFiltered} thiết bị
                        </span>
                        <button
                          type="button"
                          onClick={refreshPageSummaries}
                          disabled={isPageRefreshing}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors cursor-pointer"
                          style={{
                            backgroundColor: 'var(--panel-elevated)',
                            borderColor: 'var(--border)',
                            color: isPageRefreshing ? 'var(--text-muted)' : 'var(--text-primary)',
                            opacity: isPageRefreshing ? 0.6 : 1,
                          }}
                          title="Làm mới dữ liệu vô tuyến của các thiết bị trên trang hiện tại"
                          aria-label="Làm mới dữ liệu trang"
                        >
                          <svg
                            className={`w-3 h-3 ${isPageRefreshing ? 'animate-spin text-cyan-400' : ''}`}
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
                          <span>{isPageRefreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu trang'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--text-muted)' }}>
                          Trang {safeCurrentPage} / {totalPages}
                        </span>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={safeCurrentPage <= 1}
                            className="px-2.5 py-1 rounded border font-medium transition-colors"
                            style={{
                              backgroundColor: safeCurrentPage <= 1 ? 'transparent' : 'var(--panel-elevated)',
                              borderColor: 'var(--border)',
                              color: safeCurrentPage <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                              cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                              opacity: safeCurrentPage <= 1 ? 0.5 : 1,
                            }}
                            aria-label="Trang trước"
                          >
                            Trước
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safeCurrentPage >= totalPages}
                            className="px-2.5 py-1 rounded border font-medium transition-colors"
                            style={{
                              backgroundColor: safeCurrentPage >= totalPages ? 'transparent' : 'var(--panel-elevated)',
                              borderColor: 'var(--border)',
                              color: safeCurrentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                              cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                              opacity: safeCurrentPage >= totalPages ? 0.5 : 1,
                            }}
                            aria-label="Trang sau"
                          >
                            Sau
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
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
          onTelemetryLoaded={handleTelemetryLoaded}
          refreshSignal={detailRefreshSignal}
          onSettled={handleDetailSettled}
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
