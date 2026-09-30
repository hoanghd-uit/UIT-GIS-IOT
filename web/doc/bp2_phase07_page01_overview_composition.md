# Big Phase 02 — Phase 07: Page 01 Overview Composition & Interactive 2D Grid

> **Project:** GIS — UIT Building E Digital Twin  
> **Loại tài liệu:** Kế hoạch bàn giao cho Coding Agent  
> **Trạng thái:** PLAN ONLY — KHÔNG IMPLEMENT TRONG TÀI LIỆU NÀY  
> **Ngày lập kế hoạch:** 2026-09-30  
> **Roadmap mapping:** `Small Phase 15 — Page 01 Overview composition`  
> **Trang mục tiêu:** Page 01 — Tổng quan  
> **Route:** `/dashboard/overview`  
> **Mockup:** `codex-clipboard-e33c600e-520b-4925-8c5e-9b7860100940.png`, ảnh gốc `1494 × 1116 px`, chỉ dùng làm visual reference  
> **Override bắt buộc:** riêng vùng mô hình trung tâm, dùng `InteractiveFloorGrid` 2D theo `Dashboard_Knowledge_Base.md`; **không implement BIM/3D theo mockup**

---

## 1. Mục tiêu

Thay Page 01 placeholder bằng trang Tổng quan bám visual hierarchy của mockup và visual system Dashboard hiện hành, đồng thời tổng hợp trung thực các capability đã có từ Water, Environment, Alert và IoT.

Phase này phải:

- dựng header và sáu KPI slot theo nhịp bố cục của mockup;
- triển khai `FloorCatalog`, logical `InteractiveFloorGrid` 2D và `FloorMetadataPanel` theo Knowledge Base;
- cho phép chuyển tầng, chọn cell ổn định và xem CO₂ detail bằng deterministic demo data khi chưa có room-level live mapping;
- hiển thị `Cảnh báo mới nhất`, `Điện năng theo giờ` và `Sức khỏe hệ thống IoT` ở hàng dưới;
- tái sử dụng read-only capability/data adapter đã hoàn thành mà không sửa text/content của các trang cũ;
- phân biệt rõ `live`, `derived`, `demo` và `unavailable` ở từng widget;
- tiếp tục dùng bounded raw fetch hoặc request-scoped/in-memory calculation khi có dữ liệu phù hợp;
- không tạo PostgreSQL report/alert persistence trong phase này;
- giữ đúng seven Dashboard routes, dual-sidebar shell và visual tokens hiện hành.

Phase này là Page 01 composition baseline. Nó không phải BIM viewer, CMMS/work-order module, authoritative alert dashboard hay report persistence phase.

---

## 2. Authority và cách sử dụng mockup

Coding Agent xử lý xung đột theo thứ tự:

1. Yêu cầu trực tiếp của stakeholder trong task implementation.
2. `web/doc/Dashboard_Knowledge_Base.md`, đặc biệt contract `Interactive 2D Grid` và Page 01.
3. `web/doc/IoTBackend_API_HandOver.md` cho exact IoT semantics/API.
4. `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phase 15.
5. File plan này.
6. Handoff Phase 01–06 và UI alignment cho capability đã hoàn thành.
7. Mockup Page 01 cho visual hierarchy, card proportions và interaction concepts, **ngoại trừ vùng 3D/BIM**.
8. Repository/runtime evidence tại thời điểm implement.

Mockup không phải data contract hoặc workflow authorization. Không sao chép các số điện/nước/IAQ/CO₂/alert/online, room IDs, thời gian, thresholds, notification badge, user initials, AHU links, work-order actions hoặc trạng thái trong ảnh thành production facts hay fixtures.

### 2.1 Override bắt buộc cho vùng trung tâm

Mockup hiển thị mô hình BIM 3D nhiều tầng. Coding Agent **không được implement hoặc mô phỏng vùng này dưới dạng 3D/isometric BIM**.

Thay thế bằng kiến trúc đã freeze trong Knowledge Base:

```text
Overview spatial area
├── FloorCatalog
├── InteractiveFloorGrid (logical 2D matrix)
└── FloorMetadataPanel / selected-cell CO₂ detail
```

Các điều cấm:

- không nhúng Unity/WebGL vào Page 01;
- không tạo canvas/WebGL/Three.js/CSS-isometric building để bắt chước ảnh;
- không gọi grid là floor plan chính xác;
- không suy room từ `install_x/install_y/install_z`;
- không tạo floor/room/device mapping giả dưới nhãn live;
- không thêm rotate/tilt/3D/fullscreen controls chỉ vì mockup có chúng.

### 2.2 Tài liệu Coding Agent phải đọc trước khi implement

- `web/doc/Dashboard_Knowledge_Base.md`, sections 3–7, 15–17, 19–21 and decision log.
- `web/doc/IoTBackend_API_HandOver.md` nếu dùng live catalogue/water/environment API.
- `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phases 15, 20 and 21.
- `web/doc/bp2_phase03_page07_live_telemetry_core_handoff.md`.
- `web/doc/bp2_phase04_page02_live_water_baseline_handoff.md`.
- `web/doc/bp2_phase05_page03_environmental_metrics_handoff.md`.
- `web/doc/bp2_phase06_page06_alert_center_baseline_handoff.md`.
- `web/doc/bp2_fix_align_UI.md` and `web/doc/bp2_fix_align_UI_handoff.md`.
- Mockup Page 01 attached to the implementation task.
- `web/AGENTS.md` and relevant bundled Next.js 16 docs before changing Next.js code.

