# Big Phase 02 — UI Alignment Fix Plan: Trang Hệ thống IoT

> **Project:** GIS — UIT Building E Digital Twin  
> **Loại tài liệu:** Kế hoạch bàn giao cho Coding Agent  
> **Trạng thái:** PLAN ONLY — KHÔNG IMPLEMENT TRONG TÀI LIỆU NÀY  
> **Ngày lập kế hoạch:** 2026-09-26  
> **Trang mục tiêu:** Page 07 — Hệ thống IoT  
> **Route hiện hữu:** `/dashboard/iot`  
> **Tên route trong yêu cầu stakeholder:** `/iot`  
> **Ảnh mockup tham chiếu:** ảnh đính kèm, kích thước gốc `1778 × 1222 px`; ảnh mô tả Dashboard workspace nằm bên phải High-Level Sidebar  
> **Phạm vi chính:** sửa shared Dashboard shell và bố cục Page 07; không thêm tính năng nghiệp vụ mới

---

## 1. Mục tiêu

Điều chỉnh code giao diện hiện hữu để Page 07 bám sát mockup “Hệ thống IoT · Tòa E” về:

- giữ kiến trúc hai sidebar: High-Level Sidebar của toàn web để chuyển giữa Campus/Dashboard và Dashboard Sidebar cho bảy route Dashboard;
- nhịp lưới, vị trí và kích thước các block;
- màu nền, border, radius, typography và trạng thái active;
- cấu trúc header, dải KPI, bảng thiết bị, cột Gateway và hàng card phía dưới;
- responsive behavior;
- cách hiển thị dữ liệu thật, dữ liệu chưa có và provenance.

Đây là một phase **UI alignment/refactor**, không phải phase bổ sung API, nghiệp vụ, dữ liệu mẫu hay database. Catalogue và telemetry đã có phải tiếp tục hoạt động sau khi đổi layout.

### 1.1 Quy ước route

Trong tài liệu này, từ “`/iot`” trong yêu cầu stakeholder được hiểu là trang IoT hiện hữu tại **`/dashboard/iot`**. Coding Agent không đổi route, không thêm redirect/alias và không thay đổi routing trong phase này, trừ khi có quyết định riêng bằng văn bản.

---

## 2. Thứ tự authority và cách dùng ảnh mockup

Coding Agent phải xử lý xung đột theo thứ tự sau:

1. Yêu cầu trực tiếp của stakeholder trong task triển khai.
2. `Dashboard_Knowledge_Base.md` cho scope Dashboard, ý nghĩa dữ liệu và các capability được phép.
3. `IoTBackend_API_HandOver.md` cho exact IoT API contract.
4. Handoff Phase 02 và Phase 03 cho trạng thái implementation hiện có.
5. Ảnh mockup cho kiến trúc thị giác, hình học, text và hierarchy.
6. Repository/runtime evidence cho trạng thái code thực tế.

Ảnh mockup là **nguồn tham chiếu hình ảnh**, không phải nguồn dữ liệu và không phải chỉ dẫn kỹ thuật ẩn. Không sao chép các con số, ID thiết bị, trạng thái, firmware, gateway, tỷ lệ packet hoặc mức pin trong ảnh thành dữ liệu thật/dummy.

### 2.1 Tài liệu Coding Agent phải đọc trước khi sửa code

- `web/doc/Dashboard_Knowledge_Base.md`.
- `web/doc/IoTBackend_API_HandOver.md` nếu phase chạm vào contract/adapter IoT; UI phase này không được tự thay contract.
- `web/doc/bp2_phase02_dashboard_application_api_real_device_catalogue_handoff.md`.
- `web/doc/bp2_phase03_page07_live_telemetry_core_handoff.md`.
- Ảnh mockup `1778 × 1222 px` được đính kèm trong task của Coding Agent.
- `AGENTS.md` và quy ước repository nếu có tại thời điểm triển khai.

---

## 3. Quy tắc bắt buộc cho các plan Markdown từ phase này trở đi

Mọi plan `.md` liên quan Dashboard sau tài liệu này phải có một mục **UI Architecture & Mockup Alignment** tối thiểu gồm:

1. nguồn hình ảnh/reference và reference viewport;
2. cấu trúc shell, navigation, page header và content grid;
3. bảng kích thước dự kiến của các vùng chính;
4. component hierarchy và ownership của shared/page-specific component;
5. text/label dự kiến;
6. design tokens: màu, typography, spacing, border, radius;
7. behavior ở desktop/tablet/mobile;
8. bảng đối chiếu mockup với data contract/Knowledge Base;
9. danh sách sai khác có chủ ý so với mockup và lý do;
10. visual QA checklist và ảnh chụp ở reference viewport.

Không được viết plan Dashboard chỉ liệt kê feature/API mà thiếu kiến trúc UI cần thiết để bám mockup.

---

## 4. Baseline đã xác minh

### 4.1 Capability phải giữ nguyên

- Page 07 hiện dùng real catalogue qua application API.
- Catalogue có search, type filter, floor filter và các state loading/ready/empty/unavailable/error.
- `is_active` chỉ là trạng thái hoạt động trong catalogue, không phải online/offline.
- Device Solar và AVC có thể được chọn để đọc telemetry thật với các preset `24 giờ`, `72 giờ`, `7 ngày`.
- Telemetry chỉ fetch khi user chọn thiết bị hoặc refresh thủ công; không polling và không quét N+1 toàn bộ bảng.
- RSSI, SNR, gateway ID và các metric Solar/AVC đã được hiển thị với provenance/caveat tương ứng.
- Unsupported device type vẫn xuất hiện trong catalogue nhưng telemetry hiển thị unavailable.
- Không có persistence telemetry, migration hay upstream mutation.

### 4.2 Chênh lệch UI hiện tại so với mockup

