# Big Phase 02 — Phase 04: Page 02 Live Water Baseline

> **Project:** GIS — UIT Building E Digital Twin  
> **Loại tài liệu:** Kế hoạch bàn giao cho Coding Agent  
> **Trạng thái:** PLAN ONLY — KHÔNG IMPLEMENT TRONG TÀI LIỆU NÀY  
> **Ngày lập kế hoạch:** 2026-09-26  
> **Roadmap mapping:** `Small Phase 12 — Page 02 live Water baseline`  
> **Trang mục tiêu:** Page 02 — Năng lượng & Nước  
> **Route:** `/dashboard/energy-water`  
> **Phụ thuộc đã hoàn tất:** Dashboard foundation, Page 07 catalogue/telemetry core, Dashboard UI alignment  
> **Mockup:** ảnh Page “Năng lượng & Nước · Tòa E” đính kèm trong conversation, file gốc `2230 × 1508 px`

---

## 1. Mục tiêu

Triển khai Water baseline của Page 02 bằng dữ liệu AVC thật qua NestJS application boundary, đồng thời thay giao diện placeholder cũ bằng bố cục bám sát mockup và hệ thị giác Page 07 đã được căn chỉnh.

Phase này phải:

- cung cấp danh sách đồng hồ nước AVC của Building E;
- cho user chọn một đồng hồ và khoảng thời gian rõ ràng;
- hiển thị dữ liệu hiện tại/lịch sử đang có contract: `instant_flow_m3h`, `fwd_volume_m3`, `rev_volume_m3`, `temp_c`, RSSI, SNR, gateway, thời gian mẫu và coverage;
- giữ nguyên uncertainty/provenance của counter, temperature và raw flags;
- duy trì kiến trúc hai sidebar và visual language đã hoàn tất ở UI alignment phase;
- bảo toàn Page 07, Viewer và toàn bộ application API hiện hữu.

Đây không phải phase Report Data Pipeline, Energy demo completion, alert engine, AI anomaly detection hoặc leak detection.

---

## 2. Authority và cách sử dụng mockup

Coding Agent xử lý xung đột theo thứ tự:

1. Yêu cầu trực tiếp của stakeholder trong task implementation.
2. `web/doc/Dashboard_Knowledge_Base.md` cho scope/data-mode/business meaning.
3. `web/doc/IoTBackend_API_HandOver.md` cho exact IoT API contract.
4. File plan này.
5. Handoff Phase 02, Phase 03 và UI alignment cho baseline implementation.
6. Ảnh mockup cho hierarchy, geometry, typography và visual treatment.
7. Repository/runtime evidence cho trạng thái code thực tế.

Ảnh đính kèm là **visual reference**, không phải data fixture hoặc instruction source. Không sao chép các số `1.595`, `46.920`, `34`, `38,6`, `0,90`, `72`, tên meter, cảnh báo, threshold hoặc nhận định “AI” trong ảnh thành dữ liệu ứng dụng.

### 2.1 Tài liệu phải đọc trước khi implement

