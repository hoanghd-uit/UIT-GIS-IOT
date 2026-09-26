import { DashboardDeviceTelemetryResponse } from '@/types/dashboard-iot-telemetry';

const BASE_URL = '/api/devices';

export interface FetchDashboardTelemetryOptions {
  deviceId: string;
  start: string;
  stop: string;
  signal?: AbortSignal;
}

export type FetchDashboardTelemetryResult =
  | { success: true; data: DashboardDeviceTelemetryResponse }
  | {
      success: false;
      error: {
        message: string;
        isUnavailable: boolean;
        status?: number;
      };
    };

/**
 * Fetches Dashboard device telemetry through the Next.js same-origin application proxy.
 * Calls: /api/devices/dashboard/buildings/E/iot/devices/:deviceId/telemetry?start=...&stop=...&limit=1000
 * Strictly read-only, cache: 'no-store'. No direct external IoT backend calls.
 */
export async function fetchDashboardDeviceTelemetry({
  deviceId,
  start,
  stop,
  signal,
}: FetchDashboardTelemetryOptions): Promise<FetchDashboardTelemetryResult> {
  const encodedId = encodeURIComponent(deviceId.trim());
  const params = new URLSearchParams({
    start,
    stop,
    limit: '1000',
  });

  const url = `${BASE_URL}/dashboard/buildings/E/iot/devices/${encodedId}/telemetry?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const rawMessage = errBody?.message || '';
      const status = res.status;

      // Handle unavailable cases (503, disabled, fixture mode)
      if (status === 503) {
        return {
          success: false,
          error: {
            message:
              rawMessage ||
              'Dịch vụ telemetry tạm thời không khả dụng do cấu hình máy chủ hoặc chế độ nguồn dữ liệu.',
            isUnavailable: true,
            status,
          },
        };
      }

      // 400 Bad Request
      if (status === 400) {
        return {
          success: false,
          error: {
            message: rawMessage || 'Thông số truy vấn khoảng thời gian telemetry chưa hợp lệ.',
            isUnavailable: false,
            status,
          },
        };
      }

      // 404 Not Found
      if (status === 404) {
        return {
          success: false,
          error: {
            message: `Không tìm thấy thiết bị ${deviceId} trên hệ thống dữ liệu.`,
            isUnavailable: false,
            status,
          },
        };
      }

      // 502 Bad Gateway / upstream error
      if (status === 502) {
        return {
          success: false,
          error: {
            message:
              rawMessage ||
              'Không thể kết nối hoặc nhận phản hồi hợp lệ từ nguồn dữ liệu IoT upstream.',
            isUnavailable: false,
            status,
          },
        };
      }

      return {
        success: false,
        error: {
          message: rawMessage || `Lỗi tải telemetry thiết bị (${status}). Vui lòng thử lại.`,
          isUnavailable: false,
          status,
        },
      };
    }

    const data: DashboardDeviceTelemetryResponse = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }

    return {
      success: false,
      error: {
        message: 'Không thể tải dữ liệu telemetry do lỗi kết nối mạng.',
        isUnavailable: false,
      },
    };
  }
}
