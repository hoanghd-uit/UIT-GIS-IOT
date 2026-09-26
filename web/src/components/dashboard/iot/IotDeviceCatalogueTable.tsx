'use client';

import React from 'react';
import { DashboardDeviceCatalogueItem } from '@/types/dashboard-iot';

export interface IotDeviceCatalogueTableProps {
  devices: DashboardDeviceCatalogueItem[];
}

function formatDate(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function IotDeviceCatalogueTable({ devices }: IotDeviceCatalogueTableProps) {
  return (
    <div
      className="w-full overflow-x-auto rounded-lg border"
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr
            className="border-b"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <th scope="col" className="py-3 px-3.5 font-semibold" style={{ color: 'var(--text-muted)' }}>
              Mã thiết bị (Device ID)
            </th>
            <th scope="col" className="py-3 px-3 font-semibold" style={{ color: 'var(--text-muted)' }}>
              Loại & Phân nhóm
            </th>
            <th scope="col" className="py-3 px-3 font-semibold" style={{ color: 'var(--text-muted)' }}>
              Trạng thái danh mục
            </th>
            <th scope="col" className="py-3 px-3 font-semibold text-center" style={{ color: 'var(--text-muted)' }}>
              Tầng nguồn
            </th>
            <th scope="col" className="py-3 px-3 font-semibold" style={{ color: 'var(--text-muted)' }}>
              Gán tầng hiển thị
            </th>
            <th scope="col" className="py-3 px-3 font-semibold" style={{ color: 'var(--text-muted)' }}>
              Tọa độ nguồn (X, Y, Z)
            </th>
            <th scope="col" className="py-3 px-3 font-semibold" style={{ color: 'var(--text-muted)' }}>
              Ngày tạo nguồn
            </th>
            <th scope="col" className="py-3 px-3.5 font-semibold" style={{ color: 'var(--text-muted)' }}>
              Cập nhật metadata nguồn
            </th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: 'rgba(78, 163, 225, 0.1)' }}>
          {devices.map((device) => {
            const isFallback = device.floorAssignment === 'development-fallback';
            const isUnmapped = device.floorAssignment === 'unmapped';

            return (
              <tr
                key={device.externalDeviceId}
                className="hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              >
                {/* Device ID */}
                <td className="py-2.5 px-3.5">
                  <div className="font-mono text-xs font-medium break-all max-w-[200px]" style={{ color: 'var(--text-primary)' }} title={device.externalDeviceId}>
                    {device.externalDeviceId}
                  </div>
                </td>

                {/* Device Type & Category */}
                <td className="py-2.5 px-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {device.sourceDeviceType}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color: 'var(--text-muted)' }}>
                      {device.category}
                    </span>
                  </div>
                </td>

                {/* Catalogue Activity (Strictly NOT Online/Offline) */}
                <td className="py-2.5 px-3">
                  {device.active ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{
                        backgroundColor: 'rgba(52, 211, 153, 0.12)',
                        color: 'var(--success)',
                        border: '1px solid rgba(52, 211, 153, 0.25)',
                      }}
                      title="Thiết bị được ghi nhận đang hoạt động trong danh mục IoT. Không phản ánh tình trạng kết nối mạng thời gian thực."
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
                      Đang hoạt động trong danh mục
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                      title="Thiết bị ngừng hoạt động trong danh mục IoT."
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
                      Ngừng hoạt động trong danh mục
                    </span>
                  )}
                </td>

                {/* Source Floor Level */}
                <td className="py-2.5 px-3 text-center">
                  <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-[rgba(255,255,255,0.04)]" style={{ color: 'var(--text-primary)' }}>
                    {device.sourceLocation.floorLevel}
                  </span>
                </td>

                {/* Display Floor & Assignment Provenance */}
                <td className="py-2.5 px-3">
                  {isFallback ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        Tầng {device.displayFloorId}
                      </span>
                      <span
                        className="inline-block text-[10px] px-1.5 py-0.2 rounded font-medium w-fit"
                        style={{
                          backgroundColor: 'rgba(234, 179, 8, 0.12)',
                          color: 'var(--warning)',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                        }}
                        title="Dữ liệu từ tầng 0 upstream được áp dụng tạm thời cho tầng hiển thị trong kịch bản phát triển."
                      >
                        Fallback tầng 0
                      </span>
                    </div>
                  ) : isUnmapped ? (
                    <span className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                      Chưa ánh xạ
                    </span>
                  ) : (
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Tầng {device.displayFloorId}
                    </span>
                  )}
                </td>

                {/* Coordinates X, Y, Z */}
                <td className="py-2.5 px-3">
                  <div className="font-mono text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    X: <span style={{ color: 'var(--text-primary)' }}>{device.sourceLocation.x}</span>,{' '}
                    Y: <span style={{ color: 'var(--text-primary)' }}>{device.sourceLocation.y}</span>,{' '}
                    Z: <span style={{ color: 'var(--text-primary)' }}>{device.sourceLocation.z}</span>
                  </div>
                </td>

                {/* Source Created Timestamp */}
                <td className="py-2.5 px-3">
                  <span className="text-[11px] whitespace-nowrap font-mono" style={{ color: 'var(--text-muted)' }} title={device.sourceCreatedAt}>
                    {formatDate(device.sourceCreatedAt)}
                  </span>
                </td>

                {/* Source Metadata Updated Timestamp */}
                <td className="py-2.5 px-3.5">
                  <span className="text-[11px] whitespace-nowrap font-mono" style={{ color: 'var(--text-muted)' }} title={device.sourceUpdatedAt}>
                    {formatDate(device.sourceUpdatedAt)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
