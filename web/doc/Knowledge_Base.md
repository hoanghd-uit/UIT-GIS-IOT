---
document_id: GIS-UIT-PROJECT-KB
filename: Knowledge_Base.md
version: "2.0.0"
updated_on: "2026-09-25"
language: vi
project: "GIS - UIT Building E Digital Twin"
audience: "Project owner, ChatGPT/Work Mode, planner agents, coding agents, future project chats"
scope: "High-level product scope, architecture, application domains, current development direction, source-of-truth map and cross-cutting decisions"
current_application_database: PostgreSQL
backend_framework: NestJS
website_framework: Next.js
viewer_runtime: Unity WebGL
authorization_library: CASL
chart_library: ant-design-charts
source_policy: "Latest explicit decision per topic; domain-specific master documents override duplicated summaries in this file"
---

# Knowledge_Base

> **Dự án:** GIS - UIT Building E Digital Twin.
>
> **Vai trò của tài liệu:** Đây là **master knowledge base cấp dự án**, dùng để giúp project owner, ChatGPT/Work Mode, planner agent và coding agent hiểu nhanh **mục tiêu sản phẩm, kiến trúc tổng thể, phạm vi ứng dụng, trạng thái high-level và các source-of-truth chuyên biệt**.
>
> Tài liệu này **không cố duplicate chi tiết API hoặc chi tiết từng Dashboard component**. Các domain có master document riêng phải được đọc từ đúng nguồn chuyên biệt.

---

## 0. Đọc trước trong 2 phút

| Chủ đề | Current high-level state |
| --- | --- |
| Sản phẩm | Website Digital Twin cho tòa E, kết hợp Unity 3D, dữ liệu IoT, dashboard vận hành, dữ liệu ứng dụng và một số workflow quản trị. |
| Frontend | **Next.js** là web shell, dashboard, navigation và application UI. |
| 3D Viewer | **Unity WebGL** là Digital Twin spatial viewer; giữ kiến trúc single runtime/canvas và các scene/view hiện hữu. |
| Backend | **NestJS** là application backend, business logic, IoT bridge, report-data processing, alert evaluation và PostgreSQL access. |
| Database | **PostgreSQL** là database nghiệp vụ của ứng dụng. Không dùng MongoDB cho implementation hiện hành. |
| IoT block | MQTT / TSDB / IoT backend / physical devices thuộc team IoT. Ứng dụng tích hợp **read-only qua NestJS** theo contract hiện hành. |
| Dashboard Big Phase | Scope hiện hành gồm **Page 01, 02, 03, 06, 07, 09, 11**. Page 04, 05, 08, 10 out of scope cho Big Phase này. |
| Water | **Nguồn dữ liệu Water hiện hành là IoT device type `avc`**. `/api/v1/avc` là water-meter data source. |
| Dashboard chart | Dùng **ant-design-charts**. |
| Authorization | Dùng **CASL** cho authorization/ability. CASL không phải authentication provider. |
| Report data | Principle đã duyệt: NestJS lấy dữ liệu cần thiết từ IoT backend/TSDB, tính/tổng hợp report data cần cho app và lưu selected/derived report data vào PostgreSQL. |
| Alert | Alert Center là current scope. Threshold/baseline config lưu PostgreSQL; có `alert_time_threshold`; NestJS chịu trách nhiệm authoritative evaluation. |
| Dummy/demo | Energy hiện dùng demo; Parking toàn bộ demo; các IoT field chưa có contract có thể fallback demo nếu Dashboard KB cho phép. |
| Source chi tiết | IoT exact API -> `IoTBackend_API_HandOver.md`; Dashboard exact scope -> `Dashboard_Knowledge_Base.md`. |

---

## 1. Quy tắc authority và source-of-truth

### 1.1 Thứ tự ưu tiên

Khi có khác biệt giữa tài liệu:

