# Dashboard Big Phase — Small Phase Implementation Plan

> **Project:** GIS — UIT Building E Digital Twin  
> **Plan date:** 2026-09-26  
> **Updated:** 2026-10-03 — reconciled the Phase 10–12 implementation handoffs and current source. Small Phases 09–16, 19, 23, and 24 are complete; Small Phase 25's mandatory Solar/SB source/CO₂ branch has a completed handoff. Its new Page 03 room-ranking/floor-compliance supplement is PLAN ONLY — READY, not implemented. Report/alert PostgreSQL persistence and threshold editing remain the last implementation phase (21), followed by acceptance (22).
> **Target:** Implement the current `Dashboard_Knowledge_Base.md` without expanding its frozen scope.  
> **Priority rule:** Deliver real, currently available data first; then derived data; then application-owned manual data; and deterministic demo-only content last.  
> **Authoritative requirements:** `Dashboard_Knowledge_Base.md`  
> **Authoritative IoT contract:** `IoTBackend_API_HandOver.md`
> **Latest unit decision — 2026-10-03:** Stakeholder authorizes provisional standard measurement units while technical confirmation is pending (Dashboard KB §9.3.1). CO2 uses ppm with identity numeric mapping; Small Phase 25 CO2 live/derived work is no longer blocked by unit review. Room mapping, coverage, quality and business rules remain separate gates. This is planning/metadata policy, not implementation or hardware confirmation.
> **Latest IAQ refresh decision — 2026-10-03:** Stakeholder withdrew the proposed Page 03 5-minute refresh after source audit found mount/selection/preset/manual-triggered fetching, not continuous polling (KB §9.5). Keep the current IAQ refresh mechanism; no scheduler or refresh-only refactor in Small Phase 25. Its SB/unit/room-adapter scope remains unchanged. Page 07 retains its separate 5-minute policy; no other page cadence changes.
> **Latest IAQ derived-widget decision — 2026-10-03:** Small Phase 25 supplement evaluates three simultaneous floor metric means using inclusive default upper limits CO₂1000ppm / temperature27°C / humidity70% (KB §9.6). Missing intervals fail/full denominator; wholly no-data floors show `—`. Threshold display/calculation read the same default config only; editing/saving remains Phase21. Room ranking does not need a grid-cell binding; no heatmap/Overview migration or Page06 alert activation is implied.

---

## 1. How to use this plan

This file is an ordered implementation backlog, not a replacement knowledge base. Before implementing a Small Phase:

1. Read the current `Dashboard_Knowledge_Base.md`.
2. If the phase reads IoT data, also read the current `IoTBackend_API_HandOver.md`.
3. Re-audit the affected source because implementation handoffs describe a point in time; repository and runtime evidence determine the actual state.
4. Implement only that Small Phase, verify its acceptance criteria, and create/update an implementation handoff before starting the next phase.

The original sequence started at **Small Phase 09**. Keep existing Small Phase IDs and their handoff mappings stable; newly identified work uses IDs **23–27**. **Section 4, not numeric ID order, defines the current remaining execution order.** Detailed plans/handoffs named `bp2_phaseXX_*` have a separate numbering scheme; for example, implementation Phase 09 maps to Small Phase 16.

This update is **planning only**. It does not authorize implementing every backlog entry, calling upstream APIs, creating accounts again, running database migrations, or executing webhook mutations/tests. Before starting a selected phase, prepare/read its scoped implementation plan and resolve only its own entry gates.

**Completed-page protection:** do not revisit Pages 01/02/03/06/07/09 to rewrite stakeholder-edited text, rename labels, restyle layouts, or perform unrelated refactors. A future selected phase may change only the data adapter/component explicitly needed for its new requirement, or fix an evidenced blocking bug. Preserve all other labels and behavior; explain each necessary completed-page change and its regression checks in the handoff. Align new UI to the existing new Dashboard design system, not by globally restyling completed pages. If a detailed UI plan needs an unavailable mockup, ask the stakeholder for the specific page name before writing that layout plan.

---

## 2. Historical starting point and current reconciliation

The following is the **historical 2026-09-26 starting point**, not a claim about current implementation:

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
| P3 | Conditional or missing upstream data | Room-grid mapping, pressure, firmware, OTA, calibration, gateway health, and authoritative fire-zone state are still missing/unconfirmed | Measurement unit review does not block stakeholder-approved standard-unit live/derived display (KB §9.3.1). Keep assumed versus confirmed provenance; missing source/mapping/business semantics still require unavailable or approved demo fallback. |
| P4 | Explicit demo scope | Energy and all Parking data | Implement last with versioned deterministic fixtures and visible `demo` provenance. |

Here, **real and contract-available** means the approved source path and application integration exist. It does not claim that the upstream service currently has non-empty production readings. Verify new integration paths with mocks first; perform a minimal real GET smoke check only when explicitly approved for the target environment, otherwise record it as not run. An empty or unavailable live source must render an honest empty/unavailable state, not silently switch to demo unless the Dashboard KB explicitly allows that fallback.

### 2.2 Current implementation evidence — 2026-10-03

