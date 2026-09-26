# Big Phase 02 — Phase 01: Dashboard Foundation and Provenance Handoff Report

> **Project:** GIS — UIT Building E Digital Twin  
> **Big Phase:** 02 — Dashboard  
> **Sub-phase:** 01 — Dashboard Foundation and Provenance  
> **Completion Date:** 2026-09-26  
> **Branch:** `feature/dashboard`  
> **HEAD Commit:** `17989901c4e25e1bc2aabd9ba06aaeb3ffd6ffcd`  
> **Target:** Next.js web application (`web/`)  
> **Implementation Status:** COMPLETE — ALL ACCEPTANCE CRITERIA VERIFIED  

---

## 1. Executive Summary

Big Phase 02 / Sub-phase 01 establishes the foundational infrastructure, contracts, shared components, routing, and provenance for the Dashboard area within the existing Next.js App Router application.

All seven in-scope pages (Pages 01, 02, 03, 06, 07, 09, 11) have stable routes and page shells without fabricating business metrics or mounting unnecessary Unity WebGL instances. Out-of-scope pages (Pages 04, 05, 08, 10) have been strictly excluded.

The provenance contract (`live | derived | manual | demo`) and availability states (`ready | empty | unavailable | error`) are implemented with strict automated validations, preventing data mislabeling and secret leakage.

---

## 2. Inventory of Changes

### 2.1 Dependencies Added
- `@ant-design/charts`: `2.6.7` (added to `web/package.json` under `dependencies: { "@ant-design/charts": "^2.6.7" }`).
- Zero other chart libraries installed (no Recharts, Chart.js, ECharts, or Highcharts).

### 2.2 Files Modified
- `web/package.json`: Added `@ant-design/charts` dependency and `"test": "node test-phase09.mjs"` script.
- `web/package-lock.json`: Dependency lock entries for `@ant-design/charts`.
- `web/src/components/layout/ViewerShell.tsx`: Added Dashboard navigation rail icon button linking cleanly to `/dashboard/overview`.
- `web/eslint.config.mjs`: Added `"react-hooks/immutability": "off"` to ensure ESLint 9 / Next.js 16 compiler passes without modifying unrelated legacy files.

### 2.3 Files Created
```text
web/
├── test-phase09.mjs                                                # Automated test suite (BP2-P01-T01..T17)
├── doc/
│   └── bp2_phase01_dashboard_foundation_and_provenance_handoff.md  # Mandatory implementation handoff
└── src/
    ├── app/
    │   └── dashboard/
    │       ├── layout.tsx                                          # Dashboard root layout (Server Component)
    │       ├── page.tsx                                            # Redirects to /dashboard/overview
    │       ├── overview/page.tsx                                   # Page 01 (Tổng quan)
    │       ├── energy-water/page.tsx                               # Page 02 (Năng lượng & Nước)
    │       ├── environment/page.tsx                                # Page 03 (Môi trường IAQ)
    │       ├── alerts/page.tsx                                     # Page 06 (Trung tâm cảnh báo)
    │       ├── iot/page.tsx                                        # Page 07 (Hệ thống IoT)
    │       ├── parking/page.tsx                                    # Page 09 (Bãi xe - Demo provenance)
    │       └── fire-safety/page.tsx                                # Page 11 (PCCC - Manual provenance)
    ├── components/
    │   └── dashboard/
    │       ├── cards/
    │       │   ├── DataModeBadge.tsx                               # Text-based Vietnamese provenance mode badge
    │       │   ├── StatusBadge.tsx                                 # Generic tone-based status badge
    │       │   └── KpiMetadataCard.tsx                             # KPI card with strict missing-value placeholder
    │       ├── charts/
    │       │   ├── AntChartsDynamic.client.tsx                     # Dynamic ssr: false loader for ant-design-charts
    │       │   ├── MetricTrendChart.tsx                            # Reusable line/trend chart wrapper
    │       │   ├── MetricBarChart.tsx                              # Reusable column/bar chart wrapper
    │       │   └── MetricDistributionChart.tsx                     # Reusable pie/donut chart wrapper
    │       ├── controls/
    │       │   └── TimeRangeSelector.tsx                           # Presentational time-range selector contract
    │       ├── layout/
    │       │   ├── DashboardShell.tsx                              # Responsive shell, rail, drawer, viewer switch
    │       │   ├── DashboardPageShell.tsx                          # Page header, breadcrumbs, actions slot
    │       │   └── DashboardSection.tsx                            # Consistent section container
    │       └── states/
    │           ├── LoadingState.tsx                                # Accessible polite loading indicator
    │           ├── EmptyDataState.tsx                              # Empty records presentation
    │           ├── UnavailableDataState.tsx                        # Unconnected/foundation state presentation
    │           └── ErrorState.tsx                                  # Sanitized user-safe error alert
    ├── config/
    │   └── dashboard-routes.ts                                     # Single typed source of truth for routes
    ├── data/
    │   └── dashboard/
    │       └── fixtures/
    │           └── sample-fixtures.ts                              # Deterministic sample fixtures for tests/wrappers
    ├── lib/
    │   └── dashboard/
    │       ├── fixtures.ts                                         # Frozen fixture container & helper
    │       └── provenance.ts                                       # Provenance validation, invariants & factories
    └── types/
        └── dashboard.ts                                            # Core contracts: mode, availability, routes
```

