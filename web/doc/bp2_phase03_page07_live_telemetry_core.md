# Big Phase 02 — Phase 03: Page 07 Live Telemetry Core

> **Project:** GIS — UIT Building E Digital Twin  
> **Big Phase:** 02 — Dashboard  
> **Sub-phase:** 03  
> **Plan date:** 2026-09-26  
> **Status:** PLANNED — NOT IMPLEMENTED  
> **Implementation owner:** Coding agent  
> **Primary targets:** NestJS Dashboard telemetry API and Next.js Page 07 — Hệ thống IoT  
> **Source roadmap item:** `dashboard_big_phase_small_phase_plan.md`, formerly listed as Small Phase 11  
> **Depends on:** Big Phase 02 / Phase 02 — Dashboard Application API for the Real Device Catalogue  
> **Dashboard authority:** `Dashboard_Knowledge_Base.md`  
> **IoT contract authority:** `IoTBackend_API_HandOver.md`  
> **Phase 02 evidence:** `bp2_phase02_dashboard_application_api_real_device_catalogue_handoff.md`

---

## 1. Purpose

Implement the live telemetry core of Dashboard Page 07 using the approved `solar` and `avc` read contracts.

This phase must:

- reuse the existing allowlisted NestJS IoT client and normalized telemetry service;
- add a Dashboard-owned telemetry endpoint and Dashboard provenance wrapper;
- define a bounded Page 07 time-range policy with explicit `start`, `stop`, and `limit` forwarding;
- let the user deliberately select one catalogue device and load only that device's telemetry;
- display last telemetry time, gateway ID, RSSI, SNR, confirmed-unit solar current/lux, and supported AVC radio/water fields;
- render solar and AVC historical series through the Phase 01 `MetricTrendChart`/ant-design-charts foundation;
- preserve zeros, gaps, coverage, invalid-row counts, limit/truncation signals, and per-metric observation times;
- label unresolved solar/AVC semantics as raw or pending confirmation;
- keep unsupported Page 07 capabilities explicitly unavailable.

This document is an implementation handover plan only. The planning agent must not implement the source changes described below.

---

## 2. Required reading and authority order

Before editing, the coding agent must read:

1. `web/AGENTS.md` and the relevant local Next.js 16 guidance under `web/node_modules/next/dist/docs/`;
2. `web/doc/Dashboard_Knowledge_Base.md`;
3. `web/doc/IoTBackend_API_HandOver.md`;
4. `web/doc/dashboard_big_phase_small_phase_plan.md`;
5. `web/doc/bp2_phase02_dashboard_application_api_real_device_catalogue.md`;
6. `web/doc/bp2_phase02_dashboard_application_api_real_device_catalogue_handoff.md`;
7. the current Phase 01 Dashboard provenance/chart/state components;
8. the current Phase 02 Dashboard catalogue API, DTOs, client adapter, panel, filters, and table;
9. the current IoT client, telemetry service/DTOs/tests, viewer telemetry endpoint, hook, popup, and regression tests.

Authority rules:

- the latest explicit stakeholder decision wins;
- `Dashboard_Knowledge_Base.md` controls Dashboard scope and data-mode semantics;
- `IoTBackend_API_HandOver.md` controls approved upstream endpoints, query requirements, fields, units, and unresolved semantics;
- current repository/runtime evidence controls what is already implemented;
- this file controls the work boundary for Big Phase 02 / Phase 03;
- old proposals and sample values are not live data contracts.

If new upstream evidence changes any field, unit, endpoint, or error behavior, update the single authoritative `IoTBackend_API_HandOver.md` before implementing the changed contract.

---

## 3. Verified repository baseline

The planning audit on 2026-09-26 found:

- Current branch: `feature/dashboard`.
- Current audited HEAD: `558cc542db6d273a9434c94d4a065960feeb9ebf`.
- Phase 02 is implemented in the working tree but remains uncommitted at the audited HEAD.
- Existing user/agent changes include:
  - pre-existing `GISUIT.code-workspace` modification;
  - Phase 02 changes to `backend/openapi.json`, `backend/src/app.module.ts`, `web/package.json`, and `web/src/app/dashboard/iot/page.tsx`;
  - new Phase 02 backend Dashboard files, Page 07 catalogue components, adapters/types/tests, plan, and handoff.
- All of those existing changes must be preserved. The coding agent must not reset, discard, overwrite, or re-create them from scratch.
- Phase 02 added `DashboardModule`, `DashboardIotController`, `DashboardIotCatalogueService`, normalized catalogue DTOs, the same-origin frontend adapter, and the Page 07 catalogue UI.
- The current Phase 02 Dashboard catalogue endpoint is:

```text
GET /api/v1/dashboard/buildings/:buildingId/iot/devices[?floorId=<application-floor>]
```

- Page 07 now renders a real catalogue and keeps the global Online/Offline/online-rate KPI cards unavailable with “Chờ tích hợp telemetry (Phase 03)”.
- The existing viewer/device telemetry endpoint is:

```text
GET /api/v1/iot/devices/:deviceId/telemetry?start=<iso>&stop=<iso>&limit=<n>&deviceType=<hint>
```

- `IotTelemetryService` already:
  - validates `start < stop` and `limit` between 1 and 10,000;
  - resolves `solar`, `avc`, `nfc`, or unknown types;
  - routes to the typed allowlisted client methods;
  - normalizes source rows and coverage;
  - preserves zero values;
  - orders normalized readings newest-first;
  - reports returned/valid/invalid counts, earliest/latest timestamps, reached-limit, and truncation.
