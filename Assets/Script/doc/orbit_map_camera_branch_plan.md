# UIT Smart Campus — Orbit Map Camera Branch Plan

## 1. Decision summary

This plan defines an alternative camera-control branch for the UIT campus demo.

| Item | Decision |
| --- | --- |
| Control name | **Orbit Map Camera** |
| Git branch | `feature/orbit-map-camera` |
| Primary controller | `CampusOrbitCameraController` |
| View | Perspective, oblique aerial/three-quarter view |
| Navigation | Orbit, pan and dolly zoom around a focus target |
| Walking | Completely disabled on this branch |
| Validation target | Unity Editor Play Mode only |

The existing walking/WASD work remains available on its original branch. Changes in this plan must not be merged back into that branch unless explicitly requested.

Reference video:

- [Web GIS — The CesiumJS utilization in Smart Building](https://www.youtube.com/watch?v=0ZUGZabeN14)

---

## 2. What the demo video is showing

The 45-second demo does not use a first-person or character-follow camera.

Observed visual sequence:

1. The presentation starts from a global smart-city context.
2. The city/building model is shown from an external, elevated, downward-looking angle.
3. The view approaches a selected district/building while maintaining an oblique perspective.
4. Later views change heading and elevation around the buildings rather than walking through the streets.
5. Dashboard panels and building data remain independent overlays around the 3D viewport.

The perspective lines, depth foreshortening and changing building faces show that this is a **Perspective Camera**, not an orthographic/isometric camera.

The closest standard control model is:

> **Target-based Orbit Map Camera**: the camera rotates around a focus point, pans that focus point across the map, and changes its distance from the focus point to zoom.

It is not:

- A first-person controller.
- A free-fly/FPS camera.
- A character-follow third-person camera.
- A WASD/RTS translation controller.
- A fixed orthographic isometric view.

Some large camera changes in the video look like smooth focus/fly-to transitions triggered by the UI. `FocusOnBounds` is therefore an important extension seam, but it is not required for the first orbit-control spike.

---

## 3. Branch isolation procedure

The coding agent must perform branch work before changing scripts, prefabs or scene wiring.

### 3.1. Preflight

Run read-only checks:

```bash
git status --short
git branch --show-current
git rev-parse --short HEAD
```

Rules:

- Record the source branch and source commit in the handoff report.
- Do not create the new branch while unrelated uncommitted changes are present.
- Do not automatically stash, discard or reset user changes.
- If the worktree is dirty, stop and ask the user how the baseline should be preserved.

### 3.2. Create the branch

After the baseline is clean:

```bash
git switch -c feature/orbit-map-camera
git branch --show-current
```

The second command must report exactly:

```text
feature/orbit-map-camera
```

All implementation and scene changes below happen only after this verification.

### 3.3. Walking-controller isolation

On `feature/orbit-map-camera`:

- Do not create or enable `PlayerRig`, `CharacterController`, `PlayerMotor`, `PlayerLook` or `PlayerSpawnInitializer`.
- Do not wire `PlayerInputManager` or movement `InputSignals` into `_InitManager`.
- Remove any walking `PlayerRig` instance from `TestScene` if it already exists.
- Remove or disable the walking input component from the `_InitManager` instance/prefab if it already exists.
- Keep `StartPosition_GateA` as campus metadata; the orbit camera does not use it as its initial target.
- Runtime response to `WASD`, arrow keys and Shift must be zero.
- Do not lock or hide the cursor.

If movement-only scripts and prefabs already exist, runtime isolation is mandatory. Asset deletion is allowed only after the agent confirms they have no non-walking references. Put any deletion in a separate branch commit so it is easy to review or revert.

---

## 4. Current scene baseline to preserve

The normalized scene currently has this structure:

```text
TestScene
├── Directional Light
├── CampusRoot
│   ├── CampusVisualRoot
│   │   └── Map_Base
│   ├── GameplayAnchors
│   │   ├── StartPosition_GateA
│   │   └── ScaleReference_Player
│   └── CampusCollision
└── Main Camera
```

Required invariants:

- World gameplay coordinates are `Y-up`, with the campus ground on `XZ`.
- `CampusRoot`, `GameplayAnchors` and `CampusCollision` remain identity transforms.
- `CampusVisualRoot` owns the imported model's axis/scale correction and must not be reset or normalized again.
- `CampusVisualRoot` uses uniform scale.
- `Map_Base` remains a visual import child; do not edit generated GLB mesh/material children.
- `ScaleReference_Player` remains inactive during runtime validation.
- The existing `Main Camera` is temporary and will be replaced or disabled after the orbit rig is active.

Before implementation, record the actual transforms of:

- `CampusVisualRoot`.
- `CampusRoot`.
- `GameplayAnchors`.
- Existing `Main Camera`.

---

## 5. User-facing controls

Use the following desktop mouse mapping:

| Input | Behavior |
| --- | --- |
| Left mouse drag | Orbit around the current focus target |
| Right mouse drag | Pan the focus target parallel to campus ground |
| Middle mouse drag | Optional alias for pan |
| Mouse wheel | Dolly zoom by changing camera distance |
| `Home` | Reset to full-campus overview |
| Left click without dragging | Reserved for future building/IoT selection |

Explicitly unsupported on this branch:

- `WASD` movement.
- Arrow-key movement.
- Shift sprint.
- Jump, crouch or gravity.
- Cursor lock.
- First-person mouse look.
- Gamepad and touch controls.

### 5.1. Click-versus-drag threshold

Left mouse input must distinguish a click from an orbit drag:

- Store pointer-down position.
- Begin orbit only after displacement exceeds a serialized threshold, initially `5 px`.
- Releasing below the threshold is a click and must not move the camera.
- The spike does not need to implement building selection, but it must preserve this click path for the next phase.

### 5.2. UI input protection

- Do not begin a camera drag when pointer-down occurs over UI.
- A drag that started in the 3D viewport may continue until release even if the cursor crosses UI.
- Mouse wheel over a scrollable UI panel must not zoom the campus camera.
- If the Game view loses focus, clear every drag state and input delta.

---

## 6. Camera behavior specification

### 6.1. Perspective and initial composition

Use a standard perspective camera:

| Setting | Initial value |
| --- | ---: |
| Projection | `Perspective` |
| Vertical FOV | `50°` |
| Initial pitch/down-angle | `45°` |
| Initial yaw | `45°` candidate; tune to show Gate A and central buildings |
| Near clip | `0.1` initially; tune only if close geometry clips |
| Far clip | Large enough for full campus bounds, not an arbitrary extreme |
| Roll | Always `0°` |

Initial target and distance must be calculated from campus renderer bounds, not from `StartPosition_GateA` and not from hard-coded scene coordinates.

`FitCampusOverview()` must:

1. Get cached bounds from `CampusViewBounds`.
2. Use the bounds center as the initial orbit target.
3. Calculate a distance that fits the complete bounds with approximately `15%` framing margin.
4. Account for both vertical FOV and horizontal FOV derived from aspect ratio.
5. Store this pose as the reset/home pose.

### 6.2. Orbit

- Orbit changes yaw and pitch around the focus target.
- Yaw may wrap freely.
- Clamp pitch/down-angle to a serialized range, initially `20°–80°`.
- Never introduce camera roll.
- Orbit must not change target position or camera distance.
- Initial candidate sensitivity: approximately `0.2°` per input pixel, exposed in Inspector.

### 6.3. Pan

- Pan moves the focus target, not the camera independently.
- Pan is constrained to the campus `XZ` plane.
- Keep target `Y` fixed during ordinary pan.
- Use camera-right projected onto `XZ` and camera-forward projected onto `XZ` to derive pan axes.
- Scale pan speed by camera distance and FOV so movement feels consistent at near and far zoom levels.
- Clamp the target to campus `XZ` bounds plus a serialized margin, initially `10%` of bounds size.

A suitable screen-consistent starting relationship is:

```text
worldUnitsPerPixel ≈ 2 × distance × tan(verticalFov / 2) / viewportHeight
```

Use the relationship as a tuning guide; do not allocate or recompute renderer bounds every frame.

### 6.4. Dolly zoom

- Zoom changes orbit distance; do not animate camera FOV for normal zoom.
- Use multiplicative/exponential distance changes so zoom feels proportional at every scale.
- Clamp distance to bounds-relative minimum and maximum values.
- Initial candidates:
  - `minDistance = max(5, campusRadius × 0.05)`.
  - `maxDistance = campusRadius × 3`.
- Zoom must preserve the current focus target.
- The camera must not pass through the target or flip to the opposite side.

### 6.5. Smoothing

- Store target state separately from rendered state: focus point, yaw, pitch and distance.
- Apply damping in `LateUpdate` using `Time.unscaledDeltaTime`.
- Expose damping time in Inspector; start around `0.12–0.2 s`.
- Reset must move smoothly unless an explicit immediate-reset option is requested.
- Do not allocate collections or use LINQ in `Update`/`LateUpdate`.

### 6.6. Future focus/fly-to seam

Design but do not yet expose this API through UI:

```csharp
void FocusOnBounds(Bounds targetBounds);
void ResetOverview();
```

`FocusOnBounds` will later support clicking a building or IoT hotspot and smoothly reframing it, matching the large focus transitions seen in the reference demo.

---

## 7. Architecture

### 7.1. Runtime hierarchy

```text
_InitManager
└── OrbitCameraInputManager
        │
        └── publishes static OrbitCameraSignals
                              │
                              ▼
CampusOrbitRig
├── CampusOrbitCameraController
├── YawPivot
│   └── PitchPivot
│       └── Main Camera
└── serialized reference to CampusViewBounds

CampusRoot
└── CampusViewBounds
    └── serialized CampusVisualRoot
```

Transform responsibilities:

- `CampusOrbitRig`: current focus-target position.
- `YawPivot`: rotation only around world `Y`.
- `PitchPivot`: local pitch only around `X`.
- `Main Camera`: local position `(0, 0, -distance)` and local rotation `(0, 0, 0)`.

### 7.2. Component responsibilities

| Component | Single responsibility |
| --- | --- |
| `AppBootstrap` | Keep `_InitManager` persistent and guard duplicates |
| `OrbitCameraSignals` | Static input event contract and static reset |
| `OrbitCameraInputManager` | Read mouse/UI/focus state and publish orbit, pan, zoom and reset signals |
| `CampusViewBounds` | Calculate and cache renderer bounds from the serialized visual root |
| `CampusOrbitCameraController` | Maintain target pose, clamp it and apply the orbit rig in `LateUpdate` |

Do not add a `PlayerController`, `CharacterController`, Rigidbody or camera singleton.

### 7.3. Static signal contract

Minimum contract:

```csharp
event Action<Vector2> OrbitDelta;
event Action<Vector2> PanDelta;
event Action<float> ZoomDelta;
event Action ResetRequested;
```

Requirements:

- Only `OrbitCameraInputManager` publishes input signals.
- `CampusOrbitCameraController` subscribes in `OnEnable` and unsubscribes in `OnDisable`.
- Clear static delegates with `RuntimeInitializeOnLoadMethod(SubsystemRegistration)` for Editor runs with Domain Reload disabled.
- Serialized references or local `GetComponent`/`GetComponentInChildren` calls are allowed within the same prefab.
- Do not use `GameObject.Find`, `FindObjectOfType`, `FindFirstObjectByType`, `FindAnyObjectByType` or per-frame `Camera.main`.

### 7.4. Bounds calculation

`CampusViewBounds` receives `CampusVisualRoot` through a serialized reference.

- It may call `GetComponentsInChildren<Renderer>(true)` on that specific root during initialization or validation.
- Ignore inactive helper renderers outside `CampusVisualRoot` such as `ScaleReference_Player`.
- Cache the combined world-space bounds.
- Do not rescan renderers every frame.
- If no valid renderer is found, log a clear error and disable the orbit controller rather than using a silent zero bound.

---

## 8. Files and folders

All code and prefab rules from the project brief remain mandatory.

```text
Assets/
├── Script/
│   ├── Core/
│   │   ├── Bootstrap/
│   │   │   └── AppBootstrap.cs
│   │   └── Signals/
│   │       └── OrbitCameraSignals.cs
│   ├── Input/
│   │   └── OrbitCameraInputManager.cs
│   └── Camera/
│       ├── CampusViewBounds.cs
│       └── CampusOrbitCameraController.cs
└── Prefabs/
    ├── System/
    │   └── _InitManager.prefab
    └── Camera/
        └── CampusOrbitRig.prefab
```

Rules:

- Every `.cs` file must remain under `Assets/Script/`.
- Every new prefab must remain under `Assets/Prefabs/`.
- Do not use Addressables.
- This controller requires no runtime prefab loading, `Resources.Load` or `Resources.LoadAsync`.
- Do not install Cinemachine solely for this spike. The required target pan, bounds clamp and UI gating are small and explicit enough for a focused custom controller.
- Use the existing Input System package if installed; verify package and Active Input Handling before adding dependencies.
- A `.inputactions` asset is not required for this spike.

---

## 9. Prefab and scene wiring

### 9.1. `_InitManager.prefab`

```text
_InitManager
└── OrbitInput
    └── OrbitCameraInputManager
```

- Keep the existing `AppBootstrap`/duplicate guard if it has already been implemented.
- Remove the walking input child/component from this branch's prefab.
- Keep exactly one `_InitManager` instance in `TestScene`.

### 9.2. `CampusOrbitRig.prefab`

```text
CampusOrbitRig
└── YawPivot
    └── PitchPivot
        └── Main Camera
```

Components:

- Root: `CampusOrbitCameraController`.
- Camera: `Camera`, `AudioListener`, tag `MainCamera`.
- Assign all internal pivot/camera references inside the prefab.
- Leave the scene-only `CampusViewBounds` reference unassigned on the prefab asset.
- Assign `CampusRoot/CampusViewBounds` on the prefab instance inside `TestScene`.

### 9.3. Final scene hierarchy

```text
TestScene
├── Directional Light
├── CampusRoot
│   ├── CampusViewBounds
│   ├── CampusVisualRoot
│   │   └── Map_Base
│   ├── GameplayAnchors
│   │   ├── StartPosition_GateA
│   │   └── ScaleReference_Player    # inactive
│   └── CampusCollision
├── _InitManager
└── CampusOrbitRig
    └── YawPivot
        └── PitchPivot
            └── Main Camera
```

After wiring:

- Disable or remove the old root-level `Main Camera`.
- Ensure exactly one enabled Camera and one enabled AudioListener.
- Keep `StartPosition_GateA`; it is not referenced by the orbit controller.
- Keep `ScaleReference_Player` inactive.
- Do not move, rotate or scale `CampusVisualRoot` while tuning the camera.

---

## 10. Implementation phases

### Phase A — Branch and inspect

1. Verify clean worktree, source branch and source commit.
2. Create and verify `feature/orbit-map-camera`.
3. Confirm exact path of `TestScene`.
4. Record current campus root/visual transforms.
5. Confirm model remains `Y-up` and scale reference remains plausible.
6. Check Input System package and existing bootstrap/input code.
7. Record pre-existing Console errors before making changes.

### Phase B — Remove walking runtime from this branch

1. Remove/disable any `PlayerRig` scene instance.
2. Remove/disable walking input from `_InitManager`.
3. Ensure the old first-person camera is not the final active camera.
4. Preserve `StartPosition_GateA` as an unused anchor.
5. Confirm `WASD`, arrows and Shift have no runtime binding.

### Phase C — Code foundation

1. Implement `OrbitCameraSignals` with subsystem-registration reset.
2. Implement `OrbitCameraInputManager` including drag threshold, UI gating and focus reset.
3. Implement `CampusViewBounds` with one-time bounds caching.
4. Implement `CampusOrbitCameraController` with orbit, pan, zoom, smoothing and reset.
5. Compile and clear all new errors before creating prefabs.

### Phase D — Prefab and scene setup

1. Create/update `_InitManager.prefab` for orbit input only.
2. Create `CampusOrbitRig.prefab` with yaw/pitch hierarchy.
3. Add `CampusViewBounds` to `CampusRoot` and assign `CampusVisualRoot`.
4. Place prefab instances in `TestScene`.
5. Assign the scene bounds provider to the orbit rig instance.
6. Disable old camera and `ScaleReference_Player`.
7. Run `FitCampusOverview` and tune only exposed camera settings.
8. Save scene and prefab changes with `.meta` files.

### Phase E — Editor validation

1. Execute every manual test below in Editor Play Mode.
2. Check Console for exceptions and repeated warnings.
3. Use Profiler to confirm no meaningful per-frame GC allocation from the controller/input path.
4. Stop Play Mode and confirm scene transforms did not persist unintended runtime values.
5. Report the branch name, final hierarchy and tuning values.

---

## 11. Acceptance criteria

### Functional

- Scene starts directly from `TestScene`.
- Initial view frames the complete campus from an oblique perspective.
- Left drag orbits around a stable target.
- Right drag pans the target across ground `XZ`.
- Middle drag pans if the optional alias is implemented.
- Wheel zoom changes distance without changing FOV.
- Pitch is clamped and camera never flips or rolls.
- Pan and zoom remain within configured campus-relative bounds.
- `Home` smoothly restores the initial overview.
- Pointer interaction over UI does not move the camera.
- Losing focus clears drag/input state.
- Pressing `WASD`, arrow keys or Shift produces no camera movement.
- No player capsule/avatar appears in Game view.

### Architecture

- Runtime contains no active walking controller.
- Orbit input is published through static callbacks.
- Subscribers follow correct enable/disable lifecycle.
- Static signals reset correctly with Domain Reload disabled.
- No scene-wide object search is used.
- `CampusViewBounds` scans the serialized visual root only once, not per frame.
- All dependencies are private serialized references.
- Code and prefabs follow required project folders.
- No Addressables or Resources loading was added.
- No unnecessary Cinemachine dependency was added.

### Scene health

- `CampusVisualRoot` retains its normalized transform and uniform scale.
- `ScaleReference_Player` is inactive.
- Exactly one Camera and one AudioListener are enabled.
- Old first-person/player objects are absent or inactive on this branch.
- Reimporting the GLB does not destroy camera, anchors or bounds wiring.
- Console has no compile error, missing script or missing required scene reference.

---

## 12. Manual test checklist

| Test | Expected result |
| --- | --- |
| Start `TestScene` | Whole UIT campus is visible in perspective overview |
| Hold W/A/S/D | No camera or target translation |
| Drag left mouse horizontally | Camera orbits in yaw around campus target |
| Drag left mouse vertically | Pitch changes within clamp; no flip |
| Orbit full circle | Target remains stable and camera has no roll |
| Drag right mouse | Focus target pans parallel to ground |
| Pan near campus boundary | Target stops at configured margin |
| Scroll forward/back | Smooth proportional dolly zoom |
| Zoom to minimum | Camera does not cross the target or clip catastrophically |
| Zoom to maximum | Campus remains reachable and distance clamps |
| Press `Home` | Camera returns to full-campus overview |
| Click without dragging | Camera pose does not change |
| Drag fewer than threshold pixels | Treated as click, not orbit |
| Interact over UI | Campus camera does not orbit/pan/zoom |
| Alt-tab during drag | Drag is cancelled; no sticky motion on return |
| Inspect Game view | No capsule/avatar; scale reference is hidden |
| Inspect hierarchy | One active camera and AudioListener only |
| Exit Play Mode | No unintended runtime pose saved into scene |

---

## 13. Out of scope for this branch spike

- First-person or character movement.
- Indoor walking and floor/room navigation.
- Building selection implementation.
- IoT HUD and realtime API integration.
- Animated floor separation or building explode view.
- Camera collision with every building.
- Globe/geospatial streaming.
- Cesium integration.
- Cinematic Timeline sequences.
- Touch, mobile, gamepad or Web build validation.
- Loading Scene and Addressables.

---

## 14. Extension seams after the spike

The implementation should make these future additions possible without rewriting orbit math:

- Click a building and call `FocusOnBounds`.
- Smooth fly-to between campus overview, building, floor and room targets.
- Highlight selected buildings while camera motion continues.
- Save named viewpoints such as Overview, Gate A and Building E.
- Restore previous camera pose when closing a detail panel.
- Allow UI panels to request camera focus through static callbacks.
- Add touch gestures by publishing the same orbit/pan/zoom signals.

Do not implement these extensions during the initial branch spike.

---

## 15. Required handoff report

The coding agent must report:

1. Source branch and source commit.
2. Confirmation that final branch is `feature/orbit-map-camera`.
3. Files created, modified and conditionally deleted.
4. Exact scene path modified.
5. Final scene and prefab hierarchy.
6. Input System package/version and Active Input Handling.
7. Final FOV, yaw, pitch, distance, damping and clamp values.
8. How campus bounds and reset pose are calculated.
9. Evidence that `WASD`, arrows and Shift do nothing.
10. Evidence that the old player/camera runtime is absent on this branch.
11. Editor test, Console and Profiler results.
12. Known limitations and recommended next step.

