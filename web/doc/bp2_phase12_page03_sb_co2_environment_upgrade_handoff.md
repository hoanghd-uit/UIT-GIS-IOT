# Big Phase 02 — Phase 12 / Small Phase 25: Page 03 SB CO₂ & Environmental Source Upgrade Handoff

> **Project:** GIS — UIT Building E Digital Twin  
> **Document ID:** `BP2-P12-SP25-ENVIRONMENT-SB-CO2-HANDOFF`  
> **Date:** 2026-10-03, Asia/Ho_Chi_Minh  
> **Status:** IMPLEMENTED & VERIFIED  
> **Stable Backlog ID:** Small Phase **25** (Detailed implementation plan: Phase 12)  
> **Target Page:** Page 03 — Môi trường (IAQ), `/dashboard/environment`  
> **Matching Plan Document:** `web/doc/bp2_phase12_page03_sb_co2_environment_upgrade.md`  

---

## 1. Executive Summary & Delivery Scope

Small Phase 25 has completed its **mandatory branch** delivering live Smart Building (SB) CO₂ telemetry and derived summary metrics into Dashboard Page 03 (IAQ) alongside existing Solar environmental sources, following all stakeholder authority directives.

### 1.1 Delivered Scope (Mandatory Branch — Completed)
1. **Multi-Source Environmental Catalogue:**
   - Authenticated GET `/api/v1/dashboard/buildings/E/environment/sources` now returns both `solar` and `sb` candidate devices from the catalogue.
   - Preserves opaque device ID, catalogue active state, source timestamps, and source location with exact-case `roomId`.
   - Propagates query `roomId` to existing catalogue room filter without silently dropping room scope.
   - Correctly filters out unsupported device types (`avc`, `smoke`, `nfc`, `unknown`).
   - Reports `acceptedSolarCount`, `acceptedSbCount`, and source-specific capabilities.

2. **Server-Authoritative Selected Detail & Readings:**
   - GET `/api/v1/dashboard/buildings/E/environment/sources/:deviceId/readings` dispatches server-side based on device type:
     - For `solar`: returns ambient `rawTemperature` (°C), `rawHumidity` (%), `lux`, `currentUa`, `rawVoltage`, radio parameters.
     - For `sb`: returns `rawCo2` (ppm), `rawVoc` (index), `rawVoltage` (V), `rawVisible` (count), `rawIr` (count), network name, gateway ID, and radio parameters.
   - Selected SB detail panel defaults to the **CO₂ (ppm)** tab, renders chronological time-series chart with zero preservation, displays 4 technical metric cards, and presents clear caveats regarding assumed standard units.

3. **Bounded Population Summary & CO₂ KPI:**
   - GET `/api/v1/dashboard/buildings/E/environment/summary` calculates request-scoped in-memory statistics over latest valid samples within the requested window (max 24h).
   - Global candidate cap of **20 devices** with **deterministic type interleaving (`type_interleaving_v1`)** prevents SB starvation when Solar candidate devices outnumber SB devices.
   - Enforces max concurrency 2 and `limit=1` per candidate.
   - Strict metric isolation: CO₂ summary derives **exclusively from SB devices**; temperature, humidity, and lux derive **exclusively from Solar devices**.
   - Preserves valid 0, ignores null/malformed values, does not round in backend.
   - KPI Strip Slot 2 (`CO₂ trung bình`) now displays derived population mean in ppm with a `Derived` badge, contributing source count, and maximum observed value (replacing the old fixture `phòng E6.6`).

4. **Centralized Metric & Unit Mapping:**
   - Implemented `web/src/lib/dashboard/environment-metric-units.ts` under version `environment-metric-units-v1`.
   - Distinguishes `documented_contract` (Solar temperature °C, humidity %, lux, radio) from `assumed_standard` (SB CO₂ ppm, VOC index, voltage V, channel counts).
   - Pure identity numeric mappings with zero hidden scaling.

5. **Explicit Room-to-Cell Mapping Boundary (Task E):**
   - Implemented `web/src/lib/dashboard/environment-room-mapping.ts` providing pure typed adapter `resolveDeviceToCell`.
   - Explicitly resolves states: `'mapped'`, `'unmapped'`, `'ambiguous'`, `'development-fallback'`, `'no-data'`.
   - Rejects guessed room associations from friendly device names, coordinates, or demo IDs.

6. **Fetch Lifecycle & UI Protection:**
   - Preserved event-driven IAQ fetch triggers (mount, source selection, preset change, manual refresh). Zero automatic polling timers (no 5-minute scheduler).
   - Completed pages (Page 01 Overview, Page 02 Water/Energy, Page 06 Alerts, Page 07 IoT, Page 09 Parking) and stakeholder-edited labels remain protected and intact.
   - Zero database persistence: telemetry and summaries remain request-scoped in-memory.

