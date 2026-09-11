# Phase 02 Implementation Achievement Summary and Handoff

## 1. Purpose

This document summarizes what was actually implemented from:

```text
web/doc/phase_02_campus_floor_detail_navigation_plan.md
```

It is a factual handoff snapshot, not a declaration that every Phase 02 acceptance item passed.

Snapshot basis:

```text
Commit:  06439eb6ff4e076c9bf1a02e5a8c35623737b70c
Subject: Implement navigate to floor detail feature
Date:    2026-09-10T16:55:59+07:00
```

The implementation spans both `UnityContent/` and `web/` and retains one Unity WebGL runtime and one canvas.

## 2. Executive status

Phase 2 is **source-implemented but not fully accepted**.

Implemented achievements:

- typed web route and bridge contracts;
- Campus `HoverableFloor` click forwarding to a WebGL bridge;
- React navigation to canonical floor-detail URLs;
- persistent route-to-Unity synchronization through `_InitManager.ApplyViewerRoute`;
- asynchronous Campus/FloorDetail scene switching logic;
- strict route validation and Unity acknowledgement parsing;
- one persistent web Unity runtime and canvas;
- Building E floor navigation panel and route-derived header state;
- Campus and FloorDetail serialized in the Unity Scene List;
- shared persistent `_InitManager` plus scene-local orbit-camera rigs;
- versioned WebGL files and matching Next.js Brotli header paths committed under `web/public/`.

Not yet proven or not passing:

- `npm --prefix web run lint` currently fails with one React hooks error;
- Unity compilation and EditMode/PlayMode test results were not recorded in this handoff audit;
- browser/WebGL click, scene-switch, Back/Forward, hard-refresh, console, and network behavior were not executed in this audit;
- the committed WebGL artifact was inspected only statically and is not accepted as runtime proof;
- the duplicate `_InitManager` protection in the new bridge/controller does not currently check the local bootstrap instance correctly.

## 3. Phase 02 checkpoint status

| Checkpoint | Status | Achievement/evidence |
| --- | --- | --- |
| 0 — Preflight and Phase 01 baseline | Partial | Repository structure and versions are known. No new browser regression baseline was recorded. |
| 1 — Shared web navigation contract | Implemented | Typed building/floor catalog, canonical routes, route parser, bridge payload parsers, and validation exist. |
| 2 — Emit `FloorClicked` from Unity WebGL | Source implemented | `WebViewerBridge` subscribes to `FloorHoverSignals.FloorClicked`; `.jslib` dispatches through `window.dispatchReactUnityEvent`. Runtime browser delivery is unverified here. |
| 3 — Persistent Unity scene flow controller | Source implemented | `_InitManager` owns `ViewerSceneFlowController` with public `ApplyViewerRoute(string)`, validation, async scene loading, latest-pending-route handling, acknowledgements, and errors. |
| 4 — Export and serve combined build | Artifact present, runtime unverified | `UIT-GIS-0910_1` Brotli artifacts and matching web configuration are committed. Static strings include the new bridge/controller contract and `FloorDetail`; no runtime scene-load result is claimed. |
| 5 — Persistent Unity runtime across routes | Implemented | `/viewer/layout.tsx` owns one `UnityViewerRuntime`, one synchronizer, and one `UnityViewerCanvas`. |
| 6 — Click-to-route-to-scene connection | Source implemented, E2E unverified | Both directions of the bridge are wired in source. End-to-end WebGL behavior is not recorded as passed. |
| 7 — FloorDetail floor menu | Implemented with catalog deviation | The panel, dynamic route, active state, pointer behavior, and route-derived header exist. Current catalog includes `G` in addition to floors `1`–`12`. |
| 8 — Hard refresh, invalid input, race handling | Partial | Invalid payload/route validation, latest-pending-route behavior, and stale acknowledgement rejection exist. Browser race/history behavior and failed-send recovery are unverified. |
| 9 — Final validation | Incomplete | Next production build passes; lint fails; Unity and browser acceptance evidence is absent. |

