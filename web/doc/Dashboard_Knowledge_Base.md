---
document_id: GIS-UIT-DASHBOARD-KB
filename: Dashboard_Knowledge_Base.md
version: "1.0.0"
compiled_on: "2026-09-25"
language: vi
project: "GIS - UIT Building E Digital Twin"
audience: "Project owner, ChatGPT/Work Mode, planner agents, coding agents, QA agents"
authority_scope: "Dashboard Big Phase requirements, dashboard architecture, dashboard data modes, dashboard implementation constraints"
source_policy: "Latest explicit stakeholder decision for Dashboard wins. Exact IoT API contract remains governed by IoTBackend_API_HandOver.md. Repository/runtime evidence wins for implementation status."
application_stack: "Next.js + NestJS + PostgreSQL + Unity WebGL"
authorization_library: "CASL"
chart_library: "ant-design-charts"
iot_api_master_source: "IoTBackend_API_HandOver.md"
repository_verified_in_this_compilation: false
live_iot_api_verified_in_this_compilation: false
status: CURRENT
---

# Dashboard_Knowledge_Base

> **Vai trò của tài liệu:** nguồn master duy nhất cho **Dashboard Big Phase** của dự án GIS - UIT Building E Digital Twin. ChatGPT, Work Mode, planner agent và coding agent phải đọc file này trước khi lập kế hoạch hoặc sửa code Dashboard.
>
> **Single-source rule:** luôn duy trì đúng **một** file `Dashboard_Knowledge_Base.md`. Khi requirement/API/implementation thay đổi, cập nhật file này **in place**; không tạo `v2`, `v3`, delta file hoặc knowledge base song song.
>
> **Ranh giới authority:** file này là master cho Dashboard. `IoTBackend_API_HandOver.md` vẫn là master cho **exact IoT API contract**. `Project_KnowledgeBase.md` vẫn là master cho kiến trúc và bối cảnh toàn dự án ngoài Dashboard.

---

## 0. Đọc trước trong 2 phút

| Chủ đề | Quyết định hiện hành |
| --- | --- |
| Big Phase Dashboard | Chỉ làm Page **01, 02, 03, 06, 07, 09, 11**. |
| Out of scope | Page **04, 05, 08, 10** bị loại khỏi Big Phase hiện tại. Không tạo placeholder/module/backend domain cho chúng nếu không có decision mới. |
| Frontend | Dashboard nằm trong **Next.js**. Không xây một dashboard application riêng. |
| Backend | **NestJS** chịu logic nghiệp vụ, data normalization, report generation, alert evaluation, authorization enforcement và API cho frontend. |
| Database | **PostgreSQL** lưu dữ liệu ứng dụng, report data được chọn/tổng hợp, alert configuration, dữ liệu PCCC nhập tay và các dữ liệu Dashboard được quyết định lưu. |
| Unity | Unity WebGL tiếp tục là Digital Twin viewer của dự án. Riêng **Page 01 Dashboard** không dùng interactive BIM 3D trong proposal; panel đó được thay bằng **Interactive 2D Grid**. |
| IoT upstream | Next.js/Unity không gọi IoT backend trực tiếp. NestJS dùng contract trong `IoTBackend_API_HandOver.md`. |
| DataMode | Chuẩn hóa thành `live`, `derived`, `manual`, `demo`. Không được trình bày dummy như dữ liệu thật. |
| Authorization | Dùng **CASL** cho authorization/ability. Cơ chế identity/login authentication cụ thể chưa được chốt bởi decision Dashboard này. |
| Chart | Dùng **ant-design-charts** cho chart của Dashboard. Không thêm chart library thứ hai nếu chưa có lý do và approval. |
| Alert | Threshold/baseline config lưu PostgreSQL; user có quyền phù hợp được chỉnh; NestJS đánh giá Warning/Danger. Có `alert_time_threshold`. |
| Report data | Approved principle: NestJS tạo dữ liệu report cần thiết từ upstream IoT/historical data rồi lưu PostgreSQL. Schema/job/TTL/retention sẽ được thiết kế trong Small Phase riêng. |
| IoT data chưa có | Trước tiên kiểm tra `IoTBackend_API_HandOver.md`. Nếu contract vẫn thiếu thì hỏi IoT team. Nếu cuối cùng không có dữ liệu, component được phép dùng **demo/dummy** theo rule của từng page. |

---

## 1. Quy tắc đọc tài liệu và mức authority

### 1.1 Thứ tự ưu tiên khi có khác biệt

1. **Decision trực tiếp mới nhất của stakeholder/project owner về Dashboard**, sau khi đã được cập nhật vào file này.
2. **`Dashboard_Knowledge_Base.md`** cho Dashboard scope, component, data mode và implementation constraints.
3. **`IoTBackend_API_HandOver.md`** cho method/path/query/response/error/field semantics của IoT backend.
4. **`Project_KnowledgeBase.md`** cho kiến trúc và quyết định toàn dự án.
5. Proposal/mockup/report cũ chỉ dùng làm visual/content reference nếu không mâu thuẫn decision mới.

