# Phase 06 — Implementation Handoff & Architecture Summary (Updated)

**Document ID:** GIS-UIT-PHASE-06-HANDOFF  
**Updated On:** 2026-09-21  
**Project:** GIS - UIT Building E Digital Twin  
**Title:** Phase 06 - Live IoT Device Inventory, Category Icons, and Screen-Space On-Floor Markers  
**Status:** IMPLEMENTED & DEPLOYED (Unity WebGL Rebuild via Menu Item)  
**Intended Repository Path:** `web/doc/phase_06_implementation_handoff.md`  

---

## 1. Executive Summary & Corrective Actions (Phase 06 Updating)

Following review of initial testing and visual design requirements from `web/doc/phase_06_updating.md`, the IoT presentation layer was overhauled:

1. **Direct On-Floor Display with Screen-Space UI Overlay:**
   - Markers are rendered in a dedicated **Unity Screen Space - Overlay Canvas** (`DeviceMarkerManager`), projected dynamically each frame from 3D floor anchors via `WorldToScreenPoint` and `RectTransformUtility`.
   - Markers remain circular, crisp, and constant-sized (~34px) during camera orbit, pan, and zoom, completely avoiding Z-fighting and floor/wall occlusion.
2. **Authored Presentation Layout (`TEST_LAYOUT_PREVIEW_V1`):**
   - Because upstream demo devices currently share coordinates `(0, 0, 0)`, single-cluster collapsing was replaced with an authoring layout:
   - 10 distinct, floor-appropriate display anchors for Building E Floor 4 and Floor 6 placed in corridors, offices, and lab areas.
   - Expected source tuple validation: if upstream ever supplies non-zero coordinates, it automatically falls back to source coordinates.
   - UI status badge: **“TEST — Vị trí minh họa”** with informative modal explanation.
3. **Clean Framing & Compact UI:**
   - **Drawer closed by default:** The device inventory drawer is closed upon opening the floor, providing maximum visibility for the 3D model.
   - **Compact status strip:** Top-left bar displaying device count (`● 10 thiết bị`), TEST badge, refresh button, and "Danh sách" toggle button.
   - **Single-device popup card:** Clicking any marker icon on the 3D floor displays a sleek card with device ID, category icon, source device type, and placement notes, without obstructing the floor view.
4. **Guaranteed Runtime Instantiation:**
   - `DeviceMarkerManager.EnsureInstance()` automatically binds to `FloorDetailContentHost` or the scene whenever inbound bridge messages arrive.
5. **Multi-Sensor Filters:**
   - Toggling sensors in `FloorFilterSidebar` directly updates marker visibility in Unity and active device counters.

---

## 2. Key Files & Components

### Unity C# Presentation Layer (`UnityContent/Assets/Script/`)
- `Devices/TestFloorLayoutConfig.cs`: Authored floor-local display anchors for Building E Floor 4 and Floor 6 with source tuple validation.
- `Devices/DeviceMarkerItem.cs`: Screen-space UI marker badge with category-colored circle, crisp glyph sprite from `Resources/Icons/`, selection ring highlight, and pointer click event.
- `Devices/DeviceMarkerManager.cs`: Manages Screen Space Overlay Canvas, ensures runtime instance, camera frustum/facing projection, sensor filtering, and bridge event emission.
- `Devices/DeviceMarkerPayloads.cs`: Extended payload DTOs for single-device click events (`DeviceMarkerClickedPayload`).
- `Bridge/WebViewerBridge.cs`: Inbound handlers use `EnsureInstance()`, dispatches `DeviceMarkerClicked` and `DeviceMarkerGroupClicked`.
- `Editor/WebGLAutoBuilder.cs`: Auto-deploy pipeline for WebGL builds.

### Web Frontend (`web/src/`)
- `components/devices/FloorIotDevicePanel.tsx`: Compact status strip, TEST policy info modal, single-device popup card, collapsible inventory drawer.
- `components/devices/FloorDetailDeviceSection.client.tsx`: Drawer closed by default, background data coordination, hides manual coordinate tab in normal mode.
- `components/unity/UnityViewerRuntime.client.tsx`: Bridge event listener for `DeviceMarkerClicked`.

---

## 3. How to Deploy the Unity WebGL Player

Because Unity Editor maintains local user session licensing on macOS, run the build directly from the Unity Editor GUI:

1. Open **Unity Editor** with project `UnityContent` (Unity version `6000.0.75f1`).
2. In the top menu bar, click:
   👉 **`GIS` -> `Build WebGL (Auto-Deploy to Web)`**
3. The build will compile all C# scripts and scenes, and automatically deploy the resulting WebGL files directly into:
   `web/public/unity/campus/Build/`
4. Refresh your browser at:
   👉 **`http://localhost:3000/viewer/buildings/E/floors/6`** (or `floors/4`)

---

## 4. Verification Checklist

| Item | Verification Method | Status |
|---|---|---|
| Backend Upstream Fetch | `GET /api/v1/buildings/E/floors/4/devices` | **PASSED (HTTP 200, 10 devices)** |
| Floor Policy Enforcement | `GET /api/v1/buildings/E/floors/5/devices` | **PASSED (HTTP 400)** |
| Web Test Suite | `node --test web/test-phase06.mjs` | **PASSED (4/4)** |
| Backend Unit Tests | `npm --prefix backend run test` | **PASSED (12/12)** |
| Frontend Production Build | `npm --prefix web run build` | **PASSED (0 errors)** |
| Frontend Dev Server | `http://localhost:3000` | **RUNNING** |
| Backend Dev Server | `http://127.0.0.1:3001` | **RUNNING** |
| PostgreSQL Database | `127.0.0.1:5432` | **HEALTHY** |