- Small Phases **09–15** have their Phase 01–07 implementation handoffs; UI alignment also has `bp2_fix_align_UI_handoff.md`. This review does not rerun their historical test matrices.
- Small Phase **16 is complete**, according to `bp2_phase09_minimal_identity_casl_foundation_handoff.md` and the existing NestJS auth/CASL modules and protected Next.js routes. PostgreSQL users/sessions and the two accounts are no longer pending work. Reuse them; do not create a third role or reseed/reset passwords as part of an IoT upgrade.
- Small Phase **19 is complete**, according to `bp2_phase08_demo_completion_energy_parking_handoff.md`. Despite its legacy filename, that delivered phase is **Parking only**, not Energy.
- Small Phase **23 is complete**, according to `bp2_phase10_page07_device_catalogue_contract_upgrade_handoff.md` and the current catalogue source. Combined room/floor filters, nullable source-room metadata, room-query scope isolation and Solar/AVC contract/caveat reconciliation are delivered. Do not implement them again.
- Small Phase **24 is complete**, per `bp2_phase11_page07_sb_smoke_raw_telemetry_handoff.md` and the checked source: the IoT client/shared normalization supports `sb`/`smoke` alongside existing types; Dashboard Page 07 supports `solar`/`avc`/`sb`/`smoke` selected-device raw telemetry. Do not implement this bridge again. This documentation update does not rerun its historical test matrix.
- Existing `install_z` and source-room handling are delivered catalogue work, not remaining Small Phase 24 tasks. No current webhook client/domain implementation is claimed. The stakeholder's later standard-unit decision changes upcoming measurement interpretation policy, not the completion evidence of the raw bridge.
- Small Phase **25 mandatory branch is complete per handoff** `bp2_phase12_page03_sb_co2_environment_upgrade_handoff.md` and inspected Solar/SB Environment source/detail/CO₂ summary code. No historical tests were rerun by this documentation review. Room ranking, compliance and threshold display currently remain demo/read-only; new scoped decisions in KB §9.6 and the supplemental plan make only those three data/config presentations remaining work. Do not implement the mandatory branch again or infer grid/alert completion from it.
- Page 11 is still a protected placeholder; manual PCCC CRUD and its final grid composition remain unfinished. Its placeholder includes excluded escape-route/fire-water-pressure content; remove only those obsolete Page 11 placeholders when implementing its approved scope.
- Page 02 still renders `EnergyUnavailablePanels`; its approved deterministic Energy demo is unfinished. Page 01's hourly Energy demo does not complete Page 02.

### 2.3 API changes mapped to remaining work

The updated `IoTBackend_API_HandOver.md` is the exact source contract. Keep its upstream pending-review statements intact; the stakeholder's later standard-unit decision (Dashboard KB §9.3.1; API handover §31.7) is a separate application assumption, not a Swagger/hardware confirmation. It supersedes earlier application instructions to block CO2 ppm solely on unit review. Refresh stale source facts during the relevant selected phase without changing frozen page scope or stakeholder labels.

| Updated contract fact | New/merged task | What remains unconfirmed or out of scope |
| --- | --- | --- |
| `/devices` supports combined `floor_level` and exact, case-sensitive, trimmed `room_id`; list/detail share location fields including nullable `install_room_id` and numeric `install_z` | **23**: filter validation/serialization, catalogue/detail DTOs and source-location propagation | Room assignment quality, coordinate units/axes/Unity calibration, and viewer `G -> 0` mapping are not confirmed. Source room ID is not automatically a grid cell ID. |
| `solar.voltage` is battery volts; temperature is ambient °C; humidity is relative %; AVC forward/reverse volumes are cumulative m³ and instantaneous flow is m³/h (§3.6) | **23/25**: contract fixtures and narrowly scoped semantic/unit metadata updates | Calibration, solar state codes, AVC flag domains, counter resets/rollovers, daily consumption, and approved alert thresholds remain open. |
| `/sb` adds `voltage`, `visible`, `ir`, `co2`, `voc`, radio fields and `f_cnt` | **24**: delivered typed raw retrieval; **25 mandatory**: delivered Page03 SB CO₂ support; **25 supplement**: derived room rank/floor compliance with approved defaults | No inferred battery %, pressure, SB temperature/humidity, room mapping or live alert rules. Page03 statistical compliance is separately authorized by stakeholder rules in KB §9.6, not by the payload/unit decision alone. Hardware verification and heatmap/grid mappings remain follow-up. |
| `/smoke` adds numeric `status`/`state`, sample identity/time, and radio fields | **24**: typed raw retrieval; **18**: reuse for PCCC device detail and a conditional zone adapter | No alarm-code mapping, severity/latching policy, or detector-to-zone mapping. This is a reading API, not an authoritative fire-zone state API. |
| Webhook list/detail GETs are documented; registration/update/delete/test make up the other four operations | **27**: optional read-only inspection; **W1/W2** in Section 5: separately authorized future delivery work | No automatic permission for upstream writes/test delivery, new role, notification channel, or receiving integration. |

Schema examples for new endpoints are **not executed live measurements**. All five telemetry endpoints use explicit inclusive `start`/`stop` with `start < stop`, newest-first rows, default `limit=1000`, cap `10000`, and potentially missing `meta.count`/`meta.truncated`. Keep bounded raw reads and request-scoped calculations; do not invent a latest endpoint, cursor, rate limit, polling cadence, or complete-history claim.

---

## 3. Small Phase catalogue — stable IDs; execution order in Section 4

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
- Implemented authentication uses local NestJS credentials, PostgreSQL users/opaque sessions, and a same-origin HttpOnly cookie; CASL handles authorization.
- Small Phase 16 and Small Phase 19 Parking have completed handoffs; neither belongs to the remaining implementation list.
- Small Phase 17's identity/CASL dependency is satisfied; Small Phase 18 still awaits Small Phase 17.
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
**Execution status:** `READY FOR SCOPED PLANNING/IMPLEMENTATION`; Small Phase 16 is implemented and has a verified handoff. Manager PCCC create/update/delete permission is approved. This phase can proceed independently of unresolved IoT semantics; freeze its minimum fields and obtain a Page 11 mockup if the detailed UI plan needs one.

