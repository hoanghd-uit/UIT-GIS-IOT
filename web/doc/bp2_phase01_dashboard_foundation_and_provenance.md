# Big Phase 02 — Phase 01: Dashboard Foundation and Provenance

> **Project:** GIS — UIT Building E Digital Twin  
> **Big Phase:** 02 — Dashboard  
> **Sub-phase:** 01  
> **Plan date:** 2026-09-26  
> **Status:** PLANNED — NOT IMPLEMENTED  
> **Implementation owner:** Coding agent  
> **Primary target:** Next.js web application  
> **Source plan:** `dashboard_big_phase_small_phase_plan.md`, formerly listed as Small Phase 09  
> **Dashboard authority:** `Dashboard_Knowledge_Base.md`  
> **Project authority:** `Knowledge_Base.md`

---

## 1. Purpose

Big Phase 02 begins the Dashboard work for the GIS — UIT Building E Digital Twin project.

This first sub-phase creates the Dashboard foundation shared by all later Big Phase 02 phases:

- Dashboard routes and navigation for the seven frozen in-scope pages;
- a Dashboard-specific application shell inside the existing Next.js application;
- data-mode and provenance contracts;
- shared visual/state components;
- shared ant-design-charts wrappers;
- deterministic demo-fixture conventions;
- tests proving the foundation is safe for later live, derived, manual, and demo data work.

This is an implementation plan only. The planning agent must not implement the source changes described below. A coding agent will use this document as its implementation handover plan.

---

## 2. Big Phase 02 scope

Big Phase 02 is the Dashboard Big Phase. It contains only the Dashboard work arranged in `dashboard_big_phase_small_phase_plan.md`.

### 2.1 Dashboard pages in scope

| Page | Name | Phase 01 result |
| --- | --- | --- |
| 01 | Tổng quan | Route, navigation entry, page shell, explicit not-yet-connected state |
| 02 | Năng lượng & Nước | Route, navigation entry, page shell, explicit not-yet-connected state |
| 03 | Môi trường (IAQ) | Route, navigation entry, page shell, explicit not-yet-connected state |
| 06 | Trung tâm cảnh báo | Route, navigation entry, page shell, no fabricated badge count |
| 07 | Hệ thống IoT | Route, navigation entry, page shell, explicit not-yet-connected state |
| 09 | Bãi xe | Route, navigation entry, page shell, explicit future demo provenance |
| 11 | PCCC | Route, navigation entry, page shell, explicit not-yet-connected state |

### 2.2 Pages explicitly out of scope

Do not create routes, navigation entries, placeholder pages, backend modules, or data domains for:

- Page 04 — Không gian;
- Page 05 — Thiết bị & Bảo trì;
- Page 08 — Thang máy;
- Page 10 — An ninh ra vào.

### 2.3 Big Phase 02 future sub-phases

Later Big Phase 02 sub-phases will implement real IoT catalogue/telemetry, Water, report data, IAQ, alerts, Overview, CASL, PCCC, Energy demo, and Parking demo. Phase 01 must provide stable extension points for those phases without implementing them early.

---

## 3. Repository baseline to preserve

The coding agent must re-check the repository before editing. The planning audit on 2026-09-26 found:

- Next.js `16.3.4` with React `19.2.8` and App Router under `web/src/app`.
- The root route currently redirects to `/viewer/campus`.
- The existing viewer is isolated under `/viewer` and uses `ViewerShell` plus a single Unity WebGL runtime/canvas.
- Global styling uses Tailwind CSS 4 and CSS custom properties in `web/src/app/globals.css`.
- The chosen ant-design-charts library is not installed yet.
- There is no Dashboard route/component tree yet.
- There is no Dashboard `DataMode` or provenance contract yet.
- CASL and application authentication are not installed/implemented yet; they are not part of this phase.
- Current web tests include the phase-specific Node scripts used by earlier IoT phases; there is no established React component-test runner in `web/package.json`.
- The working tree may contain user-owned changes. Preserve all unrelated files and changes.

The coding agent must read `web/AGENTS.md` and the relevant guides under `web/node_modules/next/dist/docs/` before choosing routing, layout, server/client, caching, or data-fetching patterns. This repository uses a Next.js version with behavior that must not be inferred from older conventions.

---

## 4. Phase goal

At the end of Big Phase 02 / Phase 01:

1. The existing Next.js application has a navigable Dashboard area.
2. Exactly seven in-scope Dashboard pages have stable routes and page identities.
3. The Dashboard does not mount or duplicate the Unity runtime.
4. All later data-bearing components can use one shared `live | derived | manual | demo` contract.
5. Loading, empty, unavailable, and error presentation is consistent.
6. Charts use shared wrappers around ant-design-charts.
7. Demo fixtures have deterministic, versioned provenance.
8. No page displays fake business values or claims to be data-complete.