- The current shared telemetry DTOs already contain the fields needed for this phase, including solar `currentUa`, `lux`, RSSI/SNR, raw voltage/temperature/humidity/state, gateway ID, and AVC flow/volume/temp/radio/raw-flag fields.
- The current browser telemetry path sends an optional `deviceType` hint, and `IotTelemetryService.resolveDeviceType()` currently trusts an allowlisted hint when its RAM cache is empty. That is acceptable historical viewer behavior but does not meet this phase's requirement that the server—not the browser—owns upstream endpoint routing.
- The Phase 02 catalogue service validates source device type but does not currently register accepted types in `IotTelemetryService`'s trusted RAM cache.
- The viewer hook hard-codes a rolling 72-hour range and limit 1,000, includes stale-request/abort protection, and is coupled to the viewer toast context.
- The viewer popup uses a custom SVG telemetry chart. Dashboard Phase 03 must use the established Dashboard `MetricTrendChart` wrapper backed by `@ant-design/charts`, not copy the viewer chart.
- Phase 01 `TimeRangeSelector` is presentational and currently has fixed options (`today`, `yesterday`, `last-7d`, `last-30d`, `custom`); it must be adapted carefully if Page 07 needs configurable preset options.
- Live telemetry remains request-time/in-memory. No telemetry history is stored in PostgreSQL.

The coding agent must re-audit these facts before implementation and record any drift in the Phase 03 handoff.

---

## 4. Phase goal and user-visible result

At the end of this phase:

1. A Page 07 user can select one `solar` or `avc` device from the real Phase 02 catalogue.
2. The Dashboard loads an explicit, bounded time range through a Dashboard-owned NestJS endpoint.
3. The server determines the device type from trusted server-side/upstream metadata and calls exactly one approved telemetry endpoint.
4. The selected-device panel shows available live sample/radio/metric values and a historical chart.
5. Every ready or empty live response includes the requested source window, application fetch time, coverage, and provenance.
6. Charts sort a copy of source readings oldest-to-newest without changing the backend/newest-first telemetry contract.
7. Zero values remain valid; missing values remain missing; gaps are not filled or interpolated.
8. Raw/unconfirmed fields are visibly qualified and never promoted to safety, alert, online, or battery conclusions.
9. NFC and unsupported device types remain catalogue-visible but do not become part of this Dashboard telemetry core.
10. No N+1 telemetry sweep, background polling, persistence, alert evaluation, or fake data is introduced.

---

## 5. Non-goals

Do not implement any of the following in this phase:

- telemetry loading for every catalogue row or global Page 07 health aggregation;
- authoritative Online/Offline, stale, health, heartbeat, uptime, or availability percentage;
- expected-cadence rules or freshness thresholds;
- standardized battery percentage or authoritative interpretation of AVC `battery_low`;
- packet-delivery/reception rates;
- gateway inventory/health, firmware, OTA, or calibration;
- alert thresholds, alert states, notification counts, or Page 06 work;
- NFC access/event analytics on Dashboard Page 07;
- Page 02 Water composition or water-consumption derivation;
- temperature/humidity/voltage units not confirmed by the current handover;
- semantic conversion of solar `state` or AVC flag numbers into enums/booleans;
- daily consumption derived from AVC cumulative counter differences;
- room mapping, coordinate calibration, or viewer-floor changes;
- telemetry persistence, raw TSDB mirroring, report-data tables/jobs, caching, migrations, or retention policy;
- automatic polling or retry loops;
- demo fallback for failed/empty telemetry;
- authentication, CASL, or protected write actions;
- changes to Page 04, 05, 08, or 10;
- another chart library.

An unsupported or unavailable field must remain unavailable. It must not be replaced with a proposal number, random value, catalogue timestamp, or demo value in this phase.

---

## 6. Decisions frozen for Phase 03

### 6.1 Supported device types

Dashboard Phase 03 supports telemetry detail for:

```text
solar
avc
```

Rules:

- `solar` uses approved upstream `GET /api/v1/solar`.
- `avc` uses approved upstream `GET /api/v1/avc`.
- `nfc` remains visible in the catalogue but its Dashboard telemetry detail renders an explicit unsupported/unavailable state in this phase.
- Unknown/new types render an explicit unsupported/unavailable state.
- Do not call `/nfc` from the Dashboard Phase 03 panel.
- Do not remove or regress the existing viewer NFC support.

### 6.2 Dashboard application route

Add one Dashboard-owned read route under the Phase 02 controller/module boundary:

```http
GET /api/v1/dashboard/buildings/:buildingId/iot/devices/:deviceId/telemetry
    ?start=<ISO-8601>
    &stop=<ISO-8601>
    &limit=<integer>
```

The browser calls it through the existing same-origin proxy:

```text
/api/devices/dashboard/buildings/E/iot/devices/<encoded-device-id>/telemetry
```

Contract:

- `buildingId` currently supports `E` only.
- `deviceId` is an opaque non-empty string and must be path-encoded by the frontend.
- `start`, `stop`, and `limit` are explicit; no undocumented `latest` route is added.
- Query DTO validation must reject missing/invalid/unknown parameters before any type-specific upstream call.
- The route is `GET` only and `Cache-Control: no-store`.
- No `deviceType`, `upstreamPath`, source endpoint, or raw upstream floor parameter is accepted from the browser.

