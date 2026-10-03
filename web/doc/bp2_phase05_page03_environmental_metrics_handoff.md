# Big Phase 02 — Phase 05: Page 03 Environmental Metrics Handoff

> **Project:** GIS — UIT Building E Digital Twin  
> **Tài liệu:** Handoff Triển khai Kỹ thuật — Page 03 Environmental Metrics (IAQ)  
> **Ngày hoàn thành:** 2026-09-27  
> **Branch:** `feature/dashboard`  
> **HEAD:** `fab8c78`  
> **Trạng thái:** HOÀN TẤT & ĐÃ XÁC MINH TOÀN DIỆN (Backend unit tests, Frontend tests, Build, Lint, Browser Subagent Visual QA)  

---

## 1. Tổng quan & Mục tiêu đã đạt

Thay thế Page 03 placeholder cũ bằng trang Môi trường (IAQ) bám sát mockup visual system mới và tuân thủ nghiêm ngặt data truthfulness:
- **Đọc catalogue và telemetry Solar qua NestJS application boundary:** Tái sử dụng `DashboardIotCatalogueService` và `IotTelemetryService` hiện hữu, lọc chính xác `sourceDeviceType === 'solar'`, tuyệt đối không gọi HTTP nội bộ giữa các service.
- **Bảo toàn Raw Source Fields:** Các trường `rawTemperature` và `rawHumidity` được giữ nguyên dưới dạng số đo thô, không tự ý gán đơn vị (°C, %) hay suy diễn đây là nhiệt độ/độ ẩm phòng khi phần cứng chưa xác nhận semantics.
- **Tính toán Request-scoped In-Memory Population Summary:**
  - Endpoint `GET /api/v1/dashboard/buildings/E/environment/summary` tính mean/min/max trong memory theo từng request;
  - Giới hạn tải: tối đa 20 nguồn Solar (`sourcesTruncated = true` nếu vượt quá), concurrency tối đa 2 kết nối upstream đồng thời, `limit = 1`, khoảng thời gian tối đa 24 giờ;
  - Khả năng chịu lỗi từng phần: lỗi/timeout của 1 nguồn không làm sập toàn bộ request mà chuyển sang trạng thái `partial` kèm caveats minh bạch.
- **Deterministic Demo Adapter cho CO₂ và VOC (`page03-co2-demo-v1`):**
  - Fixture tĩnh, phiên bản hóa, hoàn toàn không dùng `Math.random()`;
  - Nhất quán nội bộ: KPI CO₂ trung bình, bản đồ nhiệt phòng × giờ (heatmap), xếp hạng phòng nồng độ cao nhất (ranking) và % thời gian đạt chuẩn theo tầng (compliance) đều được dẫn xuất từ cùng một nguồn fixture.
- **Phân định DataMode rõ ràng tại từng Widget:**
  - `live`: Nguồn telemetry Solar được chọn;
  - `derived`: Tóm tắt thống kê mẫu raw theo request;
  - `demo`: CO₂, VOC, heatmap phòng, ranking, compliance 7 ngày;
  - `unavailable`: Chỉ số IAQ tổng hợp, PM2.5, ngưỡng cảnh báo chính thức (`—`).
- **Zero Database Persistence:** Hoàn toàn không tạo PostgreSQL report schema, migration, entity, cache table hay background job.
- **Bảo tồn Dashboard Shell & 7 Routes:** Giữ vững High-Level Sidebar 64 px, Dashboard Sidebar 288 px, 7 frozen routes và token màu sắc đồng bộ.

---

## 2. Baseline & Working Tree Notes

- **Branch:** `feature/dashboard`
- **HEAD baseline:** `fab8c78df8db78376e73fa18786b08c34860eef6` ("Phase 04: Water & Energy phase")
- **Working Tree:**
  - Thay đổi sẵn có trước phase ở `GISUIT.code-workspace` và `web/doc/dashboard_big_phase_small_phase_plan.md` được giữ nguyên vẹn;
  - Sửa lỗi Rules of Hooks (`useMemo` đặt sau conditional return) trong `MetricTrendChart.tsx` và unescaped quotes trong `WaterMeterList.tsx`;
  - Đảm bảo toàn bộ 13 test của Phase 04 (`test-bp2-phase04.mjs`) và 47 unit test backend cũ tiếp tục pass 100%.

