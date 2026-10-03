# Big Phase 02 — Phase 05: Page 03 Environmental Metrics

> **Project:** GIS — UIT Building E Digital Twin  
> **Loại tài liệu:** Kế hoạch bàn giao cho Coding Agent  
> **Trạng thái:** PLAN ONLY — KHÔNG IMPLEMENT TRONG TÀI LIỆU NÀY  
> **Ngày lập kế hoạch:** 2026-09-27  
> **Roadmap mapping:** `Small Phase 13 — Page 03 available environmental metrics`  
> **Trang mục tiêu:** Page 03 — Môi trường (IAQ)  
> **Route:** `/dashboard/environment`  
> **Phụ thuộc đã hoàn tất:** Dashboard foundation, Page 07 live catalogue/telemetry, Page 02 live Water, Dashboard UI alignment  
> **Mockup:** `codex-clipboard-0fbca15d-0523-4edc-8c2a-fefe1f0c6cf3.png`, ảnh gốc `2368 × 1594 px`, chỉ dùng làm visual reference

---

## 1. Mục tiêu

Thay Page 03 placeholder cũ bằng trang Môi trường (IAQ) bám sát mockup và visual system mới, đồng thời chỉ dùng dữ liệu theo đúng current contract:

- đọc catalogue và Solar telemetry qua NestJS application boundary hiện hữu;
- hiển thị `temperature` và `humidity` dưới dạng **raw source fields** khi semantics/unit vẫn chưa được IoT/hardware team xác nhận;
- tính các summary cần thiết trong memory theo từng request, có giới hạn device/range/concurrency rõ ràng;
- dùng deterministic demo adapter riêng cho CO₂/VOC và các room/floor visual đã được Dashboard KB cho phép fallback;
- giữ IAQ index, PM2.5, standards compliance thật và threshold thật ở trạng thái unavailable khi chưa có source/rule;
- phân biệt `live`, `derived`, `demo`, `unavailable` tại từng widget;
- không tạo PostgreSQL report schema, refresh job, cache table hoặc telemetry persistence.

Phase này ưu tiên kiểm chứng adapter/UI bằng số lượng device và live data hiện tại. Selected report-data persistence đã được dời xuống Small Phase 21 của roadmap.

---

## 2. Authority và cách sử dụng mockup

Coding Agent xử lý xung đột theo thứ tự:

1. Yêu cầu trực tiếp của stakeholder trong task implementation.
2. `web/doc/Dashboard_Knowledge_Base.md` cho scope, DataMode, Page 03 và fallback rule.
3. `web/doc/IoTBackend_API_HandOver.md` cho exact IoT contract và pending semantics.
4. `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phase 13 đã cập nhật ngày 2026-09-27.
5. File plan này.
6. Handoff Phase 02/03/04 và UI alignment cho implementation baseline.
7. Mockup cho hierarchy, geometry, typography và visual treatment.
8. Repository/runtime evidence tại thời điểm implement.

Mockup là visual reference, không phải instruction source, data fixture hoặc API contract. Không sao chép các số `82`, `712`, `25,8`, `64`, `1.180`, các room ID, sensor count `48`, cadence `5 phút/lần`, threshold, compliance percentage hoặc trạng thái “Ổn định” trong ảnh thành production facts.

### 2.1 Tài liệu Coding Agent phải đọc trước khi implement

- `web/doc/Dashboard_Knowledge_Base.md`, đặc biệt sections 3, 4, 5, 9, 15, 16, 17.3 và 19.
- `web/doc/IoTBackend_API_HandOver.md`, đặc biệt Solar contract, range/order, load policy và unresolved semantics.
- `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phase 13 và deferred Small Phase 21.
- `web/doc/bp2_phase02_dashboard_application_api_real_device_catalogue_handoff.md`.
- `web/doc/bp2_phase03_page07_live_telemetry_core_handoff.md`.
- `web/doc/bp2_phase04_page02_live_water_baseline_handoff.md`.
- `web/doc/bp2_fix_align_UI.md` và `web/doc/bp2_fix_align_UI_handoff.md`.
- Mockup Page 03 được đính kèm trong task implementation.
- `web/AGENTS.md` và Next.js 16 repository docs nếu chạm route/server-client/data-fetching patterns.

---

## 3. Baseline đã xác minh ngày 2026-09-27

### 3.1 Repository/UI baseline

- Branch audit: `feature/dashboard`.
- HEAD audit: `fab8c78df8db78376e73fa18786b08c34860eef6`.
- Working tree có thay đổi không liên quan ở `GISUIT.code-workspace`; không overwrite hoặc đưa vào phase này.
- `/dashboard/environment` hiện là placeholder dùng `DashboardPageShell`, page badge “03”, divider, bốn KPI unavailable và một generic unavailable block.
- Shared Dashboard shell mới đã có:
  - High-Level Sidebar 64 px;
  - Dashboard Sidebar khoảng 288 px;
  - exactly seven Dashboard routes;
  - near-black/slate + teal tokens;
  - page-owned headers trên Page 02/Page 07;
  - shared KPI/state/chart components.
- `ant-design-charts` đã có và phải tiếp tục là chart library duy nhất.

