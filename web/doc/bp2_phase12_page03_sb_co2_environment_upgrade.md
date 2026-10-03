# Big Phase 02 — Phase 12 / Small Phase 25: Page 03 SB CO₂ & Environmental Source Upgrade

> **Project:** GIS — UIT Building E Digital Twin  
> **Document ID:** `BP2-P12-SP25-ENVIRONMENT-SB-CO2`  
> **Ngày regenerate:** 2026-10-03, Asia/Ho_Chi_Minh  
> **Trạng thái:** MANDATORY BRANCH DELIVERED — có matching implementation handoff; body dưới đây giữ original implementation scope  
> **Stable backlog ID:** Small Phase **25**; `phase12` là số detailed implementation plan, không phải Small Phase 12  
> **Trang chính:** Page 03 — Môi trường (IAQ), `/dashboard/environment`  
> **Dependency:** Small Phases 23–24 đã hoàn thành; không implement lại catalogue hoặc raw SB/Smoke bridge  
> **Matching handoff bắt buộc:** `web/doc/bp2_phase12_page03_sb_co2_environment_upgrade_handoff.md`

---

**Scope reconciliation — 2026-10-03:** mandatory Solar/SB source/CO₂ branch đã được coding agent bàn giao trong matching handoff; không implement lại tasks đó. Latest ranking/floor-compliance/default-config decisions được mô tả trong [Small Phase 25 supplemental plan](bp2_phase12_page03_derived_ranking_floor_compliance_supplement.md), trạng thái **PLAN ONLY — CHƯA IMPLEMENT supplement**. Plan bổ sung supersede việc giữ hai widgets ranking/compliance demo và grid-binding gate áp cho chúng; heatmap/Overview grid và authoritative Alerts vẫn có gates riêng. Read-only defaults1000ppm/27°C/70%, temporal three-metric floor means, gaps fail và wholly no-data floor`—` là scope mới; editing/persistence vẫn ở Phase21. Không sửa historical handoff hoặc coi supplemental tasks đã hoàn thành từ handoff gốc.

## 1. Authority và quyết định bắt buộc

Đây là tài liệu bàn giao tasks cho coding agent. Lần regenerate này chỉ tạo/cập nhật tài liệu; không sửa application code, gọi live upstream, tạo tài khoản hoặc chạy migration.

Coding agent đọc trước:

1. `web/doc/Dashboard_Knowledge_Base.md`, đặc biệt §§3–7, 9.2–9.5, authorization và decision log.
2. `web/doc/IoTBackend_API_HandOver.md`, đặc biệt identity, bounded queries, §3.6 và §§31.1–31.7.
3. `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phase 25 và remaining execution order.
4. `web/doc/bp2_phase05_page03_environmental_metrics.md` và matching handoff cho baseline Page 03.
5. `web/doc/bp2_phase10_page07_device_catalogue_contract_upgrade_handoff.md` và `web/doc/bp2_phase11_page07_sb_smoke_raw_telemetry_handoff.md` cho foundations đã delivered.
6. `web/doc/bp2_fix_align_UI.md`, matching handoff và `web/doc/bp2_fix_page07_render_loop_paged_telemetry_handoff.md` để bảo vệ UI/cadence hiện tại.
7. Applicable `AGENTS.md`; trước khi viết Next.js code, đọc relevant guides trong `web/node_modules/next/dist/docs/` theo `web/AGENTS.md`.

Latest explicit stakeholder decisions thắng các baseline/handoff cũ:

- **Đơn vị đo:** nếu chưa technical-confirmed, tạm dùng đơn vị tiêu chuẩn của metric; stakeholder sẽ xác nhận với đội kỹ thuật sau. CO₂ dùng **ppm**, identity numeric mapping: `co2=596` → `596 ppm`. Không chặn CO₂ live/derived chỉ vì đang chờ unit review. Record assumption/version, không gọi assumption là hardware confirmation.
- **IAQ refresh:** stakeholder đã **rút yêu cầu refresh 5 phút** sau source audit. **Giữ cơ chế fetch IAQ hiện tại**, không thêm timer/polling, background retry hoặc refactor callback/state chỉ để thay đổi refresh. Yêu cầu 5 phút chỉ thuộc Page 07 hotfix riêng.
- **Completed-page protection:** stakeholder đã sửa text/labels. **Không quay lại các page đã implement (Overview, Water/Energy, IAQ, Alerts, IoT, Parking…) để sửa text, đổi label, restyle hoặc refactor không cần thiết.** Chỉ thay đúng source/metric/unit/provenance presentation cần cho phase này, hoặc evidenced blocking bug; giải thích mọi exception trong handoff. Không sửa page khác để làm xanh obsolete tests.
- PostgreSQL report/alert persistence vẫn deferred đến Small Phase **21**, phase implementation cuối trước acceptance 22. Small Phase 25 dùng bounded raw reads + NestJS request-scoped calculations, không schema/entity/migration/job mới.
- Reuse hai roles Viewer/Manager và existing application accounts. Đây là read-only phase cho cả hai roles; không tạo/reset account, không cấp thêm quyền sửa/xóa vị trí thiết bị hoặc mở AlertConfig editor.

## 2. Baseline đã kiểm tra và giới hạn bằng chứng

Source audit ngày 2026-10-03; không phải browser/network verification hoặc live API execution của planner. Historical handoff test results không được ghi lại thành test results mới của phase này.

| Boundary | Current source fact | Task cần làm |
| --- | --- | --- |
| Shared IoT client/normalization | `IotTelemetryService` đã dispatch `sb`, normalize `rawCo2`, `rawVoc`, voltage/light/radio và optional source count/truncation | Reuse, không thêm client `/sb` thứ hai hoặc đổi raw semantics của Page 07 |
| Environment service | `DashboardEnvironmentService` lọc Solar, ép type `solar` ở selected readings và cast Solar trong summary | Thêm typed SB branch tại Environment boundary |
| Source metadata | Catalogue đã có nullable `sourceLocation.roomId`; Environment service chưa copy field này ra source items | Additive propagation; không đoán phòng từ EUI/coordinates/display floor |
| Summary | Mean/min/max của latest Solar samples; max 20 sources, concurrency 2, `limit=1`, window max 24h | Thêm CO₂ metric-specific summary và coverage; giữ total load cap |
| Environment types/chart | `dashboard-environment.ts` và `environment-chart.ts` chỉ có Solar metrics | Extend union/capabilities và CO₂ chart adapter; không tạo phantom SB temperature/humidity |
| KPI | CO₂ còn lấy `CO2_DEMO_FIXTURE`; temperature/humidity JSX đã hiển thị °C/% dù backend metadata/helper còn pending | Thay CO₂ KPI bằng real-source derived summary; reconcile unit metadata/helper tối thiểu, giữ label stakeholder |
| Room/business widgets | Heatmap, ranking, compliance dùng deterministic demo fixture; IAQ score/PM2.5 unavailable | Chỉ migrate room branches khi own gates đủ; không suy score/compliance/alerts từ ppm |
| Overview grid | `overview-grid-fixtures.ts` / `getCellCo2State` dùng `roomDemoId` và demo CO₂ | Không coi fixture room/cell là verified live mapping; default no-touch Page 01 |
| IAQ fetch lifecycle | Mount loads sources/summary; selected source/preset loads detail; button invokes manual refresh. Stable callbacks; no poll timer/feedback loop found | Preserve trigger ownership/cadence, không copy Page 07 scheduler vào IAQ |
| Proxy/auth | Existing `/api/devices/dashboard/.../environment/...` paths và session/CASL reads đã có | Reuse existing GET paths/guards; không mở broad proxy allowlist |

Owner-provided `/sb` screenshot đã xác nhận một populated row cho `dev_eui=70B3D57ED006D366`, network name `sb-dev2`, timestamp `2026-10-02T09:24:08.629Z`, CO₂ `596`, VOC `94`, voltage `4.35`, visible `32`, IR `17`, RSSI `-22`, SNR `9.25`. Đây là source evidence do owner cung cấp, **không chứng minh dữ liệu vẫn fresh, toàn fleet có coverage, thiết bị thuộc phòng nào hoặc calibration đã đạt**. Không hard-code row này vào production fallback.

## 3. Deliverable và scope

### 3.1 Mandatory delivery — không chờ room mapping

- Page IAQ chọn và đọc được cả nguồn `solar` và `sb` qua existing NestJS boundary.
- SB selected detail có latest CO₂ và CO₂ history chart, dùng ppm theo assumption; giữ raw values, source identity/time, coverage và unit metadata.
- CO₂ KPI dùng mean/min/max của latest finite CO₂ samples từ contributing SB devices trong bounded summary window. Đây là **derived latest-sample population summary**, không phải time-weighted daily average hoặc toàn tòa nhà khi coverage thiếu.
- Solar temperature/humidity/lux metadata nhất quán với current API units; không sửa lại các headline labels/°C/% stakeholder đã chỉnh đúng.
- Explicit source-floor-room-to-cell mapping boundary và typed unresolved states có tests; không cần production room mapping để deliver device-level CO₂.
- Preserve IAQ refresh, completed UI, Viewer/Manager permissions và zero new telemetry/report persistence.

### 3.2 Conditional delivery

Page 03 room ranking/heatmap và Page 01 CO₂ cell detail chỉ được chuyển live khi có actual room assignment + verified stable room/cell mapping + query coverage/selection rules theo §6. Room identity metadata đơn lẻ hoặc demo fixture không đóng gate.

Nếu gates chưa đủ: deliver mandatory branch, giữ các room widgets demo rõ provenance, đưa missing gates vào handoff. Không ghi toàn bộ phase là blocked do thiếu room mapping; cũng không ghi conditional live migration đã hoàn thành.

### 3.3 Out of scope

- Auto refresh 5 phút, Page 07 scheduler/cache/paging changes, global fetch/shell refactor.
- IAQ score algorithm, authoritative compliance %, thresholds/duration/alert evaluator, rule editing, notification delivery hoặc menu badge.
- Live fleet VOC concentration/trend KPI migration; VOC card demo hiện tại không bị relabel thành measurement thật.
- Pressure/PM2.5 fields không có source; SB temperature/humidity không có trong documented payload.
- Detector/fire state interpretation, webhook operations, PCCC CRUD, Energy demo completion.
- New PostgreSQL persistence, mapping editor/CRUD, Unity/BIM geometry, coordinate transforms hoặc new routes.

## 4. API và typed data contract

### 4.1 Reuse existing routes

| Existing NestJS GET | Phase 25 behavior |
| --- | --- |
| `/api/v1/dashboard/buildings/:buildingId/environment/sources` | Candidate `solar` + `sb`, actual source metadata/capabilities và counts by type |
| `/api/v1/dashboard/buildings/:buildingId/environment/summary?start=...&stop=...` | Bounded latest-sample summary, CO₂ chỉ từ SB, temperature/humidity/lux chỉ từ Solar |
| `/api/v1/dashboard/buildings/:buildingId/environment/sources/:deviceId/readings?start=...&stop=...&limit=...` | Server-authoritative Solar/SB dispatch, normalized same-type latest/history và coverage |

Frontend giữ same-origin `/api/devices/dashboard/buildings/E/environment/...`; NestJS tiếp tục gọi shared services trực tiếp, không HTTP loopback hoặc direct TSDB. Không tạo `/latest` endpoint hoặc expose IoT tokens/URLs.

Giữ building validation, inclusive UTC bounds, `start < stop`, malformed/duplicate range/limit rejection, summary max **24h**, detail max **7d**, detail limit **1..1000**. Upstream `/sb` cap 10000 không nâng app cap. Unsupported AVC/NFC/Smoke không được gọi readings từ Environment.

Source-list floor query giữ approved catalogue behavior. Nếu existing query DTO nhận `roomId`, propagate đúng existing catalogue method và `requestedRoomId` hoặc reject rõ unsupported query; **không accept rồi silently ignore room scope**. Reuse exact-case trimmed room validation và room-query floor-0 fallback bypass; không cần thêm room-filter UI trong phase này.

### 4.2 Additive, source-specific shape

- Extend Environment-specific `sourceDeviceType` thành `'solar' | 'sb'`; server metadata/shared telemetry quyết định type, không nhận public type hint để route upstream.
- Source items: preserve opaque `deviceId`, catalogue-active flag, registry timestamps, source X/Y/Z/floor, nullable/missing room, display floor và assignment provenance. Add named capabilities/metric metadata; activity flag không phải online state.
- Preserve existing Solar `rawTemperature`, `rawHumidity`, `lux`, source counts và response keys; thêm `acceptedSbCount`, total/by-type counts và SB metrics. Không đổi `acceptedSolarCount` thành tổng hai types.
- Selected readings dùng discriminated union/capabilities. SB có `rawCo2`, `rawVoc`, `rawVoltage`, `rawVisible`, `rawIr`, radio/frame/network identifiers; Solar giữ existing fields. Unsupported metrics absent/null theo DTO convention, không copy Solar values vào SB record.
- `rawCo2` giữ giá trị source; nếu thêm semantic key như `co2Ppm` thì identity map rõ metadata. Không đổi shared normalized SB payload/labels chỉ để Page 03 có unit presentation.
- Add source type, per-metric metadata và optional source coverage vào source results/readings. Keep `schemaVersion` policy nhất quán giữa DTO/OpenAPI/web; document additive changes/version decision. Không bump unrelated shared raw schemas.

### 4.3 Unit mapping, assumptions và compatibility

Centralize Environment metric/unit mapping, đặt version cụ thể (ví dụ `environment-metric-units-v1`); không hard-code conversion rải trong JSX.

| Field/metric | Unit/convention cho phase này | Status và presentation |
| --- | --- | --- |
| SB `rawCo2` | ppm, identity | `assumed_standard`; `hardwareConfirmed: false`; main delivered live/derived metric |
| SB `rawVoltage` | V, identity | `assumed_standard`; không tính battery % hoặc lifetime |
| Solar `rawTemperature` / `rawHumidity` | °C / %, identity | `documented_contract` theo API §3.6; không claim calibration/hardware validation hoặc room representativeness |
| Solar `lux`; radio RSSI/SNR | lux; dBm/dB | Keep documented convention |
| SB `rawVoc` | Nếu hiện trong technical detail: **VOC index**, dimensionless `index`, identity, explicit provisional application convention | `assumed_standard`, chưa xác nhận firmware algorithm. Không gọi `94` là mg/m³, ppb, calibrated gas concentration hoặc “Ổn định” |
| SB `rawVisible` / `rawIr` | Giữ raw visible/IR channel values; nếu hiện: `count`, explicit channel-count assumption | Không đổi channel count thành lux/irradiance; không synthesize conversion formula |

VOC/light là technical disclosure optional, không tạo thêm business KPI scope. Không suy standard-unit permission thành xác nhận sensor processing algorithm, enum meanings hoặc numeric ranges. Giữ fields/raw values để stakeholder technical confirmation sau này thay mapping mà không phải rewrite raw pipeline.

`unitStatus` phải phân biệt `assumed_standard` với `documented_contract`; hardware-confirmed metadata không được tự bật chỉ vì contract ghi unit. Provenance có mapping version và metric source type. Fixture VOC concentration/demo thresholds vẫn thuộc fixture, không trộn với SB index.

## 5. Summary/calculation, coverage và request lifecycle

### 5.1 Bounded population summary

- Giữ **global max 20 candidate devices / summary request**, không 20 Solar cộng 20 SB; max **2** simultaneous upstream telemetry operations và `limit=1`/candidate. Metadata resolution dùng existing cache/service; không duplicate client/extra full-history scan.
- Tránh SB starvation khi có nhiều Solar: use deterministic type-interleaving selection (sort opaque IDs trong từng type, alternating Solar/SB đến total cap; type hết thì lấy tiếp type còn lại). Record selection-policy version và attempted/by-type/truncated counts; không gọi capped subset là whole-fleet coverage.
- Một normalized latest row/candidate trong requested window. Nếu latest row có null CO₂, source không đóng góp CO₂; không scan ngược lịch sử vô hạn để tìm giá trị đẹp hơn.
- Calculate mean/min/max trên finite numeric values; **0 hợp lệ**, null/missing/non-finite không thành 0. Không round ở backend; frontend locale/precision chỉ presentation.
- Metric populations độc lập: Solar không đóng góp CO₂; SB không đóng góp temperature/humidity/lux. Một SB reading không biến Solar device thành room multisensor. Không trộn demo/manual rows vào math.
- `contributingSourceCount` là số distinct contributing devices, không số packets; gồm total candidate/attempted/failed/empty/skipped và observed time phù hợp cho **từng metric**, không dùng newest Solar timestamp làm freshness của CO₂.
- Envelope và metric availability phải phân biệt ready/partial/empty với upstream error/unavailable. Tất cả requests lỗi không được present như “không có sensor”/successful empty. Có dữ liệu một phần vẫn hiển thị kèm coverage/caveat; CO₂ thiếu/error không bị che bởi successful Solar summary.
- `sourceTruncated`, optional `meta.count`, missing metadata và `reachedLimit` được giữ trung thực. Intentional `limit=1` nghĩa latest snapshot, không complete history; không coi history truncation này là bằng chứng thiếu device population, và không xóa history coverage flags.
- Ưu tiên per-metric `observedAt` và source count/helper cho CO₂ KPI. Single device `596` → mean/min/max `596`, contributing count `1`, scope “mẫu nguồn đã có”, không “48/48 phòng” hoặc complete building IAQ.

### 5.2 Giữ nguyên IAQ fetch triggers

| Event | Expected request behavior |
| --- | --- |
| Mount `/dashboard/environment` | Sources + bounded summary như baseline |
| Chọn source / đổi preset | Fetch history đúng current selection/window |
| Bấm existing “Làm mới” detail | Manual refresh đúng selected source |
| Render, đổi metric tab, callback identity, cập nhật freshness | Không tự trigger request mới |
| Chờ 5 phút, focus/visibility change | Không thêm auto fetch/scheduler |
| Navigate away / logout / stale selection response | Giữ cancellation/session handling; không stale data cross-source |

Không implement lại Page 07 hotfix hoặc “tối ưu” IAQ bằng scheduler mới. Chỉ thay lifecycle code nếu typed SB branch thật sự cần để ngăn stale/wrong-source data; giải thích necessary diff. Không tạo parent/child notify feedback loop. Không lấy `fetchedAt` làm measurement timestamp hoặc effect dependency gây fetch.

## 6. Conditional room/grid adapter và gates

### 6.1 Deliver mapping boundary, không fabricate bindings

Define một explicit read-only adapter/model cho `source device → actual floor/room → stable logical cell`, với raw source room, verified mapping version, room/cell IDs và states như mapped/unmapped/ambiguous/development-fallback/no-data. Tạo pure adapter tests bằng isolated synthetic test data; không seed production mappings hoặc DB.

- Source `roomId` nullable/missing giữ nguyên case; unknown room không thành demo room.
- Không match bằng friendly network name `sb-dev2`, guessed EUI patterns, numeric row order, X/Y/Z hoặc fixture label.
- Existing `roomDemoId` chỉ nối demo datasets; không reuse thành authoritative room ID. `displayFloorId` development fallback và source floor 0 không phải bằng chứng lắp đặt ở tầng 4/6.
- Nhiều devices cùng room: require explicit primary-device binding trong verified mapping cho live activation ở phase này; chưa có thì `ambiguous`, không average tùy ý hoặc count như nhiều phòng. Future multi-device aggregation cần named policy riêng.
- Corridor/service/empty cells không nhận CO₂ từ closest device. Duplicate bindings hoặc conflicting actual floors không bị silently accepted.

### 6.2 Gate để migrate room branches

Trước khi enable, record bằng chứng cho từng điều kiện:

1. Catalogue room/floor assignment thật có dữ liệu và không chỉ là development fallback.
2. Verified room-to-cell config có stable IDs/version và approved binding/selection; current demo floor config không tự đủ điều kiện.
3. Query window/sample coverage đủ cho presentation đã chọn; missing/truncated buckets không fill/interpolate thành live.
4. Chỉ descriptive CO₂ values được delivered. Room rank numeric descending dùng neutral styling; chưa approved thresholds thì không gán good/warning/danger hoặc room-over-threshold counts.
5. Muốn heatmap derived hourly history phải có defined time buckets, aggregation và bounded history load; latest `limit=1` summary **không thể tạo room × hour heatmap**. Không thêm hidden fleet-history N+1 hoặc backend endpoint/job mới chỉ để đóng gate. Nếu cần load/business contract mới, ghi conditional deferred và giữ demo.

**Default của regenerated plan:** do source audit chưa có verified production room/cell bindings hoặc room-history contract, **giữ Page 03 heatmap/ranking/compliance demo và Page 01 nguyên trạng**. Vẫn deliver mapping adapter contract + tests để phase sau reuse. Nếu verified configuration và existing bounded read contract xuất hiện trước coding, chỉ wire existing room/cell value adapter sau khi record đủ gates; không redesign Page 01 hay bổ sung business thresholds. Nếu phải mở rộng API/layout/load scope, hỏi stakeholder trước.

Live errors không tự fallback sang demo; unresolved demo branch là widget/adapter riêng, rõ provenance. Compliance/IAQ score/alert thresholds vẫn conditional/deferred dù room mapping có đủ. 2D grid nếu được dùng tiếp phải là logical matrix + floor catalogue của KB §6, **không dựng BIM 3D theo mockup**.

## 7. UI Architecture & Mockup Alignment

### 7.1 Reference và scope UI

Reuse IAQ mockup đã cung cấp (`codex-clipboard-0fbca15d-0523-4edc-8c2a-fefe1f0c6cf3.png`, original `2368 × 1594`) và Phase 05 §10 làm visual reference; temporary clipboard file không phải runtime/repository dependency. Reference QA: **1842 × 1222 full shell**, workspace crop **1778 × 1222**. Lấy current aligned Page 03 làm baseline screenshot trước khi sửa; không cần mockup mới cho source/CO₂ adapter upgrade này.

Không copy số `48`, `712`, `82`, room names, thresholds hoặc caption “5 phút/lần” từ mockup. Reuse shell 64 px High-Level rail + 288 px Dashboard sidebar, exactly seven routes, active IAQ. Không sửa shared shell/navigation/tokens để “align” lại pages đã completed.

### 7.2 Component hierarchy và ownership

```text
DashboardShell (unchanged)
└── EnvironmentDashboard (existing page controller; same fetch triggers)
    ├── EnvironmentPageHeader (required source/provenance copy only)
    ├── EnvironmentKpiStrip (6 existing slots)
    ├── EnvironmentSourceDetail (selected Solar or SB; existing expandable location)
    ├── Primary row: existing CO₂ heatmap + ranking (demo unless gates close)
    ├── Secondary row: existing compliance + threshold display
    └── EnvironmentSourcePicker (existing modal, now Solar/SB)