---

## 3. File Inventory

### 3.1 Backend (NestJS)

| File | Trạng thái | Mô tả |
| --- | --- | --- |
| `backend/src/dashboard/dto/dashboard-environment-source-list-response.dto.ts` | Tạo mới | DTO danh sách nguồn Solar candidate (`sources[]`, `summary`, `provenance`). |
| `backend/src/dashboard/dto/dashboard-environment-summary-query.dto.ts` | Tạo mới | Query DTO cho summary (`start`, `stop`, duration cap 24h). |
| `backend/src/dashboard/dto/dashboard-environment-summary-response.dto.ts` | Tạo mới | DTO tóm tắt thống kê (mean/min/max cho rawTemperature, rawHumidity, lux, `coverage`, `sourceResults`). |
| `backend/src/dashboard/dto/dashboard-environment-readings-query.dto.ts` | Tạo mới | Query DTO cho single source readings (`start`, `stop`, duration cap 7d, `limit: 1..1000`). |
| `backend/src/dashboard/dto/dashboard-environment-readings-response.dto.ts` | Tạo mới | DTO readings nguồn Solar, `latestSample`, `coverage`, caveats. |
| `backend/src/dashboard/dashboard-environment-summary.ts` | Tạo mới | Pure calculation functions: tính mean/min/max trong memory, bảo toàn valid 0, bỏ qua null/non-finite, tính latest timestamp. |
| `backend/src/dashboard/dashboard-environment.service.ts` | Tạo mới | Service nghiệp vụ: lọc Solar từ catalogue, bounded fetch với concurrency 2, calculate summary, validate type gate `solar`, sanitize error. |
| `backend/src/dashboard/dashboard-environment.controller.ts` | Tạo mới | Controller khai báo 3 endpoints Environment với `@Header('Cache-Control', 'no-store')` và Swagger OpenAPI decorators. |
| `backend/src/dashboard/dashboard.module.ts` | Cập nhật | Đăng ký `DashboardEnvironmentController` và `DashboardEnvironmentService`. |
| `backend/src/dashboard/tests/dashboard-environment.spec.ts` | Tạo mới | 14 automated unit tests bao phủ filter Solar, duration caps, concurrency, error sanitization, in-memory math. |
| `backend/openapi.json` | Cập nhật | Xuất OpenAPI 3.0 specification với 3 endpoints Environment mới. |

### 3.2 Frontend (Next.js)