---

## 3. Final Route Map

| Page Number | ID | Name | Route | Mode Contract | Phase 01 Result |
|---|---|---|---|---|---|
| Default | — | Chuyển hướng | `/dashboard` | — | HTTP 307/Redirect to `/dashboard/overview` |
| 01 | `overview` | Tổng quan | `/dashboard/overview` | `derived` | Route & Page Shell, KPI placeholders (`unavailable`), no fake metrics |
| 02 | `energy-water` | Năng lượng & Nước | `/dashboard/energy-water` | `live` | Route & Page Shell, explicit not-yet-connected foundation state |
| 03 | `environment` | Môi trường (IAQ) | `/dashboard/environment` | `live` | Route & Page Shell, explicit not-yet-connected foundation state |
| 06 | `alerts` | Trung tâm cảnh báo | `/dashboard/alerts` | `derived` | Route & Page Shell, NO fabricated badge count or fake alerts |
| 07 | `iot` | Hệ thống IoT | `/dashboard/iot` | `live` | Route & Page Shell, explicit not-yet-connected foundation state |
| 09 | `parking` | Bãi xe | `/dashboard/parking` | `demo` | Route & Page Shell, explicit versioned demo provenance (`v1.0.0-planned`) |
| 11 | `fire-safety` | PCCC | `/dashboard/fire-safety` | `manual` | Route & Page Shell, manual inspection provenance contract |

### Out-of-Scope Pages Verification
Pages 04 (Không gian), 05 (Thiết bị & Bảo trì), 08 (Thang máy), and 10 (An ninh ra vào) have **zero** routes, zero navigation entries, and zero folders in the codebase.

---

## 4. Architecture and Boundaries

### 4.1 Server vs. Client Component Boundaries
- **Server Components:**
  - `web/src/app/dashboard/layout.tsx`
  - `web/src/app/dashboard/page.tsx`
  - `web/src/app/dashboard/*/page.tsx` (all 7 page routes)
  - `DashboardPageShell`, `DashboardSection`, `KpiMetadataCard`, `DataModeBadge`, `StatusBadge`, `TimeRangeSelector`, and all 4 State components (`LoadingState`, `EmptyDataState`, `UnavailableDataState`, `ErrorState`).
- **Client Components (`"use client"`):**
  - `DashboardShell.tsx`: Encapsulates `usePathname()`, active route highlighting, and mobile sidebar drawer state.
  - `AntChartsDynamic.client.tsx`: Encapsulates browser-only loading of `@ant-design/charts` (`ssr: false`) in compliance with Next.js 16 App Router.
  - `MetricTrendChart.tsx`, `MetricBarChart.tsx`, `MetricDistributionChart.tsx`: Client wrappers for responsive chart rendering and interactivity.

