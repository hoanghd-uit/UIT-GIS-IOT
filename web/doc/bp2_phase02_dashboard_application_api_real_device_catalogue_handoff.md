# Big Phase 02 — Phase 02: Dashboard Application API for Real Device Catalogue Handoff Report

> **Project:** GIS — UIT Building E Digital Twin  
> **Big Phase:** 02 — Dashboard  
> **Sub-phase:** 02 — Dashboard Application API for the Real Device Catalogue  
> **Completion Date:** 2026-09-26  
> **Branch:** `feature/dashboard`  
> **HEAD Commit:** `558cc542db6d273a9434c94d4a065960feeb9ebf`  
> **Targets:** NestJS application backend (`backend/`) and Next.js web application (`web/`)  
> **Implementation Status:** COMPLETE — ALL ACCEPTANCE CRITERIA VERIFIED  

---

## 1. Executive Summary

Big Phase 02 / Sub-phase 02 implements the first real-data vertical slice for Big Phase 02: a Dashboard-owned, read-only active IoT device catalogue for Page 07 (Hệ thống IoT).

The vertical slice connects the browser to live IoT device catalogue records through the existing Next.js same-origin proxy boundary (`/api/devices/...`) and a new NestJS application endpoint (`GET /api/v1/dashboard/buildings/:buildingId/iot/devices`), resolving upstream through the existing `IotClientService` without exposing upstream credentials, hostnames, or arbitrary path parameters.

Catalogue fields (`externalDeviceId`, `sourceDeviceType`, `category`, `active`, `sourceCreatedAt`, `sourceUpdatedAt`, `sourceLocation`, `displayFloorId`, `floorAssignment`) are normalized into a stable application DTO. Catalogue activity (`active: true/false`) is explicitly labeled as catalogue registration/activity and is strictly isolated from real-time online/offline/health claims, which remain reserved for subsequent telemetry phases.

---

## 2. Baseline and Working-Tree Inventory

### 2.1 Git Status
- **Branch:** `feature/dashboard`
- **Audited HEAD commit:** `558cc542db6d273a9434c94d4a065960feeb9ebf`
- **Preserved Unrelated Changes:** `GISUIT.code-workspace` was pre-existing and modified by the user; preserved completely intact and unmodified.

### 2.2 Files Modified
- `backend/src/app.module.ts`: Registered `DashboardModule`.
- `web/package.json`: Added `test:bp2:p02` and chained `node test-bp2-phase02.mjs` into `npm run test`.
- `web/src/app/dashboard/iot/page.tsx`: Updated Page 07 (retained as Server Component) to render `IotCataloguePanel`.

### 2.3 Files Created
```text
backend/src/dashboard/
├── dashboard.module.ts
├── dashboard-iot.controller.ts
├── dashboard-iot-catalogue.service.ts
├── dto/
│   ├── dashboard-iot-catalogue-query.dto.ts
│   └── dashboard-device-catalogue-response.dto.ts
└── tests/
    └── dashboard-iot-catalogue.spec.ts

web/
├── test-bp2-phase02.mjs
├── doc/
│   └── bp2_phase02_dashboard_application_api_real_device_catalogue_handoff.md
└── src/
    ├── types/
    │   └── dashboard-iot.ts
    ├── lib/dashboard/
    │   └── iot-catalogue-api.ts
    └── components/dashboard/iot/
        ├── IotCataloguePanel.client.tsx
        ├── IotCatalogueFilters.tsx
        └── IotDeviceCatalogueTable.tsx
```

---

## 3. Contracts and Data Architecture

### 3.1 Backend Routes and Query Contract
- **Endpoint:** `GET /api/v1/dashboard/buildings/:buildingId/iot/devices`
- **Query parameters:**
  - `floorId` (optional string): Application floor ID (e.g. `4`, `6`).