### 1.2 Không được suy diễn sai trạng thái

Phân biệt:

- `DECIDED`: requirement/architecture đã chốt.
- `LIVE`: component dùng dữ liệu thật từ upstream/app source đã xác định.
- `DERIVED`: NestJS/app tính từ dữ liệu thật hoặc report data.
- `MANUAL`: user nhập/sửa dữ liệu ứng dụng, có authorization khi yêu cầu.
- `DEMO`: fixture/dummy data phục vụ deliverable/demo.
- `CONDITIONAL`: live nếu IoT team xác nhận dữ liệu; nếu không thì dùng demo theo rule đã chốt.
- `OPEN`: chưa có quyết định hoặc contract đủ để implementation chính xác.
- `DEFERRED`: có requirement nhưng thiết kế chi tiết chuyển sang Small Phase khác.
- `OUT_OF_SCOPE`: không làm trong Big Phase hiện tại.
- `UNVERIFIED`: chưa kiểm tra repository/runtime thật.

Một plan file, mockup, interface TypeScript hoặc migration draft **không tự chứng minh implementation đã hoàn thành**.

### 1.3 Proposal không phải data contract

Các số liệu, trạng thái, tên phòng, cảnh báo, màu và biểu đồ trong proposal có thể là minh họa. Không dùng chúng làm dữ liệu thật hoặc hard-code business fact nếu chưa có source.

---

## 2. Big Phase scope đã freeze

### 2.1 Pages IN SCOPE

| Page | Tên | Trạng thái |
| --- | --- | --- |
| 01 | Tổng quan | IN |
| 02 | Năng lượng & Nước | IN |
| 03 | Môi trường (IAQ) | IN |
| 06 | Trung tâm cảnh báo | IN |
| 07 | Hệ thống IoT | IN |
| 09 | Bãi xe | IN - toàn bộ data demo |
| 11 | PCCC | IN - scope đã rút gọn |

### 2.2 Pages OUT OF SCOPE

- Page 04 - Không gian.
- Page 05 - Thiết bị & Bảo trì.
- Page 08 - Thang máy.
- Page 10 - An ninh ra vào.

Không tạo page placeholder, database domain, API hoặc dummy feature cho bốn page này chỉ vì chúng tồn tại trong proposal cũ.

### 2.3 Dashboard custom/drag-drop lịch sử

`Project_KnowledgeBase.md` trước đây có requirement dashboard custom bằng kéo thả và JSONB. Big Phase hiện tại đang được stakeholder định nghĩa bằng **7 page cố định**. Không tự đưa drag/drop custom dashboard vào implementation hiện tại nếu chưa có decision mới tái xác nhận nó trong Big Phase này.

---

## 3. Kiến trúc Dashboard

### 3.1 Ranh giới component

```text
Browser
  |
  v
Next.js Dashboard
  |
  | application API
  v
NestJS
  |\
  | \--> PostgreSQL
  |
  +----> IoT backend / approved historical source
            |
            +--> IoT-side TSDB / network / devices (IoT team ownership)
```

### 3.2 Trách nhiệm

**Next.js**
- Render page/component.
- User interaction, filter, page navigation.
- Chart rendering qua `ant-design-charts`.
- Không giữ IoT Master Bearer Token.
- Không gọi trực tiếp upstream IoT API.
- Không tự tính authoritative alert state nếu NestJS đã cung cấp trạng thái.

**NestJS**
- IoT read integration theo `IoTBackend_API_HandOver.md`.
- Runtime validation và normalization.
- Device/data routing.
- Report-data calculation/orchestration.
- Alert evaluation.
- Authorization enforcement với CASL.
- API cho Dashboard.

**PostgreSQL**
- Application-owned data.
- Alert configuration/baseline/customized values.
- Manual PCCC records.
- Derived/selected report data theo Small Phase report-data sau này.
- Không mặc định mirror toàn bộ raw telemetry/TSDB.

**Unity WebGL**
- Vẫn là viewer/runtime 3D của Digital Twin toàn dự án.
- Không dùng cho panel chính Page 01 Dashboard theo decision mới; Page 01 dùng React/Next.js 2D grid.

### 3.3 Report data pipeline - approved principle, detail deferred

Approved intent:

```text
IoT current/history data
        |
        v
      NestJS
        |
        | normalize / aggregate / calculate
        v
 Dashboard Report Data
        |
        v
    PostgreSQL
        |
        v
     Dashboard
```

Quy tắc:
- Chỉ lưu dữ liệu report/aggregate/snapshot cần cho Dashboard, không tự động duplicate toàn bộ TSDB.
- Schema, report keys, refresh schedule, TTL, invalidation, retention, background job và recovery sẽ được thiết kế trong **Small Phase riêng**.
- User có nhắc nguồn "IoT backend + TSDB". Tuy nhiên exact direct-TSDB access chưa có contract trong `IoTBackend_API_HandOver.md`. Cho đến khi có decision/API mới, không tự kết nối NestJS trực tiếp vào TSDB ngoài approved integration path.

