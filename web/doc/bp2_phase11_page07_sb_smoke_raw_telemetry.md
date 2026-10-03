# Big Phase 02 — Phase 11: Page 07 SB & Smoke Raw Telemetry Foundation

> **Project:** GIS — UIT Building E Digital Twin  
> **Loại tài liệu:** Kế hoạch Markdown bàn giao cho Coding Agent  
> **Ngày lập:** 2026-10-03  
> **Trạng thái:** PLAN ONLY — CHƯA IMPLEMENT  
> **Roadmap mapping:** Small Phase **24** — Read-only `sb` and `smoke` raw telemetry foundation  
> **Implementation sequence:** Phase **11**, tiếp theo Phase 10 / Small Phase 23; không đổi ID các Small Phase cũ  
> **Trang trực tiếp bị ảnh hưởng:** Page 07 — Hệ thống IoT (`/dashboard/iot`)  
> **Primary targets:** Shared NestJS telemetry bridge, Dashboard DTOs/types, selected-device raw detail trên Page 07 và tests  
> **Phụ thuộc đã hoàn thành:** Small Phase 23 catalogue contract, Small Phase 16 identity/CASL và UI alignment

---

## 1. Mục tiêu và entry decisions

Cho phép chọn một thiết bị `sb` hoặc `smoke` trên Page 07 để đọc **raw telemetry có provenance** qua application API hiện hữu, bằng request có giới hạn, không xây lại catalogue hoặc Dashboard:

1. Thêm hai upstream GET cố định `/api/v1/sb` và `/api/v1/smoke` vào client NestJS hiện hữu.
2. Runtime-validate, normalize và route theo device type từ catalogue/detail đã được backend xác thực; không theo browser hint.
3. Mở rộng shared telemetry và Dashboard response một cách additive, giữ nguyên Solar/AVC và shared NFC behavior.
4. Hiển thị raw `sb` sensor values và raw smoke codes trong selected-device panel hiện hữu, cùng metadata, range, quality và history.
5. Verify mocked integration, authorization, UI/state/race behavior và protected-page regressions; tạo matching implementation handoff.

**Planning agent chỉ tạo plan và liên kết roadmap. Không implement source, chạy migration, seed account, gọi live upstream hoặc tạo handoff implementation trong lượt này.**

Không cần hỏi thêm để lập plan này. `sb` units/scales và smoke code mappings chưa chốt nhưng không block **qualified raw retrieval**. Chúng vẫn là gate cho live IAQ/fire business interpretation ở Small Phases 25/18/21, không được tự đóng trong phase này.

Không cần mockup mới: current Page 07 đã aligned là reference cho panel bổ sung. Không có page mới hoặc redesign. Nếu Coding Agent muốn đổi macro layout, phải hỏi stakeholder trước, không tự mở rộng scope.

## 2. Authority và required reading

Thứ tự xử lý xung đột:

1. Yêu cầu stakeholder mới nhất: chỉ plan Small Phase 24, bảo toàn text/labels đã chỉnh; raw fetch/calculation trước, report/alert PostgreSQL ở Small Phase 21.
2. `Dashboard_Knowledge_Base.md` cho frozen scope, DataMode, chart library, CASL và Interactive 2D Grid.
3. `IoTBackend_API_HandOver.md` cho exact API contract. Current §§30–31 và common range/meta rules thắng wording availability/units cũ.
4. Repository/runtime evidence cho implementation hiện tại; handoffs là snapshot, không phải verification mới.
5. Plan này cho task boundary, parsing policy, UI additions và acceptance của Small Phase 24.
6. Mockup/UI plan cũ chỉ là visual reference; text hiện tại trong repository thắng wording lịch sử.

Coding Agent phải đọc trước khi sửa:

- `web/AGENTS.md` và relevant bundled Next.js guidance dưới `web/node_modules/next/dist/docs/` trước khi viết web code.
- `web/doc/Dashboard_Knowledge_Base.md`, nhất là §§3–5, 9–11, 14–19; roadmap Small Phase 24 và execution order.
- `web/doc/IoTBackend_API_HandOver.md`: common range/meta/identity rules §§3–4; interfaces/routing/normalization §§11–13; validation/errors/security §§16–19; đầy đủ §§30–31. §32 là capability **không triển khai** ở phase này.
- `web/doc/bp2_phase10_page07_device_catalogue_contract_upgrade.md` và matching handoff.
- `web/doc/bp2_phase03_page07_live_telemetry_core_handoff.md`.
- `web/doc/bp2_fix_align_UI.md` và matching handoff.
- `web/doc/bp2_phase09_minimal_identity_casl_foundation_handoff.md`.
- Current source/types/proxy/tests ở mục 10; re-audit source trước khi áp kiến trúc từ handoff cũ.

Tài liệu/ảnh tham chiếu không phải permission cho external writes, webhook test delivery hoặc phase kế tiếp.

## 3. Baseline đã kiểm tra và no-touch rule

### 3.1 Repository snapshot lúc lập plan

- HEAD lúc lập plan: `7b15a13`. Working tree có thay đổi stakeholder và Phase 10 chưa commit; re-audit khi triển khai.
- `IotClientService` có list/detail, Solar, AVC, NFC GETs; chưa có `sb`/`smoke` methods hoặc reading models.
- `IotTelemetryService` resolve type từ trusted RAM cache/detail, dispatch `solar`/`avc`/`nfc`, unknown fallback; normalization đang chạy trong RAM.
- `DashboardIotTelemetryService` và backend/frontend Dashboard telemetry DTOs hiện chỉ hỗ trợ `solar`/`avc`.
- `IotDeviceTelemetryPanel.client.tsx` chỉ fetch hai type trên; selector/chart fallback đang mặc định AVC cho non-Solar. Chỉ thêm type vào boolean gate sẽ gây sai UI/type handling.
- Catalogue đã chấp nhận `sb`/`smoke` metadata. Room filters, scope isolation và nullable source room từ Small Phase 23 **không phải task còn thiếu**.
- Selected-device detail thực tế là **full-width panel dưới catalogue/Gateway row, trước bottom support cards**, không phải drawer bên phải. Giữ vị trí source hiện tại.
- Common latest sample có observed time, Gateway, RSSI/SNR; callback cập nhật row/Gateway của đúng selected device. Không có fleet telemetry fetch.
- Dashboard policy hiện có: Building E, preset `last-24h` / `last-72h` default / `last-7d`, max duration 7 ngày, `limit` 1..1000, `no-store`.
- Shared/upstream policy cho type-specific GET có cap 10000. Cap upstream không phải lý do nâng Dashboard cap hoặc thêm range mới.
- Session/CASL đã hoàn thành: Viewer/Manager cùng `read:Dashboard`, cùng deny display-position update/delete. Accounts có sẵn; không seed/reset lại.
- Proxy đã allowlist Dashboard selected-device telemetry route và forward app cookie. Không cần mở browser routes `/sb` hoặc `/smoke`.
- Phase 10 T26 asserts hai endpoint mới còn absent; Phase 03 web T09 asserts chỉ Solar/AVC supported. Những assertion snapshot này phải được cập nhật có scope khi Small Phase 24 implement.

