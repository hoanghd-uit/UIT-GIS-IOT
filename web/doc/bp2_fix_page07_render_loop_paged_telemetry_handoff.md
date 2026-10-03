# BP2 Fix Handoff — Page 07 Render Loop, Paged Telemetry & 5-Minute Refresh

> **Ngày:** 2026-10-03  
> **Trạng thái:** HOÀN THÀNH VÀ ĐÃ KIỂM THỬ (IMPLEMENTED & VERIFIED)  
> **Loại:** Hotfix nhỏ sau Phase 11 / Small Phase 24 (không tạo mới hoặc đổi số Small Phase)  
> **Tài liệu plan tham chiếu:** `web/doc/bp2_fix_page07_render_loop_paged_telemetry.md`  
> **Trang áp dụng:** Page 07 — Hệ thống IoT (`/dashboard/iot`)  

---

## 1. Tóm tắt kết quả triển khai

Hotfix đã giải quyết toàn diện 3 vấn đề trọng tâm theo đúng yêu cầu stakeholder và blueprint:
1. **Triệt tiêu hoàn toàn vòng lặp render (`Maximum update depth exceeded`)** khi mở chi tiết telemetry thiết bị (Task A).
2. **Phân trang danh mục thiết bị (10 thiết bị / trang)** với footer compact và tự động nạp thông số vô tuyến (RSSI, SNR, Lần cuối) cho các thiết bị thuộc trang đang hiển thị mà không cần chọn từng row (Task B & Task C).
3. **Triển khai scheduler tự động làm mới mỗi 5 phút (`300000 ms`)** do Page 07 độc quyền sở hữu, hỗ trợ tạm dừng khi ẩn tab/offline và phục hồi đúng 1 chu kỳ khi active lại (Task D).

---

## 2. Phân tích nguyên nhân gốc và giải pháp xử lý (Task A)

### 2.1 Nguyên nhân gốc (Root Cause)
- Trong `IotCataloguePanel.client.tsx`, callback `onTelemetryLoaded` được truyền inline dạng arrow function `(summary) => setSelectedTelemetrySummary(summary)`.
- Trong `IotDeviceTelemetryPanel.client.tsx`, hook `useEffect` phụ thuộc vào `[data, onTelemetryLoaded]`. Khi có dữ liệu, effect khởi tạo object summary mới và gọi `onTelemetryLoaded`.
- Nhận object mới, parent `IotCataloguePanel` cập nhật state `selectedTelemetrySummary` $\rightarrow$ parent re-render $\rightarrow$ tạo function reference `onTelemetryLoaded` mới $\rightarrow$ effect của detail panel chạy lại $\rightarrow$ tạo object summary mới $\rightarrow$ vòng lặp vô tận kích hoạt lỗi React `Maximum update depth exceeded`.

### 2.2 Giải pháp khắc phục
1. **Ổn định parent callback:** `handleTelemetryLoaded` được bọc trong `useCallback` với kiểm tra bình đẳng giá trị (identity equality) giữa state trước và sau (`gatewayId`, `rssi`, `snr`, `latestTimestamp`). Nếu không đổi, giữ nguyên reference `prev` để ngăn parent re-render.
2. **Ngăn phát tín hiệu trùng lặp từ Child:** `IotDeviceTelemetryPanel.client.tsx` sử dụng `lastEmittedSummaryRef` để lưu composite key `${deviceId}|${gatewayId}|${rssi}|${snr}|${observedAt}`. Callback chỉ được gọi khi composite key thực sự thay đổi.
3. **Quản lý vòng đời theo thiết bị:** Khi chuyển đổi thiết bị hoặc unmount, `lastEmittedSummaryRef` được reset về rỗng, request controller cũ được abort để ngăn race condition.
4. **Ổn định Chart Data:** `MetricTrendChart` memoize dữ liệu hiển thị không tạo array mới khi chu kỳ refresh 5 phút trả về các mẫu đo không đổi.

