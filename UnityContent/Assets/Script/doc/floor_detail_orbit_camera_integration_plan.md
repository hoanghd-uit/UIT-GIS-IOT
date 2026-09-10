# FloorDetail Orbit Camera Prefab Integration Plan

## 1. Objective

Reuse the implemented Orbit Map Camera system from `Assets/Scene/Campus.unity` in `Assets/Scene/FloorDetail.unity`.

The implementation Agent must:

1. Implement the selected lifecycle architecture in Section 2.1: one shared rig prefab asset with one scene-local instance per camera scene.
2. Give `FloorDetail.unity` a scene-owned renderer-bounds source.
3. Instantiate and wire the existing orbit rig and input/bootstrap prefabs.
4. Replace the incompatible legacy UI input module in `FloorDetail`.
5. Remove the old standalone camera only after the orbit rig is fully wired.
6. Harden focus-loss handling so a held mouse button cannot restart a stale drag.
7. Validate direct FloorDetail startup and preserve Campus behavior.

This document is the implementation contract. The planning pass did not modify either scene or any runtime camera code.

---

## 2. Inspection conclusion

The Orbit Camera is already isolated into reusable prefab assets. No additional extraction prefab is required.

| Responsibility | Existing asset | Status |
| --- | --- | --- |
| Persistent bootstrap and input polling | `Assets/Prefabs/System/_InitManager.prefab` | Reuse |
| Scene-local orbit rig and camera | `Assets/Prefabs/Camera/CampusOrbitRig.prefab` | Reuse |
| Input event contract | `Assets/Script/Core/Signals/OrbitCameraSignals.cs` | Reuse |
| Scene renderer bounds | `CampusViewBounds` component | Add and configure in `FloorDetail` |

### 2.1. Selected option — option 2

**Selected: option 2. Keep `CampusOrbitRig` separate and put exactly one instance of the same shared prefab in each scene that uses orbit controls.**

This means one prefab asset, not a new prefab asset for every scene:

```text
Assets/Prefabs/Camera/CampusOrbitRig.prefab
├── instance in Campus.unity       -> Campus scene bounds
└── instance in FloorDetail.unity  -> FloorDetail scene bounds
```

The lifetime boundary is explicit:

| Object | Lifetime | Ownership |
| --- | --- | --- |
| `_InitManager` + `OrbitCameraInputManager` | Persistent through `DontDestroyOnLoad` | Global input publisher |
| `CampusOrbitRig` instance | Destroyed and recreated with its owning scene | Scene camera consumer |
| `CampusViewBounds` | Destroyed and recreated with its owning scene | Scene geometry dependency |

For a single-scene transition from Campus to FloorDetail:

1. The Campus rig and Campus bounds are destroyed with `Campus.unity`.
2. The original `_InitManager` survives and continues publishing `OrbitCameraSignals`.
3. FloorDetail loads its own rig instance and FloorDetail bounds reference.
4. FloorDetail's duplicate `_InitManager` instance destroys itself through `AppBootstrap`, leaving one input publisher.

Option 1 is rejected if it means moving or persisting the camera rig with `_InitManager`. The rig holds a serialized reference to a scene-owned `CampusViewBounds`; after unloading that scene, a persistent rig would hold a destroyed reference. Its `Start()` method would not rerun to bind, reframe or recompute zoom limits for the destination. Campus pose/tuning could leak into FloorDetail, and a destination rig could create duplicate Cameras, AudioListeners and static-signal subscribers. If the rig were a child of `_InitManager`, FloorDetail's duplicate manager would destroy its correctly bound child rig while preserving the stale source rig.

`OrbitCameraSignals` broadcasts without scene routing, so every enabled controller reacts. The required lifecycle assumes normal single-scene replacement. If scenes overlap through additive loading, the transition owner must keep exactly one scene-local rig enabled at a time; designing that additive activation gate is outside this integration unless the application already uses additive scene loading.

`_InitManager` may and should move between scenes. `CampusOrbitRig` must not move with it.

The complete system intentionally uses two prefabs rather than one all-in-one manager:

```text
_InitManager.prefab                       # persistent across scene loads
└── OrbitInput
    └── OrbitCameraInputManager
             │
             └── OrbitCameraSignals
                         │
                         ▼
CampusOrbitRig.prefab                     # scene-local
├── CampusOrbitCameraController
├── YawPivot
│   └── PitchPivot
│       └── Main Camera
└── scene reference -> CampusViewBounds   # assigned on each scene instance
```

