# Big Phase 02 — Phase 06: Page 06 Alert Center Baseline

> **Project:** GIS — UIT Building E Digital Twin  
> **Loại tài liệu:** Kế hoạch bàn giao cho Coding Agent  
> **Trạng thái:** PLAN ONLY — KHÔNG IMPLEMENT TRONG TÀI LIỆU NÀY  
> **Ngày lập kế hoạch:** 2026-09-29  
> **Roadmap mapping:** `Small Phase 14 — Page 06 alert-center baseline and in-memory evaluator boundary`  
> **Trang mục tiêu:** Page 06 — Trung tâm cảnh báo  
> **Route:** `/dashboard/alerts`  
> **Phụ thuộc đã hoàn tất:** Dashboard foundation, Page 07 catalogue/telemetry, Page 02 Water, Page 03 Environment, Dashboard UI alignment  
> **Mockup:** `codex-clipboard-ed929042-53a2-4538-ba2d-da51f71656f0.png`, ảnh gốc `2406 × 1682 px`, chỉ dùng làm visual reference

---

## 1. Mục tiêu

Thay Page 06 placeholder cũ bằng Alert Center bám sát mockup và visual system mới, nhưng không tạo cảnh báo vận hành giả hoặc persistence sớm khi các prerequisite chưa sẵn sàng.

Phase này phải:

- tạo một pure NestJS alert-evaluator boundary nhận typed samples và explicit typed rule config;
- giữ authoritative runtime rule registry **rỗng** cho đến khi metric semantics/unit, baseline, cadence và duration policy được xác nhận;
- cung cấp read-only capability/evaluation-status API để frontend biết vì sao live alert evaluation chưa khả dụng;
- dựng đầy đủ Page 06 list/filter/detail/KPI/chart/rule visual structure bằng một deterministic demo adapter có version và provenance rõ ràng;
- giữ acknowledge/assign/resolve/close, SLA enforcement, notification delivery, BIM navigation, rule add/edit và sidebar badge ở trạng thái disabled/unavailable;
- thực hiện mọi calculation chỉ trong memory; không tạo PostgreSQL alert/report schema, entity, migration, repository, job hoặc history;
- bảo toàn Dashboard shell mới và exactly seven routes.

Phase này là UI + evaluation-boundary baseline, không phải hệ thống incident management production-ready.

---

## 2. Authority và cách sử dụng mockup

Coding Agent xử lý xung đột theo thứ tự:

1. Yêu cầu trực tiếp của stakeholder trong task implementation.
2. `web/doc/Dashboard_Knowledge_Base.md` cho Page 06 scope, evaluator ownership, badge semantics, CASL và PostgreSQL intent.
3. `web/doc/IoTBackend_API_HandOver.md` cho exact telemetry semantics, gaps, range, ordering và unresolved fields.
4. `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phase 14 đã cập nhật ngày 2026-09-29.
5. File plan này.
6. Handoff Phase 02–05 và UI alignment cho implementation baseline.
7. Mockup cho visual hierarchy, geometry và interaction concepts.
8. Repository/runtime evidence tại thời điểm implement.

Mockup không phải data contract hoặc workflow authorization. Không sao chép các số `7`, `8`, `6’40”`, `91%`, badge `5`, người xử lý, room/device IDs, CO₂ values, SLA values, notification channels, timestamps, recommendations hoặc threshold/rule text trong ảnh thành production/demo fixture.

### 2.1 Tài liệu Coding Agent phải đọc trước khi implement

- `web/doc/Dashboard_Knowledge_Base.md`, đặc biệt sections 4, 5, 9, 10, 14, 15, 16, 17.1 và 19.
- `web/doc/IoTBackend_API_HandOver.md`, đặc biệt Solar/AVC semantics, time range, ordering and unresolved items.
- `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phases 14, 16 and 21.
- `web/doc/bp2_phase03_page07_live_telemetry_core_handoff.md`.
- `web/doc/bp2_phase04_page02_live_water_baseline_handoff.md`.
- `web/doc/bp2_phase05_page03_environmental_metrics_handoff.md`.
- `web/doc/bp2_fix_align_UI.md` and `web/doc/bp2_fix_align_UI_handoff.md`.
- Mockup Page 06 attached to the implementation task.
- `web/AGENTS.md` and current Next.js 16 repository guidance if touching route/server-client/data-fetching patterns.

