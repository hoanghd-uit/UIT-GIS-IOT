# Small Phase 23 / Phase 10: Device Catalogue Contract Upgrade — Implementation Handoff

> **Document ID:** `BP2-P10-CATALOGUE-CONTRACT-UPGRADE-HANDOFF`  
> **Project:** GIS — UIT Building E Digital Twin  
> **Phase Mapping:** Big Phase 02 / Phase 10 / Small Phase 23 (Updated device catalogue/filter contract and source-semantic reconciliation)  
> **Date:** 2026-10-03  
> **Status:** `COMPLETED & VERIFIED`  
> **Target Environment:** Development Docker PostgreSQL (`127.0.0.1:5432`), NestJS Backend (`:3001`), Next.js Web (`:3000`)  
> **Authoritative Specification:** [bp2_phase10_page07_device_catalogue_contract_upgrade.md](file:///Users/mac/UnityProj/GIS-UIT/web/doc/bp2_phase10_page07_device_catalogue_contract_upgrade.md)  
> **Master Knowledge Base:** [Dashboard_Knowledge_Base.md](file:///Users/mac/UnityProj/GIS-UIT/web/doc/Dashboard_Knowledge_Base.md)  
> **Master IoT Contract:** [IoTBackend_API_HandOver.md](file:///Users/mac/UnityProj/GIS-UIT/web/doc/IoTBackend_API_HandOver.md)  

---

## 1. Executive Summary

Small Phase 23 (Phase 10) upgrades the device catalogue and telemetry contract across the backend and frontend boundaries according to `IoTBackend_API_HandOver.md` (version `1.5.1-beta`) and `Dashboard_Knowledge_Base.md` (version `1.2.0`).

Key accomplishments in this phase:
1. **Multi-Scope Catalogue Querying:** Added support for optional `roomId` (`room_id`) query parameter alongside existing `floorId` (`floor_level`). The API supports no-filter, floor-only, room-only, and combined floor+room queries.
2. **Strict Scope Isolation:** Unlike floor-only queries which have a development test fallback to floor 0, room queries (both room-only and floor+room) strictly enforce scope isolation: an empty result for a requested room returns an empty dataset with zero guessing or falling back to other floors.
3. **Source-Location Metadata & Compatibility:** Additively propagated `install_room_id` from upstream devices list and detail payloads to `sourceLocation.roomId`. String and null values are preserved with original case; malformed types are safely skipped without coercion. Historical detail compatibility without fabricated coordinates or heights is preserved.
4. **Validation & Security:** Enforced strict parameter validation. Empty strings, whitespace-only strings, duplicate query keys, arrays, and objects are rejected with HTTP 400 before contacting upstream services. Authenticated sessions (`SessionAuthGuard`, `PoliciesGuard`, `read:Dashboard`) protect all reads, and upstream errors (such as 401 Unauthorized) are sanitized to 502 Bad Gateway without terminating the user's application session.
5. **Solar & AVC Semantics Reconciliation (§3.6 / §5.5):** Clarified raw DTO comments and Page 07 telemetry provenance helper text. Recorded confirmed physical units (`solar.voltage` in V, `solar.temperature` in ambient °C, `solar.humidity` in relative %, `avc.fwd_volume_m3` in cumulative m³, `avc.instant_flow_m3h` in m³/h) while keeping caveats open regarding unmapped numeric status/state codes, valve status, calibration, and counter resets.
6. **Page 07 UI Enhancements:** Added an accessible Room filter input with "Áp dụng" button, Enter key trigger, and Clear All filters capability. Added an active scope badge under the KPI strip (`Phòng nguồn: <room>`) and technical room disclosure in expanded table rows, fully conforming to the existing dark glassmorphic design system.
7. **Zero Database Persistence Verified:** Executed PostgreSQL verification against the real development database. Proven that zero new tables/entities/migrations were created, and catalogue reads perform zero database writes.

---

## 2. Delivered vs Deferred Scope

| Domain | Delivered Scope (Small Phase 23) | Deferred Scope |
| --- | --- | --- |
| **Device Filters** | `roomId` (`room_id`) filter, combined `floorId` + `roomId`, strict validation (no duplicates, no empty strings). | Room-to-grid spatial inference, layout editor, automated zone binding. |
| **Scope Isolation** | Room queries bypass floor-0 fallback; isolated empty states. | Automated sync state reconciliation for room queries. |
| **Location Metadata** | Additive `install_room_id` (`roomId`) preservation, historical detail tolerance without fabrication. | Dynamic room coordinate transformations, Unity BIM axis changes. |
| **Telemetry Semantics** | §3.6 confirmed Solar (V, °C, %) and AVC (m³, m³/h) units & provenance caveats updated. | Small Phase 24: `/sb` (Smart Building) and `/smoke` raw telemetry endpoints. |
| **Page 07 UI** | Room filter input, Apply button, Enter key handler, KPI scope hint, expanded row room disclosure. | Page 03 environmental adapter promotion (Small Phase 25). |
| **Persistence** | Zero persistence: in-memory normalization only. Verified via PostgreSQL audit. | Small Phase 21: PostgreSQL report aggregate and alert persistence. |
| **Webhooks** | Contract documented in API handover; verified no unauthorized calls or methods. | Small Phase 27: Read-only webhook inspection. Mutations/receivers remain HOLD. |

---

## 3. Allowlist of Changed Files

### Backend
1. [iot-devices.dto.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/iot/dto/iot-devices.dto.ts): Added `roomId?: string` to `IotDeviceListFilter`, `roomId?: string | null` to `FloorDeviceView.sourceLocation`, and `install_room_id?: string | null` to `IoTUpstreamLocation`.
2. [iot-telemetry.dto.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/iot/dto/iot-telemetry.dto.ts): Added `install_room_id?: string | null` to detail install location; updated Solar/AVC JSDoc comments per §3.6.
3. [iot-client.service.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/iot/services/iot-client.service.ts): Serializes `room_id=${encodeURIComponent(trimmed)}` with exact case; validates non-empty string.
4. [iot-mapper.service.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/iot/services/iot-mapper.service.ts): Propagates `install_room_id` additively; skips malformed non-string/non-null entries.
5. [dashboard-iot-catalogue-query.dto.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/dto/dashboard-iot-catalogue-query.dto.ts): Added `roomId` with `IsValidRoomIdConstraint` validating non-empty scalar string.
6. [dashboard-device-catalogue-response.dto.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/dto/dashboard-device-catalogue-response.dto.ts): Added `roomId?: string | null` to `DashboardDeviceSourceLocationDto`, `requestedRoomId?: string | null` to envelope.
7. [dashboard-iot.controller.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/dashboard-iot.controller.ts): Added `roomId` query support; checks for raw duplicate query keys in URL; passes `roomId` to service.
8. [dashboard-iot-catalogue.service.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/dashboard-iot-catalogue.service.ts): Implements catalogue fetching with room filter; enforces floor-0 bypass when room filter is active; returns `requestedRoomId`.
9. [dashboard-iot-telemetry.service.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/dashboard-iot-telemetry.service.ts): Reconciled Solar/AVC caveats per §5.5 (state/calibration/data quality and valve/reset/daily derivation).
10. [iot-client.spec.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/iot/tests/iot-client.spec.ts): Added unit tests for room query serialization, case preservation, encoding, empty rejection, and historical detail compatibility.
11. [iot-mapper.spec.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/iot/tests/iot-mapper.spec.ts): Added unit tests for `install_room_id` propagation and skipping malformed values.
12. [dashboard-iot-catalogue.spec.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/tests/dashboard-iot-catalogue.spec.ts): Added tests for room queries, duplicate rejection, and strict scope isolation.
13. [dashboard-iot-telemetry.spec.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/src/dashboard/tests/dashboard-iot-telemetry.spec.ts): Updated assertions for clarified caveat text.
14. [test-postgres-phase10.ts](file:///Users/mac/UnityProj/GIS-UIT/backend/test/test-postgres-phase10.ts): Standalone database verification script testing connection, table inventory, zero new tables, read isolation, and column drift.
15. [openapi.json](file:///Users/mac/UnityProj/GIS-UIT/backend/openapi.json): Regenerated Swagger OpenAPI specification reflecting `roomId` and updated DTOs.

### Frontend
16. [dashboard-iot.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/types/dashboard-iot.ts): Added `roomId?: string | null` to `DashboardDeviceSourceLocation` and `requestedRoomId?: string | null` to `DashboardDeviceCatalogueResponse`.
17. [iot-devices.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/types/iot-devices.ts): Added `roomId?: string | null` to `FloorDeviceView.sourceLocation`.
18. [iot-catalogue-api.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/lib/dashboard/iot-catalogue-api.ts): Added `roomId?: string | null` options, local blank rejection, URL parameter assignment.
19. [IotKpiStrip.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/iot/IotKpiStrip.tsx): Added `scopeHint?: string | null` prop rendering active room scope badge under KPI 1.
20. [IotDeviceCatalogueTable.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/iot/IotDeviceCatalogueTable.tsx): Added `Phòng nguồn:` disclosure in expanded details grid.
21. [IotCatalogueFilters.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/iot/IotCatalogueFilters.tsx): Added room input (`placeholder="Nhập mã phòng"`), `Áp dụng` button, Enter key handler, and updated `Xóa lọc` to reset room.
22. [IotCataloguePanel.client.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/iot/IotCataloguePanel.client.tsx): Added room state management (`roomDraft`, `appliedRoom`, `scopeHint`), device selection re-matching on refresh and clearing on scope change, and scope-aware empty state text.
23. [test-bp2-phase10.mjs](file:///Users/mac/UnityProj/GIS-UIT/web/test-bp2-phase10.mjs): Standalone verification test suite covering 26 comprehensive requirements (BP2-SP23-T01 through T26).
24. [package.json](file:///Users/mac/UnityProj/GIS-UIT/web/package.json): Added `"test:bp2:p10": "node test-bp2-phase10.mjs"`.
25. [route.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/app/api/devices/%5B...path%5D/route.ts): Added missing allowed GET regex patterns for 3D Viewer FloorDetail IoT device routes (`iot/buildings/:buildingId/floors/:floorId/devices`, `iot/devices/:deviceId/telemetry`) and dashboard subresource telemetry/readings routes.

### Documentation
26. [Dashboard_Knowledge_Base.md](file:///Users/mac/UnityProj/GIS-UIT/web/doc/Dashboard_Knowledge_Base.md): Bumped version to 1.2.0, updated Section 11.2 with room filters and §3.6 Solar/AVC facts, updated Section 14.1/17.5/21/25/26 to reflect implemented Small Phase 16 identity and Small Phase 23 catalogue upgrade.
27. [dashboard_big_phase_small_phase_plan.md](file:///Users/mac/UnityProj/GIS-UIT/web/doc/dashboard_big_phase_small_phase_plan.md): Marked Small Phase 23 as COMPLETED in backlog and execution order table.
28. [bp2_phase10_page07_device_catalogue_contract_upgrade_handoff.md](file:///Users/mac/UnityProj/GIS-UIT/web/doc/bp2_phase10_page07_device_catalogue_contract_upgrade_handoff.md): This implementation handoff document.

---

## 4. Key Architectural Decisions

### 4.1 Filter Ownership & Query Validation
- `buildingId`: Route parameter, strictly restricted to Building `E`.
- `floorId`: Frontend floor parameter (`4`, `6`), mapped by `FloorLevelMapper` to integer `floor_level`. Rejects invalid floors (`G`) before calling upstream.
- `roomId`: Application room ID (e.g. `E4.08`), mapped to upstream `room_id`. Preserves original case, trims outer whitespace, and encodes special characters safely (`encodeURIComponent`).
- Duplicate Query Parameter Check: Both the controller DTO constraint (`IsValidRoomIdConstraint`) and raw request inspection (`req.originalUrl || req.url`) detect repeated query keys (`roomId=A&roomId=B`), returning HTTP 400 Bad Request before contacting upstream services.

### 4.2 Floor-0 Fallback & Strict Scope Isolation
- In test environments, existing floor-only queries (`floorId=4` or `floorId=6`) retain the legacy fallback to upstream `floor_level=0` when 0 devices are returned on the target floor.
- When `roomId` is present (either room-only or floor+room), this fallback is **strictly bypassed**. If no devices match that specific floor and room, the service returns an empty list `[]` with count `0`.

### 4.3 Historical Detail Compatibility Profile
- Upstream `/devices/{id}` historical responses may omit `install_room_id`, `install_z`, and registry timestamps (`create_timestamp`, `last_updated_timestamp`).
- The parser accepts these omissions for existing opaque device IDs without fabricating synthetic values (`0` height or placeholder room).

### 4.4 Telemetry Caveats Reconciliation (§5.5)
- Clarified that `solar.voltage` is measured battery voltage (V), `solar.temperature` is ambient temperature (°C), and `solar.humidity` is relative humidity (%).
- AVC volumes are cumulative forward/reverse volume (m³), and flow is instantaneous flow (m³/h).
- Preserved caveats: numeric status/state codes, valve states, calibration, resets/rollovers, and daily consumption derivation remain unconfirmed and open.

---

## 5. Verification & Test Evidence

### 5.1 PostgreSQL Database Verification
Script: `backend/test/test-postgres-phase10.ts`  
Command: `npx ts-node test/test-postgres-phase10.ts` (in `backend`)

```text
================================================================
POSTGRESQL DATABASE TEST RESULTS
================================================================
✔ [PASSED] TEST 1: PostgreSQL Connection & Engine Version
   Connected successfully to PostgreSQL. Engine: PostgreSQL 17.11 (Debian 17.11-1.pgdg12+2) on aarch64-unknown-linux-gnu
✔ [PASSED] TEST 2: Public Schema Table Inventory
   Found 7 tables: application_sessions, application_users, catalogue_sync_state, device_bindings, device_display_overrides, floors, migrations
✔ [PASSED] TEST 3: Zero-Persistence Contract Check (Zero new tables or entities added)
   Table list strictly matches baseline (7 tables). Zero new tables added for Phase 10.
✔ [PASSED] TEST 4: Catalogue Query Read-Isolation & Zero DB Writes
   All table row counts identical before and after. Zero PostgreSQL writes occurred.
✔ [PASSED] TEST 5: Schema Drift Check on device_bindings
   device_bindings columns intact without unauthorized alterations: id(uuid), source_namespace(character varying), external_device_id(character varying), building_id(character varying), floor_id(character varying), name(character varying), kind(character varying), data_origin(character varying), operating_status(character varying), original_position(jsonb), placement_revision(integer), source_fetched_at(timestamp with time zone), ingested_at(timestamp with time zone), created_at(timestamp with time zone), updated_at(timestamp with time zone)
================================================================
```

### 5.2 Frontend Contract & Interaction Verification
Script: `web/test-bp2-phase10.mjs`  
Command: `npm run test:bp2:p10` (in `web`)

```text
> web@0.1.0 test:bp2:p10
> node test-bp2-phase10.mjs

✔ BP2-SP23-T01: No filter, floor-only, room-only, floor+room query construction (1.352917ms)
✔ BP2-SP23-T02: Room trim, case preservation, and special character encoding (0.1765ms)
✔ BP2-SP23-T03: Empty, spaces, array, object, and duplicate room query rejected locally with 400 (0.181792ms)
✔ BP2-SP23-T04: Unknown query keys and raw upstream parameter bypass rejected (0.343875ms)
✔ BP2-SP23-T05: Negative and zero floorLevel at low-level client; non-integers rejected (0.288292ms)
✔ BP2-SP23-T06: Current list/detail preserves string/null room and Z=0; distinct timestamps (0.174917ms)
✔ BP2-SP23-T07: Historical detail compatibility accepts missing room/Z/timestamps without fabricating defaults (0.454125ms)
✔ BP2-SP23-T08: Absent room in older responses is compatible and additive (0.331375ms)
✔ BP2-SP23-T09: Malformed room metadata is skipped without coercion; all-malformed throws 502 (0.654958ms)
✔ BP2-SP23-T10: Tolerant meta envelope handling (0.303083ms)
✔ BP2-SP23-T11: Opaque IDs and unknown device types remain valid catalogue records (0.1245ms)
✔ BP2-SP23-T12: Floor-only empty test mode preserves existing floor-0 fallback (0.06675ms)
✔ BP2-SP23-T13: Floor+room empty and room-only empty isolation (no floor-0 fallback) (0.054542ms)
✔ BP2-SP23-T14: Zero database persistence for catalogue queries (0.055542ms)
✔ BP2-SP23-T15: Upstream error sanitization and no token/URL leakage (0.052166ms)
✔ BP2-SP23-T16: SessionAuthGuard and PoliciesGuard protect catalogue endpoint (0.049583ms)
✔ BP2-SP23-T17: Upstream 401 converts to sanitized 502 without logging out user session (0.050042ms)
✔ BP2-SP23-T18: Placement PUT/DELETE remain denied for Viewer and Manager roles (0.049041ms)
✔ BP2-SP23-T19: Room filtering UI interaction: draft, apply, Enter, clear, and floor change (0.373791ms)
✔ BP2-SP23-T20: Stale responses and abort controller prevent race conditions (0.064042ms)
✔ BP2-SP23-T21: Selected device refresh and scope-change clearing (0.239625ms)
✔ BP2-SP23-T22: Room-scoped count, empty state, and scope hint (0.243375ms)
✔ BP2-SP23-T23: Solar and AVC source semantics and caveats reconciliation (§5.5) (0.128375ms)
✔ BP2-SP23-T24: Accessible room controls, labels, and table disclosure (0.319917ms)
✔ BP2-SP23-T25: Protected pages and route trees preserved (0.301917ms)
✔ BP2-SP23-T26: Allowed outbound methods and secret scan (0.1175ms)
ℹ tests 26
ℹ pass 26
ℹ fail 0
```

### 5.3 Backend Unit & E2E Suites
- Unit tests: `npm test -- --runInBand` -> **11 test suites passed, 160 tests passed**.
- E2E tests: `npm run test:e2e` -> **2 test suites passed, 35 tests passed**.
- Build: `npm run build` -> **NestJS compilation succeeded without errors**.

### 5.4 Web Linter & Production Build
- Linter: `npm run lint` -> **0 errors** (2 pre-existing react-hooks warnings).
- Production Build: `npm run build` -> **Next.js 16.3.4 optimized build succeeded** (all 17 static and dynamic pages generated).

---

## 6. Protected Pages Audit

Per §3.2 No-touch rule, all completed dashboard pages were protected:
- **Page 01 (Overview):** Untouched.
- **Page 02 (Energy & Water):** Untouched.
- **Page 03 (Environment):** Untouched.
- **Page 06 (Alerts):** Untouched.
- **Page 09 (Parking):** Untouched.
- **Page 11 (PCCC):** Untouched.
- **Page 07 (Device Catalogue):** Only added the specified Room filter controls, scope hint, and expanded row room disclosure. Stakeholder labels (`Trực tuyến trong API`, KPI headers, column titles) were strictly preserved.

---

## 7. Known Pre-Existing Test Failures & Intentional Non-Regressions

1. `web/test-bp2-phase02.mjs`: Fails on test `BP2-P02-T22` because the catalogue status label was updated to `"Trực tuyến trong API"` per direct stakeholder feedback and documented in `Dashboard_Knowledge_Base.md`. This label is mandated to be preserved.
2. `web/test-bp2-phase04.mjs`: Fails on `BP2-P04-T05` and `T12` due to stakeholder alignment on Page 02.
Neither test was modified, preserving documented stakeholder decisions.

---

## 8. Remaining Gates & Next Steps

1. **Small Phase 24:** Implementation of read-only `sb` (Smart Building) and `smoke` raw telemetry client dispatch and Page 07 raw detail views.
2. **Small Phase 25:** Page 03 environmental adapter upgrade with confirmed Solar units and conditional room/grid live business adapter.
3. **Small Phase 17:** Manual PCCC CRUD implementation on Page 11.