Do not put `CampusOrbitRig` under `_InitManager`. `AppBootstrap` applies `DontDestroyOnLoad` to `_InitManager`; persisting the camera rig would retain a reference to the destroyed source scene's bounds and would risk duplicate cameras in the destination scene.

---

## 3. Confirmed runtime behavior

`OrbitCameraInputManager` uses Unity's Input System directly and publishes static signals:

| Input | Implemented behavior |
| --- | --- |
| Left mouse drag | Orbit after movement reaches the `5 px` drag threshold |
| Right mouse drag | Pan after the same drag threshold |
| Middle mouse drag | Pan alias |
| Mouse wheel | Multiplicative dolly zoom |
| `Home` | Reset to the cached overview pose |
| Click below threshold | No camera movement; click path remains available |

Other behavior already implemented:

- Pointer-down over UI blocks starting orbit or pan.
- Wheel input over UI is ignored.
- The input manager clears its drag flags when focus is lost or the component is disabled, but it does not yet suppress a still-held mouse button after focus returns. Section 12 makes that small shared-input fix explicit.
- The cursor remains unlocked and visible.
- No `WASD`, arrow-key, Shift, jump or character-movement input is published.
- `CampusOrbitCameraController` subscribes in `OnEnable` and unsubscribes in `OnDisable`.
- Target and rendered focus/yaw/pitch/distance states are separate and smoothed in `LateUpdate` with unscaled time.
- Pan is constrained to world `XZ`; target `Y` is kept at the bounds center.
- `CampusViewBounds` scans all child `Renderer` components, including inactive children, beneath one serialized visual root and caches their combined world-space bounds.
- The controller disables itself with an error if its bounds reference is missing or invalid.

Confirmed project dependencies:

| Dependency | Current value |
| --- | --- |
| Unity Editor | `6000.0.75f1` |
| Input System | `1.19.0` |
| Universal RP | `17.0.4` |
| uGUI | `2.0.0` |
| Active Input Handling | Input System Package (New), serialized value `1` |

Do not install Cinemachine or another input/camera package for this integration.

---

## 4. Existing prefab contract

### 4.1. `_InitManager.prefab`

Path and GUID:

```text
Assets/Prefabs/System/_InitManager.prefab
06c10baf8aaa64d109ec1bfb866cf7d7
```

Expected hierarchy:

```text
_InitManager
├── AppBootstrap
└── OrbitInput
    └── OrbitCameraInputManager
```

`AppBootstrap` preserves this object across scene loads and destroys duplicate instances. `FloorDetail` must still contain its own prefab instance so that opening and playing that scene directly has an input producer. When entering from Campus, the duplicate guard must leave exactly one persistent manager.

### 4.2. `CampusOrbitRig.prefab`

Path and GUID:

```text
Assets/Prefabs/Camera/CampusOrbitRig.prefab
844a91d4142644e98a91e98713786645
```

Expected hierarchy:

```text
CampusOrbitRig                         # CampusOrbitCameraController
└── YawPivot
    └── PitchPivot
        └── Main Camera               # Camera + URP camera data + AudioListener
```

Required prefab invariants:

- Root, pivots and camera have valid internal serialized references.
- The camera is Perspective, tagged `MainCamera`, and enabled.
- The prefab asset's `campusViewBounds` remains unassigned by design.
- The scene instance supplies the bounds reference.
- The rig remains scene-local and is not made persistent.

The prefab YAML currently does not explicitly serialize four fields that were added to the controller later:

```text
useCustomInitialDistance
customInitialDistance
absoluteMinDistance
ignoreInputOverUI
```

Before scene wiring, open the prefab in Prefab Mode and verify that the Inspector resolves them to the code defaults `false`, `55`, `1`, and `true`. If Unity shows incorrect values, set those defaults and apply the prefab. If the shared prefab changes, regression-test `Campus.unity` before handoff.

---

## 5. Campus reference wiring to preserve

`Campus.unity` currently has:

```text
CampusRoot                              # CampusViewBounds
└── CampusVisualRoot                    # serialized bounds target

_InitManager                            # prefab instance

CampusOrbitRig                          # prefab instance
└── ...
    └── Main Camera
```

The Campus rig instance assigns `CampusRoot/CampusViewBounds` and uses Campus-specific overrides:

| Setting | Campus override |
| --- | ---: |
| Initial yaw | `135` |
| Initial pitch | `20` |
| Custom initial distance | enabled, `55` |
| Pan sensitivity | `20` |
| Zoom sensitivity | `0.1` |
| Minimum-distance multiplier | `0.001` |

Do not copy these values blindly to FloorDetail. They were tuned for a campus model with a different scale and composition.

Campus also adds a scene-only `PhysicsRaycaster` to the rig camera for Building E floor hover, with its event mask restricted to the `FloorHover` layer. That component is not part of the source rig prefab and is not required for orbit motion. Do not add it to FloorDetail unless FloorDetail separately gains 3D EventSystem pointer targets.

---

## 6. FloorDetail baseline and safety warning

### 6.1. Current scene structure

The inspected `FloorDetail.unity` contains these relevant objects:

```text
FloorDetail
├── HomeOffice                          # active; position (28.5, 0, -3)
├── MainOffice                          # active; identity transform
│   └── EventSystem                     # legacy StandaloneInputModule
├── Lighting
│   ├── Directional Light
│   └── Point light × 6
├── Main Camera                         # standalone Camera + AudioListener
└── Unity-RecorderSessions
```

The current standalone camera is active and tagged `MainCamera`. Its recorded baseline is:

| Setting | Value |
| --- | --- |
| Position | `(-13.827099, 27.65815, 22.097647)` |
| Euler hint | `(9.978001, 284.732, 0.003)` |
| FOV | `46.6` |
| Near / far clip | `0.3 / 1000` |

Its forward ray reaches the `Y = 0` plane near `(-3.94, 0, 4.75)`, which is inside the `MainOffice` layout. This is evidence that the current composition is centered on `MainOffice`, not the smaller adjacent `HomeOffice` demo.

No other serialized scene object was found referencing the old camera, so removing it after a successful reversible swap should not break a known dependency.

No project-authored runtime script, orbit prefab instance, or `CampusViewBounds` is currently serialized in FloorDetail.

### 6.2. Dirty-worktree warning

At planning time, the worktree already contained user changes, including a very large modification to `Assets/Scene/FloorDetail.unity` (`103128` inserted and `275` deleted lines in the current Git comparison). Other unrelated user settings and PolygonOffice assets were also modified/untracked.

The implementation Agent must rerun:

```bash
git status --short
git branch --show-current
git rev-parse --short HEAD
git diff --stat -- UnityContent/Assets/Scene/FloorDetail.unity
```

Do not stash, reset, discard, overwrite or stage the existing FloorDetail work on the user's behalf. Ask the user to establish a commit/checkpoint or otherwise state how the scene baseline should be preserved before editing it. Only after a safe baseline exists, create the implementation branch, recommended as:

```text
codex/floor-detail-orbit-camera
```

Do not assume the old `feature/orbit-map-camera` branch named in the original design plan is the correct base; the orbit implementation is already present in the currently inspected project state.

---

## 7. FloorDetail bounds decision

Recommended planning assumption: the orbit overview targets `MainOffice` only. This is inferred from the existing composition, not from an explicit product requirement. Surface the assumption before scene mutation; if the user confirms that “FloorDetail” must include every active layout, use the two-root alternative at the end of this section. In the absence of contrary direction, use `MainOffice` to preserve the current view intent.

Reasons:

- The current standalone camera points near the center of `MainOffice`.
- `MainOffice` is the primary layout, with about `1502` direct PolygonOffice prefab instances and an approximate placed-pivot envelope of `X [-25, 20]`, `Z [-10, 25]`.
- `HomeOffice` is a much smaller adjacent sample, offset to `(28.5, 0, -3)`, with about `113` direct prefab instances.
- Including `HomeOffice` would widen the overview and pan limits away from the current scene composition.
- Referencing `MainOffice` directly avoids unnecessary hierarchy churn in a scene containing roughly `1600` prefab instances.

Create one neutral, scene-only camera context without reparenting either office:

```text
FloorDetailCameraContext                # identity; CampusViewBounds
└── serialized CampusVisualRoot reference -> MainOffice
```

Rules for the recommended `MainOffice` path:

- Keep `MainOffice` as a scene root at world identity.
- Keep `HomeOffice` as a separate scene root at world position `(28.5, 0, -3)`.
- Do not reparent or otherwise rewrite either office's visual hierarchy for this camera task. Moving the non-visual `EventSystem` child out of `MainOffice` in Section 9 is the one intentional infrastructure exception.
- Assign `CampusViewBounds.CampusVisualRoot` directly to `MainOffice`.
- `CampusViewBounds.Awake()` calculates and caches bounds on Play. If an Editor utility performs the setup, it may also call the public `CalculateBounds()` after assignment; there is no normal Inspector button for this method.
- Inspect the bounds gizmo and confirm it encloses the intended `MainOffice` environment without a distant helper renderer inflating it.
- Record that `HomeOffice` is intentionally outside the overview/pan bounds.

If later product direction requires both layouts to be navigable in one overview, create an identity `FloorDetailVisualRoot`, reparent `MainOffice` and `HomeOffice` with world transforms preserved, and point the same bounds component to that wrapper. Do not fork or rewrite the shared camera controller for that variation.

---

## 8. Target FloorDetail hierarchy

With the recommended `MainOffice` scope, the final relevant hierarchy should be:

```text
FloorDetail
├── MainOffice                              # unchanged; bounds target
├── HomeOffice                              # unchanged; intentionally outside bounds
├── FloorDetailCameraContext                # identity; CampusViewBounds -> MainOffice
├── Lighting                                # unchanged
├── EventSystem                             # EventSystem + InputSystemUIInputModule
├── _InitManager                            # existing prefab instance
│   └── OrbitInput
├── CampusOrbitRig                          # existing prefab instance; scene-local
│   └── YawPivot
│       └── PitchPivot
│           └── Main Camera                 # sole Camera + AudioListener
└── Unity-RecorderSessions                  # preserve as found
```

Required counts in the loaded scene after duplicate cleanup:

```text
1 enabled Camera
1 enabled AudioListener
1 enabled EventSystem
1 compatible EventSystem input module
1 active CampusOrbitCameraController
1 active OrbitCameraInputManager
```

---

## 9. EventSystem correction

`FloorDetail` currently uses `StandaloneInputModule`, while the project is configured for the new Input System. Leaving this combination can cause legacy `UnityEngine.Input` access errors and makes UI gating inconsistent with Campus.

Perform this migration in the scene:

1. Detach the existing `EventSystem` from `MainOffice` and make it a root object.
2. Preserve its identity transform and `EventSystem` component.
3. Remove only `StandaloneInputModule`.
4. Add `InputSystemUIInputModule`.
5. Configure it the same way as the working Campus EventSystem through the Unity Inspector; do not hand-edit asset GUIDs.
6. Verify Point, click, right-click, middle-click and scroll action references are populated.
7. Confirm there is no second EventSystem and no second enabled input module.

The controller can create a missing EventSystem at runtime, but explicit scene configuration is preferred here because FloorDetail already owns one and must not retain an incompatible module.

Do not move the EventSystem into `_InitManager` as part of this task. That would change its lifetime for every scene and needs a separate cross-scene UI ownership decision.

---

## 10. Ordered scene implementation

Perform scene changes in the Unity Editor or through a Unity Editor API. Do not hand-edit the large scene YAML.

1. Complete the Git/baseline safety gate in Section 6.2.
2. Open `Assets/Scene/FloorDetail.unity` and record pre-existing Console errors.
3. Record the current root hierarchy and the transforms of `MainOffice`, `HomeOffice`, `Lighting`, `Main Camera` and `EventSystem`.
4. Create an identity root named `FloorDetailCameraContext` and add `CampusViewBounds` to it.
5. For the recommended MainOffice scope, leave both office roots in place and assign `MainOffice` directly to the component's `CampusVisualRoot` field.
6. Only if the user confirms the two-office scope, create the identity common visual root described in Section 7, reparent both office roots with world transforms preserved, and assign that common root instead.
7. Move `EventSystem` to the scene root and migrate its input module as specified in Section 9.
8. Confirm the selected scope decision: under the recommended default, `HomeOffice` remains outside the bounds; under the explicitly approved alternative, configure the common visual wrapper from Section 7.
9. Select the bounds component and visually inspect its gizmo. If using Editor automation, call `CalculateBounds()` now; otherwise let `Awake()` cache the bounds on the first Play run and inspect/log the runtime center, size and radius.
10. Instantiate `Assets/Prefabs/System/_InitManager.prefab` at root identity.
11. Instantiate `Assets/Prefabs/Camera/CampusOrbitRig.prefab` at root identity.
12. Assign the FloorDetail `CampusViewBounds` component to the rig instance's `campusViewBounds` field.
13. Apply only FloorDetail tuning as overrides on this prefab instance; do not apply scene tuning back to the prefab asset.
14. Before the first Play validation, reversibly disable the old root `Main Camera` GameObject (or at minimum both its Camera and AudioListener). Do not test with two active cameras/listeners.
15. Enter Play Mode and verify the orbit rig controller remains enabled and is the sole active camera.
16. Exit Play Mode. If validation succeeded, remove the old root `Main Camera` and its AudioListener together in Edit Mode; if it failed, re-enable the old object while repairing the new wiring.
17. Confirm no `PlayerRig`, walking controller or additional active camera was introduced.
18. Save `FloorDetail.unity`, reopen it, and verify every serialized reference remains intact.