---

## 3. Completed-page protection — bắt buộc

Stakeholder đã tự chỉnh text/label sau các phase trước. Coding Agent phải coi các trang đã hoàn thành và text hiện tại trong repository là **user-owned protected content**.

### 3.1 Protected routes và feature folders

Không thực hiện opportunistic cleanup, rewording, translation, label normalization, color retuning hoặc mockup alignment lại trên:

- `/dashboard/alerts` and `web/src/components/dashboard/alerts/**`;
- `/dashboard/environment` and `web/src/components/dashboard/environment/**`;
- `/dashboard/energy-water` and `web/src/components/dashboard/water/**`;
- `/dashboard/iot` and `web/src/components/dashboard/iot/**`;
- fixtures/types/tests riêng của Page 02, 03, 06 and 07;
- các handoff/plan đã hoàn tất.

Đặc biệt, không revert hoặc “sửa lại cho giống plan cũ” các text được commit trong `95dc1a6` (`FIX TEXT`). Repository hiện tại thắng snapshot text trong handoff cũ.

### 3.2 Khi nào mới được chạm file protected

Chỉ được sửa file protected nếu đồng thời thỏa tất cả:

1. Có bug tái hiện được hoặc shared dependency bắt buộc trực tiếp ngăn Page 01 hoạt động.
2. Không có giải pháp page-local/import-only/backward-compatible khác.
3. Patch nhỏ nhất có thể và không đổi user-facing text ngoài phần bug.
4. Có regression test cho trang bị ảnh hưởng.
5. Handoff Phase 07 ghi exact file, bug evidence, reason và before/after behavior.

Không dùng lý do “consistency”, “cleanup”, “refactor”, “translation”, “test cũ mong đợi” hoặc “mockup khác” để sửa text trang cũ.

### 3.3 Reuse rule

- Ưu tiên import read-only fixture/selector/API client hiện hữu.
- Không di chuyển, rename hoặc rewrite Page 03/Page 06 fixtures chỉ để Page 01 dùng thuận tiện hơn.
- Page 01 wrapper/selector được phép chuyển shape dữ liệu cho presentation nhưng không mutate nguồn.
- Shared component chỉ được mở rộng additively; default behavior phải giữ nguyên cho các consumer cũ.
- Nếu Page 01 cần text khác, đặt text trong component Page 01, không sửa source component của trang cũ.

---

## 4. Baseline verified on 2026-09-30

### 4.1 Repository state

- Branch audit: `feature/dashboard`.
- HEAD audit: `95dc1a64308d54942073766692d599695d604653` (`FIX TEXT`).
- Existing unrelated working-tree modification: `GISUIT.code-workspace`; preserve it.
- Page 01 route vẫn là foundation placeholder với bốn unavailable KPI và generic unavailable section.
- HEAD hiện tại có stakeholder-authored text updates trên Overview, Environment, IoT và Water; không revert.
- Dashboard shell đã dùng High-Level Sidebar 64 px + Dashboard Sidebar 288 px và exactly seven routes.
- Shared page shell, KPI card, data-mode badges, state components và chart wrappers đã tồn tại.

### 4.2 Capability có thể tái sử dụng

- IoT catalogue: live/read-only, có `acceptedCount`, device types, raw catalogue `active` field và floor assignment caveats.
- IoT telemetry: chỉ fetch khi user chọn device; không có fleet heartbeat/online state.
- Water: live AVC meter catalogue/readings; cumulative counter reset/rollover và một số flag semantics chưa xác nhận.
- Environment: raw Solar fields + request-scoped summary; temperature/humidity semantics vẫn caveated.
- Page 03 CO₂/VOC: deterministic fixture `page03-co2-demo-v1`.
- Alert backend: evaluator/status boundary, authoritative registry rỗng, current alert counts `null`.
- Page 06 alert presentation: deterministic fixture `page06-alert-center-demo-v1`.
- Không có Energy upstream; Energy phải là deterministic demo.
- Không có approved room mapping giữa IoT device coordinates và logical room cells.

### 4.3 Hệ quả cho Page 01

- Không có authoritative IAQ score `x/100`.
- Không có authoritative room-over-threshold count.
- Không có authoritative open-alert count/list.
- Không có authoritative fleet-online count, packet rate, gateway uptime, battery health hoặc average latency.
- Không thể gọi cumulative AVC counter là “Nước hôm nay” khi reset/rollover semantics chưa được xác nhận.
- CO₂ room grid/detail phải là demo và tách khỏi raw Solar source.
- Energy cards/chart phải là demo.
- IoT catalogue count có thể là live nhưng không được đổi thành online count.