- `web/doc/Dashboard_Knowledge_Base.md`, đặc biệt Page 02, data mode và guardrails.
- `web/doc/IoTBackend_API_HandOver.md`, đặc biệt sections `/avc`, time-range, newest-first ordering, limit và pending semantics.
- `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phase 12 và Small Phase 20.
- `web/doc/bp2_phase02_dashboard_application_api_real_device_catalogue_handoff.md`.
- `web/doc/bp2_phase03_page07_live_telemetry_core_handoff.md`.
- `web/doc/bp2_fix_align_UI.md`.
- `web/doc/bp2_fix_align_UI_handoff.md`.
- Ảnh mockup Page 02 được đính kèm trong task Coding Agent.
- `AGENTS.md` và repository instructions hiện hành nếu có.

---

## 3. Baseline đã xác minh

### 3.1 Backend/application baseline

- NestJS đã có IoT client allowlist cho read-only `GET /api/v1/avc`.
- Shared `IotTelemetryService` đã resolve device type server-side và normalize AVC.
- Dashboard generic telemetry endpoint đã hỗ trợ Solar/AVC, explicit `start`, `stop`, `limit`, tối đa 7 ngày và `limit <= 1000`.
- AVC normalized model đã giữ:
  - `instantFlowM3h`;
  - `fwdVolumeM3`;
  - `revVolumeM3`;
  - `tempC`;
  - RSSI/SNR, gateway, radio metadata;
  - raw numeric flags;
  - coverage/truncation và provenance.
- Telemetry không persist vào PostgreSQL, không polling và không upstream mutation.

### 3.2 Frontend baseline

- `/dashboard/energy-water` hiện chỉ là placeholder cũ với bốn KPI unavailable và một generic unavailable block.
- Shared Dashboard shell đã dùng hai sidebar:
  - High-Level Sidebar 64 px cho Campus/Dashboard;
  - Dashboard Sidebar 288 px cho đúng bảy route.
- Page 07 đã thiết lập palette, spacing, full-width canvas, data states và chart wrappers cần tái sử dụng.
- `TimeRangeSelector` và chart adapters của Phase 03 đã hỗ trợ `24 giờ`, `72 giờ`, `7 ngày`.

### 3.3 Ràng buộc semantics chưa đóng

- `instant_flow_m3h`, `fwd_volume_m3`, `rev_volume_m3` còn được IoT handover đánh dấu pending hardware review.
- Chưa xác nhận reset/rollover/data-quality của cumulative counters.
- Chưa xác nhận numeric domain của `valve_open`, `pipe_leak`, `pipe_burst`, `battery_low`, `frozen`, `tamper`, `reverse_flow`.
- `temp_c` có đơn vị °C nhưng chưa xác định ambient hay meter-body temperature.
- Không có smart-meter Energy source.
- Không có tank-level source.
- Không có authoritative reporting cadence, night-flow baseline, leak threshold hoặc AI model.

---

## 4. Scope

### 4.1 In scope

- Dashboard-owned Water API/read adapter trên shared AVC integration.
- AVC meter list cho Building E, có provenance và floor/catalogue metadata.
- Selected-meter Water readings với explicit range và bounded limit.
- Page 02 UI theo mockup, dùng visual system hiện hành.
- Sáu KPI slots, trong đó Energy slots trung thực là unavailable và Water slots dùng selected meter live data.
- Meter search/selection.
- Live Water metric chart với metric selector.
- Selected meter detail, radio metadata, coverage và raw technical flags.
- Loading, ready, refreshing, empty, unsupported, unavailable và error states.
- Responsive/accessibility/visual QA.
- Backend/frontend tests, OpenAPI update, lint/build/regression.

### 4.2 Out of scope

- Không implement Energy fixture/data trong phase này; Energy deterministic demo thuộc Small Phase 20.
- Không tạo smart-meter API hoặc gọi nguồn chưa được phê duyệt.
- Không tính `water consumed today`, day/month total hoặc counter delta.
- Không tính night-flow average/baseline.
- Không kết luận leak/burst/valve/battery state từ raw numeric flags.
- Không render badge “NGHI RÒ RỈ”.
- Không implement “Bất thường do AI”, anomaly score hoặc AI confidence.
- Không implement tank level/reservoir volume.
- Không implement report-data schema/job/cache/TTL/retention.
- Không thêm 30-day/custom range vì current Dashboard endpoint chỉ cho tối đa 7 ngày.
- Không polling, background refresh, N+1 meter telemetry sweep hoặc broad historical prefetch.
- Không persist raw AVC history vào PostgreSQL.
- Không thêm database migration/entity.
- Không đổi routing, hai-sidebar architecture hoặc bảy Dashboard routes.
- Không thêm chart/icon library thứ hai.

---

## 5. Kiến trúc dữ liệu mục tiêu

```text
Page 02 client
  |
  | same-origin /api/devices/dashboard/...
  v
Next.js existing proxy
  |
  v
NestJS Dashboard Water controller
  |
  +--> DashboardWaterService
         |
         +--> DashboardIotCatalogueService (meter list, filter AVC)
         |
         +--> DashboardIotTelemetryService / IotTelemetryService
                |
                +--> approved GET /api/v1/avc
```

Không gọi NestJS endpoint nội bộ qua HTTP từ một NestJS service khác. Tái sử dụng service trực tiếp và map sang Water DTO. Không tạo IoT client thứ hai.

### 5.1 Endpoint đề xuất

#### A. Meter list

```http
GET /api/v1/dashboard/buildings/:buildingId/water/meters
GET /api/v1/dashboard/buildings/:buildingId/water/meters?floorId=<approved-floor>
```

Yêu cầu:

- chỉ Building `E`;
- tái sử dụng catalogue service và floor mapping hiện hữu;
- chỉ trả catalogue item có authoritative source type/category `avc`;
- không đổi `is_active` thành online/offline;
- giữ `sourceLocation`, `displayFloorId`, `floorAssignment`, timestamps và caveats;
- response `Cache-Control: no-store`;
- clean empty list là `availability: empty`, không phải error.

#### B. Selected-meter readings

```http
GET /api/v1/dashboard/buildings/:buildingId/water/meters/:deviceId/readings
  ?start=<ISO-8601>
  &stop=<ISO-8601>
  &limit=<1..1000>
