import { FloorDeviceResponse } from '@/types/iot-devices';
import { DeviceTelemetryResponseDto } from '@/types/iot-telemetry';

const BASE_URL = '/api/devices';

/**
 * Fetches IoT device list for the requested floor from NestJS via Next.js proxy.
 * Fresh fetch every floor load; cache: 'no-store'.
 */
export async function fetchFloorIotDevices(
  buildingId: string,
  floorId: string,
  signal?: AbortSignal,
): Promise<FloorDeviceResponse> {
  const url = `${BASE_URL}/iot/buildings/${buildingId}/floors/${floorId}/devices`;

  const res = await fetch(url, {
    cache: 'no-store',
    signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const message = errBody.message || `Lỗi tải danh sách thiết bị IoT (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

/**
 * Fetches telemetry readings/events for one IoT device within the rolling 72-hour window.
 * Always fresh fetch: cache: 'no-store'. Zero persistent storage.
 */
export async function fetchDeviceTelemetry(
  deviceId: string,
  query: {
    start: string;
    stop: string;
    limit?: number;
  },
  signal?: AbortSignal,
): Promise<DeviceTelemetryResponseDto> {
  const params = new URLSearchParams({
    start: query.start,
    stop: query.stop,
  });
  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }

  const encodedId = encodeURIComponent(deviceId);
  const url = `${BASE_URL}/iot/devices/${encodedId}/telemetry?${params.toString()}`;

  const res = await fetch(url, {
    cache: 'no-store',
    signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const message = errBody.message || `Lỗi tải dữ liệu thiết bị (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}