---

## 3. Baseline verified on 2026-09-29

### 3.1 Repository state

- Branch audit: `feature/dashboard`.
- HEAD audit: `70985d560a317b8a0255ee137f5a29ef475db9d4`.
- Existing unrelated modification: `GISUIT.code-workspace`; preserve it and do not include it in this phase.
- `/dashboard/alerts` is still the old placeholder with page badge `06`, divider and one unavailable block.
- No alert controller/service/evaluator/config entity/event entity/history table exists.
- No authentication/session implementation or CASL package exists.
- No notification delivery integration exists for email/SMS/push.
- No approved BIM/room mapping exists for alert navigation.
- Dashboard Sidebar currently has no authoritative alert counter.

### 3.2 Available data and boundaries

- Page 07 exposes live selected-device Solar/AVC telemetry with range/coverage/provenance.
- Page 02 exposes live AVC Water data, but cumulative counter and flag semantics remain unresolved.
- Page 03 exposes raw Solar environment fields without units and deterministic CO₂/VOC demo data.
- No current approved live CO₂/VOC/PM2.5 source exists.
- No approved online/offline/freshness cadence exists.
- No numeric alert baselines are frozen.
- `alert_time_threshold` behavior/unit is not frozen.
- `STALE`/`NO_DATA` are still candidates rather than authoritative runtime enum decisions.

### 3.3 Consequences for this phase

- No live metric currently has the complete combination of confirmed semantics/unit + approved thresholds + cadence/duration rule needed for authoritative Warning/Danger evaluation.
- Runtime rule registry must therefore be empty.
- Empty authoritative evaluation must not silently fall back to demo.
- Page 06 operational content may be demo because the plan explicitly separates it from live/derived state.
- Global sidebar badge must stay absent; demo counts remain inside Page 06 only.
- Any future confirmed rule can plug into the evaluator boundary, but adding it is a contract change requiring tests and documented provenance.

---

## 4. Scope

### 4.1 In scope

- Pure in-memory alert-evaluator domain boundary in NestJS.
- Empty runtime authoritative rule registry with explicit reason metadata.
- Read-only evaluation-status endpoint; no upstream calls when registry is empty.
- Versioned deterministic Page 06 demo fixture.
- Page 06 header, five KPI cards, alert list/filter/sort, selected alert detail/timeline, 14-day chart, handling-efficiency panel and rules table.
- Demo-only client-side selection/filter/sort/range interaction.
- Disabled operational actions with accessible reasons.
- Per-widget/demo provenance and live-engine-unavailable disclosure.
- Existing visual system alignment, responsive layout and accessibility.
- Backend/frontend tests, OpenAPI, lint/build/regression and visual QA.

### 4.2 Out of scope

- No PostgreSQL alert configuration, current state, event history, report or audit tables.
- No TypeORM entity/migration/repository for alerts.
- No authoritative numeric threshold seed.
- No live Warning/Danger event creation from unresolved IoT fields.
- No persistent acknowledge/assign/resolve/close workflow.
- No real user/assignee identity.
- No CASL installation or authorization enforcement in this phase.
- No email, SMS, push, webhook or external notification delivery.
- No SLA timer/enforcement/escalation.
- No automatic remediation/control command.
- No BIM navigation or room/device spatial lookup.
- No global Dashboard sidebar alert badge.
- No background polling, cron, queue or worker.
- No raw telemetry persistence or report-data persistence.
- No direct browser/Unity access to upstream IoT.
- No second chart or icon library.

---

## 5. Data strategy and mode matrix

| Domain/widget | Source | DataMode | Phase 06 rule |
| --- | --- | --- | --- |
| Evaluator capability/status | NestJS runtime registry | `derived` + unavailable | Registry empty; explain blockers, no alerts |
| Page KPIs | `page06-alert-center-demo-v1` | `demo` | All values derived from same fixture |
| Alert list/filter/count | same fixture | `demo` | No live-looking event IDs/devices/users |
| Alert detail/timeline | same fixture | `demo` | Read-only preview; actions disabled |
| 14-day event chart | same fixture | `demo` | Derived from fixture timestamps |
| Handling effectiveness/SLA | same fixture | `demo` | Preview only; not operational performance |
| Rule table | same fixture + unavailable runtime registry | `demo`/unavailable | Demo examples; no active real rules |
| Sidebar badge | authoritative evaluated state only | unavailable | Render no badge in Phase 06 |
| Notification channels | no integration | unavailable/demo description | No sends, no channel-health claim |

