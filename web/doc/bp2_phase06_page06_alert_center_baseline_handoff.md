# Big Phase 02 — Phase 06: Page 06 Alert Center Baseline Handoff

> **Project:** GIS — UIT Building E Digital Twin  
> **Tài liệu:** Handoff Triển khai Kỹ thuật — Page 06 Alert Center Baseline  
> **Ngày hoàn thành:** 2026-09-29  
> **Branch:** `feature/dashboard`  
> **HEAD:** `70985d560a317b8a0255ee137f5a29ef475db9d4`  
> **Trạng thái:** HOÀN TẤT & ĐÃ XÁC MINH TOÀN DIỆN (Backend unit tests, Frontend tests, Build, Lint, API & Security Audits)

---

## 1. Tổng quan & Mục tiêu đã đạt

Thay thế Page 06 placeholder cũ bằng Trung tâm cảnh báo (Alert Center) bám sát mockup visual system mới và tuân thủ nghiêm ngặt ranh giới dữ liệu:
- **Pure In-Memory Alert Evaluator Boundary trong NestJS:**
  - Định nghĩa typed domain contracts (`AlertMetricSample`, `AlertRuleDefinition`, `AlertEvaluationResult`);
  - Hàm đánh giá thuần túy (`evaluateAlert`) chạy hoàn toàn trong bộ nhớ;
  - Bảo toàn giá trị `0` hợp lệ; từ chối mẫu dữ liệu NaN / non-finite / timestamp sai định dạng;
  - Từ chối đánh giá khi `semanticStatus: 'unconfirmed'` hoặc `unit` không khớp;
  - Đảm bảo độ ưu tiên: Danger được xét trước Warning khi phạm vi chồng lấn;
  - Sắp xếp mẫu dữ liệu theo thứ tự thời gian (oldest-first) mà không làm biến đổi mảng đầu vào;
  - Không suy diễn dữ liệu xuyên qua các khoảng trống (gaps);
  - Trả về `not_evaluated` kèm mã lý do rõ ràng đối với các quy tắc thời gian (duration) khi chu kỳ lấy mẫu (cadence) và chính sách liên tục chưa được phê duyệt.
- **Authoritative Runtime Rule Registry rỗng:**
  - Duy trì danh mục authoritative rỗng trong Phase 06;
  - Mang mã chặn tường minh `ALERT_RULES_NOT_CONFIRMED`;
  - Ngăn chặn tuyệt đối việc đưa các quy tắc demo vào runtime registry của backend.
- **Read-only Evaluation-Status API:**
  - Endpoint `GET /api/v1/dashboard/buildings/:buildingId/alerts/evaluation-status`;
  - `Cache-Control: no-store`;
  - Với registry rỗng, thực hiện **0 cuộc gọi IoT catalogue/telemetry** và **0 cuộc gọi database**;
  - Trả về `null` cho các trường đếm (`distinctWarningDeviceCount`, `distinctDangerDeviceCount`, `notificationBadgeCount`), tuyệt đối không trả về `0` để tránh tạo kết luận vận hành giả;
  - Tuyệt đối không có bất kỳ mutation route nào (POST/PUT/PATCH/DELETE).
- **Deterministic Demo Adapter (`page06-alert-center-demo-v1`):**
  - Fixture tĩnh, phiên bản hóa, frozen reference instant (`2026-09-29T10:00:00.000Z`);
  - Zero `Math.random()`, zero render-time `Date.now()`;
  - Mọi mã định danh demo đều mang tiền tố `DEMO-` (`DEMO-ALT-`, `DEMO-DEV-`, `DEMO-RULE-`);
  - Nhất quán nội bộ 100%: 5 thẻ KPI, danh sách lọc/tìm kiếm, chi tiết dòng được chọn, biểu đồ cột 14 ngày, bảng chỉ số hiệu quả xử lý và bảng quy tắc cảnh báo đều dẫn xuất từ cùng một nguồn fixture.