1. **Decision trực tiếp mới nhất của project owner/stakeholder cho đúng chủ đề.**
2. **Domain-specific master document** cho domain tương ứng.
3. `Knowledge_Base.md` này cho high-level project/app context.
4. Latest implementation handoff/walkthrough cho trạng thái code của Small Phase tương ứng.
5. Proposal/mockup/report lịch sử chỉ dùng làm reference nếu không mâu thuẫn decision mới hơn.

### 1.2 Domain-specific master documents

| Tài liệu | Vai trò authoritative |
| --- | --- |
| `Knowledge_Base.md` | Tổng quan dự án, architecture, application domains, high-level scope/status. |
| `IoTBackend_API_HandOver.md` | **Single source of truth cho exact IoT API contract**: endpoint, query, response, identity semantics, error, integration safety. |
| `Dashboard_Knowledge_Base.md` | **Single source of truth cho Dashboard Big Phase**: pages, components, data modes, shared components, alert, report data, CASL, chart rules, IoT confirmation backlog. |
| Latest Small Phase plan/handoff/walkthrough | Source gần implementation nhất cho task/code đã làm hoặc đang làm. |

Không copy nguyên API schema hoặc toàn bộ Dashboard component list vào file này nếu đã có master document chuyên biệt.

### 1.3 Trạng thái quyết định khác trạng thái implementation

Các label nên được hiểu như sau:

- `DECIDED`: đã chốt requirement/architecture.
- `BASELINE`: đã có nền tảng/app capability được dự án dùng làm baseline tiếp theo.
- `ACTIVE`: đang được phát triển hoặc tiếp tục tinh chỉnh.
- `PLANNED`: đã có direction/plan nhưng không tự đồng nghĩa đã implement.
- `DEFERRED`: có requirement nhưng chưa nằm trong task hiện tại hoặc chi tiết để Small Phase khác xử lý.
- `OPEN`: còn thiếu decision/contract cần thiết.
- `DEMO`: dữ liệu fixture/dummy có chủ đích.
- `LIVE`: dữ liệu thật từ source đã được xác định.
- `DERIVED`: application/NestJS tính từ source data.
- `MANUAL`: user nhập/sửa dữ liệu ứng dụng.

---

## 2. Product overview

### 2.1 Mục tiêu sản phẩm

Dự án xây dựng Digital Twin cho **tòa E - UIT**, với các nhóm capability chính:

- xem campus / tòa / tầng trong Unity WebGL;
- hiển thị không gian chi tiết tầng;
- hiển thị và tương tác với IoT device theo tầng;
- xem telemetry/history theo loại thiết bị hỗ trợ;
- lưu application-owned metadata và display override trong PostgreSQL;
- Dashboard vận hành theo các page đã được stakeholder freeze;
- alert/configuration/report data cho Dashboard;
- dữ liệu thủ công có phân quyền cho các domain cần thiết;
- product requirement liên quan lecturer/card/access vẫn tồn tại ở cấp dự án nhưng exact API/current implementation phải kiểm tra theo source mới nhất.

### 2.2 Những điều không được hiểu nhầm

- Unity viewer và Dashboard là hai lớp UI khác nhau; Dashboard Page 01 dùng 2D grid không có nghĩa loại bỏ Unity khỏi sản phẩm.
- PostgreSQL không phải TSDB thay thế cho IoT team.
- Demo data không được trình bày như live data.
- Proposal/mockup không phải API/data contract.
- CASL là authorization, không phải login/session/authentication.
- Một Small Phase plan không tự chứng minh implementation đã hoàn thành.

---

## 3. High-level architecture

```text
User
 |
 +---------------------------+
 |                           |
 v                           v
Next.js Web UI          Unity WebGL Viewer
 |                           |
 +------------ application interaction --------+
 |
 v
NestJS Application Backend
 |\
 | \---- PostgreSQL
 |
 +------ Read-only IoT integration
             |
             v
        IoT Backend
             |
        MQTT / TSDB / Devices
        (IoT team ownership)
```