---

## 5. Non-goals

Do not implement any of the following in this phase:

- NestJS Dashboard controllers/services/DTOs;
- IoT device catalogue or telemetry fetching for Dashboard;
- browser or Unity calls to the upstream IoT backend;
- Water, Energy, IAQ, alert, IoT-health, Parking, or PCCC business metrics;
- PostgreSQL Dashboard tables or migrations;
- report-data aggregation/jobs;
- alert evaluation or alert configuration;
- notification badge counts;
- authentication, identity, CASL abilities, or protected write operations;
- manual PCCC CRUD;
- `FloorCatalog`, `InteractiveFloorGrid`, room mapping, or fire-zone mapping;
- custom drag/drop Dashboard layout;
- changes to the single Unity runtime architecture;
- Page 04, 05, 08, or 10;
- a second chart library;
- random demo numbers.

Phase 01 may render an explicit “not connected in this phase” state inside an in-scope route, but it must not show proposal numbers or dummy metrics as though they were real.

---

## 6. Decisions frozen for Phase 01

### 6.1 Application boundary

- Dashboard remains inside the current Next.js application.
- Dashboard gets its own route layout and shell.
- Viewer routes and the Unity runtime remain under `/viewer`.
- Navigating to Dashboard must not mount a second Unity canvas.
- Do not refactor the viewer architecture merely to share a shell.

### 6.2 Route map

Implement this route map unless the repository audit reveals a direct technical conflict. If a conflict exists, the coding agent must document the chosen equivalent in the handoff.

| Page | Route |
| --- | --- |
| Dashboard default | `/dashboard` redirects to `/dashboard/overview` |
| 01 — Tổng quan | `/dashboard/overview` |
| 02 — Năng lượng & Nước | `/dashboard/energy-water` |
| 03 — Môi trường (IAQ) | `/dashboard/environment` |
| 06 — Trung tâm cảnh báo | `/dashboard/alerts` |
| 07 — Hệ thống IoT | `/dashboard/iot` |
| 09 — Bãi xe | `/dashboard/parking` |
| 11 — PCCC | `/dashboard/fire-safety` |

Routes must come from one typed route/catalogue configuration. Do not hard-code separate route/name lists in the shell, mobile navigation, tests, and page headers.

### 6.3 Server/client boundary

- Keep route pages and layouts as Server Components by default.
- Isolate `usePathname`, navigation interaction, responsive menu state, and chart rendering in the smallest necessary Client Components.
- Do not add `"use client"` to the whole Dashboard tree for convenience.
- Phase 01 performs no Dashboard data fetching.

### 6.4 Visual direction

- Reuse the existing dark visual tokens where suitable.
- Dashboard-specific tokens may be added, but they must not break the viewer.
- Dashboard main content must support vertical scrolling; do not inherit a viewer-only overflow constraint that makes pages unusable.
- Status and data-mode meaning must never depend on color alone.
- UI text should be Vietnamese where it is user-facing; code identifiers remain clear English names.

---

## 7. Target source organization

The coding agent must adapt names to actual repository conventions, but the expected ownership is:

```text
web/src/
├── app/
│   └── dashboard/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── overview/page.tsx
│       ├── energy-water/page.tsx
│       ├── environment/page.tsx
│       ├── alerts/page.tsx
│       ├── iot/page.tsx
│       ├── parking/page.tsx
│       └── fire-safety/page.tsx
├── components/
│   └── dashboard/
│       ├── layout/
│       ├── cards/
│       ├── charts/
│       └── states/
├── config/
│   └── dashboard-routes.ts
├── data/
│   └── dashboard/
│       └── fixtures/
├── lib/
│   └── dashboard/
└── types/
    └── dashboard.ts
```

This is a responsibility map, not permission to create empty folders or unused abstractions. Create only files used by Phase 01.

---

## 8. Shared data and provenance contract

### 8.1 Required data mode

Define one shared type:

```ts
export type DashboardDataMode = 'live' | 'derived' | 'manual' | 'demo';
```

Semantics:

| Mode | Meaning |
| --- | --- |
| `live` | Real data read from an approved source through the application backend |
| `derived` | Data calculated by the application from real/report data |
| `manual` | Application-owned data entered or edited by an authorized user |
| `demo` | Deterministic fixture data used intentionally for demonstration |

Do not add an `unknown` mode to bypass provenance. Availability/quality is a separate state.

### 8.2 Required availability state