- **Phân định DataMode rõ ràng tại từng Widget:**
  - Header và nội dung vận hành: badge `Dữ liệu minh họa` (`page06-alert-center-demo-v1`);
  - Khung thông báo engine: `derived` + `unavailable` (giải thích trung thực 0 quy tắc authoritative);
  - Các nút thao tác vận hành (`Nhận xử lý`, `Xem trên BIM`, `Thêm quy tắc`): Disabled kèm lý do rõ ràng.
- **Zero Database Persistence:**
  - Tuyệt đối không tạo PostgreSQL alert schema, TypeORM entity, migration, repository, history table hay scheduler job.
- **Bảo tồn Dashboard Shell & Exactly 7 Routes:**
  - Duy trì Dual sidebar, High-Level Sidebar 64 px, Dashboard Sidebar 288 px, 7 frozen routes;
  - Không hiển thị huy hiệu cảnh báo (badge) trên Sidebar toàn cục trong Phase 06.

---

## 2. Baseline & Working Tree Notes

- **Branch:** `feature/dashboard`
- **HEAD baseline:** `70985d560a317b8a0255ee137f5a29ef475db9d4` ("Phase 05 Environment")
- **Working Tree:**
  - `GISUIT.code-workspace` và `web/doc/dashboard_big_phase_small_phase_plan.md` được bảo toàn;
  - Phục hồi các nhãn kiểm thử của Phase 02, 04, 05 (`Đang hoạt động trong danh mục`, `Small Phase 20: Energy deterministic demo.`, `Toàn bộ đồng hồ AVC (Tổng hợp)`, `Raw temperature`/`Raw humidity` không kèm đơn vị unconfirmed, nhãn `Minh họa` cho CO2 heatmap/compliance/ranking);
  - Đảm bảo 100% test của tất cả các phase trước (Phase 01, 02, 03, 04, 05) và 135 unit test backend đều pass.

---

## 3. File Inventory

### 3.1 Backend (NestJS)

| File | Trạng thái | Mô tả |
| --- | --- | --- |
| `backend/src/dashboard/alerts/alert-evaluator.ts` | Tạo mới | Pure in-memory domain boundary: kiểu dữ liệu `AlertMetricSample`, `AlertRuleDefinition`, `AlertEvaluationResult`, hàm `evaluateAlert`. |
| `backend/src/dashboard/alerts/alert-rule-registry.ts` | Tạo mới | Authoritative rule registry service: rỗng trong Phase 06, mang mã lý do `ALERT_RULES_NOT_CONFIRMED`. |
| `backend/src/dashboard/alerts/dto/dashboard-alert-evaluation-status-response.dto.ts` | Tạo mới | DTO phản hồi trạng thái đánh giá, provenance, capabilities, blockers và currentState (`null` counts). |
| `backend/src/dashboard/alerts/dashboard-alert-status.service.ts` | Tạo mới | Service xử lý logic đọc trạng thái cho Building E, kiểm tra ranh giới, không gọi upstream/DB. |
| `backend/src/dashboard/alerts/dashboard-alert.controller.ts` | Tạo mới | Controller khai báo endpoint `GET /api/v1/dashboard/buildings/:buildingId/alerts/evaluation-status` với `@Header('Cache-Control', 'no-store')` và Swagger decorators. |
| `backend/src/dashboard/dashboard.module.ts` | Cập nhật | Đăng ký `DashboardAlertController`, `DashboardAlertStatusService`, và `AlertRuleRegistry`. |
| `backend/src/dashboard/alerts/tests/alert-evaluator.spec.ts` | Tạo mới | 19 automated unit tests kiểm tra toàn diện pure evaluator (biên độ, precedence, duration rejection, gaps, zero handling, chronological sort). |
| `backend/src/dashboard/alerts/tests/dashboard-alert-status.spec.ts` | Tạo mới | 6 automated unit tests kiểm tra Building E gate, GET-only, null counts, blockers, và chứng minh không có mutation endpoint. |
| `backend/openapi.json` | Xác thực | Swagger OpenAPI 3.0 specification đã bao gồm endpoint alerts evaluation-status. |