---

## 5. Scope

### 5.1 In scope

- Replace Page 01 placeholder bằng aligned Overview dashboard.
- Header, six-slot KPI strip, primary grid/detail row và three-card bottom row.
- Logical `FloorCatalog`, `InteractiveFloorGrid`, `FloorMetadataPanel`.
- Stable versioned floor/cell layout fixture cho Page 01.
- Selected-cell CO₂ demo detail dựa trên Page 03 demo source hoặc adapter tương thích.
- Latest alerts demo preview dựa trên Page 06 fixture, read-only.
- Deterministic hourly Energy demo fixture/chart.
- Live IoT catalogue summary qua existing same-origin application API.
- Honest unavailable Water-today and unsupported IoT-health metrics.
- Per-widget provenance and range semantics.
- Loading/empty/partial/unavailable/error states.
- Responsive, keyboard and accessible grid behavior.
- Dedicated Page 01 tests, full prior-phase regressions and visual QA.

### 5.2 Out of scope

- No BIM/3D/isometric/WebGL/Unity implementation in Page 01.
- No PostgreSQL report, aggregate, snapshot, floor-grid, room mapping, alert or telemetry persistence.
- No TypeORM entity/migration/repository/job/scheduler.
- No new IoT upstream contract, mutation or direct browser call.
- No authoritative alert rule/event generation.
- No global alert badge.
- No inferred online/offline, lost-signal duration, packet rate or gateway health.
- No daily water consumption derived from unresolved counters.
- No live room CO₂ or mapping from Solar coordinates.
- No occupancy/person-presence claim.
- No AHU/device relationship claim.
- No work-order/CMMS action.
- No 30-day room history if source/fixture does not explicitly support it.
- No identity/avatar/profile implementation.
- No Page 02/03/06/07 text/content redesign.
- No second chart/icon library.

---

## 6. Data strategy and widget mode matrix

| Widget | Phase 07 source | Mode/state | Required presentation |
| --- | --- | --- | --- |
| Energy today KPI | `page01-overview-demo-v1` | `demo` | Deterministic; no smart-meter claim |
| Water today KPI | No safe aggregate yet | unavailable | `—`; explain counter reset/rollover blocker |
| CO₂ average KPI | Page 03 demo fixture adapter | `demo` | Label CO₂, not authoritative IAQ score |
| Rooms over demo threshold | Same Page 03 demo fixture | `demo` | Demo threshold/count only |
| Open alerts KPI | Page 06 demo fixture selector | `demo` | Never populate sidebar badge |
| Device catalogue KPI | Existing IoT catalogue API | `live` | `acceptedCount`; label catalogue, not online |
| Floor catalog/layout | `page01-floor-grid-demo-v1` | `demo` | Logical layout, not exact floor plan |
| Grid CO₂ states | Page 03 demo fixture + Page 01 grid adapter | `demo` | Stable cell mapping and demo legend |
| Floor metadata | Page 01 grid config | `demo` | Identity/count only; no invented business fields |
| Selected-cell CO₂ | Page 03 demo values | `demo` | Snapshot/trend with fixture provenance |
| Latest alerts | Existing Page 06 demo fixture | `demo` | Read-only preview, link to Page 06 |
| Hourly Energy | `page01-overview-demo-v1` | `demo` | Deterministic chart/table alternative |
| IoT catalogue health facts | Existing catalogue API | `live` | Counts and source-quality facts only |
| Online/packet/gateway/battery health | No approved source | unavailable | Explicit `—` and reason |
| Alert engine status | Existing evaluation-status API | `derived` + unavailable | Zero authoritative rules/counts remain null |

No page-global `live` or `demo` badge may flatten this mixed-source matrix. Provenance must be visible at widget/card level.

---

## 7. Data composition architecture

### 7.1 Default architecture: frontend composition over existing application APIs

Phase 07 does not need a new NestJS Overview endpoint. Default composition:

```text
OverviewDashboard.client
├── existing same-origin IoT catalogue client -> live catalogue summary
├── existing alert evaluation-status client -> authoritative capability status
├── page03 CO₂ demo fixture/selector -> grid + CO₂ KPIs/detail
├── page06 alert demo fixture/selector -> latest-alert preview
└── page01 deterministic fixture/selectors -> Energy + logical floor layout
```

Rules:

- Do not call upstream IoT directly from Next.js/browser.
- Do not duplicate Page 02/03/06/07 API logic.
- Do not add N+1 telemetry scans for Overview.
- Do not fetch all device telemetry to invent IoT health.
- Do not fetch AVC history merely to fill the Water-today slot when the aggregate is semantically unsafe.
- No automatic polling. One initial catalogue/status read plus explicit retry is sufficient.
- Use `cache: 'no-store'` and `AbortSignal` consistently with existing clients where applicable.