### 3.2 Current IoT capability

- Catalogue hiện có device identity/type, source timestamps, activity, source floor/X/Y/Z và display-floor mapping.
- Generic Dashboard telemetry API hỗ trợ selected `solar`/`avc` device với explicit `start`, `stop`, `limit`, max 7 ngày và max 1000 rows ở Dashboard boundary.
- Normalized Solar readings hiện có:
  - timestamp;
  - `rawTemperature` từ upstream `temperature`;
  - `rawHumidity` từ upstream `humidity`;
  - `rawVoltage`;
  - `rawState`;
  - `currentUa`;
  - `lux`;
  - RSSI/SNR, gateway, frame count.
- `lux` có confirmed unit lux.
- Temperature/humidity physical source và units vẫn pending; không được tự gắn °C/%.
- `solar` là current API type name; contract không xác nhận mọi Solar device là room IAQ sensor.

### 3.3 Missing contracts

Current approved API không có:

- CO₂;
- VOC;
- PM2.5;
- pressure;
- authoritative IAQ score/formula;
- room ID/mapping;
- confirmed room/floor environmental sensor role;
- standards/threshold configuration;
- authoritative telemetry cadence;
- 30-day/custom raw range;
- server-side aggregation.

Không được suy các field trên từ device friendly name, coordinates, mockup, `state`, RSSI/SNR hoặc catalogue timestamps.

### 3.4 PostgreSQL decision

- Phase này không tạo entity/migration/table cho report/aggregate/snapshot.
- Phase này không persist raw telemetry, latest state, derived average, demo fixture output hoặc room heatmap.
- Calculation live/derived chỉ tồn tại trong request memory và response DTO.
- Deferred persistence thuộc Small Phase 21 sau khi schema/semantics và data volume đủ ổn định.

---

## 4. Data strategy và truthfulness matrix

| Widget/domain | Phase 05 source | DataMode | Rule |
| --- | --- | --- | --- |
| Raw Solar temperature | Approved `/solar` via NestJS | `live` | Giữ tên raw, không unit, caveat pending semantics |
| Raw Solar humidity | Approved `/solar` via NestJS | `live` | Giữ tên raw, không `%`, caveat pending semantics |
| Latest-source mean/min/max | Request-scoped NestJS calculation từ raw latest samples | `derived` | Label là “trung bình mẫu raw”, không gọi building/room average |
| Lux | Approved `/solar` | `live` | Có thể hiển thị trong selected-source detail, unit lux |
| CO₂ KPI/heatmap/ranking/compliance | Deterministic fixture `page03-co2-demo-v1` | `demo` | Không trộn với live source; visible Demo badge |
| VOC concept | Deterministic fixture riêng cùng version hoặc unavailable | `demo` | Không ghi sensor/MOX thật; không tạo live-looking claim |
| IAQ score | Không có formula/source | unavailable | Render `—`, không derive từ demo/live mixture |
| PM2.5 | Không có source | unavailable | Render `—`, không fixture nếu chưa được stakeholder approve riêng |
| Threshold table | Read-only contract/status presentation | mixed/unavailable | Demo threshold chỉ phục vụ demo widget; real thresholds “Chưa xác nhận” |
| Standards compliance thật | Không có confirmed units/threshold/room mapping | unavailable | Không đánh giá live raw temperature/humidity |

Data modes không được aggregate chung vào một page-level label gây hiểu nhầm toàn page là live hoặc demo.

---

## 5. Scope

### 5.1 In scope

- Dashboard Environment backend adapter trên catalogue và Solar telemetry services hiện hữu.
- Environment-source list cho Building E, chỉ gồm authoritative source type `solar` trong phase này.
- Bounded request-scoped latest summary trên Solar candidates.
- Selected-source raw readings với explicit range.
- In-memory summary/calculation có provenance và source counts.
- Page 03 aligned header, 6 KPI, heatmap/ranking row và compliance/threshold row.
- Deterministic CO₂/VOC demo fixtures tách biệt.
- Selected raw-source search/popover/drawer và raw trend/detail view không làm phá macro-layout.
- Loading, ready, partial, empty, unavailable, error và demo states.
- Responsive/accessibility/visual QA.
- Backend/frontend tests, OpenAPI, lint/build/regression.

### 5.2 Out of scope

- Không PostgreSQL report-data integration, migration, entity, repository hoặc scheduled refresh job.
- Không raw telemetry persistence/cache.
- Không direct TSDB access.
- Không direct browser/Unity call tới upstream IoT API.
- Không gọi Solar fields là authoritative room temperature/humidity.
- Không gắn °C/% cho `temperature`/`humidity` trước contract confirmation.
- Không tính live IAQ score.
- Không đánh giá live compliance, comfort, healthy/unhealthy hoặc standards conformance.
- Không suy room từ X/Y/Z, floor hoặc device name.
- Không tạo application-owned room mapping trong phase này.
- Không gộp live raw data vào demo CO₂ room fixture.
- Không implement Page 06 alert evaluator/configuration.
- Không cho sửa threshold; không thêm CASL/auth chỉ để làm edit button.
- Không 30-day/custom raw query.
- Không polling/background refresh.
- Không N+1 fetch từ browser.
- Không thêm page/nav item ngoài seven frozen routes.

