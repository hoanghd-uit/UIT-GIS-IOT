# Phase 02 - Campus Floor Click to FloorDetail Scene

## 1. Handover objective

Implement the next small integration milestone for the E-Building Digital Twin project.

Phase 01 is already complete: the Next.js application under web/ runs on localhost, the digital-twin shell is visible, and the Unity Campus WebGL build renders successfully inside the viewer.

At the end of this phase:

- The existing Unity Campus floor hover behavior still works.
- Clicking a Building E HoverableFloor executes its existing OnFloorClicked path.
- Unity sends a validated floor selection to the Next.js application.
- Next.js navigates to a canonical FloorDetail URL.
- The same Unity WebGL runtime and the same canvas switch from Campus to the FloorDetail Unity scene.
- The proof 3D object already present in FloorDetail becomes visible.
- A right-side vertical floor menu is rendered for Building E.
- The menu lists floors 12 through 1 and highlights the selected floor.
- Selecting another menu item updates the URL and active state, while the proof scene remains unchanged.
- A hard refresh on a valid FloorDetail URL restores the FloorDetail scene.
- Browser Back returns the route and Unity scene to Campus, even though a dedicated Campus-return button is not part of this phase.
- Unity and Next.js validation passes without adding a second canvas or Unity runtime.

This phase does not parse, download, or select a real floor model. All FloorDetail routes may show the same proof object.

## 2. Source context

### Repository structure

The outer project directory remains the only Git repository:

~~~text
<repository-root>/
├── .git/
├── UnityContent/
│   ├── Assets/
│   ├── Packages/
│   ├── ProjectSettings/
│   └── ...
└── web/
    ├── public/
    ├── src/
    ├── package.json
    └── ...
~~~

Rules:

- Unity changes belong under UnityContent/.
- Next.js changes belong under web/.
- Do not initialize another Git repository.
- Do not introduce npm workspaces, Turborepo, Nx, or another application package.
- Preserve unrelated user changes in both trees.

### Confirmed Phase 01 baseline

- The current route is /viewer/campus.
- The viewer has a dark navy shell, a compact top bar, and a narrow left rail.
- The Unity Campus scene fills the main viewport.
- The Unity ready state is visible.
- The existing Campus build is served successfully on localhost.
- Building E already contains HoverableFloor behavior.
- HoverableFloor already reaches an OnFloorClicked function when clicked.
- The Unity FloorDetail scene already contains one proof 3D object.

### Visual reference

Use:

- EBuilding_UIT_BEIVN(2).pdf, page 03.
- The supplied FloorDetail mockup screenshot.
- The supplied screenshot of the completed Phase 01 Campus page.

Required visual interpretation:

- Preserve the current shell; do not redesign it.
- Add only the right-side floor navigation panel on FloorDetail routes.
- Panel title: ĐIỀU HƯỚNG TẦNG.
- List Building E floors in descending order: TẦNG 12 through TẦNG 1.
- Use a bright blue filled row for the active floor.
- Use dark navy rows, thin blue-gray borders, white labels, and restrained cyan accents.
- Keep the Unity viewport visually dominant.
- Do not reproduce sensor filters, charts, alarm counts, clock, notifications, bottom telemetry, room labels, or IoT markers from the mockup.

## 3. Binding architecture decisions

These decisions are authoritative for this phase unless preflight proves the current source is structurally incompatible.

### 3.1 One build, one runtime, one canvas

Campus and FloorDetail must be included in one Unity WebGL build.

The phrase FloorDetail canvas means the existing viewer canvas while it is rendering the FloorDetail scene. It does not mean:

- a second HTML canvas;
- a second useUnityContext call;
- a second React Unity WebGL provider;
- a second Unity WebGL build loaded beside the Campus build;
- an iframe;
- unloading and recreating the Unity runtime during normal route navigation.

The Unity context must live under the persistent /viewer layout so it remains mounted when the App Router changes child routes.

If preflight finds that Campus and FloorDetail are intentionally exported as unrelated WebGL builds and cannot be included in one build, stop and request an architecture decision. Do not silently implement two Unity runtimes.

### 3.2 URL is the web navigation source of truth

Use these canonical routes:

| View | Route |
| --- | --- |
| Campus | /viewer/campus |
| Building E floor detail | /viewer/buildings/E/floors/:floorId |

Example:

~~~text
/viewer/buildings/E/floors/7
~~~

The route determines:

- header and breadcrumb text;
- whether the floor panel is visible;
- which floor menu item is active;
- which scene command Next.js sends to Unity.

Do not keep the selected floor only in React local state.

### 3.3 Navigation flow

The browser owns navigation and Unity owns rendering:

1. Unity detects the floor click through HoverableFloor.OnFloorClicked.
2. Unity emits a FloorClicked event to React.
3. React validates the event payload.
4. React pushes the canonical FloorDetail route.
5. A route synchronizer sends the new viewer route back into Unity.
6. Unity asynchronously loads FloorDetail.
7. Unity acknowledges the active scene and selection.
8. Next.js updates the transition status.

Do not have HoverableFloor directly load FloorDetail. Direct scene loading would bypass URL history and break hard-refresh consistency.

### 3.4 Building and floor catalog

