# Big Phase 02 — Phase 10: Device Catalogue Contract Upgrade

> **Project:** GIS — UIT Building E Digital Twin
> **Loại tài liệu:** Kế hoạch Markdown bàn giao cho Coding Agent
> **Ngày lập:** 2026-10-02
> **Trạng thái:** PLAN ONLY — CHƯA IMPLEMENT
> **Roadmap mapping:** Small Phase **23** — Updated device catalogue/filter contract and source-semantic reconciliation
> **Implementation sequence:** Phase **10**, tiếp theo Phase 09 / Small Phase 16; không đổi ID các Small Phase cũ
> **Trang trực tiếp bị ảnh hưởng:** Page 07 — Hệ thống IoT (`/dashboard/iot`)
> **Primary targets:** NestJS IoT/catalogue contract, Page 07 room filter/source metadata, contract tests và documentation
> **Phụ thuộc đã có:** Small Phases 10, 11, 16 và UI alignment đã có implementation handoff

---

## 1. Mục tiêu và quyết định scope

Nâng cấp integration hiện hữu theo `IoTBackend_API_HandOver.md` ngày 2026-10-02, API `1.5.1-beta`, **không xây lại Page 07**:

1. Hỗ trợ filter phòng nguồn cùng filter tầng trên catalogue application API.
2. Bảo toàn `install_room_id` nullable/absent và location metadata của list/detail; giữ compatibility với detail lịch sử thiếu room/height.
3. Giữ query đúng scope, provenance và hành vi empty/error; không dùng response của một phòng thay cho toàn tầng.
4. Thêm room filter nhỏ và room metadata trong technical disclosure hiện có, cùng design tokens/layout mới đã triển khai.
5. Đồng bộ mô tả Solar/AVC đã được API xác nhận; không suy diễn thêm calibration, trạng thái, daily consumption hoặc alert rules.
6. Verify bằng mock/contract/HTTP/browser tests và tạo implementation handoff.

**Planning agent chỉ tạo tài liệu này. Không implement code, chạy migration, tạo account hoặc gọi API upstream trong lượt lập plan.** Các bước dưới đây là công việc cho Coding Agent trong lượt triển khai được giao riêng.

Không có quyết định stakeholder mới cần chốt để lập plan này. Room filter là control bổ sung trong Page 07 hiện hữu, không phải page/layout mới; dùng UI đang chạy và handoff alignment làm reference, nên không cần mockup mới. Nếu Coding Agent thấy cần redesign, dừng phần redesign và hỏi stakeholder, không tự mở rộng scope.

## 2. Authority và required reading

Thứ tự xử lý xung đột:

1. Yêu cầu stakeholder mới nhất: plan only, bảo toàn text/labels đã chỉnh, không thay các page đã hoàn thành nếu không thật sự cần, PostgreSQL report/alert vẫn ở Small Phase 21.
2. `Dashboard_Knowledge_Base.md` cho frozen Dashboard scope, DataMode, CASL và Interactive 2D Grid.
3. `IoTBackend_API_HandOver.md` cho exact API contract; bản 2026-10-02 và §3.6 thắng unit/availability wording cũ.
4. Repository/runtime evidence cho implementation hiện tại; handoff là snapshot, không phải code hiện hành.
5. Plan này cho allowlist và acceptance của Small Phase 23.
6. Mockup/plan UI cũ chỉ là visual reference. Text trong repository hiện tại thắng text trong mockup/handoff cũ.

Coding Agent phải đọc trước khi sửa:

- `web/AGENTS.md`; relevant bundled Next.js docs dưới `web/node_modules/next/dist/docs/` trước khi viết web code.
- `web/doc/Dashboard_Knowledge_Base.md` và `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phase 23.
- `web/doc/IoTBackend_API_HandOver.md`: §§0–6, 11–13, 16–18, 21, 23–26; đọc §§30–32 để hiểu những capability **không** triển khai ở phase này.
- `web/doc/bp2_phase02_dashboard_application_api_real_device_catalogue_handoff.md`.
- `web/doc/bp2_phase03_page07_live_telemetry_core_handoff.md`.
- `web/doc/bp2_fix_align_UI.md` và `web/doc/bp2_fix_align_UI_handoff.md`.
- `web/doc/bp2_phase09_minimal_identity_casl_foundation_handoff.md`.
- Current client/mapper/catalogue DTOs, Page 07 source, proxy, tests và auth/CASL boundary được liệt kê ở mục 10.

Không hỏi lại `room_id`, `install_z` hay Solar units đã có contract. Các câu hỏi về grid mapping, `sb` units và smoke codes thuộc phase sau, không block phase này.

## 3. Baseline đã kiểm tra và protected work

### 3.1 Repository snapshot lúc lập plan

- Branch: `feature/dashboard`; HEAD: `7b15a13`. Phải re-audit khi bắt đầu implementation.
- Pre-existing modifications: `GISUIT.code-workspace`, `web/doc/IoTBackend_API_HandOver.md`, `web/doc/dashboard_big_phase_small_phase_plan.md`. Không revert, overwrite từ HEAD, clean hoặc stage unrelated work. API handover chứa cập nhật stakeholder phải được giữ nguyên.
- `IotClientService.fetchRawDevices()` hiện chỉ serialize `floorLevel`; device list/detail GET đã có. Không tạo client thứ hai.
- `DashboardIotCatalogueQueryDto` hiện chỉ nhận `floorId`; catalogue service nhận building/floor và đọc source trong RAM, không dùng repository để persist.
- Page 07 catalogue DTO hiện giữ X/Y/Z/floor, identity/type/activity/timestamps nhưng chưa giữ room ID.
- List validation đã yêu cầu finite X/Y/Z và integer floor; `install_z=0` đã hợp lệ. Không triển khai lại toàn bộ Z support.
- Detail DTO/client đã cho phép historical omissions; tests có detail thiếu Z, source timestamps hoặc meta. Compatibility này phải được ghi rõ và giữ, không biến fixture lịch sử thành current contract.
- Shared viewer mapper hiện có development floor/coordinate policy. Không đổi policy hoặc áp field description mới thành Unity axis mapping.
- Page 07 có floor/type/search controls, request-generation guard, technical disclosure và KPI lấy count của catalogue đã load. Room filtering chưa có.
- Small Phase 16 đã implement local identity/session và CASL; Viewer/Manager cùng được đọc Dashboard và cùng bị chặn device display-position update/delete. Không tạo lại account, reset password hoặc sửa role matrix.
- Shared `IotTelemetryService` hỗ trợ `solar`/`avc`/`nfc`; Dashboard telemetry hỗ trợ `solar`/`avc`. `sb`, smoke và webhook execution không thuộc phase này.
- Dashboard KB còn một số đoạn API/auth facts cũ mâu thuẫn với handover/identity handoff; cần cập nhật facts in place, không thay page requirements.

Baseline chưa chạy app/test/live GET trong lượt lập plan. Không coi mô tả Swagger hoặc test/handoff lịch sử là verification mới.

### 3.2 No-touch rule bắt buộc

**Không quay lại Page 01 Overview, Page 02 Water/Energy, Page 03 Environment, Page 06 Alerts, Page 09 Parking hoặc Page 11 PCCC để đổi text, label, dịch thuật, fixture, chart, calculation hoặc layout.** Stakeholder đã tự chỉnh nội dung; không khôi phục wording từ plan cũ.

Page 07 chỉ được thay đúng controls/metadata/scope handling trong plan này. Giữ header, KPI titles, table column titles, trạng thái hiện tại như `Trực tuyến trong API`, telemetry metric labels, Gateway/bottom cards và existing unavailable content. Không sửa labels để đồng bộ tên gọi cho đẹp hơn.

Ngoại lệ có giới hạn:

- Thêm copy mới cho room filter, source-room metadata, scope hint và room-specific validation/empty state là cần thiết cho feature mới.
- Sửa đúng Page 07 backend provenance caveat đang phủ nhận Solar/AVC meanings đã được §3.6 xác nhận; phải giữ caveat về state/flags/reset/calibration còn mở.
- Shared DTO/mapper có thể thêm room metadata theo cách additive; không đổi output/behavior của existing fields.
- Bug fix ngoài allowlist chỉ khi đã tái hiện và thật sự block feature/verification này. Ghi exact cause, minimal diff và regression evidence; nếu cần materially broader change, hỏi stakeholder trước. Unrelated pre-existing failures phải ghi riêng, không tự mở rộng phase để sửa.

## 4. In scope / out of scope

### 4.1 In scope

- Optional room filter trong existing Dashboard catalogue route và existing upstream devices GET.
- Shared source-location types/runtime validation cho nullable/absent room và historical detail height.
- Additive propagation qua Dashboard DTO/frontend types và shared floor-view DTO nơi cần giữ metadata; không chỉnh Unity code.
- Page 07 room filter, filter scope hint và technical room disclosure; state/cancellation handling cần thiết cho query mới.
- Current Solar/AVC field documentation và Page 07 provenance caveat corrections; giữ raw field names và numeric values.
- Mocks, controller validation/auth integration, Page 07 interaction/visual regression và scoped documentation update.

### 4.2 Out of scope

- Không gọi/thêm client methods `/sb`, `/smoke`, webhook list/detail hoặc bốn webhook mutation/test operations: thuộc Small Phases 24/27 hoặc HOLD.
- Không thêm room-to-grid/device-to-zone mapping, room catalogue, layout editor, floor-plan inference hay calibration model.
- Không đổi floor support 4/6 hiện tại, đoán `G -> 0`, suy tọa độ Unity, sửa display overrides hoặc mở quyền placement writes.
- Không chuyển Page 03/01 sang live CO2/VOC, bật compliance/alert evaluator/menu badge hoặc nhập liệu cấu hình.
- Không sửa Water daily consumption, counter logic, Energy demo, PCCC CRUD/grid, Parking hoặc notification delivery.
- Không thêm PostgreSQL entities/migrations/columns, sync job, catalogue/report cache table, alert persistence hoặc raw TSDB mirror. Catalogue đọc trong RAM; report/alert persistence vẫn ở Small Phase 21.
- Không đổi auth provider/session/roles, tạo account mới, chạy seed/reset hoặc bật Admin/Editor/`manage/all`.
- Không cài package/runtime-schema/chart library mới nếu convention hiện có đáp ứng task.
- Không tạo route/page mới hoặc generic proxy, không đổi global CSS/shell để phục vụ một input.

## 5. Contract và quyết định implementation đã chốt

### 5.1 API boundary

```text
Page 07 / same-origin Next.js proxy
    -> authenticated NestJS Dashboard catalogue GET
    -> reused IotClientService devices list/detail GET
    -> source metadata + live provenance in memory