| File | Trạng thái | Mô tả |
| --- | --- | --- |
| `web/src/types/dashboard-environment.ts` | Tạo mới | TypeScript interfaces cho source list, summary, readings, demo fixtures, presets. |
| `web/src/lib/dashboard/environment-demo-fixtures.ts` | Tạo mới | Fixture mẫu `page03-co2-demo-v1` deterministic cho CO2, VOC, phòng, giờ, ranking và compliance. |
| `web/src/lib/dashboard/environment-range.ts` | Tạo mới | Helper tính khoảng thời gian UTC cho `24h`, `72h`, `7d` và fixed 24h summary range. |
| `web/src/lib/dashboard/environment-api.ts` | Tạo mới | Client API gọi qua same-origin proxy `/api/devices/...` với `cache: no-store` và `AbortSignal`. |
| `web/src/lib/dashboard/environment-chart.ts` | Tạo mới | Adapter chuẩn bị dữ liệu biểu đồ oldest-first, bảo toàn số 0 hợp lệ và gán nhãn metric. |
| `web/src/components/dashboard/environment/EnvironmentPageHeader.tsx` | Tạo mới | Header chuẩn hóa: tiêu đề, subtitle động, badges chế độ dữ liệu, `TimeFilterSegmented` (24h/72h/7d), nút tìm kiếm và avatar icon trung tính. |
| `web/src/components/dashboard/environment/EnvironmentKpiStrip.tsx` | Tạo mới | Dải 6 thẻ KPI: IAQ (Unavailable), CO2 (Demo), Raw temp (Derived), Raw humidity (Derived), VOC (Demo), PM2.5 (Unavailable). |
| `web/src/components/dashboard/environment/Co2DemoHeatmap.tsx` | Tạo mới | Thẻ bên trái hàng chính: bản đồ nhiệt CO₂ phòng × giờ (Demo), filter tầng, popover chi tiết ô, nút chuyển đổi sang bảng tiếp cận HTML table. |
| `web/src/components/dashboard/environment/Co2DemoRanking.tsx` | Tạo mới | Thẻ bên phải hàng chính: bảng xếp hạng phòng CO₂ cao nhất (Demo) kèm progress bar ngang. |
| `web/src/components/dashboard/environment/Co2DemoCompliance.tsx` | Tạo mới | Thẻ bên trái hàng phụ: % thời gian đạt chuẩn CO₂ (7 ngày) phân bố theo các tầng. |
| `web/src/components/dashboard/environment/EnvironmentThresholdTable.tsx` | Tạo mới | Thẻ bên phải hàng phụ: bảng ngưỡng cảnh báo (Read-only) kèm nút "Sửa ngưỡng" disabled giải thích chờ Phase Alert. |
| `web/src/components/dashboard/environment/EnvironmentSourcePicker.tsx` | Tạo mới | Modal chọn nguồn Solar candidate: tìm kiếm theo ID, filter theo tầng, hiển thị trạng thái catalogue. |
| `web/src/components/dashboard/environment/EnvironmentSourceDetail.tsx` | Tạo mới | Khung hiển thị chi tiết nguồn Solar đã chọn: chọn metric trend (`MetricTrendChart`), thông số radio/mã cờ, disclaimer. |
| `web/src/components/dashboard/environment/EnvironmentDashboard.client.tsx` | Tạo mới | Container điều phối state, request đồng thời, cancel request cũ và render layout chuẩn. |
| `web/src/app/dashboard/environment/page.tsx` | Cập nhật | Gắn `EnvironmentDashboard` vào route `/dashboard/environment`, gỡ bỏ placeholder cũ. |
| `web/test-bp2-phase05.mjs` | Tạo mới | 10 automated integration/unit tests cho Phase 05. |
| `web/package.json` | Cập nhật | Thêm script `test:bp2:p05` và tích hợp vào pipeline `npm test`. |

---

## 4. API Endpoints & Request/Response Contracts

### 4.1 Danh sách nguồn Solar Environment

```http
GET /api/v1/dashboard/buildings/:buildingId/environment/sources
GET /api/v1/dashboard/buildings/:buildingId/environment/sources?floorId=4
```

- Headers: `Cache-Control: no-store`
- Response Schema:
```json
{
  "schemaVersion": 1,
  "buildingId": "E",
  "requestedFloorId": null,
  "availability": "ready",
  "provenance": {
    "mode": "live",
    "sourceType": "iot_backend_catalogue",
    "fetchedAt": "2026-09-27T12:00:00.000Z",
    "caveats": [
      "Nguồn Solar với trường dữ liệu môi trường raw đang chờ xác nhận semantics từ đội ngũ phần cứng."
    ]
  },
  "summary": {
    "receivedCount": 4,
    "acceptedSolarCount": 4,
    "skippedCount": 0,
    "duplicateCount": 0,
    "truncated": false
  },
  "sources": [
    {
      "deviceId": "8cf95720000a0123",
      "sourceDeviceType": "solar",
      "catalogueActive": true,
      "sourceCreatedAt": "2026-09-20T10:00:00.000Z",
      "sourceUpdatedAt": "2026-09-20T10:00:00.000Z",
      "sourceLocation": { "floorLevel": 4, "x": 12.5, "y": 3.2, "z": 8.1 },
      "displayFloorId": "4",
      "floorAssignment": "source",
      "semanticStatus": "unconfirmed_environment_candidate"
    }
  ]
}
```

### 4.2 In-Memory Population Summary

```http
GET /api/v1/dashboard/buildings/:buildingId/environment/summary?start=2026-09-26T12:00:00.000Z&stop=2026-09-27T12:00:00.000Z
```

