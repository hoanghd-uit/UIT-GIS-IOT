# Dashboard Big Phase — Small Phase Implementation Plan

> **Project:** GIS — UIT Building E Digital Twin  
> **Plan date:** 2026-09-26  
> **Target:** Implement the current `Dashboard_Knowledge_Base.md` without expanding its frozen scope.  
> **Priority rule:** Deliver real, currently available data first; then derived data; then application-owned manual data; and deterministic demo-only content last.  
> **Authoritative requirements:** `Dashboard_Knowledge_Base.md`  
> **Authoritative IoT contract:** `IoTBackend_API_HandOver.md`

---

## 1. How to use this plan

This file is an ordered implementation backlog, not a replacement knowledge base. Before implementing a Small Phase:

1. Read the current `Dashboard_Knowledge_Base.md`.
2. If the phase reads IoT data, also read the current `IoTBackend_API_HandOver.md`.
3. Re-audit the affected source because implementation handoffs describe a point in time; repository and runtime evidence determine the actual state.
4. Implement only that Small Phase, verify its acceptance criteria, and create/update an implementation handoff before starting the next phase.

The sequence starts at **Small Phase 09** because Small Phase 08 is the latest completed implementation handoff in `web/doc`.

---

## 2. Verified starting point

Repository inspection on 2026-09-26 found:

- No Dashboard route tree or Dashboard component directory exists yet.
- The chosen ant-design-charts library is not installed in `web/package.json`.
- CASL is not installed in the web or backend package manifests.
- There is no current application authentication/identity implementation visible in `backend/src` or `web/src`.
- PostgreSQL currently has floor, device binding, catalogue sync, and display-override entities; it does not yet have Dashboard report, alert, or PCCC entities.
- The existing NestJS IoT client supports the five approved read-only upstream GET capabilities.
- In current `DEVICE_SOURCE_MODE=iot`, floor catalogue reads are fetched and mapped in memory; the fixture/managed path uses the existing PostgreSQL device entities. Dashboard planning must not falsely claim that live catalogue responses are already persisted.
- The existing application normalizes device catalogue data and `solar`, `avc`, and `nfc` range data.
- The existing device telemetry endpoint already accepts explicit `start`, `stop`, and `limit` input. Its Dashboard use must preserve those range semantics rather than inventing an undocumented upstream “latest” endpoint.
- Existing normalized data includes device identity/type/location/activity; solar timestamps, gateway, current, lux, RSSI/SNR and raw unconfirmed environment fields; AVC water readings and raw flags; and NFC events.
- Current source code marks several AVC and solar meanings as not hardware-confirmed. A field being present does not make every business interpretation safe.
- Existing handoffs report Small Phases 04, 05, 06, 07, and 08 completed. This planning pass verified the relevant source structure but did not re-run their historical test matrices.

### 2.1 Available-data priority

| Priority | Data class | Current examples | Implementation treatment |
| --- | --- | --- | --- |
| P0 | Real and contract-available | Device catalogue, device type, floor/source coordinates, `is_active`, timestamps, gateway ID, RSSI/SNR, solar current/lux, AVC readings, NFC history | Implement first and label `live`; preserve provenance and uncertainty. |
| P1 | Derived from real data | Water summaries, report aggregates, IoT health, alert state | Implement only after calculation rules, freshness policy, and source windows are explicit. Label `derived`. |
| P2 | Application-owned manual data | Fire extinguisher and fire drill/document records | Implement after identity and CASL enforcement exist. Label `manual`. |
| P3 | Conditional or missing upstream data | CO2, VOC, pressure, room mapping, firmware, OTA, calibration, gateway health, fire-zone state | Use live data only after contract confirmation; otherwise use the approved deterministic demo fallback. |
| P4 | Explicit demo scope | Energy and all Parking data | Implement last with versioned deterministic fixtures and visible `demo` provenance. |

Here, **real and contract-available** means the approved source path and application integration exist. It does not claim that the upstream service currently has non-empty production readings. Each live-data phase must begin with a minimal read-only smoke check in the target environment. An empty or unavailable live source must render an honest empty/unavailable state, not silently switch to demo unless the Dashboard KB explicitly allows that fallback.

---

## 3. Ordered Small Phases

## Small Phase 09 — Dashboard foundation and data provenance

**Priority:** Foundation required by every later phase.  
**Primary data mode:** All modes; no business metrics yet.

### Goal

Create the seven-page Dashboard shell and shared contracts without pretending any page is complete.

### Steps

