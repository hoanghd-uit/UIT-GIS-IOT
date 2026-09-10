# Campus-to-FloorDetail WebGL Navigation Fix Plan

## 1. Handover objective

Finish the incomplete Campus-floor navigation pipeline so that:

1. A valid click on `HoverableFloor` in `Campus.unity` emits the selected building and floor to the Next.js viewer.
2. Next.js navigates to the canonical floor URL.
3. The existing, persistent Unity WebGL runtime receives that URL state.
4. Unity switches from `Campus` to `FloorDetail` inside the same player and canvas.
5. Browser route state and the active Unity scene can return to Campus and cannot silently disagree.

This is an implementation handoff. The implementing agent may change both repository areas:

- `UnityContent/`
- `web/`

Use the real folder name `UnityContent/` when editing; references to “Unity/” in discussion mean this folder.

## 2. Non-negotiable build and testing boundary

The user will build Unity WebGL manually **after all source-code and scene/prefab fixes are implemented**.

The implementing agent must therefore:

- not run a Unity WebGL build;
- not overwrite, delete, rename, or replace files under `web/public/unity/campus/Build/`;
- not claim that the currently hosted player validates the fix, because it is the old Campus-only build;
- not guess future loader, data, framework, or wasm filenames;
- not update filename-specific paths in `web/src/config/unity-build.ts` or `web/next.config.ts` during this implementation; those changes belong to a post-build packaging step when matching generated artifacts exist and publication is authorized;
- not create, describe as an agent task, or execute any test whose result requires the latest rebuilt Unity WebGL player;
- not add Playwright, Cypress, browser automation, or other end-to-end tests that expect the new Unity code or `FloorDetail` scene to exist in the currently hosted build;
- not use a browser run against the stale public artifact as acceptance evidence.

Allowed verification is limited to source-level checks, Unity Editor compile/EditMode/PlayMode checks that do not build WebGL, and web lint/type/production compilation that does not assert behavior of a new Unity binary. Section 9 defines the exact verification boundary.

The final handoff status must say:

> Source implementation complete; awaiting the user's manual Unity WebGL rebuild. WebGL/browser integration was not tested by design.

The older `web/doc/phase_02_campus_floor_detail_navigation_plan.md` contains WebGL build and browser-test checkpoints. Those checkpoints are explicitly deferred for this task wherever they conflict with this section.

## 3. Current state and confirmed causes

### 3.1. Campus click stops inside Unity

Current flow:

```text
HoverableFloor.OnPointerClick
  -> HoverableFloor.OnFloorClick
  -> FloorHoverSignals.PublishFloorClicked
  -> no subscriber
```

`UnityContent/Assets/Script/Campus/Buildings/HoverableFloor.cs` already logs and publishes the selected `HoverableFloor`. `UnityContent/Assets/Script/Core/Signals/FloorHoverSignals.cs` exposes the event, but no runtime component subscribes to `FloorClicked`.

There is also no project-authored WebGL bridge:

- no `.jslib` or `.jspre` under `UnityContent/Assets/`;
- no guarded `[DllImport("__Internal")]` browser call;
- no `dispatchReactUnityEvent` call.

The Campus pointer plumbing is already present: EventSystem, Input System UI module, PhysicsRaycaster, `FloorHover` layer mask, colliders, and explicit Building E floor metadata. Preserve it. If hover works and `[HoverableFloor] Clicked...` appears once, do not rewrite hit detection to solve a missing bridge.

### 3.2. Web route-to-Unity command has no receiver

The web side already:

- listens for `FloorClicked` in `web/src/components/unity/UnityViewerRuntime.client.tsx`;
- validates the payload;
- pushes `/viewer/buildings/{buildingId}/floors/{floorId}`;
- parses viewer routes in `web/src/lib/viewer-routes.ts`;
- calls `sendMessage("_InitManager", "ApplyViewerRoute", payloadJson)` from `UnityRouteSynchronizer.client.tsx`;
- retains one Unity runtime and one canvas beneath `web/src/app/viewer/layout.tsx`.

However, Unity contains no public `ApplyViewerRoute(string)` method and no scene-flow controller. The existing `_InitManager.prefab` only owns `AppBootstrap` and the orbit input child.

The floor route page intentionally renders only an HTML navigation overlay. It cannot change Unity content by itself; scene switching must be performed by the missing Unity receiver.

