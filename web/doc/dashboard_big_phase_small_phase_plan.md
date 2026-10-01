# Dashboard Big Phase — Small Phase Implementation Plan

> **Project:** GIS — UIT Building E Digital Twin  
> **Plan date:** 2026-09-26  
> **Updated:** 2026-10-01 — stakeholder resumed Small Phase 16 planning with exactly two roles, Viewer and Manager; the detailed Phase 09 identity/CASL plan is ready for implementation. Small Phase 19 Parking has a completed implementation handoff. Small Phases 17–18 await the identity/manual-data dependencies. Selected report-data and IoT-derived alert PostgreSQL persistence remain deferred to Small Phase 21, and completed-page stakeholder text/labels remain protected from unrelated edits.
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
| P1 | Derived from real data | Water summaries, report aggregates, IoT health, alert state | Before the deferred persistence phase, fetch approved raw ranges and calculate only the bounded result needed for the current request in NestJS memory. Persist selected report data only in Small Phase 21 after the IoT schema/semantics gate is closed. Label `derived`. |
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

## Small Phase 13 — Page 03 available environmental metrics

**Priority:** P0/P1 when semantics are confirmed; otherwise conditional.  
**Primary page:** Page 03 — Môi trường (IAQ).  
**Depends on:** Small Phase 11.
**Detailed handover plan:** `web/doc/bp2_phase05_page03_environmental_metrics.md`.

### Entry gate

Re-check the IoT confirmation backlog for temperature/humidity meaning and units, CO2/VOC/pressure availability, room mapping, and reporting cadence.

### Steps

1. Implement confirmed solar/environment metrics through a Page 03 adapter.
2. If temperature/humidity semantics remain unconfirmed, expose them only as clearly qualified raw source fields; do not evaluate standards compliance.
3. Build heatmap, ranking, compliance percentage, and threshold table only for metrics and room/floor dimensions with confirmed mappings.
4. If room mapping is absent, add an application-owned mapping design before claiming room-level results.
5. Use deterministic demo adapters for approved missing metrics such as CO2 rather than mixing demo rows into a live series.
6. Fetch bounded raw history through NestJS and perform only request-scoped/in-memory calculation required by the current widget; do not persist telemetry or derived report rows in PostgreSQL.
7. Ensure each widget independently exposes `live`, `derived`, or `demo` mode.
8. Add tests preventing mixed-provenance aggregation, false unit/room claims, unbounded source reads, and accidental persistence.

### Exit criteria

- Confirmed real environment data is used wherever available.
- CO2/VOC/pressure and room-level views follow the documented fallback if their contracts remain missing.
- No unconfirmed metric is used for a compliance or safety conclusion.
- No report-data PostgreSQL schema/job is introduced in this phase.

---

## Small Phase 14 — Page 06 alert-center baseline and in-memory evaluator boundary

**Priority:** P1 derived from real data.  
**Primary page:** Page 06 — Trung tâm cảnh báo.  
**Depends on:** Small Phase 13 where relevant.
**Detailed handover plan:** `web/doc/bp2_phase06_page06_alert_center_baseline.md`.

### Entry gate

Re-check whether the first numeric baseline set, metric semantics/units, telemetry cadence, `alert_time_threshold` behavior, and `STALE`/`NO_DATA` policy have been confirmed. Until they are confirmed, the authoritative runtime rule registry must remain empty and Page 06 must not produce live-looking alerts.

### Steps

1. Define a pure NestJS alert-evaluator boundary for Normal/Warning/Danger that accepts explicit typed samples and configuration but performs no database writes.
2. Keep the runtime authoritative rule registry empty while numeric baselines, units and cadence remain unresolved; use synthetic unit-test inputs only to verify evaluator boundaries.
3. Expose a read-only Page 06 capability/status response that explains why live alert evaluation is unavailable; do not fetch upstream data when no authoritative rule is active.
4. Build the Page 06 list/filter/detail/KPI/chart/rules visual structure with one versioned deterministic demo adapter and visible `demo` provenance.
5. Keep acknowledge/assign/close, notification delivery, BIM navigation, rule add/edit, SLA enforcement and user identities disabled; those need identity, mapping and persistence.
6. Keep the left-menu notification badge absent while no authoritative evaluated state exists. A demo event count must never become the global badge.
7. Perform only request-scoped/in-memory evaluation if a rule is explicitly confirmed during implementation; do not persist alert config, current state or history in this phase.
8. Add tests for evaluator boundaries, empty authoritative registry, demo consistency, no mutation endpoints, no database dependency and no fabricated sidebar badge.

