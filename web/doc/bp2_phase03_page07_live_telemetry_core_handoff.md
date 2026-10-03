# Big Phase 02 — Phase 03: Page 07 Live Telemetry Core Implementation Handoff

**Document Reference:** `web/doc/bp2_phase03_page07_live_telemetry_core_handoff.md`  
**Parent Blueprint:** [bp2_phase03_page07_live_telemetry_core.md](file:///Users/mac/UnityProj/GIS-UIT/web/doc/bp2_phase03_page07_live_telemetry_core.md)  
**Implementation Date:** 2026-09-26  
**Status:** COMPLETE — All Acceptance Criteria Pass

---

## 1. Baseline & Repository Context

- **Git Branch:** `feature/dashboard`
- **Git HEAD Commit:** `6c4bf293d78c5dce7228ee0c591d82718fa95877`
- **Working Tree Preservation:**
  - `GISUIT.code-workspace`: Pre-existing user modifications strictly preserved untouched.
  - Phase 02 and Phase 01 assets preserved without regressions or overwrites.
  - Zero database migrations or TypeORM schema modifications introduced.
  - Real PostgreSQL container (`gis-uit-p04-dev-postgres-1`) verified active and healthy on `127.0.0.1:5432`.

---

## 2. Inventory of Changes

### 2.1 Backend Files Created & Modified

| File | Action | Description |
|---|---|---|
| [backend/src/iot/dto/iot-telemetry.dto.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/iot/dto/iot-telemetry.dto.ts) | Modified | Removed client `deviceTypeHint` from `DeviceTelemetryQueryDto` to enforce server-authoritative routing. |
| [backend/src/iot/services/iot-telemetry.service.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/iot/services/iot-telemetry.service.ts) | Modified | Implemented server-side type resolution (trusted RAM cache or upstream device detail GET); hardened finite number conversion (`Number.isFinite`), identity/timestamp verification, all-invalid non-empty payload rejection (`BadGatewayException`), and `fetchedAt` generation. |
| [backend/src/devices/devices.controller.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/devices/devices.controller.ts) | Modified | Removed `@Query('deviceType')` parameter from `getDeviceTelemetry` endpoint. |
| [backend/src/dashboard/dashboard-iot-catalogue.service.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/dashboard-iot-catalogue.service.ts) | Modified | Injected `IotTelemetryService` to warm the RAM type cache when catalogue devices are validated and accepted. |
| [backend/src/dashboard/dto/dashboard-iot-telemetry-query.dto.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/dto/dashboard-iot-telemetry-query.dto.ts) | Created | Validates query parameters (`start`, `stop` ISO8601, `limit` integer 1..1000). |
| [backend/src/dashboard/dto/dashboard-iot-telemetry-response.dto.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/dto/dashboard-iot-telemetry-response.dto.ts) | Created | Response contract DTO containing `provenance`, `queryRange`, `coverage`, `latestSample`, and `telemetry`. |
| [backend/src/dashboard/dashboard-iot-telemetry.service.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/dashboard-iot-telemetry.service.ts) | Created | Core Dashboard telemetry service enforcing `DEVICE_SOURCE_MODE=iot`, Building E gate, range duration <= 7 days, server-authoritative type gate (`solar` / `avc`), latest sample derivation, and sanitized error mapping. |
| [backend/src/dashboard/dashboard-iot.controller.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/dashboard-iot.controller.ts) | Modified | Registered `GET /api/v1/dashboard/buildings/:buildingId/iot/devices/:deviceId/telemetry`. |
| [backend/src/dashboard/dashboard.module.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/dashboard.module.ts) | Modified | Registered `DashboardIotTelemetryService`. |
| [backend/openapi.json](file:///Users/mac/UnityProj/GIS-UIT/backend/openapi.json) | Modified | Added endpoint schema for `/api/v1/dashboard/buildings/{buildingId}/iot/devices/{deviceId}/telemetry` without exposing credentials or upstream hosts. |
| [backend/src/iot/tests/iot-telemetry.spec.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/iot/tests/iot-telemetry.spec.ts) | Modified | Unit tests covering server-authoritative type resolution, cache hits/misses, finite number validation, and zero preservation. |
| [backend/src/dashboard/tests/dashboard-iot-telemetry.spec.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/tests/dashboard-iot-telemetry.spec.ts) | Created | 14 unit tests covering BP2-P03-T01, T02, T03, T05, T09, T11, T12, T13, T14, T19, T20, and source gates. |
| [backend/src/dashboard/tests/dashboard-iot-catalogue.spec.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/tests/dashboard-iot-catalogue.spec.ts) | Modified | Updated test provider mocks to accommodate `IotTelemetryService` cache warming. |

### 2.2 Frontend Files Created & Modified

| File | Action | Description |
|---|---|---|
| [web/src/types/dashboard-iot-telemetry.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/types/dashboard-iot-telemetry.ts) | Created | TypeScript contracts for presets (`last-24h`, `last-72h`, `last-7d`), telemetry response, provenance, and latest sample. |
| [web/src/lib/dashboard/iot-telemetry-range.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/lib/dashboard/iot-telemetry-range.ts) | Created | Pure UTC helpers for computing 24h, 72h (default), and 7d sliding windows. |
| [web/src/components/dashboard/controls/TimeRangeSelector.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/controls/TimeRangeSelector.tsx) | Modified | Added configurable `options` prop to support Phase 03 telemetry presets. |
| [web/src/lib/dashboard/iot-telemetry-api.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/lib/dashboard/iot-telemetry-api.ts) | Created | Same-origin client adapter calling `/api/devices/dashboard/buildings/E/iot/devices/:deviceId/telemetry` with `cache: 'no-store'`, `limit=1000`, and AbortSignal support. |
| [web/src/lib/dashboard/iot-telemetry-chart.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/lib/dashboard/iot-telemetry-chart.ts) | Created | Non-mutating chart adapter sorting newest-first readings into chronological oldest-first points for `@ant-design/charts`, preserving zero, and generating Vietnamese accessible summary. |
| [web/src/components/dashboard/iot/IotTelemetryMetricSelector.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/iot/IotTelemetryMetricSelector.tsx) | Created | Metric selection cards for Solar (current, lux) and AVC (flow, forward/reverse volume, temperature) with semantic caveats. |
| [web/src/components/dashboard/iot/IotTelemetryTechnicalDetails.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/iot/IotTelemetryTechnicalDetails.tsx) | Created | Collapsible disclosure for unconfirmed raw voltages, temperatures, states, LoRa metadata, and raw numeric flag codes. |
| [web/src/components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx) | Created | Selected device live telemetry panel featuring range selector, manual refresh, distinct UI states, latest sample cards, chart wrapper, technical details, and coverage footer. |
| [web/src/components/dashboard/iot/IotDeviceCatalogueTable.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/iot/IotDeviceCatalogueTable.tsx) | Modified | Added row selection state, visual highlight, and "Xem telemetry" action button. |
| [web/src/components/dashboard/iot/IotCataloguePanel.client.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/iot/IotCataloguePanel.client.tsx) | Modified | Added selection state management, floor reconciliation, and mounted `IotDeviceTelemetryPanel`. |
| [web/src/hooks/useIotDeviceTelemetry.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/hooks/useIotDeviceTelemetry.ts) | Modified | Maintained viewer hook backward compatibility without forwarding client `deviceType`. |
| [web/src/lib/iot-api.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/lib/iot-api.ts) | Modified | Maintained viewer API adapter backward compatibility without forwarding client `deviceType`. |
| [web/test-bp2-phase03.mjs](file:///Users/mac/UnityProj/GIS-UIT/web/test-bp2-phase03.mjs) | Created | 19 automated tests covering BP2-P03-T01 through T30. |
| [web/package.json](file:///Users/mac/UnityProj/GIS-UIT/web/package.json) | Modified | Registered `test:bp2:p03` and updated aggregate `test` script. |

---

## 3. Architecture & Operational Integrity

### 3.1 Server-Authoritative Type Resolution & Routing
- The client cannot supply, hint, or override the device type to dictate upstream endpoint routing.
- `IotTelemetryService` resolves device types using:
  1. Internal server-side memory cache (warmed automatically when catalogue items are validated and accepted).
  2. Fallback to upstream device detail GET (`/api/v1/devices/:dev_eui`) if cache misses.
- Supported types for Dashboard Phase 03 telemetry are strictly `solar` and `avc`.
- NFC devices (`nfc`) and unknown device types remain visible in the catalogue, but selection renders an explicit `UnavailableDataState` without initiating any network call to upstream or Dashboard telemetry endpoints.

### 3.2 Time Ranges, Limits & Caching
- Frozen sliding presets: `last-24h` (24 hours), `last-72h` (72 hours, default), `last-7d` (7 days).
- Explicit ISO8601 `start` and `stop` timestamps are calculated at request time.
- Limit is strictly bounded at `1000`.
- The backend rejects requests where:
  - Duration exceeds 7 days (`400 Bad Request`).
  - `start >= stop` (`400 Bad Request`).
  - Limit is less than 1 or greater than 1,000 (`400 Bad Request`).
  - Building is not `E` (`400 Bad Request`).
- All requests use HTTP `Cache-Control: no-store`.

### 3.3 Data Quality, Gaps & Unconfirmed Hardware Fields
- **Zero Values:** Explicitly preserved (e.g. `0 µA`, `0 lx`, `0 m³/h`). Validated using `Number.isFinite(val)`.
- **Gaps:** Nonuniform timestamps and periods with missing samples produce no synthetic points, interpolation, or zero-fill.
- **Solar Raw Fields:** Raw voltage, temperature, humidity, and state are isolated in a collapsible technical disclosure labeled "chưa xác nhận phần cứng / chưa có đơn vị / chưa xác nhận enum".
- **AVC Raw Flags:** Valve, pipe leak, pipe burst, battery low, frozen, tamper, and reverse flow are presented as raw numeric source codes with "chưa xác nhận miền giá trị" wording, never converted to booleans or alarms.
- **Global Health KPIs:** "Đang hoạt động (Online)", "Mất kết nối (Offline)", and "Tỷ lệ trực tuyến" remain strictly `unavailable` on Page 07 because network connection state cannot be derived from telemetry presence or cadence.

### 3.4 Zero Database Persistence & No Polling
- Telemetry data is handled strictly in-memory per request and is never persisted into PostgreSQL.
- Zero database tables, migrations, or TypeORM entities were added.
- No automatic timers, polling intervals (`setInterval`), or background loops exist. Telemetry is loaded exclusively on deliberate user action (row selection or manual refresh button click).

---

## 4. Verification Evidence & Test Execution

### 4.1 Backend Unit Tests
Command: `npm --prefix backend test -- --runInBand`
```text
PASS src/dashboard/tests/dashboard-iot-telemetry.spec.ts
PASS src/dashboard/tests/dashboard-iot-catalogue.spec.ts
PASS src/iot/tests/iot-mapper.spec.ts
PASS src/iot/tests/iot-telemetry.spec.ts
PASS src/iot/tests/iot-client.spec.ts

Test Suites: 5 passed, 5 total
Tests:       82 passed, 82 total
Snapshots:   0 total
Time:        1.694 s
```

### 4.2 Backend E2E Tests (Real PostgreSQL)
Command: `npm --prefix backend run test:e2e`
```text
PASS test/app.e2e-spec.ts
  GIS-UIT Small Phase 04 - E2E Test Suite (Real PostgreSQL)
    T04-01: Health Endpoints (2 tests)
    T04-05: Fixture Ingestion (1 test)
    T04-06: Device Catalogue and Detail Read (3 tests)
    T04-07 & T04-10: Save Override and Timestamp Integrity (1 test)
    T04-08: Reject Invalid Inputs (2 tests)
    T04-11: Concurrency Conflict Protection (1 test)
    T04-09: Reset Display Position Override (1 test)
    T04-13 & T04-14: Idempotent Re-import & Add Device (2 tests)
    T04-16: Reject Invalid Batch Atomically (1 test)

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Time:        1.806 s
```

### 4.3 Backend Build
Command: `npm --prefix backend run build`
```text
> gis-uit-backend@1.0.0 build
> nest build
Exit code: 0
```

### 4.4 Web Automated Tests (Aggregate & Dedicated)
Command: `node web/test-phase07.mjs && node web/test-phase08.mjs && node web/test-phase09.mjs && node web/test-bp2-phase02.mjs && node web/test-bp2-phase03.mjs`
```text
Phase 07 (Viewer Telemetry): 9 passed, 0 failed
Phase 08 (Floor & Coordinates): 3 passed, 0 failed
Phase 09 (Dashboard Foundation): 17 passed, 0 failed
BP2 Phase 02 (IoT Catalogue): 9 passed, 0 failed
BP2 Phase 03 (Live Telemetry): 19 passed, 0 failed
Total Frontend Tests: 57 passed, 0 failed
```

### 4.5 Web Linter
Command: `npm --prefix web run lint`
```text
> web@0.1.0 lint
> eslint
✖ 2 problems (0 errors, 2 pre-existing warnings in unrelated components)
Exit code: 0
```

### 4.6 Web Production Build
Command: `npm --prefix web run build`
```text
▲ Next.js 16.3.4 (webpack)
✓ Compiled successfully in 8.2s
  Collecting page data using 10 workers in 378ms
✓ Generating static pages using 10 workers (13/13) in 180ms
  Finalizing page optimization in 3.0s

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/devices/[...path]
├ ○ /dashboard
├ ○ /dashboard/alerts
├ ○ /dashboard/energy-water
├ ○ /dashboard/environment
├ ○ /dashboard/fire-safety
├ ○ /dashboard/iot
├ ○ /dashboard/overview
├ ○ /dashboard/parking
├ ƒ /viewer/buildings/[buildingId]/floors/[floorId]
└ ○ /viewer/campus

Exit code: 0
```

---

## 5. Security & Isolation Audit

1. **No Client Upstream URLs:** Checked all client code; zero references to `api.ttlab.manhthao.uk` exist in `web/src/`. All calls flow through the same-origin Next.js proxy `/api/devices`.
2. **No Token Leaks:** The IoT master token (`IOT_API_MASTER_TOKEN`) and its value are strictly confined to `backend/src/iot/services/iot-client.service.ts`. Client bundles contain 0 references to tokens or Bearer headers.
3. **No Arbitrary Path Execution:** The Dashboard client communicates strictly with the concrete Dashboard telemetry endpoint.
4. **Sanitized Error Envelopes:** Upstream 5xx or connection errors are mapped to generic, user-safe Vietnamese messages without internal stack traces, URLs, or authorization details.

---

## 6. Acceptance Criteria Assessment (Section 15)

| Requirement | Result | Evidence / Notes |
|---|---|---|
| Dashboard-owned Page 07 telemetry GET endpoint exists | **PASS** | `GET /api/v1/dashboard/buildings/:buildingId/iot/devices/:deviceId/telemetry` |
| Accepts explicit ISO start/stop and bounded limit only | **PASS** | Validated via `DashboardIotTelemetryQueryDto`, limit bounded to 1..1000. |
| Default range is rolling 72 hours, with 24-hour and 7-day presets | **PASS** | `DASHBOARD_TELEMETRY_PRESETS` in `iot-telemetry-range.ts`. |
| No custom/30-day range or automatic polling introduced | **PASS** | Presets fixed; no custom date picker; no `setInterval`. |
| Backend exclusively owns solar/AVC endpoint routing from trusted metadata | **PASS** | `IotTelemetryService.resolveDeviceType` uses cache or upstream detail GET. |
| Browser can no longer select or hint the upstream type endpoint | **PASS** | `deviceTypeHint` removed from DTOs, controller, and client adapters. |
| Existing viewer solar/AVC/NFC telemetry continues to work | **PASS** | `test-phase07.mjs` (9/9 pass) and shared service normalizers pass. |
| Dashboard telemetry supported for solar and AVC only | **PASS** | Non-solar/avc devices return `availability: unavailable`. |
| Last telemetry timestamp, gateway, RSSI, SNR, current/lux, and AVC fields render | **PASS** | Verified via `IotDeviceTelemetryPanel.client.tsx` and `IotTelemetryMetricSelector.tsx`. |
| Solar raw fields and AVC counters/flags visibly qualified | **PASS** | Rendered under `IotTelemetryTechnicalDetails.tsx` with unconfirmed caveats. |
| Zero and missing values remain distinguishable | **PASS** | `0` renders as `0`; missing values render as `—`. |
| Coverage, invalid rows, truncation, reached limit, and requested window traceable | **PASS** | Displayed in panel footer and caveat banner. |
| Backend readings remain newest-first; chart adapters produce oldest-first copy | **PASS** | `prepareTelemetryChartData` non-mutating copy sorts chronologically. |
| Gaps are not filled, interpolated, or converted to zero | **PASS** | Verified in BP2-P03-T18 test. |
| Loading, refreshing, ready, empty, unavailable, unsupported, timeout, error distinct | **PASS** | Verified in BP2-P03-T25 test. |
| Only explicit selected-device actions fetch telemetry (no N+1 sweep) | **PASS** | Table rows have "Xem telemetry" button; no fetch in table. |
| Global Online/Offline/online-rate values remain unavailable | **PASS** | KpiMetadataCards remain with `availability="unavailable"`. |
| Battery %, firmware, gateway health, packet rate, OTA, calibration not invented | **PASS** | Verified in BP2-P03-T28 test. |
| Dashboard uses Phase 01 components and ant-design-charts only | **PASS** | `MetricTrendChart` used; no second chart library added. |
| No telemetry persistence, migration, report job, or upstream mutation | **PASS** | No TypeORM entities/migrations; read-only upstream GET. |
| No browser/Unity call targets upstream host; no secret leaks | **PASS** | Verified in BP2-P03-T29 test. |
| Regressions pass | **PASS** | All backend (unit + e2e) and frontend suites passed. |
| Required Phase 03 implementation handoff exists | **PASS** | This file created at `web/doc/bp2_phase03_page07_live_telemetry_core_handoff.md`. |

---

## 7. Open Questions & Blockers for Subsequent Phases

1. **Online/Offline Cadence Policy:** The IoT hardware team has not provided expected transmission heartbeats or timeouts for Solar or AVC devices. Online/Offline KPIs must remain unavailable until an authoritative cadence specification is provided.
2. **Solar Raw Units & State Enums:** The meaning of `voltage_raw`, `temp_raw`, `humidity_raw`, and `state_raw` remains unconfirmed by hardware engineers. They must remain in the raw disclosure view.
3. **AVC Flag Thresholds:** AVC status flags remain numeric source codes pending specification of bitmasks or numeric codes.
4. **NFC Telemetry Integration:** NFC event telemetry remains unavailable for Dashboard Page 07 and will be addressed in a future phase.