For this milestone:

- Supported building ID: E.
- Supported floor IDs: string values 1 through 12.
- Display order: 12 down to 1.
- Display labels: Tầng 12 down to Tầng 1.
- No basement, ground-floor alias, roof, or mezzanine is added.

Define this catalog once in the web project. Do not duplicate twelve hard-coded rows across components.

The Unity floor component must expose or reuse explicit Building E and floor ID metadata. Do not infer the floor solely by parsing a GameObject display name unless the existing project already has an authoritative, tested naming contract.

### 3.5 Floor-to-floor behavior in this milestone

The right panel is an actual navigation menu, not a static illustration.

When another floor is selected:

- the URL changes;
- the active menu item changes;
- the route payload is sent to Unity;
- the active Unity scene remains FloorDetail;
- FloorDetail is not reloaded if it is already active;
- the same proof object remains visible;
- no model, sensor, room, or floor content is parsed.

This establishes navigation state without pretending floor-specific 3D data exists.

### 3.6 Campus return behavior

No dedicated TỔNG QUAN 3D button is required in this phase.

However, the route synchronizer must understand /viewer/campus. Browser Back after a Campus-to-floor transition must restore the Campus scene so the URL and Unity view cannot disagree.

## 4. Scope boundaries

### In scope

- Inspecting and preserving the completed Phase 01 application.
- Defining one typed navigation and bridge contract.
- Connecting HoverableFloor.OnFloorClicked to a WebGL JavaScript plugin.
- Sending a floor click from Unity to React.
- Adding a persistent Unity scene flow controller.
- Adding Campus and FloorDetail to the same Unity Web build scene list.
- Asynchronously switching between Campus and FloorDetail.
- Keeping one Unity context and one canvas mounted across Next.js routes.
- Adding a dynamic FloorDetail route.
- Route-to-Unity synchronization.
- A Building E right-side floor menu with active state.
- Menu-driven route changes among floors without floor data loading.
- Initial-load and scene-transition status.
- Rebuilding the Unity WebGL artifact and updating exact compressed-asset headers when filenames change.
- Lint, build, Unity compile, localhost, browser, and network validation.

### Explicitly out of scope

- Real per-floor 3D model loading or replacement.
- Runtime OBJ, glTF, Addressables, AssetBundles, or remote model APIs.
- Parsing floor geometry or metadata.
- Sensor markers, rooms, HVAC, cameras, telemetry, alarms, charts, filters, or bottom status bars.
- Buildings other than Building E.
- Editing the proof 3D object in FloorDetail.
- A dedicated Campus-return button or TỔNG QUAN 3D button.
- Deep linking to a sensor or room.
- Authentication, authorization, Viewer/Manager/Editor roles, or APIs.
- Scene transition animation beyond a simple status/overlay.
- Multiple Unity builds, canvases, or contexts.
- Public deployment.

## 5. End-to-end flow

~~~mermaid
sequenceDiagram
    participant Floor as HoverableFloor
    participant Bridge as Unity Web Bridge
    participant Router as Next Router
    participant Sync as Route Sync
    participant Scene as SceneFlowController

    Floor->>Bridge: OnFloorClicked(E, 7)
    Bridge->>Router: FloorClicked JSON
    Router->>Router: push floor route
    Router->>Sync: pathname changed
    Sync->>Scene: ApplyViewerRoute JSON
    Scene->>Scene: LoadSceneAsync(FloorDetail)
    Scene-->>Sync: ViewerStateChanged JSON
~~~

Important:

- Route navigation happens before the scene command.
- The route synchronizer also supports direct page load and browser Back.
- The same synchronizer handles menu changes while FloorDetail is already active.

## 6. Interface contract

Do not invent event names or payload shapes independently in Unity and web code. Use the following contract on both sides.

### 6.1 Unity to web event: FloorClicked

Event name:

~~~text
FloorClicked
~~~

Payload is one JSON string:

~~~json
{
  "schemaVersion": 1,
  "buildingId": "E",
  "floorId": "7"
}
~~~

Rules:

- schemaVersion must equal 1.
- buildingId must equal E in this phase.
- floorId must be a canonical string from 1 through 12.
- React ignores malformed, unsupported, or incomplete payloads.
- React never constructs a route from unvalidated input.

### 6.2 Web to Unity command: ApplyViewerRoute

Target GameObject:

~~~text
_InitManager
~~~

Public C# method:

~~~text
ApplyViewerRoute
~~~

The web application calls the existing React Unity WebGL sendMessage API with one JSON string parameter.

Campus payload:

~~~json
{
  "schemaVersion": 1,
  "view": "campus"
}
~~~

FloorDetail payload:

~~~json
{
  "schemaVersion": 1,
  "view": "floor-detail",
  "buildingId": "E",
  "floorId": "7"
}
~~~

Rules:

- Do not call sendMessage before the Unity runtime reports loaded.
- ApplyViewerRoute must be a public instance method on a MonoBehaviour attached to the active _InitManager GameObject.
- The method accepts exactly one string argument.
- Unknown versions, views, buildings, or floors fail safely and do not load a scene.
- Reapplying the already active route is idempotent.
- A later valid route request wins over an older in-flight selection.