### 3.1 Next.js

Trách nhiệm high-level:

- website shell/navigation;
- Dashboard pages/components;
- application forms/tables/panels;
- communication với NestJS;
- host/integrate Unity WebGL canvas.

Không gọi trực tiếp IoT backend bằng Master Bearer Token.

### 3.2 Unity WebGL

Trách nhiệm high-level:

- Digital Twin 3D viewer;
- Campus / FloorDetail spatial experience;
- camera, picking và floor/device visualization theo capability đã triển khai;
- hiển thị spatial data do application cung cấp.

Các nguyên tắc viewer cần bảo toàn ở high-level:

- một Unity runtime/context/canvas;
- URL/web state là navigation source chính;
- `Campus` và `FloorDetail` là hai viewer context chính;
- canonical viewer floor IDs: `G`, `1` ... `12`;
- prepared floor content/prefab pipeline tiếp tục là content strategy hiện hành trừ khi có decision mới.

### 3.3 NestJS

Trách nhiệm high-level:

- application API cho Next.js/Unity;
- PostgreSQL read/write;
- IoT API bridge và normalization;
- report-data calculation/orchestration;
- alert evaluation;
- authorization enforcement cho protected operations;
- application-domain validation/error handling.

### 3.4 PostgreSQL

PostgreSQL lưu dữ liệu **thuộc application**, không mặc định mirror toàn bộ raw telemetry history.

Các domain application có thể bao gồm:

- device catalogue/cache/source metadata cần cho application;
- custom display positions / overrides;
- sync/fetch metadata;
- report/derived data cần cho Dashboard;
- alert baseline/custom configuration;
- PCCC manual records;
- application user/profile/authorization-related data khi domain tương ứng được triển khai;
- các mapping giữa application identifiers và external identifiers.

### 3.5 IoT team block

Team IoT sở hữu:

- physical devices/network;
- MQTT/LoRaWAN/network-server layer;
- TSDB/raw history source;
- IoT backend;
- exact upstream field semantics.

Ứng dụng chỉ sử dụng contract được chấp thuận trong `IoTBackend_API_HandOver.md`.

---

## 4. Current IoT integration summary

> Exact endpoint/query/response rules phải đọc từ `IoTBackend_API_HandOver.md`.

### 4.1 Current approved API types

Hiện current handover có 5 GET capability chính:

- device catalogue;
- device metadata detail;
- `solar` telemetry/history;
- `avc` telemetry/history;
- `nfc` scan-event history.

Integration mode hiện hành là **read-only server-to-server qua NestJS**.

### 4.2 Device-type meaning cần giữ

| Device/API type | High-level meaning |
| --- | --- |
| `solar` | Environment/radio telemetry source hiện có trong current API contract. |
| `avc` | **Water meter**. Đây là nguồn Water hiện hành cho application/Dashboard. |
| `nfc` | Door/card scan events với timestamp và direction. |

### 4.3 Water decision - current

**Water lấy dữ liệu từ `avc`.**

Current AVC contract đã cung cấp các nhóm field water như:

- cumulative forward volume;
- cumulative reverse volume;
- instantaneous flow;
- một số meter/network/status flags.

Do đó project không cần hỏi lại IoT team rằng Water data source là gì hoặc có instant/cumulative field hay không.

Những gì vẫn có thể cần confirm là **semantics chi tiết** như counter reset/rollover và numeric-domain của một số flag, theo `IoTBackend_API_HandOver.md` / Dashboard IoT backlog.

### 4.4 Historical telemetry

Current `solar`, `avc`, `nfc` APIs đã hỗ trợ time-range query.

Vì vậy câu hỏi “có historical sensor API hay không?” đã được đóng cho các current device types.

Các vấn đề còn có thể mở:

- retention;
- rate limit/polling guidance;
- sampling/reporting cadence;
- server-side aggregation;
- exact metric semantics/units còn pending hardware confirmation;
- additional device/domain APIs chưa nằm trong current approved contract.