```

Shared `MetricTrendChart`/ant-design-charts và state components được reuse. New helper/adapter page-scoped hoặc pure data model, không copy Page 07 detail component để kéo theo scheduler/behavior.

### 7.3 Geometry/design tokens — preserve current implementation

| Region | Baseline constraint tại reference viewport | Phase 25 treatment |
| --- | --- | --- |
| Page container/header | Existing `max-w-[1720px]`, gutters 16/24/32 px, title khoảng 28 px, actions wrap | Không đổi width/header chrome để khớp pixel mockup cũ |
| KPI strip | Existing 2/3/6 responsive columns, gap 14 px, six equal cards, min height khoảng 136 px | Chỉ đổi data/provenance trong required slots |
| Source detail | Existing full-width expandable panel giữa KPI và primary row; chart height 260 px; metric controls wrap | Reuse cho SB, không insert persistent extra dashboard row |
| Primary row | Existing 12-col layout, desktop 8:4, gap 20 px | Không normalize lại ratio 1.9:1 hoặc đổi card titles |
| Secondary row | Existing 2 equal columns at desktop; stack mobile | Compliance/threshold demo/unavailable semantics giữ rõ |
| Source picker | Existing max width khoảng 512 px, max height 85vh, inner scroll | Search/floor + source type badge; không làm room-mapping editor |

Tokens giữ `--app-bg #070D11`, `--panel-bg #111922`, `--panel-elevated #17222C`, `--primary #4FB9AD`, `--text-primary #E6EDF1`, muted `#7E8B96`, existing 1px borders và rounded-xl/panel radius. Không thêm palette/chart library/global CSS. Real CO₂ neutral teal/tabular value; amber assumption metadata không phải alarm severity.