| Khu vực | UI hiện tại | Mockup đích |
| --- | --- | --- |
| High-Level Sidebar | Rail 64 px chứa Campus/Dashboard | Giữ nguyên kiến trúc và ownership; mockup bắt đầu ở workspace bên phải rail này |
| Dashboard Sidebar | Submenu 256 px sau High-Level Sidebar | Restyle theo sidebar trong mockup, target khoảng 287–288 px tại reference workspace |
| Top chrome | Top header riêng cao 56 px | Không có full-width top bar; header nằm trong page canvas |
| Content width | `max-w-7xl`, căn giữa | Fill toàn bộ phần còn lại, lề khoảng 30–32 px |
| Page header | Badge “Trang 07”, title và divider | Title lớn + subtitle chấm teal; action controls bên phải |
| KPI | 4 card, nằm trong section header | 6 card đồng đều trên một hàng ở desktop rộng |
| Catalogue | Form filter lớn + bảng metadata rộng | Card bảng chính gọn, filter pills ở header card |
| Telemetry | Panel đầy đủ đặt sau bảng | Giữ capability nhưng trình bày như detail area/drawer trong kiến trúc mới |
| Màu | Xanh navy/cyan đậm | Near-black/slate, teal tiết chế, amber/orange cho cảnh báo |
| Dashboard Sidebar item | Page number badge | Icon trái, active rail teal, không hiện page number |

---

## 5. Scope

### 5.1 In scope

- Giữ High-Level Sidebar hiện hữu rộng 64 px và navigation Campus/Dashboard; không hợp nhất hai sidebar.
- Restyle Dashboard Sidebar là sidebar thứ hai theo mockup và giữ đúng bảy route Dashboard đã freeze.
- Loại bỏ top header dùng chung hiện tại khỏi desktop shell; đưa page header vào content canvas.
- Bỏ `max-w-7xl` trên Dashboard page canvas.
- Điều chỉnh shared colors, spacing, border, radius, typography cho Dashboard.
- Cập nhật Page 07 header, KPI grid, catalogue layout, support panel và telemetry presentation.
- Bảo toàn các state component và provenance.
- Thêm icon mapping cho đúng bảy route đã freeze nếu cần.
- Responsive behavior và keyboard/focus behavior.
- Cập nhật test UI/structure hiện hữu bị ảnh hưởng.
- Visual QA tại viewport reference và các breakpoint bắt buộc.

### 5.2 Out of scope

- Không tạo API mới, sửa IoT upstream contract hoặc thêm database schema.
- Không thêm online/offline derivation, packet-rate aggregation, battery percentage, firmware, OTA, calibration hoặc gateway health.
- Không thêm 30-day/custom date range.
- Không thêm polling hoặc background request.
- Không đổi canonical route `/dashboard/iot`.
- Không thêm authentication/profile feature để phục vụ avatar.
- Không thêm page 04, 05, 08 hoặc 10.
- Không implement chart với số liệu lấy từ mockup.
- Không đổi business/navigation structure của Viewer/Unity hoặc ownership của High-Level Sidebar; shared token nếu sửa phải backward-compatible và không làm regress Viewer.
- Không thêm chart/icon library thứ hai nếu capability hiện hữu đủ dùng.

---

## 6. Reference geometry tại Dashboard workspace `1778 × 1222 px`

Ảnh mockup `1778 × 1222 px` được xem là **Dashboard workspace**, tức toàn bộ vùng nằm bên phải High-Level Sidebar 64 px sau khi user chọn Dashboard. Vì vậy screenshot full shell tương ứng có kích thước tham chiếu khoảng `1842 × 1222 px` (`64 + 1778`). Các tọa độ mockup bên dưới là tọa độ cục bộ trong Dashboard workspace; tọa độ full shell bằng tọa độ cục bộ cộng thêm 64 px theo trục X.

Các số dưới đây là target để Coding Agent dựng CSS/layout và đối chiếu screenshot. Cho phép sai số nhỏ theo font rendering; không dùng absolute positioning cho toàn page.

### 6.1 Khung tổng

| Vùng | Vị trí/kích thước dự kiến | Yêu cầu |
| --- | --- | --- |
| Full shell viewport | `1842 × 1222` | Dùng để kiểm tra đồng thời High-Level Sidebar và Dashboard workspace. |
| High-Level Sidebar | full-shell `x=0`, `y=0`, `w=64`, `min-h=1222` | Giữ navigation Campus/Dashboard và không tính vào kích thước mockup 1778 px. |
| Dashboard workspace | full-shell `x=64`, local `x=0`, `w=1778` | Đây là vùng được mô tả bởi ảnh mockup. |
| Dashboard Sidebar | local `x=0`, full-shell `x=64`, `w≈287–288`, `min-h=1222` | Sidebar thứ hai; fixed/sticky desktop, border phải 1 px. |
| Main canvas | local `x≈287`, full-shell `x≈351`, `w≈1491` | Không có Dashboard top bar riêng. |
| Main inner gutter | local `left≈31`, `right≈22–31` | Content local `x≈318..1756`; full-shell `x≈382..1820`. |
| Header block | `y≈27–83`, `h≈58` | Title/subtitle trái, actions phải. |
| KPI row | `y≈110`, `h≈142` | Sáu card một hàng ở reference viewport. |
| Main detail row | `y≈272`, `h≈583` | Catalogue trái + support panel phải. |
| Bottom row | `y≈874`, `min-h≈300` | Ba card theo tỷ lệ mockup; có thể tiếp tục dưới fold. |

### 6.2 Horizontal grid