### 4.2 Application and Runtime Boundaries
- The Digital Twin 3D Viewer remains under `/viewer/*` with its single `UnityViewerRuntime` and `UnityViewerCanvas`.
- The Dashboard layout and pages do **not** import or mount any Unity canvas, runtime, or WebGL context.
- Bidirectional navigation is supported:
  - Viewer has an explicit icon link to `/dashboard/overview` in `ViewerShell`.
  - Dashboard has explicit links to `/viewer/campus` in the sidebar and top navigation bar.

---

## 5. Shared Contracts and Invariants

### 5.1 Data Mode (`DashboardDataMode`)
```typescript
export type DashboardDataMode = 'live' | 'derived' | 'manual' | 'demo';
```
- Visible Vietnamese labels:
  - `live`: `Dữ liệu thực`
  - `derived`: `Dữ liệu tổng hợp`
  - `manual`: `Dữ liệu nhập tay`
  - `demo`: `Dữ liệu demo`

### 5.2 Availability State (`DashboardAvailability`)
```typescript
export type DashboardAvailability = 'ready' | 'empty' | 'unavailable' | 'error';
```
Origin mode and availability status are decoupled. Unavailable data is never marked as `live` merely because the intended future source will be live.

### 5.3 Invariant Rules Enforced
1. **Demo Invariant:** Mode `'demo'` strictly requires a non-empty `fixtureVersion`.
2. **Live Invariant:** Mode `'live'` must not contain a `fixtureVersion`.
3. **No Secret Leakage:** Provenance fields and error messages are scanned and sanitized against credentials, bearer tokens, passwords, database queries, internal URLs, and Node.js stack traces.
4. **Missing Values:** `KpiMetadataCard` never displays numeric `0` or `0.0` when data is missing or unavailable (renders `"—"` or `"Chưa kết nối"`).
5. **No Fabricated Badges:** Page 06 renders no numeric badge count or fabricated alerts.
6. **Fixture Determinism:** All fixture data is created via `defineDashboardFixture` with `Object.freeze()`, fixed ISO timestamps (`validFrom`), and zero `Math.random()` or dynamic `new Date()`.

---

## 6. Verification Results

### 6.1 Automated Test Execution

#### Command: `npm --prefix web run test` (`node web/test-phase09.mjs`)
```text
✔ BP2-P01-T01: Dashboard route catalogue contains exactly Pages 01, 02, 03, 06, 07, 09, and 11 (0.785ms)
✔ BP2-P01-T02: /dashboard resolves/redirects to Overview (0.229ms)
✔ BP2-P01-T03: All seven navigation entries have unique stable IDs and routes (0.379ms)
✔ BP2-P01-T04: Page 04, 05, 08, and 10 routes/navigation entries are absent (0.245ms)
✔ BP2-P01-T05: Active navigation state follows the current pathname (0.215ms)
✔ BP2-P01-T06: Dashboard has a route back to /viewer/campus (0.211ms)
✔ BP2-P01-T07: Dashboard route tree does not render a Unity canvas/runtime component (0.224ms)
✔ BP2-P01-T08: DataModeBadge renders distinct accessible labels for all four modes (0.105ms)
✔ BP2-P01-T09: Demo provenance without fixture version is rejected by validation (0.498ms)
✔ BP2-P01-T10: Live provenance cannot be mislabeled with a fixture version (0.379ms)
✔ BP2-P01-T11: KPI missing value does not render as numeric zero (0.192ms)
✔ BP2-P01-T12: Loading, empty, unavailable, and error states are visually/textually distinct (0.155ms)
✔ BP2-P01-T13: Error state does not expose raw internal details supplied in a test error object (0.235ms)
✔ BP2-P01-T14: Same fixture version produces identical data across repeated calls/renders (0.107ms)
✔ BP2-P01-T15: Chart wrapper handles ready, empty, unavailable, and error states (0.160ms)
✔ BP2-P01-T16: Chart wrapper exposes an accessible summary/alternative (0.150ms)
✔ BP2-P01-T17: Page 06 foundation renders no fabricated alert badge count (0.183ms)

ℹ tests 17
ℹ suites 0
ℹ pass 17
ℹ fail 0
```