### 7.4 Widget/data-mode và copy changes được phép

| Existing widget | After mandatory branch | Required vs protected content |
| --- | --- | --- |
| IAQ score slot | Unavailable | Giữ title/helper; không tính score từ single CO₂ |
| `CO₂ trung bình` | Derived from contributing SB latest samples, ppm | Giữ headline; thay Demo badge/value/helper bằng count/window/max source/assumed-unit metadata. Không giữ fixture “phòng E6.6” trên live KPI |
| Temperature / humidity | Derived Solar, °C/% | Giữ headline và existing displayed units; sửa contradictory pending-unit metadata/helper đúng §3.6 thôi |
| VOC slot | Existing deterministic demo | Không đưa raw SB index vào slot mg/m³ hoặc bỏ Demo badge |
| PM2.5 slot | Unavailable | Không synthesize field hoặc source |
| Source picker | Solar + SB catalogue | “Chọn nguồn Solar Environment” có thể đổi tối thiểu thành “Chọn nguồn môi trường”; type badge dùng actual type; giữ search/filter/close labels khác |
| Selected detail | Live selected source | Solar keeps existing metrics; SB default tab **CO₂ (ppm)**, optional voltage/radio/technical disclosure; không show Solar tabs trên SB |
| Page header | Mixed widget modes | Chỉ reconcile obsolete “Solar only” / “CO₂ Demo” badges với active delivered domains; không global “toàn page Live”, không khôi phục subtitle stakeholder đã comment/remove |
| Heatmap/rank/compliance/threshold | Existing demo/read-only default | Giữ user-edited titles/legend/text; không mở Sửa hoặc promote demo thresholds thành real rules |