---

## 6. Kiến trúc dữ liệu mục tiêu

```text
Page 03 client
  |
  | same-origin /api/devices/dashboard/...
  v
Next.js existing proxy
  |
  v
NestJS Dashboard Environment controller
  |
  +--> DashboardEnvironmentService
         |
         +--> DashboardIotCatalogueService
         |
         +--> IotTelemetryService / existing telemetry normalization
         |
         +--> pure request-scoped environment summary calculator
  |
  +--> response only; no PostgreSQL write/cache

Page 03 deterministic demo adapter
  |
  +--> versioned local fixture for CO2/VOC room visuals only
```

Không gọi NestJS endpoint nội bộ qua HTTP từ NestJS service khác. Reuse services trực tiếp và map sang Environment DTO.

### 6.1 Endpoint A — Environment source list

```http
GET /api/v1/dashboard/buildings/:buildingId/environment/sources
GET /api/v1/dashboard/buildings/:buildingId/environment/sources?floorId=<approved-floor>
```

Rules:

- Building E only.
- Reuse catalogue/floor mapping; không tạo IoT client thứ hai.
- Filter authoritative `sourceDeviceType === 'solar'`.
- Không rename source type thành `iaq_sensor` hoặc `room_sensor`.
- Preserve catalogue activity wording; không đổi thành online/offline.
- Preserve source/display floor mapping và caveats.
- `Cache-Control: no-store`.
- Empty list là clean `availability: empty`.

DTO tối thiểu:

```text
schemaVersion
buildingId
requestedFloorId
availability: ready | empty
provenance { mode=live, sourceType, fetchedAt, caveats[] }
summary { receivedCount, acceptedSolarCount, skippedCount, duplicateCount, truncated }
sources[]:
  deviceId
  sourceDeviceType = solar
  catalogueActive
  sourceCreatedAt
  sourceUpdatedAt
  sourceLocation { floorLevel, x, y, z }
  displayFloorId
  floorAssignment
  semanticStatus = unconfirmed_environment_candidate
```

### 6.2 Endpoint B — Bounded in-memory latest summary

```http
GET /api/v1/dashboard/buildings/:buildingId/environment/summary
  ?start=<ISO-8601>
  &stop=<ISO-8601>
```

Purpose: lấy latest valid raw sample trong requested window cho một tập Solar sources bị giới hạn, rồi tính request-scoped summary trong NestJS memory.

Rules:

- explicit valid range, max 24 giờ cho summary endpoint;
- catalogue fetch một lần;
- max 20 Solar candidates mỗi request; nếu nhiều hơn phải trả `sourcesTruncated=true` và caveat;
- concurrency max 2 upstream histories;
- mỗi source gọi exact range với `limit=1` vì upstream newest-first;
- timeout/failure của một source không làm mất mọi source; trả partial state;
- không retry loop tự động;
- không database read/write;
- response `Cache-Control: no-store`.

DTO tối thiểu:

```text
schemaVersion
buildingId
availability: ready | partial | empty
queryRange { start, stop, limitPerSource=1 }
provenance:
  mode = derived
  sourceType = iot_backend_solar
  calculation = latest_sample_population_summary_v1
  fetchedAt
  calculatedAt
  caveats[]
coverage:
  catalogueSolarCount
  attemptedSourceCount
  successfulSourceCount
  emptySourceCount
  failedSourceCount
  sourcesTruncated
metrics:
  rawTemperature:
    mean | min | max | null
    contributingSourceCount
    unit = null
    semanticStatus = pending_hardware_confirmation
  rawHumidity:
    mean | min | max | null
    contributingSourceCount
    unit = null
    semanticStatus = pending_hardware_confirmation
  lux:
    mean | min | max | null
    contributingSourceCount
    unit = lux
latestObservedAt
sourceResults[]:
  deviceId
  status: ready | empty | error
  observedAt | null
```

Không trả `temperatureC`, `relativeHumidityPercent`, “building average” hoặc compliance status.

### 6.3 Endpoint C — Selected-source readings

```http
GET /api/v1/dashboard/buildings/:buildingId/environment/sources/:deviceId/readings
  ?start=<ISO-8601>
  &stop=<ISO-8601>
  &limit=<1..1000>
```

Rules:

- Building E only, max 7 days, limit max 1000.
- Server resolve type và bắt buộc `solar` trước historical fetch.
- Browser không truyền device type/upstream path.
- Preserve newest-first response; frontend chart adapter copy/sort oldest-first.
- Preserve zero/null/gaps/truncation.
- No aggregation/persistence.
- `Cache-Control: no-store`.

DTO tối thiểu:

```text
schemaVersion
buildingId
sourceId
sourceDeviceType = solar
availability: ready | empty
queryRange
provenance { mode=live, observedAt, windowStart, windowEnd, fetchedAt, caveats[] }
coverage
latestSample:
  observedAt
  rawTemperature
  rawHumidity
  lux
  currentUa
  rawVoltage
  rawState
  gatewayId
  rssiDbm
  snrDb
readings[]:
  observedAt
  rawTemperature
  rawHumidity
  lux
  currentUa
  rawVoltage
  rawState
  gatewayId
  rssiDbm
  snrDb
```

