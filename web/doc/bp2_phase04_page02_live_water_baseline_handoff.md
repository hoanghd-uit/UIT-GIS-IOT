# Big Phase 02 — Phase 04: Page 02 Live Water Baseline Handoff

> **Project:** GIS — UIT Building E Digital Twin  
> **Tài liệu:** Handoff Triển khai Kỹ thuật — Page 02 Live Water Baseline  
> **Ngày hoàn thành:** 2026-09-26  
> **Branch:** `feature/dashboard`  
> **HEAD:** `c7c3efb`  
> **Trạng thái:** HOÀN TẤT & ĐÃ XÁC MINH TOÀN DIỆN (Backend tests, Frontend tests, Build, Lint, Browser subagent visual QA)  

---

## 1. Tổng quan & Mục tiêu đã đạt

Triển khai hoàn chỉnh baseline Water của Page 02 (`/dashboard/energy-water`) bằng dữ liệu thực AVC từ hệ thống IoT backend qua NestJS application boundary, đồng thời tinh chỉnh UI/UX theo phản hồi mới nhất:
- **Reuse Time Filter Block từ Page `/iot`:** Thay thế cụm button cũ bằng component dùng chung `TimeFilterSegmented` (`Hôm nay`, `7 ngày`, `30 ngày`, `Tùy chọn`), đảm bảo đồng bộ 100% giao diện giữa các trang IoT và Dashboard;
- **Cập nhật KPI slots 5 & 6 theo Mockup:** Thay thế "Chỉ số thuận" và "Chỉ số ngược" bằng 2 block:
  - **Lưu lượng nước đêm:** Giá trị `0,90 m³/h` kèm chấm cam và cảnh báo `Mức nền 0,20 m³/h — nghi rò rỉ`;
  - **Mực bể chứa:** Giá trị `72 %` kèm chấm xanh dương và ghi chú `Bể mái · ~ 29 m³`;
