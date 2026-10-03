# Big Phase 02 — Phase 02: Dashboard Application API for the Real Device Catalogue

> **Project:** GIS — UIT Building E Digital Twin  
> **Big Phase:** 02 — Dashboard  
> **Sub-phase:** 02  
> **Plan date:** 2026-09-26  
> **Status:** PLANNED — NOT IMPLEMENTED  
> **Implementation owner:** Coding agent  
> **Primary targets:** NestJS application API and Next.js Page 07 — Hệ thống IoT  
> **Source roadmap item:** `dashboard_big_phase_small_phase_plan.md`, formerly listed as Small Phase 10  
> **Depends on:** Big Phase 02 / Phase 01 — Dashboard Foundation and Provenance  
> **Dashboard authority:** `Dashboard_Knowledge_Base.md`  
> **IoT contract authority:** `IoTBackend_API_HandOver.md`  
> **Phase 01 evidence:** `bp2_phase01_dashboard_foundation_and_provenance_handoff.md`

---

## 1. Purpose

Implement the first real-data vertical slice of Big Phase 02: a Dashboard-focused, read-only device catalogue for Page 07.

This phase must:

- reuse the existing NestJS IoT integration and its allowlisted upstream `GET /api/v1/devices` capability;
- expose a normalized Dashboard application API rather than upstream snake_case payloads;
- preserve device identity, type, activity flag, source timestamps, fetch time, floor, and source X/Y/Z coordinates;
- connect Page 07 to that application API through the existing Next.js proxy boundary;
- render an honest searchable/filterable device list with loading, empty, unavailable, partial-quality, and error behavior;
- attach the Phase 01 `live` provenance contract to successfully fetched catalogue data;
- leave telemetry, IoT-health derivation, online/offline state, and all unsupported fields for later phases.

This document is an implementation handover plan only. The planning agent must not implement the source changes below.

---

## 2. Required reading and authority order

Before editing, the coding agent must read:

1. `web/AGENTS.md` and the relevant local Next.js 16 documentation under `web/node_modules/next/dist/docs/`;
2. `web/doc/Dashboard_Knowledge_Base.md`;
3. `web/doc/IoTBackend_API_HandOver.md`;
4. `web/doc/dashboard_big_phase_small_phase_plan.md`;
5. `web/doc/bp2_phase01_dashboard_foundation_and_provenance.md`;
6. `web/doc/bp2_phase01_dashboard_foundation_and_provenance_handoff.md`;
7. the current backend IoT/device source, tests, configuration, and application error filter;
8. the current Page 07 source and Phase 01 shared Dashboard contracts/components.

Authority rules:

- the latest explicit stakeholder decision wins;
- `Dashboard_Knowledge_Base.md` controls Dashboard scope and data-mode semantics;
- `IoTBackend_API_HandOver.md` controls the exact upstream method, path, fields, and safety rules;
- current repository/runtime evidence controls what is already implemented;
- this plan controls the work boundary for Big Phase 02 / Phase 02;
- proposal values and old screenshots are visual references only, never live data contracts.

If an upstream field or behavior differs from `IoTBackend_API_HandOver.md`, stop that affected integration path, record the evidence, and update the authoritative handover before coding against a new contract.

---

## 3. Verified repository baseline

The planning audit on 2026-09-26 found:

