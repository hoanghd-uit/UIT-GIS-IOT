# Phase 07 — Implementation Handoff & Architecture Summary

**Document ID:** GIS-UIT-PHASE-07-HANDOFF  
**Updated On:** 2026-09-22  
**Project:** GIS — UIT Building E Digital Twin  
**Title:** Phase 07 — Fetch dữ liệu thiết bị và popup IoT trên trang chi tiết tầng  
**Status:** IMPLEMENTED, TESTED & VERIFIED LIVE (v1.2.0)  
**Intended Repository Path:** `web/doc/phase_07_implementation_handoff.md`  

---

## 1. Executive Summary & Working-Tree State

Small Phase 07 establishes real-time on-demand telemetry fetching and interactive data presentation for IoT devices on the floor detail viewer (`Floor 4` and `Floor 6` of Building E).

- **Git Branch:** `mono-repo-refactor`
- **Working Tree Changes:**
  - **Unity Presentation Layer (`UnityContent/`):**
    - `Assets/Script/Devices/DeviceMarkerManager.cs` [MODIFY]:
      - Removed colocated cycling loop so clicking a marker always directly selects that specific marker's device ID.
      - Removed `EmitDeviceMarkerGroupClicked` call from single-marker click; emits ONLY `EmitDeviceMarkerClicked`.
  - **Backend (`backend/`):**
    - `src/iot/dto/iot-telemetry.dto.ts` [NEW]: Complete TypeScript definitions for upstream API payloads and normalized response DTOs.
    - `src/iot/services/iot-client.service.ts` [MODIFY]: Added methods for `devices/{dev_eui}`, `solar`, `avc`, `nfc` GET requests with server-side bearer token management.
    - `src/iot/services/iot-telemetry.service.ts` [NEW]: Query range validation, device-type resolution, upstream dispatch, telemetry normalization, and zero-persistence enforcement.
    - `src/iot/iot.service.ts` [MODIFY]: Integrated `IotTelemetryService` and RAM device-type warmup.
    - `src/iot/iot.module.ts` [MODIFY]: Registered and exported `IotTelemetryService`.
    - `src/devices/devices.service.ts` [MODIFY]: Added `getDeviceTelemetry`.
    - `src/devices/devices.controller.ts` [MODIFY]: Added endpoint `GET /api/v1/iot/devices/:deviceId/telemetry` with `@Header('Cache-Control', 'no-store')`.
    - `src/iot/tests/iot-telemetry.spec.ts` [NEW]: 11 comprehensive unit tests covering T01–T21 validation, routing, normalization, and zero DB writes.
  - **Frontend (`web/`):**
    - `src/types/toast.ts` [NEW]: Toast notification models (`ToastItem`, `ToastType`).
    - `src/context/IotToastContext.tsx` [NEW]: Global toast notification context with auto-dismiss timers, deduplication by request generation, and device-switch cleanup.
    - `src/components/common/IotToastContainer.tsx` [NEW]: Floating notification host at `top-20 right-4 z-50` with high-contrast theme, retry buttons, and close handlers.
    - `src/types/iot-telemetry.ts` [NEW]: Frontend data contracts for telemetry, coverage, and metric descriptors.
    - `src/lib/iot-api.ts` [MODIFY]: Added `fetchDeviceTelemetry` with `cache: 'no-store'`.
    - `src/hooks/useIotDeviceTelemetry.ts` [NEW]: Lifecycle management hook enforcing rolling 72-hour window, request generation tracking, AbortController cancellation, 25-second timeout watchdog, floating toast notification dispatch, and RAM-only state.
    - `src/components/devices/IotDeviceTelemetryChart.tsx` [NEW]: Zero-dependency pure SVG 72-hour time-series chart with interactive hover tooltips, unit axes, and gap handling.
    - `src/components/devices/IotDeviceDataPopup.tsx` [NEW]: Full interactive popup matching mockup page 3 of `EBuilding_UIT_BEIVN.pdf`, featuring neutral status badges, metric selectors, pending badges, and live refresh.
    - `src/components/devices/FloorIotDevicePanel.tsx` [MODIFY]: Provided fallback `FloorDeviceView` for immediate loading display; removed cluster filter banner per R09; always renders popup on selection.
    - `src/components/devices/FloorDetailDeviceSection.client.tsx` [MODIFY]: Auto-closes drawer on device selection; connects floor devices loading failure to floating toast notifications.
    - `src/components/unity/UnityViewerRuntime.client.tsx` [MODIFY]: Updated `handleDeviceMarkerClicked` to directly select device; updated `handleDeviceMarkerGroupClicked` to never nullify `selectedDeviceId`.
    - `src/app/viewer/layout.tsx` [MODIFY]: Mounted `IotToastProvider` and `IotToastContainer` stably at viewer shell level.
    - `test-phase07.mjs` [NEW]: 9 automated tests validating rolling window, request generation, unit mappings, coverage capping, toast error mapping, and cluster safety.