The page may show one global `Dữ liệu minh họa` badge because all operational alert-center content is demo, but the separate live evaluator-status disclosure must remain visible and must not be represented as demo success.

---

## 6. Alert evaluator boundary

### 6.1 Purpose

Create a reusable backend domain boundary without prematurely freezing database schema or live rules.

Suggested conceptual types:

```text
AlertMetricSample:
  deviceId
  deviceType
  metricKey
  observedAt
  value
  unit | null
  semanticStatus: confirmed | unconfirmed
  sourceProvenance

AlertRuleDefinition:
  ruleId
  version
  deviceType
  metricKey
  warningLow | warningHigh | null
  dangerLow | dangerHigh | null
  alertTimeThresholdSeconds | null
  expectedCadenceSeconds | null
  enabled
  source: approved_baseline | approved_custom

AlertEvaluationResult:
  deviceId
  metricKey
  status: normal | warning | danger | not_evaluated
  reasonCode
  evaluatedAt
  sourceWindow
  evidenceSampleCount
  ruleId | null
  ruleVersion | null
```

These are domain contracts, not PostgreSQL columns.

### 6.2 Runtime rule registry

- Production/runtime registry is an explicit typed empty list in Phase 06.
- It must carry reason code such as `ALERT_RULES_NOT_CONFIRMED`, not silently look misconfigured.
- Demo rules live in frontend demo fixtures and must never enter this registry.
- Unit tests may pass local synthetic rule objects directly to the pure evaluator.
- Browser cannot submit arbitrary metric/rule definitions for evaluation.

### 6.3 Pure evaluator rules

The evaluator must reject/not-evaluate when:

- metric semantics or unit are unconfirmed;
- no matching enabled rule exists;
- sample unit differs from confirmed rule unit;
- sample value/timestamp is missing or non-finite;
- device identity/type does not match the rule scope;
- duration rule requires cadence/continuity information that is not supplied.

For synthetic tests with an explicit confirmed rule:

- boundary equality semantics must be stated and tested;
- danger takes precedence over warning when ranges overlap;
- valid zero must be preserved;
- newest-first input must be copied/sorted oldest-first before duration checks;
- gaps must not be filled or treated as continuous exceedance;
- duplicate timestamps need deterministic handling;
- result must include rule/version/evidence provenance.

### 6.4 Duration threshold

Phase 06 does not freeze operational `alert_time_threshold` semantics. The boundary may accept seconds as a conceptual input for testability, but runtime evaluation must return `not_evaluated` for duration rules unless expected cadence, gap tolerance and continuous-exceedance policy are explicitly present.

Do not infer continuous duration from the first and last violating timestamps across gaps.

### 6.5 No event lifecycle generation

The pure evaluator returns state/evidence only. It does not create event IDs, deduplicate events, open/close incidents, assign users, start SLA timers or send notifications. Those require persistence/identity and are deferred.

---

## 7. Backend read-only API

### 7.1 Evaluation status endpoint

```http
GET /api/v1/dashboard/buildings/:buildingId/alerts/evaluation-status
```

Rules:

- Building E only.
- GET/read-only.
- `Cache-Control: no-store`.
- With empty registry, make zero catalogue/telemetry/upstream calls.
- No database read/write.
- No raw internal error, token or upstream URL exposure.

Response concept:

```text
schemaVersion
buildingId
availability: no_active_rules | ready | partial
provenance:
  mode = derived
  sourceType = application_alert_evaluator
  evaluatedAt
  caveats[]
capabilities:
  evaluatorAvailable = true
  authoritativeRuleCount = 0
  eventPersistenceAvailable = false
  lifecycleActionsAvailable = false
  notificationDeliveryAvailable = false
  authorizationAvailable = false
  spatialNavigationAvailable = false
blockers[]:
  code
  message
currentState:
  distinctWarningDeviceCount = null
  distinctDangerDeviceCount = null
  notificationBadgeCount = null
```

Do not return zero for counts when the state is unknown/unavailable; `null` prevents “0 alerts” from becoming a false operational claim.