### Goal

Implement authorized PostgreSQL CRUD for fire extinguisher expiry/inspection and fire drill/document records.

### Steps

1. Freeze the minimum record fields and validation rules; do not expand into a full document-control system.
2. Add PostgreSQL entities/migrations with creator/updater and created/updated timestamps.
3. Implement NestJS CRUD with CASL enforcement and safe concurrency behavior.
4. Implement tables/forms, expiry views, drill/document views, and ability-aware actions.
5. Return `manual` provenance and audit metadata.
6. Add validation, audit, authorization, concurrency, empty-state, and CRUD integration tests.
7. Use the current aligned shell/design tokens. Replace only Page 11's placeholder and remove its excluded escape-route/fire-water-pressure content; do not touch earlier completed pages or expand CASL roles.

### Exit criteria

- Authorized users can manage both required record types.
- Unauthorized direct requests are denied server-side.
- Escape Route and Pump/fire-water-pressure modules do not exist.

---

## Small Phase 18 — Page 11 fire grid and conditional live adapter

**Priority:** P3 conditional; UI can use demo fallback.  
**Primary page:** Page 11 — PCCC.  
**Depends on:** Shared grid from completed Small Phase 15 and manual records from Small Phase 17; Small Phases 23–24 for any new live smoke-reading branch.
**Execution status:** `WAITING FOR SMALL PHASE 17`; raw smoke detail additionally waits for 23–24. Authoritative zone state is conditional on confirmed detector-to-zone mapping and smoke-code semantics; approved demo grid composition need not wait indefinitely for those answers.

### Steps

1. Re-check fire-zone capabilities against the updated `/smoke` contract. It exposes readings, not confirmed zone/alarm state. Preserve numeric `status`/`state` as raw until IoT supplies their mapping.
2. Reuse `FloorCatalog` and `InteractiveFloorGrid`; do not create a separate incompatible grid system.
3. Define stable zone IDs and floor/room mapping through configuration/application data.
4. Reuse the Small Phase 24 smoke adapter for explicitly labeled live raw device detail. A live/derived zone adapter additionally requires stable detector-to-zone mapping and approved code/severity/freshness policy; never interpret `0`/`1` as normal/fire by assumption.
5. Until that gate closes, use a versioned deterministic demo adapter for the grid with a visible demo indicator. Keep live raw detector detail separate from demo zone state and manual PCCC records.
6. Add the required PCCC KPI cards without inventing operational facts.
7. Test floor switching, zone state, popup/detail, source failure, and demo/live adapter substitution.
8. Do not introduce fire-control commands, evacuation/pump/pressure modules, an unapproved global fire badge, or persisted IoT alert history in this phase.

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
**Depends on:** Completed Small Phases 09–16/19/23/24 and Small Phase25 mandatory branch; remaining required Small Phases17/18/26 and the Phase25 supplement. Small Phase27 is included only if separately selected; unresolved conditional features use their approved demo/unavailable fallback.
**Execution status:** `WAITING FOR REQUIRED PAGE/ADAPTER COMPLETION`.

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
8. Verify nullable source-room data, new typed `sb`/`smoke` reads, and confirmed Solar units across actual consumers; raw smoke status and unconfirmed `sb` values must not activate the alert evaluator or global badge. Verify upstream credential failures remain dependency errors, not user-session expiration.

### Exit criteria

- Seven pages work together without depending on persisted report data.
- Bounded raw fetch and in-memory calculations are explicit and test-covered.
- The report persistence backlog is isolated behind adapters rather than partially implemented.

---

## Small Phase 21 — Deferred IoT-derived report and alert PostgreSQL persistence

**Priority:** Last implementation subphase of Big Phase 02.
**Primary consumers:** Pages 01, 02, 03, 06, and 07 only where persisted aggregates or alert state are still justified.
**Depends on:** Small Phase 20, Small Phase 16 identity/CASL for protected alert configuration, and the persistence entry gate below.
**Execution status:** `DEFERRED — LAST IMPLEMENTATION PHASE`; the new GET schemas do not by themselves close the persistence or alert-semantics gates.

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

1. Re-audit actual consumers, including upgrades from Small Phases 23–26; remove report keys that are not needed. Do not add `sb`/smoke report or alert keys merely because new raw endpoints exist; any additional consumer requires its own confirmed semantics and stakeholder approval.
2. Freeze report keys, units, dimensions and aggregation windows only for metrics with an approved stable source contract.
3. Design PostgreSQL entities/migrations for selected aggregates/snapshots with source window, calculated time, data mode, provenance, freshness and quality state.
4. When the alert entry gates are satisfied, design alert configuration, current distinct-device state and event history with audit/ability enforcement; do not reuse demo rules/events. Add authorized threshold editing/saving deferred from Page03: Manager updates existing approved config, Viewer reads; reuse the Phase25 default-provider/version boundary so table and compliance calculation consume the same saved configuration. Defaults1000ppm/27°C/70% are approved Page03 statistical limits, not evidence that all alert duration/danger/state policies are settled. Do not activate broader alert rules from these defaults alone.
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
**Execution status:** `WAITING FOR SMALL PHASE 20 AND PHASE 21 IMPLEMENTATION/APPROVED GATE DECISION`; acceptance is not another feature phase.

### Steps