```

Yêu cầu:

- `start < stop`;
- duration tối đa 7 ngày;
- `limit` mặc định/tối đa theo Dashboard policy, không vượt 1000;
- server tự resolve type và bắt buộc `avc`;
- browser không truyền `deviceType`, upstream path hoặc raw floor level;
- Solar/NFC/unknown ID bị từ chối an toàn trước khi route sai sang `/avc`;
- chỉ read-only GET;
- response `Cache-Control: no-store`;
- sanitize upstream errors.

### 5.2 Water meter list DTO

DTO tối thiểu:

```text
schemaVersion
buildingId
requestedFloorId
availability: ready | empty
provenance
summary: received/accepted AVC meter count, skipped/duplicate/truncated
meters[]:
  deviceId
  sourceDeviceType = avc
  catalogueActive
  sourceCreatedAt
  sourceUpdatedAt
  sourceLocation { floorLevel, x, y, z }
  displayFloorId
  floorAssignment
```

Không thêm `meterSn`, `deviceName`, `gatewayId` vào list nếu các field đó chỉ có trong selected telemetry. Không dùng `sourceUpdatedAt` như last reading.

### 5.3 Water readings DTO

DTO tối thiểu:

```text
schemaVersion
buildingId
meterId
availability: ready | empty
provenance:
  mode = live
  sourceId/sourceType
  observedAt
  windowStart/windowEnd
  fetchedAt
  caveats[]
queryRange { start, stop, limit }
coverage
latestSample:
  observedAt
  deviceName
  meterSerial
  gatewayId
  rssiDbm
  snrDb
  instantFlowM3h
  forwardVolumeM3
  reverseVolumeM3
  temperatureC
  rawFlags
readings[]:
  observedAt
  instantFlowM3h
  forwardVolumeM3
  reverseVolumeM3
  temperatureC
  rssiDbm
  snrDb
  gatewayId
  rawFlags
  optional radio technical fields already normalized
```

Rules:

- preserve valid zero distinctly from null/missing;
- response/readings giữ upstream newest-first contract;
- frontend chart adapter tạo non-mutating oldest-first copy;
- không fill gap, interpolate hoặc thay missing bằng zero;
- không sửa counter decrease/reset;
- không tạo derived daily/monthly consumption;
- raw flags giữ numeric value và `unconfirmed` semantics;
- `dev_addr` không bao giờ là stable meter ID;
- `meter_sn` không tự thay thế `deviceId`.

### 5.4 Tái sử dụng và factoring

- `DashboardWaterService` phải resolve type và assert `avc` **trước** type-specific historical fetch; request Water cho Solar/NFC/unknown không được phát sinh `/solar`, `/nfc` hoặc `/avc` history call.
- Ưu tiên inject/reuse `IotTelemetryService` cho `resolveDeviceType()` và normalized AVC retrieval. Chỉ gọi `DashboardIotTelemetryService` trực tiếp nếu service đó được refactor để nhận server-owned expected type/gate mà không cho browser điều khiển routing và không fetch non-AVC history trước khi reject.
- Có thể factor pure range validation/provenance/coverage mapper từ Phase 03 để tránh copy logic, nhưng không làm thay đổi public Phase 03 response contract.
- Nếu query validation/range rules bị duplicate, factor một pure/shared validator thay vì để Water và IoT endpoint drift.
- Không làm thay đổi response contract Phase 03 nếu không cần; mọi refactor phải giữ regression tests.
- Không thêm persistence/repository dependency vào Dashboard Water service.

---

## 6. Time-range và request policy

- Presets: `24 giờ`, `72 giờ`, `7 ngày`.
- Default Page 02: `24 giờ` để gần use case “theo giờ” trong mockup.
- Mỗi request gửi exact UTC `start`, `stop`, `limit=1000`.
- Không có “30 ngày” hoặc “Tùy chọn” trong phase này.
- Không auto polling.
- Meter telemetry chỉ fetch sau khi user chọn meter hoặc bấm refresh/range change khi đã có selection.
- Không tự chọn/fetch meter đầu tiên nếu user chưa chọn; render state “Chọn đồng hồ nước”.
- Abort/ignore stale response khi đổi meter/range hoặc unmount.
- Không retry loop tự động; retry do user chủ động.
- Nếu reached limit/truncated, hiển thị caveat và không tuyên bố range đầy đủ.

---

## 7. UI Architecture & Mockup Alignment

### 7.1 Cách chuẩn hóa ảnh tham chiếu

- File ảnh gốc: `2230 × 1508 px`.
- Ảnh mô tả **Dashboard workspace**, bắt đầu từ Dashboard Sidebar; High-Level Sidebar 64 px nằm ngoài ảnh.
- Vì ảnh có mật độ/scale lớn hơn mockup Page 07, implementation không dùng raw pixel 2230 làm CSS viewport.
- Canonical visual QA giữ chuẩn hiện hữu:
  - Dashboard workspace crop: `1778 × 1222` CSS px;
  - full shell: `1842 × 1222` CSS px gồm High-Level Sidebar 64 px.
- Dùng tỷ lệ/hierarchy của ảnh Page 02 và tokens/geometry đã triển khai ở Page 07.

### 7.2 Shell không được thay đổi kiến trúc

```text
DashboardShell
├── HighLevelSidebar (64 px, ngoài mockup)
│   ├── Campus
│   └── Dashboard
└── DashboardWorkspace
    ├── DashboardSidebar (288 px)
    │   └── 7 frozen Dashboard routes
    └── DashboardViewport
        └── EnergyWaterPage