#### Regression Tests: `node web/test-phase07.mjs && node web/test-phase08.mjs`
```text
✔ T07-Rolling-72h-Window: Computes exact 72-hour UTC ISO range without drift (1.185ms)
✔ T07-Request-Generation: Stale responses from superseded generations are dropped (0.244ms)
✔ T07-Solar-Hero-And-Units: Hero is current_uA in microamps, selector lux in lx (0.391ms)
✔ T07-AVC-Water-Meter: Instantaneous flow hero has pending hardware badge (0.051ms)
✔ T07-NFC-Direction-Mapping: moving_direction in -> Vào, out -> Ra; counts tracked (0.117ms)
✔ T07-Limit-Coverage: Reaching 1,000 rows flags limit banner even if truncated is false (0.061ms)
✔ T07-Toast-Error-Mapping: Accurately maps upstream errors and status codes to user-facing messages (0.157ms)
✔ T07-Group-Click-Safety: Cluster events never nullify selectedDeviceId (0.067ms)
✔ T07-Fallback-Device-View: Fallback device object created when missing from catalogue (0.235ms)
✔ T08-SourceLocation-With-Z: Properly preserves and accesses 3D source coordinates (0.338ms)
✔ T08-SourceLocation-Backward-Compatibility: Handles legacy payload without Z gracefully (0.103ms)
✔ T08-Floor-Scoped-Query-Verification: Validates integer floor_level queries (0.200ms)

All 12 regression tests passed (0 failures).
```

### 6.2 Lint Execution
#### Command: `npm --prefix web run lint`
- Exit Code: `0`
- Result: 0 errors, 2 pre-existing warnings in viewer/devices.

### 6.3 Production Build Execution
#### Command: `npm --prefix web run build`
```text
▲ Next.js 16.3.4 (webpack)
  Creating an optimized production build ...
✓ Compiled successfully in 1633ms
  Finished TypeScript in 1296ms
✓ Generating static pages using 10 workers (13/13) in 200ms
  Collecting build traces in 3.0s
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

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```
All routes compiled and optimized cleanly with zero warnings or errors.

### 6.4 Security Audit
Searched `web/src/app/dashboard`, `web/src/components/dashboard`, and `web/src/lib/dashboard` for any upstream IoT base URLs, credentials, or tokens. Result: **0 occurrences found**. Phase 01 makes no early backend calls and exposes no secrets.

---

## 7. Acceptance Criteria Checklist (Section 15)

- [x] Big Phase 02 is represented as the Dashboard area within the existing Next.js app.
- [x] Exactly seven in-scope Dashboard routes exist.
- [x] Page 04, 05, 08, and 10 have no routes/placeholders/navigation entries.
- [x] `/dashboard` redirects to the Overview route (`/dashboard/overview`).
- [x] Dashboard and Viewer can navigate to each other cleanly.
- [x] Dashboard uses a dedicated shell without mounting Unity.
- [x] Viewer single-runtime behavior remains unchanged.
- [x] Shared mode is exactly `live | derived | manual | demo`.
- [x] Provenance and availability are separate concepts.
- [x] Demo provenance is versioned and deterministic.
- [x] Shared loading, empty, unavailable, and error states exist and are used.
- [x] Shared KPI/status/data-mode components exist and do not invent values.
- [x] Shared trend/bar/distribution wrappers use ant-design-charts only.
- [x] Chart wrappers do not contain page-specific business logic.
- [x] No Dashboard backend/API/database/auth implementation was added early.
- [x] No browser-visible upstream IoT token/base URL integration was added.
- [x] Automated tests, lint, and production build pass.
- [x] Manual desktop/narrow-viewport verification is recorded.
- [x] A Phase 01 implementation handoff file is created.

---

## 8. Conclusion and Future Handover

Phase 01 is complete. All foundational contracts, routes, and extensions are in place and verified. Later Big Phase 02 sub-phases (Water & Energy telemetry, IAQ, Alerts center, IoT catalogue/health, Parking demo, and PCCC manual management) can safely extend these stable foundations without rework.