### 7.2 When a backend change is allowed

A backend change is not part of the expected implementation. If repository drift makes it unavoidable, Coding Agent may add only a read-only composition adapter when:

- it reuses existing services;
- it performs bounded request-scoped/in-memory calculation;
- it introduces no new source semantics;
- it makes no database write/read dependency;
- it has an explicit DTO/OpenAPI/test contract;
- the reason is documented in the handoff.

Do not create a speculative endpoint merely to proxy static demo fixtures.

### 7.3 Partial failure behavior

Each source resolves independently:

- catalogue failure must not hide demo grid/energy/alerts;
- alert-status failure must not turn demo alerts into authoritative alerts;
- fixture adapter failure is a coding/test error and must render error state, not random fallback;
- unavailable Water remains unavailable and does not block the page;
- page loading must not wait forever for one source.

### 7.4 Range behavior

Header presets may be `Hôm nay`, `7 ngày`, `30 ngày`; `Tùy chọn` remains disabled unless a real picker is implemented and all affected demo selectors support it.

- Energy and latest-alert demo selectors respond to the selected supported range.
- CO₂ grid is a current demo snapshot; it does not pretend to become 7/30-day data.
- Live IoT catalogue count is current and range-independent.
- Water unavailable reason is range-independent.
- Each widget shows its own observation/window semantics.

---

## 8. Deterministic demo contracts

### 8.1 Overview fixture

```text
fixtureId: page01-overview-demo-v1
mode: demo
referenceInstant: frozen ISO-8601 value
timezone: Asia/Ho_Chi_Minh for presentation only
```

It contains only Page 01-owned Energy series/baseline and selector metadata. It must not copy numeric values from the mockup.

Requirements:

- static/versioned;
- no `Math.random()`;
- no render-time `Date.now()`;
- one injected/frozen reference instant;
- KPI and chart derive from the same Energy series;
- supported time presets yield deterministic results;
- fixtures never enter backend alert evaluator or live aggregates.

### 8.2 Logical floor-grid fixture

```text
fixtureId: page01-floor-grid-demo-v1
buildingId: E
floors[]:
  floorId
  label
  rows
  columns
  cells[]:
    cellId
    row
    column
    label
    roomDemoId | null
    kind: room | corridor | service | empty
```

Rules:

- `cellId` is stable and unique across fixture versions.
- Layout includes only floors/cells that are explicitly configured.
- Prefer Floor 4 and Floor 6 where current CO₂ demo rooms already exist; do not fabricate all building floors for visual density.
- `roomDemoId` may reference an existing Page 03 demo room ID through an adapter.
- Empty/service/corridor cells do not receive invented CO₂ values.
- DOM/render order must not define identity.
- The fixture is a logical matrix, not geometry or BIM coordinates.

### 8.3 Cross-page demo reuse without editing completed pages

- Import Page 03/Page 06 fixture exports as read-only.
- Add Page 01-local selectors/adapters if a different view shape is needed.
- Do not edit Page 03/Page 06 user-facing labels, rows, thresholds or IDs for Page 01.
- If an existing export is insufficient, prefer a Page 01-local snapshot with explicit source-version relation; do not silently fork it as if current state were shared.
- Page 01 must display fixture IDs/provenance through tooltip/detail without forcing changes on the source pages.

---

## 9. Interactive 2D Grid contract

### 9.1 Component ownership

The component should be reusable for Page 11 later without importing CO₂-specific behavior into the core grid.

```text
FloorCatalog
  emits floorId

InteractiveFloorGrid<TCellState>
  receives configured layout + cell state adapter
  emits selected cellId

FloorMetadataPanel
  receives selected floor/cell context
  renders Page 01 CO₂ detail
```

Core grid owns layout, focus, selection and accessibility. Page 01 adapter owns CO₂ value/status/legend.

### 9.2 Interaction

- FloorCatalog changes the configured grid dataset.
- Selected floor is visually and semantically clear.
- Clicking or pressing Enter/Space on a room cell selects it.
- Arrow keys move logically between focusable neighboring cells where practical.
- Selection uses `cellId`, never array index.
- Changing floor clears invalid selection and chooses no cell or one deterministic default; behavior must be tested.
- Selected cell updates the right metadata/detail panel.
- On narrow screens, metadata renders below the grid or in an accessible dialog/drawer without hiding provenance.

### 9.3 CO₂ state presentation

- Derive good/moderate/warning color from existing demo selector/threshold contract only.
- Every state has text/icon/accessible label; color alone is insufficient.
- Legend explicitly says demo and uses the same boundaries as the selector.
- Missing mapping/value renders `Không có dữ liệu`, not good/zero.
- Do not show temperature, humidity or occupancy for a room unless that room mapping and source exist.

### 9.4 Accessibility