Baseline được kiểm tra bằng source/docs, **không chạy app/test/live GET trong lượt lập plan**. Không lấy schema example hoặc kết quả handoff cũ làm live evidence mới.

### 3.2 Protected-page/text rule bắt buộc

**Không quay lại Page 01 Overview, Page 02 Water/Energy, Page 03 Environment, Page 06 Alerts, Page 09 Parking hoặc Page 11 PCCC để sửa text, labels, translations, fixtures, charts, calculations, layout hoặc data wiring trong phase này.** Stakeholder đã tự chỉnh nội dung; không phục dựng wording từ mockup/plan cũ.

Page 07 cũng là completed page được bảo vệ. Chỉ sửa selected-device telemetry orchestration/type-specific raw branch và shared contract cần cho hai type mới. Giữ header, KPI titles, table columns, status `Trực tuyến trong API`, catalogue/search/type/floor/room filters, room scope hint, Gateway/bottom cards, Solar/AVC labels và presentation hiện hữu.

Các ngoại lệ **cụ thể** được phép:

- New `sb`/`smoke` raw labels, field/caveat/history/coverage copy chỉ trong branch mới ở mục 7.
- Sửa đúng unsupported-telemetry description/phase note đang tuyên bố Dashboard chỉ hỗ trợ Solar/AVC. Đây là contract correction cần thiết, không phải copy-edit toàn Page 07; NFC/unknown vẫn unsupported.
- Shared DTO/type extensions và type guards cần để không đưa `sb`/`smoke` vào AVC fallback.
- Verified blocking bug trực tiếp của feature này, ví dụ stale callback gắn sample thiết bị cũ vào selection mới. Phải ghi reproduction, exact cause, minimal diff và regression evidence; materially broader change cần hỏi stakeholder trước.

Không sửa page khác hoặc stakeholder labels để làm historical tests pass. Lỗi pre-existing không block phase phải được báo riêng, không tự refactor để sửa.

## 4. In scope / out of scope

### In scope

- Two fixed read-only upstream client methods, raw interfaces, runtime validation và normalizers.
- Additive shared telemetry variants, Dashboard DTO/Swagger và frontend types/helpers.
- Page 07 selected `sb`/`smoke` detail: latest raw values, recorded/network metadata, bounded history, quality/coverage; raw numeric trend cho `sb`.
- Existing auth/proxy/session/error-boundary verification; no new role/ability.
- Relevant unit/HTTP/frontend/browser/visual tests, narrow stale-test updates, scoped KB/roadmap facts và implementation handoff.

### Out of scope

- Không implement Small Phase 25: không đổi Page 03 environmental source adapter hoặc Page 01 CO2/grid data.
- Không implement Small Phases 17/18: không PCCC CRUD, detector-to-zone mapping hoặc fire-zone grid/state.
- Không thay Interactive 2D Grid; giữ KB contract, không dùng proposal BIM 3D hoặc suy rooms từ coordinates.
- Không IAQ score, room compliance/ranking, concentration/unit conversion, battery %, battery health, packet-delivery rate, online/offline, smoke alarm/severity/latching hoặc thresholds.
- Không đưa raw `sb`/smoke vào alert evaluator, authoritative rule registry, notification badge, report aggregates hoặc delivery channels.
- Không webhook GET/mutation/test/receiver, direct TSDB access, upstream writes hoặc generic API proxy.
- Không PostgreSQL schema/entity/migration, raw mirror, report/alert persistence, background jobs/cache tables. Small Phase 21 vẫn last implementation phase; existing identity/session access giữ nguyên.
- Không account mới, password reset, role expansion, auth redesign hoặc mở placement-write permissions.
- Không NFC Dashboard telemetry/UI/card-person exposure; shared NFC service giữ nguyên project capability.
- Không 30-day/custom range, `/latest`, polling, fleet sweep, unbounded backfill, retention/load assumptions hoặc new chart/runtime-schema library nếu convention hiện có đủ dùng.
- Không sửa global CSS, shell/navigation, route tree, Unity/Viewer UI hoặc restyle completed components.

## 5. API boundary và source contract

### 5.1 Existing application route — không tạo endpoint browser mới

```text
Page 07 selected-device action
  -> same-origin Next.js GET proxy
  -> guarded NestJS Dashboard telemetry GET
  -> shared IotTelemetryService (trusted type resolution)
  -> fixed IoT client GET /api/v1/sb OR /api/v1/smoke
  -> validated normalized response in RAM
```

Giữ browser path:

```http
GET /api/devices/dashboard/buildings/E/iot/devices/<encoded-device-id>/telemetry?start=<iso>&stop=<iso>&limit=1000
```

NestJS route hiện hữu:

```http
GET /api/v1/dashboard/buildings/E/iot/devices/:deviceId/telemetry
```

| Trusted source type | Upstream GET | Dashboard treatment |
| --- | --- | --- |
| `sb` | `/api/v1/sb` | New qualified raw sensor branch. |
| `smoke` | `/api/v1/smoke` | New qualified raw code/history branch. |
| `solar` / `avc` | Existing endpoints | Existing branches, không đổi values/labels/calculations. |
| `nfc` | Existing shared capability | Dashboard vẫn unsupported và không fetch khi chọn. |
| Unknown type | Không đoán endpoint | Existing unsupported handling. |