If an Editor utility is used, do not invoke `CampusOrbitSetupEditor.SetupAll()` on FloorDetail unchanged. Its current `WireScene` implementation hard-codes `CampusRoot/CampusVisualRoot`; even after failing to find those objects, it can delete the root Main Camera, instantiate a rig with null bounds, and save the scene.

If repeatable tooling is necessary, create a narrowly scoped `FloorDetailOrbitSetupEditor` that:

- Refuses to mutate unless the active scene path is exactly `Assets/Scene/FloorDetail.unity`.
- Loads and reuses the two existing prefab assets rather than regenerating them.
- Validates the prefab assets and every root in the confirmed bounds scope before deleting or disabling anything.
- Uses Undo-aware Editor APIs; under the default scope it leaves both office hierarchies/transforms unchanged, and under the alternative it preserves their world transforms while reparenting.
- Assigns bounds and validates the new camera before removing the old camera.
- Does not save automatically after a partial failure.

Permanent setup tooling is optional; the scene integration is required.

---

## 11. FloorDetail tuning baseline

Start with the source prefab's scale-neutral defaults, then tune the FloorDetail instance as needed:

| Setting | Starting value |
| --- | ---: |
| Projection | Perspective |
| FOV | `50` |
| Initial yaw | approximately `150` |
| Initial pitch | approximately `54` |
| Use custom initial distance | `false` |
| Framing margin | `1.15` |
| Pitch limits | `20–80` |
| Orbit sensitivity | `0.2` |
| Pan sensitivity | `1` |
| Pan bounds margin | `0.10` |
| Invert pan | `false` |
| Zoom sensitivity | `0.15` |
| Min/max distance multipliers | `0.05 / 3` |
| Absolute minimum distance | `1` |
| Damping time | `0.15` |
| Ignore input over UI | `true` |

Tuning rules:

- Keep automatic bounds fitting first; enable custom initial distance only if a reviewed composition requires it.
- Start near yaw `150` and pitch `54`, which approximates the old camera's MainOffice-facing direction, then tune only the FloorDetail instance.
- Tune pan/zoom for the smaller indoor scale independently of Campus.
- Play Mode tuning is exploratory: record every accepted serialized value, exit Play Mode, enter only those values on the FloorDetail prefab instance in Edit Mode, save the scene, and run the same Play test again.
- Apply FloorDetail controller values as scene-instance overrides only. Never use “Apply All” on the prefab instance.
- Keep pitch clamped and roll at zero.
- Check that the automatic overview fits at the target Game-view aspect ratio. If the computed distance reaches the maximum clamp, increase only the FloorDetail instance's maximum-distance multiplier.
- The controller currently forces camera FOV/near/far to `50/0.1/1000` in `Start`. Do not rely on a camera-component scene override for different values. A request for configurable clip/FOV settings is a separate shared-controller change and requires a Campus regression test.
- Do not save a Play Mode camera pose back into the prefab or scene.

---

## 12. Runtime code and prefab change policy

Reuse the existing runtime architecture. One small shared input correction is required because static inspection found a held-button focus-loss edge case:

```text
Assets/Script/Input/OrbitCameraInputManager.cs
Assets/Script/Core/Signals/OrbitCameraSignals.cs
Assets/Script/Core/Bootstrap/AppBootstrap.cs
Assets/Script/Camera/CampusViewBounds.cs
Assets/Script/Camera/CampusOrbitCameraController.cs
```