- **Behaviors:**
  - `buildingId !== 'E'`: HTTP 400 Bad Request (`Dashboard IoT catalogue currently supports Building E only`).
  - `floorId` omitted: Reads full active catalogue (`/api/v1/devices` without `floor_level`).
  - `floorId === 'G'`: Controlled HTTP 400 Bad Request (`Viewer floor 'G' does not have an approved upstream floor_level mapping yet.`).
  - `floorId` invalid/unsupported (e.g. `5` under `TEST_CURRENT_FLOOR_4_6_V1`): Controlled HTTP 400 Bad Request before upstream call.
  - Unknown query parameters: Rejected by global `ValidationPipe` with HTTP 400 Bad Request (`forbidNonWhitelisted: true`).
  - Response caching: Set to `Cache-Control: no-store`.

### 3.2 Frontend Same-Origin Proxy Path
- `GET /api/devices/dashboard/buildings/E/iot/devices`
- `GET /api/devices/dashboard/buildings/E/iot/devices?floorId=4`
- Proxied via Next.js catch-all `web/src/app/api/devices/[...path]/route.ts` to `http://127.0.0.1:3001/api/v1/...`.

### 3.3 Application Response DTO
```typescript
interface DashboardDeviceCatalogueResponse {
  schemaVersion: 1;
  buildingId: string;
  requestedFloorId: string | null;
  availability: 'ready' | 'empty';
  provenance: {
    mode: 'live';
    sourceId: 'iot-device-catalogue';
    sourceType: 'iot_backend';
    fetchedAt: string;
    caveats?: string[];
  };
  mapping: {
    floorMode: string;
    developmentFallbackApplied: boolean;
    requestedUpstreamFloorLevel: number | null;
  };
  summary: {
    receivedCount: number;
    acceptedCount: number;
    skippedCount: number;
    duplicateCount: number;
    truncated: boolean | null;
  };
  devices: DashboardDeviceCatalogueItem[];
}

interface DashboardDeviceCatalogueItem {
  externalDeviceId: string;
  sourceDeviceType: string;
  category: DeviceCategory;
  active: boolean;
  sourceCreatedAt: string;
  sourceUpdatedAt: string;
  sourceLocation: {
    x: number;
    y: number;
    z: number;
    floorLevel: number;
  };
  displayFloorId: string | null;
  floorAssignment: 'source' | 'development-fallback' | 'unmapped';
}
```

### 3.4 Field Mapping Table
| Upstream Raw Field | Dashboard Field | Implementation Rule |
|---|---|---|
| `device_id` | `externalDeviceId` | Opaque non-empty string. Preserves non-UUID and dummy identifiers. |
| `device_type` | `sourceDeviceType` | Preserved trimmed string value. |
| mapped type | `category` | Reuses centralized `IotMapperService.mapCategory()`. Unknown remains `unknown`. |
| `is_active` | `active` | Preserved boolean. Strictly displayed as catalogue activity, not online/offline. |
| `create_timestamp` | `sourceCreatedAt` | ISO-8601 creation timestamp. Validated; malformed dates are skipped. |
| `last_updated_timestamp` | `sourceUpdatedAt` | ISO-8601 metadata update timestamp. Not labeled as telemetry last-seen. |
| `install_location.install_x/y/z` | `sourceLocation.x/y/z` | Preserved finite numbers. Zero coordinates are valid numbers, not missing. |
| `install_location.install_floor_level` | `sourceLocation.floorLevel` | Preserved source integer. Never rewritten. |
| Server generation time | `provenance.fetchedAt` | Current server ISO-8601 timestamp generated once per response. |

### 3.5 Floor Mapping and Fallback Semantics
- When querying scoped floors (4 or 6) under `TEST_CURRENT_FLOOR_4_6_V1`, if upstream returns 0 devices, the service queries upstream `floor_level=0` as a development fallback.
- In fallback scenarios, `sourceLocation.floorLevel` retains `0`, `displayFloorId` is set to the requested floor (`4` or `6`), and `floorAssignment` is explicitly `'development-fallback'`. A visible caveat is appended to `provenance.caveats`.
- Full-catalogue queries preserve source floor levels. Items with source floor 4 map to display floor `4`, floor 6 maps to display floor `6`. Items with floor 0 or other levels have `displayFloorId: null` and `floorAssignment: 'unmapped'`. The system never makes an unapproved `0 -> G` inference.

---