### 4.5 IoT data còn chờ confirmation

Các nhóm đang chờ IoT team trả lời theo Dashboard planning gồm, ở high-level:

- CO2 / VOC / air pressure availability và units;
- một số `solar` metric semantics;
- AVC counter/reset và flag semantics;
- room mapping;
- telemetry cadence / online-stale semantics;
- coordinate frame units/axes/origin/floor mapping;
- gateway health / firmware / OTA / calibration / packet aggregates;
- fire-zone data/API;
- retention/rate-limit guidance.

Không hỏi lại những field/capability đã có trong current API handover.

---

## 5. Application data ownership

| Data | Source of truth / owner | Application persistence |
| --- | --- | --- |
| Raw IoT telemetry/history | IoT backend / TSDB | Không mirror toàn bộ mặc định. |
| Device catalogue/source metadata | IoT backend | Có thể cache/sync selected metadata vào PostgreSQL theo application flow. |
| Source installation coordinates | IoT backend | Preserve source values; không overwrite bằng display override. |
| Display override/icon position | Application | PostgreSQL. |
| Dashboard derived/report data | NestJS/application | Selected report data lưu PostgreSQL theo report-data Small Phase. |
| Alert configuration | Application | PostgreSQL; baseline + customized values. |
| PCCC manual records | Application/user | PostgreSQL + authorization/audit. |
| Demo data | Application fixtures | Deterministic fixtures; không giả là live. |

### 5.1 Source coordinate vs display override

Luôn tách:

- source/original IoT coordinate;
- application display override;
- fetch timestamp;
- telemetry timestamp.

Không coi thao tác kéo icon trên UI là cập nhật physical installation bên IoT backend.

---

## 6. Dashboard Big Phase - high-level scope

> Exact page/component/data-mode rules: xem `Dashboard_Knowledge_Base.md`.

### 6.1 Pages IN SCOPE

| Page | Tên | High-level data direction |
| --- | --- | --- |
| 01 | Tổng quan | Mixed live/derived/demo; 2D interactive floor grid thay BIM panel trong Dashboard. |
| 02 | Năng lượng & Nước | **Water từ AVC live/derived**; Energy demo. |
| 03 | Môi trường IAQ | Current/conditional IoT metrics + report data; CO2 và một số metrics chờ confirmation. |
| 06 | Trung tâm cảnh báo | Alert evaluation + configuration + notification badge + authorization. |
| 07 | Hệ thống IoT | Live fields đã có contract; missing fields có thể demo theo Dashboard rule. |
| 09 | Bãi xe | Toàn bộ demo data trong Big Phase hiện tại. |
| 11 | PCCC | KPI + 2D fire-zone grid + manual extinguisher/drill records; fire-zone live nếu có contract. |

### 6.2 Pages OUT OF SCOPE cho Big Phase hiện tại

- Page 04 - Không gian.
- Page 05 - Thiết bị & Bảo trì.
- Page 08 - Thang máy.
- Page 10 - An ninh ra vào.

### 6.3 Dashboard custom/drag-drop requirement lịch sử

Requirement cũ về custom drag/drop Dashboard + JSONB **không phải current Dashboard Big Phase deliverable**.

Giữ nó ở trạng thái historical/deferred cho đến khi stakeholder đưa lại vào scope.

### 6.4 Page 01 2D grid decision

Dashboard Page 01 không dùng interactive BIM 3D panel như proposal gốc.

Current direction:

- floor catalog;
- logical interactive 2D grid;
- click cell -> detail/popup;
- right-side floor metadata panel.

Điều này chỉ áp dụng cho Dashboard page, không thay Unity Digital Twin viewer toàn dự án.

### 6.5 Page 11 PCCC scope

Current Big Phase đã **remove**:

- Escape Route;
- Pump & fire-water-pressure component.