SB detail: top source EUI/type + Live badge, latest CO₂ card `596 ppm` khi source trả đúng sample, assumption helper/tooltip, trend oldest-first, radio gateway/frame/timestamps và coverage. Dùng null `—`, not zero filler. Assumption notice đặt gần metric, không modal confirmation blocker. Technical VOC index/count presentation phải ghi provisional convention ở §4.3; không đổi fixture VOC labels để “đồng nhất”.

### 7.5 Responsive và intentional differences

- Giữ breakpoints hiện hữu: full desktop six KPI slots; intermediate three; small two. Không sửa thành mobile single-column chỉ vì old plan ghi khác.
- Header wraps; detail/cards stack; modal/search/type badges dùng keyboard/focus và internal scroll. Không body horizontal overflow; long opaque IDs wrap/truncate kèm accessible full value.
- Chart + accessible table/selected latest vẫn usable ở `390 × 844`; closing/preset selection không hiển thị previous-source values.
- Mockup numbers/48 sensors/BIM/ranges/thresholds khác implementation có chủ ý: real device counts, existing `24h/72h/7d`, logical grid only, no new 5-minute caption. Dual sidebars/current user content thắng raw mockup pixel/text.
- Nếu phải tạo một page/layout mới ngoài cấu trúc trên, dừng và hỏi page mockup cụ thể; không invent mockup hoặc redesign completed page.