- Main content gap chuẩn: `16 px`; khoảng tách các vùng lớn có thể `18–20 px` để khớp ảnh.
- Grid desktop tham chiếu nên dùng 12 columns hoặc CSS grid có tỷ lệ tương đương, không hard-code tất cả tọa độ.
- KPI: 6 columns bằng nhau, mỗi card khoảng `228 px`, gap khoảng `14–15 px`.
- Main detail row:
  - Catalogue card khoảng `970 px`.
  - Gateway/support card khoảng `449 px`.
  - Gap khoảng `18–19 px`.
- Bottom row:
  - Card trái khoảng `453 px`.
  - Card giữa khoảng `497 px`.
  - Card phải khoảng `449 px`.
  - Gap khoảng `18–19 px`.

Không cần đạt từng pixel bằng `left/top`; cần đạt đúng tổng thể bằng grid/flex để responsive.

### 6.3 Sai số visual chấp nhận

- Key edge của Dashboard Sidebar/main gutter trong workspace: ±`4 px`.
- High-Level Sidebar giữ `64 px`; không áp tolerance của mockup cho rail này vì nó nằm ngoài ảnh tham chiếu.
- Width/height card: ±`8 px`.
- Gap: ±`4 px`.
- Font size/line-height: ±`1 px` khi browser render khác.
- Màu: cùng family/contrast; không được quay lại blue-heavy palette hiện tại.

---

## 7. Shared Dashboard shell architecture

### 7.1 Component tree mục tiêu

```text
DashboardShell
├── HighLevelSidebar (64 px, nằm ngoài mockup)
│   ├── Campus navigation
│   └── Dashboard navigation (active khi ở /dashboard/*)
└── DashboardWorkspace (vùng mockup 1778 × 1222)
│   ├── DashboardSidebar
│   │   ├── DashboardBrand
│   │   ├── DashboardNavGroup (GIÁM SÁT)
│   │   └── DashboardNavItem × 7 in-scope routes
│   └── DashboardViewport
│       └── page content
│           └── DashboardPageShell
│               ├── DashboardPageHeader
│               └── page-specific content grid
```

Đây là kiến trúc ownership mục tiêu, không bắt buộc phải tạo đúng từng file nếu component nhỏ không cần tách.

### 7.2 High-Level Sidebar

- Giữ width `64 px` (`w-16`) và vị trí ngoài Dashboard workspace.
- Khai báo/giữ một token width dùng chung, ví dụ `--high-level-sidebar-width: 4rem`, để Dashboard drawer không lặp magic number `64px`.
- Tiếp tục sở hữu hai điểm điều hướng cấp cao: Campus và Dashboard.
- Dashboard item active trên các route `/dashboard/*`; Campus item đưa user về Viewer/Campus theo route hiện hữu.
- Không chuyển Campus/View return link vào Dashboard Sidebar.
- Không áp brand, nav group hoặc kích thước 287 px của mockup lên rail này.
- Chỉ được tinh chỉnh token màu/border ở mức backward-compatible để hai sidebar hòa hợp thị giác; không thay đổi navigation behavior trong phase này.

### 7.3 Dashboard Sidebar desktop

- Width target: `287 px` tại viewport reference; dùng token `--dashboard-sidebar-width: 18rem` (`288 px`) và cho phép sai số 1 px khi đối chiếu mockup.
- Background near-black riêng biệt nhưng không tương phản gắt với main canvas.
- Border phải 1 px, không dùng shadow dày.
- Padding ngang `12 px`, padding trên `20–22 px`.
- Brand row cao khoảng `52 px`:
  - monogram vuông bo góc khoảng `45 × 45 px`;
  - text “Digital Twin”, khoảng `18 px`, weight `650–700`;
  - subtext “Tòa E · Living Lab”, khoảng `13 px`.
- Group label “GIÁM SÁT”: uppercase, `11–12 px`, letter spacing `0.08em–0.12em`, margin top khoảng `28–30 px`.
- Nav item cao `48–52 px`, radius `10 px`, icon box `20–22 px`, gap icon/text `14 px`.
- Active item:
  - elevated slate background;
  - indicator teal rộng `3–4 px` ở mép trái;
  - text primary;
  - không dùng border cyan bao toàn item;
  - `aria-current="page"`.
- Inactive item dùng muted gray, hover tăng sáng vừa phải.
- Không thêm Viewer/Campus return link trùng lặp; navigation cấp cao đã thuộc High-Level Sidebar.

### 7.4 Navigation được phép trong Dashboard Sidebar

Dashboard Sidebar chỉ render bảy route đã freeze:

1. “Tổng quan”
2. “Năng lượng & Nước”
3. “Môi trường (IAQ)”
4. “Cảnh báo” — dùng tên ngắn trong sidebar, route title vẫn có thể là “Trung tâm cảnh báo”
5. “Hệ thống IoT”
6. “Bãi xe”
7. “PCCC”

Không render từ mockup các item sau vì out of scope:

- “Không gian”;
- “Thiết bị & Bảo trì”;
- “Thang máy”;
- “An ninh ra vào”.

Không render badge cảnh báo “5”, `Phase 2`, `Phase 3` hoặc bất kỳ counter nào từ ảnh. Badge cảnh báo chỉ xuất hiện sau khi có backend/domain state đúng Knowledge Base.

High-Level Sidebar vẫn render Campus và Dashboard; hai mục này không tính vào danh sách bảy route trên.

### 7.5 Icon architecture

- `DASHBOARD_ROUTES` có thể thêm semantic `iconKey`; renderer tập trung map `iconKey -> SVG`.
- Không nhúng một bộ SVG khác nhau lặp lại trong từng nav item.
- Icon decorative phải `aria-hidden`; accessible name đến từ link text.
- Không thêm dependency icon lớn chỉ để khớp mockup nếu inline icon set hiện hữu đáp ứng.

### 7.6 Mobile/tablet shell