Current PCCC scope giữ:

- KPI metadata cards;
- fire-zone 2D grid + floor catalog;
- fire extinguisher expiry/manual records;
- drill/document manual records.

---

## 7. Dashboard data modes

Dashboard/application nên phân biệt ít nhất:

```text
LIVE     = dữ liệu thật từ upstream/application source
DERIVED  = NestJS/application tính từ live/report data
MANUAL   = user nhập/sửa trong application
DEMO     = fixture/dummy data có chủ đích
```

Không silently fallback sang fake value rồi hiển thị như live.

Demo fixtures nên deterministic để screenshot/test/demo reproducible.

---

## 8. Report Data architecture

### 8.1 Approved principle

```text
IoT Backend / TSDB
        |
        v
      NestJS
        |
        v
validate / normalize / aggregate / derive
        |
        v
selected Report Data
        |
        v
   PostgreSQL
        |
        v
    Dashboard
```

### 8.2 Boundary

PostgreSQL dùng cho **selected/derived/report application data**, không trở thành raw TSDB duplicate theo mặc định.

### 8.3 Deferred implementation detail

Để một Small Phase riêng chốt:

- report schema;
- cache keys;
- aggregation windows;
- refresh/background jobs;
- TTL/retention;
- invalidation/recovery;
- provenance/source-window metadata.

---

## 9. Alert subsystem

Alert Center hiện là **current Dashboard scope**, không còn là future-only feature.

### 9.1 Ownership

Authoritative evaluation nằm ở NestJS.

```text
Telemetry / Report Input
        |
        v
Alert Evaluation
        |
        v
Baseline / Custom Config
        |
        v
Normal / Warning / Danger
```

### 9.2 Configuration

Alert configuration lưu PostgreSQL, bao gồm:

- baseline recommendation;
- user-adjusted configuration;
- warning thresholds;
- danger thresholds;
- `alert_time_threshold`;
- enabled/disabled;
- audit/provenance cần thiết.

Không hard-code baseline rải rác trong React component.

### 9.3 Menu notification badge

Dashboard left-menu badge thể hiện **số distinct IoT devices hiện ở Warning/Danger**, không phải tổng số historical alert events.

### 9.4 Numeric baseline

Exact numeric recommendation set chưa freeze ở file high-level này. Chi tiết thuộc Dashboard KB / Small Phase alert.

---

## 10. Authorization and chart libraries

### 10.1 Authorization

**CASL** là library đã chọn cho authorization/ability.

Current protected Dashboard domains tối thiểu gồm:

- alert configuration management;
- PCCC extinguisher manual records;
- PCCC drill/document manual records.

Authorization phải được enforce ở backend, không chỉ hide button ở frontend.

### 10.2 Authentication

Cơ chế identity/login/session/token của application user **không được suy từ CASL**.

Nếu chưa có current authentication contract trong repository/source, trạng thái là `OPEN/inspect current implementation`.

### 10.3 Charts

Dashboard chart library đã chọn: **ant-design-charts**.

Shared wrapper/domain components nên được ưu tiên để tránh mỗi page tự tạo raw chart configuration độc lập.

---

## 11. Current development state - high level

> Exact completion state phải đọc latest Small Phase handoff/walkthrough và repository. Bảng dưới chỉ giúp agent định hướng không quay về assumption cũ.