---

## 4. DataMode chuẩn

### 4.1 Enum logic

```ts
type DataMode = 'live' | 'derived' | 'manual' | 'demo';
```

### 4.2 Ý nghĩa

| Mode | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| `live` | Dữ liệu thật từ approved upstream/application source | Water meter telemetry, RSSI/SNR khi contract có |
| `derived` | NestJS/app tính từ dữ liệu thật/report data | Alert state, IoT health, 7-day compliance |
| `manual` | User nhập/sửa | Bình chữa cháy, diễn tập & hồ sơ |
| `demo` | Fixture/dummy có chủ đích | Energy, Parking, field IoT chưa được backend cung cấp |

### 4.3 Quy tắc dummy/demo

- Không dùng `Math.random()` trực tiếp trong component để tạo dữ liệu demo.
- Dùng deterministic fixtures có version để screenshot/test/demo reproducible.
- Demo data phải có provenance trong app/data contract; UI nên có indicator phù hợp khi cần tránh nhầm với live data.
- Khi dữ liệu IoT được xác nhận sau này, component có thể chuyển `demo -> live/derived` mà không thay đổi page contract nếu đã thiết kế adapter đúng.

---

## 5. Shared Dashboard Component System

Ưu tiên component dùng lại, không duplicate theo từng page nếu semantics giống nhau.

### 5.1 Shared components đã chốt/đề xuất dùng chung

- `DashboardPageShell`
- `DashboardSection`
- `KpiMetadataCard`
- `FloorCatalog`
- `InteractiveFloorGrid`
- `FloorMetadataPanel`
- `MetricPopup` / room-cell detail popup
- `TimeRangeSelector`
- `MetricTrendChart`
- `MetricBarChart`
- `MetricDistributionChart`
- `StatusBadge`
- `DataModeBadge`
- `AlertList`
- `IoTHealthSummary`
- `DashboardDataTable`
- `NotificationBadge`
- `LoadingState`
- `EmptyDataState`
- `UnavailableDataState`
- `ErrorState`
- CASL-protected edit/action wrapper theo frontend convention hiện hữu

Tên code ở trên là conceptual; coding agent phải inspect repository naming convention trước khi tạo file/class/component.

### 5.2 Chart rule

- Dùng **ant-design-charts** cho chart.
- Tạo wrapper/component domain để tránh mỗi page tự viết raw chart config khác nhau.
- Không dùng chart library khác cho cùng use case nếu chưa có approval.
- `InteractiveFloorGrid` là UI/spatial component, không phải chart; không ép implement bằng chart library.

---

## 6. Interactive 2D Grid contract

### 6.1 Mục tiêu

Thay interactive BIM 3D panel trong Dashboard bằng logical 2D grid có thể tương tác.

### 6.2 Dùng ở đâu

- Page 01: room/floor grid cho IAQ/CO2 interaction.
- Page 11: fire-zone/floor grid cho trạng thái PCCC.

### 6.3 Hành vi

- Có `FloorCatalog` bên trái của component.
- Chọn floor thay dataset của grid.
- Grid có số hàng/cột phù hợp với số cell/room/zone cần hiển thị.
- Cell phải có stable identity; không phụ thuộc thứ tự render ngẫu nhiên.
- Click cell mở popup/detail theo page context.
- Page 01 giữ requirement click cell -> thông tin CO2; nếu CO2 chưa có live source thì dùng demo theo rule.
- Page 11 cell biểu diễn fire zone/room state; live nếu source được xác nhận, nếu không demo.

### 6.4 Không được hiểu nhầm

- Grid là **logical matrix**, không mặc định là floor-plan geometry chính xác.
- Không dùng grid để thay thế Unity viewer của toàn dự án.
- Room/zone mapping cần source/config ổn định; không tự suy từ vị trí thiết bị nếu chưa có mapping.

---

## 7. Page 01 - Tổng quan

### 7.1 Components phải implement

1. **Top KPI metadata cards** theo concept của proposal.
2. **FloorCatalog** bên trái khu vực overview grid.
3. **InteractiveFloorGrid** thay interactive BIM 3D.
4. **FloorMetadataPanel** bên phải.
5. Click grid cell -> **CO2 information popup/detail**.
6. Bottom component: **Cảnh báo mới nhất**.
7. Bottom component: **Sức khỏe hệ thống IoT**.
8. Bottom component: **Điện năng theo giờ** - dùng demo/dummy data.

### 7.2 Data rules

- Energy: `DEMO`.
- Water KPI nếu dùng: `LIVE/DERIVED` khi AVC data phù hợp.
- Alert count/list: `DERIVED` từ alert subsystem.
- IoT health: `DERIVED` từ device/telemetry state có thể xác định.
- CO2: `CONDITIONAL`; đang chờ IoT team confirm. Nếu không có -> `DEMO`.
- Không hard-code proposal numbers làm live values.