Update `OrbitCameraInputManager` so focus loss or disable cannot resume orbit/pan from a stale pointer-down position:

1. Add a private suppression flag such as `_ignoreDragUntilAllButtonsReleased`.
2. On focus loss and `OnDisable`, clear the current drag state and set the suppression flag.
3. While suppressed, do not start or publish left/right/middle drag gestures.
4. Clear suppression only after all three drag buttons are observed released.
5. Require a later fresh `wasPressedThisFrame` before recording a new down position or beginning a gesture.
6. Keep Home reset and normal cursor visibility behavior unchanged.
7. Test this change in both Campus and FloorDetail.

Do not turn this into a new input abstraction or input-actions rewrite.

Apart from that focused fix, only change shared runtime code when another validation failure proves it necessary. If that happens:

1. Describe the failing reproduction before editing.
2. Make the smallest scene-agnostic correction.
3. Test both `Campus.unity` and `FloorDetail.unity`.
4. Keep static-signal subscription/reset behavior intact.
5. Do not add scene-name conditionals to runtime camera code.

Known technical debt that is not automatically part of this integration:

- UI/EventSystem fallback paths still use scene-wide Find APIs, despite the original design preference against them.
- UI hit checks create `PointerEventData` instances.
- Cached bounds become stale if visual geometry moves or loads after initialization.
- Orbit-specific automated tests do not currently exist.

Fix one of these only if it blocks the acceptance criteria or the user expands scope.

---

## 13. Validation matrix

### 13.1. Scene and startup

| Test | Expected result |
| --- | --- |
| Open and Play `FloorDetail.unity` directly | The confirmed visual scope is framed from an oblique perspective; default is `MainOffice` |
| Inspect controller after `Start` | Controller remains enabled; bounds reference is non-null and valid |
| Inspect hierarchy in Play Mode | Exactly one active camera, listener, EventSystem, orbit controller and input manager |
| Inspect Console | No missing-bounds, duplicate-listener, missing-script or legacy-input error |
| Stop and reopen scene | All prefab links and scene references persist |

### 13.2. Controls

| Test | Expected result |
| --- | --- |
| Left click without moving | Camera pose does not change |
| Left drag below `5 px` | Treated as a click, not orbit |
| Left drag horizontally/vertically | Smooth yaw/pitch orbit around a stable focus point |
| Orbit through a full yaw revolution | No roll or target drift |
| Drag beyond vertical limits | Pitch remains within configured clamp and never flips |
| Right drag | Focus pans parallel to world `XZ` |
| Middle drag | Same pan behavior |
| Pan to the boundary | Focus clamps to office bounds plus margin |
| Scroll both directions | Smooth proportional dolly; camera never crosses the target |
| Zoom to limits | Distance clamps without catastrophic clipping |
| Press `Home` | Smooth return to the full FloorDetail overview |
| Press `WASD`, arrows or Shift | No camera movement |
| Alt-tab while still holding a drag button, then move before release | Camera stays still until release; a later fresh press starts a new drag normally |

### 13.3. Bounds and visual integrity

- The cached bounds contain all intended renderer geometry for the confirmed scope; under the default, this is `MainOffice`.
- Under the recommended default scope, `HomeOffice` is intentionally excluded from automatic framing and pan clamps; if the user selects the two-root alternative, verify it is included instead.
- Lighting, camera, recorder and manager objects do not affect the bounds.
- The initial fit contains the complete confirmed visual scope.
- Panning cannot lose the scene irrecoverably; `Home` restores the overview.
- Under the default scope, neither office root nor any visual object's hierarchy/world transform changed; only the non-visual EventSystem moved out of `MainOffice`.
- Under the approved two-office alternative, only the two office roots gained `FloorDetailVisualRoot` as a parent; their world transforms and internal visual hierarchies remained unchanged.
- Lighting and URP rendering match the pre-integration scene except for the intentional camera composition/FOV change.
- No source PolygonOffice prefab, mesh, material, texture or model asset becomes dirty.

### 13.4. Input/UI compatibility

- FloorDetail contains `InputSystemUIInputModule`, not `StandaloneInputModule`.
- The EventSystem input action references are populated.
- Starting a drag over a temporary/test UI Graphic does not move the camera.
- A drag started in the 3D view may continue across UI until release.
- Scrolling over UI does not zoom the orbit camera.
- Remove any temporary validation Canvas before saving if FloorDetail is not intended to contain UI yet.

