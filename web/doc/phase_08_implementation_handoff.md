# Small Phase 08 — Implementation Handoff

> **Project:** GIS — UIT Building E Digital Twin  
> **Phase:** Small Phase 08 — Adapt Source to Updated IoT `/api/v1/devices` Contract  
> **Date:** 2026-09-24  
> **Status:** Completed & Verified  

---

## 1. Repository & Commit Identity
- **Branch:** `present-deliverable`
- **HEAD Commit:** `35481ba8b0ae7b65fd14824ceb3fa77210cba357`
- **Environment:** macOS, Node.js v22.13.9, NestJS 11, Next.js 16.3.4, PostgreSQL 17 (Docker)

---

## 2. Exact Files Changed / Created

### Backend Files
- `backend/src/iot/dto/iot-devices.dto.ts`
  - Added `IotDeviceListFilter` interface with optional `floorLevel?: number`.
  - Added `IotDeviceGateway` interface.
  - Added required `install_z: number` to `IoTUpstreamLocation`.
  - Added `z?: number` to `FloorDeviceView.sourceLocation`.
- `backend/src/iot/dto/iot-telemetry.dto.ts`
  - Added optional `install_z?: number` to `IoTUpstreamDeviceDetailResponse.install_location` for forward compatibility.
- `backend/src/iot/services/iot-client.service.ts`
  - Implemented `IotDeviceGateway`.
  - Updated `fetchRawDevices(filter?: IotDeviceListFilter)`:
    - Serializes `/api/v1/devices` when filter is omitted.
    - Serializes `/api/v1/devices?floor_level=<integer>` when `floorLevel` is provided.
    - Rejects invalid inputs locally before making upstream requests (`Number.isInteger(filter.floorLevel)` check).
    - Explicitly catches HTTP 400 and throws sanitized `BadGatewayException('Upstream IoT API reported invalid query parameters (400 Bad Request).')`.
    - Preserves bearer token confidentiality (never printed or leaked).
  - Added `listDevices(filter?: IotDeviceListFilter)` and `getDevice(devEui: string)` aliases.
- `backend/src/iot/services/iot-mapper.service.ts`
  - Added `resolveUpstreamFloorLevel(buildingId: string, floorId: string): number`:
    - Enforces Building E scope.
    - Explicitly throws `BadRequestException` for viewer floor `'G'` ("Viewer floor 'G' does not have an approved upstream floor_level mapping yet.").
    - Validates strict integer string matching (`/^-?\d+$/`).
    - Enforces configured floor mode (`TEST_CURRENT_FLOOR_4_6_V1`).
  - Updated `mapResponse`:
    - Validates that `install_z` exists and is a finite number (`Number.isFinite(loc.install_z)`). Skips corrupt/missing records.
    - Populates `sourceLocation.z = loc.install_z`.
- `backend/src/iot/iot.service.ts`
  - Updated `getFloorDevices(buildingId, floorId)` to resolve the upstream integer `floorLevel` and pass `{ floorLevel }` to `client.fetchRawDevices({ floorLevel })`.
  - Added `getFullCatalogue()` method for explicit unfiltered retrieval.
- `backend/test/app.e2e-spec.ts`
  - Set `process.env.DEVICE_SOURCE_MODE = 'fixture'` for Phase 04 fixture e2e suite stability.
- `backend/src/iot/tests/iot-mapper.spec.ts`
  - Updated snapshot fixture with `install_z: 0`.
  - Added tests for `resolveUpstreamFloorLevel` (floors 4, 6, rejection of 'G', out-of-scope floors, non-integers).
  - Added tests for coordinate mapping with `z` and contract drift skipping when `install_z` is missing or invalid.
- `backend/src/iot/tests/iot-client.spec.ts` (New test suite)
  - Tests query serialization (`listDevices()`, `listDevices({ floorLevel: 6 })`, `listDevices({ floorLevel: -1 })`).
  - Tests local rejection of invalid `floorLevel` (NaN, 1.5, non-numbers) before touching upstream.
  - Tests upstream HTTP 400 and 401 error sanitization without token leaks.
  - Tests detail lookup with and without `install_z`.
  - Tests floor-scoped routing in `IotService`.

### Frontend / Web Files
- `web/src/types/iot-devices.ts`
  - Added optional `z?: number` to `FloorDeviceView.sourceLocation`.
- `web/test-phase08.mjs` (New test suite)
  - Verifies `sourceLocation.z` preservation, backward compatibility for legacy payloads without Z, and integer query construction.

---

## 3. Actual IoT Client & Gateway Signatures
```ts
export interface IotDeviceListFilter {
  floorLevel?: number;
}

export interface IotDeviceGateway {
  listDevices(filter?: IotDeviceListFilter): Promise<IoTUpstreamDeviceListResponse>;
  getDevice(deviceId: string): Promise<unknown>;
}

@Injectable()
export class IotClientService implements IotDeviceGateway {
  async fetchRawDevices(filter?: IotDeviceListFilter): Promise<IoTUpstreamDeviceListResponse>;
  async listDevices(filter?: IotDeviceListFilter): Promise<IoTUpstreamDeviceListResponse>;
  async fetchDeviceDetail(devEui: string): Promise<IoTUpstreamDeviceDetailResponse>;
  async getDevice(devEui: string): Promise<IoTUpstreamDeviceDetailResponse>;
  async fetchSolarReadings(devEui: string, start: string, stop: string, limit?: number): Promise<IoTUpstreamSolarResponse>;
  async fetchAvcReadings(devEui: string, start: string, stop: string, limit?: number): Promise<IoTUpstreamAvcResponse>;
  async fetchNfcEvents(devEui: string, start: string, stop: string, limit?: number): Promise<IoTUpstreamNfcResponse>;
}
```

---