1. Add Dashboard navigation/routes for Page 01, 02, 03, 06, 07, 09, and 11 only.
2. Do not add Page 04, 05, 08, or 10 placeholders.
3. Read the repository-provided Next.js 16 guidance before choosing route, server/client, caching, or data-fetching patterns.
4. Install the official ant-design-charts package compatible with the current Next.js/React versions and create shared chart wrappers; do not add a second chart library.
5. Define the application `DataMode` contract: `live | derived | manual | demo`.
6. Define common response provenance: source, data mode, source time/window, fetched/calculated time, stale/error state, and fixture version when applicable.
7. Implement shared layout and state primitives: page shell, section, KPI card, status/data-mode badge, time-range selector, table, loading, empty, unavailable, and error states.
8. Create deterministic fixture conventions; prohibit `Math.random()` in Dashboard rendering/data generation.
9. Add navigation and component tests, including a check that out-of-scope pages are absent.

### Exit criteria

- All seven in-scope routes render a shell and correct state components.
- Every sample card/chart can expose its data mode and provenance.
- No component calls the upstream IoT host directly.
- No out-of-scope Dashboard page exists.

---

## Small Phase 10 — Dashboard application API for the real device catalogue

**Priority:** P0 real data.  
**Primary page:** Page 07 — Hệ thống IoT.  
**Depends on:** Small Phase 09.

### Goal

Expose a Dashboard-focused, normalized device catalogue through NestJS using the already implemented read-only integration.

### Steps

1. Reuse the existing mode-aware application route and floor-scoped IoT integration; do not create a second IoT client.
2. Decide and document whether Dashboard live catalogue reads remain request-time/in-memory or synchronize selected metadata into PostgreSQL. If persistence is added, preserve the existing per-floor sync/provenance model and do not imply it already existed for live mode.
3. Add a Dashboard-facing DTO for device identity, type, active flag, source timestamps, fetch timestamp, floor, and source coordinates.
4. Keep source coordinates distinct from application display overrides.
5. Return explicit provenance and partial/unavailable states.
6. Preserve the current unresolved `G` floor mapping and development floor-0 fallback as test/development behavior; do not present fallback placement as verified installation data.
7. Add list/filter support needed by Page 07 without exposing arbitrary upstream path construction.
8. Add contract, service, controller, and frontend adapter tests.

### Exit criteria

- Page 07 can render a real device list from the application API.
- Device identity/type/activity/timestamps/floor/source position are traceable to their source.
- Empty, malformed, unauthorized-upstream, and unavailable cases do not become fake live values.

---

## Small Phase 11 — Page 07 live telemetry core

**Priority:** P0 real data.  
**Primary page:** Page 07 — Hệ thống IoT.  
**Depends on:** Small Phase 10.

### Goal

Complete the Page 07 components that can be supported by the current `solar` and `avc` contracts before adding demo-only fields.

### Steps

1. Add an explicit Dashboard time-range policy and pass `start`, `stop`, and bounded `limit` to the existing telemetry service.
2. Show available live fields: last telemetry timestamp, gateway ID, RSSI, SNR, solar current/lux, and supported AVC radio/water readings.
3. Sort historical series oldest-to-newest only in the application/chart adapter; preserve upstream newest-first semantics.
4. Show raw/unconfirmed labels for fields whose physical meaning or enum is still pending.
5. Do not calculate online/offline, battery percentage, packet-delivery rate, firmware, OTA, calibration, or gateway health until their contracts/rules exist.
6. Render unavailable/conditional cards for missing Page 07 capabilities; do not silently fill them with live-looking values.
7. Add tests for range forwarding, truncation/provenance, zero values, gaps, stale requests, and upstream failure.

### Exit criteria

- Page 07 displays all currently trustworthy live catalogue/radio/telemetry fields.
- Unsupported Page 07 fields are explicitly unavailable or conditional.
- No upstream token, endpoint choice, or raw error detail reaches the browser.

---

## Small Phase 12 — Page 02 live Water baseline

**Priority:** P0 real data.  
**Primary page:** Page 02 — Năng lượng & Nước.  
**Depends on:** Small Phases 09 and 11.

### Goal

Implement the Water portion with the real `avc` source while preserving uncertainty around counter and flag semantics.

### Steps