- Use a labelled grid/listbox pattern appropriate to actual interaction.
- Floor controls and cells are keyboard reachable.
- Screen-reader label includes cell label, data mode and CO₂ state/value when available.
- Focus remains visible against dark background.
- Tooltip is supplemental; required information is available without hover.
- Provide a compact accessible table/list alternative for grid values.

---

## 10. UI Architecture & Mockup Alignment

### 10.1 Reference interpretation

- Source mockup: `1494 × 1116 px`.
- Mockup begins at Dashboard Sidebar; High-Level Sidebar 64 px is outside the image.
- Full-shell reference corresponding to the original image is approximately `1558 × 1116 px`.
- Also verify at the established wide reference `1842 × 1222 px`.
- Use proportions/hierarchy, not absolute positioning.
- Do not commit the stakeholder mockup unless explicitly requested.

### 10.2 Shell hierarchy

```text
DashboardShell
├── HighLevelSidebar (64 px; outside mockup)
└── DashboardWorkspace
    ├── DashboardSidebar (shared 288 px; active Tổng quan)
    └── DashboardViewport
        └── OverviewDashboard
```

- Preserve exactly seven routes.
- Do not add `Không gian`, `Thiết bị & Bảo trì`, `Thang máy`, `An ninh ra vào`, Document Control or OneCAD links from the mockup.
- Do not add the mockup alert badge `5`.
- Do not show legacy `Trang 01` badge/divider.

### 10.3 Reference geometry

At source workspace `1494 × 1116`:

| Region | Approximate source geometry | Phase 07 interpretation |
| --- | --- | --- |
| Dashboard Sidebar | `x=0`, `w≈241`, full height | Keep shared 288 px token; do not shrink globally |
| Main canvas | `x≈241`, `w≈1253` | Fluid remaining width |
| Inner content | `x≈266..1472` | ~24 px gutters |
| Header | `y≈22..75`, `h≈54` | Title/subtitle left, controls right |
| KPI strip | `y≈94..212`, `h≈118` | Six equal slots |
| Primary row | `y≈231..814`, `h≈583` | 2D grid card + metadata/detail, about 1.9:1 |
| Bottom row | `y≈833..1095`, `h≈262` | Alerts + Energy + IoT health |

At wide full shell `1842 × 1222`:

- High-Level Sidebar: 64 px.
- Dashboard Sidebar: 288 px.
- Main content uses about 30–32 px gutters.
- KPI: six columns, 14–16 px gaps.
- Primary row: grid area about 930–950 px, metadata about 470–490 px, 18–20 px gap.
- Bottom row target ratio approximately `1.25 : 1.45 : 1`.

Use CSS grid/flex/minmax. Do not absolute-position the entire page.

### 10.4 Header

Left:

- Title: `Tổng quan · Tòa E`.
- Subtitle must be truthful, for example `Tổng hợp vận hành đa nguồn · xem nguồn tại từng khối`.
- Teal status dot is decorative only; do not pair it with fake real-time/online wording.

Right:

| Mockup control | Phase 07 behavior |
| --- | --- |
| `Dữ liệu minh họa` | Replace with neutral mixed-source disclosure or omit; mode is per widget |
| `Hôm nay / 7 ngày / 30 ngày` | Supported for range-aware demo widgets |
| `Tùy chọn` | Disabled unless fully implemented |
| Search | Omit or focus a Page 01-local quick navigation; no fake global search |
| Avatar `AT` | Neutral disabled/account placeholder only; no identity claim |

Do not show `Cập nhật lúc ... · 46/48 cảm biến trực tuyến` because fleet heartbeat does not exist.

### 10.5 Six KPI slots

1. **Điện năng hôm nay** — demo Energy total from Page 01 fixture.
2. **Nước hôm nay** — unavailable until safe daily-consumption semantics exist.
3. **CO₂ trung bình** — demo; do not label an IAQ score `/100`.
4. **Phòng vượt ngưỡng CO₂** — demo count from same CO₂ snapshot.
5. **Cảnh báo đang mở** — demo from Page 06 fixture, never authoritative/global badge.
6. **Thiết bị trong danh mục** — live IoT `acceptedCount`, not `trực tuyến`.

Each card must show its own mode/availability and derive helper text from the same source/selectors as its value.

### 10.6 Primary row

#### Left card — logical floor overview

Header:

- title such as `Không gian theo tầng · Logical 2D Grid`;
- explicit caption `Sơ đồ logic, không phải mặt bằng/BIM chính xác`;
- metric tab may contain only `CO₂` in Phase 07; do not add Temperature/People/Energy tabs without data contracts.

Body:

- FloorCatalog is a narrow left column.
- InteractiveFloorGrid uses the remaining card width.
- Grid cells show configured label + demo CO₂ status/value when mapped.
- Bottom legend repeats demo provenance and missing-data state.

#### Right card — FloorMetadataPanel / selected-cell detail

Default state:

- selected floor identity;
- configured room/cell count;
- clear instruction to choose a cell.

Selected room state:

- room/cell label;
- demo CO₂ latest value and status;
- compact deterministic CO₂ trend/table if available from fixture;
- fixture/window/provenance disclosure;
- optional link to `/dashboard/environment`.

Intentional omissions from mockup:

- no temperature/humidity/occupancy values without approved same-room source;
- no AHU relationship;
- no document-control link;
- no active `Tạo lệnh công việc`;
- no active `Xem lịch sử 30 ngày` unless supported by fixture/source.

### 10.7 Bottom row

#### Latest alerts

- Show a compact read-only list from existing Page 06 demo fixture.
- Use Page 01-local formatting; do not edit Page 06 components/text.
- Show demo provenance.
- `Xem tất cả` may navigate to `/dashboard/alerts`.
- Do not show/derive a global sidebar badge.

#### Hourly Energy

- Use shared `MetricTrendChart` or domain wrapper.
- Series and baseline derive from `page01-overview-demo-v1`.
- Card-level Demo badge and accessible data table.
- Do not state a real baseline reduction or kWh total from the mockup.

#### IoT health

- Live: catalogue received/accepted/skipped/duplicate/truncated facts where useful.
- Unavailable: online count, packet receipt, lost-signal count/duration, low battery, gateway uptime and average latency.
- Do not interpret catalogue `active` as connectivity/heartbeat.
- Provide a link to `/dashboard/iot` rather than fetching fleet telemetry.

### 10.8 Design tokens

Reuse current aligned Dashboard tokens:

- near-black/slate backgrounds;
- teal `#4FB9AD` family for selection/primary accents;
- amber/orange only for demo severity/status with text;
- radius 12–14 px;
- subtle one-pixel borders;
- page title 28–30 px;
- KPI value 32–38 px;
- card heading 15–17 px;
- body/table 12–14 px;
- helper/provenance 11–12 px;
- tabular/monospaced numeric values.

Do not retune global tokens solely to match one screenshot if it changes completed pages.

### 10.9 Responsive behavior

| Full viewport | KPI | Primary row | Floor catalog/grid | Bottom row |
| --- | --- | --- | --- | --- |
| `≥1842 px` | 6 columns | ~1.9:1 | catalog left + grid | 3 columns |
| `1558–1841 px` | 3 + 3 or 6 if readable | two columns | catalog left + grid | 3 or 2+1 |
| `1200–1557 px` | 3 + 3 | stack if detail <380 px | catalog above/left | 2 + 1 |
| `768–1199 px` | 2 columns | stack | catalog horizontal + grid scroll-safe | stack/2 columns |
| `<768 px` | 1 column | stack | floor pills + grid + detail below | stack |

- No body horizontal overflow.
- Grid may scroll internally only when necessary and must retain labels/focus.
- Touch targets about 44 px minimum.
- Detail must remain reachable after cell selection on mobile.

### 10.10 Mockup divergence table

| Mockup | Phase 07 implementation | Reason |
| --- | --- | --- |
| BIM 3D building | Logical Interactive 2D Grid | Explicit Knowledge Base + stakeholder override |
| Six operational numeric KPIs | Mixed demo/live/unavailable slots | Current source truth |
| `46/48 trực tuyến` | Live catalogue count only | No heartbeat contract |
| IAQ `82/100` | Demo CO₂ metric | No IAQ scoring contract |
| Open alert count `5` | Demo Page 01 card only | Authoritative alert registry empty |
| Water today numeric | Unavailable | Counter reset/rollover unresolved |
| Temperature/humidity/presence by room | Omitted/unavailable | No approved room mapping/source |
| AHU/document/work-order actions | Omitted/disabled | No mapping, identity or CMMS scope |
| Extra sidebar routes/badge | Excluded | Exactly seven routes |

---

## 11. Frontend state model

```text
selectedRange:
  today | 7d | 30d

catalogueState:
  idle | loading | ready | empty | unavailable | error

alertEngineState:
  idle | loading | no-active-rules | error

selectedFloorId:
  string

selectedCellId:
  string | null

gridView:
  visual | accessible-table
```

Rules:

- Demo fixture state never feeds live APIs/evaluator.
- Catalogue failure does not clear demo content.
- Range change does not relabel current catalogue/grid snapshot as historical.
- Floor change validates selected cell.
- Missing cell mapping remains missing; no default `0 ppm`.
- No mutation/action state in this phase.
- Frozen reference instant is injected into demo selectors/tests.

---

## 12. Expected file/component impact

Coding Agent must re-audit before creating/editing files.

### 12.1 Expected Page 01 files

```text
web/src/
├── app/dashboard/overview/page.tsx
├── components/dashboard/overview/
│   ├── OverviewDashboard.client.tsx
│   ├── OverviewPageHeader.tsx
│   ├── OverviewKpiStrip.tsx
│   ├── FloorCatalog.tsx
│   ├── InteractiveFloorGrid.tsx
│   ├── FloorMetadataPanel.tsx
│   ├── LatestAlertsPreview.tsx
│   ├── HourlyEnergyDemoChart.tsx
│   └── IotHealthSummary.tsx
├── lib/dashboard/
│   ├── overview-demo-fixtures.ts
│   ├── overview-grid-fixtures.ts
│   └── overview-selectors.ts
└── types/
    └── dashboard-overview.ts
```