## 4. Implemented Unity architecture

### 4.1. Floor click bridge

Files:

```text
UnityContent/Assets/Script/Bridge/WebViewerBridge.cs
UnityContent/Assets/Plugins/WebGL/ViewerBridge.jslib
```

`WebViewerBridge`:

- is a `MonoBehaviour` attached directly to `_InitManager`;
- subscribes/unsubscribes to `FloorHoverSignals.FloorClicked`;
- validates Building `E` and floor IDs `G`, `1` through `12`;
- serializes a versioned JSON payload with `JsonUtility`;
- dispatches `FloorClicked` through a guarded WebGL `DllImport`;
- logs an Editor/non-WebGL fallback instead of invoking browser interop;
- also emits `ViewerStateChanged` and `ViewerError` for the scene controller.

JavaScript export:

```text
DispatchViewerEvent(eventNamePtr, payloadJsonPtr)
```

Browser dispatch:

```javascript
window.dispatchReactUnityEvent(eventName, payloadJson)
```

`HoverableFloor` remains browser-agnostic. Its existing `OnFloorClick` continues to publish the internal static signal.

### 4.2. Persistent scene controller

File:

```text
UnityContent/Assets/Script/Navigation/ViewerSceneFlowController.cs
```

Component location:

```text
_InitManager                    AppBootstrap
                                WebViewerBridge
                                ViewerSceneFlowController
└── OrbitInput                  OrbitCameraInputManager
```

Public web entrypoint:

```csharp
public void ApplyViewerRoute(string payloadJson)
```

Implemented controller behavior:

- validates schema version and supported view;
- validates Building `E` and the shared floor catalog;
- maps `campus` to `Campus`;
- maps `floor-detail` to `FloorDetail`;
- checks `Application.CanStreamedLevelBeLoaded`;
- uses `SceneManager.LoadSceneAsync(..., LoadSceneMode.Single)`;
- avoids a reload when the target scene is already active;
- updates/acknowledges floor-only changes without reloading FloorDetail;
- stores the newest pending route while a scene load is in progress;
- emits Campus or FloorDetail acknowledgements after the load;
- emits structured errors for empty, malformed, unsupported, invalid, missing-scene, and failed-load cases.

### 4.3. Persistent manager and scene-local cameras

`AppBootstrap` now exposes its current singleton instance and `IsPrimary` state. It remains the only component calling `DontDestroyOnLoad`.

The selected lifecycle remains Option 2:

- `_InitManager` persists across scene transitions;
- Campus owns one scene-local `CampusOrbitRig`;
- FloorDetail owns one scene-local `CampusOrbitRig`;
- loading in `Single` mode removes the outgoing rig and loads the destination rig with destination-scene bounds;
- FloorDetail retains an `_InitManager` prefab instance for direct Editor startup; the persistent Campus instance is intended to destroy that duplicate during a route transition.

### 4.4. Unity Scene List

The serialized global list is now:

```text
0  Assets/Scene/Campus.unity       enabled
1  Assets/Scene/FloorDetail.unity  enabled
```

The active Web build profile has `m_OverrideGlobalSceneList: 0`, so it inherits this list.

### 4.5. Unity source tests added

File:

```text
UnityContent/Assets/Script/Tests/EditMode/ViewerNavigationTests.cs
```

Covered in source:

- valid and invalid floor IDs;
- Campus route JSON deserialization;
- FloorDetail route JSON deserialization;
- malformed JSON not producing a valid request.

These tests do not cover actual scene transitions, persistent-manager teardown, `.jslib` linkage, or browser event delivery. No execution result is asserted in this handoff.

## 5. Implemented web architecture

### 5.1. Canonical routes and catalog

Routes:

```text
/viewer/campus
/viewer/buildings/E/floors/:floorId
```

Current supported floor IDs:

```text
12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, G
```

Files:

```text
web/src/types/viewer.ts
web/src/config/buildings.ts
web/src/lib/viewer-routes.ts
web/src/lib/unity-bridge.ts
```

The parsers reject unsupported schema versions, buildings, floors, views, and scene names. FloorDetail acknowledgements require both `buildingId` and `floorId`.

### 5.2. One runtime and one canvas

Files:

```text
web/src/app/viewer/layout.tsx
web/src/components/unity/UnityViewerRuntime.client.tsx
web/src/components/unity/UnityViewerCanvas.client.tsx
web/src/components/unity/UnityRouteSynchronizer.client.tsx
```

Implemented ownership:

- `UnityViewerRuntime` owns the only active `useUnityContext` used by viewer routes;
- `UnityViewerCanvas` renders the shared `<Unity>` component;
- the `/viewer` layout remains mounted while route children change;
- `UnityRouteSynchronizer` is the route-to-Unity writer;
- Unity event listeners are registered and removed with stable callbacks.

### 5.3. Unity-to-web navigation

On `FloorClicked`:

1. Parse unknown input.
2. Validate version, Building E, and floor ID.
3. Construct the canonical route.
4. Ignore navigation to the already-active route.
5. Call `router.push(targetRoute, { scroll: false })`.

### 5.4. Web-to-Unity synchronization

After Unity reports loaded, the synchronizer sends:

```typescript
sendMessage("_InitManager", "ApplyViewerRoute", payloadJson)
```

The runtime validates `ViewerStateChanged` against the current pathname and selection before setting `campus-ready` or `floor-ready`. Stale acknowledgements are ignored.

### 5.5. FloorDetail route UI

Files:

```text
web/src/app/viewer/buildings/[buildingId]/floors/[floorId]/page.tsx
web/src/components/floor/FloorNavigationPanel.tsx
web/src/components/layout/ViewerShell.tsx
```

Implemented behavior:

- validates dynamic route parameters;
- redirects invalid routes to `/viewer/campus`;
- renders the right-side floor navigation panel without another Unity canvas;
- lists current catalog entries in descending order with `G` last;
- highlights the active floor;
- uses route links with prefetch disabled;
- preserves pointer input outside the panel;
- updates the viewer header and breadcrumb from the current route.

## 6. Bridge contract implemented

Unity to web — `FloorClicked`:

```json
{
  "schemaVersion": 1,
  "buildingId": "E",
  "floorId": "7"
}
```

Web to Unity — `ApplyViewerRoute`:

```json
{
  "schemaVersion": 1,
  "view": "floor-detail",
  "buildingId": "E",
  "floorId": "7"
}
```

Unity to web — `ViewerStateChanged`:

```json
{
  "schemaVersion": 1,
  "view": "floor-detail",
  "sceneName": "FloorDetail",
  "buildingId": "E",
  "floorId": "7"
}
```

Unity to web — `ViewerError`:

```json
{
  "schemaVersion": 1,
  "code": "SCENE_LOAD_FAILED",
  "message": "Failed to start asynchronous load for 'FloorDetail'"
}
```

## 7. Build and configuration snapshot

Versions:

```text
Unity:              6000.0.75f1
Next.js:            16.3.4
React:              19.2.8
react-unity-webgl:  ^10.2.0
TypeScript:         ^5
```

Configured WebGL files:

```text
web/public/unity/campus/Build/UIT-GIS-0910_1.loader.js
web/public/unity/campus/Build/UIT-GIS-0910_1.data.br
web/public/unity/campus/Build/UIT-GIS-0910_1.framework.js.br
web/public/unity/campus/Build/UIT-GIS-0910_1.wasm.br
```

`web/src/config/unity-build.ts` points to these exact files. `web/next.config.ts` assigns Brotli content encoding and the expected content type to data, framework, and wasm.

Static artifact inspection found the new bridge/controller event and method names and `FloorDetail` strings in the committed data file. This confirms new code metadata is present but does not prove that a browser can load and activate FloorDetail.

## 8. Validation results from this handoff audit