## 8. Implementation task order và file allowlist

### Task A — Re-audit/freeze baseline

Record git status và current labels/screenshots; preserve dirty stakeholder changes. Confirm shared SB bridge và Page 07 hotfix tồn tại. Đọc docs/Next guide trước code. Map mọi intended diff tới task bên dưới; không fix unrelated lint/test failures.

### Task B — Environment source/DTO upgrade

Add typed Solar/SB catalogue capabilities, additive room propagation, counts, source-specific reading/latest metadata và unit map. Preserve source query scope/validation. Reuse shared `getDeviceTelemetry` and check runtime discriminator trước branch, không blind cast SB thành Solar.

### Task C — Bounded CO₂ summary

Extend pure summary calculation và service orchestration theo §5: deterministic total-20 selection, concurrency-2, one latest sample/source, per-metric coverage/availability/observed times, honest truncation. Keep existing Solar math fields/behavior except documented units.

### Task D — IAQ UI adapter wiring

Upgrade existing picker/detail/chart and CO₂ KPI/header provenance theo §7. Keep current lifecycle §5.2; only necessary abort/stale-selection changes for new union. Không new polls, scheduler, route, global CSS, copied Page 07 behavior hoặc unrelated text edits.

### Task E — Mapping boundary và conditional gate audit