### 7.2 No mutation routes

Phase 06 must not expose POST/PUT/PATCH/DELETE for:

- rules/config;
- acknowledge/assign/resolve/close;
- notification send/test;
- event create/delete;
- SLA override;
- automation/remediation.

OpenAPI and route tests must prove their absence.

---

## 8. Deterministic demo contract

### 8.1 Fixture identity

```text
fixtureId: page06-alert-center-demo-v1
mode: demo
timezone: Asia/Ho_Chi_Minh for presentation only
```

The fixture must be static/versioned and must not use `Math.random()`, `Date.now()` during module initialization or render-time generation.

Use an explicit reference instant passed to selectors so screenshot/test output is reproducible.

### 8.2 Demo event model

```text
DemoAlertEvent:
  alertId
  subjectId
  demoDeviceId
  severity: info | warning | danger
  category: environment | water | iot | energy
  title
  locationLabel
  detectedAt
  lifecycleStatus: new | acknowledged | resolved | closed
  demoAssigneeRole | null
  slaDueAt | null
  timeline[]
  suggestedActionText
  ruleId
  notificationChannels[]
  provenance { mode=demo, fixtureId }
```

Use IDs prefixed with `DEMO-`; do not reuse actual device IDs or real people names.

### 8.3 Internal consistency

All Page 06 operational visuals must derive from the same fixture/selectors:

- open count and severity breakdown;
- filter-tab counts;
- newest-first alert list;
- selected detail timeline;
- new-events-per-day chart;
- average acknowledge/resolve times;
- demo SLA percentage;
- demo false-positive review percentage;
- rules table/channel summary.

Do not hard-code independent KPI numbers that can disagree with the list/chart.

### 8.4 Optional cross-page demo consistency

CO₂ demo alert scenarios should reuse or reference `page03-co2-demo-v1` values/selectors when practical. If a separate snapshot is necessary, document the version relationship and avoid presenting cross-page mismatches as one current state.

Live Page 03 raw Solar values must never be compared against demo CO₂ thresholds to generate an alert.

### 8.5 Demo SLA and lifecycle

- SLA durations and acknowledgement/close timestamps are fixture metadata only.
- UI may calculate elapsed/remaining time deterministically from the injected reference instant.
- Demo timers must not tick indefinitely or imply real-time monitoring.
- No demo action updates are persisted; Phase 06 buttons remain disabled rather than simulating successful workflow mutation.

---

## 9. UI Architecture & Mockup Alignment

### 9.1 Reference normalization

- Original image: `2406 × 1682 px`.
- Image begins at Dashboard Sidebar; High-Level Sidebar 64 px lies outside the image.
- Canonical QA reference:
  - Dashboard workspace crop: `1778 × 1222` CSS px;
  - full shell: `1842 × 1222` CSS px.
- Use image proportions/hierarchy, not its pixel values as absolute CSS positions.
- Do not commit the stakeholder mockup unless explicitly requested.

### 9.2 Shell hierarchy

```text
DashboardShell
├── HighLevelSidebar (64 px, outside mockup)
└── DashboardWorkspace
    ├── DashboardSidebar (288 px)
    │   └── exactly 7 routes; no alert badge in Phase 06
    └── DashboardViewport
        └── AlertCenterDashboard
```

- Active nav: `Cảnh báo`.
- Do not add out-of-scope mockup routes or phase tags.
- Do not render the mockup badge `5` in sidebar.
- Remove legacy page badge `06`, generic section wrapper and divider.

### 9.3 Reference geometry in workspace `1778 × 1222`

| Region | Target local geometry | Notes |
| --- | --- | --- |
| Dashboard Sidebar | `x=0`, `w=288`, full height | shared; no redesign |
| Main canvas | `x≈288`, `w≈1490` | no desktop top bar |
| Main inner content | `x≈318..1755` | 28–32 px gutters |
| Page header | `y≈24..81`, `h≈58` | title/subtitle left, actions right |
| KPI strip | `y≈88..193`, `h≈105–115` | 5 equal cards |
| Primary row | `y≈210..659`, `h≈445–455` | list + detail, about 1.9:1 |
| Secondary row | `y≈675`, `min-h≈340` | 3 cards, about 1:1.2:1 |

Horizontal target:

- usable content width about `1435 px`;
- KPI card about `276–280 px`, gap `14–16 px`;
- primary left about `930–950 px`, right `470–490 px`, gap `18–20 px`;
- secondary left/right about `430–455 px`, center `520–550 px`, gaps `18–20 px`.

Use responsive CSS grid/flex/minmax, not absolute positioning for the page.

### 9.4 Page header

Left:

- Title: **“Trung tâm cảnh báo”**.
- Subtitle: **“Bản xem trước quy trình · chưa có quy tắc cảnh báo authoritative”**.
- Teal dot 7–8 px.
- Do not state “cập nhật tức thời” because there is no polling/live event system.

Right:

| Mockup control | Phase 06 behavior |
| --- | --- |
| `Dữ liệu minh họa` | Render because operational content is demo; tooltip includes fixture version |
| `Hôm nay / 7 ngày / 30 ngày` | Supported as deterministic demo filters |
| `Tùy chọn` | Disabled with reason; no real date picker needed |
| Search | Focus/open demo alert search/filter input |
| Avatar `AT` | Neutral account icon/disabled state; no fake identity |

Header action group wraps cleanly at smaller widths.

### 9.5 KPI strip — 5 cards

All five cards are `demo` and derive from fixture selectors:

1. `Đang mở` — open demo alerts with severity breakdown.
2. `Quá hạn SLA` — demo overdue count; visibly fixture-only.
3. `Mới trong khoảng chọn` — range-derived demo count.
4. `Thời gian nhận trung bình` — fixture lifecycle calculation.
5. `Kênh thông báo` — configured demo-channel count, not delivery health.

No card may imply real notifications were sent or operational SLA was measured.

### 9.6 Primary row — alert list and detail

#### Left card: `Danh sách cảnh báo`

- Filter pills: `Tất cả`, `Nguy hiểm`, `Cảnh báo`, `Thông tin`; counts derive from current filtered fixture/range.
- Compact search and newest/oldest sort.
- Table/list columns:
  - severity;
  - content/title;
  - demo location;
  - detected time;
  - demo assignee role;
  - lifecycle status;
  - demo SLA state.
- Selected row uses subtle teal background/indicator.
- Keyboard-selectable rows; not click-only.
- Long text ellipsis plus accessible full label/tooltip.
- Demo provenance visible in card header/footer.

Do not copy alert rows, people, locations or values from mockup.

#### Right card: `Chi tiết cảnh báo`

- Shows selected demo event title and severity badge.
- Read-only timeline with fixture steps, timestamps and descriptions.
- Suggested action text labeled `Minh họa`, not an automated instruction.
- `Nhận xử lý` button disabled: reason `Chưa có identity và event persistence`.
- `Xem trên BIM` disabled: reason `Chưa có approved room/device spatial mapping`.
- No local optimistic mutation that pretends acknowledgement succeeded.
- Empty selection shows neutral instruction, not first-row auto-action.

### 9.7 Secondary row

#### Left card: `Số cảnh báo 14 ngày`

- Demo bar chart from fixture timestamps.
- Use shared `MetricBarChart`/domain wrapper.
- Accessible table/summary.
- No live/report badge.

#### Center card: `Hiệu quả xử lý`

- Four compact demo summary tiles:
  - average acknowledge time;
  - average resolution time;
  - demo within-SLA ratio;
  - demo review/false-positive ratio.
- Labels must include demo provenance or card-level Demo badge.
- No target claims copied from mockup.

#### Right card: `Quy tắc cảnh báo`

- Demo rule rows provide visual preview only.
- Runtime authoritative-rule count displayed separately as `0 · Chưa xác nhận`.
- Channel/status columns describe demo fixture only.
- `Thêm quy tắc` disabled with reason `Chờ Identity/CASL + PostgreSQL phase`.
- Row edit/toggle disabled.
- Never import demo rules into backend runtime registry.

### 9.8 Live evaluator status disclosure

Add a compact inline notice near the header or rules card:

```text
Engine sẵn sàng · 0 quy tắc authoritative
Chưa đánh giá live do semantics, baseline, cadence và duration policy chưa được xác nhận.
```

The notice comes from the read-only backend status API, not a hard-coded success statement.

### 9.9 Data-mode placement