---

## 2. Root Cause Analysis: "No popup appeared on marker click"

1. **Unity Double-Emit & Group Override**:
   In `DeviceMarkerManager.cs`, `OnMarkerClicked` was emitting both `EmitDeviceMarkerClicked` and `EmitDeviceMarkerGroupClicked`.
2. **Immediate Selection Reset in Web Bridge**:
   In `UnityViewerRuntime.client.tsx`, `handleDeviceMarkerGroupClicked` called `setSelectedDeviceId(null)`. Because both events arrived in the same frame, the group handler immediately wiped out the device ID that was just selected by `handleDeviceMarkerClicked`.
3. **Colocated Cycling Mutating Device Identities**:
   `DeviceMarkerManager.cs` contained a colocated cycling loop that changed the clicked device to other overlapping devices on subsequent clicks.
4. **Drawer Gating**:
   `FloorIotDevicePanel.tsx` had `{selectedDevice && !isListOpen && (`, which suppressed the popup whenever the drawer was open.

### The Fix Applied:
- **Unity**: Removed colocated cycling and removed `EmitDeviceMarkerGroupClicked` from single-marker clicks.
- **Web Bridge**: `handleDeviceMarkerGroupClicked` now safely preserves `selectedDeviceId` instead of setting it to `null`.
- **Panel & Drawer**: `FloorDetailDeviceSection` automatically closes the drawer when a device is selected; `FloorIotDevicePanel` provides a fallback `FloorDeviceView` so the popup opens immediately into a loading state without waiting for catalogue lookup.
- **Floating Toast System**: Implemented `IotToastContainer` and `IotToastContext` to display floating notifications on empty data (200 with 0 records) and upstream API/network/timeout errors.

---

## 3. API Contract & Endpoint Mapping

| Device Type | Upstream Method & Path | Query Parameters | Hero Metric / Event | Secondary Selectors | Status Mapping |
|---|---|---|---|---|---|
| `solar` | `GET /api/v1/solar` | `dev_eui`, `start`, `stop`, `limit=1000` | `current_uA` (µA) — "Dòng điện mới nhất (72h)" | `lux` (lx) | `state` numeric with label "Mã trạng thái: N (chưa xác nhận)", neutral color |
| `avc` (Water Meter) | `GET /api/v1/avc` | `dev_eui`, `start`, `stop`, `limit=1000` | `instant_flow_m3h` (m³/h) with badge `⚠️ Chờ xác nhận phần cứng` | `temp_c` (°C), `fwd_volume_m3` (m³)*, `rev_volume_m3` (m³)* | "Chưa xác nhận mã cảnh báo" + expandable raw flags (valve, leak, burst, battery, etc.) |
| `nfc` (Door Reader) | `GET /api/v1/nfc` | `dev_eui`, `start`, `stop`, `limit=1000` | Latest scan event: direction (`in` -> Vào / `out` -> Ra), `detected_card_id`, timestamp | In/Out counters (`N vào • M ra`) | "Chưa có dữ liệu trạng thái" (no fake health) |

---

## 4. Request Lifecycle & Anti-Stale Guarantees

1. **Selection & Re-Selection**:
   - Selecting device `A` opens the popup and issues a fresh query spanning `[now - 72h, now]` with `limit=1000`.
   - Re-clicking device `A` or clicking the **Làm mới** button recalculates `now` and performs an immediate fresh fetch.
   - Switching from device `A` to device `B` increments the request generation counter, aborts in-flight requests for `A`, dismisses toasts belonging to `A`, and immediately clears `A`'s data from memory so no stale metrics leak into `B`.
2. **Race Condition Prevention**:
   - Every fetch request is associated with a strictly monotonic request generation number (`generationRef`).
   - Responses arriving out of order (e.g. `A` responding after `B` was already selected) are discarded immediately without altering state.
3. **Floating Notification System**:
   - Empty data (`returnedCount === 0` or `validCount === 0`) produces a warning toast: `"Không có dữ liệu của thiết bị [ID] trong 72 giờ gần nhất."` (auto-dismiss 8s).
   - API / Network / Timeout errors produce an error toast with a Retry button and Close button.
   - Deduplicated per request generation; active switch cancels prior toasts.
4. **No Database Persistence**:
   - Telemetry responses are never written to PostgreSQL tables, files, or local/session storage. All state resides in React component memory and is cleanly garbage collected upon unmounting or floor navigation.

---

## 5. Verification Matrix (T01 – T32)