### 3.3. Scene-list status and stale artifact

The user reports that `FloorDetail` has now been added to the Unity Scene List, with no other fix and no WebGL rebuild yet. Treat that user action as intentional and preserve it.

At plan-authoring time, the serialized file visible on disk still showed only:

```text
Assets/Scene/Campus.unity
```

in `UnityContent/ProjectSettings/EditorBuildSettings.asset`. The active Unity 6 Web profile at `UnityContent/Assets/Settings/Build Profiles/New Web Profile.asset` has `m_OverrideGlobalSceneList: 0`, so it inherits that global list.

This may mean the Editor change has not yet been serialized or saved. At implementation preflight:

1. Inspect the active Web build profile and the on-disk global Scene List.
2. Confirm that `Campus` is enabled first and `FloorDetail` is enabled second.
3. If the user's addition is already serialized, leave it intact.
4. If it is still absent, add/save `FloorDetail` as the correction the user already authorized and report that fact.
5. Do not enable a profile override merely to hide an incorrect global list.
6. Do not rebuild WebGL.

The currently hosted `UIT-GIS-0910_1.data.br` was confirmed to contain `Campus` but not `FloorDetail`, `ApplyViewerRoute`, `ViewerStateChanged`, or the browser bridge. That artifact is expected to remain stale until the user performs the manual build.

### 3.4. Orbit-camera lifecycle is already decided

Preserve Option 2 from `UnityContent/Assets/Script/doc/floor_detail_orbit_camera_integration_plan.md`:

- `_InitManager` is persistent through `AppBootstrap`.
- `CampusOrbitRig.prefab` is shared, but each scene owns one scene-local instance.
- The camera rig must not be parented under or persisted with `_InitManager`.
- Use `LoadSceneMode.Single` so the source scene's rig and bounds unload while the destination scene's correctly bound rig loads.
- `FloorDetail` may retain its `_InitManager` prefab instance for direct Editor Play. During Campus-to-FloorDetail loading, `AppBootstrap` must destroy the duplicate and retain the original persistent manager.

The current `FloorDetail.unity` already contains the scene-local orbit rig and `_InitManager` prefab instances. Do not redo the orbit-camera integration as part of this navigation fix.

## 4. Binding architecture

Use one build, one Unity runtime, and one canvas.

```text
HoverableFloor
  -> FloorHoverSignals.FloorClicked
  -> persistent Unity bridge
  -> FloorClicked JSON event
  -> React validates and router.push(...)
  -> UnityRouteSynchronizer sends ApplyViewerRoute JSON
  -> persistent Unity scene-flow controller
  -> LoadSceneAsync(Campus or FloorDetail, Single)
  -> ViewerStateChanged or ViewerError JSON event
```

The URL is the navigation source of truth. `HoverableFloor` must not directly load `FloorDetail`, call `Application.OpenURL`, or mutate the browser location. A Unity click requests web navigation; the resulting route commands Unity.

Do not add:

- a second `useUnityContext`;
- a second `<Unity>` canvas;
- a second WebGL build selected by route;
- an iframe;
- a full page reload during normal navigation.

The existing public folder may remain named `unity/campus` even though the next manual build will contain both scenes. Renaming it is unnecessary for this fix.

## 5. Exact bridge contract

All payloads are one JSON string and use `schemaVersion: 1`.

### 5.1. Unity to web: `FloorClicked`

```json
{
  "schemaVersion": 1,
  "buildingId": "E",
  "floorId": "7"
}
```

Use the current shared catalog: Building `E`, floors `G` and `1` through `12`. Campus scene metadata and the current web types both include `G`. Do not follow the older Phase 02 text that omits `G` unless the user separately changes the product requirement in both modules.

### 5.2. Web to Unity: `ApplyViewerRoute`

Target GameObject:

```text
_InitManager
```

Required public instance method on a component attached directly to that root:

```csharp
public void ApplyViewerRoute(string payloadJson)
```

Campus payload:

```json
{
  "schemaVersion": 1,
  "view": "campus"
}
```

Floor payload:

```json
{
  "schemaVersion": 1,
  "view": "floor-detail",
  "buildingId": "E",
  "floorId": "7"
}
```

`sendMessage` targets the exact named GameObject and does not search its children for the method. Do not attach the receiver only to `_InitManager/OrbitInput`.

### 5.3. Unity to web acknowledgement: `ViewerStateChanged`

