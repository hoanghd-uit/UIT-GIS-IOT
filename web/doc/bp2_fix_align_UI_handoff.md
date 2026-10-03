# BP2 - UI Alignment Handoff: Dashboard Page 07 (Hệ thống IoT · Tòa E)

- **Date:** 2026-09-26
- **Branch:** `feature/dashboard`
- **HEAD Commit:** `6c4bf293d78c5dce7228ee0c591d82718fa95877`
- **Author:** Coding Agent (Antigravity)
- **Status:** Completed & Verified
- **Authority Specifications:**
  - `web/doc/bp2_fix_align_UI.md`
  - `web/doc/bp2_phase02_dashboard_application_api_real_device_catalogue_handoff.md`
  - `web/doc/bp2_phase03_page07_live_telemetry_core_handoff.md`
  - `web/doc/IoTBackend_API_HandOver.md`

---

## 1. Executive Summary

This handoff documents the UI alignment of Dashboard Page 07 (`/dashboard/iot`), updating the page hierarchy, layout geometry, typography, palette, and component distribution to match the stakeholder mockup image (*"Hệ thống IoT · Tòa E"*).

### Key Architectural Tenets Preserved:
1. **Dual-Sidebar Layout Integrity:** High-Level Sidebar (64px) remains strictly preserved for Campus/Dashboard navigation. The Dashboard Sidebar (288px) features the "BEI Digital Twin" identity, "Tòa E · Living Lab", "GIÁM SÁT" category header, and exactly the seven frozen in-scope routes. Out-of-scope routes (Không gian, Thang máy, etc.) and fake badge counters were excluded per frozen requirements.
2. **Desktop Header Realignment:** The desktop top header bar was removed, allowing Page 07 to render directly in the Dashboard workspace with full macro fidelity (`1842 × 1222` full shell reference; `1778 × 1222` workspace). A dedicated mobile/tablet drawer button was provided for viewports `< 1200px`.
3. **Data Truthfulness (Anti-Hallucination):** No fake device IDs, synthetic uptime percentages, fabricated battery levels, fictitious LoRaWAN gateways, or mock OTA rollouts were hard-coded. Real data feeds from Phase 02 (Catalogue) and Phase 03 (Live Telemetry) are cleanly hooked up. Where backend data is unavailable, components render standard, compact `UnavailableDataState` ("—" / "Chưa có nguồn dữ liệu").

---

## 2. File Manifest

### Created Files
- `web/src/components/dashboard/iot/IotPageHeader.tsx`: Title "Hệ thống IoT · Tòa E", subtitle with teal status dot, dynamic `DataModeBadge`, segmented time buttons (`Hôm nay`, `7 ngày`, `30 ngày`, `Tùy chọn`), search icon trigger, and user avatar ("AT").
- `web/src/components/dashboard/iot/IotKpiStrip.tsx`: 6-card KPI strip in 1 horizontal row (`Tổng thiết bị` with live device type breakdown, `• Trực tuyến`, `• Nhận gói tin (24h)`, `• Gateway`, `• Pin yếu`, `Tuổi thọ pin dự kiến`).
- `web/src/components/dashboard/iot/IotGatewayCard.tsx`: Dedicated LoRaWAN gateway panel with dynamic selected-device Gateway ID display and honest unavailable representation for unprovisioned gateway telemetry.
- `web/src/components/dashboard/iot/IotBottomSupportCards.tsx`: 3 bottom support cards (`Tỷ lệ nhận gói tin theo tầng`, `Phân bố pin (số thiết bị)`, `Cập nhật firmware (OTA)`) rendered with compact unavailable states.
- `web/doc/bp2_fix_align_UI_handoff.md`: This comprehensive handoff document.

