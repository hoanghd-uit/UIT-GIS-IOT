/**
 * GIS-UIT Building E Digital Twin - Alert Evaluation Status API Client
 * Big Phase 02 / Phase 06 Baseline
 */

import { DashboardAlertEvaluationStatusResponse } from '@/types/dashboard-alerts';

const BASE_URL = '/api/devices';

export interface FetchAlertStatusOptions {
  buildingId?: string;
  signal?: AbortSignal;
}

export type FetchAlertStatusResult =
  | { success: true; data: DashboardAlertEvaluationStatusResponse }
  | {
      success: false;
      error: {
        message: string;
        isUnavailable: boolean;
        status?: number;
      };
    };

/**
 * Fetch alert evaluation status and blockers from NestJS backend via same-origin proxy.
 */
export async function fetchAlertEvaluationStatus(
  options?: FetchAlertStatusOptions,
): Promise<FetchAlertStatusResult> {
  const buildingId = options?.buildingId ?? 'E';
  const url = `${BASE_URL}/dashboard/buildings/${buildingId}/alerts/evaluation-status`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: options?.signal,
    });

    if (!res.ok) {
      const isUnavailable = res.status === 503 || res.status === 502;
      let errMsg = `Lỗi máy chủ (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson.message) {
          errMsg = errJson.message;
        }
      } catch {
        // use default error message
      }

      return {
        success: false,
        error: {
          message: errMsg,
          isUnavailable,
          status: res.status,
        },
      };
    }

    const data: DashboardAlertEvaluationStatusResponse = await res.json();
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
        message: (err as Error)?.message || 'Lỗi kết nối máy chủ',
        isUnavailable: true,
      },
    };
  }
}