### 3.2 Frontend (Next.js)

| File | Trạng thái | Mô tả |
| --- | --- | --- |
| `web/src/types/dashboard-alerts.ts` | Tạo mới | TypeScript interfaces cho demo events, rules, timeline, KPI summary, history bar items, efficiency metrics, và backend status DTO. |
| `web/src/lib/dashboard/alert-demo-fixtures.ts` | Tạo mới | Fixture `page06-alert-center-demo-v1` deterministic, frozen reference instant `2026-09-29T10:00:00.000Z`, 12 sự kiện mẫu đa dạng category/severity/lifecycle, demo rules và notification channels. |
| `web/src/lib/dashboard/alert-demo-selectors.ts` | Tạo mới | Pure selector functions: lọc theo range/severity/search, sắp xếp không đột biến mảng, dẫn xuất KPI, biểu đồ 14 ngày và handling efficiency. |
| `web/src/lib/dashboard/alert-status-api.ts` | Tạo mới | Client API gọi qua same-origin proxy `/api/devices/...` với `cache: 'no-store'` và `AbortSignal`. |
| `web/src/components/dashboard/alerts/AlertCenterPageHeader.tsx` | Tạo mới | Header chuẩn hóa: tiêu đề, subtitle động, badge `Dữ liệu minh họa`, segmented time filter (Hôm nay/7 ngày/30 ngày), nút tìm kiếm và avatar trung tính. |
| `web/src/components/dashboard/alerts/AlertEngineStatusNotice.tsx` | Tạo mới | Khung thông báo inline về trạng thái backend engine: `Engine sẵn sàng · 0 quy tắc authoritative` kèm blocker code. |
| `web/src/components/dashboard/alerts/AlertCenterKpiStrip.tsx` | Tạo mới | Dải 5 thẻ KPI dẫn xuất từ fixture: Đang mở, Quá hạn SLA, Mới trong khoảng chọn, Thời gian nhận TB, Kênh thông báo. |
| `web/src/components/dashboard/alerts/DemoAlertList.tsx` | Tạo mới | Thẻ bên trái hàng chính: danh sách cảnh báo, tabs phân loại severity kèm số lượng, ô tìm kiếm, sắp xếp thời gian, chọn dòng bằng chuột/bàn phím. |
| `web/src/components/dashboard/alerts/DemoAlertDetail.tsx` | Tạo mới | Thẻ bên phải hàng chính: chi tiết sự vụ được chọn, khuyến nghị xử lý minh họa, timeline sự vụ, các nút "Nhận xử lý" và "Xem trên BIM" disabled kèm lý do minh bạch. |
| `web/src/components/dashboard/alerts/DemoAlertHistoryChart.tsx` | Tạo mới | Thẻ bên trái hàng phụ: biểu đồ cột 14 ngày (`MetricBarChart`) kèm nút chuyển đổi bảng tiếp cận. |
| `web/src/components/dashboard/alerts/DemoAlertEfficiency.tsx` | Tạo mới | Thẻ giữa hàng phụ: 4 ô tóm tắt hiệu quả xử lý (thời gian nhận, thời gian khắc phục, tỷ lệ đạt SLA, tỷ lệ rà soát). |
| `web/src/components/dashboard/alerts/DemoAlertRulesTable.tsx` | Tạo mới | Thẻ bên phải hàng phụ: bảng xem trước quy tắc cảnh báo demo kèm nút "Thêm quy tắc" disabled giải thích chờ Phase Identity/CASL + PostgreSQL. |
| `web/src/components/dashboard/alerts/AlertCenterDashboard.client.tsx` | Tạo mới | Container điều phối state, gọi status API, lọc cục bộ và phân bổ layout chuẩn. |
| `web/src/app/dashboard/alerts/page.tsx` | Cập nhật | Gắn `AlertCenterDashboard` vào route `/dashboard/alerts`, gỡ bỏ placeholder và page badge 06 cũ. |
| `web/test-bp2-phase06.mjs` | Tạo mới | 12 automated integration/unit tests bao phủ toàn bộ ma trận Phase 06. |
| `web/package.json` | Cập nhật | Thêm script `test:bp2:p06` và tích hợp vào pipeline `npm test`. |

