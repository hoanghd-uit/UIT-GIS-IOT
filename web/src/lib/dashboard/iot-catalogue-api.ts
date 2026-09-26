import { DashboardDeviceCatalogueResponse } from '@/types/dashboard-iot';

export interface FetchCatalogueOptions {
  buildingId?: string;
  floorId?: string | null;
  signal?: AbortSignal;
}

export interface CatalogueApiError {
  statusCode: number;
  errorCode: string;
  message: string;
  isUnavailable: boolean;
}

export type CatalogueApiResult =
  | { success: true; data: DashboardDeviceCatalogueResponse }
  | { success: false; error: CatalogueApiError };

function sanitizeMessage(msg: unknown, fallback: string): string {
  if (typeof msg !== 'string' || !msg.trim()) return fallback;
  // If dangerous internal details or tokens exist, use safe fallback
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
 * Fetches the Dashboard device catalogue via the same-origin Next.js application proxy.
 * Browser code never receives backend credentials, upstream hostnames, or arbitrary upstream paths.
 */
export async function fetchDashboardDeviceCatalogue(
  options: FetchCatalogueOptions = {},
): Promise<CatalogueApiResult> {
  const buildingId = (options.buildingId || 'E').trim().toUpperCase();
  const params = new URLSearchParams();

  if (options.floorId && options.floorId !== 'all') {
    params.set('floorId', options.floorId.trim());
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const url = `/api/devices/dashboard/buildings/${encodeURIComponent(buildingId)}/iot/devices${query}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: options.signal,
    });

    const status = response.status;

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {
        // Ignored, handled by status code fallback
      }

      const isUnavailable = status === 503;
      const rawMessage = errorData?.message;
      const defaultMessage = isUnavailable
        ? 'Dịch vụ danh mục thiết bị IoT hiện chưa khả dụng hoặc đang tắt.'
        : status === 502
        ? 'Không thể kết nối đến máy chủ IoT hoặc dữ liệu không hợp lệ.'
        : status === 400
        ? 'Tham số tầng hoặc tòa nhà không hợp lệ.'
        : 'Đã xảy ra lỗi khi tải danh mục thiết bị.';

      return {
        success: false,
        error: {
          statusCode: status,
          errorCode: errorData?.errorCode || (isUnavailable ? 'SERVICE_UNAVAILABLE' : 'API_ERROR'),
          message: sanitizeMessage(rawMessage, defaultMessage),
          isUnavailable,
        },
      };
    }

    const data = (await response.json()) as DashboardDeviceCatalogueResponse;
    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    return {
      success: false,
      error: {
        statusCode: 0,
        errorCode: 'NETWORK_ERROR',
        message: 'Lỗi mạng: Không thể kết nối đến máy chủ ứng dụng.',
        isUnavailable: false,
      },
    };
  }
}