### 7.3 Metadata panel

Component được stakeholder yêu cầu implement. Nội dung cụ thể chỉ lấy từ field có source rõ ràng, ví dụ floor identity, room/device count, IAQ/alert summary khi derivable. Không tự invent metadata business field chỉ để giống mockup.

---

## 8. Page 02 - Năng lượng & Nước

### 8.1 Water components

Implement các component thuộc nhóm **Nước** theo page/proposal.

Data mode mục tiêu:
- Water current/history: `LIVE` từ `avc` khi semantics đã confirm đủ.
- Water aggregate/report: `DERIVED` khi có report-data pipeline.
- Leak/night-flow analysis: `DERIVED` nếu input semantics đủ; nếu chưa thì không gắn nhãn authoritative.

### 8.2 Energy components

Implement các component Energy theo visual/page structure nhưng toàn bộ Energy data hiện tại là:

```text
DEMO
```

- Dùng deterministic fixture.
- Không trình bày Energy như đo thật.
- Không thêm smart-meter upstream contract giả.

### 8.3 Anomaly/AI wording

Nếu component bất thường được dựng từ rule/statistics hiện có thì mô tả đúng là rule/statistical analysis. Không tự tuyên bố có AI anomaly model nếu chưa có model/service/evidence.

---

## 9. Page 03 - Môi trường (IAQ)

### 9.1 Scope

Implement toàn bộ component của Page 03 theo proposal, gồm concept:

- Heatmap room x time.
- Ranking room theo metric IAQ.
- % thời gian đạt chuẩn theo floor/khoảng thời gian.
- Threshold/status table/config display phù hợp.
- KPI/summary components của page.

### 9.2 Metric availability

Current IoT handover có `solar.temperature`, `solar.humidity`, `lux`, RSSI/SNR và một số field khác, nhưng temperature/humidity units/semantics còn pending hardware review.

Các metric Dashboard mong muốn cần IoT team confirm thêm:
- CO2.
- VOC.
- Air pressure.
- Temperature/humidity units/physical meaning.

### 9.3 CO2

CO2 là requirement UI hiện tại nhưng **không có field trong approved API handover hiện tại**.

Rule:
- IoT team có -> `LIVE/DERIVED`.
- IoT team không có -> CO2 widget/popup `DEMO`.

### 9.4 Historical/report data

Approved type-specific APIs đã có time-range history cho current device types. Các report dài hạn/aggregate cho IAQ sẽ đi qua report-data design ở Small Phase riêng khi cần tối ưu/cache.

---

## 10. Page 06 - Trung tâm cảnh báo

Page 06 là một subsystem có backend logic, không chỉ là visual page.

### 10.1 Components

Implement các component theo Page 06 proposal và decision mới:

- Alert list/filter/status.
- Current warning/danger summary.
- Alert/history timeline phù hợp.
- Hiệu quả/summary chart nếu data/report có thể cung cấp hoặc fixture theo plan cụ thể.
- Warning configuration UI.
- Left menu **notification badge**.

### 10.2 Alert evaluation ownership

Authoritative evaluation nằm ở **NestJS**.

Không để từng React component tự định nghĩa threshold riêng.

Concept:

```text
Telemetry / report input
        |
        v
AlertEvaluationService
        |
        v
Metric configuration
        |
        v
NORMAL / WARNING / DANGER
```

`STALE` / `NO_DATA` là design candidate hợp lý nhưng chưa được stakeholder freeze thành enum bắt buộc trong decision hiện tại. Nếu Small Phase alert cần, phải chốt semantics trước khi coi là final contract.

### 10.3 Notification badge semantics

Badge ở menu trái = **số DISTINCT IoT device hiện đang ở Warning hoặc Danger**.

Không dùng tổng số historical alert events làm badge.

### 10.4 Alert configuration

Config phải lưu PostgreSQL, bao gồm cả baseline recommendation và giá trị đã được user chỉnh.

Conceptual fields:

```text
device_type / metric_key
warning_low / warning_high
danger_low / danger_high
alert_time_threshold
enabled
baseline/custom provenance
updated_by
updated_at
```

Tên bảng/cột chưa được chốt bởi file này; coding agent không được coi đoạn trên là migration specification cuối.

### 10.5 `alert_time_threshold`

Requirement đã chốt: một metric không nhất thiết tạo alert ngay khi vừa vượt ngưỡng; config phải có thời gian duy trì vượt ngưỡng trước khi chuyển trạng thái cảnh báo.

Exact unit/storage sẽ chốt trong Small Phase alert; đề xuất dùng seconds nếu phù hợp codebase.

### 10.6 Baseline recommendation

- Baseline numbers do team ứng dụng recommend.
- Baseline được seed/lưu DB, không hard-code rải rác trong frontend/backend.
- User có CASL ability phù hợp được chỉnh config.
- Baseline chưa được freeze numeric values trong bản KB 1.0.0 này.