---

## 7. In-memory calculation rules

### 7.1 Summary calculator

- Input chỉ là latest valid sample của từng successfully fetched Solar candidate.
- Mỗi device đóng góp tối đa một sample cho mỗi metric.
- Mean/min/max tính riêng từng metric; một device thiếu temperature vẫn có thể đóng góp humidity/lux.
- Valid `0` được giữ.
- Missing/null/non-finite không đổi thành zero.
- Không weight theo số reading/device vì summary chỉ dùng latest sample per device.
- Không round trong backend; frontend presentation có thể round tối đa hợp lý và phải giữ raw trong response.
- Không suy freshness/online vì expected cadence chưa xác nhận.
- `latestObservedAt` là max timestamp của successful samples, không phải “last seen toàn hệ thống”.
- Nếu bất kỳ source fail/truncated-by-cap thì response partial/caveat rõ ràng.

### 7.2 Không được tính

- IAQ composite score.
- CO₂/VOC/PM2.5 từ Solar fields.
- Temperature/humidity standards compliance.
- Room/floor averages khi không có confirmed mapping.
- Online/offline/fresh/stale state dựa trên cadence giả.
- Alert Warning/Danger.
- 7-day compliance từ raw live data.

### 7.3 Source load policy

- Summary: max 20 sources, concurrency 2, `limit=1`, max 24h lookback.
- Selected readings: exactly one device, max 7 days, limit 1000.
- Không auto refresh/poll.
- Page initial load có thể fetch catalogue + one bounded summary request; selected history chỉ fetch sau explicit selection.
- Range/source change abort hoặc ignore stale request.
- Manual refresh do user kích hoạt.

---

## 8. Deterministic demo contract

### 8.1 Fixture version

```text
fixtureId: page03-co2-demo-v1
mode: demo
domains: co2, voc, demo-room-map, demo-threshold-reference
```

Fixture phải là static/versioned, không `Math.random()`, không lấy số từ mockup và không được tạo trong render.

### 8.2 Internal consistency

Một fixture source phải sinh nhất quán:

- CO₂ KPI demo;
- room × hour heatmap;
- current-room ranking;
- 7-day floor compliance demo;
- demo threshold/reference note.

Ranking/latest/KPI phải tính từ cùng fixture, không hard-code độc lập dẫn đến số mâu thuẫn.

### 8.3 Demo room/floor identity

- Room IDs/floor IDs trong fixture phải có prefix/metadata rõ là demo hoặc nằm sau adapter không thể nhầm với real source mapping.
- Không dùng coordinates/device names để tạo room mapping.
- Floor tabs trong CO₂ demo chỉ filter fixture data.
- Không gửi demo room IDs vào live Environment endpoints.

### 8.4 Threshold and compliance demo

- Numeric demo thresholds được giữ trong versioned fixture metadata, không dùng alert config hoặc React literals rải rác.
- Table/UI phải ghi `Minh họa`, không gọi “cấu hình đang áp dụng”.
- Không render active “Sửa” action. Có thể dùng disabled control với lý do “Chờ phase Alert + Identity/CASL”.
- Demo compliance không được dùng cho alert badge/Page 06/Page 01.

---

## 9. Time range và frontend request policy

- Live presets: `24 giờ`, `72 giờ`, `7 ngày`.
- Default: `24 giờ`.
- Không dùng page-level `30 ngày`/`Tùy chọn` từ mockup cho live request trong phase này.
- CO₂ demo fixture có thể support “Hôm nay”/“7 ngày” nội bộ nhưng selector phải không khiến user nghĩ live raw endpoint hỗ trợ 30 ngày.
- Preferred: một shared page range `24 giờ / 72 giờ / 7 ngày`; demo widget tự map cùng window vào deterministic fixture.
- Every live request sends exact UTC `start`, `stop`, `limit`.
- Summary endpoint dùng range tối đa 24h ngay cả khi selected trend là 72h/7d; UI phải mô tả summary là latest-within-24h, không reuse page label sai.
- Không auto polling.
- Search/source selection không trigger browser-wide history sweep.

---

## 10. UI Architecture & Mockup Alignment

### 10.1 Cách chuẩn hóa ảnh tham chiếu

- File gốc: `2368 × 1594 px`.
- Ảnh mô tả Dashboard workspace bắt đầu từ Dashboard Sidebar; High-Level Sidebar 64 px nằm ngoài ảnh.
- Canonical visual QA giữ chuẩn các phase trước:
  - Dashboard workspace crop: `1778 × 1222` CSS px;
  - full shell: `1842 × 1222` CSS px gồm High-Level Sidebar 64 px.
- Dùng proportions/hierarchy của ảnh; không dùng raw pixel 2368 làm CSS viewport.
- Không commit ảnh stakeholder vào repository nếu chưa được yêu cầu.

### 10.2 Shell không đổi