```

Room filter mở rộng **route hiện hữu**, không thêm endpoint:

```http
GET /api/v1/dashboard/buildings/E/iot/devices
GET /api/v1/dashboard/buildings/E/iot/devices?floorId=4
GET /api/v1/dashboard/buildings/E/iot/devices?roomId=E4.08
GET /api/v1/dashboard/buildings/E/iot/devices?floorId=4&roomId=E4.08
```

`E4.08` ở đây chỉ là fixture/query example, không chứng minh một phòng thật tồn tại.

Same-origin browser path vẫn là `/api/devices/dashboard/buildings/E/iot/devices`. NestJS đổi application `roomId` thành upstream `room_id`; `floorId` vẫn qua centralized mapper thành `floor_level`.

### 5.2 Filter ownership và validation

| Input | Ownership / quyết định |
| --- | --- |
| `buildingId` | Existing route path, Building E only; giữ validation hiện hữu. |
| `floorId` | Application floor ID; giữ current mapping và `G` rejection. Không expose raw `floor_level` cho browser. |
| `roomId` | Optional scalar string, trim leading/trailing spaces, preserve case; exact source-room filter. Có thể dùng riêng hoặc cùng floor. |
| Type và device-ID search | Local frontend filters trên dataset đã load; không phát sinh upstream query khi typing/chọn type. |

Validation bắt buộc:

- Omitted `roomId` là không filter phòng. HTTP `roomId=` hoặc chỉ có spaces phải trả `400`, **không** silently omit.
- Repeated room parameter, kể cả hai giá trị giống nhau, phải trả `400` trước upstream. Reject array/object/nested values; không convert array thành string hoặc chọn first/last.
- Preserve duplicate query values qua existing proxy để backend kiểm tra; dùng DTO và raw query multiplicity check nếu query parser có thể collapse duplicates. Không chỉ dựa trên TypeScript types.
- Unknown query keys tiếp tục bị global whitelist/forbid rejection. Browser route không nhận upstream `room_id`, `floor_level` hoặc client-selected endpoint/type.
- Low-level `IotDeviceListFilter` thêm `roomId?: string`, vẫn validate runtime. Optional `floorLevel` phải là integer, chấp nhận số âm, không tự thêm min/max upstream. Giữ khác biệt: upstream `-1` hợp lệ không tự làm viewer basement trở thành supported.
- Serialize bằng query encoder; trim room một lần theo policy, không lowercase. Test special characters như `&`, `+`, unicode, `/` trong room query để bảo đảm đó là một value, không query/path injection.
- Keep existing callers không truyền room hoạt động như cũ. Có thể thêm optional third `roomId` argument vào `getCatalogue(buildingId, floorId?, roomId?)`; không buộc Water/Environment callers đổi signature hay fetch behavior.

Frontend adapter thêm `roomId?: string | null`: `null`/`undefined` cố ý omit. Explicit blank string là invalid; room-clear UI phải chuyển thành no-filter sentinel, không gửi `roomId=`. Không debounce/autofetch từng ký tự.

### 5.3 List/detail source metadata và compatibility

Additive normalized fields:

```ts
// Add to existing sourceLocation; all current fields remain unchanged.
roomId?: string | null;