1. Run the Big Phase acceptance matrix across exactly seven pages.
2. Verify loading, empty, partial, unavailable, upstream error, authorization denial, stale/report lag, and demo states.
3. Verify alert state is consistent across Pages 01, 03, 06, and 07.
4. Verify provenance/time windows for every live and derived KPI/chart.
5. Verify no browser/Unity request targets the upstream IoT host and no bearer token appears in bundles, logs, responses, or PostgreSQL.
6. Verify accessibility, responsive layout, keyboard grid interaction, chart/table alternatives, and Vietnamese labels.
7. Run backend unit/e2e/build, web lint/build/tests, migrations on a clean database, and a read-only live smoke test when credentials/environment permit.
8. Update implementation handoffs and update the two knowledge bases only for facts that actually changed.
9. Cover combined room/floor filters, nullable room/height compatibility, `sb`/smoke empty/zero/truncated/schema-drift cases, session-versus-upstream-auth separation, Viewer write denial, Manager PCCC CRUD, and denial of device placement changes for both roles. If webhook inspection was selected, prove no create/update/delete/test call or secret/receiver credential exposure exists.

### Exit criteria

- All acceptance principles in `Dashboard_Knowledge_Base.md` pass with repository/runtime evidence.
- The delivered Dashboard has Pages 01, 02, 03, 06, 07, 09, and 11 only.
- Every component accurately declares `live`, `derived`, `manual`, or `demo`.

---

## Small Phase 23 — Updated device catalogue/filter contract and source-semantic reconciliation

**Priority:** P0 real source contract; completed prerequisite.<br>
**Primary consumers:** Shared IoT bridge and Page 07 catalogue; existing consumers only where source DTO propagation is required.<br>
**Depends on:** Completed Small Phases 10, 11, and 16.<br>
**Execution status:** `COMPLETED`.
**Detailed handover plan:** `web/doc/bp2_phase10_page07_device_catalogue_contract_upgrade.md`.
**Implementation handoff:** `web/doc/bp2_phase10_page07_device_catalogue_contract_upgrade_handoff.md`.

### Steps

1. Reuse the existing NestJS IoT client, catalogue service, mapper and runtime-validation conventions; do not create a parallel client or arbitrary-path proxy.
2. Add optional `room_id` support alongside `floor_level` through request validation and serialization. Trim room boundaries, preserve case, reject empty/repeated room parameters before any upstream call, and allow both filters together. Preserve valid negative upstream floors without inventing floor bounds or viewer `G -> 0` mapping.
3. Preserve nullable/absent `install_room_id` as source metadata through list/detail normalization and relevant frontend types. Do not fabricate a room ID or derive it from coordinates. Use the shared current list/detail schema with explicit, tested historical room/height compatibility.
4. Audit rather than rebuild existing `install_z` handling. Keep raw source X/Y/Z separate from display overrides; do not reinterpret Unity axes because a field description changed. Device display-position writes remain denied for both approved roles.
5. A room-filtered response must not replace a full-floor cache/sync snapshot, delete devices outside that room, or mark other rooms/floors fresh. Key any request cache by its exact filter scope and preserve the existing reconciliation policy. Keep live Dashboard catalogue reads in memory unless an existing metadata path demonstrably needs a narrow change; no new report tables/jobs.
6. Reconcile API §3.6 in DTO semantic metadata, fixtures and the existing KB: Solar V/°C/% and AVC cumulative m³/instantaneous m³/h descriptions are now documented. Preserve raw solar state/AVC flags and unresolved resets/calibration. Unit clarification does not authorize battery %, daily consumption, compliance or alerts.
7. Expose source room metadata/filtering on Page 07 only where needed by the selected detailed plan, using existing layout and labels. Any correction of obsolete semantic helper text must be minimal and directly tied to the changed contract; no copy-editing or rewording unrelated stakeholder content.
8. Test combined/no filters, case-sensitive room matches, null/absent rooms, negative floors, zero coordinates, detail 404, optional meta, unknown device types, opaque IDs, historical compatibility, schema drift and cache-scope isolation. Prove invalid input makes zero upstream calls and session-auth errors remain separate from upstream credential failures.

### Exit criteria

- Catalogue/filter/location changes are available through the existing application boundary with traceable source metadata and backward compatibility.
- Existing Water/environment/Overview behavior and stakeholder labels have no unrelated changes.
- No coordinate remapping, new role, upstream mutation, or report/alert persistence is introduced.

---

## Small Phase 24 — Read-only `sb` and `smoke` raw telemetry foundation

**Priority:** P0 newly documented raw data.<br>
**Primary page:** Page 07 type-specific telemetry; reusable backend adapters for Pages 03 and 11.<br>
**Depends on:** Small Phase 23 and completed identity/CASL foundation.<br>
**Execution status:** `COMPLETE`; Small Phase 24 delivered read-only `sb` and `smoke` raw telemetry foundation with zero database persistence.
**Detailed handover plan:** `web/doc/bp2_phase11_page07_sb_smoke_raw_telemetry.md` (Big Phase 02 / Phase 11 / Small Phase 24).
**Implementation handoff:** `web/doc/bp2_phase11_page07_sb_smoke_raw_telemetry_handoff.md`.

### Completion audit — 2026-10-03

Completion is based on the Phase 11 handoff and checked source, not merely catalogue visibility: fixed SB/Smoke GET methods, shared runtime normalization/dispatch, Dashboard/frontend contract extensions and Page 07 type-specific raw detail are delivered. Earlier text describing these as missing was a pre-Phase-11 audit and is superseded.