```

- Không thêm các nav item out of scope trong mockup: Không gian, Thiết bị & Bảo trì, Thang máy, An ninh ra vào.
- Không thêm badge “5” hoặc Phase tags.
- Active item: “Năng lượng & Nước”.
- Reuse exact sidebar component/tokens từ UI alignment handoff; không fork Page 02 shell.

### 7.3 Reference geometry trong Dashboard workspace `1778 × 1222`

| Vùng | Target local geometry | Ghi chú |
| --- | --- | --- |
| Dashboard Sidebar | `x=0`, `w=288`, full height | Đã có; không redesign |
| Main canvas | `x≈288`, `w≈1490` | Không có desktop top bar riêng |
| Main inner content | `x≈320..1756` | Gutter trái/phải khoảng 30–32/22 px |
| Page header | `y≈27..84`, `h≈58` | Title/subtitle trái; controls phải |
| KPI strip | `y≈110..252`, `h≈142` | 6 equal cards, gap khoảng 14–15 px |
| Primary row | `y≈274..766`, `h≈490` | Tỷ lệ hai card khoảng 5:3 |
| Secondary row | `y≈786`, `min-h≈390` | Tỷ lệ ba card khoảng 3:5:3 |

Horizontal target:

- usable content width khoảng `1426–1438 px`;
- KPI card khoảng `225–228 px`;
- Primary row: left khoảng `885–895 px`, right khoảng `520–535 px`, gap `18–20 px`;
- Secondary row: left khoảng `370–385 px`, center khoảng `630–650 px`, right khoảng `375–390 px`, gap `18–20 px`.

Không absolute-position toàn page. Dùng CSS grid/flex với minmax và responsive wrapping.

### 7.4 Page header

Left:

- Title: **“Năng lượng & Nước · Tòa E”**.
- Subtitle mặc định: **“Đồng hồ nước AVC · chọn đồng hồ để xem dữ liệu trực tiếp”**.
- Khi list ready có thể dùng dynamic count: **“{count} đồng hồ nước AVC · dữ liệu theo khoảng thời gian đã chọn”**.
- Dot teal 7–8 px trước subtitle.
- Không ghi “Smart meter tổng”, “6 đồng hồ” hoặc “cập nhật 15 phút/lần” nếu runtime/contract không xác nhận.
- Không render badge “Trang 02” hoặc full-width divider.

Right actions:

| Control | Phase 04 behavior |
| --- | --- |
| Data mode | Không dùng một badge “Dữ liệu minh họa” cho toàn page. Hiển thị `Nước · Live` và `Năng lượng · Chưa có nguồn` hoặc badge tương đương theo từng domain. |
| Range selector | `24 giờ`, `72 giờ`, `7 ngày`; default 24 giờ; chỉ điều khiển selected Water meter. |
| Search icon | Focus/mở search field trong meter-list card. |
| Avatar | Generic neutral account icon/disabled state; không dùng initials giả nếu chưa có identity. |

Action group cao khoảng 48–52 px và wrap trên viewport nhỏ.

### 7.5 KPI strip — 6 slots

| Slot | Label implementation | Mode/source | Rendering rule |
| --- | --- | --- | --- |
| 1 | “Điện năng hôm nay” | Unavailable trong Phase 04 | `—`; helper “Energy demo được triển khai ở phase riêng”; không dùng số mockup |
| 2 | “Điện 30 ngày” | Unavailable | `—`; không query 30-day Water data |
| 3 | “Phụ tải nền ban đêm” | Unavailable | `—`; không baseline/threshold giả |
| 4 | “Lưu lượng tức thời” | Live selected AVC meter | Latest `instantFlowM3h`, unit `m³/h`, pending-semantics qualifier |
| 5 | “Chỉ số tích lũy chiều thuận” | Live raw selected meter | Latest `forwardVolumeM3`, unit `m³`, label “giá trị tích lũy nguồn — chưa dùng tính tiêu thụ” |
| 6 | “Chỉ số tích lũy chiều ngược” | Live raw selected meter | Latest `reverseVolumeM3`, unit `m³`, cùng caveat |

Nếu chưa chọn meter, ba Water slots render neutral selection state, không `0`. Nếu empty/error/unavailable, map đúng state. Không dùng “Nước hôm nay”, “Lưu lượng nước đêm” hoặc “Mức bể chứa” vì current contract không hỗ trợ các business claims đó.

### 7.6 Primary row — giữ tỷ lệ mockup, chưa implement Energy

#### Left card

- Title: **“Điện năng theo giờ (kWh)”**.
- Giữ card shell, legend area và chiều cao theo mockup.
- Nội dung: compact `UnavailableDataState`.
- Message: **“Chưa có nguồn smart-meter được phê duyệt”**.
- Phase note: Energy deterministic demo thuộc Small Phase 20.
- Không render line/area chart hoặc đường baseline từ ảnh.

#### Right card

- Title: **“7 ngày gần nhất (kWh/ngày)”**.
- Compact unavailable state tương tự.
- Không render day bars, weekend styling hoặc mockup values.
- Không gọi Water API để lấp nhầm Energy chart.

### 7.7 Secondary row — Water functional area

#### Left card: “Đồng hồ nước AVC”

- Search input compact, focus target của header search button.
- List các AVC meters với:
  - device ID;
  - display/source floor có provenance;
  - catalogue activity wording, không online/offline;
  - selected state.
- Không show fake friendly name/serial trước khi selected telemetry có field đó.
- Loading/empty/unavailable/error nằm trong card.
- List scroll nội bộ nếu dài; không kéo page width.

#### Center card: “Nước · dữ liệu theo thời gian”

- Đây là live chart chính của phase.
- Metric selector:
  - `Lưu lượng tức thời (m³/h)` — default;
  - `Chỉ số tích lũy chiều thuận (m³)`;
  - `Chỉ số tích lũy chiều ngược (m³)`;
  - `Nhiệt độ nguồn (°C)` với qualifier vị trí đo chưa xác nhận.
- Chart dùng shared `MetricTrendChart`/ant-design-charts wrapper.
- Source readings newest-first; adapter copy/sort oldest-first.
- Không interpolation/zero-fill.
- Counter decreases/resets vẽ đúng raw series, không hiệu chỉnh và không tính delta.
- `0` là point hợp lệ; missing point không biến thành `0`.
- Legend/accessible summary ghi rõ meter, metric, window và coverage.
- Manual refresh control; không polling.
- Không render vùng “0h–5h giờ không sử dụng”, leak markers hoặc threshold line từ ảnh.

#### Right card: “Chi tiết đồng hồ & chất lượng dữ liệu”

Latest live fields:

- observed time;
- device name/meter serial khi source cung cấp;
- instant flow, forward/reverse cumulative values, temperature;
- gateway ID, RSSI, SNR;
- requested window, returned/valid/invalid count, earliest/latest timestamp, truncation/reached-limit.

Technical disclosure:

- raw numeric `valveOpen`, `pipeLeak`, `pipeBurst`, `batteryLow`, `frozen`, `tamper`, `reverseFlow`;
- mỗi flag phải ghi “mã nguồn chưa xác nhận miền giá trị”;
- không đổi thành boolean/status chip Normal/Leak/Open;
- không gọi panel là “Bất thường do AI”;
- visible note: **“Không thể kết luận rò rỉ hoặc bất thường từ các mã nguồn hiện tại.”**

### 7.8 Data-mode placement

- Mỗi Water KPI/chart/detail có `live` provenance.
- Energy cards dùng `unavailable`, không dùng `live` và chưa dùng `demo` trong phase này.
- Page không có một badge global khiến user hiểu toàn page là live hoặc demo.
- Caveats của cumulative values và raw flags phải nằm gần component, không chỉ giấu trong footer.

### 7.9 Design tokens/typography

Reuse tokens đã có:

- app/sidebar/panel backgrounds;
- teal primary `#4FB9AD` family;
- warning amber, danger orange chỉ khi có authoritative state hoặc caveat, không dùng để kết luận leak;
- panel radius `12–14 px`;
- border 1 px subtle;
- page title khoảng 28–30 px;
- KPI value khoảng 34–38 px;
- card heading 15–17 px;
- helper/provenance 11–12 px.