1. Build a NestJS water adapter over normalized AVC data; do not call upstream from Next.js.
2. Implement meter/device selection and explicit time-range queries.
3. Show current/historical `instant_flow_m3h`, `fwd_volume_m3`, `rev_volume_m3`, `temp_c`, RSSI/SNR, sample time, and coverage where the current contract permits.
4. Keep pending-semantics badges/provenance on cumulative volumes and raw flags until IoT confirmation closes those questions.
5. Do not derive daily consumption from counter differences until reset/rollover behavior is confirmed and tested.
6. Do not declare leak/burst/valve states authoritative until their numeric domains are confirmed.
7. Add chart/table tests for newest-first input, gaps, truncated ranges, zero readings, and counter discontinuity fixtures.

### Exit criteria

- Water current/history is live and traceable to AVC.
- No Energy value is presented as live.
- No unconfirmed raw flag is promoted to an authoritative alert.

---

## Small Phase 13 — Selected report-data pipeline for available metrics

**Priority:** P1 derived from real data.  
**Primary consumers:** Pages 01, 02, 03, 06, and 07.  
**Depends on:** Small Phases 11 and 12.

### Goal

Add the minimum PostgreSQL report-data capability required by Dashboard summaries without mirroring the raw IoT time series.

### Steps

1. Freeze report keys and aggregation windows only for metrics already supported by an approved source.
2. Design PostgreSQL entities/migration for selected aggregates/snapshots with metric key, dimensions, window start/stop, value/unit, source, calculated time, data mode, and provenance.
3. Define idempotent refresh jobs/services, retry behavior, TTL/retention, invalidation, and recovery.
4. Keep raw telemetry in the IoT-side source; store only selected values needed by Dashboard.
5. Add on-demand rebuild/admin-safe operation without exposing the upstream bearer token.
6. Add tests for duplicate jobs, partial windows, late data, truncation, failure recovery, and provenance.
7. Document operational cadence and expected database growth.

### Exit criteria

- At least one real Water or IoT aggregate is produced end-to-end and read by a Dashboard component.
- Every stored aggregate can explain its source and time window.
- No full raw-history mirror is introduced.

---

## Small Phase 14 — Page 03 available environmental metrics

**Priority:** P0/P1 when semantics are confirmed; otherwise conditional.  
**Primary page:** Page 03 — Môi trường (IAQ).  
**Depends on:** Small Phases 11 and 13.

### Entry gate

Re-check the IoT confirmation backlog for temperature/humidity meaning and units, CO2/VOC/pressure availability, room mapping, and reporting cadence.

### Steps

1. Implement confirmed solar/environment metrics through a Page 03 adapter.
2. If temperature/humidity semantics remain unconfirmed, expose them only as clearly qualified raw source fields; do not evaluate standards compliance.
3. Build heatmap, ranking, compliance percentage, and threshold table only for metrics and room/floor dimensions with confirmed mappings.
4. If room mapping is absent, add an application-owned mapping design before claiming room-level results.
5. Use deterministic demo adapters for approved missing metrics such as CO2 rather than mixing demo rows into a live series.
6. Ensure each widget independently exposes `live`, `derived`, or `demo` mode.
7. Add tests preventing mixed-provenance aggregation and false unit/room claims.

### Exit criteria

- Confirmed real environment data is used wherever available.
- CO2/VOC/pressure and room-level views follow the documented fallback if their contracts remain missing.
- No unconfirmed metric is used for a compliance or safety conclusion.

---

## Small Phase 15 — Alert configuration and evaluation engine

**Priority:** P1 derived from real data.  
**Primary page:** Page 06 — Trung tâm cảnh báo.  
**Depends on:** Small Phases 13 and 14 where relevant.

### Entry gate

Freeze the first numeric baseline set, `alert_time_threshold` storage unit, evaluation cadence, and whether `STALE`/`NO_DATA` are explicit states. Do not invent these values in code.

### Steps

1. Add PostgreSQL alert-configuration entities/migration with baseline/custom provenance and audit fields.
2. Seed the approved baselines in the database, not React code.
3. Implement one authoritative NestJS evaluator for Normal/Warning/Danger and duration-above-threshold behavior.
4. Persist or reconstruct current device alert state and alert history with source timestamps.
5. Expose Page 06 list/filter/summary/timeline APIs and frontend.
6. Implement the left-menu badge as the number of distinct devices currently Warning or Danger.
7. Keep alert configuration read-only until Small Phase 17 establishes identity/CASL; alternatively hide editing behind a disabled capability with an explicit reason.
8. Add boundary, duration, recovery, missing-data, duplicate-sample, and distinct-device badge tests.

### Exit criteria

- Page 06 uses backend-evaluated state consistently.
- The menu badge is not a historical-event count.
- Thresholds are not duplicated across frontend components.