### Web lint

Command:

```powershell
npm --prefix web run lint
```

Result: **failed** with one error.

```text
web/src/components/unity/UnityViewerRuntime.client.tsx:75
react-hooks/set-state-in-effect
setErrorMessage(null) is called synchronously inside the pathname/router effect.
```

This prevents the Phase 02 lint acceptance item from being marked complete.

### Web production build

Command:

```powershell
npm --prefix web run build
```

Result: **passed**.

Observed routes:

```text
/
/_not-found
/viewer/campus
/viewer/buildings/[buildingId]/floors/[floorId]
```

### Unity and browser

Not run in this audit:

- Unity script compilation;
- Unity EditMode tests;
- Unity Editor PlayMode scene switching;
- WebGL bridge linkage;
- browser click-to-route behavior;
- browser route-to-scene behavior;
- hard refresh, Back/Forward, rapid selection, console, network, MIME, or compression acceptance.

These remain unverified and must not be reported as passed.

## 9. Known issues and deviations

### 9.1. Web lint failure

`UnityViewerRuntime.client.tsx` clears error state synchronously inside an effect. Move that state transition to the route command/action path or otherwise satisfy the installed React hooks rule without disabling the rule.

### 9.2. Duplicate-manager guard checks the wrong instance

Both `WebViewerBridge` and `ViewerSceneFlowController` currently use:

```csharp
if (AppBootstrap.Instance != null && !AppBootstrap.Instance.IsPrimary)
```

`AppBootstrap.Instance` points to the primary bootstrap, so `AppBootstrap.Instance.IsPrimary` is true by definition. This does not identify a component attached to the transient duplicate `_InitManager`.

The guard should inspect the local root bootstrap, for example through `GetComponent<AppBootstrap>()`, and suppress duplicate bridge/controller behavior before the duplicate GameObject is destroyed. Until corrected and checked in Editor, duplicate signal subscription or command handling remains a lifecycle risk.

### 9.3. Route dispatch has no acknowledgement-based retry

`UnityRouteSynchronizer` records `lastSentPayloadRef` before `sendMessage` is acknowledged. If the receiver is temporarily unavailable, the same route is not resent. This is a resilience gap rather than proof of a current failure.

### 9.4. Floor catalog differs from the original Phase 02 wording

The original Phase 02 plan specifies floors `1` through `12`. Current Unity metadata and web source also support `G`. The current implementation is internally aligned, but the product owner should treat `G` as an explicit accepted deviation or remove it from both modules later.

### 9.5. Generated artifact runtime status is unknown

The committed `UIT-GIS-0910_1` artifact is larger than the previous Campus-only artifact and contains the new navigation symbols. No browser/runtime evidence is available in this handoff, so combined-scene operation remains unverified.

### 9.6. No real floor-specific 3D content was implemented

Every supported floor route intentionally targets the same `FloorDetail` scene/proof content. Model, sensor, room, and IoT data loading remain deferred.

## 10. Handoff priorities

Before marking Phase 02 complete:

1. Fix the current web lint error without suppressing the rule.
2. Correct the local duplicate `_InitManager` guard in the Unity bridge/controller.
3. Record Unity compile and existing EditMode test results.
4. Confirm the effective Web build Scene List remains Campus first and FloorDetail second.
5. Treat WebGL/browser acceptance as pending until separately executed and recorded against the intended build.
6. Resolve whether floor `G` is an accepted product requirement.

Do not redesign the viewer, introduce a second WebGL runtime, or implement real floor data while closing these items.

## 11. Repository handoff notes

The implementation commit changes Unity scenes, source, prefabs, tests, WebGL artifacts, and web application source in one large commit. Use the commit hash in Section 1 when reviewing its exact diff.

At the start of this audit, the only pre-existing working-tree change reported by Git was:

```text
UnityContent/UserSettings/Layouts/default-6000.dwlt
```

Treat that layout file as user-owned and unrelated. This handoff document is the only file intentionally added by this audit.