---

## 11. Page 07 - Hệ thống IoT

### 11.1 Scope

Implement toàn bộ component theo proposal Page 07.

Concept gồm:
- Device list/status.
- RSSI/SNR.
- Battery.
- Last transmission/last seen.
- Firmware.
- Gateway/network state.
- Packet reception/network quality.
- OTA progress/status.
- Calibration information.
- Related KPI/charts.

### 11.2 Current API facts already available

Theo current `IoTBackend_API_HandOver.md`:
- `/devices` có device ID/type, timestamps, floor/X/Y/Z, `is_active`.
- `/solar` có `gateway_id`, RSSI, SNR, temperature, humidity, lux và một số field khác.
- `/avc` có water metrics, `gateway_id`, RSSI, SNR, battery-low flag và radio fields.
- `/solar`, `/avc`, `/nfc` hỗ trợ historical range query.

Không hỏi lại những capability đã có contract; chỉ hỏi semantics/field còn thiếu.

### 11.3 Missing/conditional fields

Các item chưa chắc có live source như:
- standardized battery percentage,
- firmware metadata,
- gateway health inventory,
- packet-delivery aggregate,
- OTA,
- calibration,
- online/offline semantics,

phải nằm trong IoT confirmation backlog.

Rule đã chốt:
- IoT team cung cấp -> `LIVE/DERIVED`.
- IoT team xác nhận không có -> `DEMO`.
- Trong lúc chờ -> có thể implement UI bằng fixture nhưng không giả là live.

---

## 12. Page 09 - Bãi xe

### 12.1 Scope

Implement các component theo Page 09 proposal.

### 12.2 Data mode

**Toàn bộ Page 09 = `DEMO`.**

Có thể gồm:
- Parking-space occupancy visualization.
- Motorcycle-area density.
- Vehicle entries by hour.
- AI-camera/device list/status.
- KPI cards của page.

Không cần chờ camera/parking API cho Big Phase hiện tại.

Fixture phải deterministic và được đánh dấu nguồn demo trong data layer.

---

## 13. Page 11 - PCCC

### 13.1 Scope cuối sau khi resolve contradiction

**REMOVE:**
- Lối thoát hiểm.
- Bơm & áp lực nước chữa cháy.

**IMPLEMENT:**
- KPI metadata cards trên top.
- `FloorCatalog` bên trái fire-grid component.
- `InteractiveFloorGrid` cho trạng thái vùng báo cháy theo floor.
- "Bình chữa cháy sắp đến hạn" - nhập tay, có authorization.
- "Diễn tập & hồ sơ" - nhập tay, có authorization.

### 13.2 Fire-zone grid

Data source hiện chưa có approved endpoint trong `IoTBackend_API_HandOver.md`.

Rule:
- IoT team cung cấp fire-zone state contract -> `LIVE/DERIVED`.
- Không có -> `DEMO`.

### 13.3 Manual PCCC records

`Bình chữa cháy sắp đến hạn` và `Diễn tập & hồ sơ` là application data:
- `MANUAL`.
- Lưu PostgreSQL.
- NestJS CRUD/API.
- CASL enforcement ở backend.
- Frontend chỉ hiện edit/create/delete khi ability cho phép.
- Nên lưu audit metadata `created_by/created_at/updated_by/updated_at` theo DB convention hiện hữu.

Không tự nâng phần này thành full Document Control subsystem.

---

## 14. Authorization - CASL

### 14.1 Quyết định library

Stakeholder chọn **CASL**.

Lưu ý thuật ngữ:
- CASL được dùng cho **authorization/ability**.
- Cơ chế **authentication/identity/login/session/token** của user chưa được quyết định trong Dashboard KB này. Không tự coi CASL là authentication provider.

### 14.2 Minimum protected domains trong Big Phase

- Alert configuration read/update/manage.
- Fire extinguisher records create/update/delete.
- Fire drill/document records create/update/delete.

Conceptual abilities có thể theo subject/action CASL, ví dụ:

```text
AlertConfig: read, update
FireExtinguisher: read, create, update, delete
FireDrill: read, create, update, delete
```

Exact naming phải theo repository convention.

### 14.3 Enforcement rule

- Backend NestJS phải enforce authorization; không chỉ hide button ở frontend.
- Frontend dùng CASL/ability state để render/disable action phù hợp.
- Viewer/Editor/Manager là role baseline lịch sử của project, nhưng exact role-to-ability matrix cho Dashboard chưa được freeze trong file này.

---

## 15. Current IoT API facts relevant to Dashboard

Đây chỉ là summary. Exact contract luôn đọc `IoTBackend_API_HandOver.md`.

### 15.1 Approved current GET endpoints

```text
GET /api/v1/devices[?floor_level=<integer>]
GET /api/v1/devices/{dev_eui}
GET /api/v1/solar
GET /api/v1/avc
GET /api/v1/nfc
```

### 15.2 Range/history facts