- High-Level Sidebar tiếp tục tồn tại ở mép trái, giữ width `64 px` và ownership Campus/Dashboard ở mọi breakpoint trong phase này.
- `< 1200 px`: Dashboard Sidebar trở thành drawer neo ngay bên phải High-Level Sidebar (`left: 64px`, hoặc đúng token width thực tế của High-Level Sidebar).
- DashboardViewport chiếm phần còn lại bên phải High-Level Sidebar khi drawer đóng.
- Nút menu trong page header chỉ mở/đóng Dashboard Sidebar; không điều khiển High-Level Sidebar.
- Drawer rộng tối đa `288 px` và không vượt `calc(100vw - var(--high-level-sidebar-width))`.
- Overlay chỉ che Dashboard workspace, không che hoặc vô hiệu hóa High-Level Sidebar.
- Click overlay/Escape đóng Dashboard drawer. Focus chuyển vào drawer khi mở và trả về trigger khi đóng.
- Body không bị scroll ngang do hai sidebar hoặc table.

---

## 8. Design tokens và typography

Coding Agent phải gom giá trị dùng lại thành CSS variables/tokens, không rải inline color mới khắp component.

### 8.1 Palette mục tiêu

| Token conceptual | Giá trị khởi điểm | Dùng cho |
| --- | --- | --- |
| App background | `#070D11` đến `#091014` | Main canvas |
| High-Level Sidebar background | Giữ token hiện hữu hoặc đồng bộ nhẹ với `#0A1116` | Rail Campus/Dashboard nằm ngoài mockup |
| Dashboard Sidebar background | `#0A1116` đến `#0B1217` | Sidebar thứ hai trong Dashboard workspace |
| Panel background | `#111922` đến `#131B25` | Card chính |
| Elevated background | `#17222C` đến `#192631` | Active item, inner tile |
| Border | `rgba(83, 109, 126, 0.24–0.34)` | Card/divider |
| Text primary | `#E6EDF1` | Title/value |
| Text secondary | `#A5B0B9` | Label |
| Text muted | `#7E8B96` | Metadata/helper |
| Primary teal | `#4FB9AD` đến `#55C2B5` | Active/accent/progress |
| Success | `#43C0AC` | Confirmed positive state |
| Warning | `#E4BF55` | Warning only |
| Danger/orange | `#E55A2B` | Error/lost signal only when authoritative |

Giá trị trên là điểm khởi đầu lấy từ ảnh; Coding Agent được tinh chỉnh bằng screenshot comparison nhưng phải giữ contrast WCAG AA cho text bình thường.

### 8.2 Typography

- Dùng font stack hiện hữu nếu gần mockup; không tải font ngoài chỉ cho phase này.
- Page title: `28 px`, line-height `34–36 px`, weight `700`.
- Subtitle: `14 px`, line-height `20 px`.
- Card heading: `15–17 px`, weight `600–650`.
- KPI label: `14 px`.
- KPI value: `34–38 px`, weight `650–700`, tabular numbers.
- Table header: `12–13 px`, weight `550–600`.
- Table body: `12–14 px`; ID/numeric dùng monospaced/tabular styling khi phù hợp.
- Helper/provenance: `11–12 px`.

### 8.3 Radius, border và elevation

- Page card radius target: `12–14 px`.
- Inner tile radius: `9–11 px`.
- Control radius: `9–12 px`; pill dùng `9999 px` chỉ khi đúng kiểu pill.
- Border 1 px; shadow rất nhẹ, không dùng glow cyan.
- Main row/card padding desktop `20–22 px`.

---

## 9. Page 07 header

### 9.1 Left content

- Title chính: **“Hệ thống IoT · Tòa E”**.
- Subtitle: **“Quản lý thiết bị, gateway, firmware”**.
- Trước subtitle có dot teal `7–8 px`.
- Không render badge “Trang 07”.
- Không render border-bottom kéo dài toàn header.
- Header căn top với main gutter, khoảng `28–31 px` từ mép trên viewport.

Subtitle được phép dùng đúng wording mockup như mô tả domain, nhưng không được biến firmware/gateway thành capability đã có. Các block tương ứng phải thể hiện unavailable nếu nguồn chưa tồn tại.

### 9.2 Right actions và sai khác có chủ ý

Mockup có data badge, time segmented control, search square và avatar. Phase này xử lý như sau:

| Control mockup | Yêu cầu phase UI | Lý do |
| --- | --- | --- |
| “Dữ liệu minh họa” | Dùng `DataModeBadge` theo dữ liệu thật; catalogue/telemetry hiện tại phải ghi “Dữ liệu thực” hoặc provenance tương đương | Không được gắn nhãn demo cho live data hoặc ngược lại |
| “Hôm nay / 7 ngày / 30 ngày / Tùy chọn” | Không thêm 30 ngày/custom. Existing telemetry selector giữ `24 giờ / 72 giờ / 7 ngày`; có thể đặt trong header của detail telemetry, không giả là filter toàn page | Backend/current phase chỉ hỗ trợ preset đã freeze |
| Search icon | Nút `44–48 px`, khi bấm focus/mở ô search catalogue hiện hữu; có accessible label | Tái sử dụng chức năng search, không tạo search giả |
| Avatar “AT” | Không dùng initials giả. Dùng generic account icon disabled/neutral với tooltip “Tài khoản chưa cấu hình”, hoặc bỏ nếu không thể render trung thực | Auth/identity chưa được freeze |

Ở reference viewport, action group cao tối đa `52 px`, căn phải với content edge. Khi không đủ chỗ, group wrap xuống hàng nhưng title không bị co thành một dòng quá ngắn.

---

## 10. KPI strip

### 10.1 Geometry

- Vị trí ngay dưới page header, margin top khoảng `25–27 px`.
- Full browser viewport `≥1842 px` (Dashboard workspace `≥1778 px`): 6 card một hàng.
- Card target `h≈142 px`, padding `20 px`, gap `14–15 px`.
- Không thêm `DashboardSection` header riêng “Tổng quan thiết bị IoT” phía trên; section title đó không có trong mockup.