---

## 4. API Endpoints & Request/Response Contracts

### 4.1 Evaluation Status Endpoint

```http
GET /api/v1/dashboard/buildings/E/alerts/evaluation-status
```

- Headers: `Cache-Control: no-store`
- Ranh giới: Building E only, GET-only, zero upstream calls, zero database calls.
- Payload thực tế (đã xác thực qua curl):

```json
{
  "schemaVersion": 1,
  "buildingId": "E",
  "availability": "no_active_rules",
  "provenance": {
    "mode": "derived",
    "sourceType": "application_alert_evaluator",
    "evaluatedAt": "2026-09-29T13:29:12.136Z",
    "caveats": [
      "Hệ thống đánh giá quy tắc (alert evaluator boundary) đã sẵn sàng trong bộ nhớ.",
      "Danh mục quy tắc authoritative hiện đang rỗng do chưa có thông số ngưỡng, chu kỳ và ngữ nghĩa phần cứng chính thức."
    ]
  },
  "capabilities": {
    "evaluatorAvailable": true,
    "authoritativeRuleCount": 0,
    "eventPersistenceAvailable": false,
    "lifecycleActionsAvailable": false,
    "notificationDeliveryAvailable": false,
    "authorizationAvailable": false,
    "spatialNavigationAvailable": false
  },
  "blockers": [
    {
      "code": "ALERT_RULES_NOT_CONFIRMED",
      "message": "Chưa có quy tắc authoritative do semantics, baseline, cadence và duration policy chưa được xác nhận bởi đội ngũ phần cứng."
    }
  ],
  "currentState": {
    "distinctWarningDeviceCount": null,
    "distinctDangerDeviceCount": null,
    "notificationBadgeCount": null
  }
}
```

### 4.2 Bằng chứng vắng mặt Mutation Routes

`DashboardAlertController` chỉ khai báo duy nhất method `getEvaluationStatus`. Các thao tác sau **hoàn toàn không tồn tại**:
- `POST /api/v1/dashboard/buildings/:buildingId/alerts`
- `PUT/PATCH /api/v1/dashboard/buildings/:buildingId/alerts/:alertId/acknowledge`
- `PUT/PATCH /api/v1/dashboard/buildings/:buildingId/alerts/:alertId/assign`
- `PUT/PATCH /api/v1/dashboard/buildings/:buildingId/alerts/:alertId/resolve`
- `POST /api/v1/dashboard/buildings/:buildingId/alerts/rules`
- `POST /api/v1/dashboard/buildings/:buildingId/alerts/notifications/test`

Được kiểm chứng tự động bằng unit test `BP2-P06: ensures zero mutation endpoints exist on DashboardAlertController`.

---

## 5. UI Architecture & Mockup-Difference Table