- Headers: `Cache-Control: no-store`
- Load bounds: duration cap 24h, max 20 sources, concurrency 2, `limit=1` per source.
- Response Schema:
```json
{
  "schemaVersion": 1,
  "buildingId": "E",
  "availability": "ready",
  "queryRange": {
    "start": "2026-09-26T12:00:00.000Z",
    "stop": "2026-09-27T12:00:00.000Z",
    "limitPerSource": 1
  },
  "provenance": {
    "mode": "derived",
    "sourceType": "iot_backend_solar",
    "calculation": "latest_sample_population_summary_v1",
    "fetchedAt": "2026-09-27T12:00:00.000Z",
    "calculatedAt": "2026-09-27T12:00:00.050Z",
    "caveats": [
      "Các trường rawTemperature và rawHumidity là số đo thô từ Solar telemetry, chưa được xác nhận ý nghĩa vật lý/đơn vị từ đội ngũ phần cứng.",
      "Chỉ số trung bình là tổng hợp thống kê theo request trên các mẫu mới nhất, không phải giá trị trung bình phòng hoặc tòa nhà."
    ]
  },
  "coverage": {
    "catalogueSolarCount": 4,
    "attemptedSourceCount": 4,
    "successfulSourceCount": 4,
    "emptySourceCount": 0,
    "failedSourceCount": 0,
    "sourcesTruncated": false
  },
  "metrics": {
    "rawTemperature": {
      "mean": 26.8,
      "min": 24.2,
      "max": 28.5,
      "contributingSourceCount": 4,
      "unit": null,
      "semanticStatus": "pending_hardware_confirmation"
    },
    "rawHumidity": {
      "mean": 63.5,
      "min": 58.0,
      "max": 68.2,
      "contributingSourceCount": 4,
      "unit": null,
      "semanticStatus": "pending_hardware_confirmation"
    },
    "lux": {
      "mean": 420,
      "min": 250,
      "max": 680,
      "contributingSourceCount": 4,
      "unit": "lux"
    }
  },
  "latestObservedAt": "2026-09-27T11:58:30.000Z",
  "sourceResults": [
    {
      "deviceId": "8cf95720000a0123",
      "status": "ready",
      "observedAt": "2026-09-27T11:58:30.000Z"
    }
  ]
}
```

### 4.3 Selected Solar Source Readings

```http
GET /api/v1/dashboard/buildings/:buildingId/environment/sources/:deviceId/readings?start=2026-09-26T12:00:00.000Z&stop=2026-09-27T12:00:00.000Z&limit=1000
```

- Headers: `Cache-Control: no-store`
- Load bounds: duration cap 7d, limit cap 1000, enforce server device type `solar`.

---

## 5. Bounded Concurrency & In-Memory Math Rules

1. **Concurrency Pool Implementation (`SUMMARY_CONCURRENCY = 2`):**
   ```typescript
   async function runWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]>
   ```
   Chia danh sách tối đa 20 candidate thành 2 luồng worker bất đồng bộ song song, đảm bảo không bao giờ gửi quá 2 request đồng thời lên upstream IoT backend.
2. **Xử lý số 0 hợp lệ:**
   - Giá trị `0` (ví dụ độ rọi 0 lux vào ban đêm hoặc nhiệt độ 0) được bảo toàn đầy đủ nhờ kiểm tra `typeof val === 'number' && Number.isFinite(val)`.
   - Các giá trị `null`, `undefined` hoặc `NaN` bị bỏ qua và không bị ép về số 0.
3. **Không làm tròn ở Backend:** Backend trả về `mean` số thực nguyên bản, việc định dạng số làm tròn (`vi-VN`, 1 chữ số thập phân) do tầng trình bày frontend đảm nhiệm.
4. **Zero Persistence Audit:** Hoàn toàn không import TypeORM, Repository, EntityManager, DataSource hay entity nào trong code `dashboard-environment`.

---

## 6. Deterministic Demo Contract (`page03-co2-demo-v1`)