- Reuse server catalogue-warmed type map hoặc validated detail lookup trên cache miss. Không tin `deviceType`, `endpoint`, URL hoặc type hint từ browser; unknown query keys bị reject theo existing whitelist.
- Cold lookup phải giữ historical detail compatibility nhưng kiểm tra core ID/type trước khi dùng để route; không invent device/type khi metadata malformed hoặc detail 404. Chỉ thay validation tối thiểu cần cho path mới, giữ existing callers.
- Khi đã biết type, một action gọi đúng **một** type-specific GET, không probe cả hai hoặc fetch mọi row. Cache miss có thể thêm một device-detail GET; catalogue không bị refetch chỉ để lấy sensor readings.
- Device IDs là opaque. Preserve case, encode path/query đúng một lần; không enforce hex-EUI, convert số hoặc dùng friendly name thay stable ID. Existing proxy traversal/path constraints giữ nguyên, không widen vì ID fixture tùy ý.

### 5.2 Range, limit và source mode

- Upstream: `dev_eui`, ISO `start`/`stop` bắt buộc; inclusive bounds và `start < stop`; default 1000, cap 10000, newest-first.
- Dashboard giữ **max 7 ngày, limit 1..1000, default 1000** và existing three presets. Shared 10000 cap không đổi; không siết global service theo Dashboard và làm regress NFC/Viewer callers.
- Reject malformed/repeated/array/object range/limit input tại application boundary trước source call; không chọn first/last value hoặc coerce blank thành valid limit. Preserve proxy raw query để multiplicity checks có hiệu lực.
- New client methods dùng validated input và URL query encoder, existing backend-only bearer executor/timeout/error mapping. Low-level direct calls cũng phải validate new method inputs; không HTTP call khi local input invalid.
- Giữ `DEVICE_SOURCE_MODE` gates: disabled/fixture -> unavailable `503`, không silently demo fallback; mocks dùng để test, không đổi source-mode contract.
- Không automatic retries, timers hoặc arbitrary historical scan. Range/cap chỉ là app policy, không phải upstream sampling cadence/rate limit.

### 5.3 Identity/field mapping cho cả hai type

| Upstream | Normalized field đề xuất | Quy tắc |
| --- | --- | --- |
| `dev_eui` | `devEui` | Stable join key với catalogue `device_id`; không phải friendly name. |
| `timestamp` | `timestamp` | Recorded time, validated ISO và normalized UTC; tách registry time và local `fetchedAt`. |
| `device_id` | `networkDeviceName` | Friendly network/application name; nullable khi absent, không dùng làm key/routing. |
| `application_id` | `applicationId` | Source string metadata, không suy user/app permission. |
| `gateway_id` | `gatewayId` | Gateway của đúng sample, không gateway inventory/online state. |
| `rssi` / `snr` | `rssi` / `snr` | Finite numeric, dBm / dB đã documented; giữ zero và số âm. |
| `sb.voltage` | `rawVoltage` | Numeric raw; **chưa gắn V** theo Solar hoặc đổi sang %. |
| `sb.visible` / `sb.ir` | `rawVisible` / `rawIr` | Numeric raw; không lux/lx hoặc scale conversion. |
| `sb.co2` / `sb.voc` | `rawCo2` / `rawVoc` | Numeric raw; không ppm, µg/m³ hoặc VOC index/threshold. |
| `sb.f_cnt` | `fCnt` | Raw frame counter, không packet-rate/delivery denominator/reset inference. |
| `smoke.status` / `smoke.state` | `rawStatus` / `rawState` | Numeric codes; không boolean/normal/fire/fault/severity enum. |

`sb` không document temperature/humidity/pressure; smoke không document CO2, concentration hoặc alarm dictionary. Không fill từ Solar/AVC hoặc giả field vì cùng physical room.

## 6. Parsing policy và additive response design

### 6.1 New reading/envelope policy

Policy dưới đây là **application parser choice**, không phải khẳng định Swagger đã đánh dấu mọi field required/nullable:

1. Success envelope phải là object, `data` array. `meta` absent hoặc `{}` được phép; supplied `meta` phải object, không null/array.
2. Mỗi row phải là object, có nonempty string `dev_eui` và valid ISO timestamp. Với branch mới, compare stable opaque ID đúng case với requested ID sau boundary trim; không copy giả định case-insensitive hex-EUI từ Solar. Không đổi legacy Solar/AVC matching policy ở phase này.
3. Row timestamp phải nằm trong inclusive requested range. Outside-range/mismatched-ID rows bị skip và đếm invalid; không gán cho device hiện chọn.
4. Non-key documented strings/numeric fields có thể absent hoặc null theo explicit sparse-response compatibility; normalize thành null. Present string phải là string; present number phải finite number. Numeric string, boolean, array/object không coerce; wrong-typed present field làm row invalid.
5. Giữ zero, negative và arbitrary finite numeric code; không constrain smoke về `0/1`, round sensor values hoặc tự áp physical bounds. Preserve valid empty-string metadata là source string, không fabricate tên.
6. Unknown extra fields được ignore; không expose raw arbitrary payload hoặc spread unknown keys vào DTO/UI. Nonempty mixed valid/invalid rows giữ valid subset cùng quality summary; nonempty all-invalid -> sanitized `502`. `data: []` -> honest empty, không fake reading.
7. Nếu core row hợp lệ nhưng tất cả sensor fields missing, giữ metadata-only reading với raw values null; hiển thị metric-empty/missing, không gọi đó là sensor bình thường hay fabricate số 0.
8. Sort normalized rows newest-first; latest common metadata và new raw latest values lấy **cùng newest valid row**. Không backfill missing latest metric từ row cũ như thể cùng timestamp. Không dedupe vì `f_cnt` hoặc đoán reading ID; duplicate timestamps có thể có thật.