### Modified Files
- `web/src/app/globals.css`: Added design tokens for near-black/slate dark theme (`#070D11`, `#0A1116`, `#111922`, `#17222C`), teal accents (`#4FB9AD`), and sidebar layout dimensions.
- `web/src/components/dashboard/layout/DashboardShell.tsx`: Restyled Dashboard Sidebar to match mockup (BEI monogram, Digital Twin branding, teal active rail indicator, 7 frozen routes). Provided responsive mobile drawer trigger with Escape/overlay handling.
- `web/src/components/dashboard/layout/DashboardPageShell.tsx`: Removed `max-w-7xl mx-auto` constraint to allow edge-to-edge layout matching the mockup canvas. Added `hidePageBadge`, `hideDivider`, and `subtitleWithDot` props.
- `web/src/components/dashboard/iot/IotCatalogueFilters.tsx`: Updated title hierarchy to `Danh sách thiết bị (count / total)`, added mockup filter pills (`Tất cả`, `Có sự cố` [disabled], `Pin yếu` [disabled]), and compact floor/type selects.
- `web/src/components/dashboard/iot/IotDeviceCatalogueTable.tsx`: Restructured columns into `Mã thiết bị`, `Loại`, `Vị trí`, `RSSI`, `SNR`, `Pin`, `Lần cuối`, `Firmware`, `Trạng thái`, and `Thao tác` (Xem telemetry) + `Chi tiết` (Technical disclosure). Live samples populate selected row.
- `web/src/components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx`: Embedded drawer/card telemetry panel with callback `onTelemetryLoaded` to pass live gateway ID, RSSI, SNR, and timestamp to parent.
- `web/src/components/dashboard/iot/IotCataloguePanel.client.tsx`: Orchestrated 6 KPI cards, Catalogue card, Gateway card, and Bottom row cards with responsive CSS grid. Preserved test assertion anchors.
- `web/src/components/dashboard/states/UnavailableDataState.tsx`: Added `compact?: boolean` prop for small card contexts.
- `web/src/app/dashboard/iot/page.tsx`: Updated page shell properties to hide old badges and dividers.

---

## 3. Component Architecture & Data Flow

```
+-----------------------------------------------------------------------------------------------+
| DashboardShell (64px High-Level Sidebar + 288px Dashboard Sidebar + Responsive Drawer)        |
+-----------------------------------------------------------------------------------------------+
| DashboardPageShell (No max-width constraint, dark canvas #070D11)                             |
|  +-- IotCataloguePanel.client (Root Controller)                                               |
|       |                                                                                       |
|       +-- IotPageHeader                                                                       |
|       |    - Title: "Hệ thống IoT · Tòa E"                                                    |
|       |    - Subtitle: "• Quản lý thiết bị, gateway, firmware"                                |
|       |    - DataModeBadge (Live mode)                                                        |
|       |    - Time Controls & Search trigger                                                   |
|       |                                                                                       |
|       +-- IotKpiStrip (6 Columns)                                                             |
|       |    1. Tổng thiết bị (Live count: e.g. 56 + RFT-SB / AVC breakdown)                   |
|       |    2. • Trực tuyến (UnavailableState - no ping/heartbeat endpoint)                    |
|       |    3. • Nhận gói tin (24h) (UnavailableState - no packet rate aggregator)             |
|       |    4. • Gateway (Live selected gateway ID or UnavailableState)                        |
|       |    5. • Pin yếu (UnavailableState - battery voltage field unprovisioned)              |
|       |    6. Tuổi thọ pin dự kiến (UnavailableState)                                         |
|       |                                                                                       |
|       +-- Main Grid (Catalogue ~2.16 : 1 Gateway / Telemetry)                                 |
|       |    +-- Catalogue Card                                                                 |
|       |    |    - IotCatalogueFilters (Title with counts, Filter pills, Floor/Type dropdowns)  |
|       |    |    - IotDeviceCatalogueTable (Columns: Device ID, Type, Location, RSSI, SNR,     |
|       |    |                               Pin, Last Seen, Firmware, Status, Action)          |
|       |    |                               *Selected row updates with live sample data*       |
|       |    +-- Right Column:                                                                  |
|       |         - IotGatewayCard (LoRaWAN network callout & dynamic gateway ID)               |
|       |         - IotDeviceTelemetryPanel.client (Opens when row is selected)                 |
|       |                                                                                       |
|       +-- IotBottomSupportCards (3 Columns)                                                   |
|            1. Tỷ lệ nhận gói tin theo tầng (UnavailableState)                                 |
|            2. Phân bố pin (số thiết bị) (UnavailableState)                                    |
|            3. Cập nhật firmware (OTA) (UnavailableState)                                      |
+-----------------------------------------------------------------------------------------------+
```

---

## 4. Comparison: Mockup vs. Implementation & Data Sources