`solar`, `avc`, `nfc`:
- require `dev_eui`, `start`, `stop`;
- ISO-8601 range;
- `start < stop`;
- newest-first;
- default limit 1000;
- hard cap 10000.

### 15.3 Relevant current fields

**Devices:**
- `device_id`, `device_type`;
- source timestamps;
- `install_floor_level`, X/Y/Z;
- `is_active`.

**Solar:**
- timestamp;
- gateway ID;
- current/voltage;
- temperature/humidity/lux;
- RSSI/SNR;
- state/frame count.

Một số solar units/semantics vẫn pending IoT/hardware confirmation.

**AVC water meter:**
- cumulative forward/reverse volume;
- instantaneous flow;
- leak/burst/battery/frozen/tamper/reverse-flow flags;
- radio fields, RSSI/SNR;
- temperature field.

Một số counter/flag semantics vẫn pending confirmation.

**NFC:**
- timestamp;
- detected card ID;
- `in/out` direction.

NFC không phải page độc lập trong current Dashboard Big Phase, nhưng API vẫn là project capability.

---

## 16. IoT data confirmation backlog - SENT / PENDING

Project owner đã gửi các câu hỏi cho IoT backend team. Trong lúc chờ, implementation không phụ thuộc có thể tiếp tục bằng adapters/fixtures.

### P0 - ảnh hưởng trực tiếp Dashboard core

1. **CO2 / VOC / air pressure**
   - Có device/endpoint/field hay không.
   - Units.
   - Current + history.

2. **Solar field semantics**
   - temperature unit/physical meaning.
   - humidity unit/physical meaning.
   - voltage unit/meaning.
   - `state` enum.

3. **AVC water semantics**
   - cumulative counter/reset/rollover behavior.
   - reverse volume semantics.
   - numeric flag domains (`pipe_leak`, `pipe_burst`, `battery_low`, `valve_open`, ...).

4. **Room mapping**
   - Upstream có room ID hay không.
   - Nếu không, ứng dụng sẽ cần PostgreSQL/application mapping.

5. **Expected telemetry cadence**
   - reporting interval theo device type.
   - basis cho freshness/alert timing.

6. **Online/offline/latest semantics**
   - Có upstream online state/last_seen hay application phải derive từ telemetry timestamp.

7. **Coordinate frame**
   - X/Y/Z units/axes/origin.
   - floor-level mapping, đặc biệt upstream `0` với viewer `G`.

### P1 - Page 07 completeness

8. Gateway health/inventory.
9. Network packet-delivery/reception aggregate.
10. Standardized battery data/percentage.
11. Firmware metadata.
12. OTA status/progress.
13. Calibration metadata.
14. Historical retention duration.
15. Server-side aggregation availability.
16. Rate limit / recommended polling / concurrency guidance.

### P2 - PCCC

17. Fire-zone state source/API: zone ID, floor/room mapping, state, timestamp/history.

### Fallback rule

- Contract có -> live/derived.
- Contract không có -> demo cho component đã được stakeholder cho phép fallback.
- Chưa trả lời -> UI có thể phát triển bằng fixture, nhưng integration không được giả định field thật.

---

## 17. Conceptual PostgreSQL domains cho Dashboard

Các domain dưới đây phản ánh requirement, **không phải tên table cuối**:

### 17.1 Alert configuration

Cần lưu:
- device type / metric key;
- warning range;
- danger range;
- `alert_time_threshold`;
- enabled;
- baseline vs customized provenance;
- audit updater/time.

### 17.2 PCCC manual data

Cần domain cho:
- fire extinguisher inspection/expiry records;
- fire drill/document records;
- audit metadata;
- authorization.

### 17.3 Report data

PostgreSQL sẽ lưu selected derived/report data khi Small Phase report pipeline thiết kế xong.

Chưa freeze:
- report table/schema;
- cache key;
- TTL;
- aggregation windows;
- refresh jobs;
- retention;
- invalidation;
- raw-source snapshot policy.

### 17.4 Dashboard layout

Current Big Phase không tự mở lại drag/drop custom dashboard JSONB. Nếu feature này được đưa trở lại scope, cập nhật KB trước khi coding.

---

## 18. Việc có thể bắt đầu trong lúc chờ IoT team

### READY / không phụ thuộc câu trả lời mới

- Dashboard route/menu shell cho 7 page in-scope.
- Shared component system.
- `KpiMetadataCard` visual contract.
- `FloorCatalog`.
- `InteractiveFloorGrid` với fixture/config.
- DataMode/provenance model.
- ant-design-charts wrapper components.
- Page 02 Energy UI với deterministic demo data.
- Page 09 toàn bộ UI + deterministic demo data.
- Page 11 manual PCCC data model/API/UI + CASL ability framework, sau khi inspect auth/account code hiện tại.
- Page 11 fire-grid UI với fixture adapter.
- Page 06 alert configuration domain/API/UI skeleton, baseline seed mechanism và evaluator abstraction mà không cần freeze numeric baseline ngay.
- Menu notification-badge component contract.
- Loading/empty/error/unavailable states.