### 6.3 Unity to web event: ViewerStateChanged

Event name:

~~~text
ViewerStateChanged
~~~

FloorDetail acknowledgement:

~~~json
{
  "schemaVersion": 1,
  "view": "floor-detail",
  "sceneName": "FloorDetail",
  "buildingId": "E",
  "floorId": "7"
}
~~~

Campus acknowledgement:

~~~json
{
  "schemaVersion": 1,
  "view": "campus",
  "sceneName": "Campus"
}
~~~

Emit the acknowledgement only when:

- the requested scene is active; and
- the latest requested selection has been applied.

For a floor-to-floor route change while FloorDetail is already active, emit a new acknowledgement without reloading the scene.

### 6.4 Unity to web event: ViewerError

Event name:

~~~text
ViewerError
~~~

Minimal payload:

~~~json
{
  "schemaVersion": 1,
  "code": "SCENE_LOAD_FAILED",
  "message": "FloorDetail could not be loaded"
}
~~~

The web UI may show a compact non-sensitive error status. Do not expose stack traces or raw HTML through the payload.

### 6.5 Suggested TypeScript domain types

Use equivalent types that match the existing project conventions:

~~~ts
type BuildingId = "E";
type ViewerView = "campus" | "floor-detail";

type FloorClickedPayload = {
  schemaVersion: 1;
  buildingId: BuildingId;
  floorId: string;
};

type ViewerRoute =
  | { schemaVersion: 1; view: "campus" }
  | {
      schemaVersion: 1;
      view: "floor-detail";
      buildingId: BuildingId;
      floorId: string;
    };
~~~

Do not use a blind type assertion after JSON.parse. Parse unknown input, validate its shape and supported values, and only then narrow the type.

## 7. Expected code organization

Inspect the real Phase 01 paths before editing. Reuse equivalent existing files and do not create duplicate abstractions solely to match this example.

Suggested final organization:

~~~text
<repository-root>/
├── UnityContent/
│   └── Assets/
│       ├── Plugins/
│       │   └── WebGL/
│       │       └── ViewerBridge.jslib
│       └── Scripts/
│           ├── Interaction/
│           │   └── HoverableFloor.cs
│           ├── Bridge/
│           │   └── WebViewerBridge.cs
│           └── Navigation/
│               └── SceneFlowController.cs
└── web/
    ├── public/
    │   └── unity/
    │       └── campus/
    │           ├── Build/
    │           └── StreamingAssets/
    └── src/
        ├── app/
        │   └── viewer/
        │       ├── layout.tsx
        │       ├── campus/
        │       │   └── page.tsx
        │       └── buildings/
        │           └── [buildingId]/
        │               └── floors/
        │                   └── [floorId]/
        │                       └── page.tsx
        ├── components/
        │   ├── floor/
        │   │   └── FloorNavigationPanel.tsx
        │   └── unity/
        │       ├── UnityViewerRuntime.client.tsx
        │       ├── UnityViewerCanvas.client.tsx
        │       └── UnityRouteSynchronizer.client.tsx
        ├── config/
        │   ├── buildings.ts
        │   └── unity-build.ts
        ├── lib/
        │   ├── viewer-routes.ts
        │   └── unity-bridge.ts
        └── types/
            └── viewer.ts
~~~

Notes:

- Keeping the existing public/unity/campus URL is acceptable for this phase, even though the rebuilt artifact contains both scenes. This avoids an unrelated public-path migration.
- Rename CampusUnityCanvas to a neutral viewer name only when needed to make its new responsibility clear.
- Update imports atomically; do not leave both old and new canvas components mounted.
- Keep route construction and route parsing in one module.
- Keep the Building E floor catalog in one config module.
- Keep JSON validation separate from presentation components.

## 8. Execution protocol

Implement checkpoint by checkpoint. Do not complete every change and defer all testing until the end.

For every checkpoint:

1. Read the root and subtree AGENTS.md files when present.
2. Inspect existing code before adding a new file.
3. Preserve unrelated working-tree changes.
4. Make only the changes listed for that checkpoint.
5. Run the checkpoint checks.
6. Fix failures before continuing.
7. Record actual commands, versions, filenames, and deviations.
8. Commit only if the repository workflow allows it; otherwise report the suggested commit boundary.

Do not delete or replace a working WebGL build until the new combined build has been validated in a separate output directory.

---

## Checkpoint 0 - Preflight and Phase 01 regression baseline

### Purpose

Confirm the real source structure, current Unity integration, installed versions, and clean baseline before changing either application.

### Run from the outer Git root

~~~bash
pwd
git rev-parse --show-toplevel
git status --short
test -d UnityContent/Assets
test -f web/package.json
test ! -d UnityContent/.git
test ! -d web/.git
node --version
npm --version
~~~

Inspect relevant code with ripgrep:

~~~bash
rg -n "class HoverableFloor|OnFloorClicked|SceneManager|FloorDetail" UnityContent/Assets
rg -n "useUnityContext|react-unity-webgl|CampusUnityCanvas|ViewerShell" web/src
rg -n "unity/campus|loaderUrl|dataUrl|frameworkUrl|codeUrl" web/src web/next.config.*
~~~

Record:

- Unity Editor version from ProjectSettings/ProjectVersion.txt.
- Next.js version.
- react-unity-webgl version.
- the current owner of useUnityContext.
- the current canvas component path.
- current Unity WebGL filenames and compression mode.
- current OnFloorClicked signature and how a floor ID is represented.
- exact Campus and FloorDetail scene asset paths.
- whether _InitManager or another persistent manager already exists.

Run the Phase 01 regression checks:

~~~bash
npm --prefix web run lint
npm --prefix web run build
npm --prefix web run dev
~~~

Open:

~~~text
http://localhost:3000/viewer/campus
~~~

Confirm:

- Campus loads.
- exactly one canvas exists;
- Unity ready appears;
- camera controls work;
- Building E hover still works;
- no relevant Console or Network errors exist.

### Stop conditions

Stop and report before implementing when:

- the current directory is not the shared outer Git root;
- Phase 01 no longer runs;
- UnityContent is not a valid Unity project;
- the FloorDetail scene asset is missing;
- HoverableFloor or OnFloorClicked cannot be identified;
- there is already an unrelated bridge or scene controller whose ownership is unclear;
- Campus and FloorDetail belong to intentionally separate WebGL applications;
- nested Git repositories exist;
- unrelated dirty changes overlap the files that must be edited.

### Acceptance

- The working baseline is reproduced.
- Actual file and GameObject names are recorded.
- The implementer knows which existing components will be extended or renamed.

Suggested commit boundary: none.

---

## Checkpoint 1 - Add the shared web navigation contract

### Purpose

Define valid buildings, floors, routes, and JSON parsers before connecting live Unity events.

### Web changes

Add or extend:

- a Building E config with floors 12 through 1;
- a canonical route builder;
- a route parser for Campus and FloorDetail;
- safe parsers for FloorClicked, ViewerStateChanged, and ViewerError payloads;
- shared TypeScript types.

Required behavior:

- buildFloorRoute("E", "7") returns /viewer/buildings/E/floors/7.
- only E is valid.
- only canonical strings 1 through 12 are valid.
- 07, 0, 13, empty strings, arrays, and arbitrary strings are invalid.
- JSON parse errors are handled without throwing through the React render tree.
- route builders accept validated domain values, not arbitrary URLs.

If a test runner already exists, add focused unit tests for route and payload validation. Do not add a large test framework solely for this checkpoint.

### Verification

~~~bash
npm --prefix web run lint
npm --prefix web run build
~~~

If the project has a test script:

~~~bash
npm --prefix web test
~~~

### Acceptance

- All route and payload rules have one source of truth.
- No UI or Unity behavior has changed.
- Unsupported values cannot become router destinations.

Suggested commit boundary:

~~~text
feat(web): define viewer navigation contract
~~~

---

## Checkpoint 2 - Emit FloorClicked from Unity WebGL

### Purpose

Connect the existing OnFloorClicked function to a browser event without changing scene navigation yet.

### Unity changes

First inspect HoverableFloor and preserve its existing:

- hover highlight;
- pointer or mouse detection;
- material restoration;
- click filtering;
- public methods used by scenes or tests.

Add a small WebGL bridge layer. Suggested responsibilities:

#### WebViewerBridge.cs

- Serialize the versioned FloorClicked payload.
- Call a matching native WebGL function only for UNITY_WEBGL and not UNITY_EDITOR.
- Log a concise editor message in other environments so the flow can be tested in Play Mode.
- Keep browser-specific interop out of HoverableFloor.

#### ViewerBridge.jslib

- Live under an Assets/Plugins/WebGL-compatible path.
- Convert the incoming UTF-8 string pointer with UTF8ToString.
- Call window.dispatchReactUnityEvent with event name FloorClicked.
- Wrap dispatch in try/catch so a standalone Unity page or missing React host does not crash.
- Use the same function name and signature as the C# DllImport declaration.

#### HoverableFloor.cs

- Reuse existing serialized building/floor metadata when available.
- Otherwise add explicit serialized metadata for buildingId and floorId.
- In OnFloorClicked, call WebViewerBridge with the clicked selection.
- Do not load a Unity scene directly.
- Do not parse the GameObject name if explicit metadata is available.
- Do not emit more than one event for one accepted click.

Assign and verify the correct floor ID on every clickable Building E floor object. A visually highlighted floor with missing metadata is not acceptable.

### Editor verification

- Unity scripts compile without errors.
- Clicking a configured floor in Play Mode reaches the editor fallback log once.
- The logged building and floor match the object clicked.
- Hover visuals still enter and restore correctly.
- No DllNotFoundException occurs in the Editor.

### Temporary WebGL verification

After a development WebGL build is available, React can temporarily log the validated FloorClicked event. Remove temporary logs or gate them behind development mode before final handoff.

### Acceptance

- OnFloorClicked emits one versioned selection event.
- Existing hover/click behavior remains intact.
- No scene transition has been introduced at this checkpoint.

Suggested commit boundary:

~~~text
feat(unity): emit Building E floor click event for web
~~~

---

## Checkpoint 3 - Add a persistent Unity scene flow controller

### Purpose

Give the existing Unity runtime one idempotent entry point for applying browser routes.