| Component / Section | Mockup Presentation | Implementation Handling | Data Source & Provenance |
| :--- | :--- | :--- | :--- |
| **High-Level Sidebar** | Not in mockup (campus level) | 64px fixed left rail (`Campus` & `Dashboard` links) | Preserved per project architecture |
| **Dashboard Sidebar** | BEI Digital Twin, 7 items + 4 expandable + 1 badge | BEI Digital Twin branding, 7 frozen routes, active indicator | `dashboard-routes.ts` (strictly 7 routes) |
| **Page Header** | "Hệ thống IoT · Tòa E", dot subtitle, range, search, avatar | Exactly matched typography, layout, teal dot, user avatar | Static chrome + Live `DataModeBadge` |
| **KPI 1: Tổng thiết bị** | 56 (48 RFT-SB · 6 AVC · 2 LC02) | Real dynamic count (`acceptedCount`) + type breakdown | `/api/dashboard/iot/catalogue` (Real) |
| **KPI 2: Trực tuyến** | 54/56 (2 mất tín hiệu) | Rendered as "—" with `Chưa có dữ liệu trực tuyến` | **UNAVAILABLE** (No heartbeat/online API) |
| **KPI 3: Nhận gói tin**| 97,8% (Mục tiêu ≥ 95%) | Rendered as "—" with `Chưa có thống kê gói tin` | **UNAVAILABLE** (No packet drop aggregator) |
| **KPI 4: Gateway** | 2/2 Trực tuyến | Dynamic selected gateway ID or `Chưa có dữ liệu gateway` | **UNAVAILABLE / CONDITIONAL** (From telemetry sample) |
| **KPI 5: Pin yếu** | 3 Dưới 20% | Rendered as "—" with `Chưa có thông tin pin` | **UNAVAILABLE** (Battery field unprovisioned) |
| **KPI 6: Tuổi thọ pin**| ~ 2,5 năm (Chu kỳ gửi 5 phút) | Rendered as "—" with `Chưa có mô hình dự kiến` | **UNAVAILABLE** (No predictive model) |
| **Device Table: RSSI/SNR**| Per-device RSSI & SNR values | Populated dynamically when row selected; "—" otherwise | Selected telemetry sample `/api/dashboard/iot/telemetry` |
| **Device Table: Pin** | Percentage per device | Rendered as "—" | **UNAVAILABLE** |
| **Device Table: Lần cuối**| Time (19:04, 17:45...) | Populated dynamically when row selected; "—" otherwise | Selected telemetry sample `observedAt` |
| **Device Table: Firmware**| Version string (v1.4.2) | Rendered as "—" | **UNAVAILABLE** (No firmware version API) |
| **Gateway Card** | GW-01, GW-02 packet rates | Displays selected device's active Gateway ID; unavailable state for unprovisioned GW telemetry | **UNAVAILABLE / CONDITIONAL** |
| **Packet Rate by Floor**| Bar chart per floor (T1 - Mái) | Compact `UnavailableDataState` with metric description | **UNAVAILABLE** (No per-floor packet drop API) |
| **Battery Distribution**| Histogram (0-20 to 80-100) | Compact `UnavailableDataState` with metric description | **UNAVAILABLE** (No battery distribution API) |
| **Firmware OTA** | Progress bars for OTA rollouts | Compact `UnavailableDataState` with metric description | **UNAVAILABLE** (No OTA management API) |

---

## 5. Explicit Component Data Audit

As specifically requested by the project requirements, here is the audit of all components lacking backend API endpoints in `IoTBackend_API_HandOver.md` and absent from Phase 02/03 plan files:

1. **Device Health / Uptime / Online Rate:**
   - *Status:* **Unavailable**
   - *Reason:* Upstream IoT API `/api/v1/devices` provides `is_active` (an administrative enablement flag, not network connectivity). No ping/heartbeat endpoint exists.
   - *Presentation:* Rendered as "—" with explanatory caption `Chưa có dữ liệu trực tuyến (API chưa hỗ trợ heartbeat)`.
2. **Network Packet Reception Rate (24h):**
   - *Status:* **Unavailable**
   - *Reason:* Upstream ChirpStack / IoT Backend does not expose an aggregated packet delivery ratio (PDR) or packet counter endpoint.
   - *Presentation:* Rendered as "—" with explanatory caption `Chưa có thống kê gói tin (24h)`.
3. **Gateway Infrastructure Telemetry (GW-01, GW-02):**
   - *Status:* **Conditional / Unavailable**
   - *Reason:* ChirpStack gateway status and packet throughput (`packets/hour`, backhaul status) are not exposed via any backend API.
   - *Presentation:* Dynamically displays the Gateway ID of the currently inspected device via `data.latestSample.gatewayId`; general gateway metrics render as `Chưa có dữ liệu gateway LoRaWAN`.
4. **Battery Levels & Battery Lifetime Estimation:**
   - *Status:* **Unavailable**
   - *Reason:* Sensors deployed at Building E do not report battery voltage or SoC in telemetry payload. No battery health algorithm exists.
   - *Presentation:* Rendered as "—" in both KPI card and table column.
5. **Firmware Versions & OTA Rollout Tracking:**
   - *Status:* **Unavailable**
   - *Reason:* Neither `/api/v1/devices` nor `/api/v1/devices/{id}/telemetry` provides device firmware version strings or OTA deployment metrics.
   - *Presentation:* Rendered as "—" in table column and compact unavailable state in bottom OTA card.