### 10.2 Sáu visual slots

| Thứ tự | Label theo mockup | Dữ liệu được phép trong phase này | Cách render |
| --- | --- | --- | --- |
| 1 | “Tổng thiết bị” | `summary.acceptedCount` từ catalogue | Ready/empty/loading/error đúng provenance; subtitle mô tả phạm vi catalogue, không chép “48 RFT-SB…” từ ảnh |
| 2 | “Trực tuyến” | Chưa có authoritative online semantics | `Unavailable`, value `—`, helper “Chờ xác nhận quy tắc online/offline” |
| 3 | “Nhận gói tin (24h)” | Chưa có packet-delivery aggregate | `Unavailable`, value `—`, helper “Chưa có nguồn packet-rate” |
| 4 | “Gateway” | Có gateway ID theo selected telemetry nhưng chưa có inventory/health aggregate | `Unavailable`, value `—`, helper “Chưa có inventory/health” |
| 5 | “Pin yếu” | AVC raw flag chưa xác nhận domain; không có normalized building-wide count | `Unavailable`, value `—`, helper “Chưa xác nhận dữ liệu pin” |
| 6 | “Tuổi thọ pin dự kiến” | Không có source/rule | `Unavailable`, value `—`, helper “Chưa có mô hình dự báo” |

Không render các số `56`, `54/56`, `97,8%`, `2/2`, `3`, `~2,5 năm` từ mockup trừ khi số tương ứng đến từ API/rule đã được phê duyệt tại runtime. Chỉ KPI tổng thiết bị hiện có nguồn đáng tin cậy.

### 10.3 Shared component

`KpiMetadataCard` nên được mở rộng bằng visual variant/compact layout thay vì tạo sáu card bespoke. Mọi state vẫn phải có accessible text, provenance và không dựa duy nhất vào màu.

---

## 11. Main detail row

### 11.1 Grid

- Desktop reference: `minmax(0, 2.16fr) minmax(360px, 1fr)`.
- Min-height target khoảng `583 px` tại reference viewport.
- Hai card phải top-aligned và cao bằng nhau khi catalogue có 8 dòng hoặc ít hơn.
- Nếu nội dung dài hơn, card/table scroll nội bộ có kiểm soát hoặc page tăng chiều cao; không cắt dữ liệu.

### 11.2 Catalogue card header

- Title: **“Danh sách thiết bị ({visibleCount} / {totalCount})”**.
- Title nằm góc trái, `16–17 px`, weight `650`.
- Phía phải là compact controls.
- Mockup pills:
  - “Tất cả” là filter hoạt động.
  - “Có sự cố” không có authoritative alert state trong phase này: hiển thị disabled với tooltip/description “Chưa có nguồn trạng thái sự cố”, hoặc ẩn ở viewport nhỏ.
  - “Pin yếu” không có normalized building-wide source: hiển thị disabled với lý do tương tự.
- Floor và type filter hiện hữu phải được giữ, nhưng chuyển sang compact secondary controls/popover/dropdown để không tạo một form box riêng cao như hiện tại.
- Ô search có thể mở từ search button trên page header và phải focus được bằng keyboard.
- Count hiển thị phải phân biệt filtered count và total accepted count.

### 11.3 Catalogue table visual columns

Mục tiêu thị giác theo mockup, nhưng text/value phải trung thực:

| Cột visual | Nguồn hiện có | Quy tắc |
| --- | --- | --- |
| “Mã thiết bị” | `externalDeviceId` | Render, ellipsis một dòng; full value trong `title`/accessible detail |
| “Loại” | `sourceDeviceType`/`category` | Render source type; category có thể là sublabel/tooltip |
| “Vị trí” | source floor + display floor | Render “Tầng X”; fallback/unmapped phải có marker provenance; X/Y/Z chuyển vào detail disclosure |
| “RSSI” | Chỉ có cho telemetry của selected Solar/AVC device | Không chạy fetch từng row. Chưa chọn/chưa cache thì `—`; selected response có thể điền đúng value |
| “SNR” | Như RSSI | Cùng rule, không N+1 |
| “Pin” | Chưa có standardized percentage | `—` với accessible “Chưa có dữ liệu pin”; không suy từ raw AVC flag |
| “Lần cuối” | Latest telemetry chỉ có sau khi chọn; `sourceUpdatedAt` không phải last seen | Chỉ hiển thị latest sample timestamp khi đã fetch; nếu không `—`; tuyệt đối không đổi metadata timestamp thành last seen |
| “Firmware” | Chưa có | `—`/“Chưa có” |
| “Trạng thái” | Online/offline chưa có | Hiển thị compact catalogue state với wording “Trong danh mục”/“Ngừng trong danh mục”; không ghi “Trực tuyến/Mất tín hiệu” |

Các metadata quan trọng đang có nhưng không nằm trong mockup — source created/updated timestamps, exact X/Y/Z, floor assignment caveat — phải chuyển vào row detail, tooltip hoặc selected-device technical disclosure, không được xóa khỏi capability/provenance.

### 11.4 Table dimensions

- Header row khoảng `38–42 px`.
- Body row khoảng `42–44 px`.
- Horizontal padding cell `10–12 px`.
- Divider subtle, không zebra stripe mạnh.
- ID và numeric dùng tabular/mono style.
- Table có horizontal scroll trên viewport hẹp; cột ID, loại và action/detail giữ dễ nhận biết.
- Toàn row có thể selectable bằng button semantics hoặc giữ action “Xem telemetry”; không dùng click-only row mà thiếu keyboard behavior.
- Selected row dùng nền teal rất nhẹ và border/indicator tinh tế.

### 11.5 Loading/empty/error/caveat