Campus:

```json
{
  "schemaVersion": 1,
  "view": "campus",
  "sceneName": "Campus"
}
```

FloorDetail:

```json
{
  "schemaVersion": 1,
  "view": "floor-detail",
  "sceneName": "FloorDetail",
  "buildingId": "E",
  "floorId": "7"
}
```

### 5.4. Unity to web failure: `ViewerError`

```json
{
  "schemaVersion": 1,
  "code": "SCENE_LOAD_FAILED",
  "message": "FloorDetail could not be loaded"
}
```

Do not expose exception stack traces or raw HTML to the browser payload.

## 6. Preflight and preservation

Before editing:

1. Read this plan completely.
2. Read the selected Option 2 section of `floor_detail_orbit_camera_integration_plan.md`.
3. Inspect the actual current Unity scenes, prefabs, scripts, web components, and generated metadata rather than assuming the older plans describe the final implementation.
4. Before changing Next.js code, read the relevant local documentation under `web/node_modules/next/dist/docs/` as required by `web/AGENTS.md`.
5. Preserve all unrelated user changes. Do not run reset, checkout, clean, or broad generated-file deletion.
6. Recheck repository status. At plan-authoring time `.git/index` reported `index file smaller than expected`. Do not repair or replace Git metadata as part of this feature without user authorization. If a trustworthy baseline cannot be established, report the blocker before editing overlapping files.
7. Confirm both scene assets exist and that `FloorDetail.unity` still has one scene-local orbit rig with a valid scene-owned bounds reference.
8. Verify the Scene List state described in Section 3.3.

## 7. Ordered implementation

### Checkpoint 1 — Add the Unity-to-browser bridge

Create a small interop layer using project conventions, for example:

```text
UnityContent/Assets/Script/Bridge/WebViewerBridge.cs
UnityContent/Assets/Plugins/WebGL/ViewerBridge.jslib
```

Responsibilities:

- Export one generic or narrowly scoped JavaScript function that accepts an event name and JSON payload.
- In `.jslib`, decode pointers with `UTF8ToString` and call `window.dispatchReactUnityEvent(eventName, payloadJson)` only when that function exists.
- Guard the C# import with `UNITY_WEBGL && !UNITY_EDITOR`.
- Provide an Editor/non-WebGL fallback log so source behavior can be checked without a WebGL build.
- Serialize typed payload objects; do not concatenate JSON manually.
- Keep JavaScript interop out of `HoverableFloor`.
- Avoid throwing when Unity runs directly in the Editor or outside the React host.

Make `WebViewerBridge` a `MonoBehaviour` attached directly to the shared `_InitManager` prefab root. It owns the outbound-event subscription:

```csharp
FloorHoverSignals.FloorClicked += HandleFloorClicked;
```

Unsubscribe using the same delegate. Validate the floor metadata before emitting. One accepted click must create one `FloorClicked` event. The scene-flow controller must obtain this same root component and use it to emit `ViewerStateChanged` and `ViewerError`; do not create a second outbound bridge or a second static-signal subscriber.

`WebViewerBridge` must rely on the root `AppBootstrap` for persistence. It must not call `DontDestroyOnLoad` independently.

Do not replace the existing static signal seam and do not make `HoverableBuilding` responsible for web routing.

### Checkpoint 2 — Add the persistent scene-flow controller

Create a runtime component such as:

```text
UnityContent/Assets/Script/Navigation/ViewerSceneFlowController.cs
```

Attach it directly to the root of:

```text
UnityContent/Assets/Prefabs/System/_InitManager.prefab
```

The root must therefore contain `AppBootstrap`, `WebViewerBridge`, and `ViewerSceneFlowController`. The controller should require or resolve the bridge on the same GameObject; it must not perform a scene-wide search.

It must:

1. Expose exact public method `ApplyViewerRoute(string payloadJson)`.
2. Deserialize unknown input safely and validate every field.
3. Reject unsupported schema versions, views, buildings, and floor IDs without changing scene.
4. Map `campus` only to exact scene `Campus`.
5. Map `floor-detail` only to exact scene `FloorDetail`.
6. Check `Application.CanStreamedLevelBeLoaded` before starting a transition.
7. Load with `SceneManager.LoadSceneAsync(target, LoadSceneMode.Single)`.
8. Remain alive because `_InitManager` is already protected by `AppBootstrap`.
9. Avoid reloading the scene when the requested scene is already active.
10. When only `floorId` changes while `FloorDetail` is active, update the retained selection and acknowledge it without reloading.
11. Retain the newest valid request while a load is in progress. After a load completes, apply the newest request rather than acknowledging stale state.
12. Emit `ViewerStateChanged` only after the requested scene is active and the latest selection is applied.
13. Emit a concise `ViewerError` for handled validation/load failures where appropriate.
14. Avoid duplicate static subscriptions when FloorDetail's duplicate `_InitManager` is created and destroyed. Use the root `AppBootstrap` primary-instance state as the authority: expose a read-only primary/survivor flag from `AppBootstrap` if needed, and keep bridge/controller behavior disabled on the duplicate before its delayed destruction. Do not add independent `DontDestroyOnLoad` calls.
15. Reset any static singleton/controller state with `RuntimeInitializeOnLoadMethod(SubsystemRegistration)` when required for disabled domain reload.

Do not put camera references or scene-owned bounds on this persistent controller. Camera rigs remain scene-local.

### Checkpoint 3 — Preserve and verify the Scene List

Verify the user's already-performed Scene List change is serialized as:

```text
0  Assets/Scene/Campus.unity       enabled
1  Assets/Scene/FloorDetail.unity  enabled
```

If it is missing on disk, save/add only the missing `FloorDetail` entry. Preserve Campus as startup scene and keep the active Web profile inheriting the correct global list unless the project has deliberately moved to a profile-specific list.

This checkpoint ends after source/project-setting verification. Do not build WebGL.

### Checkpoint 4 — Complete only necessary web-source changes

Reuse the existing files and abstractions:

- `web/src/components/unity/UnityViewerRuntime.client.tsx`
- `web/src/components/unity/UnityRouteSynchronizer.client.tsx`
- `web/src/lib/unity-bridge.ts`
- `web/src/lib/viewer-routes.ts`
- `web/src/types/viewer.ts`
- `web/src/config/buildings.ts`

Required behavior:

- Keep one `useUnityContext` owner under the persistent `/viewer` layout.
- Keep the stable `FloorClicked`, `ViewerStateChanged`, and `ViewerError` listeners with matching cleanup.
- Validate Unity payloads before routing or updating status.
- For `floor-detail`, require `buildingId` and `floorId`; they must no longer be optional in the acknowledgement type or parser.
- Accept a Campus acknowledgement only when `sceneName` is exactly `Campus`, and a floor acknowledgement only when `sceneName` is exactly `FloorDetail`.
- Push the canonical route with `router.push(..., { scroll: false })`.
- Keep `UnityRouteSynchronizer` as the only web writer of `ApplyViewerRoute`.
- Do not send until the Unity runtime reports loaded.
- Compare `ViewerStateChanged` acknowledgement against the current route before marking it ready; ignore stale acknowledgements from an older request.
- Clear or replace stale error state when a new valid route is attempted.
- Keep floor-to-floor URL changes from remounting the runtime or canvas.
- Keep direct valid floor URLs eligible to send their route after Unity startup.

Inspect before changing: most of this web contract is already implemented. Make the smallest changes necessary for acknowledgement correctness and current-route consistency. Do not rewrite working UI, create another bridge abstraction, or delete the unused legacy canvas component as unrelated cleanup.

Do not change `web/src/config/unity-build.ts`, `web/next.config.ts`, or public Unity artifacts in this implementation. If the manual build later produces different names or compression, update those files only in a separately authorized post-build packaging step when the matching generated artifacts are available. If the same `UIT-GIS-0910_1` basename is reused, that later packaging step must still address stale browser/CDN caching rather than assuming identical URLs refresh every client.

### Checkpoint 5 — Source cleanup and documentation

- Ensure Unity `.meta` files exist for every new script/folder/plugin asset.
- Keep namespaces consistent with existing `UITCampus` code.
- Add concise comments around browser-only interop and latest-request-wins behavior.
- Do not add debug Canvas objects, permanent keyboard shortcuts, or browser globals beyond the bridge contract.
- Update an existing navigation document only if its statements would otherwise directly contradict the implemented source. Do not copy this plan into a second file.

## 8. Required behavior details

### 8.1. Click acceptance

- Accept only the existing left-click path that reaches `HoverableFloor.OnFloorClick`.
- Preserve drag-vs-click filtering, hover tint, and material restoration.
- Do not navigate on orbit drag.
- Invalid or blank floor metadata must log a concise warning and emit nothing.