### 6.3 Server-authoritative type routing

The backend—not the browser—must select `solar` versus `avc`.

Required hardening:

1. Do not accept or trust a public `deviceType` query parameter for routing.
2. Remove `deviceTypeHint` from the browser-facing telemetry request path and from any shared query contract that treats it as authoritative.
3. Resolve type from one of these trusted server-side sources:
   - a RAM cache populated only from a successfully validated upstream catalogue/detail response; or
   - `GET /api/v1/devices/{dev_eui}` for the selected known device.
4. If the Phase 02 catalogue service warms the RAM cache, it may do so only after item validation succeeds.
5. A cache miss must fall back to the approved upstream detail GET; it must not use a client hint.
6. Unsupported types must not trigger a guessed type-specific endpoint.
7. Preserve viewer behavior by updating its client/hook to the hardened route contract and re-running its regressions.

Refactor `IotTelemetryService` minimally so trusted type resolution and type-specific dispatch can be reused by both viewer and Dashboard without duplicating normalizers.

### 6.4 Dashboard time-range and load policy

Freeze this Page 07 application policy:

| Preset | Duration | Use |
| --- | ---: | --- |
| `last-24h` | Rolling 24 hours | Short diagnostic view |
| `last-72h` | Rolling 72 hours | **Default**; preserves the proven viewer baseline |
| `last-7d` | Rolling 7 days | Longest Dashboard Phase 03 view |

Rules:

- At request time, compute one `stop` instant and subtract the selected duration to obtain `start`.
- Send both as ISO-8601 UTC strings.
- Frontend always sends `limit=1000`.
- Dashboard endpoint accepts an integer limit from 1 through 1,000 only.
- Dashboard endpoint rejects ranges longer than 7 days.
- The lower-level IoT service may keep its upstream-compatible hard cap of 10,000 for other trusted application consumers; Dashboard applies the stricter cap.
- No `today`, `yesterday`, `last-30d`, or custom date picker is required in this phase.
- No automatic polling occurs. Fetch only on deliberate device selection, preset change, or manual refresh.
- Manual refresh recomputes a fresh rolling `start`/`stop` for the selected preset.
- One active device request at a time; abort/supersede the prior request on device/range change.
- No automatic retry. The user may invoke one retry/refresh action.

If `TimeRangeSelector` is extended, make its option list configurable while preserving existing default behavior for any current consumer. Do not hard-code Page 07 business policy into a generic chart component.

### 6.5 Persistence and caching

- Telemetry remains request-time and in memory.
- Do not add PostgreSQL entities, migrations, repositories, report rows, or raw-history storage.
- The trusted device-type RAM cache may be reused; it is not telemetry persistence.
- Do not add a backend read-through telemetry cache without a measured, separately approved cache policy.
- Do not update Phase 02 catalogue sync state during telemetry reads.

### 6.6 Ordering, latest values, and gaps

- Preserve the existing application telemetry DTO's newest-first reading order.
- The newest valid reading defines the selected device's coherent latest sample snapshot.
- Hero metrics may use the newest reading that contains that metric only when their own `sampleTimestamp` is displayed; do not imply all values share one timestamp.
- Build chart data by copying and sorting eligible points oldest-to-newest in the Dashboard adapter.
- Never mutate the response array in place.
- Do not synthesize rows, fill missing timestamps, replace missing values with zero, or interpolate gaps.
- Zero is a valid value for metrics and radio fields.
- Do not calculate freshness/online state from `coverage.latestTimestamp` until expected cadence is confirmed.

### 6.7 Error and availability behavior

Use distinct outcomes:

| Condition | Application/UI result |
| --- | --- |
| Valid response with one or more valid rows | `ready`, live provenance |
| Valid upstream response with zero rows | `empty`, live source-window provenance |
| Catalogue type is NFC/unknown/unsupported | `unavailable`; no type-specific Dashboard call |
| Source mode disabled/fixture or missing server credential | `503` mapped to unavailable |
| Invalid range/limit/building/device input | controlled `400` |
| Device detail not found | controlled `404` |
| Upstream auth/network/timeout/invalid JSON/schema failure | sanitized `502`/`503` mapped to error/unavailable as appropriate |
| Received rows exist but all fail required identity/timestamp validation | schema/dependency error, not clean empty |

Never retain and display telemetry from the previously selected device after a new selection fails. A manual refresh may keep the current successful panel visible only if it is clearly marked as previously loaded while refreshing; on refresh failure, do not silently advance its fetch/provenance time.

---

## 7. Dashboard telemetry response contract

The Dashboard route should wrap the existing normalized solar/AVC payload rather than duplicate its field normalization.

The exact DTO class names may follow repository conventions, but the response must express:

```ts
interface DashboardDeviceTelemetryResponse {
  schemaVersion: 1;
  buildingId: string;
  deviceId: string;
  deviceType: 'solar' | 'avc';
  availability: 'ready' | 'empty';
  provenance: {
    mode: 'live';
    sourceId: string;
    sourceType: 'iot_backend_telemetry';
    observedAt?: string;
    windowStart: string;
    windowEnd: string;
    fetchedAt: string;
    caveats?: string[];
  };
  queryRange: {
    start: string;
    stop: string;
    limit: number;
  };
  coverage: TelemetryCoverageSummary;
  latestSample: {
    observedAt: string;
    gatewayId: string | null;
    rssiDbm: number | null;
    snrDb: number | null;
  } | null;
  telemetry: SolarTelemetryData | AvcTelemetryData;
}
```