### Exit criteria

- Page 06 is visually complete and every operational value is unmistakably demo or unavailable.
- The evaluator boundary exists, but no unconfirmed metric/threshold produces an authoritative alert.
- The menu badge remains absent until it can represent distinct currently Warning/Danger devices from authoritative backend state.
- No alert PostgreSQL schema/entity/migration/history is introduced before the deferred persistence phase.

---

## Small Phase 15 — Page 01 Overview composition

**Priority:** P1 composition of real/derived data.  
**Primary page:** Page 01 — Tổng quan.  
**Depends on:** Small Phases 10 and 14.
**Detailed handover plan:** `web/doc/bp2_phase07_page01_overview_composition.md`.

### Goal

Compose the Overview from shared real/derived services, using demo only where the Dashboard KB explicitly permits it.

### Steps

1. Connect top KPI cards to available live/derived data and show per-card provenance.
2. Add latest-alert and IoT-health components from the shared alert/device domains, rendering alert content as demo/unavailable until authoritative rules exist.
3. Define IoT-health rules only from confirmed activity/freshness semantics; until cadence is confirmed, avoid authoritative online/offline labels.
4. Add `FloorCatalog`, the logical `InteractiveFloorGrid`, and `FloorMetadataPanel` using stable configured cell IDs.
5. Keep room mapping/config separate from device coordinates; do not infer rooms from X/Y/Z.
6. Implement click-cell CO2 detail using live data only if confirmed; otherwise use the versioned demo adapter.
7. Add the hourly Energy chart with visibly demo provenance.
8. Use bounded raw fetch plus in-memory calculation for any currently available Water/IoT summary; do not require or create report-data persistence.
9. Test floor switching, stable cell identity, popup provenance, mixed-mode KPIs, and alert consistency.
10. Treat completed Page 02/03/06/07 routes, fixtures and stakeholder-edited text labels as protected; reuse them read-only and modify them only for a verified blocking bug with regression evidence.

### Exit criteria

- Page 01 contains all required components.
- Real/derived/demo values are distinguishable at widget level.
- The 2D grid does not replace or instantiate a second Unity runtime.

---

## Small Phase 16 — Identity decision and CASL authorization foundation

**Priority:** Required before protected manual writes.  
**Primary consumers:** All Dashboard reads; future protected inputs on Pages 06 and 11.
**Depends on:** Small Phase 09 and the two-role stakeholder decisions recorded below.
**Execution status:** `COMPLETED`. Implementation verified on 2026-10-01 under `web/doc/bp2_phase09_minimal_identity_casl_foundation_handoff.md`.
**Detailed handover plan:** `web/doc/bp2_phase09_minimal_identity_casl_foundation.md`.
**Detailed handover report:** `web/doc/bp2_phase09_minimal_identity_casl_foundation_handoff.md`.

### Approved minimum roles and sequencing

- Exactly two application roles: `viewer` and `manager`; no Admin/Editor or broad `manage/all` grant.
- Viewer reads Dashboard only; Manager also receives explicit PCCC create/update/delete abilities and future AlertConfig update ability, gated by the later domain implementations.
- Both roles are denied device display-position update/delete; enforce this on the existing backend mutation routes.
- Create application accounts `beiviewer` and `beimanager`, each with stakeholder-requested initial password `bei1234`, through explicit local/test seeding and hashed storage. These are not PostgreSQL database LOGIN roles.
- Planned authentication uses local NestJS credentials, PostgreSQL users/opaque sessions, and a same-origin HttpOnly cookie; CASL handles authorization.
- Small Phase 16 is now the next implementation target; Small Phase 19 Parking already has a completed handoff.
- Small Phase 17 awaits verified Small Phase 16 completion; Small Phase 18 still awaits Small Phase 17.
- Keep existing alert/environment write controls disabled until their domain/persistence gates are met. Authentication/session persistence does not advance IoT report/alert persistence from Small Phase 21.