| Test ID | Scenario | Result | Notes |
|---|---|---|---|
| **T01** | Device dispatch for `solar`, `avc`, `nfc` | **PASS** | Successfully verified via unit tests and live API calls |
| **T02** | 72-hour rolling window and ISO range | **PASS** | Validated in `iot-telemetry.spec.ts` and `test-phase07.mjs` |
| **T03** | Fresh fetch on re-selection and refresh | **PASS** | Recalculates range and issues fresh request with new generation |
| **T04** | Stale response suppression (A -> B -> A) | **PASS** | Verified in `test-phase07.mjs` |
| **T05** | Cleanup on close / floor change | **PASS** | Verified via AbortController and component unmount lifecycle |
| **T06** | Row identity matching `dev_eui` | **PASS** | Mismatched EUIs are counted as invalid and discarded |
| **T07** | Preservation of 0, null, and empty arrays | **PASS** | 0 is preserved as a valid measurement; nulls remain null |
| **T08** | Newest-first sorting and latest timestamp | **PASS** | Sorted by timestamp descending; latest valid sample selected |
| **T09** | 1,000 limit coverage warning banner | **PASS** | Flags `reachedLimit` and shows warning banner |
| **T10** | Neutral status indicators without fake green | **PASS** | Displays "Chưa xác nhận" or "Chưa có dữ liệu trạng thái" |
| **T11** | Unknown type handling | **PASS** | Safe message returned without guessing endpoints |
| **T12** | Refresh failure retains previous data with label | **PASS** | Handles refresh errors gracefully without wiping current view |
| **T13** | Pointer event isolation (`stopPropagation`) | **PASS** | Clicks/scrolls inside popup do not trigger OrbitControls |
| **T14** | Zero database persistence | **PASS** | Verified via code audit; no TypeORM calls in telemetry flow |
| **T15** | Opaque device ID support | **PASS** | Handles hex and `dummy...` strings uniformly |
| **T16** | Server-side type authority | **PASS** | Upstream detail API resolves type if unknown |
| **T17** | Query parameter range validation | **PASS** | Rejects invalid dates and start >= stop with 400 |
| **T18** | Numeric preservation of unconfirmed fields | **PASS** | Flags and pending metrics kept as numbers |
| **T19** | AVC metric switching with pending badges | **PASS** | Badges persistently displayed on flow and volume metrics |
| **T20** | NFC direction mapping and batch ID isolation | **PASS** | `in` -> Vào, `out` -> Ra; batch_id kept strictly technical |
| **T21** | Security: Master token server-side only | **PASS** | Token never exposed in client bundles or network responses |
| **T22** | Overlap cycling removal | **PASS** | Clicking marker selects it directly without cycling or mutating glyph |
| **T23** | Single-event emission in Unity | **PASS** | Only `DeviceMarkerClicked` emitted; `DeviceMarkerGroupClicked` eliminated |
| **T24** | Cluster click safety | **PASS** | Web bridge never resets `selectedDeviceId` to `null` on group events |
| **T25** | Fallback device view | **PASS** | `selectedDevice` synthesized if catalogue is not yet loaded |
| **T26** | Floating toast for empty data | **PASS** | Shows `"Không có dữ liệu của thiết bị [ID] trong 72 giờ gần nhất."` |
| **T27** | Floating toast for 400 bad query | **PASS** | Shows `"Không thể tải dữ liệu thiết bị [ID]. Yêu cầu truy vấn chưa hợp lệ."` |
| **T28** | Floating toast for 401/403 unauthorized | **PASS** | Shows `"Chưa thể truy cập dữ liệu thiết bị [ID]. Vui lòng thử lại sau."` |
| **T29** | Floating toast for 404 device not found | **PASS** | Shows `"Không tìm thấy thiết bị [ID] trên hệ thống dữ liệu."` |
| **T30** | Floating toast for 5xx / dependency error | **PASS** | Shows `"Dịch vụ IoT đang gặp lỗi. Chưa tải được dữ liệu thiết bị [ID]."` |
| **T31** | Floating toast for network connection error | **PASS** | Shows `"Không kết nối được dịch vụ dữ liệu cho thiết bị [ID]."` |
| **T32** | 25s client watchdog timeout toast | **PASS** | Shows `"Quá thời gian tải dữ liệu thiết bị [ID]. Vui lòng thử lại."` with Retry button |

---

## 6. How to Run & Verify

1. **Start PostgreSQL**:
   ```bash
   docker compose --env-file .env.phase04.local -f compose.phase04.yml up -d --wait postgres
   ```
2. **Start Backend Server**:
   ```bash
   npm --prefix backend run start:prod
   ```
   *Runs on `http://127.0.0.1:3001`.*
3. **Start Web Frontend**:
   ```bash
   npm --prefix web run dev
   ```
   *Runs on `http://localhost:3000`.*
4. **Run Automated Test Suites**:
   ```bash
   npm --prefix backend run test
   node --test web/test-phase07.mjs
   ```
5. **Open Browser**:
   Navigate to `http://localhost:3000/viewer/buildings/E/floors/4` (or `floors/6`). Click any device icon to inspect the live telemetry popup and floating toast notification behavior.