- State component phải nằm bên trong catalogue card để geometry trang không nhảy thành layout hoàn toàn khác.
- Caveat không chiếm một banner cao phía trên bảng như hiện tại nếu có thể; dùng compact inline notice hoặc disclosure trong card header/footer.
- Error có nút “Thử lại”.
- Filter empty có nút “Xóa bộ lọc”.

---

## 12. Gateway/support card

### 12.1 Visual shell

- Title: **“Gateway LoRaWAN”**.
- Cùng panel style và chiều cao với catalogue card ở reference desktop.
- Padding `20–22 px`.

### 12.2 Data rule

Current contract không có gateway inventory/health. Không render `GW-01`, `GW-02`, floor, packet count hoặc “Trực tuyến” từ ảnh.

Trong phase này card phải dùng `UnavailableDataState` compact:

- heading phụ: **“Chưa có dữ liệu inventory/health”**;
- description: **“Gateway ID chỉ khả dụng theo telemetry của thiết bị được chọn; chưa có nguồn xác nhận trạng thái gateway toàn tòa nhà.”**;
- nếu selected telemetry có `gatewayId`, có thể hiển thị một dòng read-only **“Gateway của thiết bị đang chọn: {gatewayId}”** với provenance live;
- không suy trạng thái gateway từ việc telemetry trả dữ liệu;
- không thêm “Network server: ChirpStack” nếu contract/application config không xác nhận.

---

## 13. Bottom support row

Giữ ba card shell để trang bám sát hierarchy của mockup, nhưng không dựng chart/progress giả.

| Card | Title | Tình trạng phase này | Nội dung bắt buộc |
| --- | --- | --- | --- |
| Trái | “Tỷ lệ nhận gói tin theo tầng (24h, %)” | Unavailable | Text “Chưa có packet-reception aggregate theo tầng”; không render thanh T1–T6/Mái từ ảnh |
| Giữa | “Phân bố pin (số thiết bị)” | Unavailable | Text “Chưa có battery percentage chuẩn hóa”; không render histogram 0–20…80–100 |
| Phải | “Cập nhật firmware (OTA)” | Unavailable | Text “Chưa có firmware/OTA contract”; không render version/progress/calibration date từ ảnh |

### 13.1 Geometry

- Desktop reference: `minmax(320px, 1fr) minmax(360px, 1.1fr) minmax(320px, 1fr)`.
- Min-height khoảng `280–310 px`.
- Card titles nằm cùng baseline.
- Compact unavailable state căn giữa theo chiều dọc nhưng không làm mất title.
- Không khởi tạo `ant-design-charts` cho unavailable cards; tránh bundle/render không cần thiết.

Khi một contract tương lai được xác nhận, card shell mới được thay bằng chart/data component riêng trong phase tương ứng.

---

## 14. Selected-device telemetry trong kiến trúc mới

Mockup không mô tả chi tiết selected-device telemetry, nhưng capability Phase 03 đã hoàn tất và không được loại bỏ.

### 14.1 Presentation đề xuất

- Khi chưa chọn device: không chiếm thêm vùng lớn trong page.
- Khi chọn device:
  - mở một detail drawer/panel từ cạnh phải trên desktop hoặc expandable panel ngay dưới catalogue row;
  - trên mobile dùng full-width sheet/section;
  - title có device ID và nút đóng rõ ràng;
  - giữ selector `24 giờ / 72 giờ / 7 ngày`, refresh thủ công, latest cards, chart, technical details và coverage footer.
- Nếu chọn row khác, request cũ bị abort/ignore đúng behavior hiện hữu.
- Không biến range selector thành page-wide filter cho các KPI chưa có nguồn.
- Không tự fetch telemetry cho tất cả row để lấp các cột RSSI/SNR/last seen.

### 14.2 Visual style

- Dùng cùng panel background, border, radius và typography với mockup.
- Technical raw fields tiếp tục ở disclosure, không trộn vào bảng chính.
- Provenance/caveat vẫn nhìn thấy nhưng compact.
- Chart dùng shared wrapper hiện hữu và teal palette phù hợp.

---

## 15. Responsive architecture

Breakpoint trong bảng dưới đây tính theo **full browser viewport**. High-Level Sidebar luôn được tính riêng; mockup desktop đầy đủ chỉ đạt nguyên tỷ lệ khi full viewport khoảng `1842 px` trở lên.

| Full viewport | High-Level Sidebar | Dashboard Sidebar | KPI | Main row | Bottom row | Table |
| --- | --- | --- | --- | --- | --- | --- |
| `≥ 1842 px` | 64 px, cố định | 287–288 px, cố định | 6 cột | Catalogue + support, khoảng 2.16:1 | 3 cột | Fit card; scroll nếu text/API dài bất thường |
| `1440–1841 px` | 64 px, cố định | 248–272 px, cố định | 3 × 2 | Hai cột nếu support ≥340 px, nếu không stack | 2 + 1 hoặc 3 nếu đủ | Horizontal scroll được phép |
| `1200–1439 px` | 64 px, cố định | 224–240 px, cố định | 3 × 2 | Stack catalogue rồi support | 2 cột rồi wrap | Horizontal scroll |
| `768–1199 px` | 64 px, cố định | Drawer neo bên phải rail | 2 cột | Stack | 1–2 cột | Scroll, controls wrap |
| `< 768 px` | 64 px, cố định | Drawer rộng tối đa phần còn lại | 1 cột | Stack | 1 cột | Min-width table + scroll; selected detail full width |

Yêu cầu thêm:

- Page header action group wrap dưới title trên tablet/mobile.
- Không dùng fixed height gây cắt table/state text.
- Touch target tối thiểu khoảng `44 × 44 px` cho icon buttons.
- Không có horizontal scroll ở toàn body; chỉ table region được scroll ngang.

---

## 16. File/component impact dự kiến