Names are suggested; follow current repository conventions and avoid unnecessary fragmentation.

### 12.2 Shared component policy

Likely reuse without modification:

- `DashboardPageShell`;
- `KpiMetadataCard`;
- `DataModeBadge`, `StatusBadge`;
- `TimeFilterSegmented`;
- `MetricTrendChart`;
- loading/empty/unavailable/error states.

If a shared primitive must change:

- change must be additive and default-compatible;
- do not alter old text/style by default;
- add regression coverage for every existing consumer;
- document why a Page 01-local wrapper was insufficient.

### 12.3 Explicit no-touch expectation

Expected implementation should not modify backend files or Page 02/03/06/07 feature components. Any deviation requires the strict evidence in section 3.2 and handoff disclosure.

Add `web/test-bp2-phase07.mjs` and include it in the current aggregate `web/package.json` test pipeline without changing older assertions merely to make the new phase pass.

---

## 13. Implementation sequence for Coding Agent

### Checkpoint 1 — Re-audit and protect current work

1. Record branch, HEAD and dirty tree.
2. Diff from Phase 06 and identify stakeholder-authored `FIX TEXT` changes.
3. Create a protected-file list before editing.
4. Confirm current APIs/fixtures/exports and shared component contracts.
5. Do not begin with a cross-page refactor.

### Checkpoint 2 — Demo/grid domain

1. Define Page 01 types.
2. Create deterministic Energy fixture/selectors.
3. Create stable logical floor-grid fixture.
4. Add Page 01-local adapters for Page 03 CO₂ and Page 06 alerts.
5. Test stable IDs, no mutation, no randomness and internal consistency.

### Checkpoint 3 — Interactive 2D Grid

1. Implement generic FloorCatalog and grid core.
2. Implement Page 01 CO₂ cell-state adapter.
3. Implement selection/floor switching/accessibility/table alternative.
4. Implement FloorMetadataPanel.
5. Verify no 3D/BIM/coordinate inference.

### Checkpoint 4 — Header and KPI strip

1. Replace legacy page badge/divider/placeholder.
2. Build truthful mixed-source header.
3. Build six KPI slots from the mode matrix.
4. Keep Water unavailable and catalogue count accurately labeled.
5. Verify no mockup number is copied.

### Checkpoint 5 — Bottom composition

1. Build latest-alert demo preview by read-only reuse.
2. Build deterministic hourly Energy chart/table.
3. Build IoT health card from catalogue facts + unavailable states.
4. Add internal navigation links only to existing routes.

### Checkpoint 6 — States, responsive and accessibility

1. Independent loading/error states.
2. Keyboard grid/floor selection.
3. Responsive matrix and no body overflow.
4. Color-independent state labels.
5. Focus and screen-reader checks.

### Checkpoint 7 — Regression and handoff

1. Run new Page 01 tests.
2. Run all previous frontend tests without editing their expected labels.
3. Run lint/build.
4. Run backend regression only to confirm no integration break if backend untouched.
5. Browser/visual QA at section 16 viewports.
6. Audit diff for forbidden completed-page edits.
7. Create mandatory handoff in section 18.

---

## 14. Test matrix

### 14.1 Fixture/selectors

- Fixed fixture IDs/versions/reference instant.
- No `Math.random()` or render-time `Date.now()`.
- Energy KPI equals aggregate of chart series for the same supported range.
- CO₂ average/over-threshold count derive from the same Page 03 demo snapshot.
- Latest-alert count/list derive from existing Page 06 demo data without mutation.
- Stable cell IDs and unique floor/cell keys.
- Unknown/missing room mapping stays unavailable.
- Sorting/filtering/range selectors do not mutate imported fixtures.
- No copied mockup numbers used as expected facts.

### 14.2 Grid behavior

- Floor switch loads correct configured grid.
- Invalid prior selection is cleared deterministically.
- Cell click and keyboard selection update detail.
- Empty/service cells do not receive CO₂.
- Accessible label contains mode/value/status.
- Visual and table alternatives contain matching values.
- Grid does not import or initialize Unity/WebGL/Three.js.

### 14.3 Data/provenance

- Energy is always demo.
- Water today is unavailable, never numeric zero.
- CO₂ and rooms-over-threshold are demo.
- Open alerts are demo and never reach sidebar badge.
- IoT accepted count is live catalogue, not online count.
- Alert engine null counts remain null/unavailable.
- Catalogue failure is isolated from demo widgets.
- No direct upstream URL/token appears client-side.

### 14.4 UI/regression

- Legacy Page 01 placeholder/page badge removed.
- Six KPI slots present at reference desktop.
- Primary row uses 2D grid, never 3D mockup.
- Bottom three cards present.
- Exactly seven routes remain.
- Existing Page 02/03/06/07 labels remain byte-for-byte unchanged unless an approved bug patch is documented.
- Existing tests pass without rewriting assertions to old handoff text.
- Shared component defaults remain backward-compatible.