Notes:

- The selected preset is frontend application state; the server contract and provenance use the explicit `start`/`stop` window as authoritative.
- `provenance.observedAt` equals the newest valid telemetry timestamp when data exists.
- `provenance.fetchedAt` is generated after the successful upstream response is received/normalized, not copied from source data.
- `latestSample` comes from one newest valid row so its radio/gateway fields share one observation timestamp.
- Per-metric hero values retain their own existing sample timestamps.
- `coverage` remains separate from provenance and availability.
- Empty successful responses still identify the live source window/fetch time but the UI must not show a ready live badge as if a current value existed.

### 7.1 Provenance caveats

Add safe human-readable caveats when applicable:

- upstream `meta.truncated === true`;
- returned row count reached the requested limit;
- one or more rows were invalid/skipped;
- solar raw voltage/temperature/humidity/state remain unconfirmed;
- AVC cumulative/instantaneous counter semantics and raw flags remain pending confirmation;
- AVC `temp_c` is Celsius but ambient-versus-meter placement is unresolved.

Do not put tokens, authorization values, upstream URLs, raw exceptions, stack traces, or internal source paths in provenance.

---

## 8. Field display contract

### 8.1 Common selected-device fields

Show when present:

| Field | Display rule |
| --- | --- |
| latest telemetry timestamp | “Bản tin telemetry mới nhất”; never relabel as online/last seen health |
| `gateway_id` | Opaque gateway identifier from the newest valid sample |
| `rssi` | Show number with documented unit `dBm` |
| `snr` | Show number with documented unit `dB` |
| returned/valid/invalid counts | Coverage metadata, not device health |
| earliest/latest timestamps | Coverage for the requested window |
| truncation/reached limit | Visible warning near chart/detail |

### 8.2 Solar fields

Trustworthy live fields for primary display:

- `current_uA` -> current with unit `µA`;
- `lux` -> illuminance with unit `lx`;
- timestamp, gateway ID, RSSI, SNR.

Raw/unconfirmed technical fields may be shown only in a clearly marked detail area:

- `voltage` with no invented unit;
- `temperature` with no invented unit or Celsius claim;
- `humidity` with no invented percent/unit claim;
- numeric `state` code without enum meaning;
- frame counter and application/friendly network names as technical metadata.

Do not use raw solar voltage as battery percentage or health.

### 8.3 AVC fields

Live source fields that may be shown with their documented source units and caveats:

- `instant_flow_m3h` (`m³/h`) — meaning/hardware confirmation pending;
- `fwd_volume_m3` and `rev_volume_m3` (`m³`) — cumulative/reset/rollover semantics pending;
- `temp_c` (`°C`) — ambient versus meter temperature unresolved;
- timestamp, gateway ID, RSSI (`dBm`), SNR (`dB`);
- frequency (`Hz`), spreading factor, data-rate index, frame counter, region;
- device friendly name and meter serial number as secondary source metadata;
- `dev_addr` only as a short-lived technical session address, never primary identity.

Raw flag fields may be displayed only as numeric source codes with “chưa xác nhận miền giá trị” wording:

- valve open;
- pipe leak;
- pipe burst;
- battery low;
- frozen;
- tamper;
- reverse flow.

Do not convert these values to true/false, Normal/Warning/Danger, leak alarms, battery state, or valve commands.

---

## 9. Backend implementation scope

### 9.1 Reuse and harden the shared telemetry path

The coding agent must:

1. keep `IotClientService.fetchSolarReadings()` and `fetchAvcReadings()` as the only low-level upstream telemetry clients used here;
2. reuse `IotTelemetryService` normalizers and coverage calculation;
3. remove public/client authority over `deviceType` routing;
4. make the server-resolved type path explicit and testable;
5. keep viewer NFC support working through the shared service;
6. use `Number.isFinite` for present numeric values so `NaN`/`Infinity` never enter normalized responses;
7. require valid row identity and timestamp rather than fabricating a missing `dev_eui` from the request device ID;
8. preserve valid zero values;
9. reject an all-malformed non-empty upstream payload as dependency/schema failure;
10. generate `fetchedAt` after the completed source read.

Do not rewrite the type-specific normalizers into the Dashboard service.

### 9.2 Dashboard service responsibilities

Add a focused service under the existing Dashboard module that:

- gates live telemetry on `DEVICE_SOURCE_MODE=iot`;
- validates Building E and the stricter Dashboard range/limit policy;
- requests server-authoritative normalized telemetry for the device;
- allows only normalized `solar` and `avc` payloads into the Phase 03 Dashboard response;
- converts unknown/NFC types into the documented unsupported behavior without guessing endpoints;
- constructs Dashboard availability, provenance, latest sample, and caveats;
- sanitizes errors at the application boundary;
- performs no database read/write for telemetry.

### 9.3 Runtime response validation

At minimum:

- envelope `data` must be an array;
- each accepted row must be an object with matching non-empty `dev_eui` and valid timestamp;
- optional numbers must be finite when present; invalid optional values become `null` or reject the row according to one documented consistent rule;
- optional strings must be safely coerced/trimmed only where the existing contract permits;
- readings outside the requested response type must not be returned;
- newest-first ordering and coverage timestamps must be deterministic;
- source errors remain sanitized.