- Current branch: `feature/dashboard`.
- Current audited HEAD: `558cc542db6d273a9434c94d4a065960feeb9ebf`.
- The working tree contains a pre-existing modification to `GISUIT.code-workspace`; it is user-owned and must not be changed by this phase.
- The Phase 01 handoff records its implementation at commit `17989901c4e25e1bc2aabd9ba06aaeb3ffd6ffcd`; the coding agent must use the current repository, not assume that older handoff commit is still HEAD.
- NestJS 11 is under `backend/`; Next.js `16.3.4` and React `19.2.8` are under `web/`.
- `IotClientService` already has typed, read-only operations for the five approved upstream GET endpoints.
- `IotService.getFullCatalogue()` already performs an unfiltered upstream catalogue read, but currently returns the raw upstream envelope.
- `IotService.getFloorDevices()` already performs floor-scoped reads and the documented development fallback from requested floors 4/6 to upstream floor level 0.
- `IotMapperService` already centralizes device-category mapping, Building E/floor resolution, X/Y/Z validation, duplicate handling, and current floor mapping modes.
- The existing `FloorDeviceView` intentionally omits `create_timestamp`, `last_updated_timestamp`, and `is_active`, so it is insufficient as the final Dashboard catalogue DTO.
- The existing application routes are primarily viewer-oriented:
  - `GET /api/v1/buildings/:buildingId/floors/:floorId/devices` is mode-aware and returns different established contracts for managed/fixture versus IoT mode;
  - `GET /api/v1/iot/buildings/:buildingId/floors/:floorId/devices` is the floor/viewer-focused in-memory IoT projection;
  - `GET /api/v1/iot/devices/:deviceId/telemetry` is telemetry work owned by the later Dashboard phase.
- The existing Next.js catch-all route `web/src/app/api/devices/[...path]/route.ts` proxies application requests to NestJS and keeps the IoT host/token out of browser code.
- Page 07 currently renders foundation-only KPI placeholders and an `UnavailableDataState`.
- Phase 01 created the shared `DashboardDataMode`, `DashboardAvailability`, `DashboardProvenance`, `DataModeBadge`, KPI card, and state components.
- Phase 01 did not create a shared Dashboard table component or a React component-test runner.
- PostgreSQL contains fixture/managed device bindings, display overrides, and floor-scoped sync state. In current `DEVICE_SOURCE_MODE=iot`, live floor catalogue data is fetched and mapped in memory; it is not synchronized into those tables.

The coding agent must re-check this baseline immediately before implementation and record any drift in the handoff.

---

## 4. Phase goal and user-visible result

At the end of this phase:

1. NestJS exposes one Dashboard-owned, read-only device-catalogue route backed by the existing IoT client.
2. Page 07 can display the real catalogue when `DEVICE_SOURCE_MODE=iot` and backend credentials are configured.
3. Users can search the loaded catalogue by opaque device ID and filter it by source device type; floor scope can be selected only through application floor identifiers.
4. Every displayed row preserves the approved source identity/type/activity/timestamps/floor/X/Y/Z fields.
5. The list and total-device KPI carry visible `live` provenance only after a successful upstream read.
6. Empty, unavailable, malformed/partial, and upstream-error conditions remain distinguishable.
7. The page does not claim that catalogue `is_active` means online, healthy, recently transmitting, or reachable.
8. No IoT data is persisted, no telemetry is queried, and no new upstream operation is introduced.

---

## 5. Non-goals

Do not implement any of the following in this phase:

- Page 07 telemetry/history, RSSI, SNR, gateway ID, last telemetry timestamp, solar, AVC, or NFC readings;
- authoritative online/offline, stale, health, heartbeat, or last-seen calculations;
- battery percentage, firmware, gateway health, packet-delivery rate, OTA, or calibration fields;
- alert configuration, alert evaluation, notification counts, or alert badges;
- Water, Energy, IAQ, Overview, Parking, or PCCC business data;
- report-data entities/jobs, aggregation, caching, TTL, retention, or PostgreSQL migrations;
- live-catalogue synchronization into `device_bindings` or `catalogue_sync_state`;
- changes to source/display override behavior;
- authentication or CASL;
- a generic upstream proxy or client-selected upstream path;
- upstream mutations of any kind;
- Page 04, 05, 08, or 10;
- a second chart library;
- demo fallback for the catalogue when live mode is unavailable.

An unavailable live catalogue must remain unavailable. It must not silently become fixture/demo data in this phase.

---

## 6. Decisions frozen for Phase 02

### 6.1 Persistence decision

The Phase 02 catalogue is **request-time and in-memory**.

- Do not add a PostgreSQL entity, migration, sync job, or cache table.
- Do not write live catalogue results into existing fixture/managed device tables.
- Do not update `catalogue_sync_state` for Dashboard reads.
- Do not merge live source coordinates with application display overrides.
- A future phase may explicitly approve persistence, but this phase must not imply that live catalogue persistence already exists.