### 13.5. Cross-scene lifecycle

If the application already has a supported Campus-to-FloorDetail navigation path, also test:

1. Start in Campus.
2. Load FloorDetail through the supported path.
3. Confirm the original `_InitManager` persists and the FloorDetail duplicate is destroyed.
4. Confirm the Campus rig is destroyed with its scene and exactly one FloorDetail rig remains.
5. Confirm the FloorDetail rig references FloorDetail bounds, not the former Campus component.

`FloorDetail.unity` is not currently listed in `EditorBuildSettings`. Do not modify build settings solely for direct Editor Play Mode validation. Add it only if runtime scene loading/build inclusion is explicitly part of the requested application flow.

---

## 14. Campus regression check

Run this section because the focus-loss fix changes a shared input script. Also run it for any prefab reserialization or other shared-asset change:

- Open and Play `Assets/Scene/Campus.unity`.
- Confirm its `CampusViewBounds` instance reference remains assigned.
- Confirm its scene-specific yaw `135`, pitch `20`, custom distance `55`, pan `20`, zoom `0.1` and minimum-distance multiplier `0.001` overrides remain intact.
- Confirm the Campus `PhysicsRaycaster` scene override remains on the active rig camera with the `FloorHover` mask.
- Confirm Building E hover behavior still receives pointer events.
- Confirm orbit, pan, zoom, Home reset and UI gating still work.
- Confirm one enabled Camera and AudioListener.

FloorDetail scene wiring must not serialize any scene change into Campus.

---

## 15. Failure handling

| Failure | Required response |
| --- | --- |
| Orbit controller disables on start | Restore/assign the FloorDetail `CampusViewBounds`; verify it contains Renderers |
| Under the MainOffice scope, overview includes HomeOffice unexpectedly | Verify the bounds reference targets `MainOffice`, not a common scene wrapper |
| Overview misses part of the confirmed scope | Verify every intended renderer is under the selected bounds root, then recalculate bounds |
| Overview is extremely distant | Find and exclude the unintended distant/helper Renderer from the visual-root scope |
| Camera cannot zoom close enough | Tune FloorDetail instance min multiplier/absolute minimum; do not copy Campus values automatically |
| Camera cannot fit the full bounds | Increase the FloorDetail instance max-distance multiplier and retest target aspect ratio |
| Orbit input does nothing | Verify one active `_InitManager/OrbitInput`, enabled controller and valid static-signal lifecycle |
| Duplicate manager after scene transition | Verify both objects use the original `_InitManager.prefab` and `AppBootstrap` is enabled |
| Duplicate camera/listener warning | Remove/disable the old camera or extra rig; keep one active pair |
| Legacy Input exception | Remove `StandaloneInputModule` and configure `InputSystemUIInputModule` |
| UI still moves camera | Verify compatible EventSystem action references and GraphicRaycaster/layer setup |
| Office hierarchy differs from the confirmed topology | Default scope: revert office-root reparenting. Two-office scope: allow only the common parent, preserve world transforms, and revert internal visual changes |
| Existing Campus behavior changes | Revert unintended prefab/shared-code changes; keep FloorDetail settings as instance overrides |

Do not solve missing references with `GameObject.Find`, a scene-name switch, `Resources.Load`, Addressables or a second camera singleton.

---

## 16. Acceptance criteria

### Reuse and architecture

- [ ] Selected option 2 is implemented; option 1's persistent-camera-rig design is not used.
- [ ] There is one shared `CampusOrbitRig.prefab` asset, not a Campus copy and a FloorDetail copy.
- [ ] `Campus.unity` and `FloorDetail.unity` each own exactly one scene-local instance of that shared rig prefab.
- [ ] `FloorDetail` uses the existing `_InitManager.prefab` and `CampusOrbitRig.prefab`.
- [ ] `_InitManager` is a root persistent object; each rig is a separate scene-local root and is never parented beneath it.
- [ ] In a single-scene load, loading FloorDetail destroys the Campus rig/bounds with Campus while retaining only the global input manager.
- [ ] If additive loading is already used, only one scene-local rig is enabled during overlap.
- [ ] The rig's internal prefab references remain valid.
- [ ] The FloorDetail rig instance has a serialized reference to its scene-owned `CampusViewBounds`.
- [ ] No scene-name-specific runtime logic was added.

### Scene integrity

