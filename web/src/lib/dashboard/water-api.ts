import {
  DashboardWaterMeterListResponse,
  DashboardWaterReadingsResponse,
} from '@/types/dashboard-water';

const BASE_URL = '/api/devices';

export interface FetchWaterMetersOptions {
  buildingId?: string;
  floorId?: string | null;
  signal?: AbortSignal;
}

export type FetchWaterMetersResult =
  | { success: true; data: DashboardWaterMeterListResponse }
  | {
      success: false;
      error: {
        message: string;
        isUnavailable: boolean;
        status?: number;
      };
    };

export interface FetchWaterReadingsOptions {
  deviceId: string;
  start: string;
  stop: string;
  signal?: AbortSignal;
}

export type FetchWaterReadingsResult =
  | { success: true; data: DashboardWaterReadingsResponse }
  | {
      success: false;
      error: {
        message: string;
        isUnavailable: boolean;
        status?: number;
      };
    };

function sanitizeErrorMessage(msg: unknown, fallback: string): string {
  if (typeof msg !== 'string' || !msg.trim()) return fallback;
  if (
    /bearer\s+/i.test(msg) ||
    /token/i.test(msg) ||
    /password/i.test(msg) ||
    /at\s+[a-zA-Z0-9._$<>]+\s+\(/i.test(msg) ||
    /https?:\/\//i.test(msg)
  ) {
    return fallback;
  }
  return msg.trim().slice(0, 200);
}

/**
 * Fetches the AVC Water Meter catalogue via same-origin Next.js application proxy.
 * Calls: /api/devices/dashboard/buildings/E/water/meters[?floorId=...]
 */
export async function fetchWaterMeters(
  options: FetchWaterMetersOptions = {},
): Promise<FetchWaterMetersResult> {
  const buildingId = (options.buildingId || 'E').trim().toUpperCase();
  const params = new URLSearchParams();

  if (options.floorId && options.floorId !== 'all') {
    params.set('floorId', options.floorId.trim());
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const url = `${BASE_URL}/dashboard/buildings/${encodeURIComponent(buildingId)}/water/meters${query}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: options.signal,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const rawMessage = errBody?.message;
      const status = res.status;
      const isUnavailable = status === 503;

      const defaultMessage = isUnavailable
        ? 'Dịch vụ đồng hồ nước AVC hiện chưa khả dụng hoặc đang tắt.'
        : status === 502
        ? 'Không thể kết nối đến nguồn dữ liệu IoT đồng hồ nước.'
        : status === 400
        ? 'Tham số tầng hoặc tòa nhà không hợp lệ.'
        : 'Đã xảy ra lỗi khi tải danh mục đồng hồ nước.';

      return {
        success: false,
        error: {
          message: sanitizeErrorMessage(rawMessage, defaultMessage),
          isUnavailable,
          status,
        },
      };
    }

    const data: DashboardWaterMeterListResponse = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    return {
      success: false,
      error: {
        message: 'Lỗi mạng: Không thể kết nối đến máy chủ ứng dụng.',
        isUnavailable: false,
      },
    };
  }
}

/**
 * Fetches selected AVC Water Meter readings via same-origin Next.js application proxy.
 * Calls: /api/devices/dashboard/buildings/E/water/meters/:deviceId/readings?start=...&stop=...&limit=1000
 */
export async function fetchWaterMeterReadings({
  deviceId,
  start,
  stop,
  signal,
}: FetchWaterReadingsOptions): Promise<FetchWaterReadingsResult> {
  const encodedId = encodeURIComponent(deviceId.trim());
  const params = new URLSearchParams({
    start,
    stop,
    limit: '1000',
  });

  const url = `${BASE_URL}/dashboard/buildings/E/water/meters/${encodedId}/readings?${params.toString()}`;

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
      const rawMessage = errBody?.message;
      const status = res.status;
      const isUnavailable = status === 503;

      const defaultMessage = isUnavailable
        ? 'Dịch vụ telemetry đồng hồ nước tạm thời không khả dụng.'
        : status === 404
        ? `Không tìm thấy đồng hồ nước ${deviceId} trên hệ thống.`
        : status === 400
        ? 'Thông số khoảng thời gian hoặc thiết bị không hợp lệ.'
        : status === 502
        ? 'Không thể nhận phản hồi hợp lệ từ nguồn dữ liệu IoT.'
        : `Lỗi tải dữ liệu đồng hồ nước (${status}).`;

      return {
        success: false,
        error: {
          message: sanitizeErrorMessage(rawMessage, defaultMessage),
          isUnavailable,
          status,
        },
      };
    }

    const data: DashboardWaterReadingsResponse = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    return {
      success: false,
      error: {
        message: 'Không thể tải dữ liệu đồng hồ nước do lỗi mạng.',
        isUnavailable: false,
      },
    };
  }
}
