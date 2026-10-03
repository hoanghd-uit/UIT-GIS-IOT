# Big Phase 02 — Phase 08: Deterministic Demo Parking Dashboard Handoff

> **Project:** GIS — UIT Building E Digital Twin  
> **Tài liệu:** Báo cáo bàn giao nghiệm thu Phase 08  
> **Trạng thái:** HOÀN THÀNH — VERIFIED  
> **Ngày hoàn thành:** 2026-10-01  
> **Roadmap mapping:** Small Phase 19 — Explicit demo completion: Parking  
> **Route:** `/dashboard/parking`  

---

## 1. Tóm tắt bàn giao

Phase 08 đã thay thế thành công placeholder của Page 09 (Bãi xe) bằng giao diện Dashboard Bãi xe hoàn chỉnh bám sát visual hierarchy của Parking Mockup (`1484 × 1110 px`) và hệ thống Design Token hiện hành:
1. Toàn bộ dữ liệu hiển thị trên Page 09 Parking tuân thủ nghiêm ngặt quy tắc **100% Deterministic Demo**: không kết nối camera thực tế, không barrier, không gateway LoRaWAN, không AI/TinyML inference, không backend endpoint và không thu thập thông tin cá nhân (PII) / biển số xe.
2. Giữ nguyên dual-sidebar shell, bảo toàn chính xác 7 Dashboard routes (`/dashboard/overview`, `/dashboard/energy-water`, `/dashboard/environment`, `/dashboard/alerts`, `/dashboard/iot`, `/dashboard/parking`, `/dashboard/fire-safety`).
3. Tuân thủ tuyệt đối quy tắc **Protected Work & No-touch Rules**: bảo toàn 100% tệp tin và text của Page 02 (Energy & Water), Page 07 (IoT), Page 01 (Overview), Page 03 (IAQ), Page 06 (Alerts) và các thay đổi chưa commit của Phase 07.

---

## 2. Thông tin Git & Protected File Audit

- **Branch:** `feature/dashboard`
- **Base HEAD:** `f6fcde1dd4c540c9223cb046bd8dfd3344d0d910`
- **Working-tree pre-existing modifications:**
  - `GISUIT.code-workspace` (user-owned, không đụng chạm)
  - `UnityContent/UserSettings/EditorUserSettings.asset` (user-owned, không đụng chạm)
  - `web/doc/dashboard_big_phase_small_phase_plan.md` (giữ nguyên)
  - Phase 07 uncommitted overview files & handoff (bảo toàn nguyên vẹn 100%)
- **Protected File Audit:**
  - `web/src/components/dashboard/water/**` (Page 02): **0 files touched (Zero-change)**
  - `web/src/components/dashboard/iot/**` (Page 07): **0 files touched (Zero-change)**
  - `web/src/components/dashboard/alerts/**` (Page 06): **0 files touched**
  - `web/src/components/dashboard/environment/**` (Page 03): **0 files touched**
  - `web/src/components/dashboard/overview/**` (Page 01): **0 files touched**
  - Backend NestJS files: **0 files touched**
  - Database schema & migrations: **0 files touched**

---

## 3. Danh mục tệp tin được tạo mới & cập nhật

### 3.1 Tệp tin tạo mới (Page 09 Parking domain)