- Header/main operational content: `demo`.
- Evaluator capability notice: `derived` + unavailable/no-active-rules.
- Actions/rules/notifications: unavailable.
- No single badge may turn the evaluator-unavailable state into “live”.
- Danger/warning colors in demo must be paired with text/icon and Demo provenance.

### 9.10 Design tokens and typography

Reuse the aligned Dashboard tokens:

- near-black/slate backgrounds;
- teal primary `#4FB9AD` family;
- warning amber and danger orange only for demo severity/error semantics;
- radius `12–14 px`;
- subtle 1 px borders;
- page title `28–30 px`;
- KPI values `34–38 px`;
- card headings `15–17 px`;
- body/table `12–14 px`;
- helper/provenance `11–12 px`;
- tabular/monospace timestamps and numeric values.

Do not create a Page 06-specific legacy blue palette.

### 9.11 Responsive behavior

| Full viewport | Sidebar | KPI | Primary row | Secondary row |
| --- | --- | --- | --- | --- |
| `≥1842 px` | 64 + 288 px | 5 columns | list + detail ~1.9:1 | 3 columns ~1:1.2:1 |
| `1440–1841 px` | dual desktop | 3 + 2 | two columns if detail ≥380 px, else stack | 2 + 1 |
| `1200–1439 px` | compact dual sidebar | 3 + 2 | stack | 2 + 1/stack |
| `768–1199 px` | rail + Dashboard drawer | 2 columns | stack | stack/2 columns |
| `<768 px` | rail + drawer | 1 column | list then detail | stack |

- Table scrolls inside its card; body must not horizontally scroll.
- Detail timeline remains readable on mobile.
- Touch targets at least about 44 px.
- Disabled actions remain focusable only when needed to expose the reason; use accessible description/tooltip.

---

## 10. Frontend state model

```text
engineStatus:
  idle | loading | no-active-rules | ready | partial | error

demoRange:
  today | 7d | 30d

severityFilter:
  all | danger | warning | info

sortOrder:
  newest | oldest

searchQuery:
  string

selectedDemoAlertId:
  string | null
```

Rules:

- Demo state never becomes an input to backend evaluator.
- Engine status failure does not silently change demo data mode.
- Demo range/filter/search/sort are pure local selectors.
- Selected alert is cleared if filtering removes it, or detail shows an explicit filtered-out state.
- No mutation state such as `acknowledging` because actions are disabled.
- Reference time is injected/frozen for fixture calculations and tests.

---

## 11. File/component impact expected

Coding Agent must re-audit before creating/editing files.

### 11.1 Backend suggested structure

```text
backend/src/dashboard/alerts/
├── alert-evaluator.ts
├── alert-rule-registry.ts
├── dashboard-alert-status.service.ts
├── dashboard-alert.controller.ts
├── dto/
│   └── dashboard-alert-evaluation-status-response.dto.ts
└── tests/
    ├── alert-evaluator.spec.ts
    └── dashboard-alert-status.spec.ts
```

Likely update:

- `backend/src/dashboard/dashboard.module.ts`;
- `backend/openapi.json`.

Do not import TypeORM, repositories, database entities or scheduling packages into alert code.

### 11.2 Frontend suggested structure

```text
web/src/
├── app/dashboard/alerts/page.tsx
├── components/dashboard/alerts/
│   ├── AlertCenterDashboard.client.tsx
│   ├── AlertCenterPageHeader.tsx
│   ├── AlertCenterKpiStrip.tsx
│   ├── DemoAlertList.tsx
│   ├── DemoAlertDetail.tsx
│   ├── DemoAlertHistoryChart.tsx
│   ├── DemoAlertEfficiency.tsx
│   ├── DemoAlertRulesTable.tsx
│   └── AlertEngineStatusNotice.tsx
├── lib/dashboard/
│   ├── alert-status-api.ts
│   ├── alert-demo-fixtures.ts
│   └── alert-demo-selectors.ts
└── types/
    └── dashboard-alerts.ts
```

Add `web/test-bp2-phase06.mjs` and include it in `web/package.json` test pipeline.

### 11.3 Shared reuse

- Dashboard shell/sidebar/tokens.
- Page 02/03/07 page-header patterns.
- `KpiMetadataCard`, `DataModeBadge`, `StatusBadge`.
- `TimeFilterSegmented` with phase-specific presets.
- `MetricBarChart`.
- Loading/Empty/Unavailable/Error states.