Create a separate shared availability/status type sufficient for:

```text
ready
empty
unavailable
error
```

`loading` is a UI/request state and may be represented separately. `stale` may be expressed as a quality flag rather than falsely treated as a data mode. The implementation must keep data origin and data availability separate.

### 8.3 Provenance fields

Define a compact shared provenance interface that can express:

- `mode`;
- stable source identifier/type;
- observation/sample time when applicable;
- source window start/stop when applicable;
- application fetch time when applicable;
- application calculation time when applicable;
- fixture version when `mode === 'demo'`;
- human-readable caveats or an equivalent structured warning list.

Use ISO-8601 strings at API/UI boundaries. Do not require irrelevant fields for every mode, but validate mode-specific requirements in helper functions/tests.

Minimum invariants:

- `demo` requires a non-empty fixture version.
- `live` must not claim `fixtureVersion`.
- `derived` must be able to identify its source window/calculation time when those concepts apply.
- `manual` must leave space for audit identity/timestamps in later phases.
- provenance must not contain secrets, bearer tokens, or raw internal errors.

### 8.4 Display contract

Implement a `DataModeBadge` that:

- uses consistent Vietnamese labels;
- includes text, not color alone;
- can expose provenance/caveats accessibly;
- never labels empty/unavailable data as live merely because live was the intended source;
- can be reused in cards, charts, tables, and detail panels.

Recommended visible labels:

| Mode | Label |
| --- | --- |
| `live` | Dữ liệu thực |
| `derived` | Dữ liệu tổng hợp |
| `manual` | Dữ liệu nhập tay |
| `demo` | Dữ liệu demo |

---

## 9. Shared component scope

Implement only foundation components with stable cross-page value.

### 9.1 Layout components

- `DashboardShell`: left navigation, top header, scrollable content area, responsive navigation behavior.
- `DashboardPageShell`: page title, description/subtitle, optional page actions, and content container.
- `DashboardSection`: consistent section title, optional description/action, and content spacing.

The shell must include a clear route back to the Digital Twin viewer. Add a Dashboard entry to the existing viewer navigation only if it can be done without restructuring or regressing `ViewerShell`.

### 9.2 Display components

- `KpiMetadataCard`: label, value slot, optional unit/trend slot, provenance, and availability rendering.
- `StatusBadge`: generic status label; do not encode alert business rules.
- `DataModeBadge`: required provenance mode display.

`KpiMetadataCard` must not invent a zero when a value is missing. Missing, empty, and unavailable must render distinctly.

### 9.3 State components

- `LoadingState`;
- `EmptyDataState`;
- `UnavailableDataState`;
- `ErrorState`.

Requirements:

- clear Vietnamese message;
- optional safe retry/action callback where appropriate;
- no raw stack trace, upstream URL, token, or internal error body;
- usable inside a card, section, or full page;
- accessible semantics and keyboard focus when an action exists.

### 9.4 Time-range selector contract

Create a presentational/shared `TimeRangeSelector` contract for later phases, but do not connect it to an API in Phase 01.

It must be able to represent explicit start/stop values and a bounded preset identifier. Do not bake an undocumented “latest” or 72-hour upstream rule into the generic component.

---

## 10. Chart foundation

### 10.1 Dependency

Install the official ant-design-charts package compatible with the repository's React and Next.js versions. The expected package is `@ant-design/charts`; the coding agent must verify compatibility and record the exact installed version in the handoff.

Do not install Recharts, Chart.js, ECharts, Highcharts, or another chart library.

### 10.2 Client isolation

Chart wrappers may be Client Components. Keep ant-design-charts imports inside the chart layer so route pages and non-chart components are not unnecessarily client-rendered.

If the library requires browser-only loading, use the current Next.js 16 documented pattern rather than an older workaround copied from memory.

### 10.3 Required wrappers

Create the minimum reusable wrappers needed by the Dashboard KB:

- `MetricTrendChart`;
- `MetricBarChart`;
- `MetricDistributionChart`.

Each wrapper must accept normalized data plus:

- metric label;
- unit;
- time/category key mapping;
- provenance;
- loading/empty/unavailable/error state;
- accessible text/table summary or equivalent non-visual description.

Do not put Page 02, 03, 06, 07, or 09 business logic into generic chart wrappers.

### 10.4 Phase 01 chart data

Use fixed test-only sample inputs for wrapper tests. Do not render proposal-derived chart values as actual Dashboard content in the seven routes.

---

## 11. Deterministic fixture foundation

Phase 01 defines fixture rules for later demo work; it does not populate complete Energy or Parking datasets.

Required fixture metadata:

```text
fixture ID
fixture version
data mode = demo
fixed generated/valid-from timestamp or explicit scenario timestamp
human-readable scenario description
```

Rules:

- no `Math.random()` in Dashboard data or rendering code;
- no implicit `new Date()` used to change fixture values on every render;
- repeated loads of the same fixture version produce identical values;
- fixture data lives outside React components;
- fixture values never enter live/derived alert evaluation;
- fixture and live data must not be merged into one unlabeled series;
- future fixture replacement must be possible through adapters without changing page component contracts.

Create only a minimal fixture/helper used to prove these invariants in tests. Full page fixtures belong to later phases.

---

## 12. Implementation checkpoints

### Checkpoint A — Audit and lock the baseline

1. Read `web/AGENTS.md` completely.
2. Read the relevant local Next.js 16 docs for App Router pages/layouts, redirects, links, client directives, and browser-only components.
3. Re-check `web/package.json`, `web/src/app`, `ViewerShell`, global styles, and existing tests.
4. Record pre-existing working-tree changes and avoid modifying unrelated files.
5. Confirm no Dashboard implementation appeared after this plan was written.

**Checkpoint exit:** the coding agent has recorded the actual paths/conventions it will extend.

### Checkpoint B — Routes and Dashboard shell

1. Add the typed Dashboard route catalogue.
2. Add `/dashboard` redirect.
3. Add the seven page routes.
4. Implement Dashboard layout/shell and active navigation state.
5. Add viewer-to-dashboard and dashboard-to-viewer navigation without touching Unity lifecycle logic.
6. Verify responsive/scroll behavior.

**Checkpoint exit:** all seven routes are navigable, out-of-scope routes do not exist, and no Unity canvas is mounted under Dashboard.

### Checkpoint C — Data/provenance contracts

1. Add shared mode, availability, and provenance types.
2. Add validation/type-guard/helper behavior for invariants.
3. Add `DataModeBadge` and safe provenance display.
4. Test live/derived/manual/demo examples and invalid combinations.

**Checkpoint exit:** later phases can represent source and availability without inventing values.

### Checkpoint D — Shared layout, card, and state components

1. Implement the Phase 01 component set.
2. Use the components in all seven route shells.
3. Ensure Page 06 shows no numeric notification count.
4. Ensure pages show an explicit foundation/unavailable state instead of fake metrics.

**Checkpoint exit:** route pages demonstrate the shared system without business-data implementation.

### Checkpoint E — Chart and fixture foundation

1. Install and isolate ant-design-charts.
2. Implement the three chart wrappers.
3. Add fixed test inputs and accessible summaries.
4. Implement the minimal versioned fixture helper/sample.
5. Prove determinism and separation from live data contracts.

**Checkpoint exit:** chart and fixture foundations are ready for later page phases.

### Checkpoint F — Verification and documentation

1. Run lint, production build, new tests, and relevant existing web regression tests.
2. Inspect all seven routes in a browser at desktop and narrow viewport sizes.
3. Confirm active navigation, scrolling, keyboard behavior, state messages, and no Unity duplicate.
4. Search the client bundle/source for the upstream IoT base URL and token variable names; Phase 01 must not introduce them.
5. Record exact files, commands, results, deviations, and screenshots/manual checks in the handoff.

**Checkpoint exit:** every acceptance item has evidence.

---

## 13. Testing plan

The coding agent must add an appropriate web test setup if the existing Node-script approach cannot validate React components. Choose a test stack compatible with Next.js 16 and React 19, keep it scoped, and document why it was added.

Minimum automated coverage:

| ID | Test |
| --- | --- |
| BP2-P01-T01 | Dashboard route catalogue contains exactly Pages 01, 02, 03, 06, 07, 09, and 11 |
| BP2-P01-T02 | `/dashboard` resolves/redirects to Overview |
| BP2-P01-T03 | All seven navigation entries have unique stable IDs and routes |
| BP2-P01-T04 | Page 04, 05, 08, and 10 routes/navigation entries are absent |
| BP2-P01-T05 | Active navigation state follows the current pathname |
| BP2-P01-T06 | Dashboard has a route back to `/viewer/campus` |
| BP2-P01-T07 | Dashboard route tree does not render a Unity canvas/runtime component |
| BP2-P01-T08 | `DataModeBadge` renders distinct accessible labels for all four modes |
| BP2-P01-T09 | Demo provenance without fixture version is rejected by the selected validation/helper strategy |
| BP2-P01-T10 | Live provenance cannot be mislabeled with a fixture version |
| BP2-P01-T11 | KPI missing value does not render as numeric zero |
| BP2-P01-T12 | Loading, empty, unavailable, and error states are visually/textually distinct |
| BP2-P01-T13 | Error state does not expose raw internal details supplied in a test error object |
| BP2-P01-T14 | Same fixture version produces identical data across repeated calls/renders |
| BP2-P01-T15 | Chart wrapper handles ready, empty, unavailable, and error states |
| BP2-P01-T16 | Chart wrapper exposes an accessible summary/alternative |
| BP2-P01-T17 | Page 06 foundation renders no fabricated alert badge count |