Validate `meta.count` khi present là nonnegative integer; `meta.truncated` khi present là boolean. Wrong-typed meta -> malformed response `502`. Count khác `data.length` không được sửa raw count hoặc dùng làm total history; ghi caveat metadata inconsistency và dùng actual row counts cho coverage.

### 6.2 Response extensions — không phá legacy branches

- Thêm raw upstream interfaces và normalized `NormalizedSmartBuildingReading`, `NormalizedSmokeReading` theo field mapping trên; preserve source fields, không tạo business metric framework.
- Add `SmartBuildingTelemetryData` (`type: 'sb'`) và `SmokeTelemetryData` (`type: 'smoke'`) vào shared `NormalizedTelemetryPayload`; add types vào shared response `deviceType` union.
- New payload tối thiểu có discriminant, existing `DeviceCategory` theo mapper policy, normalized `readings` và unconfirmed technical status metadata nếu shared convention cần. `sb` có thể reuse `smart_building`; smoke không buộc tạo category/Fire domain mới, `unknown` category vẫn hợp lệ cùng `deviceType: 'smoke'`.
- Dashboard supported union thành `solar | avc | sb | smoke`, không gồm NFC. Backend/frontend types phải đồng bộ; `deviceType` và `telemetry.type` nhất quán, không ép bằng unchecked Solar/AVC cast hoặc để non-Solar fall through AVC.
- Giữ existing envelope `schemaVersion`, building/device ID, availability, provenance, queryRange, coverage, latestSample. Additive fields không tự yêu cầu migration hoặc version bump; old Solar/AVC fields/output giữ nguyên.
- `latestSample` tiếp tục observedAt/Gateway/RSSI/SNR từ newest valid row; no rows -> null; `availability` ready khi có valid rows, empty khi source thật empty. Metadata-only ready không đồng nghĩa metric có giá trị.
- Provenance `mode: live`, current source identity, requested range, recorded time và separate local fetch time; type-specific caveats nói đúng units/code chưa xác nhận. Sanitized errors không trả raw source payload/token.
- Frontend render theo validated response discriminant. Kiểm tra building/device identity và discriminant agreement trước khi commit selected response; mismatch là error, không gán metric/sample cho selection khác. Không dùng stale catalogue hint để chọn AVC renderer.

### 6.3 Truncation uncertainty cho new branches

Existing `coverage.isTruncated` gộp source flag với reached-limit heuristic. Không rename/change Solar/AVC coverage behavior hoặc protected caveat text để sửa toàn hệ thống trong phase này.

Cho hai branch mới, add optional source metadata vào shared coverage (hoặc equivalent additive nested DTO được ghi rõ trong handoff):

```ts
sourceCount?: number | null;
sourceTruncated?: boolean | null;
```

- Emit explicit null cho absent metadata của new responses; preserve supplied true/false/count. Old responses có thể omit fields.
- `returnedCount = data.length`; valid/invalid counts phản ánh parser; `reachedLimit` là actual count đạt limit, không proof nguồn đã truncate.
- Có thể giữ compatibility `isTruncated = sourceTruncated === true || reachedLimit`, nhưng new UI **không** mô tả heuristic đó là upstream `truncated: true`.
- New raw coverage phân biệt: source true -> đã cắt bớt; source false -> nguồn báo không cắt bớt trong response; absent -> chưa có thông tin cắt bớt; reached-limit -> cảnh báo riêng đã đạt giới hạn. Không trường hợp nào được claim source retention/full historical completeness.
- New chart/history adapter sort bản copy khi cần; không mutate backend array, synthesize timestamps, fill gaps/zero hoặc merge overlapping ranges. Không backfill tự động khi truncated.

## 7. UI Architecture & Mockup Alignment

### 7.1 Reference và component ownership

Reference chính: **current aligned Page 07**, UI alignment plan/handoff và screenshot baseline Coding Agent chụp trước sửa. Full-shell reference `1842 × 1222`, Dashboard workspace bên phải High-Level rail `1778 × 1222`. Không dùng mockup numbers/IDs hoặc phục dựng typography/text cũ.

```text
DashboardShell / DashboardPageShell                         [read-only]
└── IotCataloguePanel                                      [existing ownership]
    ├── Page header + KPI strip + filters                  [read-only]
    ├── Catalogue 8-col / Gateway 4-col                    [preserve; existing summary callback]
    ├── IotDeviceTelemetryPanel                            [only supported-type/state dispatch]
    │   ├── Header + existing range/refresh/close controls  [reuse existing labels]
    │   ├── Provenance + common latest metadata cards      [reuse]
    │   ├── Solar/AVC existing detail branch               [preserve]
    │   └── New raw detail branch                          [sb/smoke only]
    │       ├── Raw caveat + raw latest fields
    │       ├── SB metric selector + raw trend
    │       ├── Bounded local history table
    │       └── Technical metadata + honest raw coverage
    └── Bottom support cards                              [read-only]
```

Prefer one small `IotRawTelemetryDetails.tsx` dispatcher with type-narrowed SB/Smoke content and a reusable local history table/helper. Không copy lại cả panel/provenance/state system. Existing Solar/AVC selector/technical components không cần mở rộng nếu new branch có thể isolated.

Hook order phải ổn định; không gọi hooks có điều kiện theo type. Pure metric/default/type guards có thể tách để test; không refactor entire catalogue controller hoặc shared card system.

### 7.2 Geometry và design tokens

| Region | Target / constraint |
| --- | --- |
| High-Level rail / Dashboard sidebar | Existing 64 px / 288 px desktop; không edit shell/drawer policy. |
| Header, 6 KPI, catalogue/Gateway, bottom row | Existing positions/gaps/grid; không đổi outer page geometry. |
| Selected panel | Full main-content width ở existing slot; `mt-6`, `p-5`, rounded-xl, border, internal gap khoảng 16 px; auto height, không chuyển sang side drawer. |
| Common latest metadata | Existing 2 columns, `sm` 4 columns nếu đủ width; 12 px card padding, no fixed height clipping. |
| SB raw sensor cards | 5 fields; desktop 3 columns/wrap, narrow 2 hoặc 1 theo available width; card padding 12 px, gap 12 px. Không thêm fleet KPI slots. |
| SB trend | Full panel width, existing `MetricTrendChart` height khoảng 260 px, autoFit; không add second chart library. |
| Smoke raw cards | 2 neutral cards cho status/state, stack trên narrow mobile; không severity palette. |
| Raw history | Full width internal horizontal scroll nếu cần; page size 20 loaded rows; body row khoảng 36–44 px, no full-page overflow. |
| Technical disclosure/coverage | Existing-density metadata 11–12 px, flexible wrap; footer thể hiện actual returned/valid/invalid/range/metadata uncertainty. |