Implement pure typed mapping boundary/tests theo §6; leave real bindings empty unless verified existing config. Record each closed/open gate. Default leave room/demo components và Overview files unchanged; actual conditional wiring requires sufficient evidence, narrow diff và no new load/business scope.

### Task F — Verify, reconcile documentation và handoff

Run scoped tests/build/lint/browser checks theo §9; report failures/not-run honestly. Update roadmap/master KB only changed delivered facts and unresolved gates; không rewrite historical handoffs. Create matching handoff ở §11.

Expected allowlist:

- Backend: `backend/src/dashboard/dashboard-environment.service.ts`, `dashboard-environment-summary.ts`, `dashboard-environment.controller.ts`, Environment DTOs/tests; optional new **Environment-only** metric-unit/mapping helper.
- Web: `web/src/types/dashboard-environment.ts`, `web/src/lib/dashboard/environment-api.ts`, `environment-chart.ts`, optional Environment-specific mapping/metadata helper; `EnvironmentDashboard.client.tsx`, `EnvironmentSourcePicker.tsx`, `EnvironmentSourceDetail.tsx`, `EnvironmentKpiStrip.tsx`, required source/provenance-only `EnvironmentPageHeader.tsx`.
- Tests/docs: scoped new Phase 12 tests/script registration if needed; revise obsolete Phase 05 assertions only for superseded requirements; OpenAPI snapshot via established generator; this plan/roadmap/KB and matching handoff.
- **Conditional only:** existing room widget value adapters / Overview CO₂ value adapter after §6 gate proof. No default edits to Page 01, Page 02, Page 06, Page 07, Page 09, Page 11, shared shell/chart/CSS, identity or existing raw SB parser.

If required blocking bug lies outside allowlist, explain evidence and smallest necessary diff; ask before material scope expansion. Changes to protected labels purely to satisfy test strings are forbidden.

## 9. Verification matrix

Tests phải exercise actual implementation helpers/service/component behavior, không chỉ mirror logic trong test hoặc `src.includes(...)`. Source assertions là supplement, không thay runtime/API evidence.

| ID | Required case | Expected result |
| --- | --- | --- |
| SP25-T01 | Solar + SB source list; unsupported types; source floor/nullable room | Actual types/metadata/capabilities, no guessed room, counters correct |
| SP25-T02 | Selected SB sample `co2=596`, zero/null/malformed variants | Latest/history ppm identity; zero preserved; no fabricated values/calibration |
| SP25-T03 | Metric-unit mapping and future version replacement | Assumed vs documented distinct; raw preserved; no multiply/divide hidden scale |
| SP25-T04 | Mixed Solar/SB population; two devices same packet count | CO₂ only SB, temperature/humidity only Solar; distinct device contributor counts |
| SP25-T05 | >20 candidates, >20 Solar + one SB, slow upstream | Total cap20, deterministic fair inclusion, concurrency≤2, by-type truncation honest |
| SP25-T06 | Latest row null CO₂; partial/empty/all-failed sources | No historic/unbounded backfill; metric-specific states; no successful empty disguising error |
| SP25-T07 | Time bounds, duplicate query params, limits, unsupported device | Invalid queries rejected before telemetry call; 24h/7d/1000 app bounds retained |
| SP25-T08 | Optional meta missing, true truncation, exact-limit history, `limit=1` summary | No full-history claim; snapshot vs fleet coverage separated |
| SP25-T09 | Source identity vs friendly device name; radio/source timestamps | EUI joins; observedAt not registry/fetchedAt; no online/battery% inference |
| SP25-T10 | Chart newest-first inputs, zero/null, switching Solar↔SB | Immutable oldest-first valid series; appropriate metric tabs; no previous-source leak |
| SP25-T11 | IAQ idle >5 minutes, source/preset/manual/render/metric events | No automatic poll/callback fetch loop; baseline intended events only |
| SP25-T12 | Null/unknown room, source floor0, dev fallback, duplicate/conflicting bindings | Explicit unresolved states; no match to demo `roomDemoId`/coordinates |
| SP25-T13 | Verified synthetic room mapping and absent buckets | Adapter deterministic; no fabricated history/severity; synthetic test IDs not production bindings |
| SP25-T14 | Viewer/Manager/anonymous through same-origin + NestJS | Both read, anonymous401; placement mutation denied; no new editor/role/account |
| SP25-T15 | Upstream401/timeout/malformed; browser secrecy | Sanitized502/503 without bearer/internal URL leak or unintended app-session logout |
| SP25-T16 | Read-only/persistence boundary | No new migrations/entities/jobs/report tables, no telemetry/mapping writes; existing identity/session behavior unchanged |
| SP25-T17 | UI modes/labels + regression pages + Page07 hotfix | Required semantic edits only; fixture/widgets honest; other labels/layout/cadence unchanged |