Required verification commands, adapted if the coding agent adds a test script:

```text
npm --prefix web run lint
npm --prefix web run build
npm --prefix web run test
node web/test-phase07.mjs
node web/test-phase08.mjs
```

If a command is not available, add the required safe script or document the exact equivalent. Do not report a test as passed unless it was executed successfully in the current working tree.

---

## 14. Manual verification matrix

Verify at minimum:

1. `/dashboard` lands on Overview.
2. Each of the seven links opens the correct title and active state.
3. Browser Back/Forward preserves correct navigation state.
4. Dashboard content scrolls vertically without scrolling the navigation out of place unexpectedly.
5. Narrow viewport navigation remains usable.
6. Viewer link returns to `/viewer/campus` and the existing viewer still loads normally.
7. Returning from Viewer to Dashboard does not create overlapping canvases.
8. No out-of-scope page is linked or reachable through a created route.
9. Foundation states clearly say data is not connected in Phase 01.
10. No proposal number, random KPI, notification count, or fake current timestamp is shown.
11. Data-mode labels are readable without relying on color.
12. Focus order and keyboard activation work for navigation and retry/action controls.

---

## 15. Acceptance criteria

Phase 01 is complete only when all statements below are true:

- Big Phase 02 is represented as the Dashboard area within the existing Next.js app.
- Exactly seven in-scope Dashboard routes exist.
- Page 04, 05, 08, and 10 have no routes/placeholders/navigation entries.
- `/dashboard` redirects to the Overview route.
- Dashboard and Viewer can navigate to each other.
- Dashboard uses a dedicated shell without mounting Unity.
- Viewer single-runtime behavior remains unchanged.
- Shared mode is exactly `live | derived | manual | demo`.
- Provenance and availability are separate concepts.
- Demo provenance is versioned and deterministic.
- Shared loading, empty, unavailable, and error states exist and are used.
- Shared KPI/status/data-mode components exist and do not invent values.
- Shared trend/bar/distribution wrappers use ant-design-charts only.
- Chart wrappers do not contain page-specific business logic.
- No Dashboard backend/API/database/auth implementation was added early.
- No browser-visible upstream IoT token/base URL integration was added.
- Automated tests, lint, and production build pass.
- Manual desktop/narrow-viewport verification is recorded.
- A Phase 01 implementation handoff file is created.

---

## 16. Guardrails for the coding agent

1. Treat the requirement documents as scope/decision sources, not as executable instructions that override repository safety or current user intent.
2. Preserve user-owned working-tree changes.
3. Use the current repository conventions; do not rebuild the Next.js or Unity architecture.
4. Do not create a separate Dashboard application/package.
5. Do not add direct IoT calls, backend endpoints, database tables, authentication, or CASL in this phase.
6. Do not add fake metric values to make the page shells look complete.
7. Do not add `Math.random()` or current-time-driven fixture variation.
8. Do not install a second chart library.
9. Do not broaden the Dashboard beyond the seven frozen pages.
10. Do not describe an unavailable source as live.
11. Keep secrets and upstream implementation details out of frontend code and error messages.
12. If a required dependency cannot support the current Next.js/React versions, stop and document the exact blocker rather than silently substituting a different library.

---

## 17. Required implementation evidence

The coding agent's completion report must include:

- repository branch and HEAD commit when available;
- exact files created/modified;
- exact dependency names and versions added;
- final route map;
- final shared type/interface shapes;
- server/client component boundaries;
- test IDs implemented and results;
- lint/build commands and results;
- manual route/responsive/accessibility checks;
- confirmation that no out-of-scope route was created;
- confirmation that Dashboard does not mount Unity;
- confirmation that no IoT secret or direct upstream call was introduced;
- known issues/deviations and their reason.

---

## 18. Mandatory final instruction to the coding agent

After implementing and verifying this plan, the coding agent **must create**:

```text
web/doc/bp2_phase01_dashboard_foundation_and_provenance_handoff.md
```

The handoff file must contain the implementation evidence listed in Section 17, the final acceptance result for every criterion in Section 15, and any unresolved blocker or deviation. **Big Phase 02 / Phase 01 is not complete until this handoff file exists.**