### 1.2 Conditional / Deferred Scope (Gates Open)
As directed by §6 of the plan, the following widgets remain in their explicit, transparent demo states because required verified room bindings, multi-device aggregation policies, and hourly history aggregation contracts are not yet established:
- Page 03 CO₂ room × hour heatmap (`Co2DemoHeatmap`) remains demo.
- Page 03 room ranking (`Co2DemoRanking`) remains demo.
- Page 03 floor compliance and threshold tables remain demo/read-only.
- Page 03 VOC slot remains demo (not mixed with dimensionless SB index).
- Page 03 IAQ score and PM2.5 remain unavailable.
- Page 01 Overview grid CO₂ cell detail remains untouched.

---

## 2. Changed Files & Architecture Summary

| File | Change Description |
| --- | --- |
| `backend/src/dashboard/dto/dashboard-environment-source-list-response.dto.ts` | Additive `acceptedSbCount`, `sourceDeviceType: 'solar' \| 'sb'`, `supportedMetrics` |
| `backend/src/dashboard/dto/dashboard-environment-summary-response.dto.ts` | Additive `catalogueSbCount`, `attemptedSolarCount`, `attemptedSbCount`, `co2` summary metric, `sourceDeviceType` |
| `backend/src/dashboard/dto/dashboard-environment-readings-response.dto.ts` | Additive SB fields in `latestSample` and `readingItems`, `sourceDeviceType: 'solar' \| 'sb'` |
| `backend/src/dashboard/dashboard-environment.controller.ts` | Propagate `roomId` query to service; update OpenAPI annotations |
| `backend/src/dashboard/dashboard-environment.service.ts` | Filter Solar + SB sources, type-interleaving summary (cap 20, concurrency 2, limit 1), server-authoritative readings dispatch |
| `backend/src/dashboard/dashboard-environment-summary.ts` | Add CO₂ metric summary calculation, per-metric `observedAt`, metric isolation |
| `backend/src/dashboard/tests/dashboard-environment.spec.ts` | Updated Phase 05 assertions and added Phase 12 multi-source and interleaving specs |
| `web/src/types/dashboard-environment.ts` | Synchronized frontend types with additive SB contracts, metrics, and room propagation |
| `web/src/lib/dashboard/environment-metric-units.ts` | **New**: Centralized metric-unit metadata and identity mapping (`environment-metric-units-v1`) |
| `web/src/lib/dashboard/environment-room-mapping.ts` | **New**: Pure typed room-to-cell mapping boundary adapter |
| `web/src/lib/dashboard/environment-chart.ts` | Added SB metric preparation with chronological sorting and zero preservation |
| `web/src/lib/dashboard/environment-api.ts` | Added `roomId` option in `fetchEnvironmentSources` |
| `web/src/components/dashboard/environment/EnvironmentSourcePicker.tsx` | Supported Solar and SB sources, room label display, and type filtering |
| `web/src/components/dashboard/environment/EnvironmentSourceDetail.tsx` | Supported SB details with CO₂ default tab, raw cards, and assumed unit caveats |
| `web/src/components/dashboard/environment/EnvironmentKpiStrip.tsx` | Wired derived CO₂ KPI with ppm and honest unavailable/derived states |
| `web/src/components/dashboard/environment/EnvironmentPageHeader.tsx` | Reconciled badges to `Solar & SB · Live / Derived` and `Phòng / VOC · Demo` |
| `web/test-bp2-phase05.mjs` | Reconciled superseded assertions with approved units and labels |
| `web/test-bp2-phase12.mjs` | **New**: Verification runner covering SP25-T01 through SP25-T17 |
| `web/package.json` | Registered `test:bp2:p12` script |

---

## 3. Metric and Unit Mapping Audit (`environment-metric-units-v1`)

| Metric | Source Type | Unit | Status | Hardware Confirmed | Presentation Rule |
| --- | --- | --- | --- | --- | --- |
| `rawCo2` | SB | `ppm` | `assumed_standard` | No | Numeric identity (`596` → `596 ppm`). Caveat: standard assumption. |
| `rawVoltage` | SB | `V` | `assumed_standard` | No | Numeric identity. No battery percentage inference. |
| `rawVoc` | SB | `index` | `assumed_standard` | No | Dimensionless relative index. Not mg/m³ or ppb. |
| `rawVisible` | SB | `count` | `assumed_standard` | No | Sensor channel count. Not lux or irradiance. |
| `rawIr` | SB | `count` | `assumed_standard` | No | Sensor channel count. Not lux or irradiance. |
| `rawTemperature`| Solar | `°C` | `documented_contract`| No | Per contract §3.6. Not room representativeness. |
| `rawHumidity` | Solar | `%` | `documented_contract`| No | Per contract §3.6. Not room representativeness. |
| `lux` | Solar | `lux` | `documented_contract`| No | Ambient illumination. |
| `rssi` / `snr` | Shared | `dBm` / `dB` | `documented_contract`| No | LoRa radio parameters. |