- **Fixture ID:** `page03-co2-demo-v1`
- **Quy tắc:**
  - Không sử dụng `Math.random()`;
  - Toàn bộ phòng có tiền tố `DEMO-E-` rõ ràng;
  - CO₂ trung bình (`668 ppm`) là trung bình số học từ các giá trị giờ mới nhất (17:00) của tất cả phòng demo;
  - Danh sách xếp hạng được sắp xếp giảm dần từ cùng mảng giá trị 17:00 này;
  - Tỷ lệ % tuân thủ của các tầng được tính từ tỷ lệ số ô có giá trị ≤ 1.000 ppm trong toàn bộ 10 giờ làm việc;
  - Khi người dùng lọc theo tầng, chỉ lọc tập dữ liệu demo hiển thị, không gửi ID phòng demo vào API live.

---

## 7. Bảng so sánh với Mockup Tham chiếu

| Thành phần | Mockup | Phase 05 Hiện thực | Lý do & Quy tắc Truthfulness |
| --- | --- | --- | --- |
| Header subtext | "48 cảm biến RFT-SB · 5 phút/lần" | "{count} nguồn Solar candidate · calculation theo request" | IoT backend không có 48 cảm biến RFT-SB hay chu kỳ 5 phút chính thức; chỉ có các nguồn Solar trong catalogue |
| KPI 1: IAQ score | "82 · Tốt" | `—` (Unavailable) | Chưa có công thức IAQ score được phê chuẩn |
| KPI 2: CO₂ trung bình | "712 ppm · Ổn định" | `668 ppm` (Demo badge) | Dẫn xuất từ fixture `page03-co2-demo-v1` |
| KPI 3: Nhiệt độ | "25,8 °C · Mục tiêu 24–27°C" | `27` (Derived, **NO unit**) | Semantics và đơn vị nhiệt độ Solar chưa xác nhận; không có mục tiêu chính thức |
| KPI 4: Độ ẩm | "64 % · Mục tiêu 40–70%" | `77,7` (Derived, **NO unit**) | Semantics và đơn vị độ ẩm Solar chưa xác nhận; không tự thêm `%` |
| KPI 5: VOC | "0,08 mg/m³ · Tốt" | `0.06 mg/m³` (Demo badge) | Dẫn xuất từ fixture demo |
| KPI 6: PM2.5 | "12 µg/m³ · Tốt" | `—` (Unavailable) | Không có cảm biến bụi PM2.5 trong IoT backend |
| Heatmap | Tầng 1–6 với ID phòng cứng | Filter tầng linh hoạt + Demo phòng `DEMO-E-` | Phòng được đánh dấu rõ là demo, có nút chuyển "Xem Bảng" |
| Sửa ngưỡng | Nút "Sửa" có thể click | Nút "Sửa ngưỡng" disabled | Chờ Small Phase Alert + Identity/CASL |
| Avatar | Chữ lồng "AT" | Icon tài khoản người dùng trung tính | Tránh giả lập thông tin danh tính cá nhân khi chưa có user session |

---

## 8. Kết quả Kiểm thử Tự động

### 8.1 Backend Tests (`npm test -- --testPathPattern=dashboard`)

```text
PASS src/dashboard/tests/dashboard-iot-catalogue.spec.ts
PASS src/dashboard/tests/dashboard-iot-telemetry.spec.ts
PASS src/dashboard/tests/dashboard-environment.spec.ts
PASS src/dashboard/tests/dashboard-water.spec.ts

Test Suites: 4 passed, 4 total
Tests:       61 passed, 61 total
Snapshots:   0 total
Time:        2.973 s
```

### 8.2 Frontend Tests (`npm test`)

```text
> web@0.1.0 test
> node test-phase09.mjs && node test-bp2-phase02.mjs && node test-bp2-phase03.mjs && node test-bp2-phase04.mjs && node test-bp2-phase05.mjs

✔ Phase 09 Foundation: 17 passed
✔ Phase 02 Device Catalogue: 9 passed
✔ Phase 03 Live Telemetry Core: 19 passed
✔ Phase 04 Live Water Baseline: 13 passed
✔ Phase 05 Environmental Metrics: 10 passed

Total: 68 tests passed, 0 failed.
```

### 8.3 TypeScript Compilation & Production Build