### Goal

Establish trustworthy identity and enforce CASL abilities in NestJS and Next.js.

### Steps

1. Re-audit identity, mutation routes, protected files and the resolved PostgreSQL target; read the detailed Phase 09 plan.
2. Implement minimal users/session persistence and idempotent explicit local/test seeding for the two approved accounts.
3. Implement login/me/logout and the same-origin session boundary, preserving the existing public campus read workflow.
4. Install compatible CASL packages and implement the explicit two-role action/subject matrix, server ability factory and guards/decorators.
5. Authenticate Dashboard reads and enforce backend denial for device-placement mutations for both roles, including direct HTTP and proxy paths.
6. Add the server route/DAL checks, client ability context, minimal aligned login screen and shared-shell account/logout controls.
7. Preserve completed-page stakeholder labels/layouts and leave future PCCC/config domain controls unavailable until their own phases.
8. Verify session/seed/migration/authorization behavior, including Manager PCCC CRUD policies through test-only boundaries; create the mandatory implementation handoff.

### Exit criteria

- A request has a verified application identity before an ability is evaluated.
- Backend authorization tests prove denied writes cannot succeed through direct HTTP calls.
- Both requested accounts can log in, read Dashboard and log out using persisted opaque sessions.
- Viewer has no domain-write permission; Manager has explicit future PCCC CRUD permission, and neither role can mutate device display positions.
- Page 06 configuration editing remains unavailable until both approved abilities and its later persistence/semantics dependencies exist.
- No report/alert persistence or PCCC CRUD/grid implementation is introduced in this foundation phase.

---

## Small Phase 17 — Page 11 manual PCCC records

**Priority:** P2 real application-owned data.  
**Primary page:** Page 11 — PCCC.  
**Depends on:** Small Phase 16.
**Execution status:** `WAITING FOR SMALL PHASE 16 IMPLEMENTATION/HANDOFF`; the identity hold is lifted, but verified identity/CASL is not yet implemented. Manager PCCC create/update/delete permission is approved; do not implement unauthenticated CRUD as a workaround.

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

## Small Phase 18 — Page 11 fire grid and conditional live adapter

**Priority:** P3 conditional; UI can use demo fallback.  
**Primary page:** Page 11 — PCCC.  
**Depends on:** Shared grid from Small Phase 15 and manual records from Small Phase 17.
**Execution status:** `WAITING FOR SMALL PHASE 17`; Small Phase 16 planning is resumed, and the shared grid/manual-record dependencies must be implemented and verified before final Page 11 composition.

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

## Small Phase 19 — Explicit demo completion: Parking

**Priority:** P4 demo-only; deliberately last.  
**Primary page:** Page 09 Parking only.
**Depends on:** Small Phase 09.
**Execution status:** `COMPLETED PER IMPLEMENTATION HANDOFF` dated 2026-10-01: `web/doc/bp2_phase08_demo_completion_energy_parking_handoff.md`. This planning update does not re-run the historical acceptance tests.
**Detailed handover plan:** `web/doc/bp2_phase08_demo_completion_energy_parking.md`.

### Steps

1. Create versioned deterministic Parking fixtures for occupancy, density, entries by hour, demo camera/device list, and KPIs.
2. Build Page 09 Parking UI from the approved mockup hierarchy while following the Knowledge Base data rules.
3. Never combine demo samples into live aggregates or alert evaluation.
4. Show demo provenance in the data contract and UI.
5. Add snapshot/fixture stability tests and checks that reloads produce identical values.
6. Treat Page 02, Page 07 and every other completed page as no-touch; this phase must not implement or revise them.

### Exit criteria

- All Page 09 widgets are complete and unmistakably demo.
- No random or live-looking fabricated value is present.
- The implementation diff contains no Page 02 or Page 07 changes.

---