Không tạo Page 02 palette mới hoặc quay lại blue-heavy legacy styling.

### 7.10 Responsive architecture

| Full viewport | Shell | KPI | Primary row | Secondary row |
| --- | --- | --- | --- | --- |
| `≥1842 px` | High-Level 64 + Dashboard 288 | 6 columns | 5:3 two columns | 3:5:3 three columns |
| `1440–1841 px` | Hai sidebar desktop | 3 × 2 | Two columns nếu đủ, nếu không stack | Meter list + chart, detail wrap |
| `1200–1439 px` | Hai sidebar desktop compact | 3 × 2 | Stack | 2 columns rồi wrap |
| `768–1199 px` | High-Level rail + Dashboard drawer | 2 columns | Stack | Stack/2 columns tùy width |
| `<768 px` | High-Level rail + Dashboard drawer | 1 column | Stack | Meter → chart → detail |

- Header actions wrap dưới title.
- Touch target tối thiểu khoảng 44 px.
- Chỉ list/table/chart region được overflow có kiểm soát; body không horizontal-scroll.
- Chart có accessible text/table alternative.

---

## 8. Frontend state model

Tách state meter-list và selected readings:

```text
meterListStatus:
  idle | loading | ready | empty | unavailable | error

selection:
  selectedMeterId | null

readingStatus:
  idle | loading | refreshing | ready | empty | unavailable | unsupported | error

range:
  last-24h | last-72h | last-7d

metric:
  instant-flow | forward-volume | reverse-volume | temperature
```