- **NestJS backend:** `npm run build` -> Hoàn thành không có lỗi.
- **Next.js web:** `npm run build` -> Biên dịch thành công 100%, tạo static routes cho 7 Dashboard pages, bao gồm `/dashboard/environment`.
- **ESLint:** `npm run lint` -> 0 errors.

---

## 9. Bằng chứng Kiểm thử Giao diện (Browser Subagent)

Browser Subagent đã thực thi kiểm thử trực tiếp trên ứng dụng chạy tại `http://localhost:3000/dashboard/environment` và ghi lại video:
- **Video phiên tương tác:** `file:///Users/mac/.gemini/antigravity-ide/brain/2681f9b4-29cd-4a81-a58e-3ba204dc6b7c/environment_qa_1790514701141.webp`
- **Ảnh chụp màn hình phần trên:** `file:///Users/mac/.gemini/antigravity-ide/brain/2681f9b4-29cd-4a81-a58e-3ba204dc6b7c/env_dashboard_top_1790514755433.png`
- **Ảnh chụp màn hình phần dưới:** `file:///Users/mac/.gemini/antigravity-ide/brain/2681f9b4-29cd-4a81-a58e-3ba204dc6b7c/env_dashboard_bottom_1790514839009.png`
- **Ảnh chụp màn hình Modal chọn nguồn Solar:** `file:///Users/mac/.gemini/antigravity-ide/brain/2681f9b4-29cd-4a81-a58e-3ba204dc6b7c/solar_modal_open_1790514894770.png`

Kết quả kiểm tra thị giác:
1. Header hiển thị đúng: "Môi trường (IAQ) · Tòa E", dot xanh ngọc, badge chế độ dữ liệu rõ ràng.
2. Dải 6 KPI thẻ hiển thị chính xác các chế độ: IAQ (Unavailable), CO₂ (Demo, 668 ppm), Raw temperature (Derived, 27, không có °C), Raw humidity (Derived, 77,7, không có %), VOC (Demo, 0.06 mg/m³), PM2.5 (Unavailable).
3. Hàng chính: Heatmap CO₂ phân bổ phòng × giờ hiển thị sắc nét, click "Xem Bảng" chuyển đổi sang table accessible mượt mà, ranking phòng CO₂ cao nhất xếp hạng chuẩn xác.
4. Hàng phụ: % thời gian đạt chuẩn CO₂ 7 ngày hiển thị thanh tiến độ theo từng tầng, bảng ngưỡng cảnh báo read-only hiển thị rõ trạng thái từng thông số kèm nút sửa disabled.
5. Modal tìm kiếm nguồn Solar: Bấm nút kính lúp ở header mở popup modal "Chọn nguồn Solar Environment", hiển thị danh sách thiết bị và đóng modal bình thường.

---

## 10. Audit An toàn Thông tin & Bảo toàn Kiến trúc

- **Không rò rỉ thông tin nhạy cảm:** Kiểm tra toàn bộ mã nguồn frontend và backend: không chứa hardcoded Bearer token, password hay URL IoT nội bộ.
- **Không truy cập trực tiếp từ browser:** Mọi yêu cầu lấy telemetry đều đi qua Next.js same-origin proxy `/api/devices/...` tới NestJS controller.
- **Không ghi cơ sở dữ liệu:** Không có bảng mới, migration hay entity nào được đưa vào PostgreSQL trong phase này.
- **Bảo tồn Dashboard routes:** Duy nhất 7 routes chính thức:
  - `/dashboard/overview`
  - `/dashboard/energy-water`
  - `/dashboard/environment`
  - `/dashboard/fire-safety`
  - `/dashboard/alerts`
  - `/dashboard/iot`
  - `/dashboard/parking`

---

## 11. Hướng đi tiếp theo & Kế hoạch Small Phase sau

1. **Small Phase 14 / Phase 06:** Triển khai Alerts & Notifications (Page 06) — Tích hợp Alert Engine, cấu hình ngưỡng và phân quyền CASL.
2. **Small Phase 21:** Triển khai Database Persistence & Scheduled Aggregations cho dữ liệu báo cáo môi trường và năng lượng sau khi hardware semantics được chốt chính thức.