Reuse the delivered catalogue/type/room metadata, bounded raw pipeline and session/CASL/proxy boundary for phase 25; do not reopen phase 24 or rewrite its historical handoff. The delivered steps below describe its original raw-only scope. Later standard-unit application assumptions are governed by Dashboard KB §9.3.1 and the selected future phase, not permission to retrofit protected Page 07 labels. This reconciliation reads source/handoffs only; it does not claim a fresh test run or agent-executed live API check.

### Steps

1. Add only allowlisted `GET /api/v1/sb` and `GET /api/v1/smoke` client methods and typed/runtime-validated reading models. Resolve routing from catalogue/detail device type, not a browser hint; unknown types remain unsupported rather than guessed.
2. Extend the shared telemetry service, Dashboard DTOs, frontend types/adapters and Page 07 selected-device detail for `sb`/`smoke`. Preserve existing `solar`/`avc` behavior and the shared NFC service without creating a new NFC Dashboard page or exposing card/person data as part of this phase.
3. Join reading `dev_eui` to catalogue `device_id`; reading `device_id` is the friendly network name, not the stable key. Preserve recorded time, `application_id`, gateway, RSSI/SNR and separate local fetch time.
4. Preserve smoke numeric `status`/`state`; preserve `sb` numeric `voltage`, `visible`, `ir`, `co2`, `voc`, and `f_cnt`. Show uncertain sensor values as qualified raw fields without guessed units or enums. Do not apply Solar voltage units to `sb`, treat `f_cnt` as packet-delivery rate, or convert raw smoke codes to alarm booleans.
5. Forward explicit validated `start`, `stop`, and bounded `limit`; preserve inclusive bounds, newest-first source ordering, zeros, missing values, partial coverage and optional truncation metadata. Chart adapters may sort chronologically. No invented `/latest`, uncontrolled fleet polling, automatic unbounded backfill or full-history claim.
6. Reuse authenticated Dashboard endpoints, session/proxy allowlists and error sanitization. Keep all source fetching/calculation request-scoped/in-memory; no receiver, webhook registration, report/alert entity or database mirror.
7. Test typed dispatch, zero/empty/malformed samples, absent optional response fields under documented parser policy, identity mismatch, unknown types, explicit ranges, truncation and upstream failure. Prove a session remains valid when the IoT bearer is rejected, and smoke/raw `sb` data cannot activate alerts or the menu badge. Scope/update the historical Phase 10 T26 endpoint-absence assertions when the newly authorized paths are implemented; retain its no-mutation/no-secret protections and do not change stakeholder labels to satisfy obsolete tests.

### Exit criteria

- Page 07 can inspect honest live raw readings from both new types when available, and handles empty/unavailable sources without fake readings.
- Pages 03/11 can reuse normalized backend data without a second IoT client.
- No units, online status, fire state, compliance or authoritative thresholds are invented.

---

## Small Phase 25 — Delivered environmental foundation + derived ranking/floor-compliance supplement

**Priority:** P0/P1 real/derived data; other grid/alert interpretations remain gated.<br>
**Primary page:** Page03 only for the new supplement; Page01/heatmap remain untouched.<br>
**Depends on:** Completed Small Phases23–24 and the Phase25 mandatory implementation.<br>
**Execution status:** `MANDATORY BRANCH COMPLETE PER HANDOFF; SUPPLEMENT READY — NOT IMPLEMENTED`. Mandatory source/CO₂ results have their matching handoff; its historical tests are not new verification of the supplement. Actual room/floor/history availability affects widget data states, not permission to implement the tested read-only adapters.

**Delivered foundation:** [Original Phase12 plan](bp2_phase12_page03_sb_co2_environment_upgrade.md) and [mandatory implementation handoff](bp2_phase12_page03_sb_co2_environment_upgrade_handoff.md): Solar/SB source/detail, CO₂ latest/history and bounded population summary, unit metadata and mapping boundary. Do not implement these tasks again or overwrite that historical handoff.

**Remaining scoped plan:** [Derived ranking/floor-compliance supplement](bp2_phase12_page03_derived_ranking_floor_compliance_supplement.md), 2026-10-03, with **new** matching handoff `bp2_phase12_page03_derived_ranking_floor_compliance_supplement_handoff.md`. Latest stakeholder decisions in KB§9.6 supersede the old ranking/compliance demo deferral, not the heatmap/Overview mapping or authoritative alert gates.

**Refresh audit — source inspected, not runtime capture:** existing IAQ mount/source/preset/manual requests remain event-driven without an observed source-level timer/feedback loop. Keep this mechanism; no 5-minute polling or refresh-only refactor. The supplement's 5-minute **calculation buckets** are statistical resolution, not device sampling/polling cadence.

### Remaining steps

1. Centralize/read typed immutable application defaults CO₂1000ppm/temperature27°C/humidity70%. “Ngưỡng cảnh báo”, compliance calculator and footer consume the same config/version. Reconcile only the three warning rows; keep edit disabled for both roles, no runtime editor/database writes. Sửa/lưu ngưỡng remains Small Phase21.
2. Derive top6 room CO₂ ranking from existing bounded24h/latest1 SB results, equal-device room mean, actual floor/room identity and explicit subset/source-time coverage. No additional ranking telemetry fan-out, no room-to-cell/primary-grid binding requirement, no fake room names when room metadata missing.
3. Implement bounded7d floor history/statistics in NestJS: equal-device per-metric means within the same5-minute statistical bucket, **three-metric AND** with inclusive configured upper limits, weighted durations/full-window denominator; no lower limits, interpolation or cross-floor borrowing. Preserve source/unit metadata; statistical floor composition does not create a virtual SB temperature/humidity record.
4. Rename only the requested component to “% thời gian đạt chuẩn”. Gaps/missing metric buckets fail; wholly no-data floor`—`, not0%. Distinguish complete-data gaps from API errors/truncation/unattempted floors; disclose population partiality. Whole-building row aggregates only evaluable floor-time and discloses excluded floors.
5. Preserve current aligned layout, KPI/detail/picker/heatmap, stakeholder labels outside the explicit allowlist, all other pages and refresh mechanisms. Add only initial bounded widget/config reads; no callbacks/timers that trigger repeated fetch. Verify calculations/null/coverage, read-only auth/load bounds/UI regressions and create the supplemental handoff.