---

## 10. Frontend implementation scope

### 10.1 Selection flow

Extend the Phase 02 catalogue without turning it into an N+1 telemetry loader:

1. Add an accessible row action/button such as `Xem telemetry`.
2. Store one selected catalogue item in `IotCataloguePanel` or a focused child controller.
3. Load telemetry only after explicit selection of a supported device.
4. Clear/close selection when a new floor catalogue no longer contains the device.
5. Local text/type filters may hide a selected row without silently changing its loaded telemetry; the detail panel must still identify the selected device clearly.
6. Selecting another device cancels/supersedes the prior request and clears its telemetry before showing new data.
7. Selecting NFC/unknown opens an explicit unavailable panel and performs no Dashboard telemetry network call.

### 10.2 Dashboard telemetry client/hook

Create a Dashboard-specific adapter/controller rather than importing the viewer toast-coupled hook.

It must:

- call only the same-origin Dashboard telemetry route;
- accept device ID plus the selected range policy, not a device-type hint;
- compute explicit UTC `start`/`stop` and send `limit=1000`;
- use `cache: 'no-store'`;
- use `AbortController`, request generations, and a bounded client timeout;
- distinguish loading, refreshing, ready, empty, unavailable, unsupported, and error;
- suppress stale/aborted results and stale error notifications;
- preserve previously loaded data only during a deliberate refresh, with a visible refreshing indicator;
- sanitize client-visible errors;
- never retry automatically.

### 10.3 Selected-device telemetry panel

Add a focused responsive panel using Phase 01 components:

- selected device identity/type and catalogue context;
- configurable `TimeRangeSelector` using only the three Phase 03 presets;
- manual refresh;
- common latest-sample cards for telemetry time, gateway, RSSI, and SNR;
- solar metric cards/selector for current and lux;
- AVC metric cards/selector for flow, forward volume, reverse volume, and `temp_c`;
- one `MetricTrendChart` showing the selected metric;
- technical metadata/raw-unconfirmed disclosure section;
- coverage summary and visible partial/truncation caveat;
- loading, empty, unavailable, unsupported, and error states;
- live `DataModeBadge` only for ready values/charts with valid provenance.

Do not copy `IotDeviceTelemetryChart` into Dashboard. Use the established Dashboard chart wrapper and enhance it only when a reusable accessibility/behavior gap is proven.

### 10.4 Chart adapter

For the selected metric:

- filter only finite numeric values;
- preserve zero;
- copy and sort points oldest-to-newest;
- retain actual timestamps;
- do not insert synthetic gap points or interpolate;
- provide a Vietnamese accessible summary including metric, unit/qualification, point count, requested window, and partial/truncated warning;
- keep raw/unconfirmed unit labels out of chart axes when the unit is not confirmed.

### 10.5 Global Page 07 KPI restraint

The existing global Online/Offline/online-rate KPI cards must remain unavailable in Phase 03.

Do not derive them by:

- counting catalogue `active` values;
- checking whether any telemetry row exists;
- comparing the latest timestamp with an invented timeout;
- using source metadata update time;
- treating missing telemetry as offline.

The selected-device “latest telemetry timestamp” is informational only and must not be colored/labeled as a health state.

---

## 11. Target source organization

Adapt names to current conventions, but expected ownership is:

```text
backend/src/
├── dashboard/
│   ├── dashboard.module.ts                            # Register telemetry service
│   ├── dashboard-iot.controller.ts                    # Add Dashboard telemetry GET
│   ├── dashboard-iot-telemetry.service.ts             # Range gate + provenance wrapper
│   ├── dto/
│   │   ├── dashboard-iot-telemetry-query.dto.ts
│   │   └── dashboard-iot-telemetry-response.dto.ts
│   └── tests/
│       └── dashboard-iot-telemetry.spec.ts
├── devices/
│   └── devices.controller.ts                          # Remove public type-routing hint safely
└── iot/
    ├── dto/iot-telemetry.dto.ts                       # Shared normalized contract hardening
    ├── iot.service.ts                                 # Reused orchestration
    ├── services/iot-telemetry.service.ts              # Reused normalizers/trusted type routing
    └── tests/iot-telemetry.spec.ts                    # Regression + hardening tests

web/
├── test-bp2-phase03.mjs
└── src/
    ├── components/dashboard/iot/
    │   ├── IotCataloguePanel.client.tsx               # Selection coordination only
    │   ├── IotDeviceCatalogueTable.tsx                # Accessible select action
    │   ├── IotDeviceTelemetryPanel.client.tsx
    │   ├── IotTelemetryMetricSelector.tsx
    │   └── IotTelemetryTechnicalDetails.tsx
    ├── components/dashboard/controls/
    │   └── TimeRangeSelector.tsx                      # Configurable options if needed
    ├── lib/dashboard/
    │   ├── iot-telemetry-api.ts
    │   ├── iot-telemetry-range.ts
    │   └── iot-telemetry-chart.ts
    └── types/
        └── dashboard-iot-telemetry.ts
```

Also update the existing viewer API adapter/hook/types only as required to remove the browser `deviceType` routing hint without regressing viewer functionality.

This is a responsibility map, not permission to create unused abstraction layers.