### 8.2. Scene transitions

- Campus to floor: route changes first, then Unity loads `FloorDetail`.
- Direct floor route: after Unity source/runtime initialization, the same route payload requests `FloorDetail`.
- Floor to floor: update selected IDs and acknowledge without a scene reload.
- Browser route back to Campus: load `Campus` through the same controller.
- A newer route received during a transition wins.
- Only one `_InitManager`, orbit input publisher, scene-local camera, and AudioListener may remain after a completed single-scene transition.

### 8.3. Failure behavior

- Malformed JSON does not throw out of `ApplyViewerRoute`.
- Unsupported IDs do not load a scene.
- A missing build-scene entry is detected before loading and reported through `ViewerError` plus a concise Unity log.
- A failed or stale acknowledgement must not make web UI claim the wrong scene is ready.
- No failure path performs arbitrary URL navigation.

## 9. Verification allowed before the user's WebGL build

Only the following verification belongs in the implementing agent's task.

### 9.1. Static/source checks

- New C# and `.jslib` function names and argument order match.
- Event names and JSON fields exactly match Section 5.
- `ViewerSceneFlowController` is serialized directly on `_InitManager.prefab`.
- Both scenes are present and enabled in the effective Scene List, Campus first.
- Campus and FloorDetail each retain one scene-local orbit rig.
- No second web runtime or canvas was added.
- No file under `web/public/unity/campus/Build/` changed.

### 9.2. Unity Editor checks that do not build WebGL

- Unity scripts compile without errors.
- EditMode tests may cover route JSON parsing, catalog validation, payload serialization, and rejection of malformed input.
- In Editor Play Mode, directly invoke the public route method or use a narrowly scoped editor harness to verify Campus-to-FloorDetail and FloorDetail-to-Campus `LoadSceneAsync` behavior.
- Verify applying a second floor ID while FloorDetail is active does not reload the scene.
- Verify the non-WebGL bridge fallback logs one validated event for one accepted floor click.
- Verify duplicate `_InitManager` destruction leaves one persistent controller and does not duplicate signal handling.
- Remove any temporary invocation harness that is not an intentional automated test utility.

These Editor checks use scene/source assets and do not require a WebGL player.

### 9.3. Web checks that do not depend on a rebuilt player

Run:

```powershell
npm --prefix web run lint
npm --prefix web run build
```

Run existing source/unit tests if the repository already provides them and they do not load the Unity WebGL artifact. Do not add a new test framework solely for this fix.

Do not write or run browser tests for Unity event delivery, WebGL scene loading, compressed asset headers, current public build contents, or visual FloorDetail rendering. Those all require the user's future manual build and are excluded.

## 10. User-owned manual build handoff

After implementation and Section 9 verification, stop and hand the work back to the user.

The user will manually:

1. Open the intended Unity Web build profile.
2. Confirm Campus remains first and FloorDetail second.
3. Build the Unity WebGL player containing the new scripts and both scenes, preferably into a clean staging/output directory rather than directly over `web/public/`.

Copying or publishing the generated artifacts and updating web configuration are not automatically assigned to the user by this plan. They may be performed by the user or by a separately authorized post-build agent after the real output exists.

The implementing agent's report must identify, without guessing:

- the currently configured public build directory;
- the current `unity-build.ts` URL mapping;
- the exact filename-specific Brotli header rules in `web/next.config.ts`;
- that those two web files require follow-up only if the user's generated filenames or compression mode differ.

Do not include build-dependent test instructions in the agent task or Definition of Done. A later, separately authorized post-build task can update real artifact filenames and validate browser behavior after the user supplies or publishes the new build.

## 11. Pre-build Definition of Done

The implementing agent is finished when all applicable statements below are true:

- [ ] Campus floor clicks still reach `HoverableFloor.OnFloorClick` exactly once.
- [ ] A valid click reaches the bridge dispatch/editor-fallback path from `FloorHoverSignals` exactly once.
- [ ] Invalid floor metadata emits no browser event.
- [ ] `_InitManager` has a persistent scene-flow controller directly on its root.
- [ ] `_InitManager.ApplyViewerRoute(string)` exists with the exact web-facing signature.
- [ ] Route payloads are parsed and validated safely.
- [ ] Campus and FloorDetail scene requests use asynchronous single-scene loading.
- [ ] Floor-only changes do not reload FloorDetail.
- [ ] Latest valid route wins during overlapping requests.
- [ ] `ViewerStateChanged` and `ViewerError` use the agreed payload contract.
- [ ] Web accepts a ready acknowledgement only when its exact scene and required selection IDs match the current route.
- [ ] Campus remains build scene 0 and FloorDetail is enabled as build scene 1 in the effective serialized Scene List.
- [ ] `_InitManager` remains persistent while orbit rigs remain scene-local.
- [ ] The web viewer still owns one Unity runtime and one canvas.
- [ ] Web acknowledgement handling cannot mark a stale route ready.
- [ ] Unity source compiles and allowed Editor checks pass.
- [ ] `npm --prefix web run lint` passes.
- [ ] `npm --prefix web run build` passes.
- [ ] No Unity WebGL build was run by the agent.
- [ ] No hosted Unity build artifact was changed.
- [ ] No build-dependent test was written or run.
- [ ] Handoff explicitly says the implementation awaits the user's manual WebGL rebuild.

Passing this Definition of Done means the source implementation is ready to build. It does not mean browser/WebGL integration has been verified.

## 12. Expected diff

Likely new Unity files:

```text
UnityContent/Assets/Script/Bridge/WebViewerBridge.cs
UnityContent/Assets/Script/Bridge/WebViewerBridge.cs.meta
UnityContent/Assets/Script/Navigation/ViewerSceneFlowController.cs
UnityContent/Assets/Script/Navigation/ViewerSceneFlowController.cs.meta
UnityContent/Assets/Plugins/WebGL/ViewerBridge.jslib
UnityContent/Assets/Plugins/WebGL/ViewerBridge.jslib.meta
```

Likely modified Unity files:

```text
UnityContent/Assets/Prefabs/System/_InitManager.prefab
UnityContent/Assets/Script/Core/Bootstrap/AppBootstrap.cs   # only if a read-only primary-instance flag is needed
UnityContent/ProjectSettings/EditorBuildSettings.asset   # only if the user's Scene List change is not serialized
```

Possible Unity test files may be added only for Editor/source behavior described in Section 9.

Likely inspected and possibly minimally modified web files:

```text
web/src/components/unity/UnityViewerRuntime.client.tsx
web/src/components/unity/UnityRouteSynchronizer.client.tsx
web/src/lib/unity-bridge.ts
web/src/lib/viewer-routes.ts
web/src/types/viewer.ts
```

Files explicitly not owned by this implementation:

```text
web/public/unity/campus/Build/*
```

`web/src/config/unity-build.ts` and `web/next.config.ts` remain unchanged in this implementation. They may be updated only during a separately authorized post-build packaging step when the matching generated artifacts exist.

## 13. Stop conditions

Stop and report instead of guessing if:

- the active Web profile uses a different scene list than the inspected profile;
- Campus or FloorDetail scene names/paths are ambiguous;
- `_InitManager` cannot safely remain persistent;
- the current route contract differs from Section 5 in uninspected active code;
- adding the receiver directly to `_InitManager` would overwrite unrelated user prefab changes;
- the corrupted Git index prevents establishing a safe baseline for overlapping edits;
- implementation would require a new WebGL artifact to decide how source code should behave;
- future generated filenames or compression settings are needed for a web configuration edit.

Do not resolve these by creating a second Unity runtime or by using the stale build as evidence.

## 14. Required implementation report

The implementing agent must report:

1. Every created and modified file under `UnityContent/`.
2. Every modified file under `web/`.
3. The exact component attached to the `_InitManager` root.
4. The exact `.jslib` export and C# import names.
5. Confirmed event names and example JSON payloads.
6. Route validation rules, including whether `G` remains supported.
7. Scene-list order and whether the user's addition was already serialized or had to be saved again.
8. How latest-request-wins and floor-to-floor idempotence were implemented.
9. Results of only the allowed Unity Editor/source and web checks from Section 9.
10. Confirmation that no WebGL build or public artifact change occurred.
11. Any exact follow-up needed after the user's manual build, without inventing filenames.
12. Explicit confirmation that `.jslib` compilation/linkage and the browser-side `[DllImport]` dispatch remain unverified until the manual WebGL build.
13. The required final status: source implementation complete, manual WebGL rebuild pending, browser integration untested by design.
