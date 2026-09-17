import {
  FloorDevicesResponse,
  DeviceMarkerDto,
  UpdateDisplayPositionPayload,
} from '@/types/devices';

const BASE_URL = '/api/devices';

export async function fetchFloorDevices(
  buildingId: string,
  floorId: string,
): Promise<FloorDevicesResponse> {
  const res = await fetch(`${BASE_URL}/buildings/${buildingId}/floors/${floorId}/devices`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to fetch floor devices (${res.status})`);
  }

  return res.json();
}

export async function updateDevicePosition(
  deviceId: string,
  payload: UpdateDisplayPositionPayload,
  expectedRevision: number,
): Promise<DeviceMarkerDto> {
  const res = await fetch(`${BASE_URL}/devices/${deviceId}/display-position`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Expected-Placement-Revision': String(expectedRevision),
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 409) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.message || 'Revision conflict: position was modified by another request.');
    (err as any).isConflict = true;
    throw err;
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to save position (${res.status})`);
  }

  return res.json();
}

export async function resetDevicePosition(
  deviceId: string,
  expectedRevision: number,
  buildingId: string,
  floorId: string,
): Promise<DeviceMarkerDto> {
  const res = await fetch(
    `${BASE_URL}/devices/${deviceId}/display-position?buildingId=${buildingId}&floorId=${floorId}`,
    {
      method: 'DELETE',
      headers: {
        'X-Expected-Placement-Revision': String(expectedRevision),
      },
    },
  );

  if (res.status === 409) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.message || 'Revision conflict: position was modified by another request.');
    (err as any).isConflict = true;
    throw err;
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to reset position (${res.status})`);
  }

  return res.json();
}