---

## 3. Phân trang Catalogue 10 thiết bị / trang (Task B)

- **Nguyên tắc:** Lọc trước (`searchQuery`, `selectedType`), phân trang sau.
- **Kích thước trang:** Cố định `PAGE_SIZE = 10`.
- **Trạng thái:** `currentPage` khởi tạo là 1. Reset về trang 1 khi người dùng thay đổi từ khóa tìm kiếm, loại thiết bị, tầng hoặc phòng.
- **Kẹp trang (Clamp):** `safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)`.
- **Footer phân trang:**
  - Định dạng hiển thị: `Hiển thị 1–10 / 11 thiết bị` và `Trang 1 / 2`.
  - Nút điều hướng: `Trước` (disabled ở trang 1) và `Sau` (disabled ở trang cuối).
  - Nút thao tác: `Làm mới dữ liệu trang` (làm mới snapshot của các thiết bị trên trang hiện tại).
- **Xử lý lựa chọn khi rời trang:** Khi chuyển trang hoặc đổi bộ lọc khiến thiết bị đang chọn không còn nằm trong danh sách hiển thị, drawer chi tiết sẽ tự động đóng an toàn, giải phóng tài nguyên.
- **Bảo toàn KPI counter:** Tiêu đề bộ lọc vẫn thể hiện tổng số thiết bị đã nạp và khớp bộ lọc (`totalLoaded`, `filteredCount`), không thay bằng số lượng của riêng trang.

---

## 4. Tự tải Radio Summary cho trang hiển thị (Task C)

- **Phạm vi nạp:** Chỉ nạp tối đa 10 thiết bị hiển thị trên trang hiện tại; tuyệt đối không prefetch các trang ẩn hoặc quét toàn bộ fleet.
- **Loại thiết bị hỗ trợ:** `solar`, `avc`, `sb`, `smoke`.
- **Thiết bị không hỗ trợ:** `nfc` và loại không xác định được gán trạng thái `status: 'unsupported'` ngay lập tức, không gửi request mạng đến telemetry proxy.
- **Cửa sổ Snapshot:** Khoảng thời gian 72 giờ qua (`last-72h`), trích xuất thời điểm mốc cố định cho cả lô thiết bị (`batchRefTime = new Date()`), gửi tham số `limit: 1` lấy mẫu đo mới nhất.
- **Giới hạn tải đồng thời:** `MAX_CONCURRENT_REQUESTS = 2` trên toàn bộ Page 07 (bao gồm hàng đợi trang hiển thị và truy vấn lịch sử detail), ưu tiên truy vấn detail của người dùng.
- **RAM Snapshot Cache:** Bounded tối đa 20 entries (tương đương 2 trang), tự giải phóng theo cơ chế FIFO khi vượt quá giới hạn. Hiệu lực cache là 5 phút (`300000 ms`). Khi quay lại trang trong vòng 5 phút, tái sử dụng dữ liệu snapshot ngay lập tức mà không cần gọi mạng.
- **Khử trùng lặp (In-flight Dedup):** Sử dụng key `${deviceId}:${start}:${stop}:${limit}` để tái sử dụng Promise đang bay, ngăn gửi trùng lặp request GET.
- **Hiển thị trên bảng:**
  - Cột `RSSI`: Hiển thị giá trị kèm đơn vị `dBm` (ví dụ `-39 dBm`), cảnh báo màu khi `RSSI < -110`.
  - Cột `SNR`: Hiển thị chỉ số suy hao (ví dụ `9.25`).
  - Cột `Lần cuối`: Hiển thị giờ phút mẫu đo mới nhất trong cửa sổ 72h.
  - Cập nhật tooltip: Thay thế hoàn toàn tooltip cũ "Chỉ khả dụng khi chọn thiết bị" bằng thông tin thời điểm mẫu đo và trạng thái tải.

---

## 5. Scheduler làm mới 5 phút, độc quyền Page 07 (Task D)