### Supplement exit criteria

- Table/math/footer use one default config; equality passes; all three metric means must pass in the same time bucket.
- Full7d denominator includes missing intervals; no-data floors display`—`, legitimate data-with-missing-metric cases0%, unavailable/truncated results have distinct null reasons.
- Ranking and floor calculations reuse real bounded raw paths, preserve provenance, and need only their own room/floor metadata; no fabricated mapping/demo fallback.
- Current IAQ cadence and other pages/labels remain protected; no editor, report/config persistence, active Page06 alert registry or new roles/accounts.
- Scoped tests/QA and separate matching handoff supply delivery evidence. Grid live migration, IAQ score and broader alert policies remain explicitly conditional, not silently marked complete.

---

## Small Phase 26 — Page 02 deterministic Energy demo completion

**Priority:** P4 explicitly approved demo; before cross-page integration.<br>
**Primary page:** Page 02 Energy only.<br>
**Depends on:** Completed Small Phases 09/12; reuses the existing Overview Energy demo convention where suitable.<br>
**Execution status:** `READY FOR SCOPED PLANNING/IMPLEMENTATION`; restored unfinished scope after Small Phase 19 was narrowed to Parking-only.

### Steps

1. Re-audit Page 02 Energy KPI/chart placeholders against the approved page structure. Reuse an approved Page 02 mockup, or request that page's mockup if a detailed layout cannot be established from available references.
2. Add versioned deterministic Energy fixtures/selectors for the required KPI cards, hourly chart/baseline and recent-day chart. Fixture reference times and range behavior must be repeatable; no random live-looking measurements or fabricated smart-meter endpoint.
3. Replace only Energy placeholders and required Energy wiring in the mixed Energy/Water page. Preserve all Water components, source queries, calculations and stakeholder-edited Water labels. Preserve the completed Page 01 Energy presentation and Page 09 Parking.
4. Show widget-level `demo` provenance; do not mark the whole mixed page demo or include Energy demo values in Water/live aggregates or authoritative alerts.
5. Verify fixture arithmetic, repeated reload/range behavior, chart/table accessibility, current design alignment and the no-touch audit for Water, IoT, environment, Alerts and Parking. No database changes or source calls are needed.

### Exit criteria

- Page 02's required Energy widgets are complete and unmistakably demo, while Water remains on its existing live/raw path.
- No Energy hardware integration or unrelated completed-page changes are introduced.

---

## Small Phase 27 — Optional read-only webhook inspection

**Priority:** Optional integration/operations capability, not an existing frozen Dashboard widget.<br>
**Primary consumer:** A stakeholder-selected inspection surface, if needed; no new Dashboard page by default.<br>
**Depends on:** Small Phase 23/current authenticated backend boundary and the product/visibility decision below.<br>
**Execution status:** `OPTIONAL — WAITING FOR STAKEHOLDER SCOPE/VISIBILITY DECISION`; the handover permits read-only integration but does not require a webhook administration UI or grant either role webhook management abilities.

### Entry gate and steps

1. Confirm whether server-only diagnostics or an in-scope Dashboard inspection view is actually needed, which registration fields may be exposed, and which of the existing two roles may inspect them. Do not assume Manager's manual-data abilities cover upstream integration settings. No third role or `manage/all` grant.
2. If selected, add typed/runtime-validated `GET /api/v1/webhooks` with optional allowlisted `device_type` (`solar | avc | nfc | sb | smoke`) and `GET /api/v1/webhooks/{id}` for known opaque IDs. Keep the plural route and fixed GET allowlist; do not probe unknown IDs.
3. Return only approved sanitized registration metadata. List/detail do not contain a secret; receiver URLs may contain sensitive paths/query credentials and require redaction and deliberate visibility. Fetching a registration must never visit its receiver URL or send a test.
4. Keep authenticated application authorization and server-side bearer handling; preserve optional response fields/meta, empty results, detail `WEBHOOK_NOT_FOUND`, schema drift and sanitized upstream auth/network errors.
5. Implement **no** register/update/delete/test method, receiver endpoint, notification delivery, or operational status derived merely from a registration. A registration is not proof of successful delivery or gateway/sensor health.
6. Test with mocks and explicitly assert the absence of all upstream mutation/test calls and secrets/receiver credentials in client responses or logs. Ask for the relevant page mockup only if a selected UI surface needs a detailed layout.

### Exit criteria

- The selected inspection capability is read-only, least-privilege, sanitized and scope-approved.
- If not selected, record this phase as optional/deferred and omit it from required integration/acceptance dependencies. Do not implement it to satisfy an assumed completeness requirement.

---

## 4. Remaining / waiting execution order — 2026-10-03

