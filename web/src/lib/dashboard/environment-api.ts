import {
  DashboardEnvironmentSourceListResponse,
  DashboardEnvironmentSummaryResponse,
  DashboardEnvironmentReadingsResponse,
} from '@/types/dashboard-environment';

const BASE_URL = '/api/devices';

export interface FetchEnvironmentSourcesOptions {
  buildingId?: string;
  floorId?: string | null;
  roomId?: string | null;
  signal?: AbortSignal;
}

export type FetchEnvironmentSourcesResult =
  | { success: true; data: DashboardEnvironmentSourceListResponse }
  | {
      success: false;
      error: {
        message: string;
        isUnavailable: boolean;
        status?: number;
      };
    };

export interface FetchEnvironmentSummaryOptions {
  buildingId?: string;
  start: string;
  stop: string;
  signal?: AbortSignal;
}

export type FetchEnvironmentSummaryResult =
  | { success: true; data: DashboardEnvironmentSummaryResponse }
  | {
      success: false;
      error: {
        message: string;
        isUnavailable: boolean;
        status?: number;
      };
    };

export interface FetchEnvironmentReadingsOptions {
  buildingId?: string;
  deviceId: string;
  start: string;
  stop: string;
  limit?: number;
  signal?: AbortSignal;
}

export type FetchEnvironmentReadingsResult =
  | { success: true; data: DashboardEnvironmentReadingsResponse }
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
 * Fetches Solar & SB environment sources list via same-origin Next.js proxy.
 * Calls: /api/devices/dashboard/buildings/E/environment/sources
 */
export async function fetchEnvironmentSources(
  options: FetchEnvironmentSourcesOptions = {},
): Promise<FetchEnvironmentSourcesResult> {
  const buildingId = (options.buildingId || 'E').trim().toUpperCase();
  const params = new URLSearchParams();

  if (options.floorId && options.floorId !== 'all') {
    params.set('floorId', options.floorId.trim());
  }
  if (options.roomId && options.roomId.trim()) {
    params.set('roomId', options.roomId.trim());
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const url = `${BASE_URL}/dashboard/buildings/${encodeURIComponent(buildingId)}/environment/sources${query}`;

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
        ? 'Dịch vụ danh mục nguồn môi trường hiện chưa khả dụng.'
        : status === 502
        ? 'Không thể kết nối đến nguồn dữ liệu IoT.'
        : status === 400
        ? 'Tham số tầng hoặc tòa nhà không hợp lệ.'
        : 'Đã xảy ra lỗi khi tải danh mục nguồn môi trường.';

      return {
        success: false,
        error: {
          message: sanitizeErrorMessage(rawMessage, defaultMessage),
          isUnavailable,
          status,
        },
      };
    }

    const data: DashboardEnvironmentSourceListResponse = await res.json();
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
 * Fetches bounded in-memory latest population summary over Solar candidate sources.
 * Calls: /api/devices/dashboard/buildings/E/environment/summary?start=...&stop=...
 */
export async function fetchEnvironmentSummary({
  buildingId = 'E',
  start,
  stop,
  signal,
}: FetchEnvironmentSummaryOptions): Promise<FetchEnvironmentSummaryResult> {
  const normalizedBuilding = buildingId.trim().toUpperCase();
  const params = new URLSearchParams({
    start,
    stop,
  });

  const url = `${BASE_URL}/dashboard/buildings/${encodeURIComponent(normalizedBuilding)}/environment/summary?${params.toString()}`;

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
        ? 'Dịch vụ tính toán tổng hợp môi trường hiện chưa khả dụng.'
        : status === 400
        ? 'Khoảng thời gian tổng hợp không hợp lệ (tối đa 24 giờ).'
        : status === 502
        ? 'Không thể nhận phản hồi hợp lệ từ nguồn dữ liệu IoT.'
        : `Lỗi tính toán tổng hợp môi trường (${status}).`;

      return {
        success: false,
        error: {
          message: sanitizeErrorMessage(rawMessage, defaultMessage),
          isUnavailable,
          status,
        },
      };
    }

    const data: DashboardEnvironmentSummaryResponse = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    return {
      success: false,
      error: {
        message: 'Không thể tải tổng hợp môi trường do lỗi mạng.',
        isUnavailable: false,
      },
    };
  }
}

/**
 * Fetches selected Solar source readings via same-origin Next.js application proxy.
 * Calls: /api/devices/dashboard/buildings/E/environment/sources/:deviceId/readings?start=...&stop=...&limit=1000
 */
export async function fetchEnvironmentReadings({
  buildingId = 'E',
  deviceId,
  start,
  stop,
  limit = 1000,
  signal,
}: FetchEnvironmentReadingsOptions): Promise<FetchEnvironmentReadingsResult> {
  const normalizedBuilding = buildingId.trim().toUpperCase();
  const encodedId = encodeURIComponent(deviceId.trim());
  const params = new URLSearchParams({
    start,
    stop,
    limit: String(limit),
  });

  const url = `${BASE_URL}/dashboard/buildings/${encodeURIComponent(normalizedBuilding)}/environment/sources/${encodedId}/readings?${params.toString()}`;

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
        ? 'Dịch vụ telemetry nguồn môi trường tạm thời không khả dụng.'
        : status === 404
        ? `Không tìm thấy thiết bị ${deviceId} trên hệ thống.`
        : status === 400
        ? 'Khoảng thời gian (tối đa 7 ngày) hoặc thiết bị không hợp lệ.'
        : status === 502
        ? 'Không thể nhận phản hồi hợp lệ từ nguồn dữ liệu IoT.'
        : `Lỗi tải dữ liệu đo đạc môi trường (${status}).`;

      return {
        success: false,
        error: {
          message: sanitizeErrorMessage(rawMessage, defaultMessage),
          isUnavailable,
          status,
        },
      };
    }

    const data: DashboardEnvironmentReadingsResponse = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    return {
      success: false,
      error: {
        message: 'Không thể tải dữ liệu môi trường do lỗi mạng.',
        isUnavailable: false,
      },
    };
  }
}