- **Chu kỳ:** `REFRESH_CADENCE_MS = 300000` (5 phút sau khi chu kỳ trước settle).
- **Phạm vi sở hữu:** Nằm hoàn toàn trong `useIotPage07Telemetry.ts` trực thuộc Page 07. Không đặt ở shell dùng chung, không can thiệp các trang khác (Page 01, 02, 03, 06, 09, 11).
- **Điều phối 2 Consumer độc lập:**
  1. `visiblePage`: Snapshot batch cho 10 thiết bị hiển thị. Manual refresh đặt lại deadline `now + 300000 ms`.
  2. `selectedDetail`: Truy vấn lịch sử theo preset của thiết bị đang chọn. Manual refresh của detail chỉ đặt lại deadline của detail.
- **Tạm dừng khi ẩn/offline:**
  - Theo dõi `document.visibilityState` và `navigator.onLine`.
  - Khi tab bị ẩn hoặc trình duyệt mất mạng: scheduler ngừng dispatch.
  - Khi tab active hoặc online trở lại: thực hiện tối đa 1 chu kỳ quá hạn cho mỗi consumer active, không dồn tích các tick đã bỏ lỡ.
- **Dọn dẹp tài nguyên:** Hủy `setInterval`, gỡ bỏ event listeners, hủy các request đang bay bằng `AbortController` khi chuyển trang hoặc unmount.

---

## 6. Danh sách các tệp thay đổi

| Tệp | Thay đổi chính |
| --- | --- |
| `web/src/lib/dashboard/iot-telemetry-api.ts` | Thêm tham số tùy chọn `limit?: number` (mặc định 1000 cho callers cũ, hỗ trợ limit 1 cho snapshot). |
| `web/src/components/dashboard/iot/useIotPage07Telemetry.ts` | Hook điều phối telemetry: concurrency $\le 2$, RAM cache $\le 20$ entries, deduplication, scheduler 300000 ms, pause/resume. |
| `web/src/components/dashboard/iot/IotDeviceCatalogueTable.tsx` | Nhận prop `rowSummaries`, hiển thị RSSI, SNR, Lần cuối cho mọi visible row; cập nhật tooltips; giữ nguyên nhãn stakeholder. |
| `web/src/components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx` | Khắc phục render loop qua `lastEmittedSummaryRef`, hỗ trợ `refreshSignal` & `onSettled`, ổn định `chartData`. |
| `web/src/components/dashboard/iot/IotCataloguePanel.client.tsx` | Phân trang 10 thiết bị/trang, footer điều hướng, tích hợp `useIotPage07Telemetry`, ổn định `handleTelemetryLoaded`. |
| `web/test-bp2-hotfix-page07.mjs` | Bộ kiểm thử tự động toàn diện kiểm tra Task A, B, C, D và bảo vệ nhãn stakeholder. |
| `backend/test/test-postgres-hotfix-page07.mjs` | Bộ kiểm thử cơ sở dữ liệu PostgreSQL xác minh Zero Telemetry Persistence và bất biến schema. |
| `web/package.json` | Bổ sung script `test:bp2:hotfix`. |
| `web/test-bp2-phase03.mjs` & `web/test-bp2-phase11.mjs` | Cập nhật assertion T23, T24, T19 phản ánh scheduler 300000 ms và nạp bounded visible page. |
| `web/doc/bp2_fix_page07_render_loop_paged_telemetry.md` | Đánh dấu trạng thái IMPLEMENTED & VERIFIED. |

---

## 7. Bằng chứng kiểm thử và nghiệm thu