## Small Phase 20 — Cross-page integration without report-data persistence

**Priority:** Integration before the deferred persistence boundary.
**Depends on:** All required Small Phases 09–19.

### Goal

Integrate the seven Dashboard pages using live raw reads, bounded NestJS in-memory calculations, application-owned manual data, and approved deterministic demo data while keeping the selected report-data PostgreSQL pipeline deferred.

### Steps

1. Verify cross-page navigation, shared components, data-mode labels, and UI alignment across exactly seven pages.
2. Verify loading, empty, partial, unavailable, upstream error, authorization denial, and demo states.
3. Verify alert state consistency across Pages 01, 03, 06, and 07 using the phase-approved source/evaluator path.
4. Verify every live/derived widget declares its raw source window and calculation time even when the calculation is request-scoped/in-memory.
5. Verify no browser/Unity request targets the upstream IoT host and no bearer token appears in bundles, logs, responses, or PostgreSQL.
6. Verify no report/aggregate/snapshot table, refresh job, TTL, or raw telemetry mirror has been introduced early.
7. Record the remaining report persistence consumers and contract assumptions for Small Phase 21.

### Exit criteria

- Seven pages work together without depending on persisted report data.
- Bounded raw fetch and in-memory calculations are explicit and test-covered.
- The report persistence backlog is isolated behind adapters rather than partially implemented.

---

## Small Phase 21 — Deferred IoT-derived report and alert PostgreSQL persistence

**Priority:** Last implementation subphase of Big Phase 02.
**Primary consumers:** Pages 01, 02, 03, 06, and 07 only where persisted aggregates or alert state are still justified.
**Depends on:** Small Phase 20, Small Phase 16 identity/CASL for protected alert configuration, and the persistence entry gate below.

### Entry gate

Do not start this phase until all of the following are true:

1. The relevant IoT schema/field semantics and units are stable enough to freeze report keys.
2. Device population and live-data volume justify persistence instead of request-scoped calculation.
3. Telemetry cadence, retention, truncation and source load guidance are documented sufficiently to define refresh windows.
4. Stakeholder confirms which Dashboard widgets actually require persisted aggregates.
5. Alert metric baselines, units, duration semantics and `STALE`/`NO_DATA` policy are frozen before alert configuration/state/history tables are designed.
6. Verified application identity and the role-to-ability matrix exist before any alert-configuration mutation is enabled.

If the relevant gate is not satisfied, keep bounded raw fetch/in-memory calculation and do not create placeholder report or alert tables for that domain.

### Goal

Add only the minimum PostgreSQL report-data and authoritative alert persistence proven necessary by the implemented Dashboard, without mirroring raw IoT time series.

### Steps

1. Re-audit actual consumers built in Small Phases 13–20; remove report keys that are not needed.
2. Freeze report keys, units, dimensions and aggregation windows only for metrics with an approved stable source contract.
3. Design PostgreSQL entities/migrations for selected aggregates/snapshots with source window, calculated time, data mode, provenance, freshness and quality state.
4. If the alert gate is closed, design alert configuration, current distinct-device state and event history with audit/ability enforcement; do not reuse demo rules/events.
5. Define idempotent refresh/evaluation jobs, bounded source reads, retry behavior, TTL/retention, invalidation, late-data recomputation and recovery.
6. Keep raw telemetry in the IoT-side source; store only selected report values and justified alert state/events needed by Dashboard.
7. Add an operator-safe rebuild mechanism without exposing the upstream bearer token or adding unauthenticated mutation endpoints.
8. Replace only in-memory paths whose persistence value is proven; preserve honest unavailable/empty/stale fallback.
9. Add tests for duplicate jobs/events, partial windows, duration boundaries, late data, truncation, authorization, failure recovery, provenance and database growth.
10. Document operational cadence and expected database growth.

### Exit criteria

- At least one justified real Water/IoT aggregate is persisted end-to-end and read by a Dashboard component, or the entry-gate review records an explicit stakeholder decision that no persisted report metric is yet justified.
- Every stored aggregate can explain its source, calculation version and time window.
- Any persisted alert can explain its metric configuration version, source samples, duration evaluation and device identity; protected configuration writes are authorized server-side.
- No full raw-history mirror is introduced.
- Existing raw/in-memory behavior remains available as an honest empty/stale fallback where approved.