### CONDITIONAL / có thể build UI nhưng live integration chờ confirm

- Page 01 CO2 popup live.
- Page 03 CO2/VOC/pressure live metrics.
- Page 03 units/labels cho solar temperature/humidity nếu semantics chưa confirm.
- Page 07 firmware/OTA/calibration/gateway health/network aggregate.
- Page 11 fire-zone live state.
- Room-level mapping nếu upstream chưa có room ID.

### DEFERRED SMALL PHASE

- Detailed Report Data Pipeline: schemas, jobs, aggregation, TTL, retention, recovery.
- Exact alert baseline numeric recommendation set.
- Full authorization role matrix nếu current auth system chưa có.

---

## 19. Implementation guardrails cho planner/coding agent

1. Đọc `Dashboard_Knowledge_Base.md` trước.
2. Nếu task đụng IoT API, đọc `IoTBackend_API_HandOver.md`; không hỏi lại field đã có contract.
3. Inspect repository/`AGENTS.md` trước khi tạo structure mới.
4. Không rebuild Next.js/Unity architecture.
5. Không gọi IoT backend trực tiếp từ browser/Unity.
6. Không đưa IoT bearer token ra client/log/DB/Git.
7. Không thêm upstream write API chỉ để tiện Dashboard.
8. Không duplicate raw TSDB history vào PostgreSQL nếu Small Phase report chưa yêu cầu rõ.
9. Không hard-code alert thresholds rải trong React.
10. Không dùng dummy mà không có provenance.
11. Không dùng proposal numbers làm live data.
12. Không add chart library khác nếu `ant-design-charts` đáp ứng use case.
13. Không chỉ hide UI để coi là authorization; backend phải enforce CASL ability.
14. Không biến PCCC manual records thành full Document Control subsystem.
15. Không thêm Page 04/05/08/10 vào current Big Phase.
16. Page 01 grid không thay thế Unity viewer toàn dự án.
17. Nếu API contract thay đổi, cập nhật `IoTBackend_API_HandOver.md` trước; sau đó cập nhật ảnh hưởng vào file này.
18. Nếu stakeholder đổi Dashboard requirement, cập nhật file này in place trước khi coding tiếp.

---

## 20. Acceptance principles cấp Big Phase

- Chỉ 7 page in-scope xuất hiện như Dashboard deliverable chính thức.
- Shared components không bị copy/paste thành nhiều implementation không cần thiết.
- Page 01 dùng 2D interactive grid, không dùng proposal BIM 3D panel.
- Energy và Parking demo data rõ nguồn, reproducible.
- Alert current-state calculation nhất quán giữa Page 01/03/06/07 vì dùng NestJS/domain logic chung.
- Alert baseline/custom configuration persistence hoạt động và có `alert_time_threshold`.
- CASL authorization được enforce server-side cho edit actions đã bảo vệ.
- Page 11 không có Escape Route và không có Pump/Fire-water-pressure component.
- IoT fields chưa có contract không được silently invent.
- Dashboard phải handle loading/no data/upstream failure mà không hiển thị stale/fake value như live.
- Report data nếu được persist phải trace được provenance/time window đủ để giải thích số liệu.

---

## 21. Open decisions còn thật sự mở

Không hỏi lại các quyết định đã freeze ở trên. Các mục mở hiện tại:

- Numeric baseline recommendation cho từng metric/device type.
- Exact unit/schema của `alert_time_threshold` trong DB/API.
- Whether/when `STALE` và `NO_DATA` trở thành explicit alert/device states.
- Exact authentication/login/session mechanism; CASL chỉ giải quyết authorization.
- Exact role-to-ability matrix.
- Room-grid layout source/persistence nếu cần layout ổn định theo từng floor.
- Exact floor metadata fields ở Page 01 nếu data source chưa đủ.
- Exact report-data schema/job/TTL/retention.
- IoT confirmation backlog ở mục 16.

---

## 22. Source register

### S-DASH-01 - Stakeholder Dashboard proposal

`Dashboard-DigitalTwin-Toà E.pdf`, bản thiết kế v1 ngày 24/09/2026.

Dùng cho:
- visual reference;
- page/component concepts;
- original Page 01/02/03/06/07/09/11 layout/content.

Không dùng để override decision stakeholder mới hơn hoặc làm data contract.

### S-DASH-02 - Project knowledge base

`Project_KnowledgeBase.md` / project source snapshot.

Dùng cho:
- overall architecture;
- Next.js/NestJS/PostgreSQL/Unity boundary;
- historical decisions/status.

### S-DASH-03 - IoT API master

`IoTBackend_API_HandOver.md`, current API source snapshot dated 2026-09-24 at time of this compilation.

Dùng cho:
- exact approved GET APIs;
- query rules;
- response schemas;
- confirmed/unconfirmed IoT field semantics;
- read-only safety.

Nếu API handover được update sau này, current updated API handover thắng phần API facts trong bản KB này.