## 4. UI States and Activity Semantics

### 4.1 Distinct States in Page 07
1. **Loading State:** `LoadingState` displayed with "Đang tải danh mục thiết bị IoT từ máy chủ...".
2. **Ready State:** Summary header, search/type/floor filter controls, data caveats banner (if truncated or warnings exist), and accessible responsive table.
3. **Empty Upstream State:** `EmptyDataState` displayed when upstream returns 0 valid devices.
4. **Filter Empty State:** Distinct informational message ("Không tìm thấy thiết bị phù hợp") with a reset button when local search/type filters yield 0 rows from a non-empty catalogue.
5. **Unavailable State:** `UnavailableDataState` rendered when `DEVICE_SOURCE_MODE` is disabled/fixture or credentials are missing.
6. **Error State:** `ErrorState` rendered with sanitized user-safe error message and a retry action button.

### 4.2 Strict Non-Online Semantics for `is_active`
- In the catalogue table, `active: true` is rendered as `Đang hoạt động trong danh mục` with a green indicator, and `active: false` as `Ngừng hoạt động trong danh mục`.
- No table column or label claims `Online`, `Offline`, `Mất kết nối`, `Healthy`, or `Heartbeat OK`.
- The top KPI cards for "Đang hoạt động (Online)", "Mất kết nối (Offline)", and "Tỷ lệ trực tuyến" remain in `availability="unavailable"` with the explanatory subtitle `Chờ tích hợp telemetry (Phase 03)`.

---

## 5. Verification Matrix and Test Results

### 5.1 Automated Backend Unit Tests (`npm --prefix backend test -- --runInBand`)
- **Total Test Suites:** 4 passed, 4 total
- **Total Tests:** 61 passed, 61 total (16 new tests for BP2-P02)
- **Execution Time:** ~1.83s

| Test ID | Description | Result |
|---|---|---|
| BP2-P02-T01 | Route is GET-only and resolves through existing IoT integration | PASS |
| BP2-P02-T02 | Omitting floorId performs single unfiltered read | PASS |
| BP2-P02-T03 | floorId=4 and floorId=6 resolve to scoped integer queries | PASS |
| BP2-P02-T04 | Building outside E, floor G, and invalid floors fail before upstream access | PASS |
| BP2-P02-T05 | Opaque IDs including non-UUID/dummy values are preserved | PASS |
| BP2-P02-T06 | Fields map correctly with valid types, values, and live provenance | PASS |
| BP2-P02-T07 | sourceUpdatedAt preserves source metadata timestamp, not telemetry last-seen | PASS |
| BP2-P02-T08 | Duplicate IDs keep first valid record and increment duplicateCount | PASS |
| BP2-P02-T09 | Malformed items are skipped; all-malformed payload throws 502 Bad Gateway | PASS |
| BP2-P02-T10 | Clean empty upstream yields availability: empty and live provenance | PASS |
| BP2-P02-T11 | Tolerant of missing meta; truncated: true produces visible caveat | PASS |
| BP2-P02-T12 | Development floor-0 fallback preserves source floor 0 and marks development-fallback | PASS |
| BP2-P02-T13 | Unmapped full-catalogue floors have displayFloorId: null; never guess 0 -> G | PASS |
| BP2-P02-T14 | DEVICE_SOURCE_MODE disabled and fixture reject with 503 Service Unavailable | PASS |
| BP2-P02-T15 | Sanitizes errors; never leaks tokens, authorization secrets, or internal URLs | PASS |
| BP2-P02-T16 | Zero database persistence: no repository, entity, or migration dependency | PASS |

### 5.2 Automated Frontend Tests (`npm --prefix web test`)
- **Total Tests:** 26 passed (17 Phase 01 + 9 Phase 02)
- **Execution Time:** ~15ms