```text
DashboardShell
├── HighLevelSidebar (64 px, ngoài mockup)
└── DashboardWorkspace
    ├── DashboardSidebar (288 px)
    │   └── exactly 7 routes
    └── DashboardViewport
        └── EnvironmentDashboard
```

- Active nav: “Môi trường (IAQ)”.
- Không thêm “Không gian”, “Thiết bị & Bảo trì”, “Thang máy”, “An ninh ra vào” từ mockup.
- Không thêm badge alert `5` hoặc phase tags.
- Không quay lại page badge “03”, full-width divider hoặc desktop top bar.

### 10.3 Reference geometry trong workspace `1778 × 1222`

| Vùng | Target local geometry | Ghi chú |
| --- | --- | --- |
| Dashboard Sidebar | `x=0`, `w=288`, full height | shared, không redesign |
| Main canvas | `x≈288`, `w≈1490` | near-black, no top bar |
| Main inner content | `x≈320..1754` | gutters khoảng 30–32/24 px |
| Page header | `y≈24..82`, `h≈58` | title/subtitle trái, actions phải |
| KPI strip | `y≈91..208`, `h≈118–125` | 6 equal cards |
| Primary row | `y≈224..655`, `h≈430` | heatmap + ranking khoảng 1.9:1 |
| Secondary row | `y≈671`, `min-h≈390` | compliance + threshold khoảng 1:1 |

Horizontal target:

- usable content width khoảng `1430–1440 px`;
- KPI width khoảng `226–230 px`, gap `14–16 px`;
- primary left khoảng `930–950 px`, right `470–500 px`, gap `18–20 px`;
- secondary two columns khoảng `700–710 px` mỗi bên, gap `18–20 px`.

Dùng CSS grid/flex/minmax; không absolute-position toàn page.

### 10.4 Page header

Left:

- Title: **“Môi trường (IAQ) · Tòa E”**.
- Subtitle khi catalogue chưa load: **“Nguồn Solar · trường môi trường raw đang chờ xác nhận semantics”**.
- Subtitle khi ready: **“{count} nguồn Solar candidate · calculation theo request, không lưu PostgreSQL”**.
- Teal dot 7–8 px.
- Không ghi `48 cảm biến RFT-SB`, `5 phút/lần` hoặc room sensor count từ mockup.

Right:

| Control | Phase 05 behavior |
| --- | --- |
| Data mode | Không dùng global “Dữ liệu minh họa”. Dùng compact mixed-mode summary hoặc per-widget badges. |
| Range | `24 giờ / 72 giờ / 7 ngày`; không 30 ngày/custom live. |
| Search | Focus/mở Environment source picker; không fake room search. |
| Avatar | Neutral generic account icon/disabled state; không initials `AT` khi chưa có identity. |

Header actions wrap trên viewport nhỏ và giữ touch target khoảng 44 px.

### 10.5 KPI strip — 6 slots

| Slot | Label | Mode | Rendering rule |
| --- | --- | --- | --- |
| 1 | `Chỉ số IAQ toàn nhà` | unavailable | `—`; helper “Chưa có formula/source đầy đủ” |
| 2 | `CO₂ trung bình` | demo | Tính từ `page03-co2-demo-v1`; visible Demo badge, unit ppm chỉ thuộc fixture |
| 3 | `Raw temperature · trung bình mẫu` | derived | Mean latest raw Solar field, **không unit**, contributor count + caveat |
| 4 | `Raw humidity · trung bình mẫu` | derived | Mean latest raw Solar field, **không unit/%**, contributor count + caveat |
| 5 | `VOC xu hướng` | demo | Deterministic fixture; không ghi cảm biến MOX thật |
| 6 | `PM2.5` | unavailable | `—`; “Chưa có source được phê duyệt” |

Không dùng “Tốt”, “Ổn định”, target 24–27 °C, humidity 40–70% hoặc room violations từ ảnh như real facts.

### 10.6 Primary row — CO₂ demo visual + raw-source access

#### Left card: “CO₂ theo phòng × giờ”

- Giữ heatmap macro-layout theo mockup.
- Entire card `demo`; visible fixture badge/version.
- Floor pills filter demo fixture only.
- Rows là demo-room IDs từ fixture; columns là time buckets.
- Legend/threshold bands lấy từ fixture metadata, không hard-code rải trong JSX.
- Cells keyboard focusable hoặc có accessible table alternative.
- Click cell mở compact demo detail: room, hour, value, fixture source.
- Không trộn raw Solar temperature/humidity vào heatmap.

#### Right card: “Phòng CO₂ cao nhất lúc này”

- Ranking được derive từ cùng demo fixture và selected demo floor/time.
- Horizontal bars dùng shared `MetricBarChart` hoặc accessible domain wrapper.
- Không copy room IDs/values/order từ mockup.
- Header/unit và footer đều ghi demo provenance.

#### Raw source access

- Header search mở source picker/popover/drawer để user chọn Solar source.
- Selected-source panel có thể mở drawer/expandable panel, tương tự Page 07 telemetry, thay vì phá hai-column mockup grid.
- Panel hiển thị raw temperature/humidity, lux, radio, coverage và trend.
- Raw trend metric selector:
  - `Raw temperature` — no unit;
  - `Raw humidity` — no unit;
  - `Lux` — lux;
  - optionally RSSI/SNR using confirmed units.