**Not remaining:** Small Phases **09–16, 19, 23 and 24**, plus **Small Phase25 mandatory source/CO₂ branch**, have completed implementation handoffs. Identity, Parking, catalogue/raw bridge and Page03 SB detail/KPI must not be implemented again. Phase25 is still listed only for its new scoped ranking/compliance/default-config supplement. Page07's separate render/paging/5-minute-refresh fix plan does not reopen phase24 or extend refresh elsewhere. IAQ retains its current cadence; statistical5-minute buckets are not polling.

There are **7 required remaining phases** (including final acceptance) and **1 optional candidate**. Stable IDs are deliberately not execution-order numbers. This is the default data-priority order; Small Phase 17 and Energy phase 26 can be planned independently because unresolved IoT contracts do not block them.

| Order | Small Phase | Remaining result | Status / dependency |
| ---: | --- | --- | --- |
| 1 | **25 — IAQ derived-widget supplement** | Room CO₂ ranking; three-metric floor compliance; one read-only default config1000/27/70; preserve current refresh | **SUPPLEMENT READY — NOT IMPLEMENTED**; mandatory branch complete; actual room/floor/history quality determines honest data states; editor/saving deferred21 |
| 2 | **17 — Manual PCCC CRUD** | Page 11 extinguisher expiry/inspection and drill/document records; Manager create/update/delete, Viewer read | **READY**; identity completed; minimum fields/UI reference needed in detailed plan |
| 3 | **18 — PCCC grid + conditional smoke adapter** | Shared 2D fire grid, KPIs, live raw detector detail and manual-data composition | **WAIT 17**; raw bridge delivered in 24; zone state remains demo until code/mapping gates close |
| 4 | **26 — Page 02 Energy demo** | Finish only missing deterministic Energy KPIs/charts; protect existing Water | **READY**; independent of new IoT APIs |
| Optional, before 20 if selected | **27 — Webhook inspection** | Only list/detail GETs with approved visibility and sanitized metadata | **OPTIONAL / WAIT SCOPE DECISION**; not a blocker when unselected |
| 5 | **20 — Cross-page integration** | Seven-page consistency, aligned UI, provenance, auth and bounded raw/in-memory paths | **WAIT 17/18/25/26**; conditional branches may use approved fallback |
| 6 | **21 — Report/alert PostgreSQL persistence** | Justified aggregates/config/state/history; authorized threshold editing/saving with same Page03 config boundary | **DEFERRED / WAIT 20 + CONTRACT/VOLUME GATES**; last implementation phase |
| 7 | **22 — Final acceptance/hardening** | Seven-page acceptance, authorization/security/provenance/accessibility and regression evidence | **WAIT 20 + 21 delivery or explicit approved deferral decision**; closeout only |

**Recommended next selected task: Small Phase25 supplement.** Read [its new scoped plan](bp2_phase12_page03_derived_ranking_floor_compliance_supplement.md) and reuse the delivered Phase12 foundation; do not start by redoing the original mandatory tasks. Small Phase17 is independently ready. This update is documentation only; supplement implementation, threshold editing/PG persistence and unrelated page changes have not been performed or authorized by this planning pass.

---

## 5. Decisions and external answers that can change sequencing

### 5.1 Closed decisions — do not reopen as pending work

- Small Phase 16 local identity/session implementation and the **exact two-role CASL decision** are complete. Manager may create/update/delete PCCC manual records when phase 17 supplies the domain; Viewer reads only. Both are denied device display-position update/delete. Manager's future AlertConfig update ability is not permission to activate unimplemented configuration or upstream webhook operations.
- Identity/session PostgreSQL belongs to completed phase 16; manual PCCC PostgreSQL belongs to phase 17. These exceptions do **not** advance IoT-derived report/alert persistence from phase 21.
- Solar battery voltage/ambient temperature/relative humidity now have documented V/°C/% meanings, and AVC cumulative/instantaneous water descriptions are clarified. Their older generic unit-pending blocker is replaced by the narrower outstanding quality/code/reset questions below.
- `sb.co2`/`voc`, raw smoke readings and nullable source room IDs exist in the documented schema; an owner-provided SB sample also confirms populated CO2. Standard measurement units may now be assumed per KB §9.3.1, including CO2 ppm. Technical units/calibration are stakeholder follow-up, not a CO2 integration blocker; smoke code meanings, source coverage and physical/grid mapping remain unconfirmed.
- Parking is completed. The unfinished Page 02 Energy scope now has its own phase **26**, not phase 19 or identity phase 16.
- Page03 statistical compliance is decided: floor means, simultaneous three-metric AND, inclusive upper defaults1000ppm/27°C/70%, full denominator/gaps fail and wholly no-data floor`—`. Read-only config now, authorized editing/saving in21. These choices are not new open baseline questions for the supplement and do not activate authoritative Alert rules.

### 5.2 External contract/product gates still open