| Test ID | Description | Result |
|---|---|---|
| BP2-P02-T17 | Adapter calls only same-origin route with cache: no-store and supports cancellation | PASS |
| BP2-P02-T18 | Local ID search is case-insensitive and type filtering operates in-memory | PASS |
| BP2-P02-T19 | Stale/aborted floor responses cannot overwrite latest selection via generation tracking | PASS |
| BP2-P02-T20 | Loading, ready, upstream-empty, filter-empty, unavailable, and error states resolve distinctly | PASS |
| BP2-P02-T21 | Total-device KPI uses acceptedCount, preserves 0, not rendered ready before data | PASS |
| BP2-P02-T22 | Catalogue active never produces Online/Offline/heartbeat conclusions; KPIs await Phase 03 | PASS |
| BP2-P02-T23 | Unsupported telemetry, battery, firmware, gateway, OTA, calibration fields are absent | PASS |
| BP2-P02-T24 | Pages 04, 05, 08, 10 remain absent; Dashboard mounts no Unity runtime | PASS |
| BP2-P02-T25 | Client source contains zero upstream host, bearer token, secret, or arbitrary path param | PASS |

### 5.3 Regression Test Suites
- `node web/test-phase07.mjs`: 9 passed, 0 failed
- `node web/test-phase08.mjs`: 3 passed, 0 failed
- `node web/test-phase09.mjs`: 17 passed, 0 failed

### 5.4 Backend Build and E2E Tests
- `npm --prefix backend run build`: PASSED (zero errors, clean TypeScript build)
- `npm --prefix backend run test:e2e`: 14 passed, 14 total (real PostgreSQL dev container)

### 5.5 Web Lint and Production Build
- `npm --prefix web run lint`: PASSED (0 errors, 2 pre-existing legacy warnings in Viewer)
- `npm --prefix web run build`: PASSED (Next.js 16.3.4 static page generation 13/13 successful)

---

## 6. Security Audit Findings

A global recursive grep across all client-facing files in `web/src/app/dashboard`, `web/src/components/dashboard`, and `web/src/lib/dashboard` verified:
- Upstream host `api.ttlab.manhthao.uk`: **0 occurrences found**
- Bearer token / secret strings: **0 occurrences found**
- Token environment variable references (`IOT_API_MASTER_TOKEN`): **0 occurrences found**
- Arbitrary upstream path parameters: **0 occurrences found**

Zero PostgreSQL writes, migrations, or entities were introduced. Zero upstream mutation HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) were implemented.

---

## 7. Acceptance Criteria Checklist (Section 13)

- [x] One Dashboard-owned, read-only device-catalogue endpoint exists.
- [x] The endpoint reuses the existing IoT client/service/mapper and approved upstream GET allowlist.
- [x] Full-building and approved floor-scoped catalogue reads are supported without accepting raw upstream paths or raw floor levels from the browser.
- [x] The normalized DTO contains device identity, source type/category, catalogue activity, source timestamps, application fetch time, floor, and X/Y/Z.
- [x] Opaque device IDs and unknown source types remain supported.
- [x] Source coordinates remain distinct from display overrides.
- [x] Ground-floor mapping remains unresolved; no `G -> 0` guess exists.
- [x] Development fallback is explicit and preserves raw source floor 0.
- [x] Successful non-empty and empty responses have correct live provenance and availability.
- [x] Partial/truncated data is visibly qualified.
- [x] Page 07 shows a real searchable/filterable catalogue through the Next.js application boundary.
- [x] The total-device KPI uses accepted normalized records.
- [x] `is_active` is never presented as online/offline/health.
- [x] Unsupported Page 07 fields remain unavailable; no telemetry work is implemented early.
- [x] No Dashboard catalogue data is persisted and no migration/entity is added.
- [x] No browser/Unity call targets the upstream IoT host.
- [x] No token, authorization header, upstream URL, stack trace, raw upstream error, or database detail leaks to the client.
- [x] No upstream mutation method/path is added or called.
- [x] Existing viewer/device APIs and Phase 01 Dashboard routes/contracts regressions pass.
- [x] Backend tests/build, frontend tests/lint/build, and recorded manual checks pass.
- [x] The required Phase 02 implementation handoff file exists.

---

## 8. Conclusion

Big Phase 02 / Sub-phase 02 is complete. All 25 automated checkpoints (BP2-P02-T01 through T25) and all acceptance criteria have been implemented, verified, and documented.