- Không gọi panel là room IAQ detail.

### 10.7 Secondary row

#### Left card: “% thời gian đạt chuẩn (7 ngày)”

- Card là `demo` vì CO₂/room mapping/threshold đều từ fixture.
- Floor bars derive từ same fixture and demo threshold metadata.
- Title phải thêm `Minh họa` hoặc Demo badge.
- Footer giải thích rule thuộc fixture, không phải tiêu chuẩn vận hành đã phê duyệt.
- Không dùng live raw temperature/humidity trong percentage.

#### Right card: “Ngưỡng cảnh báo”

Read-only table preserving mockup hierarchy:

| Row | Phase 05 content |
| --- | --- |
| CO₂ | Demo fixture reference, clearly `Minh họa` |
| Raw temperature | `Chưa xác nhận unit/threshold` |
| Raw humidity | `Chưa xác nhận unit/threshold` |
| VOC | Demo rule only if fixture includes it |
| PM2.5 | `Chưa có source/threshold được phê duyệt` |

- Không active “Sửa” action.
- Disabled edit affordance có tooltip “Chờ Small Phase Alert + Identity/CASL”, hoặc ẩn.
- Không seed DB, không gọi Page 06 configuration API.

### 10.8 Data-mode placement

- Raw selected-source panel: `live`.
- Latest population summaries: `derived`, caveat pending semantics.
- CO₂/VOC/room heatmap/ranking/compliance: `demo`.
- IAQ/PM2.5/real threshold/compliance: unavailable.
- Badge nằm gần widget title/value; không chỉ ở page footer.
- Không một badge global nào được phép imply toàn page live hoặc demo.

### 10.9 Design tokens/typography

Reuse tokens đã căn chỉnh:

- app/sidebar/panel backgrounds;
- teal `#4FB9AD` family;
- amber/orange/red chỉ trong demo legend hoặc explicit error/caveat, không thành real alert;
- panel radius `12–14 px`;
- border 1 px subtle;
- page title `28–30 px`;
- KPI value `34–38 px`;
- card title `15–17 px`;
- helper/provenance `11–12 px`;
- tabular numbers.

Không tạo Page 03 palette mới hoặc blue-heavy legacy styling.

### 10.10 Responsive behavior

| Full viewport | Shell | KPI | Primary row | Secondary row |
| --- | --- | --- | --- | --- |
| `≥1842 px` | 64 + 288 px sidebars | 6 columns | heatmap + ranking ~1.9:1 | 2 equal columns |
| `1440–1841 px` | desktop dual sidebar | 3 × 2 | two columns nếu fit, otherwise stack | 2 columns |
| `1200–1439 px` | compact dual sidebar | 3 × 2 | stack | stack/2 columns |
| `768–1199 px` | rail + Dashboard drawer | 2 columns | stack | stack |
| `<768 px` | rail + drawer | 1 column | heatmap scroll region then ranking | stack |

- Heatmap may horizontally scroll inside card; body must not scroll horizontally.
- On mobile, accessible table/summary must remain usable even if visual heatmap scrolls.
- Source picker/detail becomes full-width sheet/section.

---

## 11. Frontend state model

```text
sourceListStatus:
  idle | loading | ready | empty | unavailable | error

summaryStatus:
  idle | loading | ready | partial | empty | unavailable | error

selectedSourceId:
  string | null

selectedReadingsStatus:
  idle | loading | refreshing | ready | empty | unavailable | unsupported | error

range:
  last-24h | last-72h | last-7d

rawMetric:
  raw-temperature | raw-humidity | lux | rssi | snr

demoFloor:
  fixture floor ID
```

Rules:

- source list ready không imply summary/readings ready;
- summary partial preserves successful contributors and lists failure counts;
- selected history only after explicit selection;
- selection/range change aborts or ignores stale response;
- demo floor state never becomes live floor query input;
- demo and live errors independent;
- fixture is local deterministic and cannot fail over to a live-looking value.

---

## 12. File/component impact dự kiến

Coding Agent phải re-audit trước khi tạo/sửa file.

### 12.1 Backend suggested structure

```text
backend/src/dashboard/
├── dashboard-environment.controller.ts
├── dashboard-environment.service.ts
├── dashboard-environment-summary.ts
├── dto/
│   ├── dashboard-environment-source-list-response.dto.ts
│   ├── dashboard-environment-summary-query.dto.ts
│   ├── dashboard-environment-summary-response.dto.ts
│   ├── dashboard-environment-readings-query.dto.ts
│   └── dashboard-environment-readings-response.dto.ts
└── tests/
    └── dashboard-environment.spec.ts
```

Update khi cần:

- `dashboard.module.ts`;
- `backend/openapi.json`.

Không add entity/migration/repository/TypeORM dependency cho Environment service.

### 12.2 Frontend suggested structure