This is the least-expansive path that satisfies the Page 07 catalogue goal and matches the current IoT-mode implementation.

### 6.2 Integration boundary

The request path is:

```text
Page 07 client component
    -> Next.js same-origin application proxy
    -> NestJS Dashboard catalogue endpoint
    -> existing IotService / IotClientService / IotMapperService
    -> approved upstream GET /api/v1/devices[?floor_level=<integer>]
```

Rules:

- The browser must never receive or construct the upstream base URL.
- Only NestJS may read `IOT_API_MASTER_TOKEN`.
- Reuse `IotClientService`; do not create a second HTTP client.
- Reuse centralized category and floor mapping logic; do not create a Dashboard-only `G -> 0` guess.
- No browser parameter may select an arbitrary upstream path or raw `floor_level`.

### 6.3 Application route

Add one Dashboard-owned route, following current NestJS `/api/v1` conventions:

```http
GET /api/v1/dashboard/buildings/:buildingId/iot/devices
GET /api/v1/dashboard/buildings/:buildingId/iot/devices?floorId=4
```

Contract:

- `buildingId` is validated and currently supports Building `E` only.
- `floorId` is optional and is an application/viewer floor ID, not a raw upstream integer.
- Omitting `floorId` intentionally uses the existing unfiltered full-catalogue read.
- Supplying `floorId` resolves through the centralized mapper and uses the scoped upstream query.
- `floorId=G` remains a controlled `400` until an approved mapping exists.
- Unknown query parameters are rejected by the existing whitelist/forbid behavior where DTO validation applies.
- The route is GET-only and declares `Cache-Control: no-store` unless current framework guidance requires an equivalent explicit dynamic/no-cache mechanism.

The Next.js caller should use the existing same-origin proxy shape:

```text
/api/devices/dashboard/buildings/E/iot/devices
/api/devices/dashboard/buildings/E/iot/devices?floorId=4
```

Do not add a second Next.js proxy solely for Dashboard.

### 6.4 Filter ownership and upstream load

Support only filters that have a clear source/application meaning:

- building scope: server route path;
- floor scope: server query, because it changes the upstream request;
- source device type: local frontend filtering on the already loaded response;
- opaque device-ID search: local frontend filtering on the already loaded response.

Do not refetch upstream on every search keystroke or device-type selection. Do not invent server pagination/cursors; the upstream catalogue contract does not provide them. If upstream metadata says the response is truncated, show that quality caveat and do not claim the list is complete.

### 6.5 Activity semantics

`is_active` is catalogue registration/activity metadata. It is **not** an online/health signal.

The UI may display a label such as `Đang hoạt động trong danh mục` for `active: true`, but it must not use:

```text
Online
Offline
Mất kết nối
Heartbeat OK
Healthy
```

as a conclusion from catalogue data alone.

The existing Page 07 “Đang hoạt động (Online)”, “Mất kết nối (Offline)”, and “Tỷ lệ trực tuyến” placeholders must remain unavailable or be relabeled so they do not turn `is_active` into a network-health claim. Phase 03 owns telemetry-backed Page 07 core data.

### 6.6 Floor and development-fallback semantics

- Preserve upstream `sourceLocation.floorLevel` exactly.
- A successful direct floor query may map source floor 4 to display floor `4`, and source floor 6 to display floor `6` under current approved rules.
- Under `TEST_CURRENT_FLOOR_4_6_V1`, a fallback response from upstream floor 0 may be displayed in the requested Floor 4/6 scope only when explicitly marked as a development fallback.
- Never rewrite the source floor from 0 to 4/6.
- Never describe fallback placement as verified physical installation data.
- Full-catalogue items whose source floor has no approved viewer mapping must use `displayFloorId: null` or the repository's equivalent explicit unmapped representation.

---

## 7. Dashboard application response contract

The exact class names may follow repository conventions, but the public response must express the following concepts without exposing upstream snake_case:

```ts
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

The coding agent may use DTO classes plus interfaces as appropriate, but must preserve these semantics.

### 7.1 Field mapping

| Upstream field | Dashboard field | Rule |
| --- | --- | --- |
| `device_id` | `externalDeviceId` | Opaque non-empty string; do not enforce UUID/EUI format |
| `device_type` | `sourceDeviceType` | Preserve trimmed source value |
| mapped type | `category` | Reuse centralized category mapping; unknown remains `unknown` |
| `is_active` | `active` | Preserve boolean; do not reinterpret as online |
| `create_timestamp` | `sourceCreatedAt` | Valid ISO-8601 source timestamp |
| `last_updated_timestamp` | `sourceUpdatedAt` | Valid ISO-8601 source metadata timestamp, not telemetry last-seen |
| `install_x/y/z` | `sourceLocation.x/y/z` | Preserve finite values without unit/axis claims |
| `install_floor_level` | `sourceLocation.floorLevel` | Preserve source integer |
| successful app read time | `provenance.fetchedAt` | Generate once per response in NestJS |

Do not return the bearer token, authorization header, upstream base URL, raw upstream errors, internal stack traces, or arbitrary raw metadata.

### 7.2 Validation and quality behavior

- Validate the upstream envelope before mapping.
- Treat `meta` as tolerant: `count` and `truncated` may be absent.
- Reject or skip malformed items using one documented policy; do not fabricate missing values.
- At minimum, accepted items require non-empty ID/type, boolean `is_active`, valid source timestamps, finite X/Y/Z, and an integer source floor level.
- Keep the first valid record for a duplicate device ID and increment `duplicateCount`.
- When some records are skipped/duplicated or `truncated === true`, return accepted rows with a clear provenance caveat and summary rather than claiming full completeness.
- When a successful upstream response contains zero accepted records and zero malformed records, return `availability: 'empty'`.
- If all received rows are malformed, treat the upstream contract as failed/partial according to the established safe error policy; do not present a clean empty catalogue.
- `fetchedAt` must be a valid server-generated ISO-8601 timestamp and must not be copied from source metadata.

### 7.3 HTTP/error behavior

Expected application behavior:

| Condition | Result |
| --- | --- |
| Valid live response with accepted devices | `200`, `availability: ready`, live provenance |
| Valid live response with zero devices | `200`, `availability: empty`, live provenance |
| Invalid building/floor input | Controlled `400`; upstream not called |
| `DEVICE_SOURCE_MODE=disabled` | Controlled `503` / unavailable response; no live badge |
| `DEVICE_SOURCE_MODE=fixture` | Controlled unavailable result for this live-only endpoint; never relabel fixture rows as live |
| Missing backend IoT credential | Controlled `503`; safe client message |
| Upstream auth/network/timeout/invalid JSON/schema failure | Controlled `502` or existing equivalent; safe client message |

Error payloads must use stable application error codes where practical. The browser must not receive instructions such as “check master token,” raw upstream URLs, stack traces, or upstream response bodies.

---

## 8. Target source organization

Adapt naming to the current repository, but keep responsibilities separate. Expected ownership:

```text
backend/src/
├── app.module.ts                                      # Register Dashboard module
├── dashboard/
│   ├── dashboard.module.ts
│   ├── dashboard-iot.controller.ts                    # GET application route only
│   ├── dashboard-iot-catalogue.service.ts             # Mode gate + response assembly
│   └── dto/
│       ├── dashboard-iot-catalogue-query.dto.ts
│       └── dashboard-device-catalogue-response.dto.ts
└── iot/
    ├── iot.service.ts                                 # Reused/extended orchestration
    ├── dto/iot-devices.dto.ts                         # Raw contract only if required
    └── services/iot-mapper.service.ts                 # Reused/extended normalization

web/
├── test-bp2-phase02.mjs                               # Frontend adapter/contract regression
└── src/
    ├── app/dashboard/iot/page.tsx                     # Remains Server Component
    ├── components/dashboard/iot/
    │   ├── IotCataloguePanel.client.tsx               # Fetch lifecycle and local filters
    │   ├── IotDeviceCatalogueTable.tsx
    │   └── IotCatalogueFilters.tsx
    ├── lib/dashboard/
    │   └── iot-catalogue-api.ts                       # Same-origin API adapter
    └── types/
        └── dashboard-iot.ts                           # Frontend application DTO