// Add to catalogue envelope; backend emits the effective filter.
requestedRoomId?: string | null;
```

- `requestedRoomId` output là normalized applied room hoặc `null`; backend luôn emit ở response mới. Frontend cho phép missing để đọc older fixtures/responses; không nâng `schemaVersion` chỉ vì additive optional fields.
- Source `install_room_id: string` -> `sourceLocation.roomId` giữ nguyên source string/case; source `null` -> `null`; absent -> omitted. Không trim/rewrite raw source metadata như thể backend đã sửa registry.
- Có string rỗng trong source payload thì giữ raw string; UI có thể hiển thị missing/unset thay vì đặt tên phòng giả. Khác với **query** room rỗng, phải bị reject.
- Invalid present room value như number/object là malformed metadata, không coerce thành string. Dashboard giữ existing skip/quality summary; mixed valid/invalid rows giữ phần valid với caveat, all-malformed nonempty list trả sanitized `502`.
- Current list giữ existing strict finite X/Y/Z và integer floor policy. Missing list Z không biến thành `0`; không bật historical list compatibility tự động.
- Detail dùng cùng source-location field definition, nhưng giữ **explicit historical compatibility profile** cho metadata omissions đã được client tests hỗ trợ: room/Z có thể absent, metadata timestamps/meta có thể absent. Core known opaque device ID/type phải hợp lệ; optional fields nếu present phải đúng type. Không fabricate missing height/room/timestamp. Không siết detail thành current-list requiredness và làm hỏng type resolution callers cũ.
- Response-object requiredness là application parsing policy, không phải Swagger `required` guarantee. Ghi rõ current versus historical profiles trong tests/docs; không lấy snapshot 2026-09-21 làm fixture current list.
- Preserve optional `meta.count`/`meta.truncated`, `{}` và existing historical meta omission. `meta` nếu supplied phải là object, không array/null; missing truncation là unknown, không mặc định nguồn complete.
- Registry creation/update timestamps và local `fetchedAt` vẫn tách biệt. Không relabel registry update thành last transmission.
- Source X/Y/Z và room không thay display override/Unity placement. Room ID không được dùng làm grid-cell ID, online state hoặc key thay cho catalogue `device_id`.
- Unknown device types, bao gồm `sb`/`smoke`, vẫn là valid catalogue metadata. Không whitelist parser về ba type cũ; giữ unsupported telemetry behavior hiện hữu đến phase 24.

### 5.4 Floor-0 fallback và scope isolation

**Quyết định narrow cho branch mới:** khi có room filter, không áp development fallback từ requested floor sang upstream `0`. Empty floor+room phải là empty đúng scope; không đoán phòng nguồn thuộc floor khác.

| Query | Upstream query / fallback |
| --- | --- |
| Không floor/room | Full active catalogue như hiện tại; không fallback. |
| Chỉ floor | Existing mapped-floor query và existing explicitly labeled test floor-0 fallback, giữ nguyên. |
| Chỉ room | `room_id=<trimmed exact value>`; không floor guess/fallback. |
| Floor + room | Cả `floor_level` và `room_id`; empty trả empty sau một scoped GET, không gọi floor 0. |

Không đổi `IotService.getFloorDevices()` development fallback của viewer; chỉ branch room mới trong Dashboard có policy trên.

- Không đưa room-filtered result vào full-floor reconciliation/sync provider; không ghi `catalogue_sync_state` hay mark device ngoài phòng inactive/deleted.
- Không thêm catalogue cache hoặc TTL mới. Nếu implementation đụng existing request cache, key phải bao gồm exact building/floor/room scope, room case và source mode; không thay global/floor entry bằng subset.
- Existing device-type RAM map keyed by device ID không phải full-floor snapshot. Warm only valid returned IDs; không clear unrelated device entries khi load một phòng.
- `summary` và catalogue counts phản ánh dataset đúng scope, không upstream global population. Source truncation/partial-quality vẫn được hiển thị.
- `Cache-Control: no-store` và browser fetch `cache: 'no-store'` giữ nguyên. Authenticated catalogue reads không tạo domain/database writes.

### 5.5 Solar/AVC semantic reconciliation — không đổi business calculation

| Source field | Mô tả hiện tại được phép ghi vào contract metadata/docs |
| --- | --- |
| `solar.voltage` | Measured battery voltage, V. Không battery percentage. |
| `solar.temperature` | Ambient temperature, °C. Không tự khẳng định representative room/IAQ compliance. |
| `solar.humidity` | Relative humidity, %. Không tự bật compliance/alerts. |
| `solar.state` | Numeric status code; mapping vẫn unknown. |
| `avc.tag_source` | Ingestion pipeline/integration identifier. Không suy gateway/device identity từ nó. |
| `avc.fwd_volume_m3` | Cumulative forward normal-direction volume, m³. Không daily consumption. |
| `avc.rev_volume_m3` | Cumulative reverse-direction volume, m³. Reset/rollover vẫn unknown. |
| `avc.instant_flow_m3h` | Instantaneous flow at reading time, m³/h. Không leak/burst conclusion. |
| `avc.valve_open` | Numeric valve status, chưa có value mapping. Không boolean coercion. |

Implementation nhỏ nhất:

- Cập nhật existing raw DTO comments/Swagger field descriptions và contract fixtures/assertions theo table; không tạo generic metric framework hoặc thêm business DTO fields không cần thiết.
- Trong `DashboardIotTelemetryService`, thay đúng broad caveat về Solar/AVC unit/meaning pending bằng caveat còn đúng: state/flags, calibration/data quality, resets/daily derivation và `temp_c` ambient-versus-meter ambiguity. Ghi exact protected strings bị sửa trong handoff.
- Không rename normalized `rawVoltage`/`rawTemperature`/`rawHumidity`, không change numeric readings, hero/secondary labels, `pendingHardwareBadge`, ordering, coverage, range caps hay evaluator behavior.
- Không chỉnh Water/Environment runtime metadata/copy/semantic enums trong phase này; phần adapter promotion của Page 03 là phase 25. Shared unit documentation không tự migrate consumer nghiệp vụ.
- Không áp Solar units sang `sb` dù cùng field name `voltage`; không thêm `sb` fields hoặc smoke enums.

### 5.6 Security và error boundary

- Giữ `SessionAuthGuard`, `PoliciesGuard` và `read:Dashboard` cho catalogue. Viewer và Manager đều dùng room filter như read operation; không cần ability mới.
- Anonymous/inactive/invalid session bị `401` theo app-auth policy và không gọi IoT. Upstream bearer `401` là sanitized dependency `502`/existing integration handling, **không** làm user logout hoặc đổi thành app session `401`.
- Locally invalid query -> `400`, upstream `400` -> sanitized `502`; detail `404` -> existing not-found; source disabled/fixture/missing server credential -> `503`. Không synthesize device/room khi detail không tồn tại.
- Master token chỉ ở NestJS, không browser/Unity/response/log/Git/PostgreSQL. Không log raw Authorization hay raw upstream payload.
- Existing proxy catalogue GET đã allowlisted và forward raw search/application cookie. Chỉ edit proxy nếu chứng minh room query không đi qua đúng; không widen path/method allowlist hoặc sửa unrelated route behavior.
- Cả hai roles vẫn bị deny display-position PUT/DELETE, cả direct HTTP và proxy. Không thêm upstream methods ngoài devices GET cần thiết của phase.

## 6. UI Architecture & Mockup Alignment

### 6.1 Reference và hierarchy

Reference chính là **current Page 07 đã aligned**, `bp2_fix_align_UI.md` và handoff, không phục dựng text/số liệu của mockup. Baseline screenshot trước implementation: full shell `1842 × 1222`, workspace bên phải rail `1778 × 1222`.

Giữ ownership/hierarchy:

```text
DashboardShell / DashboardPageShell                 [read-only]
└── IotCataloguePanel                              [query + scoped state]
    ├── IotPageHeader                              [read-only]
    ├── IotKpiStrip                                [only new optional room scope hint]
    ├── Catalogue card
    │   ├── IotCatalogueFilters                    [add room draft/apply/clear wiring]
    │   ├── existing quality/scope notice           [preserve + applied-room context]
    │   └── IotDeviceCatalogueTable                [append source-room technical field]
    ├── Gateway card / telemetry panel             [existing behavior; no redesign]
    └── IotBottomSupportCards                      [read-only]