Dùng current `--panel-bg`, `--panel-elevated`, `--border`, `--primary`, `--text-primary`, `--text-muted`, cùng dark/slate/teal tokens. Headings khoảng 14–16 px, labels 11–12 px, raw values monospaced/tabular. Không thêm global colors/font/dependency. Amber chỉ biểu thị **contract/data-quality caveat**, không smoke hazard state; raw code không tạo đỏ/cam nguy hiểm.

### 7.3 New branch labels và intentional necessary correction

New copy được phép:

- SB branch heading: `Dữ liệu thô · Smart Building (sb)`.
- SB fields: `CO₂ (raw)`, `VOC (raw)`, `voltage (raw)`, `visible (raw)`, `ir (raw)`; `f_cnt` ở technical/history, không hero packet metric.
- SB caveat: `Đơn vị và thang đo cảm biến sb chưa được xác nhận; các giá trị này chưa dùng để đánh giá IAQ hoặc cảnh báo.`
- Smoke heading: `Dữ liệu thô · Smoke`.
- Smoke fields: `status (mã thô)`, `state (mã thô)`.
- Smoke caveat: `Chưa xác nhận ý nghĩa mã status/state; không diễn giải thành bình thường, cháy hoặc sự cố.`
- History heading: `Bản tin đã tải`; pagination chỉ nói loaded rows, không total upstream history.
- New metadata labels: `Tên thiết bị trong mạng`, `Application ID`, `dev_eui`, `f_cnt` khi có; reuse recorded-time/Gateway/RSSI/SNR labels hiện tại.
- Missing field `—`, zero `0`; no placeholder unit hoặc synthetic normal status.
- New metric-empty/helper text nói không có giá trị field trong bản tin/khoảng đã tải. New empty source text không khẳng định thiết bị không phát bản tin nếu chỉ biết API không trả readings.

Necessary exception: unsupported branch description/phase note đang nói chỉ Solar/AVC phải đổi **chỉ tại branch đó**, ví dụ `Loại thiết bị này chưa có telemetry được hỗ trợ trên Dashboard.` Không rename existing unsupported title/control/page labels; không bổ sung NFC panel.

### 7.4 Type-specific detail behavior

**SB**

- Latest five raw values lấy cùng latest valid reading; timestamp chung rõ. Default trend metric `co2`; chọn card đổi local series, không fetch.
- Trend dùng normalized raw fields, no sensor unit suffix, no thresholds/IAQ colors/score. RSSI/SNR vẫn units documented; counter không nằm trong sensor selector.
- Reuse `MetricTrendChart` và existing non-mutating chart adapter nếu đáp ứng null/zero semantics; no interpolation/imputation, no synthetic gap samples. Metric không có finite points -> metric-empty state, không fake line.
- History table newest-first: recorded time, raw CO2/VOC/voltage/visible/IR, `f_cnt`; network/radio detail qua disclosure hoặc columns vừa đủ. Không room aggregation.

**Smoke**

- Hai neutral raw-code cards từ latest row, giữ arbitrary finite values, including zero.
- History table newest-first: recorded time, raw status/state, Gateway/RSSI/SNR; friendly name/application trong technical disclosure.
- **Không cần trend chart cho unconfirmed status/state codes trong phase này**: table giữ exact values/time mà không vẽ smooth transition hoặc hàm ý numeric severity. Không tạo alarm timeline, zone color, actuator action hoặc alert button.

**Cả hai**

- Existing 24h/72h/7d range, manual refresh, close/retry controls. Selection/range/refresh mới có thể fetch; metric/disclosure/history-page chỉ local.
- History phân trang client-side 20 rows trên returned bounded array; hiện loaded count và source-truncation caveat. Không thêm server pagination/cursor/export/backfill feature.
- Clear previous data/row/Gateway summary khi ID/range/scope đổi, panel đóng, source empty hoặc error; không gắn newest timestamp của device cũ vào device mới. Nếu giữ last successful snapshot lúc refresh cùng selection, phải visibly refreshing với fetchedAt cũ, không trình bày như fresh live sau failure.
- Reuse abort/generation guards; responses và callbacks stale không overwrite active selection, type, metric hoặc summary. Root callback chỉ thay tối thiểu nếu stability/selection identity thật sự cần; không rework filters.
- Rendering dựa response type; default metric reset đúng branch. NFC/unknown selection remains unavailable và không telemetry network call.
- Common sample có Gateway/RSSI/SNR được chuyển qua existing summary callback cho **đúng selected row**; chưa đọc các row khác vẫn `—`. Không suy gateway health/online từ sample.

### 7.5 Responsive/reference comparison/visual QA

- Desktop reference: giữ main rows và panel slot; new cards/history dùng flexible grid, không fixed page coordinates.
- `1280 × 800`: follow existing shell/controls wrap; không co Gateway/catalogue chỉ để nhét raw detail vào một cột.
- `390 × 844`: new cards stack/wrap, IDs và time có full accessible text, internal table scroll, không body horizontal overflow; controls đủ touch/focus target.
- Keyboard: existing selection/close/range/retry; new metric controls có button semantics/selected state, disclosure và pagination accessible; focus visible, labels/caveats không chỉ dựa màu.