### Unity scene setup

- Reuse an existing persistent initialization object if it has clear ownership.
- Otherwise create exactly one root GameObject named _InitManager in Campus.
- Attach SceneFlowController to it.
- Keep the exact GameObject name stable because sendMessage targets it by name.
- Mark the manager DontDestroyOnLoad.
- Add a singleton guard so returning to Campus cannot create two live managers.
- Do not add another _InitManager to FloorDetail.

### SceneFlowController behavior

Implement a public instance method:

~~~csharp
public void ApplyViewerRoute(string payloadJson)
~~~

It must:

1. Safely deserialize the route payload.
2. Validate schemaVersion, view, building ID, and floor ID.
3. Map campus only to the Campus scene.
4. Map floor-detail only to the FloorDetail scene.
5. Use SceneManager.LoadSceneAsync with single-scene behavior when a scene change is required.
6. Reject or queue duplicate commands while a load is in progress.
7. Retain the latest valid requested floor selection.
8. Avoid reloading FloorDetail when only floorId changes.
9. Emit ViewerStateChanged after the requested state is active.
10. Emit ViewerError on a handled failure.

Do not load model data inside ApplyViewerRoute.

### Scene list

In the active Web build scene list:

1. Campus is included and remains the first startup scene.
2. FloorDetail is included and enabled.
3. Scene names are unique.
4. The controller uses exact scene names or unambiguous full paths.

### Editor verification

Test the controller in Play Mode without the browser:

- applying the floor-detail payload loads FloorDetail;
- the proof object is visible;
- _InitManager survives;
- applying a different valid floor payload does not reload FloorDetail;
- applying the Campus payload loads Campus;
- only one _InitManager remains;
- malformed JSON does not change the active scene;
- an unsupported floor does not change the active scene.

Use a temporary editor-only invocation method, inspector action, or test harness consistent with the project. Do not ship a debug overlay or keyboard shortcut unless it already belongs to the project.

### Acceptance

- Scene switching works in the Unity Editor.
- The controller is persistent, idempotent, and validates input.
- FloorDetail shows only its existing proof content.

Suggested commit boundary:

~~~text
feat(unity): add persistent viewer scene controller
~~~

---

## Checkpoint 4 - Export and serve the combined WebGL build

### Purpose

Produce one WebGL build that contains both scenes before changing the React routing layer.

### Build procedure

- Use the same Unity Web platform settings that made Phase 01 successful.
- Keep the existing compression policy unless there is a recorded reason to change it.
- Build to a clean, task-specific output directory outside web/public.
- Confirm the generated build starts in Campus.
- Confirm both scene assets are included.
- Record the full loader, data, framework, and wasm filenames.
- Record whether the artifact is Brotli, gzip, Unity decompression fallback, or uncompressed.

Do not build directly over the last known-good public files.

### Replace the hosted build

After the output is validated:

- replace only the owned Unity runtime files under web/public/unity/campus/;
- copy StreamingAssets only when generated;
- remove stale files from the previous build only after the configured new URLs work;
- update web/src/config/unity-build.ts with exact filenames;
- update exact Next.js response header rules when compressed filenames change;
- do not rename compressed files manually;
- do not copy Unity source assets into web/public;
- do not use Unity's generated index.html.

### Brotli and MIME checks

The Phase 01 hosting rules still apply. A rebuilt data file can be larger because it now contains FloorDetail; this is expected.

For Brotli files, verify:

- data returns Content-Encoding: br and an octet-stream content type;
- framework returns Content-Encoding: br and a JavaScript content type;
- wasm returns Content-Encoding: br and Content-Type: application/wasm.

Adapt the checks for gzip, Unity fallback, or uncompressed output.

Example:

~~~bash
npm --prefix web run dev
curl -I "http://localhost:3000/unity/campus/Build/<exact-loader>"
curl -I "http://localhost:3000/unity/campus/Build/<exact-data>"
curl -I "http://localhost:3000/unity/campus/Build/<exact-framework>"
curl -I "http://localhost:3000/unity/campus/Build/<exact-wasm>"
~~~

### Browser regression

Before adding new web navigation:

- /viewer/campus still loads;
- the Campus scene is the initial scene;
- exactly one canvas exists;
- hover and camera input still work;
- Console has no loader, decompression, MIME, or WebAssembly errors.

### Stop conditions

- A required runtime file is missing.
- Campus is no longer the startup scene.
- FloorDetail was omitted from the build.
- a compressed file returns the wrong Content-Encoding;
- wasm returns the wrong MIME type;
- a runtime URL returns HTML or 404;
- the new build cannot reproduce the Phase 01 Campus page.

### Acceptance

- One hosted build contains Campus and FloorDetail.
- Campus remains fully functional before the web bridge is enabled.
- Exact build filenames and compression settings are recorded.

Suggested commit boundary:

~~~text
chore(web): update Unity build with FloorDetail scene
~~~

---

## Checkpoint 5 - Make the Unity runtime persistent across viewer routes

### Purpose

Refactor context ownership separately from live scene navigation.

### Web changes

Move or preserve the single useUnityContext owner so it is mounted by web/src/app/viewer/layout.tsx or a client component directly owned by that layout.

Required component responsibilities:

#### UnityViewerRuntime.client.tsx

- Own exactly one useUnityContext call.
- Expose only the required Unity APIs to internal child components.
- Preserve existing initial loading progress.
- Track scene-transition status separately from initial WebGL loading.
- Render the shell, canvas, and route-specific overlay children.

#### UnityViewerCanvas.client.tsx

- Render exactly one Unity component.
- Fill the existing viewport.
- Preserve input behavior.
- Do not call useUnityContext again.

#### viewer/layout.tsx

- Remain the stable parent for all /viewer child routes.
- Keep the runtime mounted while switching between /viewer/campus and FloorDetail routes.
- Place route-specific UI above or beside the canvas without covering it with a full pointer-catching layer.

If the current CampusUnityCanvas already has the correct persistent ownership, refactor minimally. Do not rename files for aesthetics alone.

### Temporary route

Create the FloorDetail dynamic route with a minimal placeholder overlay if required to prove persistence, but do not add the final floor panel yet.

### Verification

Navigate client-side between:

~~~text
/viewer/campus
/viewer/buildings/E/floors/7
~~~

At this checkpoint the scene may still remain Campus.

Confirm:

- the canvas DOM node is not duplicated;
- only one WebGL runtime exists;
- loader/data/framework/wasm are not fetched again because of the route change;
- the initial loading overlay does not restart;
- Campus input still works.

Run:

~~~bash
npm --prefix web run lint
npm --prefix web run build
~~~

### Acceptance

- Route changes do not remount Unity.
- Exactly one canvas remains.
- No final scene bridge logic is required yet.

Suggested commit boundary:

~~~text
refactor(web): persist Unity runtime across viewer routes
~~~

---

## Checkpoint 6 - Connect Unity floor click to route and route to scene

### Purpose

Complete the smallest end-to-end Campus to FloorDetail transition.

### Unity-to-React listener

In the persistent runtime:

- get addEventListener and removeEventListener from the existing Unity context;
- register one stable FloorClicked callback in an effect;
- remove the same callback during cleanup;
- parse the incoming JSON string as unknown;
- validate it with the shared contract;
- ignore unsupported payloads with a concise development warning;
- call router.push with the canonical floor route and scroll disabled;
- ignore a duplicate event targeting the current URL.

Cleanup is mandatory because React development mode can expose duplicate-effect bugs.

### Route-to-Unity synchronizer

Create one route synchronizer under the persistent viewer runtime.

It must:

- derive ViewerRoute from the current pathname;
- wait until Unity is loaded;
- send ApplyViewerRoute to _InitManager;
- send once per canonical route change;
- resend the current route after the initial WebGL load, enabling hard refresh;
- avoid loops when ViewerStateChanged acknowledges the same route;
- apply Campus when the route is /viewer/campus;
- reject invalid dynamic routes before sending Unity commands;
- use latest-route-wins behavior during a scene transition.

Do not call sendMessage from the FloorNavigationPanel. The panel changes the route; the synchronizer is the only route-to-Unity writer.

### State acknowledgement

Register and clean up ViewerStateChanged and ViewerError listeners.

Status examples:

| State | Label |
| --- | --- |
| WebGL initial load | Loading Unity 0-100% |
| Campus ready | Campus ready |
| Route changed, Unity not acknowledged | Loading FloorDetail |
| FloorDetail acknowledged | FloorDetail ready |
| Handled bridge/scene failure | Unable to load FloorDetail |

Do not hide the canvas during the entire transition. A restrained overlay or status chip is enough.

### Required end-to-end verification

1. Open /viewer/campus.
2. Wait for Unity ready.
3. Click a known Building E floor, such as floor 7.
4. Confirm exactly one FloorClicked event.
5. Confirm URL becomes /viewer/buildings/E/floors/7.
6. Confirm the same canvas remains mounted.
7. Confirm Unity loads FloorDetail.
8. Confirm the proof 3D object is visible.
9. Confirm FloorDetail ready appears only after acknowledgement.

Then:

1. Use Browser Back.
2. Confirm URL returns to /viewer/campus.
3. Confirm Unity returns to Campus.
4. Confirm there is still one runtime and one canvas.

### Acceptance

- An actual Unity floor click drives a client-side Next.js route.
- The route drives the Unity scene.
- URL and scene remain synchronized on forward navigation and Browser Back.

Suggested commit boundary:

~~~text
feat(viewer): navigate from Campus floor click to FloorDetail
~~~

---

## Checkpoint 7 - Add the FloorDetail right-side floor menu

### Purpose

Implement only the floor navigation panel from the page 03 reference.

### Route page

For web/src/app/viewer/buildings/[buildingId]/floors/[floorId]/page.tsx:

- validate both dynamic parameters against the shared catalog;
- redirect invalid values to /viewer/campus, or follow the repository's existing invalid-route convention if one is already established;
- render no second canvas;
- render FloorNavigationPanel as route-specific overlay content;
- supply the validated building and active floor.

Match the installed Next.js version when reading dynamic route params. Do not copy an outdated params signature blindly.

### Panel content

Required:

- title: ĐIỀU HƯỚNG TẦNG;
- Building E context;
- twelve menu items;
- descending order from Tầng 12 to Tầng 1;
- active floor visibly highlighted;
- each inactive item links to its canonical route;
- active item has aria-current="page";
- links preserve browser history;
- route prefetch may be disabled to avoid prefetching all twelve nearly identical routes;
- clicking the active item is a no-op.

Not required:

- TỔNG QUAN 3D button;
- sensors or status counts;
- a building mini-map;
- icons from the low-resolution PDF;
- model changes per floor.

### Panel layout

- Position the panel inside the main viewport at the right edge.
- Use a width near 220-250 px, adjusted with CSS clamp if useful.
- Leave a restrained inset from the viewport border.
- Give the panel a dark opaque or nearly opaque navy surface.
- Use a thin blue-gray border and modest corner radius.
- Allow the list itself to scroll if vertical space is constrained.
- At the supported minimum desktop viewport of 1024 x 768, all controls must remain reachable.
- The overlay wrapper may use pointer-events: none, but the panel and links must use pointer-events: auto.
- Areas outside the panel must continue passing pointer input to Unity.
- Maintain visible focus styling for keyboard users.
- Do not add gradients or excessive glow.

### Header and breadcrumb

Update route-derived viewer labels without redesigning the bar.

Recommended FloorDetail breadcrumb:

~~~text
Tòa nhà E / Tầng 7 / Chi tiết tầng
~~~

Campus keeps its current label.

### Floor-to-floor verification

From floor 7:

1. Select Tầng 8.
2. Confirm URL changes to /viewer/buildings/E/floors/8.
3. Confirm Tầng 8 becomes active.
4. Confirm Tầng 7 becomes inactive.
5. Confirm the Unity runtime and canvas do not remount.
6. Confirm FloorDetail is not reloaded.
7. Confirm the proof object remains visible.
8. Confirm no real floor data request occurs.

### Acceptance

- The panel matches the page 03 visual direction.
- All twelve Building E floors are present once.
- Active and keyboard focus states are clear.
- The panel captures only its own input.
- Floor menu navigation changes route/selection but not 3D data.

Suggested commit boundary:

~~~text
feat(web): add Building E floor navigation panel
~~~

---

## Checkpoint 8 - Hard refresh, invalid input, and race handling

### Purpose

Verify the bridge behaves correctly outside the ideal single-click path.

### Hard-refresh checks

Open directly:

~~~text
http://localhost:3000/viewer/buildings/E/floors/7
~~~

Expected sequence:

1. Next.js renders the FloorDetail shell and active floor menu.
2. The Unity WebGL runtime initially boots its configured startup scene, Campus.
3. Once Unity is loaded, the route synchronizer sends the floor-detail route.
4. Unity loads FloorDetail.
5. The proof object appears.
6. ViewerStateChanged confirms FloorDetail floor 7.

There must not be a second Unity runtime or a page reload.

### Invalid input checks

Verify:

~~~text
/viewer/buildings/E/floors/0
/viewer/buildings/E/floors/13
/viewer/buildings/E/floors/07
/viewer/buildings/X/floors/7
~~~

They must not send a scene command with unsupported data.

Also dispatch or simulate:

- invalid JSON;
- missing schemaVersion;
- unsupported schemaVersion;
- missing floorId;
- floorId outside 1 through 12;
- unknown building.

The application must not navigate, crash, or execute arbitrary URLs.

### Duplicate and rapid-action checks

- Double-click one Campus floor.
- Quickly choose two different floor menu items.
- Navigate Back and Forward.

Expected:

- no duplicated listener behavior;
- no duplicate canvas;
- no repeated scene reload for FloorDetail-to-FloorDetail selection;
- the final route and final acknowledged selection agree;
- one in-flight scene change cannot leave the old route active.

### Acceptance

- Direct URLs, history navigation, invalid payloads, and rapid selection remain safe and deterministic.

Suggested commit boundary:

~~~text
fix(viewer): harden Unity route synchronization
~~~

---

## Checkpoint 9 - Final validation

### Automated web checks

Run from the outer Git root:

~~~bash
npm --prefix web run lint
npm --prefix web run build
~~~

Run the existing test script when present.

### Unity checks

- Unity opens the project without import errors.
- Unity Console has no compile errors.
- Campus Play Mode works.
- FloorDetail Play Mode shows the proof object.
- both scenes are enabled in the active Web build scene list;
- a clean WebGL build completes.

### Browser acceptance matrix

| Case | Expected result |
| --- | --- |
| Open /viewer/campus | Campus renders in one canvas |
| Hover Building E floor | Existing highlight still works |
| Click Building E floor 7 | URL changes to floor 7 and FloorDetail loads |
| FloorDetail loads | Existing proof 3D object is visible |
| Floor panel | Floors 12 through 1 appear once |
| Active floor | Route floor is highlighted |
| Select floor 8 | URL/active state changes; proof scene stays |
| Click outside panel | Input reaches Unity |
| Browser Back | URL and Unity return to Campus |
| Browser Forward | URL and Unity return to FloorDetail |
| Hard refresh floor 7 | FloorDetail restores after Unity initialization |
| Invalid route/event | No invalid Unity command or crash |
| Resize to 1024 x 768 | Canvas and panel remain usable |