---

## Small Phase 16 — Page 01 Overview composition

**Priority:** P1 composition of real/derived data.  
**Primary page:** Page 01 — Tổng quan.  
**Depends on:** Small Phases 10, 13, and 15.

### Goal

Compose the Overview from shared real/derived services, using demo only where the Dashboard KB explicitly permits it.

### Steps

1. Connect top KPI cards to available live/derived data and show per-card provenance.
2. Add latest-alert and IoT-health components from the shared alert/device domains.
3. Define IoT-health rules only from confirmed activity/freshness semantics; until cadence is confirmed, avoid authoritative online/offline labels.
4. Add `FloorCatalog`, the logical `InteractiveFloorGrid`, and `FloorMetadataPanel` using stable configured cell IDs.
5. Keep room mapping/config separate from device coordinates; do not infer rooms from X/Y/Z.
6. Implement click-cell CO2 detail using live data only if confirmed; otherwise use the versioned demo adapter.
7. Add the hourly Energy chart with visibly demo provenance.
8. Test floor switching, stable cell identity, popup provenance, mixed-mode KPIs, and alert consistency.

### Exit criteria

- Page 01 contains all required components.
- Real/derived/demo values are distinguishable at widget level.
- The 2D grid does not replace or instantiate a second Unity runtime.

---

## Small Phase 17 — Identity decision and CASL authorization foundation

**Priority:** Required before protected manual writes.  
**Primary consumers:** Pages 06 and 11.  
**Depends on:** A stakeholder decision for application authentication/identity and the role-to-ability matrix.

### Goal

Establish trustworthy identity and enforce CASL abilities in NestJS and Next.js.

### Steps

1. Inspect any newly added identity/session implementation and freeze the authentication mechanism; CASL itself is not authentication.
2. Freeze role-to-ability mapping for `AlertConfig`, `FireExtinguisher`, and `FireDrill` actions.
3. Install CASL packages appropriate to the existing Next.js/NestJS versions.
4. Build the server ability factory, guards/decorators, and denial responses.
5. Build the client ability context for rendering/disabling protected actions.
6. Enforce authorization on the backend even when the frontend hides a control.
7. Add allow/deny tests for every protected operation and role.

### Exit criteria

- A request has a verified application identity before an ability is evaluated.
- Backend authorization tests prove denied writes cannot succeed through direct HTTP calls.
- Page 06 configuration editing can be enabled only for approved abilities.

---

## Small Phase 18 — Page 11 manual PCCC records

**Priority:** P2 real application-owned data.  
**Primary page:** Page 11 — PCCC.  
**Depends on:** Small Phase 17.

### Goal

Implement authorized PostgreSQL CRUD for fire extinguisher expiry/inspection and fire drill/document records.

### Steps

1. Freeze the minimum record fields and validation rules; do not expand into a full document-control system.
2. Add PostgreSQL entities/migrations with creator/updater and created/updated timestamps.
3. Implement NestJS CRUD with CASL enforcement and safe concurrency behavior.
4. Implement tables/forms, expiry views, drill/document views, and ability-aware actions.
5. Return `manual` provenance and audit metadata.
6. Add validation, audit, authorization, concurrency, empty-state, and CRUD integration tests.

### Exit criteria

- Authorized users can manage both required record types.
- Unauthorized direct requests are denied server-side.
- Escape Route and Pump/fire-water-pressure modules do not exist.

---

## Small Phase 19 — Page 11 fire grid and conditional live adapter

**Priority:** P3 conditional; UI can use demo fallback.  
**Primary page:** Page 11 — PCCC.  
**Depends on:** Shared grid from Small Phase 16 and manual records from Small Phase 18.

### Steps

1. Re-check whether an approved fire-zone API now exists.
2. Reuse `FloorCatalog` and `InteractiveFloorGrid`; do not create a separate incompatible grid system.
3. Define stable zone IDs and floor/room mapping through configuration/application data.
4. If a fire-zone contract exists, integrate it through NestJS and label it live/derived.
5. If no contract exists, use a versioned deterministic demo adapter and a visible demo indicator.
6. Add the required PCCC KPI cards without inventing operational facts.
7. Test floor switching, zone state, popup/detail, source failure, and demo/live adapter substitution.

### Exit criteria

- Page 11 has KPIs, floor catalogue, fire grid, extinguisher records, and drill/document records only.
- Fire-zone data mode is explicit and contract-correct.

---

## Small Phase 20 — Explicit demo completion: Energy, Parking, and missing optional IoT cards