| Reference/mockup item | Phase 11 decision | Contract reason |
| --- | --- | --- |
| Existing shell/header/KPIs/table/Gateway/support | Preserve current UI/text | Không có yêu cầu redesign hoặc field mới cho fleet health. |
| Selected detail panel | Add only raw branches in existing slot | Handoff cũ đề xuất drawer không override current source geometry. |
| Mockup IAQ/CO2/VOC/online/battery values | Không reuse làm live values, units hoặc thresholds | Schema/raw numeric field không đủ business interpretation. |
| Smoke alarm/severity presentation | Neutral raw cards + history, không hazard colors/chart | Numeric code dictionary còn pending. |
| Source room/floor/coordinates | Current metadata giữ nguyên | Không mapping sang room/zone/grid trong Small Phase 24. |
| Source unavailable | Honest unavailable/empty/error, không demo switch | Live endpoint có contract không đảm bảo populated samples. |

Chụp before/after tại reference viewport cho no-selection và Solar/AVC baseline, SB ready/empty/partial và Smoke ready/empty. Kiểm tra thêm error/truncation/mobile; xác nhận vùng ngoài selected-detail không thay label/style.

## 8. Implementation tasks theo thứ tự

### A — Baseline và scoped test fixtures

- Read authority/AGENTS/source, record Git/dirty files; preserve all Phase 10/stakeholder modifications, không reset/clean hoặc overwrite docs từ HEAD.
- Capture aligned Page 07 baseline bằng deterministic **test mocks**, không gọi IoT thật. Record pre-existing failures trước implementation.
- Build full + sparse + zero + unknown-code + empty + malformed + metadata/truncation fixtures cho cả hai source types; schema examples là test inputs, không production measurements.

### B — Client/model/normalization foundation

- Add `fetchSmartBuildingReadings` và `fetchSmokeReadings` (hoặc repository-consistent names), fixed GET paths, new raw interfaces và input validation.
- Implement parser policy §6, normalized field mapping, coverage/source meta, matching/sorting/latest-coherent-row; tests gọi actual implementation với mocked fetch/client.
- Add shared dispatch cases và discriminated variants; preserve existing types/categories/cache/input/output behavior. Không extract/rewrite toàn bộ Solar/AVC/NFC normalizers chỉ để tránh vài dòng lặp.

### C — Dashboard boundary và security

- Add two supported types trong current Dashboard service/DTOs/Swagger, keep same route/guards/caps/mode/error sanitization; verify resolved/output discriminant consistency.
- Add necessary duplicate-query validation và cold metadata checks tối thiểu; invalid input/no session phải không source call.
- Proxy inspect/test first; current route đã allowlisted, không expected allowlist edit. Bearer vẫn NestJS-only, app session vẫn cookie-based.
- Upstream 401 là sanitized dependency `502`, không app `401`/logout; unknown/not-found/disabled handling giữ đúng contract.

### D — Page 07 isolated raw branches

- Sync frontend types; add typed raw metric/row/metadata helpers, validate selected response before commit.
- Extend supported UI gate to four types và explicit renderer dispatch; preserve legacy branch copy/components. Không để generic non-Solar fallback trở thành AVC UI.
- Add raw detail component/history theo §7; use existing fetch/provenance/state/chart primitives, no extra polling/routes/libraries.
- Verify stale request/selected summary/reset semantics và cần thiết mới sửa minimal root callback. Không đổi catalogue/room/search/type/floor controls.

### E — Regression, facts và final handoff

- Complete test/visual/protected-diff matrix; narrow obsolete Phase 03 T09 và Phase 10 T26 assertions theo current authorized support, giữ guardrails cũ.
- Update KB current endpoint/source-availability facts in place, phân biệt implemented raw paths với deferred IAQ/fire interpretations; không thay runtime Page 03/01/11.
- Update roadmap completion chỉ khi acceptance verified; tạo matching handoff theo mục cuối. Không tự bắt đầu phase kế tiếp.

## 9. Acceptance / test matrix bắt buộc

Test IDs dùng `BP2-SP24-Txx`, không nhầm implementation Phase 11 với historical roadmap Small Phase 11.

| ID | Case | Expected evidence |
| --- | --- | --- |
| T01 | Both fixed client paths | Correct GET/query encoding/server-only bearer; exactly one type-specific request, no webhook/write method. |
| T02 | Trusted catalogue cache / cold detail | Right endpoint from source type; cache miss uses valid ID/type detail; browser hints cannot route. |
| T03 | Opaque IDs, friendly name different | Case-preserving stable join, no hex restriction; network name never key; mismatched reading ID skipped. |
| T04 | Full SB numeric reading | All five raw sensors + f_cnt + metadata preserved; no inferred units/battery/PDR/IAQ. |
| T05 | Smoke codes zero/negative/nonbinary | Exact numeric status/state; no boolean/alarm/severity conversion or hazard colors. |
| T06 | Zero, null, absence, sparse row | Zero renders 0; missing/null -> null/—; metadata-only ready distinct from metric-empty. |
| T07 | Wrong present field types / invalid row objects | No number/string/boolean coercion; partial skip/count, all-invalid nonempty -> sanitized 502. |
| T08 | Timestamp ordering/range/boundaries | Valid ISO, inclusive exact endpoints accepted, out-of-window rejected; newest-first normalized, latest coherent row. |
| T09 | Empty source / malformed envelope | Empty with live provenance/null latest; missing/nonarray data and supplied malformed meta -> 502, not demo. |
| T10 | Absent/{}/true/false meta, mismatched count | Optional source metadata and uncertainty preserved; actual coverage from array; mismatch caveat, not full-history claim. |
| T11 | At limit vs source truncation | Separate reachedLimit and sourceTruncated; no heuristic mislabeled upstream true, no auto backfill. |
| T12 | Invalid/repeated/array query, unknown keys, blank ID | Local 400 before source; direct HTTP + proxy exercise real ValidationPipe/multiplicity behavior. |
| T13 | Caps/presets/source mode | Dashboard 7d/1000 retained; shared 10000 unaffected; disabled/fixture honest unavailable, no 30d/custom/latest. |
| T14 | Detail 404 / malformed type / unknown / NFC | No synthetic device/endpoint; Dashboard NFC/unknown rejected and UI no fetch; shared NFC behavior preserved. |
| T15 | Upstream 400/401/5xx/timeout/bad JSON | Deliberate sanitized dependency status; no token/internal URL/raw stack; valid user session remains usable. |
| T16 | Viewer/Manager/anonymous/inactive auth | Both active roles read; app 401/403 before source for unauthorized; no role expansion/reseed or frontend-only security. |
| T17 | Direct/proxy placement writes | Existing PUT/DELETE denied for both roles; no new mutation proxy/API permission. |
| T18 | Response identity/discriminant mismatch | No unchecked cast/wrong selected device or AVC renderer; malformed response safe error. |
| T19 | Selected device/range/refresh network | Selected device only; no N+1/fleet/timer; metric/disclosure/local pagination zero source requests. |
| T20 | Rapid selection/range/scope change, close/unmount | Abort/generation guards; no stale rows/metrics/errors or Gateway/table callbacks; previous summary cleared appropriately. |
| T21 | Latest raw versus older populated row | Latest metadata and raw values from same row; missing latest not silently filled from older reading. |
| T22 | SB selector/trend | Correct fields/default, chronological non-mutating copy, zero preserved, missing metric empty, no units/threshold/gap fill. |
| T23 | Smoke/raw local history | Neutral exact codes/times; 20-row local pagination and loaded count; no smooth severity trend/extra reads. |
| T24 | Quality/provenance/refresh states | Ready/empty/error/unavailable/refresh distinct; observed/fetched/query bounds traceable; no stale data presented as new live. |
| T25 | Existing Solar/AVC/NFC regressions | Legacy source/DTO/selector/technical/metrics/ranges intact; shared NFC events not exposed on Dashboard. |
| T26 | Phase 23 catalogue/room regressions | Existing filters/empty isolation/count/labels unchanged; no rebuild/sync/floor-0 policy change. |
| T27 | Alert/persistence/frozen-page boundary | Raw data cannot change authoritative alert registry/badge/IAQ/fire state; no new entities/jobs/source mirror/page/domain. |
| T28 | Visual/responsive/keyboard/protected labels | Before/after screenshots, raw units/codes clear, existing labels/geometry intact; no body overflow or inaccessible controls. |
| T29 | Historical assertion updates | Phase 03 T09 supports four approved types but still no NFC/unknown fetch; Phase 10 T26 allows two newly approved GETs, still forbids webhook/upstream writes/secret leakage. |