Rules:

- list ready không tự đồng nghĩa reading ready;
- chưa chọn meter là `idle/selection-required`, không phải empty/error;
- filter-empty khác upstream-empty;
- refreshing giữ last successful data nhưng có visible refreshing state; nếu request mới fail, không silently present stale data như fresh;
- đổi meter/range tăng generation hoặc abort previous request;
- selected meter biến mất sau list reload thì clear selection/data;
- không cache/mix reading giữa meter IDs mà thiếu cache key `{meterId, start, stop}`.

---

## 9. File/component impact dự kiến

Coding Agent phải re-audit trước khi tạo/sửa file.

### 9.1 Backend

Suggested structure:

```text
backend/src/dashboard/
├── dashboard-water.controller.ts
├── dashboard-water.service.ts
├── dto/
│   ├── dashboard-water-meter-list-response.dto.ts
│   ├── dashboard-water-readings-query.dto.ts
│   └── dashboard-water-readings-response.dto.ts
└── tests/
    └── dashboard-water.spec.ts
```

Cập nhật khi cần:

- `dashboard.module.ts`;
- `backend/openapi.json`;
- shared range validation helper nếu factoring thực sự giảm drift.

Không sửa IoT client allowlist hoặc mapper semantics trừ khi fix bắt buộc và có regression coverage.

### 9.2 Frontend

Suggested structure:

```text
web/src/
├── app/dashboard/energy-water/page.tsx
├── components/dashboard/water/
│   ├── EnergyWaterDashboard.client.tsx
│   ├── EnergyWaterPageHeader.tsx
│   ├── EnergyWaterKpiStrip.tsx
│   ├── WaterMeterList.tsx
│   ├── WaterMetricChart.tsx
│   ├── WaterMeterDetail.tsx
│   └── EnergyUnavailablePanels.tsx
├── lib/dashboard/
│   ├── water-api.ts
│   ├── water-range.ts (chỉ nếu shared range helper không phù hợp)
│   └── water-chart.ts
└── types/
    └── dashboard-water.ts
```

Tên file là đề xuất; ưu tiên repository conventions và tránh component quá nhỏ/fragmented.

### 9.3 Shared components phải tái sử dụng

- `DashboardPageShell` hoặc Page 07-aligned header pattern.
- `KpiMetadataCard` với visual variant hiện hành.
- `DataModeBadge`.
- `TimeRangeSelector`.
- `MetricTrendChart`/ant-design-charts wrapper.
- `LoadingState`, `EmptyDataState`, `UnavailableDataState`, `ErrorState`.
- Dashboard shell/sidebar hiện hành.