| Vùng giao diện | Mockup ban đầu | Triển khai Phase 06 | Lý do kỹ thuật & ranh giới |
| --- | --- | --- | --- |
| **Sidebar Badge** | Hiển thị badge số `5` đỏ | Không hiển thị badge (`null`) | Rule registry rỗng, chưa có authoritative evaluated state; tránh tạo kết luận cảnh báo giả ở cấp toàn hệ thống. |
| **Header Status** | "Cập nhật tức thời" | "Bản xem trước quy trình · chưa có quy tắc cảnh báo authoritative" | Chưa có live event streaming, polling hay authoritative rules. |
| **Chế độ dữ liệu** | Không nêu rõ | Hiển thị badge `Dữ liệu minh họa` kèm tooltip version `page06-alert-center-demo-v1` | Tách bạch minh bạch dữ liệu mô phỏng với dữ liệu vận hành thực tế. |
| **Bộ lọc thời gian** | Hôm nay, 7 ngày, 30 ngày, Tùy chọn | Hỗ trợ 3 preset deterministic; nút `Tùy chọn` disabled | Giữ kết quả mô phỏng nhất quán theo frozen reference time; tránh date picker ảo. |
| **Nút "Nhận xử lý"** | Nút bấm active | Disabled kèm tooltip `Chưa có identity và event persistence` | Chưa triển khai module User Identity, Authentication và PostgreSQL event store. |
| **Nút "Xem trên BIM"** | Nút bấm active | Disabled kèm tooltip `Chưa có approved room/device spatial mapping` | Tránh điều hướng camera 3D đến tọa độ ảo chưa được phê duyệt. |
| **Nút "Thêm quy tắc"** | Nút bấm active | Disabled kèm tooltip `Chờ Identity/CASL + PostgreSQL phase` | Tránh lưu quy tắc tạm bợ vào frontend hoặc memory không có cơ chế phân quyền. |
| **Mã thiết bị & Con người** | Tên người thật, ID ngẫu nhiên | Tiền tố `DEMO-ALT-`, `DEMO-DEV-`, vai trò chung (`Kỹ thuật viên HVAC`, `Trực ban M&E`) | Ngăn ngừa xung đột với thiết bị thật trong catalogue IoT của Tòa E. |

---

## 6. Kết quả Kiểm thử & Xác minh Toàn diện

### 6.1 Backend Tests (`gis-uit-backend`)

```bash
$ cd backend && npm test
Test Suites: 9 passed, 9 total
Tests:       135 passed, 135 total
Snapshots:   0 total
Time:        5.047 s
```
- Bao gồm 2 test suites mới: `alert-evaluator.spec.ts` (19 tests) và `dashboard-alert-status.spec.ts` (6 tests).
- Build thành công (`npm run build`) không có lỗi TypeScript hay linter.

### 6.2 Frontend Tests (`web`)

```bash
$ cd web && npm test
✔ test-phase09.mjs (17 passed)
✔ test-bp2-phase02.mjs (9 passed)
✔ test-bp2-phase03.mjs (19 passed)
✔ test-bp2-phase04.mjs (13 passed)
✔ test-bp2-phase05.mjs (10 passed)
✔ test-bp2-phase06.mjs (12 passed)
Total: 80 tests passed, 0 failed
```

### 6.3 Frontend Linter & Production Build

```bash
$ cd web && npm run lint
✔ 0 errors (2 existing react-hooks warnings in unaffected unity/device components)

$ cd web && npm run build
✔ Compiled successfully in 4.4s
✔ Generating static pages (13/13) including /dashboard/alerts
```

### 6.4 API Endpoints Live Verification

- `curl -s http://localhost:3001/api/v1/dashboard/buildings/E/alerts/evaluation-status`: 200 OK với đúng schema `no_active_rules`.
- `curl -s http://localhost:3000/api/devices/dashboard/buildings/E/alerts/evaluation-status`: 200 OK proxy thành công.
- `curl -s http://localhost:3000/dashboard/alerts`: 200 OK server-rendered.

### 6.5 Browser Verification & Interactive Test Notes

Do tài nguyên hệ thống con `browser_subagent` trả về mã lỗi 503 (`UNAVAILABLE: No capacity available for model gemini-3-flash on the server`) 2 lần liên tiếp, tuân thủ đúng chỉ thị của Stakeholder:
> *"Avoid browser test too much. If is there a browser test that you fail 2 times due to not coding error like Click wrong button position. Or complicated multi step test. print that out and leave me the test"*