Required evidence là **behavior tests trên actual services/helpers/HTTP/UI**, không chỉ `source.includes(...)`, comments hoặc duplicated parser logic trong test. Reuse Jest/Supertest/Node-test conventions; frontend pure helpers test thực, browser checks phải ghi actions/network/results. Không weaken tests chỉ để build xanh.

## 10. Changed-file allowlist và ownership

### Expected backend edits

- `backend/src/iot/dto/iot-telemetry.dto.ts`: new raw/normalized variants và additive coverage metadata.
- `backend/src/iot/services/iot-client.service.ts`: two fixed GET methods/new input checks; existing executor reused.
- `backend/src/iot/services/iot-telemetry.service.ts`: new dispatch/normalizers, narrow validation/helpers; legacy outputs preserved.
- `backend/src/dashboard/dashboard-iot-telemetry.service.ts`: new supported types/response handling/caveats, existing gates kept.
- `backend/src/dashboard/dto/dashboard-iot-telemetry-response.dto.ts`: additive types/Swagger; query DTO only if exact new-path validation requires it.
- `backend/src/dashboard/dashboard-iot.controller.ts`: telemetry Swagger description and narrowly needed raw-query multiplicity checks only; catalogue contract/guards unchanged.
- Relevant client/shared/Dashboard telemetry tests and focused mocked HTTP tests under `backend/test/`; small parser helper under current IoT domain if needed.
- `backend/openapi.json`: regenerate only from verified changed API docs, inspect diff for unrelated schema drift.

`dashboard-iot-catalogue.service.ts`, mapper/type registration, module/providers là inspect first, không expected rewrite. Chỉ minimal additive compile/registration fix nếu chứng minh cần; không change room/floor/cache/sync behavior. Database/entities/migrations, auth/CASL, Water/environment/alerts/PCCC modules không task phase này.

### Expected frontend edits

- `web/src/types/iot-telemetry.ts`, `web/src/types/dashboard-iot-telemetry.ts`: mirror additive normalized unions/coverage.
- `web/src/lib/dashboard/iot-telemetry-api.ts`: narrow selected-response validation if needed; same route/no-store/error convention.
- `web/src/components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx`: explicit type dispatch, new branch mount and necessary state handling/copy exception.
- New `web/src/components/dashboard/iot/IotRawTelemetryDetails.tsx`; optional small `IotRawTelemetryHistoryTable.tsx` in same folder if useful reuse.
- Small typed helper under `web/src/lib/dashboard/` for raw metric/history/default/response guard; existing chart adapter only additive backwards-compatible use if needed.
- `web/test-bp2-phase11.mjs` và `web/package.json` script `test:bp2:p11`; narrowly update Phase 03 T09 / Phase 10 T26 and other exact support-set assertions demonstrably obsolete.

Inspect/test first, not expected edits: `IotCataloguePanel.client.tsx` (only verified callback/selection bug), existing proxy (route already allowed), legacy selector/technical components, shared `MetricTrendChart` (new raw units can use empty unit prop). Không sửa global chart styling hoặc protected-page callers. Additive shared type compile fixes phải minimal, không Viewer/Unity presentation work.

**Không sửa** Page 07 header/KPI/table/filter/Gateway/bottom-card text/layout, shared shell/globals, demo fixtures, account/login UI, page route files hoặc pages khác. New sample callback có thể naturally populate existing selected row/Gateway without editing those components.

### Documentation sau implementation

- `web/doc/Dashboard_Knowledge_Base.md`: update actual raw support facts and corresponding current API summaries/backlog/source register/status in place. Remove stale statements that current contract lacks CO2/VOC fields or that documented Solar units are wholly unknown; preserve **deferred consumer implementation/semantics** and all frozen scope. This is facts maintenance, không permission to migrate Page 03 UI.
- `web/doc/dashboard_big_phase_small_phase_plan.md`: mark 24 complete only with evidence/handoff; 25 becomes ready for its qualified scope but business gates remain conditional. Phases 18/21 gates stay open; 27/W1/W2 not delivered.
- New matching handoff ở mục cuối. Không overwrite current stakeholder API handover bằng older snapshot hoặc tạo parallel KB. Contract drift phải report và hỏi nếu ảnh hưởng materially tới scope/parsing decisions.