Extend shared primitives only backward-compatibly and run earlier phase regressions.

---

## 12. Implementation sequence for Coding Agent

### Checkpoint 1 — Re-audit and freeze non-goals

1. Read authority docs and current handoffs.
2. Record branch/HEAD/dirty tree.
3. Confirm no identity/CASL/alert persistence/notification/spatial mapping appeared since this plan.
4. Re-check whether any metric baseline/semantics/cadence was formally confirmed.
5. If none, keep runtime registry empty; do not invent a live rule to fill the page.

### Checkpoint 2 — Pure evaluator and registry

1. Define typed domain contracts.
2. Implement pure evaluation boundaries and reason codes.
3. Add synthetic unit tests for boundaries/gaps/zero/order/duration rejection.
4. Implement explicit empty runtime registry.
5. Prove demo rules cannot enter backend registry.

### Checkpoint 3 — Read-only status API

1. Implement evaluation-status endpoint.
2. Return null unavailable counts, explicit blockers and capability flags.
3. Assert zero upstream/database calls with empty registry.
4. Update OpenAPI.
5. Assert no mutation routes exist.

### Checkpoint 4 — Deterministic demo domain

1. Create versioned fixture and frozen reference instant.
2. Implement pure selectors for KPIs, filters, sorting, chart, efficiency and rules.
3. Optionally align demo CO₂ scenarios with Page 03 fixture version.
4. Add consistency/no-random/no-mockup-copy tests.

### Checkpoint 5 — Page 06 UI alignment

1. Replace placeholder/page badge/divider.
2. Build aligned header and five KPI cards.
3. Build primary list/detail grid.
4. Build three-card secondary row.
5. Add engine-status notice and disabled-action reasons.
6. Keep sidebar badge absent.

### Checkpoint 6 — Responsive and accessibility

1. Keyboard filters/search/sort/row selection.
2. Accessible list/table and chart alternative.
3. Timeline semantics and severity text not color-only.
4. Disabled-action explanation.
5. Responsive matrix/no body overflow.

### Checkpoint 7 — Verification and handoff

1. Run backend tests/build/e2e as relevant.
2. Run frontend tests/lint/build and prior regressions.
3. Browser QA at required viewports.
4. Audit no DB/upstream/mutation/notification calls.
5. Create mandatory handoff in section 17.

---

## 13. Test matrix

### 13.1 Evaluator tests

- Empty registry returns `not_evaluated`/no-active-rules.
- Unconfirmed semantics or unit rejects evaluation.
- Missing/non-finite input rejects evaluation; zero remains valid.
- Unknown device/metric/rule mismatch rejects evaluation.
- Synthetic confirmed warning/danger boundaries are deterministic.
- Danger precedence is deterministic if ranges overlap.
- Newest-first input is not mutated and is evaluated chronologically.
- Gaps are not filled or counted as continuous duration.
- Duplicate timestamp behavior is deterministic.
- Duration rule without cadence/gap policy is not evaluated.
- Result includes rule/version/source evidence.

### 13.2 Backend API tests

- Building E only and GET-only.
- Empty registry yields `availability=no_active_rules`.
- Counts are null, not false zero.
- Capability flags/blockers correct.
- Zero IoT catalogue/telemetry calls.
- Zero database calls/dependencies.
- No POST/PUT/PATCH/DELETE alert route exists.
- Errors/logs do not leak tokens, URLs, stacks or payloads.

### 13.3 Demo fixture/selectors tests

- Stable fixture ID/version and reference time.
- No `Math.random()` or render-time `Date.now()`.
- KPI counts match filtered event set.
- Tab counts match list counts.
- 14-day chart totals match event timestamps.
- Efficiency metrics derive from lifecycle timestamps.
- Rules/channel summary derives from fixture metadata.
- Sorting/filter/search do not mutate fixture.
- Demo device/event/user IDs cannot collide with real IDs.
- No copied mockup values, names or thresholds as expected facts.

### 13.4 Frontend tests

- Page uses same-origin status API with `cache:no-store` and AbortSignal where applicable.
- All operational content visibly demo.
- Engine notice visibly no-active-rules/unavailable.
- No sidebar badge count.
- No real-looking acknowledge/assign/close mutation.
- BIM and action buttons disabled with reasons.
- Range/filter/search/sort/selection work locally and consistently.
- Custom range disabled; no silent remap.
- Rules add/edit/toggle disabled.
- Demo count never populates Dashboard navigation badge.
- Exactly seven routes/dual sidebar preserved.
- Page 02/03/07 regression tests pass.