Coding Agent phải re-audit trước khi sửa. Danh sách dự kiến:

### 16.1 Shared layout/style

- `web/src/components/dashboard/layout/DashboardShell.tsx`
- `web/src/components/dashboard/layout/DashboardPageShell.tsx`
- `web/src/components/dashboard/layout/DashboardSection.tsx`
- `web/src/config/dashboard-routes.ts`
- `web/src/app/globals.css`
- Có thể tạo component sidebar/icon nhỏ dưới `web/src/components/dashboard/layout/` nếu giúp ownership rõ hơn.

### 16.2 Page 07

- `web/src/app/dashboard/iot/page.tsx`
- `web/src/components/dashboard/iot/IotCataloguePanel.client.tsx`
- `web/src/components/dashboard/iot/IotCatalogueFilters.tsx`
- `web/src/components/dashboard/iot/IotDeviceCatalogueTable.tsx`
- `web/src/components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx`
- `web/src/components/dashboard/iot/IotTelemetryMetricSelector.tsx`
- `web/src/components/dashboard/iot/IotTelemetryTechnicalDetails.tsx`
- Có thể tạo các presentation component như KPI strip/support cards/detail drawer trong cùng domain `dashboard/iot`.

### 16.3 Shared cards/states/controls

- `KpiMetadataCard`, `DataModeBadge`, `TimeRangeSelector` và state components chỉ sửa bằng backward-compatible visual variants khi cần.
- Không copy state/card implementation riêng cho Page 07 nếu shared primitive có thể mở rộng sạch.

### 16.4 Không được chạm nếu không có lý do UI trực tiếp

- Backend Dashboard/IoT services, controllers, DTOs.
- PostgreSQL entities/migrations.
- IoT API adapter semantics/range calculation.
- Viewer/Unity components.

---

## 17. Trình tự triển khai dành cho Coding Agent

### Checkpoint 1 — Re-audit và visual baseline

1. Đọc các authority docs ở mục 2.1.
2. Chạy app hiện tại và chụp full shell ở `1842 × 1222`, đồng thời lưu crop Dashboard workspace `1778 × 1222`, trước khi sửa.
3. Ghi lại trạng thái catalogue/telemetry có thể kiểm tra trong environment.
4. Xác nhận working tree và bảo toàn thay đổi không liên quan.

### Checkpoint 2 — Tokens và shell

1. Tạo/cập nhật Dashboard tokens.
2. Giữ nguyên High-Level Sidebar và ownership Campus/Dashboard; không hợp nhất hai sidebar.
3. Restyle Dashboard Sidebar theo mockup và giữ đúng bảy route nội bộ.
4. Loại bỏ Dashboard top header desktop nhưng không thay đổi High-Level Sidebar.
5. Implement Dashboard Sidebar drawer responsive và accessibility.
6. Xác nhận không có page/counter giả hoặc navigation trùng lặp.

### Checkpoint 3 — Shared page shell

1. Bỏ `max-w-7xl` cho Dashboard canvas.
2. Tạo header layout có title/subtitle/actions đúng geometry.
3. Loại bỏ badge “Trang 07” ở Page 07; nếu các page khác còn cần page number, dùng prop/variant backward-compatible.
4. Kiểm tra không regress sáu route Dashboard còn lại.

### Checkpoint 4 — Page 07 macro layout

1. Dựng 6-column KPI strip.
2. Dựng main 2-column row.
3. Dựng bottom 3-card row.
4. Chỉ dùng unavailable content cho capability chưa có.

### Checkpoint 5 — Catalogue và telemetry presentation

1. Compact filter/header.
2. Chuyển table columns theo mục 11.3.
3. Bảo toàn metadata trong detail/disclosure.
4. Bảo toàn explicit-selection telemetry request.
5. Đưa telemetry vào drawer/expandable detail mà không thay business logic.

### Checkpoint 6 — States, accessibility và responsive

1. Kiểm tra loading, ready, upstream empty, filter empty, unavailable, error.
2. Kiểm tra keyboard navigation, focus, Escape, labels và contrast.
3. Kiểm tra breakpoints mục 15.

### Checkpoint 7 — Verification và visual tuning

1. Chạy test/lint/build phù hợp.
2. Chụp screenshot sau sửa ở reference viewport.
3. So sánh side-by-side với mockup theo checklist mục 19.
4. Tinh chỉnh spacing/colors/typography, không tinh chỉnh bằng dữ liệu giả.

---

## 18. Test plan

### 18.1 Automated regression

- Các test Phase 01/02/03 liên quan Dashboard phải tiếp tục pass.
- Web lint và production build phải pass, ngoài warning pre-existing đã ghi nhận.
- Cập nhật test structure/class/text nếu UI markup đổi, nhưng không làm yếu các assertion về:
  - đúng bảy route;
  - không có page 04/05/08/10;
  - không có fabricated alert counter;
  - catalogue activity không trở thành online/offline;
  - không có unsupported battery/firmware/gateway/packet/OTA value;
  - không upstream URL/token ở client;
  - telemetry chỉ fetch theo selected device;
  - preset chỉ `24h/72h/7d`;
  - loading/empty/unavailable/error tách biệt.

### 18.2 Interaction checks

- High-Level Sidebar vẫn có Campus/Dashboard; Dashboard active trên `/dashboard/*` và Campus link vẫn hoạt động.
- Dashboard Sidebar active đúng route `/dashboard/iot` và chỉ có bảy route nội bộ.
- Không xuất hiện Viewer/Campus link trùng lặp trong Dashboard Sidebar.
- Mobile/tablet Dashboard drawer mở/đóng bằng trigger, overlay và Escape; High-Level Sidebar vẫn khả dụng.
- Search button focus/mở search field.
- Floor/type/search filters vẫn lọc đúng.
- Disabled “Có sự cố”/“Pin yếu” không giả vờ lọc.
- Chọn Solar/AVC mở detail và fetch đúng một selected device.
- Chọn unsupported type hiển thị unavailable mà không gọi telemetry.
- Đổi selected device/range không cho stale response overwrite.
- Close detail không làm mất catalogue/filter state.