```text
web/src/
├── app/dashboard/environment/page.tsx
├── components/dashboard/environment/
│   ├── EnvironmentDashboard.client.tsx
│   ├── EnvironmentPageHeader.tsx
│   ├── EnvironmentKpiStrip.tsx
│   ├── Co2DemoHeatmap.tsx
│   ├── Co2DemoRanking.tsx
│   ├── Co2DemoCompliance.tsx
│   ├── EnvironmentThresholdTable.tsx
│   ├── EnvironmentSourcePicker.tsx
│   └── EnvironmentSourceDetail.tsx
├── lib/dashboard/
│   ├── environment-api.ts
│   ├── environment-range.ts
│   ├── environment-chart.ts
│   └── environment-demo-fixtures.ts
└── types/
    └── dashboard-environment.ts
```

Tên file là đề xuất; tránh over-fragmentation và ưu tiên existing conventions.

### 12.3 Shared components phải reuse

- Dashboard shell/sidebar/tokens.
- Page 02/Page 07 header pattern.
- `KpiMetadataCard` visual variant.
- `DataModeBadge`.
- `TimeRangeSelector` hoặc corrected `TimeFilterSegmented` presets.
- `MetricTrendChart`, `MetricBarChart`.
- Loading/Empty/Unavailable/Error states.
- Telemetry chart pure adapter pattern.

Nếu extend shared component, phải backward-compatible và có regression Page 02/Page 07.

---

## 13. Trình tự implementation cho Coding Agent

### Checkpoint 1 — Re-audit và source smoke check

1. Đọc authority docs.
2. Ghi branch/HEAD/dirty tree.
3. Verify current Page 03 placeholder và shared shell tokens.
4. Khi credential cho phép, read-only smoke:
   - full catalogue có Solar source hay không;
   - one explicit Solar range có raw temperature/humidity/lux hay empty;
   - record contract shape, không record secret/raw URL.
5. Không dùng smoke values làm fixtures.

### Checkpoint 2 — Freeze DTO/API và load bounds

1. Freeze source list, summary và selected-readings DTO.
2. Freeze max 20 sources, concurrency 2, summary `limit=1`/24h.
3. Preserve pending semantics/no units.
4. Add OpenAPI/contract tests.

### Checkpoint 3 — Backend adapter/calculator

1. Reuse catalogue and telemetry services.
2. Assert `solar` before fetch.
3. Implement bounded partial-tolerant summary in memory.
4. Implement selected-source readings mapper.
5. Prove zero persistence/TypeORM dependency.

### Checkpoint 4 — Deterministic demo domain

1. Add versioned CO₂/VOC fixture.
2. Derive KPI/heatmap/ranking/compliance from same fixture.
3. Add demo provenance and consistency tests.
4. Do not copy numbers/rooms/thresholds from mockup.

### Checkpoint 5 — Page 03 UI alignment

1. Replace old placeholder/page badge/divider.
2. Build aligned header and 6-card strip.
3. Build primary heatmap/ranking row.
4. Build secondary compliance/threshold row.
5. Add source picker and selected raw detail without changing macro-grid.
6. Apply per-widget DataMode/caveats.

### Checkpoint 6 — Responsive/accessibility

1. Keyboard floor pills, heatmap cells/table alternative, ranking and source picker.
2. Focus/aria-live for loading/partial/error.
3. Verify demo/live distinctions without relying on color.
4. Verify responsive matrix and no body overflow.

### Checkpoint 7 — Verification và handoff

1. Backend tests/build/e2e as relevant.
2. Frontend tests/lint/build/regression.
3. Browser visual QA at section 15 viewports.
4. Live/empty/partial/source-failure manual checks where possible.
5. Zero-database-write audit.
6. Create mandatory handoff in section 18.

---

## 14. Test matrix

### 14.1 Backend tests

- Routes GET-only and Building E-only.
- Source list returns only authoritative `solar` types.
- Catalogue activity never becomes online/offline.
- Floor mapping/fallback/caveat preserved; `G` remains controlled.
- Summary requires valid explicit range and caps duration at 24h.
- Summary max 20 sources, concurrency never exceeds 2, each request uses limit 1.
- Server resolves/asserts Solar before historical fetch.
- Valid zero contributes; null/non-finite ignored, not zero-filled.
- Mean/min/max and contributor counts correct per metric.
- Partial source failures preserve successes and sanitize failures.
- All-empty returns clean empty.
- Selected readings max 7d/limit1000 and preserve newest-first.
- Raw temperature/humidity/voltage/state remain raw/no unit/no enum.
- Lux/RSSI/SNR units correct where confirmed.
- Truncation/coverage/caveats visible.
- No database repository/entity/migration/write call.
- No token, upstream URL, raw stack/payload leak.

### 14.2 Demo fixture tests

- Fixture deterministic across reloads.
- No `Math.random()`.
- KPI, heatmap, ranking and compliance derive from same fixture.
- Floor filter changes only demo dataset.
- Demo IDs never sent to live endpoints.
- Mockup values/IDs are not copied as assertions.
- Demo threshold never feeds alert state/badge.

### 14.3 Frontend tests