### 13.5 Security/architecture tests

- No TypeORM/entity/migration/repository/scheduler import in alert feature.
- No raw telemetry persistence.
- No direct upstream browser URL/token.
- No notification API/provider call.
- No client-supplied rule evaluation.
- No fake auth/assignee/session identity.

---

## 14. Browser and interaction checks

- Active nav item is `Cảnh báo`, without badge.
- Header search focuses demo list search.
- Today/7d/30d filters update all demo KPIs/list/chart consistently.
- Severity filters and counts stay coherent.
- Keyboard row selection updates detail.
- Empty filtered result shows clean empty state.
- Timeline is screen-reader navigable.
- Disabled actions expose reasons.
- Engine-status API error remains distinct from demo content.
- No automatic network polling after initial status read.

---

## 15. Visual QA viewports

- `1842 × 1222` full shell.
- `1778 × 1222` Dashboard workspace crop.
- `1440 × 900` desktop.
- `1280 × 800` compact desktop.
- `1024 × 768` tablet landscape.
- `390 × 844` mobile.

Visual checks:

- dual sidebar and active alert nav match aligned system;
- no legacy badge/divider/top bar;
- five KPI cards align at reference desktop;
- primary row approximately 1.9:1;
- secondary row approximately 1:1.2:1;
- list density, detail timeline and rules table match mockup hierarchy;
- Demo badge/provenance is visible without overwhelming the layout;
- disabled buttons look intentionally unavailable, not broken;
- severity states are not color-only;
- no body horizontal overflow;
- no copied sidebar badge, identities, values or alert records.

---

## 16. Acceptance criteria

Phase 06 is complete only when:

1. Page 06 no longer renders the legacy placeholder layout.
2. Pure alert evaluator boundary and explicit empty runtime registry exist in NestJS.
3. Read-only evaluation-status API explains blockers and performs no IoT/database call with no rules.
4. No unconfirmed metric/threshold creates an authoritative alert.
5. Page operational content derives consistently from `page06-alert-center-demo-v1` and is visibly demo.
6. KPI/list/detail/chart/efficiency/rules remain internally consistent.
7. Acknowledge/assign/resolve/close, notification, BIM and rule mutation actions are disabled with reasons.
8. Sidebar notification badge remains absent; demo counts never leave Page 06.
9. No PostgreSQL alert/report schema, migration, entity, repository, history or job is introduced.
10. No authentication/CASL, notification provider or background polling is invented.
11. Page matches mockup macro-layout and current Dashboard visual system.
12. Responsive/accessibility and exact seven routes do not regress.
13. Backend/frontend tests, lint/build and visual QA have evidence.
14. Mandatory implementation handoff exists.

---

## 17. Mandatory handoff after implementation

After implementation and verification, Coding Agent **must create**:

`web/doc/bp2_phase06_page06_alert_center_baseline_handoff.md`

The handoff must include at minimum:

- branch, HEAD and working-tree notes;
- file inventory;
- evaluator domain contracts, reason codes and runtime registry state;
- evaluation-status endpoint/DTO/OpenAPI evidence;
- proof of zero upstream/database calls when registry is empty;
- proof no alert mutation routes exist;
- fixture ID/version/reference time and selector consistency evidence;
- per-widget mode/capability matrix;
- UI component architecture and mockup-difference table;
- sidebar badge decision and evidence;
- disabled action/identity/notification/BIM handling;
- automated test/lint/build/e2e results;
- browser interaction/accessibility results;
- screenshots at section 15 viewports;
- no-secret/no-direct-upstream/no-persistence audit;
- open issues and next-phase notes.

> **Final handoff instruction to Coding Agent:** Implement only the scope of `bp2_phase06_page06_alert_center_baseline.md`; keep the authoritative rule registry empty until semantics, baselines, cadence and duration policy are confirmed, use the versioned deterministic demo only for Page 06 presentation, add no PostgreSQL alert/report persistence or mutation workflow, and after implementation and verification you must create `web/doc/bp2_phase06_page06_alert_center_baseline_handoff.md` before reporting the phase complete.