---

## 12. Implementation checkpoints

### Checkpoint A — Re-audit and lock the baseline

1. Record branch, HEAD, and the complete dirty working-tree inventory.
2. Read all sources in Section 2.
3. Confirm the exact Phase 02 files and response contract now present.
4. Re-check the current telemetry service, DTOs, route, hook, popup, tests, and IoT handover.
5. Confirm no new IoT-team answers have resolved cadence, online state, solar raw units/state, AVC counters/flags, battery, firmware, gateway health, OTA, or calibration.
6. Preserve all Phase 02 and unrelated changes.

**Exit:** the coding agent has documented the actual extension/hardening points and unchanged open questions.

### Checkpoint B — Harden shared type routing and normalization

1. Remove browser authority over `deviceType` route selection.
2. Establish trusted cache/detail type resolution.
3. Warm the trusted cache only from validated server-side catalogue data where useful.
4. Keep viewer solar/AVC/NFC flows working without a client hint.
5. Harden finite numeric, required identity/timestamp, zero, malformed-envelope, and all-invalid-row behavior.
6. Preserve newest-first normalized arrays and existing type-specific DTOs.
7. Expand shared telemetry service tests before adding Dashboard UI.

**Exit:** a client cannot cause an AVC device to call `/solar`, and viewer regressions pass.

### Checkpoint C — Dashboard telemetry API

1. Add the query/response DTOs.
2. Add the exact Dashboard GET route.
3. Enforce Building E, source mode, explicit range, maximum 7-day duration, and limit 1..1,000.
4. Call the shared server-authoritative telemetry service.
5. Accept only `solar` and `avc` for Dashboard Phase 03.
6. Construct availability, provenance, latest coherent sample, coverage, and caveats.
7. Sanitize all application errors.
8. Document the route in Swagger/OpenAPI without token/upstream examples.

**Exit:** backend tests prove exact range forwarding, endpoint routing, response semantics, and no persistence.

### Checkpoint D — Dashboard time range, selection, and request lifecycle

1. Add the three frozen presets and pure UTC range helpers.
2. Make the shared selector configurable without breaking its foundation contract.
3. Add accessible catalogue row selection.
4. Add the Dashboard telemetry same-origin adapter.
5. Add one-request-at-a-time cancellation, generation tracking, timeout, refresh, and state transitions.
6. Ensure NFC/unknown selection does not call telemetry.

**Exit:** device and range switching cannot display stale telemetry or stale errors.

### Checkpoint E — Solar/AVC Page 07 presentation

1. Add common latest-sample cards.
2. Add solar current/lux cards and chart selection.
3. Add AVC flow/volume/temp cards and chart selection.
4. Add radio/technical details and raw/unconfirmed field disclosure.
5. Add coverage/partial/truncation messaging.
6. Sort chart copies oldest-to-newest and provide accessible summaries.
7. Keep global health KPIs and unsupported Page 07 capabilities unavailable.

**Exit:** Page 07 displays only contract-supported values with correct units/caveats.

### Checkpoint F — Verification and security audit

1. Run backend unit tests and build.
2. Run backend e2e where the existing database environment is available.
3. Run Phase 01/02 and viewer telemetry regressions plus the new Phase 03 frontend tests.
4. Run web lint and build.
5. Inspect desktop and narrow viewport flows for solar, AVC, unsupported, empty, partial, timeout, and error cases.
6. Audit browser-facing source/build output for upstream host, token names/values, authorization headers, and direct IoT calls.
7. Audit for database changes, mutation methods, automatic polling, and N+1 telemetry requests.
8. Perform at most a minimal read-only live smoke query only when credentials/environment permit and after mock tests pass.

**Exit:** every acceptance item has current evidence.

### Checkpoint G — Implementation handoff

Create the mandatory handoff file specified in Section 18.

**Exit:** Phase 03 is not complete until the handoff exists.

---

## 13. Automated testing plan

Use Jest/Nest tests for backend behavior and the repository's lightweight frontend test approach for pure policies/adapters. Add component-level testing only if the repository already gains a suitable React runner; do not install a large stack solely for source-text assertions.

Minimum coverage:

| ID | Required test |
| --- | --- |
| BP2-P03-T01 | Dashboard telemetry route is GET-only, `no-store`, and accepts no client `deviceType`/upstream-path selector |
| BP2-P03-T02 | Building outside E and empty/malformed device IDs fail before a type-specific upstream call |
| BP2-P03-T03 | Missing/invalid/non-ISO ranges, `start >= stop`, duration over 7 days, unknown queries, and limits outside 1..1,000 fail locally |
| BP2-P03-T04 | 24h, 72h, and 7d helpers produce exact UTC windows from one frozen stop instant |
| BP2-P03-T05 | Frontend sends exact `start`, `stop`, and `limit=1000`; backend forwards normalized values unchanged to the shared service |
| BP2-P03-T06 | Server-validated solar type routes only to `/solar`; server-validated AVC routes only to `/avc` |
| BP2-P03-T07 | A forged/former browser type hint cannot reroute a device or poison the trusted type cache |
| BP2-P03-T08 | Trusted catalogue cache miss falls back to approved device-detail GET and handles 404 safely |
| BP2-P03-T09 | NFC/unknown is unavailable for Dashboard Phase 03 and causes no Dashboard `/nfc`, `/solar`, or `/avc` guess |
| BP2-P03-T10 | Viewer NFC/solar/AVC telemetry regressions still pass after type-hint hardening |
| BP2-P03-T11 | Solar current, lux, gateway, RSSI, SNR, timestamps, and zero values normalize/display correctly |
| BP2-P03-T12 | Solar raw voltage/temperature/humidity/state remain raw/unconfirmed and have no invented unit/enum |
| BP2-P03-T13 | AVC flow, forward/reverse volume, temp, gateway, RSSI/SNR, radio metadata, and zero values normalize/display correctly |
| BP2-P03-T14 | AVC raw flags remain numeric source codes and never become booleans/alerts/battery health |
| BP2-P03-T15 | Missing optional metrics remain null/unavailable rather than zero; non-finite numbers never reach the response |
| BP2-P03-T16 | Required identity/timestamp mismatch or invalid rows increment invalid coverage; all-invalid non-empty payload is an error, not empty |
| BP2-P03-T17 | Backend readings remain newest-first; Dashboard chart adapter returns a separately sorted oldest-first copy without mutation |
| BP2-P03-T18 | Nonuniform timestamps/gaps produce no synthetic points, interpolation, or zero filling |
| BP2-P03-T19 | Empty successful source response yields empty availability plus the exact live source window/fetch provenance |
| BP2-P03-T20 | `meta.truncated`, reached-limit, and invalid-row cases generate visible safe caveats and coverage values |
| BP2-P03-T21 | Latest coherent sample uses one newest row; hero metrics expose their own sample timestamp when different |
| BP2-P03-T22 | Switching device/range aborts or supersedes the prior request; stale result/error cannot overwrite current state |
| BP2-P03-T23 | Manual refresh recomputes the rolling window, has no automatic retry/poll, and does not falsely advance provenance on failure |
| BP2-P03-T24 | Selecting a device is the only telemetry trigger; catalogue loading/filtering does not launch per-row telemetry requests |
| BP2-P03-T25 | Loading, refreshing, ready, empty, unavailable, unsupported, timeout, and error states are distinct |
| BP2-P03-T26 | Metric charts use `MetricTrendChart`/ant-design-charts and expose an accessible Vietnamese summary/table alternative |
| BP2-P03-T27 | Global Online/Offline/online-rate KPIs remain unavailable and are not derived from catalogue or telemetry timestamps |
| BP2-P03-T28 | Battery percentage, firmware, OTA, calibration, gateway health, packet rate, and alert state are absent/unavailable |
| BP2-P03-T29 | Client-facing source contains no IoT host, credential, authorization secret, direct upstream call, or arbitrary endpoint selector |
| BP2-P03-T30 | No telemetry database entity/migration/write, upstream mutation, second chart library, or out-of-scope page is added |

Expected commands, adapted only when the current repository requires an equivalent:

```text
npm --prefix backend test -- --runInBand
npm --prefix backend run build
npm --prefix backend run test:e2e
node web/test-phase07.mjs
node web/test-phase08.mjs
node web/test-phase09.mjs
node web/test-bp2-phase02.mjs
node web/test-bp2-phase03.mjs
npm --prefix web run lint
npm --prefix web run build
```

Add a dedicated script such as `test:bp2:p03` and keep the aggregate web `test` script running Phase 01, Phase 02, and Phase 03 Dashboard tests. Do not replace existing coverage.

Never report a test as passed unless it executed successfully in the current working tree. Record environment-dependent skips and exact reasons.

---

## 14. Manual verification matrix

Verify at minimum:

1. Page 07 catalogue still loads, filters, and reports provenance exactly as Phase 02.
2. No telemetry request occurs until the user selects a supported device.
3. Selecting a solar device shows current, lux, gateway, RSSI, SNR, latest timestamp, coverage, and a trend chart when fields exist.
4. Selecting an AVC device shows supported water/radio fields and explicit semantic caveats.
5. Selecting NFC/unknown shows an unsupported/unavailable state and makes no Dashboard telemetry call.
6. The default selection range is rolling 72 hours; 24-hour and 7-day presets issue the exact visible windows.
7. Manual refresh updates the rolling window and visibly indicates refresh progress.
8. Rapid device/range changes never flash or retain the prior device's telemetry.
9. An empty source window displays `EmptyDataState`, not zeros/demo data.
10. A request failure displays a safe retryable error and no stale new-device data.
11. Zero current, lux, flow, volume, RSSI, or SNR renders as `0`, not missing.
12. Missing metrics render `—`/unavailable, not numeric zero.
13. Truncated/reached-limit and partially invalid responses show a visible warning.
14. Charts are chronological left-to-right, preserve actual gaps, and expose an accessible summary.
15. Solar voltage/temperature/humidity/state are visibly raw/unconfirmed with no invented units.
16. AVC flags remain numeric raw codes and are not displayed as alarms or booleans.
17. Latest telemetry time is not labeled Online, Offline, Healthy, stale, or last-seen health.
18. Global Online/Offline/online-rate KPIs remain unavailable.
19. The selected panel works with keyboard navigation and at narrow viewport width.
20. Viewer solar/AVC/NFC popup still works after removal of client type-routing hints.
21. Browser requests target only the application proxy, never `api.ttlab.manhthao.uk`.
22. Browser responses/console contain no token, upstream URL, raw stack, or internal error body.
23. There is no periodic telemetry polling visible in the Network panel.
24. Viewer and Dashboard navigation still preserve the single Unity runtime boundary.