| Area | High-level state |
| --- | --- |
| Next.js + Unity WebGL shell/viewer | `BASELINE` - project tiếp tục dựa trên client/viewer hiện hữu, không tạo lại từ đầu. |
| Campus/FloorDetail navigation/content | `BASELINE` - các Small Phase đầu đã xây nền viewer/floor workflow. |
| NestJS + PostgreSQL | `BASELINE` - backend/database foundation đã được đưa vào project sau Small Phase 04; không còn trạng thái “database chưa bắt đầu”. |
| Object filters trong floor view | `BASELINE/IMPLEMENTED BY PROJECT PHASE` - Ceiling / Interior / Wall filtering thuộc Small Phase 05. |
| IoT device catalogue/icon integration | `ACTIVE/BASELINE` - current application dùng `/devices` contract và tiếp tục harden mapping/cache/display flow. |
| IoT device telemetry/detail/chart | `ACTIVE` - type-specific current API routes `solar/avc/nfc` là source integration hiện hành. |
| Device catalogue persistence/cache | `ACTIVE/PLANNED BY SMALL PHASE 08` - exact completion phải kiểm tra latest implementation handoff. |
| Dashboard Big Phase | `ACTIVE/PLANNED` - scope đã freeze và có `Dashboard_Knowledge_Base.md`; triển khai theo Small Phases. |
| Report-data pipeline | `DECIDED + DEFERRED DETAIL` - architecture principle approved; implementation detail để Small Phase riêng. |
| Alert subsystem | `DECIDED/PLANNED` - current Dashboard scope. |

Không dùng bảng này để báo “đã test pass”. Khi coding, phải inspect repository/AGENTS.md/latest handoff.

---

## 12. Lecturer / card / access domain

Domain này vẫn thuộc product context cấp dự án, nhưng phải tách product requirement khỏi current approved IoT API contract.

### 12.1 Product intent

- lecturer/profile mapping;
- card/scanner event linkage;
- room presence/access-history use cases;
- PostgreSQL có thể lưu application-side profile/mapping data.

### 12.2 Current API fact

Current approved IoT handover có `nfc` scan-event endpoint với detected card ID, timestamp và direction.

Các webhook/history API cũ từng được thảo luận ở product level **không được tự coi là current approved endpoint** nếu chưa xuất hiện trong current `IoTBackend_API_HandOver.md` hoặc một newer explicit contract.

---

## 13. Open cross-project issues

Chỉ giữ những vấn đề thực sự còn mở và ảnh hưởng nhiều domain.

### 13.1 IoT/data

- CO2/VOC/air-pressure availability/contract;
- remaining sensor units/semantics;
- room mapping;
- telemetry cadence / online-stale semantics;
- coordinate frame units/axes/origin/floor mapping;
- gateway/firmware/OTA/calibration/network aggregate availability;
- fire-zone data/API;
- retention/rate-limit guidance.

### 13.2 Dashboard/report/alert

- exact report-data schema/job/TTL/retention;
- exact numeric alert baseline recommendation set;
- exact DB/API representation of `alert_time_threshold`;
- whether `STALE`/`NO_DATA` become explicit final state enums;
- room-grid layout source/persistence where required.

### 13.3 User identity/auth

- current authentication/login/session mechanism;
- exact role-to-CASL-ability matrix;
- user lifecycle/audit policy outside the minimum Dashboard protected domains.

### 13.4 Coordinates/calibration

- upstream X/Y/Z physical units and axes;
- exact viewer-floor mapping such as upstream `0` vs viewer `G`;
- validated coordinate calibration between IoT source and Unity/floor context.

---

## 14. Current technology decisions

| Concern | Decision |
| --- | --- |
| Web frontend | Next.js |
| 3D viewer | Unity WebGL |
| Application backend | NestJS |
| Application database | PostgreSQL |
| IoT integration | Read-only through NestJS, exact contract in `IoTBackend_API_HandOver.md` |
| Authorization | CASL |
| Charting | ant-design-charts |
| Dashboard Page 01 spatial UI | Interactive 2D grid, not BIM 3D panel |
| Dashboard data model | Live / Derived / Manual / Demo |
| Water source | `avc` water-meter API |
| Report data | NestJS derive/aggregate -> selected PostgreSQL report data |
| Alert config | PostgreSQL baseline/custom + `alert_time_threshold` |

Không tự thêm Redis, Kubernetes, Grafana, PostGIS, microservices hoặc chart library khác nếu chưa có decision/task tương ứng.

---