Coding agent dùng established runners, thêm Phase 12 runner khi cần; verify commands tồn tại lúc chạy:

- Backend: `npm test -- --runInBand`, `npm run test:e2e`, `npm run build` trong `backend`.
- Web: scoped Phase 12 test runner, `npm run test:bp2:p05`, `test:bp2:p07`, `test:bp2:p10`, `test:bp2:p11`, `test:bp2:hotfix`, rồi `npm run lint`, `npm run build` trong `web`.
- Test suite Phase 05 có obsolete Solar-only/no-unit/demo-CO₂ assertions; update chính các assertions được supersede, giữ truthful-data/security invariants. Older unrelated Page 02/status-label failures phải report pre-existing, **không sửa Water/IoT labels** hoặc delete tests để pass.
- Read-only schema/migration inventory nếu DB available; không migrate/seed/reseed để test zero telemetry persistence. Identity login/session writes có thể là existing infrastructure behavior, không phải phase này tạo telemetry persistence. Không dùng idle lock absence/table counts đơn lẻ làm chứng minh toàn bộ code không ghi DB.
- Browser QA Page 03: source picker Solar/SB, CO₂ KPI/count/window, selected trend/unit/assumption, empty/partial/error, source/preset switching, close/manual refresh, idle5min request counts và console. Live check qua approved app read path nếu environment available; không gọi master upstream trực tiếp từ browser. Không có live data thì test controlled mock cases và ghi live verification NOT RUN.
- Screenshots trước/sau: `1842 × 1222`, `1440 × 900`, `1024 × 768`, `390 × 844`; workspace crop khi cần. Check six KPI slots, unchanged shell/primary/secondary rows, mixed-mode badges, long IDs, chart fit, focus/keyboard, no body overflow và unrelated text diffs.

## 10. Acceptance và remaining gates

Mandatory branch chỉ complete khi:

1. IAQ sources/detail hỗ trợ Solar và SB qua existing authenticated typed boundary.
2. CO₂ latest/history Live và KPI Derived dùng ppm assumption; unit map/version + raw values/source time được giữ.
3. Summary bounded total20/concurrency2/limit1/24h, per-metric coverage và null/error semantics đúng; SB không tạo phantom room temperature/humidity.
4. CO₂ missing/error không bị silently replaced bằng fixture; còn demo room/VOC/compliance widgets ghi mode độc lập.
5. Mapping boundary có tested unresolved behavior; conditional gates chưa đủ được liệt kê riêng, không nhận vơ live migration hoàn thành.
6. IAQ giữ current mount/selection/preset/manual refresh; không auto5min, không global fetch changes hoặc callback feedback loop mới.
7. Existing labels/UI/other pages được bảo vệ; necessary unit/source/provenance exceptions có audit.
8. No new report/telemetry/mapping persistence, account reset, new role, upstream mutation hoặc unapproved threshold/state logic.
9. Tests/visual results, failures và not-run items có actual evidence; matching handoff được tạo.

Trong roadmap/handoff, tách **mandatory delivery completed** khỏi **conditional room/grid live migration còn chờ**. Nếu chưa đủ gates, record rõ actual room/cell binding, primary-source selection, history window/coverage và business baselines cần stakeholder/IoT team bổ sung. Không để room/unit follow-up kéo lùi mandatory device-level CO₂ integration; không mở persistence trước Small Phase 21.

## 11. Bắt buộc tạo handoff khi kết thúc

**Coding Agent: sau khi implement và verify Small Phase 25, phải tạo `web/doc/bp2_phase12_page03_sb_co2_environment_upgrade_handoff.md` trước khi tuyên bố hoàn tất hoặc chuyển phase.** Handoff phải ghi stable ID25/detailed Phase12, delivered vs conditional/deferred scope, changed files/reasons, source-unit mapping/version/assumptions, bounded load và metric coverage, proof IAQ refresh giữ nguyên, protected-page/text audit, auth/proxy/persistence effects, exact tests/results (kể cả fail/not run), screenshots nếu có và remaining room/business gates. Chỉ update roadmap status từ bằng chứng này; không dùng plan file hoặc owner sample làm bằng chứng implementation đã hoàn thành.