- Page initial requests catalogue + one summary only; no browser N+1.
- Selected history only after explicit source selection.
- Same-origin client uses `cache: no-store` and AbortSignal.
- Range presets only 24h/72h/7d for live requests.
- No 30d/custom silent remap.
- Summary/raw/demo/unavailable states remain independent.
- Raw fields have no invented °C/%.
- IAQ score/PM2.5 remain unavailable.
- CO₂/VOC components visibly demo.
- No mixed live/demo aggregate.
- Heatmap accessible alternative present.
- Stale response cannot overwrite current source/range.
- Exactly seven routes and dual sidebar preserved.
- Page 02/Page 07 regression tests pass.
- No environment/report PostgreSQL code or migration referenced.

### 14.4 Interaction checks

- Active nav is “Môi trường (IAQ)”.
- Header search opens/focuses source picker.
- Range change aborts stale requests.
- Manual refresh only; no polling.
- Demo floor pills update heatmap/ranking/compliance consistently.
- Heatmap cell detail shows fixture provenance.
- Selected Solar detail shows raw metrics/coverage/caveats.
- Disabled threshold edit explains future phase.
- Long IDs and partial error messages do not overflow.

---

## 15. Visual QA viewports

- `1842 × 1222` full shell.
- `1778 × 1222` Dashboard workspace crop.
- `1440 × 900` desktop.
- `1280 × 800` compact desktop.
- `1024 × 768` tablet landscape.
- `390 × 844` mobile.

Visual checks:

- shared sidebars unchanged; Page 03 active;
- no old page badge/divider/top bar;
- header/actions match Page 02/Page 07 visual system;
- six KPI cards one row at reference desktop;
- primary row approximately 1.9:1;
- secondary row approximately 1:1;
- heatmap/ranking/compliance visually match mockup hierarchy without copied data;
- mixed data modes visible at widget level;
- raw-source detail does not push macro-layout out of alignment;
- no body horizontal overflow;
- palette/radius/border/typography consistent.

---

## 16. Acceptance criteria

Phase 05 chỉ hoàn tất khi:

1. Page 03 no longer renders the legacy placeholder layout.
2. Environment source-list, bounded summary and selected-readings APIs exist through NestJS and approved IoT services.
3. Summary calculations are request-scoped/in-memory, bounded to 20 sources/concurrency 2, and write nothing to PostgreSQL.
4. Solar temperature/humidity remain raw fields without invented units/room meaning/compliance.
5. CO₂/VOC room visuals use one deterministic versioned demo fixture with visible provenance.
6. IAQ score and PM2.5 remain honest unavailable states.
7. No room mapping is inferred from coordinates/device names.
8. No live/demo data is mixed into one aggregate or page-global badge.
9. Mockup macro-layout and current Dashboard visual system are preserved.
10. Exactly seven routes, dual sidebar, responsive/accessibility behavior do not regress.
11. No browser direct upstream, token leak, polling, browser N+1 or upstream mutation.
12. No PostgreSQL report schema/entity/migration/job/cache/persistence is introduced.
13. Backend/frontend tests, lint/build and proportional visual QA pass.
14. Mandatory handoff file exists with evidence.

---

## 17. Guardrails

- Không dùng mockup làm fixture hoặc expected production data.
- Không dùng `Math.random()`.
- Không label raw Solar fields as °C/% until contract confirms.
- Không gọi every Solar source a room IAQ sensor.
- Không suy rooms/floors từ coordinates/friendly names.
- Không implement IAQ formula/standards thresholds bằng assumption.
- Không mix demo CO₂ với live temperature/humidity.
- Không add 30-day/custom raw range.
- Không add PostgreSQL report persistence before Small Phase 21.
- Không add public refresh/rebuild endpoint.
- Không thêm chart library.
- Không làm yếu existing IoT type-routing/security/range rules.
- Không overwrite dirty-tree changes ngoài phase.

---

## 18. Handoff bắt buộc sau implementation

Sau khi implement và verify xong, Coding Agent **bắt buộc tạo**:

`web/doc/bp2_phase05_page03_environmental_metrics_handoff.md`

Handoff phải gồm tối thiểu:

- branch, HEAD, working-tree notes;
- file inventory;
- final Environment API routes/DTOs/OpenAPI;
- exact source filtering/type gate/range/load/concurrency rules;
- raw Solar field mapping và pending-semantics treatment;
- summary formula, contributor/partial behavior và evidence zero persistence;
- deterministic fixture ID/version and internal-consistency evidence;
- per-widget data-mode matrix;
- UI component architecture và mockup-difference table;
- evidence không copy mockup values/thresholds/rooms;
- automated tests, lint/build/e2e results;
- live smoke check hoặc lý do không chạy được;
- browser interaction/accessibility results;
- screenshot evidence tại section 15 viewports;
- no-secret/no-direct-upstream/no-persistence audit;
- open issues và next-phase notes.

> **Lệnh bàn giao cuối plan cho Coding Agent:** Implement đúng phạm vi `bp2_phase05_page03_environmental_metrics.md`, chỉ dùng bounded raw fetch + calculation in-memory cho live Solar data, giữ CO₂/VOC deterministic demo tách biệt và không thêm PostgreSQL report persistence; sau khi hoàn tất và verify, bắt buộc tạo `web/doc/bp2_phase05_page03_environmental_metrics_handoff.md` trước khi báo phase hoàn thành.