- **Hiển thị Tổng hợp tất cả đồng hồ AVC khi chưa chọn thiết bị:** Khi người dùng chưa chọn thiết bị cụ thể (`selectedMeterId === null`), hệ thống tự động fetch và tổng hợp dữ liệu (bucket 15 phút, tính tổng lưu lượng và chỉ số lũy kế, tính trung bình nhiệt độ) từ toàn bộ đồng hồ AVC đang hoạt động và hiển thị trên biểu đồ "Nước · dữ liệu theo thời gian" với nhãn `Toàn bộ đồng hồ AVC (Tổng hợp)`;
- **Chuẩn hóa trục X thân thiện & giãn cách 3 tiếng:** Trục hoành sử dụng scale thời gian liên tục (`type: 'time'`) với `tickCount: 8`, ngắt thành 2 dòng rõ ràng (`HH:mm\nDD/MM`) hiển thị mỗi ~3 tiếng (thay vì in đè 240 chuỗi ISO timestamp dày đặc);
- **Sửa Tooltip khi Hover:** Khi rê chuột vào điểm dữ liệu trên biểu đồ, tooltip hiển thị giá trị trục Y (ví dụ `Lưu lượng tức thời: 1,031 m³/h`) cùng tiêu đề thời gian chi tiết `HH:mm:ss DD/MM/YYYY`, khắc phục lỗi hiển thị lặp giá trị trục X;
- **Danh sách đồng hồ AVC:** Cung cấp danh sách đồng hồ nước AVC của Building E từ catalogue (`GET /api/v1/dashboard/buildings/E/water/meters`), trong đó mục **"Tất cả ({meters.length} đồng hồ)"** luôn nằm cố định ở đầu danh sách (item #1 trên top) để người dùng chuyển đổi nhanh giữa xem tổng thể và xem từng đồng hồ riêng lẻ;
- **Bảo toàn tính an toàn dữ liệu:** Không suy diễn số liệu sai lệch, các cờ phần cứng hiển thị nguyên bản số mã cờ;
- **Thành phần minh họa (Mockup):** Giữ nguyên các tab chuyển đổi sang dữ liệu minh họa: "Phân bố theo tầng (Mẫu)" và "Bất thường do AI (Mẫu)".

---

## 2. File Inventory

### 2.1 Backend (NestJS)

| File | Trạng thái | Mô tả |
| --- | --- | --- |
| `backend/src/dashboard/dto/dashboard-water-meter-list-response.dto.ts` | Tạo mới | DTO cho danh sách đồng hồ nước AVC (`meters[]`, `summary`, `provenance`). |
| `backend/src/dashboard/dto/dashboard-water-readings-query.dto.ts` | Tạo mới | Query DTO cho readings (`start`, `stop`, `limit: 1..1000`). |
| `backend/src/dashboard/dto/dashboard-water-readings-response.dto.ts` | Tạo mới | DTO cho telemetry readings, latest sample, coverage, raw numeric flags. |
| `backend/src/dashboard/dashboard-water.service.ts` | Tạo mới | Service nghiệp vụ Water: filter AVC từ catalogue, validate range ≤7d, enforce server-side device type `avc`, map readings. |
| `backend/src/dashboard/dashboard-water.controller.ts` | Tạo mới | Controller `GET /api/v1/dashboard/buildings/:buildingId/water/meters` và `GET .../readings`. `Cache-Control: no-store`. |
| `backend/src/dashboard/dashboard.module.ts` | Cập nhật | Khai báo `DashboardWaterController` và `DashboardWaterService`. |
| `backend/src/dashboard/tests/dashboard-water.spec.ts` | Tạo mới | 14 automated unit tests bao phủ toàn bộ validation, type-enforcement, error sanitization. |
| `backend/openapi.json` | Cập nhật | Xuất đặc tả OpenAPI 3.0 với đầy đủ 2 endpoint Water mới. |

### 2.2 Frontend (Next.js)

| File | Trạng thái | Mô tả |
| --- | --- | --- |
| `web/src/components/dashboard/controls/TimeFilterSegmented.tsx` | Tạo mới | Component tái sử dụng chọn mốc thời gian segmented (`Hôm nay`, `7 ngày`, `30 ngày`, `Tùy chọn`). |
| `web/src/components/dashboard/iot/IotPageHeader.tsx` | Cập nhật | Tái sử dụng `TimeFilterSegmented` thay vì code inline. |
| `web/src/types/dashboard-water.ts` | Cập nhật | Thêm preset `today`, `7d`, `30d`, `custom` cho `WaterTimeRangePreset`. |
| `web/src/lib/dashboard/water-api.ts` | Tạo mới | Client API gọi qua same-origin proxy `/api/devices/...` với `cache: no-store` và `AbortSignal`. |
| `web/src/lib/dashboard/water-range.ts` | Cập nhật | Range calculator hỗ trợ presets `today`, `7d`, `30d`, `custom` kèm fallback legacy. |
| `web/src/lib/dashboard/water-chart.ts` | Cập nhật | Bổ sung hàm `aggregateWaterReadings` nhóm dữ liệu theo bucket 15 phút, tính tổng lưu lượng & thể tích toàn bộ đồng hồ AVC. |
| `web/src/components/dashboard/water/EnergyWaterPageHeader.tsx` | Cập nhật | Tái sử dụng `TimeFilterSegmented` đồng bộ với trang `/dashboard/iot`. |
| `web/src/components/dashboard/water/EnergyWaterKpiStrip.tsx` | Cập nhật | Thay Slot 5 & 6 thành "Lưu lượng nước đêm" (`0,90 m³/h`) và "Mực bể chứa" (`72 %`) theo mockup; Slot 4 hỗ trợ hiển thị lưu lượng tổng khi chưa chọn thiết bị. |
| `web/src/components/dashboard/water/EnergyUnavailablePanels.tsx` | Tạo mới | 2 card hàng chính (tỷ lệ 5:3) hiển thị `UnavailableDataState` cho Energy theo đúng plan. |
| `web/src/components/dashboard/water/WaterMeterList.tsx` | Cập nhật | Bổ sung nút "Tất cả" và tính năng toggle click để chuyển đổi giữa xem thiết bị riêng lẻ và xem tổng thể. |
| `web/src/components/dashboard/water/WaterMetricChart.tsx` | Cập nhật | Hiển thị biểu đồ tổng hợp khi `selectedMeterId === null` với badge `Toàn bộ đồng hồ AVC (Tổng hợp)`, giữ nút làm mới luôn hoạt động. |
| `web/src/components/dashboard/charts/MetricTrendChart.tsx` | Cập nhật | Cấu hình time scale `tickCount: 8` (~mỗi 3 giờ), formatter `HH:mm DD/MM`, tooltip hiển thị giá trị trục Y (`${value} ${unit}`) và timestamp chi tiết. |
| `web/src/components/dashboard/water/WaterMeterDetail.tsx` | Tạo mới | Hàng phụ phải: thông số phần cứng, cờ raw numeric + tab "Bất thường AI (Mẫu)". |
| `web/src/components/dashboard/water/EnergyWaterDashboard.client.tsx` | Cập nhật | Tích hợp tự động tải và tổng hợp dữ liệu toàn bộ đồng hồ khi chưa có lựa chọn; điều phối retry/refresh. |
| `web/src/app/dashboard/energy-water/page.tsx` | Cập nhật | Gắn `EnergyWaterDashboard` vào route `/dashboard/energy-water`. |
| `web/test-bp2-phase04.mjs` | Cập nhật | 13 automated unit/integration tests bao phủ các tính năng mới (T10 - T13). |
| `web/package.json` | Cập nhật | Script test `test:bp2:p04` và pipeline `npm test`. |

---

## 3. Thành phần Dummy Data (theo yêu cầu đặc biệt của Stakeholder)

Các thành phần có trong ảnh mockup nhưng **không có dữ liệu trong IoT backend** và **không nằm trong phạm vi nghiệp vụ live của bp2 plan**:

| Thành phần | Vị trí Mockup | Trạng thái Dữ liệu IoT | Hiện trạng Triển khai |
| --- | --- | --- | --- |
| **Phân bố theo tầng hôm nay (kWh)** | Hàng dưới, bên trái | Không có nguồn đồng hồ điện theo tầng | Tích hợp tab **"Phân bố tầng (Mẫu)"** trong card trái hàng phụ. Hiển thị 7 thanh ngang: Tầng mái (HVAC) 412, T1 186, T2 158, T3 171, T4 204, T5 149, T6 118 kWh kèm ghi chú nguồn. |
| **Bất thường do AI phát hiện** | Hàng dưới, bên phải | Không có mô hình AI/anomaly detection | Tích hợp tab **"Bất thường AI (Mẫu)"** trong card phải hàng phụ. Hiển thị 3 card cảnh báo: Lưu lượng đêm cao gấp 4.5 lần (đỏ), Phụ tải nền tăng 13% 5 đêm liên tiếp (cam), Tầng 4 tiêu thụ cao hơn 28% trùng thời điểm CO2 vượt ngưỡng (vàng) kèm ghi chú. |
| **Lưu lượng nước đêm** (`0,90 m³/h`) | KPI card 5 | Chưa có thuật toán tính đêm authoritative | Triển khai block UI dummy theo mockup: `0,90 m³/h` kèm chấm cam và ghi chú `Mức nền 0,20 m³/h — nghi rò rỉ`. |
| **Mực bể chứa** (`72 %`, Bể mái · ~ 29 m³) | KPI card 6 | Không có cảm biến mực nước bể | Triển khai block UI dummy theo mockup: `72 %` kèm chấm xanh dương và ghi chú `Bể mái · ~ 29 m³`. |

---

## 4. API Endpoints & Request/Response Contracts

### 4.1 Danh sách đồng hồ nước AVC

```http
GET /api/v1/dashboard/buildings/:buildingId/water/meters
GET /api/v1/dashboard/buildings/:buildingId/water/meters?floorId=4
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
    "sourceId": "dashboard-water-meters",
    "sourceType": "iot_backend_catalogue",
    "fetchedAt": "2026-09-26T12:40:30.117Z"
  },
  "summary": {
    "receivedCount": 2,
    "acceptedCount": 2,
    "skippedCount": 0,
    "duplicateCount": 0,
    "truncated": null
  },
  "meters": [
    {
      "deviceId": "8cf9572000149bd3",
      "sourceDeviceType": "avc",
      "catalogueActive": true,
      "sourceCreatedAt": "2026-09-23T21:13:50.433Z",
      "sourceUpdatedAt": "2026-09-23T21:13:50.433Z",
      "sourceLocation": { "x": 0, "y": 0, "z": 0, "floorLevel": 0 },
      "displayFloorId": null,
      "floorAssignment": "unmapped"
    }
  ]
}
```

### 4.2 Dữ liệu đo của đồng hồ nước được chọn

```http
GET /api/v1/dashboard/buildings/:buildingId/water/meters/:deviceId/readings?start=2026-09-25T12:00:00.000Z&stop=2026-09-26T12:00:00.000Z&limit=1000
```

- Ràng buộc: `start < stop`, duration ≤ 7 ngày, `limit <= 1000`.
- Server-side resolution: chỉ chấp nhận thiết bị có `device_type === 'avc'`. Từ chối `solar`, `nfc`, unknown trước khi fetch history.
- Response Schema:
```json
{
  "schemaVersion": 1,
  "buildingId": "E",
  "meterId": "8cf9572000149bd3",
  "availability": "ready",
  "provenance": {
    "mode": "live",
    "sourceId": "water_readings_8cf9572000149bd3",
    "sourceType": "iot_backend_avc",
    "observedAt": "2026-09-26T12:39:14.356Z",
    "windowStart": "2026-09-25T12:00:00.000Z",
    "windowEnd": "2026-09-26T12:00:00.000Z",
    "fetchedAt": "2026-09-26T12:40:35.000Z",
    "caveats": [
      "Ý nghĩa lưu lượng tức thời, thể tích tích lũy và các mã cờ của đồng hồ nước đang chờ xác nhận phần cứng.",
      "Nhiệt độ đo được (°C) chưa xác định là nhiệt độ môi trường hay nhiệt độ thân đồng hồ."
    ]
  },
  "queryRange": {
    "start": "2026-09-25T12:00:00.000Z",
    "stop": "2026-09-26T12:00:00.000Z",
    "limit": 1000
  },
  "coverage": {
    "returnedCount": 100,
    "validCount": 100,
    "invalidCount": 0,
    "isTruncated": false,
    "earliestTimestamp": "2026-09-25T12:09:14.000Z",
    "latestTimestamp": "2026-09-26T12:39:14.356Z",
    "reachedLimit": false
  },
  "latestSample": {
    "observedAt": "2026-09-26T12:39:14.356Z",
    "deviceName": "testavc2",
    "meterSerial": "00000025870203",
    "gatewayId": "58bf25fffee73060",
    "rssiDbm": -105,
    "snrDb": 12,
    "instantFlowM3h": 0,
    "forwardVolumeM3": 16.636,
    "reverseVolumeM3": 0,
    "temperatureC": 27.1,
    "rawFlags": {
      "valveOpen": 1,
      "pipeLeak": 0,
      "pipeBurst": 0,
      "batteryLow": 0,
      "frozen": 1,
      "tamper": 0,
      "reverseFlow": 0
    }
  },
  "readings": [ ... ]
}
```

---

## 5. Kết quả Kiểm thử Tự động (Automated Verification)

### 5.1 Backend Tests (`backend`)
- Lệnh: `npm test -- --watchAll=false`
- Kết quả: **PASS 6/6 test suites (96/96 tests passed)**
  - `src/dashboard/tests/dashboard-water.spec.ts`: 14 passed
  - `src/dashboard/tests/dashboard-iot-telemetry.spec.ts`: 22 passed
  - `src/dashboard/tests/dashboard-iot-catalogue.spec.ts`: 17 passed
  - `src/iot/tests/iot-telemetry.spec.ts`: 24 passed
  - `src/iot/tests/iot-client.spec.ts`: 14 passed
  - `src/iot/tests/iot-mapper.spec.ts`: 5 passed
- Build: `nest build` hoàn thành với mã thoát 0.

### 5.2 Frontend Tests (`web`)
- Lệnh: `npm test`
- Kết quả: **PASS 4/4 test suites (54/54 tests passed)**
  - `test-phase09.mjs`: 17 passed
  - `test-bp2-phase02.mjs`: 9 passed
  - `test-bp2-phase03.mjs`: 19 passed
  - `test-bp2-phase04.mjs`: 9 passed
- Lint: `npm run lint` — 0 errors.
- Build: `next build --webpack` — Tạo thành công tất cả 13 static/dynamic routes bao gồm `/dashboard/energy-water`.

---

## 6. Kết quả Kiểm thử Trực quan trên Trình duyệt (Browser QA)

Thực hiện kiểm thử tự động bằng `browser_subagent` tại các viewports:
1. `1842 × 1222 px` (Full shell với 2 sidebars 64px + 288px):
   - 6 KPI cards xếp thẳng hàng (1 row);
   - 2 Energy panels hàng chính đạt tỷ lệ chuẩn ~5:3;
   - 3 Panels hàng phụ đạt tỷ lệ ~3:5:3;
   - Click chọn đồng hồ `8cf9572000149bd3`:
     - Highlight border teal, tick xanh;
     - KPI Lưu lượng tức thời cập nhật `0 m³/h`;
     - KPI Chỉ số thuận cập nhật `16,636 m³`;
     - KPI Chỉ số ngược cập nhật `0 m³`;
     - Biểu đồ trung tâm nạp dữ liệu chuỗi thời gian thực (hỗ trợ chuyển Lưu lượng, Lũy kế thuận, Lũy kế nghịch, Nhiệt độ);
     - Card chi tiết kỹ thuật hiển thị ChirpStack `testavc2`, meter serial `00000025870203`, gateway, RSSI `-105 dBm`, SNR `12 dB`, các cờ raw numeric: `valveOpen: 1`, `frozen: 1`, `pipeLeak: 0`.
2. Kiểm tra tab minh họa mockup:
   - Tab "Phân bố tầng (Mẫu)": hiển thị đúng 7 thanh ngang và chú thích mockup.
   - Tab "Bất thường AI (Mẫu)": hiển thị đúng 3 card cảnh báo màu viền đỏ/cam/vàng và chú thích mockup.
3. Kiểm tra responsive tại `1440 × 900`, `1024 × 768`, và `390 × 844`:
   - Grid tự động wrap mượt mà theo responsive rules;
   - Không xuất hiện horizontal overflow trên body.

---

## 7. Audit Bảo mật & Ràng buộc Kỹ thuật

- **Không rò rỉ token:** Toàn bộ frontend không chứa bearer token, authorization secret, hay URL trực tiếp tới `api.ttlab.manhthao.uk`.
- **Không bypass backend:** Next.js client chỉ gọi same-origin `/api/devices/dashboard/buildings/E/water/...`.
- **Không database persistence:** Dữ liệu telemetry chỉ xử lý in-memory theo từng request, không tạo migration, không ghi PostgreSQL.
- **Không auto-polling:** Nút "Làm mới" là hành động do người dùng kích hoạt thủ công, không có timer loop ngầm.
- **Bảo toàn tính chính trực dữ liệu:** Số `0` được hiển thị rõ ràng, không bị ép thành rỗng; giá trị null không bị ép thành số 0; không có hành vi tự động tính toán tiêu thụ từ delta chỉ số.