---

## Small Phase 22 — Big Phase final acceptance and hardening

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
| 5 | 13 | Page 03 environmental data using raw reads/in-memory calculation | P0/P1 conditional |
| 6 | 14 | Page 06 demo baseline + in-memory evaluator boundary | P1 conditional/demo |
| 7 | 15 | Page 01 Overview and shared grid | P1 mixed |
| 8 | 16 | Two-account identity + Viewer/Manager CASL — ready for implementation | Protected-write foundation |
| 9 | 17 | Page 11 authorized manual CRUD — awaits Small Phase 16 completion | P2 manual |
| 10 | 18 | Page 11 fire grid — awaits Small Phase 17 | P3 conditional/demo |
| 11 | 19 | Page 09 Parking demo — completed per Phase 08 handoff | P4 demo |
| 12 | 20 | Cross-page integration without persisted report data | Integration |
| 13 | 21 | Deferred IoT-derived report + alert PostgreSQL persistence | P1 derived, last implementation phase |
| 14 | 22 | Big Phase final acceptance and hardening | Final closeout |

---

## 5. Decisions and external answers that can change sequencing

Small Phases 09–15 and 19 have implementation handoffs. After Parking completion, the stakeholder resumed Small Phase 16 planning on 2026-10-01 with exactly two roles and two local application accounts. Small Phase 16 is ready for implementation under `bp2_phase09_minimal_identity_casl_foundation.md`; Small Phases 17–18 await its verified completion and the subsequent manual-data dependency. These phases remain required before cross-page integration/final acceptance. Identity/session PostgreSQL tables belong to Small Phase 16, and PCCC manual-record tables belong to Small Phase 17. Selected IoT-derived report and alert persistence remain deferred to Small Phase 21 because current device/data volume and unsettled source semantics do not yet justify durable report keys or authoritative alert records. Small Phase 22 is acceptance-only and follows that last implementation phase. Page 02 Energy completion has not been assigned a dedicated current task after Small Phase 19 was narrowed to Parking-only; it is not part of Small Phase 16.

The following gates must be resolved before claiming the affected feature is authoritative:

- Temperature/humidity/voltage/state semantics and units.
- AVC counter reset/rollover and flag domains.
- Room mapping and stable room-grid source.
- Telemetry cadence and online/stale policy.
- Numeric alert baselines, `alert_time_threshold` unit, and stale/no-data state policy.
- Verified implementation of the planned local-account/session mechanism and approved Viewer/Manager CASL matrix; the two-role decision is now closed, while future role expansion remains out of scope.
- CO2/VOC/pressure availability.
- Gateway health, firmware, OTA, calibration, standardized battery, and packet aggregates.
- Fire-zone API and mapping.
- Report-data persistence gate: stable source schema/units, sufficient device/data volume, known cadence/retention/load behavior, and confirmed Dashboard consumers.

An unresolved item must not block unrelated earlier phases. Keep its adapter boundary, fetch only bounded approved raw ranges, calculate in NestJS memory where needed, and render an explicit unavailable or approved deterministic demo state. Do not create IoT-derived report/alert PostgreSQL tables or jobs before Small Phase 21.

---

## 6. Scope exclusions preserved by this plan

- No Page 04, 05, 08, or 10.
- No custom drag/drop Dashboard editor.
- No second Dashboard application outside Next.js.
- No second Unity runtime and no Unity replacement.
- No direct browser/Unity access to the IoT backend.
- No upstream IoT mutation.
- No raw TSDB mirror in PostgreSQL.
- No IoT-derived report/aggregate or alert config/state/history PostgreSQL persistence before Small Phase 21; earlier phases use bounded raw fetch, in-memory evaluation, unavailable states, or approved deterministic demo adapters.
- No invented IoT fields, units, thresholds, online state, room mapping, or fire state.
- No full CMMS/document-control expansion for PCCC.
- No second chart library.