---

## 15. Acceptance criteria

Phase 03 is complete only when all statements are true:

- A Dashboard-owned Page 07 telemetry GET endpoint exists.
- The endpoint accepts explicit ISO start/stop and a Dashboard-bounded limit only.
- The default range is rolling 72 hours, with 24-hour and 7-day presets.
- No custom/30-day range or automatic polling is introduced.
- The backend exclusively owns solar/AVC endpoint routing from trusted metadata.
- The browser can no longer select or hint the upstream type endpoint.
- Existing viewer solar/AVC/NFC telemetry continues to work.
- Dashboard telemetry is supported for solar and AVC only in this phase.
- Last telemetry timestamp, gateway, RSSI, SNR, solar current/lux, and supported AVC fields render when present.
- Solar raw fields and AVC counters/flags are visibly qualified according to the authoritative handover.
- Zero and missing values remain distinguishable.
- Coverage, invalid rows, truncation, reached limit, requested window, fetch time, and observation time are traceable.
- Backend readings remain newest-first; chart adapters produce non-mutating chronological copies.
- Gaps are not filled, interpolated, or converted to zero.
- Loading, refreshing, ready, empty, unavailable, unsupported, timeout, and error states are honest and distinct.
- Only explicit selected-device actions fetch telemetry; there is no N+1 catalogue sweep.
- Global Online/Offline/online-rate values remain unavailable.
- Battery percentage, firmware, gateway health, packet rate, OTA, calibration, and alert state are not invented.
- The Dashboard uses Phase 01 provenance/state/chart components and ant-design-charts only.
- No telemetry persistence, migration, report job, automatic retry loop, or upstream mutation is introduced.
- No browser/Unity call targets the upstream host and no secret/raw dependency error leaks.
- Phase 01, Phase 02, viewer telemetry, backend, lint, and build regressions pass or have explicitly documented environment blockers.
- The required Phase 03 implementation handoff exists.

---

## 16. Guardrails for the coding agent

1. Preserve the complete existing dirty working tree; Phase 02 implementation is uncommitted and belongs to the user/task.
2. Do not reset, revert, delete, or recreate Phase 02 files from the plan.
3. Reuse the existing IoT client and telemetry normalizers; do not create a second upstream client.
4. Do not trust client-supplied device type for endpoint routing.
5. Do not expose a generic upstream path or proxy.
6. Do not log or return the Master Bearer Token, authorization header, or upstream URL.
7. Do not call any undocumented upstream endpoint.
8. Do not send upstream `POST`, `PUT`, `PATCH`, or `DELETE`.
9. Do not persist telemetry or mirror raw history into PostgreSQL.
10. Do not fetch telemetry for every catalogue item.
11. Do not add automatic polling or unbounded retry.
12. Do not infer online/offline/freshness without a confirmed cadence policy.
13. Do not invent battery, firmware, gateway, OTA, calibration, packet, alert, or room data.
14. Do not strengthen unconfirmed solar/AVC semantics or convert raw flags to booleans.
15. Do not derive consumption from cumulative counters.
16. Do not replace missing values with zero or empty live data with demo data.
17. Do not copy the viewer SVG chart into Dashboard or install another chart library.
18. Do not broaden work into Page 02 Water, report data, alerts, IAQ, Overview, identity/CASL, PCCC, or Parking.
19. Do not add Page 04, 05, 08, or 10.
20. If a required contract conflicts with current evidence, stop the affected slice, record the blocker, and implement only the independent safe work.

---

## 17. Required implementation evidence

The completion report must include:

- branch and final HEAD commit;
- initial and final dirty working-tree inventory, confirming preserved Phase 02/unrelated changes;
- exact files created/modified;
- final Dashboard telemetry route/query/response contracts;
- final time-range presets, duration/limit validation, and refresh behavior;
- how server-authoritative type routing replaced browser hints;
- trusted cache/detail resolution behavior and unsupported-type behavior;
- exact reuse points in `IotClientService` and `IotTelemetryService`;
- solar and AVC field/display matrices with unresolved semantic labels;
- newest-first backend versus oldest-first chart adapter behavior;
- provenance, availability, coverage, truncation, partial, and error behavior;
- Page 07 selection/request lifecycle and server/client component boundaries;
- proof that no N+1 telemetry sweep or automatic polling exists;
- proof that Online/Offline/health and unsupported fields remain unavailable;
- all test IDs and exact pass/fail/skip results;
- backend unit/e2e/build and web tests/lint/build results;
- manual desktop/narrow/keyboard checks;
- viewer telemetry regression results;
- security audit results for upstream host/token/direct calls/type selectors;
- confirmation of zero database/migration/report/persistence changes;
- confirmation of zero upstream mutation calls;
- any live read-only smoke query performed, or an explicit statement that none was performed;
- all known issues, deviations, and unresolved blockers.

---

## 18. Mandatory final instruction to the coding agent

After implementing and verifying this plan, the coding agent **must create**:

```text
web/doc/bp2_phase03_page07_live_telemetry_core_handoff.md
```

The handoff file must contain every implementation-evidence item from Section 17, a pass/fail result for every acceptance criterion in Section 15, and all unresolved blockers or deviations. **Big Phase 02 / Phase 03 is not complete until this handoff file exists.**