| Gate | Affected work | Required answer before authoritative use |
| --- | --- | --- |
| Smart-building technical verification | Follow-up for25; stable report keys/rules in21 | Owner verifies units/scales/calibration later. Provisional ppm and Page03 statistical criteria are approved under KB§9.3.1/9.6; do not block the supplement on hardware review. Preserve assumptions/provenance; no battery%, authoritative IAQ/alerts or early report persistence. |
| Actual room/floor metadata | Data availability for25 supplement | Ranking requires actual source room/floor metadata; floor compliance requires actual floor only, not room/cell. No fallback floor0→T4/T6 or demo IDs. Aggregation policies are in the scoped supplement; missing assignments produce honest empty/unmapped states, not a requirement to implement placement editing. |
| Source-room/grid mapping | Conditional heatmap/Overview branch of25 and live zone branch of18 | Verified room/zone-to-cell identities, binding policy and coordinate frame only if needed. This gate must not be applied to descriptive ranking or floor compliance, which do not render grid cells. |
| Smoke state and zone semantics | Conditional live branch of 18; any later fire alerts | Numeric `status`/`state` dictionary, normal/alarm/fault meanings, severity/latching/clearing behavior, detector-to-zone mapping and freshness/no-data policy. A reading API alone does not close this gate. |
| Existing sensor interpretation gaps | 23/25 and future derived Water/IoT consumers | Solar state codes/calibration; AVC counter reset/rollover, flag domains and `temp_c` meaning. No daily consumption, valve/leak alarm or battery conversion without the relevant answers. |
| Authoritative alert rules and data quality | IAQ score/broader Alert behavior in20/21 | Remaining numeric danger/baseline rules, alert duration/unit, cadence, quality, distinct-device state and `STALE`/`NO_DATA` policy. Page03 descriptive compliance defaults/AND/gap rules are already approved; they do not populate the authoritative alert registry or settle these separate gates. |
| Missing optional Page 07/environment fields | Future selected feature only | Pressure source, gateway health, firmware, OTA, calibration capabilities, battery-percentage conversion and packet-delivery denominators. New `sb.f_cnt` or webhook registrations do not supply those contracts. |
| Source load/operational guidance | All new raw paths; 21 | Rate/load guidance, recommended sampling/polling cadence, source retention and permitted time-window retrieval. Existing app caps remain app policy, not inferred upstream limits. |
| Persistence necessity | 21 | Stable relevant schemas/units, sufficient live device/data volume, known refresh/retention behavior and stakeholder-approved real Dashboard consumers. New endpoints are not evidence that persistence is now needed. |
| Optional webhook inspection visibility | 27 | Whether inspection is needed, its server/UI surface and allowed fields/roles; sanitize receiver URLs and do not grant upstream management to Manager by implication. |
| Detailed UI references | Planning for 17/18/26 and any selected 27 UI | Use existing aligned design and approved page reference. If insufficient, request the specific page mockup (especially Page 11 PCCC) before describing a new layout; no new mockup is needed merely to update this backlog. |

An unresolved item must not block unrelated phases. Keep its adapter boundary, fetch only bounded approved raw ranges, calculate in NestJS memory where needed, and render an explicit unavailable or KB-approved deterministic demo state. Track still-unfinished authoritative branches in the handoff even if raw/demo scope is delivered. Do not create IoT-derived report/alert PostgreSQL tables or jobs before Small Phase 21.

### 5.3 Webhook delivery candidates — not yet authorized Small Phases

All **six** upstream webhook operations are accounted for: list/detail GET inspection is candidate phase 27; the other four and a receiving integration stay outside the current required implementation scope. The API handover documents capability, not a user instruction to execute it.

| Candidate | Potential future tasks | Current status / entry gate |
| --- | --- | --- |
| **W1 — Registration lifecycle and test delivery** | `POST /api/v1/webhooks`, `PUT /api/v1/webhooks/{id}`, `DELETE /api/v1/webhooks/{id}`, `POST /api/v1/webhooks/{id}/test`; choose `tia`/`discord`, approved receiver URLs, least-privilege abilities and safe secret handling | **HOLD — explicit stakeholder authorization required** for upstream writes and real outbound tests. No current role grants these actions; do not add an Admin role or silently extend Manager. Creation returns the secret once; list/detail/update do not return it. Partial update changes only supplied fields; deletion is 204 without a JSON body; a test's HTTP 200 does not prove delivery (`data.delivered` must be checked). |
| **W2 — Verified webhook receiver / push ingestion** | Signed `tia` receiver, safe secret storage, runtime payload validation, handling of `meta.test`/empty readings, idempotency/retries and a bounded integration adapter | **HOLD — authorization + delivery contract needed**. Confirm full JSON envelope/readings location, `X-TIA-Signature` algorithm/canonicalization/encoding, verification procedure, event/dedup IDs, cadence/batching/retries/timeouts and secret rotation/recovery policy with IoT team. Do not assume HMAC/SHA or replace working raw fetch with guessed push delivery. `discord` notification integration is a separate product decision, not proof of a Dashboard alert channel. |

Neither W1 nor W2 is assigned an executable Small Phase or required for Big Phase 02 acceptance now. If later selected, re-plan their scoped dependencies before cross-page integration and preserve phase 21 as the last report/alert implementation boundary. Continue testing with raw GET plus in-memory calculations in the meantime; do not introduce early raw telemetry mirrors, receiver event-history tables or operational alert persistence.

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
- No webhook register/update/delete/test execution or receiver integration without a separately approved phase; phase 27, if selected, is GET inspection only.
- No third role, new accounts/password resets, or assumed Manager permission to change upstream integration settings.
- No unnecessary changes to completed-page stakeholder text, labels, fixtures or layouts. New phased data integration must have an explicit affected-component allowlist and regression evidence.

---

## 7. Mandatory coding-agent handoff at the end of every selected Small Phase

**Coding agent: after implementing and verifying the selected Small Phase, create its matching `web/doc/*_handoff.md` file before declaring it complete or starting another phase.** Record the stable Small Phase ID and detailed-plan filename, delivered versus conditional/deferred scope, changed files, protected-page/text audit, exact tests/results (including tests not run), API/provenance/permission boundaries, database/migration effects and remaining external gates. Update this roadmap's execution status only from that evidence. Do not claim raw `sb`/smoke retrieval completes authoritative IAQ/fire alerts, or that a documented webhook operation has been executed/authorized.