## 15. Scope boundaries / future

Các nội dung sau không tự trở thành current requirement chỉ vì từng xuất hiện trong proposal hoặc historical docs:

- Page 04 Space Dashboard;
- Page 05 Maintenance/CMMS;
- Page 08 Elevator Dashboard;
- Page 10 Security Dashboard;
- full custom drag/drop Dashboard editor;
- full DesignFloor runtime editor;
- HVAC/door-lock control;
- camera recognition pipeline;
- automatic fire-system control;
- full document-control/CMMS subsystem;
- full raw-telemetry mirroring into PostgreSQL.

Nếu stakeholder đưa một item quay lại scope, cập nhật source master liên quan trước khi coding.

---

## 16. Maintenance rule

`Knowledge_Base.md` phải luôn là **một file duy nhất** cho high-level project context.

Khi có thay đổi:

1. sửa current-state section trước;
2. không chỉ append note mới khiến phần đầu vẫn sai;
3. nếu thay đổi thuộc IoT API, update `IoTBackend_API_HandOver.md` trước;
4. nếu thay đổi thuộc Dashboard, update `Dashboard_Knowledge_Base.md` trước;
5. đồng bộ high-level impact về file này;
6. exact implementation evidence phải lấy từ repo/latest handoff;
7. tăng version / `updated_on` khi có thay đổi có ý nghĩa;
8. không tạo nhiều file `Knowledge_Base_v2`, `v3` cạnh tranh nhau.

---

## 17. Bootstrap capsule cho agent mới

```text
Dự án GIS - UIT Building E Digital Twin.

Đọc Knowledge_Base.md trước để hiểu high-level app và architecture.

Stack hiện hành:
Next.js + Unity WebGL + NestJS + PostgreSQL.
IoT backend/TSDB/device network do team IoT sở hữu; application chỉ tích hợp
read-only qua NestJS.

Nếu task liên quan exact IoT API, đọc IoTBackend_API_HandOver.md và xem đó là
source of truth. Current device data types gồm solar, avc, nfc; avc là water meter
và là nguồn Water hiện hành.

Nếu task liên quan Dashboard, đọc Dashboard_Knowledge_Base.md. Current Dashboard
Big Phase chỉ gồm Page 01, 02, 03, 06, 07, 09, 11. Page 04, 05, 08, 10 out of scope.
Page 01 Dashboard dùng Interactive 2D Grid thay BIM 3D panel, nhưng Unity vẫn là
Digital Twin 3D viewer của toàn dự án.

Dashboard dùng ant-design-charts. Authorization dùng CASL. CASL không phải authentication.
Report-data principle: NestJS lấy/chuẩn hóa/tổng hợp dữ liệu cần thiết từ IoT/TSDB
và lưu selected derived/report data vào PostgreSQL; không mirror toàn bộ TSDB mặc định.
Alert config/baseline lưu PostgreSQL và có alert_time_threshold.

Water lấy dữ liệu từ AVC. Energy hiện demo. Parking toàn bộ demo. CO2/VOC/pressure
và một số Page 07/PCCC fields đang chờ IoT team confirm; không invent field live.

Khi coding, luôn inspect repository, AGENTS.md và latest Small Phase handoff trước
khi khẳng định trạng thái implementation hoặc tạo file/schema mới.
```

---

## 18. Version history

| Version | Date | Summary |
| --- | --- | --- |
| 2.0.0 | 2026-09-25 | Chuẩn hóa Project KB thành high-level master source; cập nhật NestJS/PostgreSQL baseline, current IoT API authority, Water = AVC, Dashboard 7-page scope, report-data principle, alert scope, CASL authorization và ant-design-charts; chuyển exact IoT/Dashboard details sang domain master documents. |
| 1.0.0 | 2026-09-16 | Historical Project Knowledge Base snapshot trước khi current IoT API và Dashboard Big Phase được freeze. |

**End of Knowledge Base.**