```

This is a responsibility map, not permission to create empty layers. If the existing source supports a smaller equivalent without mixing viewer and Dashboard contracts, use it and explain the deviation in the handoff.

Do not replace or mutate the established viewer `FloorDeviceResponse` contract just to satisfy Dashboard fields. Shared raw parsing/category helpers may be reused, while the public Dashboard DTO remains explicit.

---

## 9. Frontend behavior

### 9.1 Server/client boundary

- Keep `web/src/app/dashboard/iot/page.tsx` as a Server Component.
- Isolate fetch lifecycle, retry, filter inputs, and table interaction in the smallest necessary Client Component.
- Use the existing Next.js same-origin proxy; do not import backend environment secrets into client code.
- Use `AbortController` and request-generation protection so stale floor responses cannot replace a newer selection.
- Do not add `"use client"` to the whole Dashboard layout/page tree.

### 9.2 Page 07 catalogue states

The catalogue section must render exactly one primary state:

- loading: `LoadingState`;
- successful and non-empty: catalogue summary + filters + table;
- successful and empty: `EmptyDataState`;
- source mode disabled/fixture or backend not configured: `UnavailableDataState`;
- request/upstream/schema failure: `ErrorState` with a safe retry action.

Keep existing shared Phase 01 components rather than creating visually inconsistent replacements.

### 9.3 Catalogue presentation

Minimum visible columns/content:

- device ID;
- source device type/category;
- catalogue activity label;
- source floor;
- display floor/mapping status when available;
- source-created timestamp;
- source metadata-updated timestamp;
- X/Y/Z source coordinates;
- explicit development-fallback or unmapped indicator where applicable.

Requirements:

- labels are Vietnamese; identifiers/type values may retain source spelling;
- timestamps use a deterministic locale display and retain full value accessibly, such as via `title` or detail text;
- zero coordinates are valid values, not missing data;
- long opaque IDs remain readable/copyable without breaking the layout;
- narrow viewports may use horizontal scrolling or a compact row/card equivalent;
- the table/list is keyboard reachable and headers/labels are accessible;
- local search is case-insensitive and does not validate IDs as UUID/EUI;
- type options are derived deterministically from loaded items;
- filter results of zero show a filter-empty message distinct from an empty upstream catalogue.

### 9.4 KPI and provenance behavior

- Connect “Tổng số thiết bị” only to `summary.acceptedCount` from a successful response.
- Give that KPI and the catalogue section a `live` provenance object using the response `fetchedAt` and caveats.
- A raw upstream `meta.count` must not replace `acceptedCount` unless the contract proves equivalence after validation/deduplication.
- Do not calculate online/offline rate in this phase.
- Do not show a live badge while loading, unavailable, or error.
- If the result is partial/truncated, place the caveat near the summary/list; do not hide it only in a tooltip.

---

## 10. Implementation checkpoints

### Checkpoint A — Re-audit and lock contracts

1. Record branch, HEAD, and working-tree status.
2. Read all required sources in Section 2.
3. Inspect the current IoT client/service/mapper, existing controllers, exception filter, proxy route, Page 07, and Phase 01 contracts.
4. Confirm the upstream catalogue contract still includes ID/type/timestamps/is_active/X/Y/Z/floor.
5. Confirm no newer approved `G` mapping, online semantics, or persistence decision exists.
6. Record pre-existing changes and preserve them.

**Exit:** actual extension points, unchanged scope, and current source contract are documented.

### Checkpoint B — Dashboard DTO and catalogue mapper

1. Add the application-facing response/query DTOs.
2. Reuse centralized category mapping.
3. Implement strict item validation and normalized field mapping.
4. Preserve opaque IDs, source timestamps, `active`, floor, and X/Y/Z.
5. Compute accepted/skipped/duplicate/truncated summary.
6. Generate one response fetch timestamp and live provenance.
7. Represent source, fallback, and unmapped floor assignment explicitly.

**Exit:** fixture-backed unit tests prove the Dashboard response without a network call.

### Checkpoint C — Read-only NestJS endpoint

1. Register the Dashboard module/controller/service using current conventions.
2. Add the exact GET route from Section 6.3.
3. Gate behavior by source mode so fixture/disabled modes cannot masquerade as live.
4. Use unfiltered catalogue reads only when `floorId` is omitted.
5. Use centralized floor resolution and scoped reads when `floorId` is provided.
6. Preserve and expose the existing development fallback as a caveat, not verified installation truth.
7. Sanitize stable error responses.
8. Add `no-store` behavior and Swagger/API documentation consistent with the repository.

**Exit:** controller/service tests cover full, floor-scoped, empty, partial, fallback, invalid, disabled, and failed-source cases; no database write occurs.

### Checkpoint D — Page 07 application adapter and UI

1. Add frontend types matching the application DTO, not the raw upstream response.
2. Add a same-origin fetch adapter with safe error classification.
3. Add the focused client catalogue panel with abort/stale-response protection.
4. Add ID search, type filter, and approved floor selection.
5. Add an accessible responsive device table/list.
6. Connect only the total-device KPI.
7. Keep unsupported Page 07 KPIs/components unavailable and remove any wording that equates `is_active` with online.
8. Reuse Phase 01 provenance and state components.

**Exit:** Page 07 renders honest live, empty, unavailable, and error states without telemetry claims.

### Checkpoint E — Verification and security audit

1. Run backend unit tests and production build.
2. Run the new frontend tests plus Phase 01 and relevant Phase 07/08 regressions.
3. Run web lint and production build.
4. Run backend e2e tests when the repository's PostgreSQL test environment is available; do not falsely report skipped tests as passed.
5. Inspect Page 07 at desktop and narrow widths.
6. Search browser-facing source/build output for the upstream base URL, bearer-token values/names, raw authorization headers, and direct upstream calls.
7. Verify no migration/entity/database write was added.
8. If credentials/environment permit, perform at most a minimal read-only live smoke test after mock/unit tests pass; record exact GET scope and sanitized result only.

**Exit:** acceptance evidence is complete and no secret, write path, or unsupported claim exists.

### Checkpoint F — Implementation handoff

Create the mandatory handoff file named in Section 16, including all required evidence and deviations.

**Exit:** Phase 02 is not complete until the handoff exists.

---

## 11. Automated testing plan

Use backend Jest/Nest testing for behavior. Follow the existing lightweight Node test convention for pure frontend adapters/contracts unless a React test runner is already added for another reason. Do not install a large test stack solely to assert static source text.

Minimum coverage:

| ID | Required test |
| --- | --- |
| BP2-P02-T01 | Dashboard catalogue route is GET-only and resolves through the existing IoT integration |
| BP2-P02-T02 | Omitting `floorId` performs exactly one unfiltered `/api/v1/devices` read |
| BP2-P02-T03 | `floorId=4` and `floorId=6` resolve to scoped integer upstream queries |
| BP2-P02-T04 | Building outside `E`, `floorId=G`, malformed floor, and unsupported floor fail before upstream access |
| BP2-P02-T05 | Opaque IDs including non-UUID/dummy values are preserved |
| BP2-P02-T06 | ID, type, activity, source timestamps, fetch time, floor, and X/Y/Z map correctly |
| BP2-P02-T07 | `sourceUpdatedAt` is not labeled or treated as telemetry last-seen |
| BP2-P02-T08 | Duplicate IDs keep the first valid item and increment `duplicateCount` |
| BP2-P02-T09 | Malformed item fields never become default/fabricated values and are reflected in quality summary/error behavior |
| BP2-P02-T10 | Empty successful upstream response yields `availability: empty` rather than an error or demo data |
| BP2-P02-T11 | Missing/tolerant `meta` fields are accepted; `truncated: true` produces a visible caveat |
| BP2-P02-T12 | Development floor-0 fallback preserves source floor 0 and is explicitly marked, never silently rewritten |
| BP2-P02-T13 | Unmapped full-catalogue floors do not guess a display floor, especially no implicit `0 -> G` |
| BP2-P02-T14 | `DEVICE_SOURCE_MODE=disabled` and `fixture` cannot return rows labeled `live` |
| BP2-P02-T15 | Missing credential, upstream 401, timeout/network error, invalid JSON, and schema drift yield sanitized application errors without secret/upstream leakage |
| BP2-P02-T16 | The implementation performs no PostgreSQL write and adds no migration/entity |
| BP2-P02-T17 | Frontend adapter calls only the same-origin application route with `cache: no-store` and supports cancellation |
| BP2-P02-T18 | Local ID search is case-insensitive and source-type filtering does not refetch upstream |
| BP2-P02-T19 | Stale/aborted floor responses cannot overwrite the latest selection |
| BP2-P02-T20 | Loading, ready, upstream-empty, filter-empty, unavailable, partial/truncated, and error states resolve distinctly |
| BP2-P02-T21 | Total-device KPI uses accepted normalized rows, preserves zero, and is not rendered before successful data |
| BP2-P02-T22 | Catalogue `active` never produces Online/Offline/health/heartbeat conclusions |
| BP2-P02-T23 | Unsupported telemetry, battery, firmware, gateway, OTA, calibration, and packet fields are absent or explicitly unavailable |
| BP2-P02-T24 | Page 04, 05, 08, and 10 remain absent; Dashboard still mounts no Unity runtime |
| BP2-P02-T25 | Client-facing source contains no IoT host, bearer token, authorization secret, or arbitrary upstream-path parameter |

Expected verification commands, adapted only when repository scripts require it:

```text
npm --prefix backend test -- --runInBand
npm --prefix backend run build
npm --prefix backend run test:e2e
node web/test-phase07.mjs
node web/test-phase08.mjs
node web/test-phase09.mjs
node web/test-bp2-phase02.mjs
npm --prefix web run lint
npm --prefix web run build
```

If the coding agent adds package scripts, preserve Phase 01 coverage. Prefer a dedicated script such as `test:bp2:p02` and make the aggregate `test` command run all applicable Dashboard phase tests rather than replacing Phase 01 tests.

Never report a command as passed unless it executed successfully in the current working tree. Record environment-dependent skips and their reason.

---

## 12. Manual verification matrix

Verify at minimum:

1. `/dashboard/iot` initially renders a clear loading state and then exactly one terminal state.
2. A successful catalogue shows real device rows, a correct accepted-count KPI, and visible fetch/provenance information.
3. Opaque/dummy-style device IDs display and filter correctly.
4. Type filtering and ID search work without an extra network request for each change.
5. A zero-result local filter does not claim the upstream catalogue is empty.
6. A genuinely empty upstream result displays `EmptyDataState` and no fake zero-valued device row.
7. Disabled/fixture source mode displays an unavailable live integration, not demo data.
8. A failed upstream/backend request displays a safe error and the retry action works.
9. A truncated/partial response visibly warns that the catalogue may be incomplete.
10. Source floor, display floor, and development fallback are not conflated.
11. No UI maps upstream floor 0 to viewer floor G.
12. Zero X/Y/Z coordinates render as valid numeric values.
13. `is_active` is described as catalogue activity, not current connectivity.
14. Online/offline/health KPIs remain unavailable and contain no fabricated counts.
15. Page 07 remains usable with keyboard navigation and at narrow viewport width.
16. Dashboard navigation, Viewer navigation, and the Viewer single-Unity-runtime behavior still work.
17. No browser request targets `api.ttlab.manhthao.uk`; browser requests target the application proxy only.
18. Browser errors, response bodies, and console output contain no token or raw internal error detail.

---

## 13. Acceptance criteria

Phase 02 is complete only when all statements are true:

- One Dashboard-owned, read-only device-catalogue endpoint exists.
- The endpoint reuses the existing IoT client/service/mapper and approved upstream GET allowlist.
- Full-building and approved floor-scoped catalogue reads are supported without accepting raw upstream paths or raw floor levels from the browser.
- The normalized DTO contains device identity, source type/category, catalogue activity, source timestamps, application fetch time, floor, and X/Y/Z.
- Opaque device IDs and unknown source types remain supported.
- Source coordinates remain distinct from display overrides.
- Ground-floor mapping remains unresolved; no `G -> 0` guess exists.
- Development fallback is explicit and preserves raw source floor 0.
- Successful non-empty and empty responses have correct live provenance and availability.
- Partial/truncated data is visibly qualified.
- Page 07 shows a real searchable/filterable catalogue through the Next.js application boundary.
- The total-device KPI uses accepted normalized records.
- `is_active` is never presented as online/offline/health.
- Unsupported Page 07 fields remain unavailable; no telemetry work is implemented early.
- No Dashboard catalogue data is persisted and no migration/entity is added.
- No browser/Unity call targets the upstream IoT host.
- No token, authorization header, upstream URL, stack trace, raw upstream error, or database detail leaks to the client.
- No upstream mutation method/path is added or called.
- Existing viewer/device APIs and Phase 01 Dashboard routes/contracts regressions pass.
- Backend tests/build, frontend tests/lint/build, and recorded manual checks pass or have explicitly documented environment blockers.
- The required Phase 02 implementation handoff file exists.

---

## 14. Guardrails for the coding agent

1. Preserve user-owned working-tree changes, especially the existing `GISUIT.code-workspace` modification.
2. Do not rewrite viewer catalogue contracts to make the Dashboard convenient.
3. Do not build a second IoT client, generic proxy, or arbitrary-path passthrough.
4. Do not expose or log the Master Bearer Token.
5. Do not send `POST`, `PUT`, `PATCH`, or `DELETE` to the IoT backend.
6. Do not persist live catalogue results in this phase.
7. Do not modify source coordinates or write them upstream.
8. Do not infer coordinate units, axes, origin, room, or calibrated installation quality.
9. Do not infer online/offline from `is_active`, `last_updated_timestamp`, or catalogue presence.
10. Do not query telemetry to make the Page 07 catalogue appear more complete.
11. Do not add fake battery, firmware, gateway, OTA, calibration, packet, or health values.
12. Do not silently switch to fixture/demo on source failure.
13. Do not create new Dashboard pages or out-of-scope domains.
14. Do not add authentication, CASL, report data, alerts, or database schema work early.
15. Do not claim successful live verification if credentials/environment were unavailable.
16. If the contract or repository conflicts with this plan, choose the narrowest safe equivalent and document the deviation in the handoff; do not broaden scope silently.

---

## 15. Required implementation evidence

The completion report must include:

- branch and final HEAD commit;
- initial and final working-tree status, identifying preserved unrelated changes;
- exact files created/modified;
- final NestJS route and query contract;
- final response DTO/type shapes;
- source-mode and persistence decision confirmation;
- exact reuse points in the existing IoT client/service/mapper;
- final frontend request path and server/client component boundary;
- field mapping table, floor mapping, and fallback behavior;
- how partial, truncated, empty, unavailable, and error states are represented;
- evidence that `is_active` is not presented as online/health;
- test IDs and exact pass/fail/skip results;
- backend build and web lint/build results;
- manual desktop/narrow/accessibility checks;
- security search results for upstream URL/token/direct-client calls;
- confirmation of zero database schema/write changes;
- confirmation of zero upstream mutation calls;
- any live read-only smoke request performed, or an explicit statement that it was not performed;
- known issues, deviations, and remaining blockers.

---

## 16. Mandatory final instruction to the coding agent

After implementing and verifying this plan, the coding agent **must create**:

```text
web/doc/bp2_phase02_dashboard_application_api_real_device_catalogue_handoff.md
```

The handoff file must contain all implementation evidence listed in Section 15, a pass/fail result for every acceptance criterion in Section 13, and every unresolved blocker or deviation. **Big Phase 02 / Phase 02 is not complete until this handoff file exists.**