### 14.5 Architecture/security

- No PostgreSQL entity/migration/repository/job.
- No backend mutation.
- No N+1 telemetry scan.
- No polling.
- No inferred room coordinates/online state/alert state.
- No work-order or identity API.

---

## 15. Browser and interaction checks

- `Tổng quan` is active in Dashboard Sidebar.
- Header has no legacy page badge/divider and no fake real-time online statement.
- Range controls update only range-aware demo widgets.
- Each KPI exposes correct mode/availability.
- FloorCatalog changes the logical 2D grid.
- Mouse and keyboard cell selection update detail.
- Missing cell data remains explicit.
- `Xem tất cả` opens existing Alert page without modifying it.
- IoT link opens existing IoT page without changing its labels/content.
- API failure in catalogue/status produces local error state and retry.
- No repeated background network calls after initial load.
- No body horizontal scrolling.

---

## 16. Visual QA viewports

- `1558 × 1116` full shell corresponding to source image plus 64 px rail.
- `1494 × 1116` Dashboard workspace crop.
- `1842 × 1222` established full-shell wide reference.
- `1440 × 900` desktop.
- `1280 × 800` compact desktop.
- `1024 × 768` tablet landscape.
- `390 × 844` mobile.

Visual checklist:

- aligned dual sidebars and active Tổng quan item;
- header and six KPI rhythm match mockup hierarchy;
- central area is unmistakably a logical 2D grid, not a poor 3D imitation;
- FloorCatalog, grid and metadata panel have clear ownership;
- primary row approximates 1.9:1 at wide desktop;
- bottom row approximates mockup proportions;
- demo/live/unavailable indicators remain visible but not noisy;
- no old-page text/style regression;
- no mockup-only routes, badge, identity, actions or values;
- accessible focus and no overflow.

---

## 17. Acceptance criteria

Phase 07 is complete only when:

1. Page 01 placeholder is replaced by the aligned Overview layout.
2. Center panel is a Knowledge-Base-compliant logical Interactive 2D Grid, not BIM/3D.
3. FloorCatalog, stable cell identity, floor switching and selected-cell detail work.
4. CO₂ grid/detail is visibly deterministic demo and never mixed with raw Solar live data.
5. Six KPI slots follow the exact mode/availability matrix in section 6.
6. Water-today remains unavailable until safe counter semantics exist.
7. IoT catalogue count is never labeled as fleet online count.
8. Alert preview/count remains demo; authoritative null counts and absent sidebar badge are preserved.
9. Hourly Energy chart is deterministic demo with accessible table.
10. Bottom latest-alert/Energy/IoT-health cards match the visual hierarchy.
11. No PostgreSQL/report/alert persistence or new mutation is introduced.
12. No direct upstream call, polling or N+1 telemetry scan is introduced.
13. Completed Page 02/03/06/07 text/labels/content are not changed except a documented critical bug under section 3.2.
14. Exactly seven routes and dual-sidebar shell remain intact.
15. Automated tests, lint/build, responsive/accessibility and visual QA have evidence.
16. Mandatory implementation handoff exists.

---

## 18. Mandatory handoff after implementation

After implementation and verification, Coding Agent **must create**:

`web/doc/bp2_phase07_page01_overview_composition_handoff.md`

The handoff must include at minimum:

- branch, HEAD and working-tree notes;
- protected-file audit and confirmation stakeholder text was preserved;
- exact file inventory;
- component/data-flow architecture;
- Interactive 2D Grid contract, fixture version, stable ID strategy and accessibility behavior;
- explicit proof no 3D/BIM/Unity implementation was added;
- per-widget mode/availability/source matrix;
- reuse relationship to Page 03/Page 06 fixtures without modifying completed pages;
- range behavior and partial-failure handling;
- mockup-difference table;
- proof Water/IoT/Alert claims remain honest;
- network-call/N+1/polling audit;
- no-database/no-mutation/no-secret audit;
- automated tests, lint/build and previous-phase regression results;
- browser interaction/accessibility results;
- screenshots at section 16 viewports;
- any protected-page edit, with strict bug evidence and regression proof;
- open issues and next-phase notes.

> **Final handoff instruction to Coding Agent:** Implement only the scope of `bp2_phase07_page01_overview_composition.md`; use the stakeholder mockup for Page 01 layout but replace its BIM/3D region with the Knowledge-Base-compliant logical Interactive 2D Grid; do not make unnecessary changes to previously implemented Alert, Environment, Water, IoT or other completed pages, especially their stakeholder-edited text labels, unless a verified blocking bug makes the smallest possible patch unavoidable; add no PostgreSQL report/alert persistence; and after implementation and verification you must create `web/doc/bp2_phase07_page01_overview_composition_handoff.md` before reporting the phase complete.