---

## 4. Verification & Test Evidence

### 4.1 Backend Test Results
Command: `npm test -- src/dashboard/tests/dashboard-environment.spec.ts`
- **Result:** 16 passed, 0 failed (100% pass)
- **Scenarios verified:**
  - Source catalogue returns Solar + SB, filters out AVC/Smoke.
  - Room ID propagation in sources query.
  - Bounded summary calculates derived CO₂ from SB and temperature/humidity/lux from Solar.
  - Fair type-interleaving selection prevents SB starvation with 25 Solar + 1 SB.
  - Duration caps (24h summary, 7d readings) and building validation.
  - Normalized SB readings dispatch with `rawCo2`, `rawVoc`, `rawVoltage`, `rawVisible`, `rawIr`.
  - Non-environment device types rejected with 400.
  - Token and credential sanitization on upstream errors.

Command: `npm run build` in `backend`
- **Result:** Clean compilation (`nest build` exited with code 0).

### 4.2 PostgreSQL Database Verification
Command: `npm run test:db-identity` in `backend`
- **Connection:** `gis_uit_dev` on `127.0.0.1:5432` as runtime user `gis_app_runtime`.
- **Tests conducted & results:**
  - `Test 1: Verifying existence of tables 'application_users' and 'application_sessions'`: **PASS**
  - `Test 2: Verifying constraints on 'application_users'`: **PASS**
  - `Test 3: Testing check constraint CHK_application_users_role rejects invalid role 'admin'`: **PASS**
  - `Test 4: Verifying DML permissions (INSERT, SELECT, UPDATE, DELETE) for runtime role`: **PASS**
  - `Test 5: Verifying Foreign Key ON DELETE CASCADE`: **PASS**
  - `Test 6: Verifying seeded accounts 'beiviewer' and 'beimanager'`: **PASS** (distinct IDs, unique password salts, valid scrypt password verification with password `bei1234`).
- **Persistence Boundary:** Zero telemetry, mapping, or report persistence tables created.

### 4.3 Web Test Results
All scoped Big Phase 02 test runners executed in `web`:
```bash
npm run test:bp2:p05 && npm run test:bp2:p10 && npm run test:bp2:p11 && npm run test:bp2:p12 && npm run test:bp2:hotfix
```
- `test:bp2:p05` (Phase 05 Environment baseline): **10/10 passed**
- `test:bp2:p10` (Phase 23 Catalogue & Room filtering): **26/26 passed**
- `test:bp2:p11` (Phase 24 SB/Smoke Page 07 raw telemetry): **29/29 passed**
- `test:bp2:p12` (Phase 25 Page 03 SB CO₂ Upgrade, SP25-T01 to SP25-T17): **17/17 passed**
- `test:bp2:hotfix` (Page 07 5-min scheduler & cadence hotfix): **9/9 passed**
- **Total:** 91 / 91 passed (0 failures).

Command: `npm run lint` in `web`
- **Result:** 0 errors, 2 pre-existing react-hooks warnings in unaffected components.

Command: `npm run build` in `web`
- **Result:** Next.js production build succeeded in 4.4s (`Creating an optimized production build ... Compiled successfully`). All 17 application routes generated cleanly.

---

## 5. Remaining Room & Business Gates for Next Phases

The mandatory device-level CO₂ integration is complete and verified. The following gates remain open before conditional room widgets can migrate to live data in future phases:

1. **Physical Room Assignment:** Upstream catalogue must provide verified, non-fallback room assignments for the SB fleet.
2. **Room-to-Cell Mapping Configuration:** An approved mapping table linking physical room IDs to 2D logical grid cell IDs must be established.
3. **Primary Device Binding Policy:** When multiple SB sensors exist in a room, an explicit primary binding or aggregation formula must be defined.
4. **Hourly History Aggregation Contract:** Transitioning the hourly heatmap requires a bounded fleet history endpoint/contract; `limit=1` snapshot reads cannot produce room × hour matrices.
5. **Authoritative IAQ Standards & Rules:** Authoritative IAQ score, compliance %, and alert evaluation remain deferred until Small Phase 21.
