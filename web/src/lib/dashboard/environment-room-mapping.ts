/**
 * Explicit Read-Only Environment Room-to-Cell Mapping Boundary
 * Big Phase 02 / Phase 12 (SP25)
 *
 * Implements pure typed mapping boundary between source device, actual floor/room, and stable logical cell.
 * Preserves truthfulness: does NOT guess rooms from friendly device names, coordinates, or demo IDs.
 */

export type RoomMappingState =
  | 'mapped'
  | 'unmapped'
  | 'ambiguous'
  | 'development-fallback'
  | 'no-data';

export interface VerifiedRoomCellBinding {
  roomId: string;
  floorId: string;
  cellId: string;
  primaryDeviceId: string;
}

export interface VerifiedRoomMappingConfig {
  version: string;
  bindings: VerifiedRoomCellBinding[];
}

export interface ResolveDeviceToCellInput {
  deviceId: string;
  sourceRoomId?: string | null;
  sourceFloorLevel?: number | null;
  displayFloorId?: string | null;
  floorAssignment?: 'source' | 'development-fallback' | 'unmapped';
  mappingConfig?: VerifiedRoomMappingConfig | null;
}

export interface ResolveDeviceToCellResult {
  state: RoomMappingState;
  roomId: string | null;
  cellId: string | null;
  floorId: string | null;
  reason?: string;
  mappingVersion?: string;
}

/**
 * Resolves a source device to a logical floor cell based strictly on verified mapping config.
 * Pure function: isolated, deterministic, zero side-effects.
 */
export function resolveDeviceToCell(
  input: ResolveDeviceToCellInput,
): ResolveDeviceToCellResult {
  const {
    deviceId,
    sourceRoomId,
    sourceFloorLevel,
    floorAssignment,
    mappingConfig,
  } = input;

  // 1. Check for development fallback or floor-0 bypass
  if (floorAssignment === 'development-fallback' || sourceFloorLevel === 0) {
    return {
      state: 'development-fallback',
      roomId: sourceRoomId || null,
      cellId: null,
      floorId: null,
      reason: 'Thiết bị đang ở chế độ development fallback (tầng 0), không thể liên kết ô phòng thực tế.',
      mappingVersion: mappingConfig?.version,
    };
  }

  // 2. Missing source room
  if (!sourceRoomId || typeof sourceRoomId !== 'string' || sourceRoomId.trim().length === 0) {
    return {
      state: 'unmapped',
      roomId: null,
      cellId: null,
      floorId: null,
      reason: 'Thiết bị chưa được cấu hình thông tin phòng (roomId null hoặc thiếu).',
      mappingVersion: mappingConfig?.version,
    };
  }

  const trimmedRoomId = sourceRoomId.trim();

  // 3. No verified mapping config or empty bindings
  if (!mappingConfig || !Array.isArray(mappingConfig.bindings) || mappingConfig.bindings.length === 0) {
    return {
      state: 'unmapped',
      roomId: trimmedRoomId,
      cellId: null,
      floorId: null,
      reason: 'Chưa có cấu hình liên kết phòng-ô được xác thực (mapping configuration missing or empty).',
      mappingVersion: mappingConfig?.version,
    };
  }

  // 4. Exact case-sensitive match for bindings of this room
  const matchedBindings = mappingConfig.bindings.filter((b) => b.roomId === trimmedRoomId);

  if (matchedBindings.length === 0) {
    return {
      state: 'unmapped',
      roomId: trimmedRoomId,
      cellId: null,
      floorId: null,
      reason: `Phòng '${trimmedRoomId}' chưa có trong danh mục liên kết ô logic đã xác nhận.`,
      mappingVersion: mappingConfig.version,
    };
  }

  // Check for ambiguous bindings (duplicate or conflicting cell/floor)
  const distinctCells = new Set(matchedBindings.map((b) => b.cellId));
  const distinctFloors = new Set(matchedBindings.map((b) => b.floorId));
  if (distinctCells.size > 1 || distinctFloors.size > 1) {
    return {
      state: 'ambiguous',
      roomId: trimmedRoomId,
      cellId: null,
      floorId: null,
      reason: `Phòng '${trimmedRoomId}' có cấu hình liên kết xung đột (nhiều ô hoặc tầng khác nhau).`,
      mappingVersion: mappingConfig.version,
    };
  }

  // If primaryDeviceId is specified and does not match this device
  const primaryBinding = matchedBindings.find((b) => b.primaryDeviceId === deviceId);
  if (!primaryBinding) {
    return {
      state: 'ambiguous',
      roomId: trimmedRoomId,
      cellId: null,
      floorId: null,
      reason: `Thiết bị '${deviceId}' không phải là thiết bị chính (primaryDeviceId) được chỉ định cho phòng '${trimmedRoomId}'.`,
      mappingVersion: mappingConfig.version,
    };
  }

  // 5. Successful mapped binding
  return {
    state: 'mapped',
    roomId: primaryBinding.roomId,
    cellId: primaryBinding.cellId,
    floorId: primaryBinding.floorId,
    reason: 'Đã liên kết thành công với ô logic phòng theo cấu hình xác nhận.',
    mappingVersion: mappingConfig.version,
  };
}
