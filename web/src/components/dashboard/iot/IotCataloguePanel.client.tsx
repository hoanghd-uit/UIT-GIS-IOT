'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DashboardDeviceCatalogueResponse } from '@/types/dashboard-iot';
import { fetchDashboardDeviceCatalogue } from '@/lib/dashboard/iot-catalogue-api';
import { KpiMetadataCard } from '@/components/dashboard/cards/KpiMetadataCard';
import { DashboardSection } from '@/components/dashboard/layout/DashboardSection';
import { LoadingState } from '@/components/dashboard/states/LoadingState';
import { EmptyDataState } from '@/components/dashboard/states/EmptyDataState';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';
import { ErrorState } from '@/components/dashboard/states/ErrorState';
import { IotCatalogueFilters } from './IotCatalogueFilters';
import { IotDeviceCatalogueTable } from './IotDeviceCatalogueTable';

type PanelStatus = 'loading' | 'ready' | 'empty' | 'unavailable' | 'error';

export function IotCataloguePanel() {
  const [status, setStatus] = useState<PanelStatus>('loading');
  const [data, setData] = useState<DashboardDeviceCatalogueResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const requestGenRef = useRef(0);

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
        return;
      }

      const resData = result.data;
      setData(resData);

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

  const hasCaveats = (data?.provenance.caveats && data.provenance.caveats.length > 0) || data?.summary.truncated;

  return (
    <>
      {/* KPI Overview Section */}
      <DashboardSection
        title="Tổng quan thiết bị IoT"
        description="Số lượng thiết bị trong danh mục và trạng thái kết nối mạng của toàn tòa nhà"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetadataCard
            title="Tổng số thiết bị"
            value={status === 'ready' ? data?.summary.acceptedCount : status === 'empty' ? 0 : null}
            unit="thiết bị"
            provenance={status === 'ready' || status === 'empty' ? data?.provenance : undefined}
            availability={
              status === 'loading'
                ? 'unavailable'
                : status === 'ready'
                ? 'ready'
                : status === 'empty'
                ? 'empty'
                : status === 'unavailable'
                ? 'unavailable'
                : 'error'
            }
            subtitle={
              status === 'loading'
                ? 'Đang nạp danh mục...'
                : selectedFloor === 'all'
                ? 'Danh mục toàn tòa nhà'
                : `Danh mục Tầng ${selectedFloor}`
            }
          />
          <KpiMetadataCard
            title="Đang hoạt động (Online)"
            availability="unavailable"
            subtitle="Chờ tích hợp telemetry (Phase 03)"
          />
          <KpiMetadataCard
            title="Mất kết nối (Offline)"
            availability="unavailable"
            subtitle="Chờ tích hợp telemetry (Phase 03)"
          />
          <KpiMetadataCard
            title="Tỷ lệ trực tuyến"
            availability="unavailable"
            subtitle="Chờ tích hợp telemetry (Phase 03)"
          />
        </div>
      </DashboardSection>

      {/* Catalogue & Health Section */}
      <DashboardSection
        title="Danh mục thiết bị và giám sát sức khỏe"
        description="Bảng thông số chi tiết trạng thái danh mục, vị trí và metadata từng thiết bị"
      >
        {/* Floor selection & filters always rendered when not completely unavailable */}
        {status !== 'unavailable' && (
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
          />
        )}

        {/* Caveat Banner */}
        {hasCaveats && status === 'ready' && (
          <div
            role="region"
            aria-label="Lưu ý chất lượng dữ liệu"
            className="p-3 mb-4 rounded-lg border text-xs flex items-start gap-2.5"
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

        {/* Dynamic State Rendering */}
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
                className="p-8 text-center rounded-lg border text-xs"
                style={{
                  backgroundColor: 'var(--panel-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <div className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  Không tìm thấy thiết bị phù hợp
                </div>
                <p className="mb-3">
                  Không có thiết bị nào khớp với từ khóa tìm kiếm &quot;{searchQuery}&quot;
                  {selectedType !== 'all' ? ` và loại &quot;${selectedType}&quot;` : ''}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                  }}
                  className="px-3 py-1.5 rounded font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--panel-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              </div>
            ) : (
              <IotDeviceCatalogueTable devices={filteredDevices} />
            )}
          </>
        )}
      </DashboardSection>
    </>
  );
}