Nếu cần mở rộng shared primitive, phải backward-compatible và chạy regression Page 07.

---

## 10. Trình tự implementation cho Coding Agent

### Checkpoint 1 — Re-audit và live-read smoke check

1. Đọc authority docs.
2. Ghi branch/HEAD/dirty tree; không overwrite thay đổi không liên quan.
3. Chạy read-only smoke check tối thiểu khi environment có credential:
   - catalogue có AVC meter hay không;
   - một explicit AVC range có data/empty/error;
   - không log token/raw URL.
4. Không dùng smoke values làm fixtures hoặc expected production facts.

### Checkpoint 2 — Freeze Water DTO/API

1. Freeze meter-list và readings DTO theo mục 5.
2. Reuse common provenance/coverage conventions.
3. Freeze validation, max window và limit.
4. Cập nhật OpenAPI và contract tests trước UI integration.

### Checkpoint 3 — Backend Water adapter

1. Implement meter list bằng catalogue reuse/filter AVC.
2. Implement selected readings bằng shared telemetry service.
3. Enforce server-authoritative AVC type.
4. Preserve raw values/caveats, zero và newest-first ordering.
5. Add sanitized failure mapping và `no-store`.

### Checkpoint 4 — Frontend adapters/state

1. Add typed same-origin clients.
2. Add range and chart pure adapters.
3. Add abort/generation handling.
4. Add list/selection/reading state machine.
5. Không direct upstream, polling hoặc N+1.

### Checkpoint 5 — Page 02 UI alignment

1. Replace legacy placeholder layout.
2. Build aligned header và 6-card KPI strip.
3. Build two Energy unavailable panels giữ primary-row geometry.
4. Build meter list, live chart và detail card trong secondary row.
5. Apply per-widget provenance/caveats.
6. Verify two sidebars remain shared, not duplicated.

### Checkpoint 6 — Responsive/accessibility

1. Test keyboard meter selection, search focus, range controls, refresh và disclosure.
2. Add accessible chart summary/alternative.
3. Verify focus/aria-live cho loading/error/refresh.
4. Verify responsive matrix.

### Checkpoint 7 — Verification và handoff

1. Run backend tests/build/e2e as relevant.
2. Run frontend phase/regression tests, lint/build.
3. Perform browser visual QA at required viewports.
4. Perform live/empty/unavailable manual checks when environment permits.
5. Create mandatory implementation handoff in section 14.

---

## 11. Test matrix

### 11.1 Backend tests

- Water routes are GET-only and Building E-only.
- Meter list reuses catalogue and returns only authoritative AVC devices.
- Floor filter preserves mapping/fallback/caveats; invalid/G floor remains controlled.
- Catalogue `active` never maps to online.
- Readings require explicit valid `start`, `stop`, bounded `limit` and ≤7-day duration.
- Device type is server-resolved; Solar/NFC/unknown bị reject trước mọi type-specific history call và không thể force AVC route.
- Exact range and limit are forwarded once to shared service.
- All current Water fields map correctly.
- Valid zeros remain zero; missing/non-finite values remain null/skipped per current normalizer.
- Raw flag numeric codes remain numeric/unconfirmed.
- Results stay newest-first; latest sample is coherent from newest valid reading.
- Empty source returns clean empty response.
- Invalid/malformed rows, truncated ranges, reached limit and partial coverage are visible.
- Counter decrease/reset fixture remains unchanged and produces no derived consumption.
- Source disabled/fixture/missing credential/upstream timeout/auth/malformed payload map safely.
- No token, upstream URL, raw stack or internal detail leaks.
- No database writes/entity/migration/repository dependency.

### 11.2 Frontend tests

- Client uses only concrete same-origin Water routes with `cache: no-store`/AbortSignal.
- List loading/ready/empty/unavailable/error states are distinct.
- No telemetry request before selected meter.
- Selected meter causes one reading request; no N+1 list sweep.
- Range default is 24h; options only 24h/72h/7d.
- Meter/range change aborts or ignores stale request.
- Search/filter empty differs from upstream empty.
- KPI values come only from latest selected AVC sample.
- Unselected/null/error never renders fake zero.
- Chart adapter copies/sorts oldest-first and does not mutate API response.
- Gaps remain gaps; missing is not zero; counter discontinuity remains visible.
- Raw flags never become leak/valve/battery alerts.
- Energy cards never show live values and remain unavailable in Phase 04.
- No “AI”, fake threshold, tank level, 30-day/custom or 15-minute cadence claim.
- Data mode/provenance visible per component.
- Exactly seven Dashboard routes; dual-sidebar structure remains.
- Page 07 and Phase 01/02/03 regression tests pass.