### 18.3 Visual regression viewports

Tối thiểu chụp:

- `1842 × 1222` — full shell gồm High-Level Sidebar 64 px + Dashboard workspace 1778 px;
- crop Dashboard workspace `1778 × 1222` — reference/mockup match;
- `1440 × 900` — desktop phổ biến;
- `1280 × 800` — compact desktop;
- `1024 × 768` — tablet landscape;
- `390 × 844` — mobile.

Không commit ảnh mockup của stakeholder vào repository nếu chưa được yêu cầu. Có thể lưu screenshot kết quả vào artifact/test output phù hợp và dẫn đường dẫn trong handoff.

---

## 19. Visual QA checklist tại full shell `1842 × 1222`

- [ ] High-Level Sidebar 64 px vẫn tồn tại, chứa Campus/Dashboard và nằm ngoài vùng mockup.
- [ ] Dashboard Sidebar là sidebar thứ hai, rộng khoảng 287–288 px trong Dashboard workspace.
- [ ] Không có navigation Campus/Viewer bị lặp trong Dashboard Sidebar.
- [ ] Không còn desktop top header full-width.
- [ ] Trong crop Dashboard workspace, main gutter bắt đầu khoảng local `x=318`; trong full shell tương ứng khoảng `x=382`.
- [ ] Title là “Hệ thống IoT · Tòa E”, đúng scale/hierarchy.
- [ ] Subtitle có teal dot và đúng wording đã chốt.
- [ ] Sáu KPI card nằm cùng một hàng, cùng chiều cao.
- [ ] Catalogue card và Gateway card top-aligned, tỷ lệ gần 970:449.
- [ ] Catalogue title/count và filter controls nằm trong card header.
- [ ] Table row density/column hierarchy gần mockup.
- [ ] Không có con số/ID/trạng thái lấy từ ảnh.
- [ ] Gateway card nói rõ unavailable thay vì render GW-01/GW-02 giả.
- [ ] Ba bottom cards đúng hierarchy và đều hiển thị unavailable trung thực.
- [ ] Palette near-black/slate + teal; không còn glow/blue-heavy styling.
- [ ] Border/radius/font weight đồng nhất.
- [ ] Không có nav item out of scope, badge “5” hoặc phase tag.
- [ ] Catalogue và selected telemetry vẫn dùng dữ liệu/runtime thật.
- [ ] Không có body horizontal overflow.

---

## 20. Acceptance criteria

Phase này chỉ hoàn tất khi tất cả điều kiện sau đạt:

1. `/dashboard/iot` bám sát cấu trúc và tỷ lệ mockup trong crop Dashboard workspace `1778 × 1222` theo tolerance mục 6.3.
2. Shared shell giữ hai tầng navigation: High-Level Sidebar 64 px cho Campus/Dashboard và Dashboard Sidebar cho đúng bảy route in-scope.
3. Page 07 có đúng macro hierarchy: page header → 6 KPI → catalogue/support → 3 support cards.
4. Mọi text chính, label và trạng thái tuân theo tài liệu này.
5. Không số liệu minh họa nào trong ảnh bị hard-code thành live-looking data.
6. Unsupported fields hiển thị unavailable/conditional rõ ràng.
7. Real catalogue và selected-device telemetry Phase 02/03 không regress.
8. Không N+1 telemetry request, polling, API mới, DB migration hoặc upstream mutation.
9. Không dùng `sourceUpdatedAt` như telemetry last seen và không dùng `is_active` như online.
10. Responsive, keyboard, focus, labels và contrast đạt yêu cầu.
11. Các Dashboard page khác vẫn render được sau shared shell/token changes.
12. Test/lint/build và visual QA được ghi bằng evidence trong handoff.

---

## 21. Guardrails cho Coding Agent

- Không implement thêm feature chỉ để lấp đầy mockup.
- Không xóa capability thật chỉ vì mockup không biểu diễn nó.
- Không sửa data semantics để phù hợp text trong ảnh.
- Không dùng dummy không provenance.
- Không dùng `Math.random()`.
- Không tạo page out of scope.
- Không cho browser gọi trực tiếp IoT upstream.
- Không expose token, internal URL, stack trace hoặc raw upstream error.
- Không thay đổi backend/API nếu alignment có thể giải quyết thuần frontend.
- Không overwrite thay đổi không liên quan trong dirty working tree.
- Không coi screenshot similarity là đủ nếu accessibility hoặc data truthfulness bị vi phạm.

---

## 22. Nội dung handoff bắt buộc sau implementation

Sau khi triển khai và verify xong, Coding Agent **bắt buộc tạo** file:

`web/doc/bp2_fix_align_UI_handoff.md`

Handoff phải ghi tối thiểu:

- branch, HEAD và working-tree notes;
- danh sách file tạo/sửa;
- component architecture thực tế sau refactor;
- bảng khác biệt giữa mockup và implementation, gồm cả sai khác có chủ ý do Knowledge Base;
- exact handling cho các capability unavailable;
- test/lint/build commands và kết quả;
- interaction/accessibility checks;
- đường dẫn hoặc mô tả screenshot evidence ở các viewport mục 18.3;
- open issues và known visual deltas;
- xác nhận không thêm fake data/API/DB behavior.

> **Lệnh bàn giao cuối plan cho Coding Agent:** Implement đúng phạm vi của `bp2_fix_align_UI.md`, không mở rộng tính năng; sau khi hoàn tất bắt buộc tạo `web/doc/bp2_fix_align_UI_handoff.md` trước khi báo phase đã hoàn thành.