6. **Per-Floor Packet Reception Rate Chart:**
   - *Status:* **Unavailable**
   - *Reason:* Requires time-series aggregation of LoRaWAN frames grouped by building floor, which is not supported by the backend.
   - *Presentation:* Compact unavailable panel.
7. **Battery Distribution Histogram:**
   - *Status:* **Unavailable**
   - *Reason:* Missing underlying battery level data across the fleet.
   - *Presentation:* Compact unavailable panel.

---

## 6. Verification & Quality Assurance

### 6.1 Automated Test Execution

1. **Frontend Test Suite (`web/`):**
   ```bash
   npm test
   ```
   - **Result:** 45 passed, 0 failed (Phase 09: 17/17, Phase 02: 9/9, Phase 03: 19/19).
   - Invariants checked: exact 7 routes, absence of out-of-scope pages, distinct loading/ready/empty/unavailable states, honest provenance, no N+1 requests, no upstream token leaks.

2. **Frontend Linter (`web/`):**
   ```bash
   npm run lint
   ```
   - **Result:** 0 errors (2 pre-existing React Hook exhaustive-deps warnings in unrelated files `DeviceManagementPanel` and `UnityViewerRuntime`).

3. **Frontend Production Build (`web/`):**
   ```bash
   npm run build
   ```
   - **Result:** Compiled successfully in 2.9s; static pages generated for all 13 routes with zero errors.

4. **Backend Test Suite (`backend/`):**
   ```bash
   npm test
   ```
   - **Result:** 5 test suites passed, 82 tests passed, 0 failed.

### 6.2 Browser Visual Verification Evidence

Browser subagent verification was performed against live dev servers (`http://localhost:3000` & `http://localhost:4000`):
- **Overview at reference resolution (`1842 × 1222`):**
  - Artifact: `file:///Users/mac/.gemini/antigravity-ide/brain/8fd81d5f-a861-47e9-a6a4-4ccdfee4e5aa/iot_dashboard_overview_1790424161742.png`
  - Verified: Dual sidebar arrangement (High-level 64px + Dashboard 288px), "Hệ thống IoT · Tòa E" header, 6 KPI cards in 1 row, catalogue table with live accepted devices (56 count), Gateway card, and 3 bottom cards.
- **Device Selection & Telemetry Integration:**
  - Artifact: `file:///Users/mac/.gemini/antigravity-ide/brain/8fd81d5f-a861-47e9-a6a4-4ccdfee4e5aa/iot_device_telemetry_selected_aligned_1790424262472.png`
  - Verified: Clicking a device row (`dev-solar-001` or `70B3D57ED0073E9D`) smoothly opens the Telemetry panel with live sensor charts, updates the selected row's RSSI/SNR/Last seen values, and populates the Gateway LoRaWAN callout with the active gateway ID without N+1 polling.
- **Telemetry Metric Selection & Technical Details Disclosure:**
  - Artifact: `file:///Users/mac/.gemini/antigravity-ide/brain/8fd81d5f-a861-47e9-a6a4-4ccdfee4e5aa/iot_telemetry_details_full_1790424275379.png`
  - Verified: Raw unconfirmed fields and coverage footer correctly displayed inside accessible disclosure element.
- **Full Session Video:**
  - Artifact: `file:///Users/mac/.gemini/antigravity-ide/brain/8fd81d5f-a861-47e9-a6a4-4ccdfee4e5aa/iot_ui_alignment_1790424112618.webp`

---

## 7. Open Notes & Known Deliberate Divergences

1. **7 Frozen Routes vs. Mockup Sidebar:** The mockup visual shows additional categories ("MỞ RỘNG · MÔ PHỎNG", "Thang máy", "Bãi xe Phase 2", "PCCC Phase 3", etc.) and an alert badge counter ("5"). In accordance with Section 7.4 of `bp2_fix_align_UI.md` and user confirmation, the Dashboard Sidebar strictly renders only the 7 authorized and implemented routes without phantom links or fake badge numbers.
2. **Device State Presentation:** Upstream `is_active` remains labeled as "Hoạt động" (Active status) rather than converting to "Trực tuyến" (Online) or fabricating an "Offline" count.
3. **No Fabricated Telemetry:** All 5 mock metrics without upstream API backing are represented with standard `UnavailableDataState` instead of synthetic dummy values.

---

## 8. Conclusion

All tasks specified in `web/doc/bp2_fix_align_UI.md` have been fully executed, strictly meeting the architectural constraints and quality standards. The application is production-ready and fully regression-tested.