**Priority:** P4 demo-only; deliberately last.  
**Primary pages:** Page 02 Energy, Page 09 Parking, and approved Page 07 fallbacks.  
**Depends on:** Small Phase 09.

### Steps

1. Create versioned deterministic Energy fixtures and complete the Page 02 Energy visual structure.
2. Create versioned deterministic Parking fixtures for occupancy, density, entries by hour, AI-camera/device list, and KPIs.
3. For Page 07 fields the IoT team has explicitly confirmed unavailable, replace unavailable placeholders with approved demo adapters where required by the Dashboard KB.
4. Never combine demo samples into live aggregates or alert evaluation.
5. Show demo provenance in the data contract and UI.
6. Add snapshot/fixture stability tests and checks that reloads produce identical values.

### Exit criteria

- Energy and all Page 09 widgets are complete and unmistakably demo.
- No random or live-looking fabricated value is present.

---

## Small Phase 21 — Big Phase integration, resilience, and acceptance

**Priority:** Final integration.  
**Depends on:** All required previous Small Phases.

### Steps

1. Run the Big Phase acceptance matrix across exactly seven pages.
2. Verify loading, empty, partial, unavailable, upstream error, authorization denial, stale/report lag, and demo states.
3. Verify alert state is consistent across Pages 01, 03, 06, and 07.
4. Verify provenance/time windows for every live and derived KPI/chart.
5. Verify no browser/Unity request targets the upstream IoT host and no bearer token appears in bundles, logs, responses, or PostgreSQL.
6. Verify accessibility, responsive layout, keyboard grid interaction, chart/table alternatives, and Vietnamese labels.
7. Run backend unit/e2e/build, web lint/build/tests, migrations on a clean database, and a read-only live smoke test when credentials/environment permit.
8. Update implementation handoffs and update the two knowledge bases only for facts that actually changed.

### Exit criteria

- All acceptance principles in `Dashboard_Knowledge_Base.md` pass with repository/runtime evidence.
- The delivered Dashboard has Pages 01, 02, 03, 06, 07, 09, and 11 only.
- Every component accurately declares `live`, `derived`, `manual`, or `demo`.

---

## 4. Delivery order summary

| Order | Small Phase | Main result | Data priority |
| ---: | --- | --- | --- |
| 1 | 09 | Dashboard shell, shared components, provenance | Foundation |
| 2 | 10 | Real device catalogue API/UI | P0 live |
| 3 | 11 | Page 07 live telemetry core | P0 live |
| 4 | 12 | Page 02 live Water | P0 live |
| 5 | 13 | Selected report data | P1 derived |
| 6 | 14 | Page 03 confirmed environmental data | P0/P1 conditional |
| 7 | 15 | Alert config/evaluator and Page 06 | P1 derived |
| 8 | 16 | Page 01 Overview and shared grid | P1 mixed |
| 9 | 17 | Identity + CASL | Protected-write foundation |
| 10 | 18 | Page 11 manual records | P2 manual |
| 11 | 19 | Page 11 fire grid | P3 conditional/demo |
| 12 | 20 | Energy, Parking, missing-field demo content | P4 demo |
| 13 | 21 | Integrated acceptance and hardening | Final |

---

## 5. Decisions and external answers that can change sequencing

The implementation can begin through Small Phase 13 with current evidence. The following gates must be resolved before claiming the affected feature is authoritative:

- Temperature/humidity/voltage/state semantics and units.
- AVC counter reset/rollover and flag domains.
- Room mapping and stable room-grid source.
- Telemetry cadence and online/stale policy.
- Numeric alert baselines, `alert_time_threshold` unit, and stale/no-data state policy.
- Authentication mechanism and role-to-ability matrix.
- CO2/VOC/pressure availability.
- Gateway health, firmware, OTA, calibration, standardized battery, and packet aggregates.
- Fire-zone API and mapping.

An unresolved item must not block unrelated earlier phases. Keep its adapter boundary and render an explicit unavailable or approved deterministic demo state.

---

## 6. Scope exclusions preserved by this plan

- No Page 04, 05, 08, or 10.
- No custom drag/drop Dashboard editor.
- No second Dashboard application outside Next.js.
- No second Unity runtime and no Unity replacement.
- No direct browser/Unity access to the IoT backend.
- No upstream IoT mutation.
- No raw TSDB mirror in PostgreSQL.
- No invented IoT fields, units, thresholds, online state, room mapping, or fire state.
- No full CMMS/document-control expansion for PCCC.
- No second chart library.