- [ ] Default scope: office roots and visual children retain their hierarchy/transforms except for EventSystem infrastructure. Approved two-office scope: only the office-root parent changes, while world transforms and internal visual hierarchies remain intact.
- [ ] Bounds frame the confirmed visual scope (default assumption: `MainOffice`), intentionally handle `HomeOffice` according to that decision, and exclude infrastructure.
- [ ] Lighting and recorder objects remain unchanged.
- [ ] The old standalone camera/listener are absent or inactive.
- [ ] Exactly one enabled Camera and AudioListener remain.
- [ ] No PolygonOffice source asset was modified.

### Input and behavior

- [ ] Left drag orbits after the threshold.
- [ ] Right and middle drag pan on `XZ`.
- [ ] Wheel zoom is proportional and clamped.
- [ ] `Home` restores the overview.
- [ ] Click-without-drag does not move the camera.
- [ ] Pitch never flips and camera roll remains zero.
- [ ] `WASD`, arrows and Shift do nothing.
- [ ] Focus loss does not leave a sticky drag.
- [ ] UI-origin input is blocked.

### Runtime health

- [ ] One compatible EventSystem uses `InputSystemUIInputModule` only.
- [ ] Console has no new error or repeated warning.
- [ ] No missing script or missing serialized reference exists.
- [ ] No meaningful per-frame GC allocation is introduced by this integration.
- [ ] Stopping Play Mode does not persist a runtime camera pose.
- [ ] Campus passes regression validation after the shared input fix.

---

## 17. Expected diff

Required implementation change:

```text
Assets/Scene/FloorDetail.unity
Assets/Script/Input/OrbitCameraInputManager.cs     # held-button focus-loss guard
```

Conditional changes only:

```text
Assets/Prefabs/Camera/CampusOrbitRig.prefab       # only if missing-field Inspector validation fails
Assets/Script/Editor/FloorDetailOrbitSetupEditor.cs
Assets/Script/Editor/FloorDetailOrbitSetupEditor.cs.meta
```

Unexpected changes requiring review:

- `Assets/Scene/Campus.unity` unless a deliberate shared-asset reserialization updates it.
- `_InitManager.prefab`.
- Runtime camera/controller/signal scripts other than the documented `OrbitCameraInputManager` focus-loss fix.
- PolygonOffice prefabs, meshes, models, materials or textures.
- Input action assets or package files.
- `ProjectSettings/ProjectSettings.asset` or `Packages/*`.
- `EditorBuildSettings.asset` unless runtime FloorDetail loading was explicitly added to scope.
- `UserSettings/*`, layout files, Library, Logs or generated project files.

Because `FloorDetail.unity` was already heavily modified at planning time, compare the integration against the user-approved checkpoint, not blindly against the older repository version.

---

## 18. Out of scope

- Replacing the custom orbit system with Cinemachine.
- Renaming `CampusOrbitCameraController` or `CampusViewBounds` for cosmetic generality.
- Merging the rig into persistent `_InitManager`.
- Adding first-person walking or a PlayerRig.
- Selecting rooms, floors, furniture or IoT devices.
- Adding a FloorDetail HUD or production Canvas.
- Adding a scene-navigation implementation.
- Adding FloorDetail to a player build without an explicit loading requirement.
- Editing PolygonOffice source prefabs or model assets.
- General performance refactors unrelated to a reproduced integration failure.

---

## 19. Required handoff report

The implementation Agent must report:

1. Source branch and source commit.
2. How the pre-existing dirty FloorDetail scene was checkpointed/preserved.
3. Final implementation branch and commit(s), if commits were requested.
4. Exact files changed and why.
5. Confirmation that both existing prefabs were reused and no duplicate was created.
6. Confirmation that option 2 was used: one shared rig asset, one scene-local rig instance per scene, and no persistent rig.
7. Final FloorDetail hierarchy and exact bounds target.
8. Measured cached bounds center, size and bounding radius.
9. Final FloorDetail yaw, pitch, distance mode, sensitivities, damping and distance clamps.
10. EventSystem/input-module migration result.
11. Final active Camera, AudioListener, EventSystem, controller and input-manager counts.
12. Direct FloorDetail Play Mode test results for every control.
13. Console and Profiler results.
14. Cross-scene lifecycle result, if a supported transition exists.
15. Campus regression result after the shared input fix and any prefab change.
16. Known limitations and the smallest recommended follow-up.