### 7.1 Kiểm thử PostgreSQL Database (5/5 PASSED — 100%)
Chạy script `node test-postgres-hotfix-page07.mjs` kết nối trực tiếp container `gis-uit-p04-dev-postgres-1`:
- **TEST 1 — Health & Connection:** Kết nối thành công cơ sở dữ liệu `gis_uit_dev`, PostgreSQL 17.11 $\rightarrow$ **PASSED**.
- **TEST 2 — Schema Integrity & Zero Persistence:** Xác nhận 7 bảng công khai hiện hữu; 0 bảng telemetry/sensor reading tồn tại; dữ liệu telemetry 100% trong RAM $\rightarrow$ **PASSED**.
- **TEST 3 — Migration Boundary:** Xác nhận Small Phase 21 (`ApplicationIdentityTables1727780000000`) là migration cuối cùng; 0 migration mới được thêm $\rightarrow$ **PASSED**.
- **TEST 4 — Record Counts:** `application_users` (2), `application_sessions` (20), `floors` (13), `device_bindings` (6), `device_display_overrides` (0), `catalogue_sync_state` (1) toàn vẹn $\rightarrow$ **PASSED**.
- **TEST 5 — Immutability Verification:** 0 transaction write lock, không phát sinh ghi dữ liệu dưới các thao tác telemetry $\rightarrow$ **PASSED**.

### 7.2 Kiểm thử Tự động Frontend (100% PASSED)
- `npm run test:bp2:p03`: 19/19 tests passed.
- `npm run test:bp2:p09`: 10/10 tests passed.
- `npm run test:bp2:p10`: 26/26 tests passed.
- `npm run test:bp2:p11`: 29/29 tests passed.
- `npm run test:bp2:hotfix`: 9/9 tests passed (toàn bộ các ca kiểm thử Task A, B, C, D).
- `npm run lint`: 0 errors.
- `npm run build`: Next.js 16.3.4 webpack build thành công 17/17 routes không có lỗi biên dịch.

### 7.3 Kiểm thử Trình duyệt Thực tế (Browser Subagent E2E)
- Đăng nhập phiên `beiviewer` / `bei1234` thành công.
- Truy cập `http://localhost:3000/dashboard/iot`:
  - Bảng catalogue hiển thị đầy đủ 10 thiết bị đầu tiên với nhãn `Hiển thị 1–10 / 11 thiết bị`, `Trang 1 / 2`.
  - Các cột `RSSI`, `SNR`, `Lần cuối` hiển thị đúng thông số tự nạp.
  - Nhấp chọn thiết bị `70B3D57ED006D366` (`sb`): Drawer chi tiết mở mượt mà, thông số Gateway thu nhận (`indoor-gateway-ttlab`), RSSI (`-39 dBm`), SNR (`9.25`) hiển thị đầy đủ.
  - **Console ghi nhận 0 lỗi React, triệt tiêu hoàn toàn lỗi `Maximum update depth exceeded`.**
  - Đã lưu artifact ảnh chụp màn hình và video WebP:
    - Bảng danh mục & footer: `iot_table_view_1790999077283.png`
    - Drawer chi tiết telemetry: `iot_telemetry_drawer_1790999118362.png`
    - Video ghi hình phiên kiểm thử: `page07_verification_1790998997272.webp`

---

## 8. Bảo vệ nội dung Stakeholder và Biên kiểm thử

1. **Bảo vệ nhãn trạng thái:** Các nhãn `Trực tuyến trong API` và `Ngừng hoạt động trong danh mục` được giữ nguyên vẹn 100%. Không sửa nhãn để làm xanh test hồi quy cũ Phase 02 (pre-existing test issue đã ghi nhận trong plan).
2. **Bảo vệ các trang khác:** Các trang Overview (01), Water/Energy (02), Environment (03), Alerts (06), Parking (09), PCCC (11) hoàn toàn không bị chỉnh sửa.
3. **Bảo mật và Phân quyền:** Quyền đọc của Viewer và Manager được bảo toàn; tài khoản và proxy không bị lộ token hoặc URL nội bộ.
4. **Không persistence:** Telemetry và radio summaries hoạt động hoàn toàn trong bộ nhớ RAM tạm thời của trình duyệt.