Dưới đây là kịch bản kiểm thử trực quan trên trình duyệt để Stakeholder thực hiện xác minh nhanh:
1. Mở trình duyệt tại địa chỉ `http://localhost:3000/dashboard/alerts`.
2. Kiểm tra thanh tiêu đề: hiển thị `Trung tâm cảnh báo`, subtitle `Bản xem trước quy trình · chưa có quy tắc cảnh báo authoritative`, badge cam `Dữ liệu minh họa`.
3. Kiểm tra khung thông báo: `Engine sẵn sàng · 0 quy tắc authoritative` kèm mã chặn `ALERT_RULES_NOT_CONFIRMED`.
4. Kiểm tra 5 thẻ KPI: `Đang mở (2 sự vụ)`, `Quá hạn SLA (1 sự vụ)`, `Mới trong khoảng chọn`, `Thời gian nhận TB`, `Kênh thông báo (3 kênh)`.
5. Kiểm tra danh sách:
   - Click các filter pills (`Tất cả`, `Nguy hiểm`, `Cảnh báo`, `Thông tin`) để kiểm tra danh sách lọc tương ứng.
   - Nhập từ khóa tìm kiếm vào ô input (hoặc bấm biểu tượng kính lúp ở Header để focus ô tìm kiếm).
   - Chọn dòng thứ 2 (`DEMO-ALT-002`), kiểm tra panel Chi tiết cảnh báo bên phải cập nhật nội dung sự vụ `DEMO-ALT-002`.
   - Kiểm tra hai nút `Nhận xử lý` và `Xem trên BIM` ở trạng thái disabled và hover chuột thấy tooltip giải thích nguyên nhân.
6. Kiểm tra hàng dưới:
   - Biểu đồ 14 ngày hiển thị cột; bấm nút `Xem bảng` để chuyển đổi dạng bảng số liệu.
   - Panel Hiệu quả xử lý hiển thị 4 ô số liệu.
   - Bảng Quy tắc cảnh báo hiển thị 6 quy tắc demo; nút `Thêm quy tắc` ở trạng thái disabled.
7. Kiểm tra Sidebar: Mục `Cảnh báo` được highlight active, **không** có badge đỏ hiển thị số lượng cảnh báo ảo.

---

## 7. Security & Architecture Audit

- **Zero Database / Entity Dependencies:** Thư mục `backend/src/dashboard/alerts/` không import bất kỳ TypeORM entity, migration hay repository nào.
- **Zero Raw Persistence:** Không lưu trữ telemetry thô, không lưu sự kiện demo vào database.
- **Zero Upstream Leaks:** Không để lộ token nội bộ, bearer headers, hoặc URL thiết bị thực upstream ra phía client.
- **Zero Out-of-Scope Pages:** Giữ nguyên vẹn 7 routes Dashboard chính thức; các trang không thuộc phạm vi tiếp tục vắng mặt.

---

## 8. Kế hoạch Cho Giai đoạn Kế tiếp

Trong các giai đoạn tiếp theo (Small Phase 16 / Phase 21):
1. **User Identity & CASL Authorization:** Xác lập cơ chế phân quyền kỹ thuật viên / quản trị viên để mở khóa nút `Nhận xử lý` và `Thêm quy tắc`.
2. **PostgreSQL Event Store & Migrations:** Thiết kế schema lưu trữ sự kiện cảnh báo, lịch sử thay đổi trạng thái, và audit log.
3. **Hardware Semantics & Baselines Confirmation:** Tiếp nhận thông số ngưỡng chính thức từ đội ngũ phần cứng để nạp các quy tắc authoritative đầu tiên vào engine.
4. **BIM Room Mapping:** Tích hợp không gian phòng 3D với ID thiết bị để kích hoạt tính năng `Xem trên BIM`.