## 4. Floor Mapping Used & Source
- **Building E Floors 4 & 6:**
  - `floorId: '4'` -> upstream integer `floor_level: 4`
  - `floorId: '6'` -> upstream integer `floor_level: 6`
- **Floor G:**
  - Explicitly left as **unresolved** per contract requirements. Rejects with `BadRequestException`:
    `Viewer floor 'G' does not have an approved upstream floor_level mapping yet.`
  - Prevents erroneous assumptions like `G -> 0` without hardware team evidence.
- **TEST Scenario (`TEST_CURRENT_FLOOR_4_6_V1`) Handling:**
  - Upstream IoT backend currently registers all development devices with `install_floor_level: 0`.
  - When loading Floor 4 or Floor 6, `IotService.getFloorDevices` attempts the contract floor query first (`?floor_level=4` or `?floor_level=6`).
  - If upstream returns 0 devices (because developing devices are all on level 0), under `TEST_CURRENT_FLOOR_4_6_V1` it falls back to querying development devices (`?floor_level=0`) and treats the response as the active device dataset for the opened floor (`displayFloorId: '4'` or `'6'`), preserving raw `sourceLocation.floorLevel: 0`.
  - Automated tests in `iot-client.spec.ts` verify both direct devices and this TEST development fallback.

---

## 5. PostgreSQL Schema & Entity Changes for Z
- **Audited Schema:**
  - `device_bindings` already persists original coordinates in JSONB format: `original_position: { space, frameId, frameVersion, coordinates: { x, y, z } }`.
  - `device_display_overrides` already contains `local_x`, `local_y`, `local_z` as double precision columns.
- **Migration Result:** No schema alteration was required; the persistence layer natively stores and preserves full 3D coordinates `(x, y, z)`.

---

## 6. Cache / Sync-State Scoping
- `catalogue_sync_state` is partitioned with unique constraint `UQ_sync_scope` on `('source_namespace', 'building_id', 'floor_id')`.
- Freshness and sync state are tracked per-floor. Refreshing floor 4 or floor 6 only touches that respective floor's sync record.

---

## 7. Application-Facing Route Behavior
- `GET /api/v1/buildings/:buildingId/floors/:floorId/devices`: Unchanged route contract; returns floor devices (using in-memory IoT proxy when `DEVICE_SOURCE_MODE=iot` or PostgreSQL when in fixture/managed mode).
- `GET /api/v1/iot/buildings/:buildingId/floors/:floorId/devices`: Direct IoT proxy route; executes `GET /api/v1/devices?floor_level=<mapped level>` upstream.
- `GET /api/v1/iot/devices/:deviceId/telemetry`: Direct IoT telemetry route; 72-hour window lookback.
- `PUT / DELETE /api/v1/devices/:deviceId/display-position`: Concurrency-controlled marker position overrides; preserved independently from upstream source coordinates.

---

## 8. Tests Added & Updated
1. `backend/src/iot/tests/iot-mapper.spec.ts` (Updated):
   - Fixture updated to 2026-09-24 contract (`install_z: 0`).
   - `resolveUpstreamFloorLevel` validation.
   - `install_z` coordinate preservation and contract drift rejection.
2. `backend/src/iot/tests/iot-client.spec.ts` (New):
   - Query serialization (`/api/v1/devices`, `?floor_level=6`, `?floor_level=-1`).
   - Local rejection of non-integers, floats, and strings.
   - Sanitized 400 and 401 error handling without token leakage.
   - Detail endpoint compatibility with/without `install_z`.
   - Floor-scoped routing via `IotService`.
3. `web/test-phase08.mjs` (New):
   - Verifies frontend typing and optional Z tolerance.

---

## 9. Verification Commands & Results
| Command | Purpose | Result |
|---|---|---|
| `npm --prefix backend test` | Backend Unit Tests (44 tests in 3 suites) | **PASS** (44/44 passed) |
| `npm --prefix backend run test:e2e` | Backend E2E Tests with Real PostgreSQL | **PASS** (14/14 passed) |
| `npm --prefix backend run build` | NestJS Production Build | **PASS** (Compiled cleanly) |
| `npm --prefix web run build` | Next.js Production Build | **PASS** (Compiled cleanly) |
| `node web/test-phase07.mjs` | Frontend Telemetry Tests | **PASS** (9/9 passed) |
| `node web/test-phase08.mjs` | Frontend Contract Tests | **PASS** (3/3 passed) |
| `curl http://127.0.0.1:3001/api/v1/iot/buildings/E/floors/4/devices` | Live Floor 4 Upstream Query (`?floor_level=4`) | **PASS** (HTTP 200, floor-scoped upstream GET executed) |
| `curl http://127.0.0.1:3001/api/v1/iot/buildings/E/floors/G/devices` | Live Floor G Rejection Check | **PASS** (HTTP 400 returned, upstream not called) |

---

## 10. Upstream Request & Mutation Audits
- **Upstream Requests Executed:**
  - `GET /api/v1/devices?floor_level=4`
  - `GET /api/v1/devices?floor_level=6`
- **Mutations:** **NONE**. Confirmed zero `POST`, `PUT`, `PATCH`, or `DELETE` requests were made or added to the IoT integration.
- **Security Check:** Bearer token remains strictly server-side in memory and was never exposed in client bundles, logs, or error responses.

---

## 11. Open Questions / Upstream Blockers
- **Viewer Floor 'G':** Remains explicitly unmapped pending clarification from the hardware/upstream team regarding whether ground floor maps to `0` or another value.
- **Coordinate System Calibration:** Raw upstream values `install_x`, `install_y`, and `install_z` are preserved as source metadata. Mapping to 3D Unity local coordinates remains governed by the current `TEST_PREFAB_CENTER_XZ_V1` mode.