### Console and Network checks

Console must have no relevant:

- Unity loader errors;
- WebAssembly errors;
- Brotli or MIME errors;
- DllImport/bridge errors;
- SendMessage receiver errors;
- duplicate React key errors;
- hydration errors;
- duplicate listener symptoms;
- scene-not-in-build errors.

Network must show:

- HTTP 200 for current loader/data/framework/wasm files;
- correct compression and MIME headers;
- no HTML fallback returned for a Unity binary;
- no second set of Unity runtime downloads during client-side route changes.

### Evidence to retain

- Unity version.
- Next.js and react-unity-webgl versions.
- exact scene asset paths.
- exact WebGL build filenames and compression mode.
- lint result.
- production build result.
- Unity build result.
- one Campus screenshot before click.
- one FloorDetail screenshot showing the proof object and right floor panel.
- one short note confirming the canvas stayed mounted.

Suggested final commit boundary:

~~~text
test(viewer): verify Campus to FloorDetail navigation
~~~

## 9. Definition of Done

The phase is complete only when every applicable statement is true:

- [ ] The outer repository remains the only Git root.
- [ ] Phase 01 Campus behavior still passes.
- [ ] Campus and FloorDetail are in one Unity Web build.
- [ ] Campus remains the startup scene.
- [ ] Exactly one Unity runtime exists.
- [ ] Exactly one canvas exists.
- [ ] The Unity runtime stays mounted across viewer route changes.
- [ ] HoverableFloor.OnFloorClicked preserves its existing interaction behavior.
- [ ] Every clickable Building E floor has explicit valid floor metadata.
- [ ] Unity emits one valid FloorClicked event for one accepted click.
- [ ] React registers and removes bridge listeners correctly.
- [ ] Unsupported event payloads do not navigate.
- [ ] The canonical FloorDetail route is /viewer/buildings/E/floors/:floorId.
- [ ] Clicking a Campus floor changes the URL without a full page reload.
- [ ] The route synchronizer is the only web component sending viewer routes to Unity.
- [ ] _InitManager and SceneFlowController survive a scene change.
- [ ] ApplyViewerRoute loads FloorDetail asynchronously.
- [ ] The FloorDetail proof object is visible.
- [ ] ViewerStateChanged acknowledges the active Unity state.
- [ ] Browser Back restores Campus and keeps URL/scene synchronized.
- [ ] A valid hard-refreshed FloorDetail URL restores the scene.
- [ ] The right panel appears only for FloorDetail routes.
- [ ] The panel lists Building E floors 12 through 1 exactly once.
- [ ] The selected floor has a clear active state.
- [ ] Floor links are keyboard accessible.
- [ ] Panel interactions do not block the rest of the Unity canvas.
- [ ] Selecting a different floor changes URL and active state.
- [ ] FloorDetail is not reloaded for a floor-only selection change.
- [ ] No real floor model or IoT data is loaded.
- [ ] Current WebGL files have correct compression and MIME headers.
- [ ] npm lint passes.
- [ ] npm production build passes.
- [ ] Unity compiles and produces a clean WebGL build.
- [ ] Browser Console contains no relevant errors.

## 10. Required implementation handoff report

The implementing agent must report:

1. Files created, renamed, and changed in UnityContent/.
2. Files created, renamed, and changed in web/.
3. The actual HoverableFloor metadata strategy.
4. The actual _InitManager GameObject and SceneFlowController component paths.
5. Confirmed event names and JSON payload examples.
6. The final route structure.
7. The exact Unity, Next.js, and react-unity-webgl versions.
8. The exact WebGL filenames and compression mode.
9. Any next.config header changes.
10. Commands and Unity build actions performed.
11. Lint, build, Unity compile, and browser results.
12. Evidence that one runtime and one canvas remained mounted.
13. Any warning, deviation, or unresolved issue.
14. Explicit confirmation that real floor model/data loading was not implemented.

## 11. Deferred follow-up milestone

Create a separate plan after Phase 02 is accepted for:

- replacing the proof object with actual per-floor content;
- defining model IDs and floor asset manifests;
- FloorDetail-to-FloorDetail data/model replacement;
- loading progress and failure recovery for floor assets;
- adding the explicit TỔNG QUAN 3D return control if desired;
- sensor, room, and IoT overlays.

Do not begin those tasks during this phase.

## 12. Technical references

- React Unity WebGL - Unity to React event system:
  https://react-unity-webgl.dev/docs/api/event-system
- React Unity WebGL - React to Unity sendMessage:
  https://react-unity-webgl.dev/docs/api/send-message
- Unity - interaction with browser scripting:
  https://docs.unity3d.com/Manual/web-interacting-browser-js.html
- Unity - SceneManager.LoadSceneAsync:
  https://docs.unity3d.com/ScriptReference/SceneManagement.SceneManager.LoadSceneAsync.html
- Unity 6 - manage scenes in a build:
  https://docs.unity3d.com/6000.0/Documentation/Manual/build-profile-scene-list.html
- Next.js App Router - useRouter:
  https://nextjs.org/docs/app/api-reference/functions/use-router
- Next.js App Router - useParams:
  https://nextjs.org/docs/app/api-reference/functions/use-params