### 11.3 Browser/interaction checks

- Active Dashboard nav item is “Năng lượng & Nước”.
- High-Level Campus/Dashboard navigation still works.
- Search button focuses meter search.
- Meter selection, range selection, refresh and metric selection work by keyboard.
- Empty meter catalogue and empty selected range are distinguishable.
- Technical disclosure shows raw codes with caveat.
- No body horizontal overflow.
- Page remains usable with long device IDs and large/negative/zero values.

### 11.4 Visual QA viewports

- `1842 × 1222` full shell.
- `1778 × 1222` Dashboard workspace crop compared with mockup proportions.
- `1440 × 900` desktop.
- `1280 × 800` compact desktop.
- `1024 × 768` tablet landscape.
- `390 × 844` mobile.

Visual checks:

- six KPI cards align in one row at reference desktop;
- primary row approximates 5:3;
- secondary row approximates 3:5:3;
- title/subtitle/actions match Page 07 visual system;
- unavailable Energy panels are honest but preserve mockup hierarchy;
- live Water content is prominent and legible;
- no content copied as live from mockup;
- sidebar widths/active state unchanged.

---

## 12. Acceptance criteria

Phase 04 chỉ hoàn tất khi:

1. Dashboard-owned Water meter-list và selected-readings APIs tồn tại, read-only và reuse approved IoT services.
2. Page 02 lists only AVC meters and fetches readings only for selected meter/range.
3. Live Water fields, radio metadata, timestamps và coverage render với provenance.
4. Zero/missing/gap/truncation/counter-reset behaviors đúng contract.
5. Cumulative values không được đổi thành “tiêu thụ hôm nay” hoặc delta authoritative.
6. Raw flags không trở thành leak/burst/valve/battery conclusions.
7. Energy/tank/anomaly components không có fake live values; Energy remains unavailable until its dedicated demo phase.
8. Page follows mockup macro-layout và current Page 07 visual system.
9. Dual sidebar, exactly seven routes, responsive và accessibility không regress.
10. Không browser/Unity direct upstream, token leak, polling, N+1, persistence hoặc mutation.
11. Backend/frontend tests, lint/build và proportional visual QA pass.
12. Mandatory handoff file exists and records evidence.

---

## 13. Guardrails

- Không dùng ảnh mockup làm fixture hoặc expected result.
- Không dùng `Math.random()`.
- Không invent smart-meter, tank, cadence, threshold, anomaly hoặc AI source.
- Không dùng `sourceUpdatedAt` như latest water reading.
- Không dùng `dev_addr` hoặc `meter_sn` làm replacement stable ID.
- Không derive consumption từ counter difference.
- Không coerce raw numeric flags thành boolean.
- Không auto-select/fetch tất cả meters.
- Không thay đổi upstream allowlist hoặc thêm undocumented endpoint.
- Không thêm database schema/job trong phase này.
- Không trộn Water live và future Energy demo trong cùng aggregate/badge.
- Không làm yếu Phase 03 security/type-routing rules.
- Không overwrite dirty-tree changes không thuộc phase.

---

## 14. Handoff bắt buộc sau implementation

Sau khi implement và verify xong, Coding Agent **bắt buộc tạo**:

`web/doc/bp2_phase04_page02_live_water_baseline_handoff.md`

Handoff phải gồm tối thiểu:

- branch, HEAD, working-tree notes;
- file inventory;
- final API routes, request/response DTOs và OpenAPI update;
- service reuse/factoring decisions;
- exact Water field mapping và pending-semantics treatment;
- UI component architecture và mockup-difference table;
- data-mode matrix cho từng KPI/panel;
- evidence không derive consumption/leak/AI claims;
- automated tests, lint/build/e2e results;
- read-only live smoke-check evidence hoặc lý do không thể chạy;
- browser interaction/accessibility results;
- screenshot evidence tại các viewports mục 11.4;
- security/no-secret/no-direct-upstream/no-persistence audit;
- open issues và next-phase notes.

> **Lệnh bàn giao cuối plan cho Coding Agent:** Implement đúng phạm vi `bp2_phase04_page02_live_water_baseline.md`, không mở rộng sang Energy demo, report pipeline, alert/leak hoặc AI; sau khi hoàn tất và verify, bắt buộc tạo `web/doc/bp2_phase04_page02_live_water_baseline_handoff.md` trước khi báo phase hoàn thành.