### S-DASH-04 - Stakeholder decisions 25/09/2026

Current Dashboard Big Phase decisions captured in project conversation and compiled into this file:
- freeze 7 pages;
- Page 01 2D grid replacing BIM panel;
- DataMode;
- CO2 confirm/fallback;
- report-data principle;
- DB-stored alert config/baseline;
- `alert_time_threshold`;
- CASL;
- missing IoT fields -> confirm then dummy fallback;
- PCCC scope;
- shared components;
- chart library `ant-design-charts`.

---

## 23. Dashboard decision log

| ID | Decision | Status |
| --- | --- | --- |
| DASH-DEC-01 | Big Phase chỉ gồm Page 01/02/03/06/07/09/11 | DECIDED |
| DASH-DEC-02 | Page 04/05/08/10 bị loại khỏi Big Phase | DECIDED |
| DASH-DEC-03 | Page 01 BIM 3D panel -> Interactive 2D Grid | DECIDED |
| DASH-DEC-04 | Shared `FloorCatalog` + grid interaction | DECIDED |
| DASH-DEC-05 | DataMode = live/derived/manual/demo | DECIDED |
| DASH-DEC-06 | CO2 cần IoT confirm; thiếu thì demo | DECIDED |
| DASH-DEC-07 | NestJS tạo report data cần thiết và PostgreSQL lưu; chi tiết deferred | DECIDED + DEFERRED DETAIL |
| DASH-DEC-08 | Alert config và baseline recommendation lưu DB | DECIDED |
| DASH-DEC-09 | Config có `alert_time_threshold` | DECIDED |
| DASH-DEC-10 | User có quyền phù hợp được chỉnh warning config | DECIDED |
| DASH-DEC-11 | Authorization library CASL | DECIDED |
| DASH-DEC-12 | Chart library ant-design-charts | DECIDED |
| DASH-DEC-13 | Page 07 field không có upstream -> demo | DECIDED |
| DASH-DEC-14 | Page 09 toàn bộ demo | DECIDED |
| DASH-DEC-15 | Page 11 remove Escape Route | DECIDED |
| DASH-DEC-16 | Page 11 remove Pump & fire-water-pressure | DECIDED |
| DASH-DEC-17 | Page 11 extinguisher + drill/docs là manual authorized data | DECIDED |
| DASH-DEC-18 | Page 11 fire-zone -> 2D grid + floor catalog | DECIDED |
| DASH-DEC-19 | Shared Dashboard component system ưu tiên reuse | DECIDED |
| DASH-DEC-20 | Không hỏi lại IoT field đã có trong current API handover | DECIDED WORKING RULE |

---

## 24. Maintenance rule

Khi có thay đổi Dashboard:

1. Xác định section và `DASH-DEC-*` bị ảnh hưởng.
2. Sửa **current requirement** trước; không chỉ append note ở cuối.
3. Update decision log.
4. Update IoT confirmation backlog nếu câu trả lời mới đã đóng vấn đề.
5. Nếu IoT API contract thay đổi, update `IoTBackend_API_HandOver.md` theo single-source rule của API trước, rồi đồng bộ impact vào Dashboard KB.
6. Nếu code đã implement, thêm implementation evidence riêng: repository/commit/build/test/runtime; không biến requirement thành claim "done".
7. Tăng `version` và `compiled_on`/`updated_on`.
8. Ghi đè file `Dashboard_Knowledge_Base.md`; không tạo bản knowledge base cạnh tranh.

---

## 25. Bootstrap prompt cho agent mới

```text
Dự án GIS - UIT Building E Digital Twin.

Trước khi lập plan hoặc sửa Dashboard, hãy đọc Dashboard_Knowledge_Base.md.
Nếu task dùng IoT data/API, đọc thêm IoTBackend_API_HandOver.md và xem đó là
source of truth cho exact API contract. Đừng hỏi lại các field/capability đã có
trong API handover.

Current Dashboard Big Phase chỉ gồm Page 01, 02, 03, 06, 07, 09, 11.
Page 04, 05, 08, 10 out of scope.

Stack: Next.js + NestJS + PostgreSQL + Unity WebGL.
Dashboard Page 01 dùng Interactive 2D Grid thay BIM 3D panel; điều này không
thay thế Unity viewer toàn dự án.

DataMode: live / derived / manual / demo.
Authorization: CASL.
Charts: ant-design-charts.

Không tự invent IoT field, threshold, unit, role permission, report schema,
TSDB access hoặc live data. Nếu thiếu, đọc backlog/open items và giữ đúng
fallback/demo rule đã chốt.
```

---

## 26. Current document status

```text
status: CURRENT
version: 1.0.0
compiled_on: 2026-09-25
role: single authoritative Dashboard knowledge base
supersedes: dashboard scope assumptions from older proposal/project KB where conflicting
exact_iot_api_authority: IoTBackend_API_HandOver.md
repository_state: UNVERIFIED in this compilation
```