## 11. Verification commands và runtime QA

Các commands dưới đây dành cho Coding Agent khi implement; **planning agent chưa chạy chúng**.

Trong `backend/`:

```bash
npm test -- --runInBand
npm run build
npm run test:e2e
```

Chạy full E2E chỉ trên configured isolated/disposable test environment; nếu suite hiện có ghi DB, không chạy vào production/user dataset. New-phase HTTP/auth/source tests dùng mocked IoT và session dependencies với real guards/ValidationPipe. Không require live upstream, account reseeding hoặc SQL writes để test raw integration.

Trong `web/`, tạo scoped script trước rồi chạy:

```bash
npm run test:bp2:p11
npm run test:bp2:p03
npm run test:bp2:p09
npm run test:bp2:p10
npm test
npm run lint
npm run build
```

- Existing aggregate `npm test` có thể dừng sớm ở historical failure; chạy relevant protected-page suites riêng nếu cần, report exact passed/failed/skipped counts. Không claim mọi suite passed chỉ vì script phase mới passed.
- Phase 10 handoff ghi pre-existing Phase 02 `BP2-P02-T22` và Phase 04 T05/T12 failures do stakeholder label/alignment. Reproduce/reclassify nếu cần nhưng không sửa stakeholder labels/Water để làm xanh.
- Update support-set assertions có evidence là authorized behavior change; preserve assertions về no NFC/unknown fetch, no upstream mutation/webhook/secret, ranges, no persistence và old metrics.
- Browser QA với existing Viewer/Manager sessions và **mocked IoT source**, `DEVICE_SOURCE_MODE=iot` path được exercised mà không thật sự gọi external source. Không hard-code sample data vào production UI.
- Screenshots: `1842 × 1222` reference, `1280 × 800`, `390 × 844`; no-selection, Solar/AVC protected baseline, SB/Smoke ready/empty/error/partial/truncated states. Ghi actual evidence paths/results trong handoff.
- Real upstream GET chỉ khi stakeholder cấp phép riêng cho target environment. Nếu approved, chọn một known ID mỗi type, bounded minimum range/limit, không all-fleet sweep; nếu nguồn empty/unavailable vẫn report honest. Nếu không approval, ghi `NOT RUN`, không dùng Swagger zeros làm live evidence.
- No account seed/password reset, migrations, database-mutating identity audit, webhook receiver/test/register/update/delete hoặc source history persistence để verify phase này.
- Audit changed-file diff, protected labels, source load/outbound methods/secrets/new SQL trước handoff; `git diff --check` phải phân biệt pre-existing issues. Không format/lint-fix cả repository.
- Zero-persistence evidence phải trace integration code/repository calls hoặc relevant spies; row-count snapshot alone không chứng minh không có UPDATE. Existing auth/session access không được nhầm với new raw-domain persistence.

## 12. Exit criteria

- [ ] Fixed `sb`/`smoke` GET integration hoạt động qua existing trusted backend dispatch; malformed local input/no session không gọi source.
- [ ] Typed runtime parsing/identity/range/zero/sparse/partial/meta semantics verified; unsupported types không bị đoán route.
- [ ] Dashboard/frontend additive contracts consistent; Page 07 shows qualified raw detail cho cả hai types và honest empty/unavailable/error states.
- [ ] Selected sample metadata/callback/latest raw values coherent; race/scope/type changes không cross-contaminate readings.
- [ ] SB raw trend và Smoke exact-code history không invent units/alarms/health; local actions không thêm source calls.
- [ ] Existing Solar/AVC/shared NFC, catalogue/room filters, Viewer/Manager read policy và placement-write denial không regress.
- [ ] No protected-page/text/layout changes ngoài exact allowlist/copy correction hoặc documented verified blocking bug.
- [ ] No report/alert/raw PostgreSQL persistence, webhook operation, grid mapping, extra page/role/account, polling hoặc full-history claim.
- [ ] Test/visual/security evidence ghi honest, including failures/skips/live GET not run; KB/roadmap facts updated in place.
- [ ] Matching implementation handoff created before claiming complete.

## 13. Sau phase này — không implement tiếp trong cùng task

- Small Phase 25 dùng shared raw SB boundary cho Page 03 source upgrade/conditional room/grid migration; units, quality, room mapping và business rules vẫn gate riêng.
- Small Phase 18 có thể reuse raw smoke detail sau phase 17; detector-zone mapping, code dictionary, severity/latching/freshness chưa được phase 24 xác nhận.
- Page 02 Energy demo 26, PCCC manual CRUD 17 và cross-page integration 20 vẫn scope riêng.
- Report/alert PostgreSQL 21 vẫn last implementation phase; acceptance 22 theo sau. Webhook inspection 27 optional; mutations/receiver W1/W2 vẫn HOLD.

## 14. Bắt buộc tạo handoff file ở cuối implementation

**Coding Agent: chỉ implement Small Phase 24 theo plan này; sau khi triển khai và verify, bắt buộc tạo `web/doc/bp2_phase11_page07_sb_smoke_raw_telemetry_handoff.md` trước khi báo hoàn thành hoặc bắt đầu phase khác.**

Handoff phải ghi mapping **Big Phase 02 / Phase 11 / Small Phase 24**, Git/runtime/dirty-worktree baseline, delivered/deferred scope, exact changed files, source routing/identity/parser/sparse/meta decisions, latest/coherence/truncation policy, new UI ownership, necessary unsupported-copy/test changes, test commands/results và tests chưa chạy, before/after visual evidence, protected-page/text audit, auth/error/no-new-persistence/no-webhook audit và external gates còn mở. Không claim raw CO2/VOC đã có units/compliance/alerts, smoke đã là authoritative fire state hoặc PostgreSQL report/alert/webhook delivery đã hoàn thành. Update roadmap status chỉ từ evidence đó.
