import { FloorDeviceResponse } from '@/types/iot-devices';

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