1. [dashboard-parking.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/types/dashboard-parking.ts): Định nghĩa TypeScript hoàn chỉnh cho Page 09 (presets `today | 7d | 30d`, `ParkingCarSlot`, `ParkingCarArea`, `ParkingMotorcycleZone`, `ParkingHourlyEntry`, `ParkingCameraDevice`, `ParkingTechnicalNote`, fixture và selector types).
2. [parking-demo-fixtures.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/lib/dashboard/parking-demo-fixtures.ts): Fixture ID `page09-parking-demo-v1` (version `1.0.0`, reference instant `2026-10-01T08:00:00.000Z`) định nghĩa deterministic car areas (30 slots: 18 occupied, 12 free), motorcycle zones (3 phân vùng M1, M2, M3), vehicle entries theo 3 khoảng thời gian, 4 camera mô phỏng (`DEMO-CAM-B1-01` .. `04`), thống kê thời gian đỗ mẫu (`3h15`) và 4 ghi chú kỹ thuật.
3. [parking-demo-selectors.ts](file:///Users/mac/UnityProj/GIS-UIT/web/src/lib/dashboard/parking-demo-selectors.ts): Các pure selector tính toán tổng hợp không side-effects (`getParkingCarSummary`, `getParkingMotorcycleSummary`, `getParkingEntriesSummary`, `getParkingCameraSummary`, `getParkingDurationSummary`, `getParkingKpiStripData`, `getAllCarSlots`).
4. [ParkingPageHeader.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/parking/ParkingPageHeader.tsx): Header `Bãi xe · Hầm B1`, phụ đề kịch bản mô phỏng, badge `Dữ liệu minh họa`, bộ lọc thời gian segmented (`Hôm nay`, `7 ngày`, `30 ngày`), nút `Tùy chọn` bị vô hiệu hóa có tooltip giải thích và avatar quản trị trung tính (`AT`).
5. [ParkingDemoNotice.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/parking/ParkingDemoNotice.tsx): Banner `role="note"` thông báo kịch bản mô phỏng toàn trang và minh bạch không có camera/barrier/PII thu thập.
6. [ParkingKpiStrip.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/parking/ParkingKpiStrip.tsx): Dải 5 thẻ KPI selector-derived (Vị trí ô tô B1, Mật độ xe máy TB, Lượt xe vào theo range, Thời gian đỗ TB, Camera mô phỏng), tất cả đều có badge `Demo`.
7. [ParkingOccupancyCard.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/parking/ParkingOccupancyCard.tsx): Thẻ sơ đồ ô đỗ ô tô (Khu A tiêu chuẩn, Khu B tích hợp 5 vị trí sạc điện EV) và phân vùng xe máy kèm thanh mật độ tiến trình; hỗ trợ chuyển đổi sang `Bảng dữ liệu` tiếp cận (Accessible Table), điều hướng phím và panel xem nhanh chi tiết ô/khu vực được chọn.
8. [ParkingEntriesChart.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/parking/ParkingEntriesChart.tsx): Biểu đồ cột lưu lượng xe vào kèm đánh dấu đỉnh cao điểm và bảng dữ liệu tiếp cận theo 3 mốc thời gian `today`, `7d`, `30d`.
9. [ParkingCameraTable.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/parking/ParkingCameraTable.tsx): Bảng thiết bị camera giám sát kịch bản với mã `DEMO-CAM-xxx`, khu vực bao quát, chu kỳ suy luận và nhãn trạng thái kịch bản trung tính (`Demo · Hoạt động giả lập`, `Demo · Cần kiểm tra`).
10. [ParkingTechnicalNotes.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/parking/ParkingTechnicalNotes.tsx): Thẻ ghi chú kỹ thuật cuối trang gồm 4 nội dung: mô phỏng ô đỗ, ước tính mật độ theo khu vực, bảo vệ quyền riêng tư (không PII/biển số) và giới hạn kiến trúc không phần cứng.
11. [ParkingDashboard.client.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/dashboard/parking/ParkingDashboard.client.tsx): Component container điều phối trạng thái hiển thị (preset, selection) của Page 09.
12. [test-bp2-phase08.mjs](file:///Users/mac/UnityProj/GIS-UIT/web/test-bp2-phase08.mjs): Bộ kiểm thử tự động 18 test cases cho Phase 08.

### 3.2 Tệp tin cập nhật

1. [page.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/app/dashboard/parking/page.tsx): Thay thế component placeholder cũ bằng `<ParkingDashboard />`.
2. [package.json](file:///Users/mac/UnityProj/GIS-UIT/web/package.json): Bổ sung script `test:bp2:p08` và tích hợp `test-bp2-phase08.mjs` vào chuỗi kiểm thử tổng hợp.

---

## 4. Ma trận nguồn dữ liệu & Provenance từng Widget

| Widget | Nguồn dữ liệu | Chế độ | Hiển thị & Diễn giải |
| --- | --- | --- | --- |
| **Header & Demo Notice** | `page09-parking-demo-v1` | `demo` | `Bãi xe · Hầm B1` · Banner ghi rõ kịch bản mô phỏng |
| **KPI: Vị trí ô tô (B1)** | `getParkingCarSummary` | `demo` | `18/30` (60.0%) · Còn 12 chỗ (5 vị trí sạc EV) |
| **KPI: Mật độ xe máy TB** | `getParkingMotorcycleSummary` | `demo` | `58.3%` · Đỉnh: Khu M1 (78%) |
| **KPI: Lượt xe vào** | `getParkingEntriesSummary` | `demo` | `247 lượt` (Hôm nay), Đỉnh 08:00 (46 lượt); cập nhật theo 7d/30d |
| **KPI: Thời gian đỗ TB** | `getParkingDurationSummary` | `demo` | `3h15` · Mẫu 140 phiên đỗ giả lập có sẵn trong fixture |
| **KPI: Camera mô phỏng** | `getParkingCameraSummary` | `demo` | `4/4` · 3 hoạt động giả lập, 1 cần kiểm tra |
| **Sơ đồ ô đỗ ô tô** | `PARKING_DEMO_FIXTURE.carAreas` | `demo` | Khu A (15 slots) & Khu B (15 slots, B-11..15 là EV) |
| **Phân vùng xe máy** | `PARKING_DEMO_FIXTURE.motorcycleZones` | `demo` | 3 phân vùng (M1: 78%, M2: 55%, M3: 42%) |
| **Chi tiết vị trí chọn** | Client presentation state | `demo` | Xem nhanh thông tin ô đỗ hoặc phân vùng đang click |
| **Biểu đồ lưu lượng xe** | `PARKING_DEMO_FIXTURE.entriesByRange` | `demo` | Biểu đồ cột + bảng số liệu chuyển đổi linh hoạt |
| **Bảng camera mô phỏng** | `PARKING_DEMO_FIXTURE.cameraDevices` | `demo` | 4 camera tiền tố `DEMO-CAM-`, nhãn trạng thái kịch bản |
| **Ghi chú kỹ thuật** | `PARKING_DEMO_FIXTURE.technicalNotes` | `demo` | 4 thẻ giải thích giới hạn kịch bản và cam kết không PII |

---

## 5. Bảng đối chiếu Mockup (Mockup Divergence Table)

| Yếu tố trong Mockup | Triển khai Phase 08 | Lý do / Căn cứ Knowledge Base |
| --- | --- | --- |
| Phụ đề có chữ Camera / LoRa trực tuyến | `Kịch bản mô phỏng bãi đỗ xe Tòa E · Phiên bản page09-parking-demo-v1` | Không có camera vật lý hay LoRa stream thật |
| Chi tiết kế hoạch R&D Phase 2 | Banner mô phỏng tổng quát với `role="note"` | Mockup là visual reference, không phải hợp đồng roadmap |
| Các con số cụ thể `8/40`, `65%`, `2.440` | Sử dụng số liệu deterministic fixture độc lập (30 slots, 60%, 247/1472/6000 lượt) | Không sao chép các con số mockup thành sự thật dự án |
| Trạng thái camera "Online" / "Bẩn ống kính" | Trạng thái trung tính: `Demo · Hoạt động giả lập`, `Demo · Cần kiểm tra` | Tránh gây hiểu lầm là có camera hardware thật kết nối |
| Huy hiệu chứng nhận "Privacy by design" | Thẻ ghi chú kỹ thuật giải thích không thu thập PII / biển số xe | Không tự nhận chứng chỉ pháp lý khi chưa kiểm định |
| Các route mở rộng trên sidebar (`Không gian`, `Thang máy`, `An ninh`) | Loại bỏ, giữ nguyên đúng 7 routes Dashboard hiện hành | Tuân thủ scope 7 routes của Big Phase 02 |
| Badge đỏ số `5` trên mục Cảnh báo | Không hiển thị badge giả | Cảnh báo tuân thủ authority null count |
| Avatar người dùng cụ thể | Avatar trung tính `AT` (Quản trị tòa nhà E) | Tránh tạo danh tính cá nhân giả |

---

## 6. Kiểm tra Bảo mật & Kiến trúc (Privacy & Architecture Audit)

1. **Quyền riêng tư (Zero PII):**
   - Hoàn toàn không có trường dữ liệu biển số xe (`licensePlate`), tên người, mã định danh cá nhân (`personId`) hay dữ liệu sinh trắc học.
   - Hoàn toàn không chứa URL luồng hình ảnh/video (`rtsp://`, `webrtc://`) hay tệp ảnh camera thực tế.
2. **Kiến trúc dữ liệu (Zero Backend & Zero Mutation):**
   - Không tạo backend controller, service, entity, DTO, TypeORM repository hay database migration nào.
   - Không có API call nào xuất phát từ phân hệ Parking (`fetch()`, `axios`, v.v.).
   - Không có background timer (`setInterval`, `setTimeout`) hay polling loop.
   - Không lưu trữ vào `localStorage` hay `sessionStorage`.

---

## 7. Bằng chứng kiểm thử & Nghiệm thu (Verification Evidence)

### 7.1 Kiểm thử tự động Phase 08 (`test-bp2-phase08.mjs`)

Lệnh thực thi:
```bash
npm run test:bp2:p08
```
Kết quả:
```text
✔ BP2-P08-T01: Deterministic demo fixture has fixed ID, frozen reference instant, and no Math.random/Date.now (1.03175ms)
✔ BP2-P08-T02: Stable DEMO- IDs across slots, zones, and cameras with zero collisions (0.544958ms)
✔ BP2-P08-T03: Car capacity consistency: occupied + free = total capacity; occupancy % matches selector (0.594625ms)
✔ BP2-P08-T04: Motorcycle zone density selector consistency and peak zone identification (0.245917ms)
✔ BP2-P08-T05: Entries summary selector consistency across today, 7d, 30d; peak period calculated accurately (0.212916ms)
✔ BP2-P08-T06: Camera summary selector consistency: active and inspection counts agree with fixture rows (0.175166ms)
✔ BP2-P08-T07: Duration KPI is strictly fixture-backed with explicit duration summary (0.366167ms)
✔ BP2-P08-T08: Privacy constraints: zero PII, license plates, person IDs, or camera video/stream URLs (0.280292ms)
✔ BP2-P08-T09: ParkingPageHeader renders title, subtitle, demo badge, range selector, and no fake live claim (0.479542ms)
✔ BP2-P08-T10: ParkingDemoNotice renders full-width accessible note (role="note") with explicit demo wording (0.437042ms)
✔ BP2-P08-T11: ParkingKpiStrip renders five operational KPI slots with demo badges and selector values (0.279667ms)
✔ BP2-P08-T12: ParkingOccupancyCard provides visual slots/zones and accessible table alternative (0.319958ms)
✔ BP2-P08-T13: ParkingEntriesChart renders range-aware vehicle entries and accessible table alternative (0.18825ms)
✔ BP2-P08-T14: ParkingCameraTable displays DEMO- cameras with scenario status and no real online/offline claim (0.208375ms)
✔ BP2-P08-T15: ParkingTechnicalNotes explains deterministic simulation, privacy, and architecture boundaries (0.22375ms)
✔ BP2-P08-T16: Page 09 route /dashboard/parking mounts ParkingDashboard without legacy placeholder (0.058667ms)
✔ BP2-P08-T17: Shell retains exactly 7 routes and no fake alert badges on sidebar (0.171459ms)
✔ BP2-P08-T18: Security & Architecture audit: zero backend changes, zero DB entities, zero polling/timers (0.143166ms)
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
```
- **18/18 test cases PASSED** (0 failures).

### 7.2 Kiểm thử Build Production & TypeScript (`npm run build`)

Lệnh thực thi:
```bash
npm run build
```
Kết quả:
```text
▲ Next.js 16.3.4 (webpack)
✓ Compiled successfully in 5.0s
✓ Finished TypeScript in 1656ms
✓ Generating static pages using 10 workers (13/13) in 212ms
✓ Finalizing page optimization in 2.9s

Route (app)
├ ○ /dashboard/parking (Prerendered as static content)
```
- **Exit code: 0**, không có lỗi TypeScript, lint hay bundling.

### 7.3 Kiểm tra Tương tác Trình duyệt (Browser QA)

Kiểm tra bằng Browser Agent trên `http://localhost:3000/dashboard/parking`:
1. Mục **Bãi xe** trên thanh điều hướng bên trái được highlight active chính xác.
2. Tiêu đề **Bãi xe · Hầm B1** và badge **Dữ liệu minh họa** hiển thị rõ ràng.
3. Banner mô phỏng màu hổ phách `role="note"` nằm ngay dưới header.
4. Cả 5 thẻ KPI hiển thị đầy đủ nhãn `Demo` và các số liệu đồng nhất với fixture.
5. Sơ đồ ô đỗ hiển thị đầy đủ Khu A và Khu B (kèm 5 ô sạc điện EV) và 3 phân vùng xe máy.
6. Thao tác click vào ô **A-01**: ô đỗ được chọn viền sáng `#4FB9AD` và thanh chi tiết hiện lên thông tin ô đỗ `DEMO-SLOT-A01`, trạng thái `Có xe`, `Camera DEMO-CAM-B1-01`.
7. Thao tác click vào bộ lọc **7 ngày**: số liệu tổng lượt xe chuyển sang `1.472 lượt` và biểu đồ cập nhật 7 cột ngày tương ứng.
8. Các ảnh chụp minh chứng:
   - Ảnh chụp ban đầu: [parking_page_initial_1790861582846.png](file:///Users/mac/.gemini/antigravity-ide/brain/e3993812-b17a-4a0d-96e8-f20968752083/parking_page_initial_1790861582846.png)
   - Ảnh chụp sơ đồ ô đỗ & biểu đồ: [parking_slots_and_charts_1790861731075.png](file:///Users/mac/.gemini/antigravity-ide/brain/e3993812-b17a-4a0d-96e8-f20968752083/parking_slots_and_charts_1790861731075.png)
   - Video phiên tương tác: [parking_demo_check_1790861514135.webp](file:///Users/mac/.gemini/antigravity-ide/brain/e3993812-b17a-4a0d-96e8-f20968752083/parking_demo_check_1790861514135.webp)

---

## 8. Kết luận nghiệm thu Phase 08

Phase 08 đã hoàn thành xuất sắc 100% các tiêu chí chấp nhận:
- Page 09 placeholder đã được thay thế hoàn toàn bằng Parking Dashboard hoàn chỉnh.
- Toàn bộ dữ liệu hiển thị là deterministic demo, tự đồng nhất giữa KPI, sơ đồ ô đỗ, biểu đồ và bảng camera.
- Bảo vệ nghiêm ngặt toàn bộ text và code của các phân hệ đã hoàn thành (Page 01, 02, 03, 06, 07).
- Hệ thống sẵn sàng cho các giai đoạn tiếp theo theo roadmap đã định.