```

### 6.2 Geometry và tokens

| Region | Target cho phase này |
| --- | --- |
| High-Level rail / Dashboard sidebar | Existing 64 px / 288 px desktop; không sửa shell hoặc drawer breakpoint. |
| Header và 6 KPI strip | Existing positions/grid/heights. Chỉ thêm room scope hint nhỏ nếu filter đang active. |
| Main content | Existing `lg:grid-cols-12`, catalogue 8 / Gateway 4; card padding 20 px và current gaps giữ nguyên. |
| Filter row | Giữ title/pills bên trái; existing floor/type/search controls bên phải. Thêm room input + Apply trong cùng compact controls group, cho phép wrap. |
| Room input / Apply | Khoảng 150–190 px desktop cho input, max width 100% parent; height/padding giống existing `px-2.5 py-1.5` controls. Button không vượt text/control density hiện hữu. |
| Technical disclosure | Thêm source-room item vào existing responsive details grid; không thêm table column làm bảng rộng hơn. |

Dùng current CSS variables `--panel-bg`, `--panel-elevated`, `--border`, `--text-primary`, `--text-muted`, `--primary`; dark canvas/panel và teal accent hiện có. Controls text khoảng 12 px, metadata 11 px, rounded-lg, focus ring cùng dropdown/search. Không sửa `globals.css`, spacing toàn trang, chart palette hoặc typography shared.

### 6.3 New copy duy nhất và bảo toàn old copy

- New accessible room-input label: `Phòng nguồn`; placeholder: `Nhập mã phòng`.
- New room-submit action: `Áp dụng`; Enter cùng behavior.
- Existing `Xóa lọc` giữ nguyên label, mở rộng handler để clear applied/draft room.
- New technical field: `Phòng nguồn:`; unset/missing hiển thị `—`, không dùng demo room name.
- New scoped hint khi room active: `Phạm vi: [tầng nếu có] · Phòng [room]`, rendered as text, không HTML injection. Điều chỉnh separator khi không có floor; room value phải đúng applied query case.
- New room-validation copy chỉ cho invalid/blank explicit input. Empty-result copy phải nói đúng room/floor scope, không kết luận không có thiết bị toàn tòa nhà.
- Mọi old page/header/KPI/table/status text giữ nguyên. Không sửa `Trực tuyến trong API` thành một wording khác; backend vẫn không derive online từ `is_active`.

### 6.4 Interaction và scoped state

1. Tách `roomDraft` và `appliedRoom`. Typing chỉ thay draft; Apply/Enter trim/case-preserve rồi commit query, không fetch mỗi phím. Blank draft trong UI là deliberate clear: omit filter, không gửi query rỗng.
2. Floor change giữ reset local search/type behavior hiện tại, đồng thời clear draft/applied room và selected device/telemetry summary. Batch để chỉ fetch final intended scope.
3. Retry/refresh dùng applied room/floor, không draft chưa Apply. `Xóa lọc` clear floor/room/search/type theo existing UX, không double fetch. Local-only filter changes vẫn không gọi source.
4. Mỗi catalogue request có generation/scope identity; abort previous request và cleanup on unmount khi phù hợp. Response cũ không được overwrite room/floor, error, selected metadata hoặc quality state của scope mới.
5. Scope change phải clear selected telemetry/Gateway summary để không gắn sample cũ vào bảng phòng mới. Khi refresh cùng scope và giữ selection, lấy device object mới từ response theo ID, không giữ stale source-room metadata từ object cũ.
6. KPI và table count dùng loaded scoped catalogue. Khi room active, có scope hint visible gần first KPI và filter/card context để count của một phòng không bị hiểu là global building count. Không fetch thêm full catalogue chỉ để dựng global KPI.
7. Loading/error không hiển thị old-scope count/rows/room detail như live của scope mới. Keep ready/empty/unavailable/error/partial-quality distinction; không silently chuyển fixture/demo.

### 6.5 Responsive, reference comparison và intentional differences

- Desktop reference: room controls nằm trong current right-hand compact group; wrap nếu thiếu chỗ, không co table/support geometry để ép một hàng.
- Compact desktop/tablet: follow existing responsive layout/drawer; controls wrap theo nhóm có label và đủ touch/focus target.
- Mobile `390 × 844`: input/button không overflow; technical metadata wrap; bảng giữ existing horizontal scroll, không thêm toàn-page horizontal scrollbar.
- Keyboard: Tab tới input/Apply/Clear, Enter apply, disabled loading state và focus indication rõ. Scope/validation updates phải accessible, không chỉ dựa màu.

| Reference / mockup element | Phase 10 decision | Contract reason |
| --- | --- | --- |
| Existing page shell, header, KPIs, table, Gateway/support | Giữ current implementation/text | Page 07 đã aligned; không có yêu cầu redesign. |
| Original floor/type/search controls | Giữ, thêm room input/apply cùng group | New upstream exact room filter; không có rooms-list API để invent dropdown inventory. |
| Existing location/table columns | Không thêm column; room nằm technical disclosure | Giữ table density và tách source-room metadata khỏi verified floor/grid mapping. |
| Proposal device/online/firmware/battery numbers | Không dùng làm dữ liệu hoặc kỳ vọng test | Schema example/mockup không chứng minh live population/health. |
| Room-scoped catalogue | Scope hint/count và empty state rõ | Subset không phải full building/floor snapshot. |
| Coordinate descriptions mới | Chỉ preserve raw metadata | Chưa có units/Unity calibration; không đổi axes/placement. |

Intentional differences chỉ gồm room controls, source-room disclosure và scope hint. Chụp before/after để chứng minh các vùng khác không bị restyle; không cần tạo ảnh/mockup mới trong phase này.

## 7. Implementation tasks theo thứ tự

### A — Baseline và test harness

- Re-audit Git/AGENTS/source/handoff và capture Page 07 baseline tại reference viewport bằng mocked data ổn định.
- Chạy relevant baseline tests; phân loại lỗi pre-existing versus phase-induced. Không sửa unrelated failures.
- Xác nhận source modes, app query parser, no-store, auth guards và room-absent callers trước khi thay signature/types.

### B — Source types và narrow validation

- Add nullable/optional room fields vào current list/detail/location definitions, reusable parsing helper nếu thực sự cần tránh duplicate.
- Giữ strict list / compatible detail profiles khác nhau, optional meta semantics và skipped-record policy.
- Add tests trước/đồng thời implementation; không refactor entire client/mapper hoặc đổi floor/coordinate projection.

### C — Client filter và application API

- Add `roomId` validation/serialization vào reused `fetchRawDevices`/`listDevices`.
- Extend Dashboard query DTO/controller/Swagger và `getCatalogue` optional argument.
- Implement room-filter-specific no-floor-0-fallback, request echo/scope metadata và additive room propagation; no-room path giữ nguyên.
- Preserve guards, status/error sanitization, no-store và zero catalogue/report persistence.

### D — Source semantics, không mở business features

- Correct documented DTO comments/Swagger and Page 07 source caveats theo §5.5.
- Không sửa protected consumer adapters/business calculations/labels hoặc add sensor units chưa có contract.

### E — Page 07 additive UI

- Extend frontend types/API helper; preserve older room-absent responses.
- Add draft/apply room filter, effective scope hint, technical room field và scoped state/cancellation như mục 6.
- No changes to page shell/header/other widgets except exact additions allowlisted.

### F — Verification, facts và handoff

- Complete mục 8–9; audit protected diff và network/source load.
- Update existing Dashboard KB current facts, không tạo parallel KB. Exact source contract handover đã cập nhật; không overwrite nó bằng older definitions.
- Update roadmap Small Phase 23 completion chỉ sau verification; giữ 24/25 waiting/conditional đúng scope.
- Tạo matching implementation handoff ở cuối, ghi mọi gate còn mở.

## 8. Acceptance / test matrix bắt buộc

Test IDs dùng `BP2-SP23-Txx` để tránh nhầm implementation Phase 10 với roadmap Small Phase 10 cũ.

| ID | Case | Expected evidence |
| --- | --- | --- |
| T01 | No filter, floor-only, room-only, floor+room | Correct single upstream path/query; no undefined/blank serialization. |
| T02 | Room trim/case/special characters | Exact case preserved, encoded as one query value; no keystroke requests. |
| T03 | Empty/spaces/array/object/repeated identical or different room query | Authenticated local `400`, zero upstream calls, direct HTTP và proxy coverage. |
| T04 | Unknown query / raw upstream query fields | Whitelist rejection; no arbitrary path or raw-floor bypass. |
| T05 | Negative/zero integer floor at low-level client; float/NaN/string | Integers serialize, malformed reject locally; current viewer 4/6/G policy unchanged. |
| T06 | Current list/detail with string/null room and Z=0 | Room and zero height preserved; source/fetch timestamps remain distinct. |
| T07 | Historical detail missing room/Z/timestamps/meta | Explicit compatibility accepted, no defaults fabricated; current list still rejects missing Z. |
| T08 | Absent room in old list/frontend response | Compatible additive contract; no mandatory room migration or fake room. |
| T09 | Invalid room/coords plus valid rows; all malformed list | Existing skip/partial-quality summary; all-malformed -> sanitized `502`. |
| T10 | `{}` / absent historical meta / missing count or truncated | Tolerant documented policy; malformed supplied meta flagged; completeness not fabricated. |
| T11 | Opaque IDs, unknown/`sb`/`smoke` types | Valid catalogue records; no telemetry endpoint guess/new sensor read. |
| T12 | Floor-only empty test-mode query | Existing clearly labeled floor-0 fallback unchanged, source floor not rewritten. |
| T13 | Floor+room empty and room-only empty | Exactly one scoped upstream GET; no floor-0/full-catalogue fallback. |
| T14 | Room subset/cache/sync isolation | No PG repository/sync writes; no full-floor replacement/deactivation; unrelated RAM entries preserved. |
| T15 | Detail 404, upstream 400/401, timeout/malformed response | Correct sanitized dependency/not-found status, no token/host leakage. |
| T16 | Anonymous/invalid session vs Viewer/Manager reads | App `401` before upstream; both active roles may query room without new ability. |
| T17 | Upstream 401 with valid user session | Dependency error, session still usable; not logout/app auth failure. |
| T18 | Placement PUT/DELETE direct and proxy | Remain denied for both roles; no role/account/seed modifications. |
| T19 | Draft/Apply/Enter/retry/clear/floor change | Explicit scoped request count, no typing/type/search refetch or double fetch. |
| T20 | Old response arrives after room/floor change or unmount | Generation/abort prevents wrong rows/counts/metadata/errors/Gateway summary. |
| T21 | Selected-device refresh / scope change | Fresh response metadata on same-scope refresh, selection cleared on scope change. |
| T22 | Room-scoped count/empty/error/quality | Visible effective scope, no false global counts, no fake/demo fallback. |
| T23 | Solar/AVC documentation and caveats | Only confirmed descriptions corrected; numeric values/raw keys/calculations/code mappings unchanged. |
| T24 | UI baseline / responsive / keyboard | Before/after reference + mobile screenshots; existing labels/layout preserved, room controls accessible. |
| T25 | Seven pages and protected files | No added route, no protected-page code/fixture edits or new grid/calculation/persistence. |
| T26 | Allowed outbound methods and secret scan | No `sb`/smoke/webhook call, upstream mutation, arbitrary proxy or bearer exposure. |

Phải có behavior assertions, không chỉ `source.includes(...)`. Reuse existing Jest/Supertest and web Node-test conventions; frontend serialization/state logic nên tách pure helper để test thực tế, browser tests kiểm tra interaction/network. Không đưa real token vào fixtures.

## 9. Verification commands và runtime QA

Coding Agent chạy khi implement, **không phải commands đã chạy bởi planning agent**.

Trong `backend/`:

```bash
npm test -- --runInBand
npm run test:e2e
npm run build
```

Extend relevant `iot-client`, `iot-mapper`, catalogue and auth/authorization suites; add focused controller HTTP tests dùng real ValidationPipe/guards với mocked source/session dependencies. Không require production DB writes hoặc account reseeding chỉ để test query validation.

Trong `web/`, thêm scoped script `test:bp2:p10` cho phase này theo existing convention rồi chạy:

```bash
npm run test:bp2:p10
npm test
npm run lint
npm run build
```

- Không `--fix`/format toàn repo. Nếu full lint/test có pre-existing errors, report exact failures và targeted verification; không claim full pass hoặc sửa unrelated pages để làm xanh test.
- Browser QA với authenticated Viewer và Manager, mocked finite dataset có room/string/null/absence/empty/truncated/failure cases; check same-origin network queries và no new source polling.
- Screenshots: `1842 × 1222` reference, `1280 × 800` compact và `390 × 844` mobile. No-filter baseline phải giữ visual/text; active-room screenshots phải thấy scope + source metadata.
- Real upstream GET chỉ khi được stakeholder cấp phép riêng cho target environment. Dùng known catalogue IDs, minimum list/detail checks, không brute-force/all-fleet sweep. Nếu không có approval/token/source, ghi `NOT RUN`; mocked integration verification vẫn bắt buộc.
- Không gọi webhook test, đăng ký receiver, seed accounts, migrate database hoặc persist IoT source để kiểm thử.
- Audit `git diff --check`, changed-file allowlist, secrets, SQL/entity additions, outbound methods và protected labels trước handoff.

## 10. Changed-file allowlist và ownership

### 10.1 Expected backend edits

- `backend/src/iot/dto/iot-devices.dto.ts`: room filter/location/source DTO extensions.
- `backend/src/iot/dto/iot-telemetry.dto.ts`: shared detail-location compatibility/type documentation và Solar/AVC comments; không change raw reading/calculation contract.
- `backend/src/iot/services/iot-client.service.ts`: room serialization/validation, narrow detail validation if needed; no new upstream methods.
- `backend/src/iot/services/iot-mapper.service.ts`: additive raw room propagation only; coordinate/floor/category behavior unchanged.
- `backend/src/dashboard/dto/dashboard-iot-catalogue-query.dto.ts`: scalar room validation.
- `backend/src/dashboard/dto/dashboard-device-catalogue-response.dto.ts`: additive source room/requested scope.
- `backend/src/dashboard/dashboard-iot.controller.ts`: catalogue query/Swagger only; existing telemetry endpoint/guards untouched.
- `backend/src/dashboard/dashboard-iot-catalogue.service.ts`: narrow query/map/fallback/scope logic.
- `backend/src/dashboard/dashboard-iot-telemetry.service.ts`: **only** documented source caveat corrections from §5.5, no telemetry logic changes.
- Relevant `backend/src/iot/tests/*`, `backend/src/dashboard/tests/*`, focused `backend/test/*` tests; small shared validator helper only if justified.

Không sửa `backend/src/database/**`, managed catalogue provider/sync, auth/CASL implementation, Water/Environment/Alert services, source reading calculations hoặc `IotService` viewer fallback. Nếu additive location type gây compile issue ở existing consumer, giải quyết tối thiểu ở shared type, không redesign consumer.

### 10.2 Expected frontend edits

- `web/src/types/dashboard-iot.ts`; `web/src/types/iot-devices.ts` nếu cần additive shared location type consistency.
- `web/src/lib/dashboard/iot-catalogue-api.ts`; small pure room/scope helper nếu cần behavior tests.
- `web/src/components/dashboard/iot/IotCataloguePanel.client.tsx`.
- `web/src/components/dashboard/iot/IotCatalogueFilters.tsx`.
- `web/src/components/dashboard/iot/IotDeviceCatalogueTable.tsx`: append source-room technical field only.
- `web/src/components/dashboard/iot/IotKpiStrip.tsx`: optional active-room scope hint only, không title/card restyle.
- New `web/test-bp2-phase10.mjs`, relevant existing catalogue regression assertions và `web/package.json` script wiring only.

Existing `web/src/app/api/devices/[...path]/route.ts` là **inspect/test first**, không expected edit: catalogue path/query/cookie forwarding đã có. Nếu exact new room feature buộc minimal change, document why và keep allowlist/auth safety. Không nới proxy vì một unrelated endpoint failure.

Không sửa `globals.css`, shared shell/account controls/login/route trees, Page 07 header/Gateway/bottom/telemetry UI, các page khác, demo fixtures hoặc Unity source.

### 10.3 Documentation edits sau implementation

- `web/doc/Dashboard_Knowledge_Base.md`: update current API summary/filter/location and Solar/AVC facts; remove stale authentication-not-implemented statements based on phase 16 handoff. Distinguish documented `sb`/smoke/webhook capability from not-yet-implemented phase 24/27 and their open semantics; không bật requirement/runtime nào mới.
- Update affected current sections/backlog/source register/decision log/version in place, không chỉ append delta và không tạo KB v2 song song. Keep source confirmation pending về calibration/state/reset/grid/persistence.
- `web/doc/dashboard_big_phase_small_phase_plan.md`: evidence-backed Small Phase 23 status/handoff link; không mark 24/25 complete hoặc đổi persistence sequence.
- New matching handoff file ở mục 14. Không overwrite stakeholder-updated `IoTBackend_API_HandOver.md` bằng snapshot cũ; nếu thấy contract drift, report evidence và dừng affected branch chờ hướng dẫn.

## 11. Exit criteria

- [ ] Existing authenticated catalogue API supports valid omitted/floor/room/combined filters và rejects malformed/repeated room input before source calls.
- [ ] Current room/location metadata preserved; list Z policy and historical detail compatibility explicitly tested, không fabricate room/height.
- [ ] Room queries giữ exact scope, no floor-0 fallback or sync/database side effects; existing no-room behavior preserved.
- [ ] Page 07 room filtering/disclosure/scope/count/state hoạt động theo existing aligned UI, no unnecessary stakeholder text/label changes.
- [ ] Source-semantic docs/caveats reflect §3.6; no stronger state/reset/calibration/compliance/alert claim or numeric calculation change.
- [ ] Viewer/Manager read boundary và placement-write denial giữ nguyên; upstream errors không gây session logout.
- [ ] No PostgreSQL/source mirror/jobs, new telemetry/webhook integration, extra page/role/account or Unity mapping changes.
- [ ] Test/visual/security/protected-diff evidence recorded honestly, including failures/skips and real GET not run when unapproved.
- [ ] Dashboard KB/roadmap facts updated in place và implementation handoff created.

## 12. Còn chờ sau phase này

- Small Phase 24: raw `sb`/smoke client, typed dispatch và Page 07 raw detail.
- Small Phase 25: Page 03 source upgrade/confirmed Solar promotion và conditional room/grid live business adapter.
- Source room reliability, `G` mapping, coordinate calibration, `sb` units, smoke code/zone mapping và cadence vẫn open; phase 23 không đóng những gate này.
- Manual PCCC 17, PCCC grid 18, Energy demo 26, integration 20 giữ task boundary riêng.
- Report/alert PostgreSQL 21 vẫn last implementation phase; acceptance 22 theo sau. Webhook inspection 27 optional; mutation/receiver W1/W2 vẫn HOLD.

## 13. Ghi chú cho Coding Agent

Chỉ làm Small Phase 23 theo allowlist này. Nếu source đã drift, xác định phần còn thiếu và giữ existing completed work, không reimplement từ historical plan. Tài liệu/ảnh là reference, không phải permission cho các external writes hoặc task phase kế tiếp.

Đặc biệt: **không quay lại các page đã implement để sửa text/labels không cần thiết**; chỉ sửa khi plan nêu exact necessary addition/correction hoặc verified blocking bug, với protected-change audit trong handoff. Mọi UI mới phải hòa vào current aligned UI, không kéo page về old UI.

## 14. Bắt buộc tạo handoff file ở cuối implementation

**Coding Agent phải tạo `web/doc/bp2_phase10_page07_device_catalogue_contract_upgrade_handoff.md` sau khi triển khai và verify Small Phase 23, trước khi báo hoàn thành hoặc bắt đầu phase tiếp theo.**

Handoff phải ghi mapping **Big Phase 02 / Phase 10 / Small Phase 23**, implementation commit/runtime baseline, delivered/deferred scope, exact changed files, source/API/filter/compatibility/fallback decisions, test commands/results và tests chưa chạy, before/after UI evidence, protected-page/text audit, zero-new-persistence/security audit, known pre-existing failures và remaining external gates. Update roadmap status chỉ theo evidence đó; không claim telemetry `sb`/smoke, grid mapping, PostgreSQL report/alert hoặc webhook delivery đã hoàn thành trong phase này.
