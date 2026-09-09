# Phase 01 - Next.js Shell + Unity Campus WebGL Canvas

## 1. Handover objective

Implement the first, deliberately small integration milestone for the E-Building Digital Twin project.

At the end of this plan:

- A new Next.js project exists directly under `web/` and runs locally.
- The page uses a dark digital-twin shell inspired by the supplied proposal mockups.
- The supplied Unity WebGL Campus build archive is hosted by the Next.js project.
- One Unity instance is rendered inside one responsive canvas.
- Opening `http://localhost:3000` ultimately displays the Unity `Campus` scene.
- Loading progress and a clear ready state are visible.
- `npm run lint` and `npm run build` pass.

This milestone does **not** implement scene switching or the Unity-to-Next.js floor-click bridge.

## 2. Source context and binding decisions

### Repository structure - authoritative update

- The outermost project directory is the single Git repository root.
- Unity source lives under `UnityContent/` (`Assets/`, `Packages/`, `ProjectSettings/`, and related Unity project files).
- Next.js must be initialized directly under `web/`.
- `UnityContent/` and `web/` share the root `.git/` and Git history.
- Do not initialize `.git/` inside either child directory.
- Treat this as a repository-level monorepo for this phase. Do not add npm workspaces, Turborepo, Nx, or a root Node `package.json`; all npm commands run inside `web/`.

### Current Unity state

- Unity scene `Campus` loads the full UIT campus model.
- Only floors under `Building_E` currently participate in the hover/click feature.
- `HoverableFloor.OnFloorClicked` already exists or is implemented in the Unity source, but it is not connected to Next.js in this milestone.
- Unity scene `FloorDetail` exists with a proof-of-visual 3D object, but it is out of scope for this milestone.

### Visual reference

Use `EBuilding_UIT_BEIVN(2).pdf`, especially the dark 3D viewer mockups on pages 3, 5, and 6.

Visual direction for this milestone:

- Dark navy application background.
- Slightly lighter navy panels.
- Bright blue as the primary UI color.
- Cyan accents for active/technical states.
- White main text and blue-gray secondary text.
- Compact top bar and left navigation rail framing a large central 3D viewport.
- Do not reproduce sample IoT values, alarms, charts, floor statistics, or sensor markers yet.
- Do not extract low-resolution logos from the PDF. Use a text product mark unless proper logo assets are supplied separately.

Suggested initial design tokens (approximate visual references, not official brand values):

```css
:root {
  --app-bg: #061525;
  --panel-bg: #0b2238;
  --panel-elevated: #102b47;
  --canvas-bg: #020a12;
  --primary: #168bff;
  --accent-cyan: #22c7e8;
  --text-primary: #f4f8fc;
  --text-muted: #8fa8bd;
  --border: rgba(78, 163, 225, 0.25);
  --success: #2ecf7f;
  --danger: #ff646f;
}
```

## 3. Scope boundaries

### In scope

- Next.js initialization.
- TypeScript, App Router, ESLint, Tailwind CSS, and `src/` structure.
- A reusable viewer shell.
- A client-only Unity canvas component.
- Importing the supplied Campus WebGL build archive.
- Handling Brotli or Unity decompression-fallback build files correctly on localhost.
- Loading progress, ready state, and minimal error guidance.
- Local verification and a production compilation check.

### Explicitly out of scope

- `Campus <-> FloorDetail` switching.
- `FloorDetail <-> FloorDetail` switching.
- Calling Next.js from `OnFloorClicked`.
- `WebBridge.cs`, `.jslib`, or JSON navigation contracts.
- Authentication or Viewer/Manager/Editor permission logic.
- IoT APIs, LoRaWAN, sensors, alarms, charts, or dashboards.
- Runtime OBJ loading, Addressables, AssetBundles, or model upload.
- Interaction with buildings other than `Building_E`.
- Deployment to a public environment.

Do not expand the implementation beyond these boundaries, even if future folders are prepared by name.

## 4. Expected repository layout

The repository has exactly one Git root and two top-level content directories. Initialize Next.js directly into the existing or newly created lowercase `web/` directory. Never create it inside `UnityContent/` or `UnityContent/Assets/`.

```text
<repository-root>/
├── .git/                                  # the only Git repository
├── .gitignore                             # preserve/merge existing root rules
├── UnityContent/
│   ├── Assets/
│   ├── Packages/
│   ├── ProjectSettings/
│   └── ...                                # existing Unity project content
└── web/
    ├── public/
    │   └── unity/
    │       └── campus/
    │           ├── Build/
    │           └── StreamingAssets/       # only when present in the archive
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx
    │   │   ├── globals.css
    │   │   └── viewer/
    │   │       ├── layout.tsx
    │   │       └── campus/
    │   │           └── page.tsx
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── ViewerShell.tsx
    │   │   └── unity/
    │   │       ├── CampusUnityCanvas.client.tsx
    │   │       └── CampusUnityCanvasLoader.client.tsx
    │   └── config/
    │       └── unity-build.ts
    ├── next.config.ts
    ├── package.json
    └── README.md
```

Architecture constraint:

- The browser application root is `web/`; its `package.json`, `next.config.ts`, `public/`, and `src/` must not be placed at the outer Git root.
- Run npm lifecycle commands from `web/`, or use `npm --prefix web <command>` from the Git root.
- `create-next-app` must use `--disable-git`, because the outer Git repository already owns both child directories.
- The Unity canvas must be owned by `viewer/layout.tsx` through `ViewerShell`, not permanently tied to `viewer/campus/page.tsx`.
- This prepares the canvas to remain mounted when later milestones add more `/viewer/...` routes.
- For this milestone, `viewer/campus/page.tsx` can contain only Campus-specific overlay content or an empty fragment.

## 5. Execution protocol for the implementing agent

Work checkpoint by checkpoint. Do not implement all checkpoints and test only at the end.

For every checkpoint:

1. Make only the listed changes.
2. Run the checkpoint verification.
3. Fix failures before continuing.
4. Record the actual commands used and any deviation from this plan.
5. Preserve unrelated existing files and changes.

Read and obey the outer root `AGENTS.md` first when present. Also inspect any more-specific `AGENTS.md` under `UnityContent/` or `web/` before changing files in those trees.

---

## Checkpoint 0 - Preflight and input validation

### Purpose

Confirm that the local environment and Unity archive are usable before creating application code.

### Commands

Run from the outer Git repository root:

```bash
pwd
git status --short
git rev-parse --show-toplevel
test -d UnityContent/Assets
test -d UnityContent/Packages
test -d UnityContent/ProjectSettings
find UnityContent web -type d -name .git -prune -print 2>/dev/null
find web -mindepth 1 -maxdepth 1 -print 2>/dev/null | sed -n '1,80p'
node --version
npm --version
```

Requirements:

- Node.js must be `20.9.0` or newer.
- npm must be available.
- `git rev-parse --show-toplevel` must resolve to the current outer project root.
- `UnityContent/` must look like a Unity project and must remain untouched by the Next.js initialization.
- `web/` must either be absent or empty enough for `create-next-app` to initialize safely.
- The nested `.git` search must return no result. If it finds `UnityContent/.git` or `web/.git`, stop and report instead of deleting it automatically.
- Preserve the current root `.gitignore`. Later, confirm that both Unity-generated folders and Next-generated folders are ignored, using root and/or child `.gitignore` rules.

Define the archive path with a task-specific variable and inspect it without modifying the original:

```bash
CAMPUS_WEBGL_ZIP="/absolute/path/to/Campus-WebGL.zip"
test -f "$CAMPUS_WEBGL_ZIP"
unzip -l "$CAMPUS_WEBGL_ZIP" | sed -n '1,160p'
```

The archive should contain a Unity Web build with at least:

- One `*.loader.js` file.
- One data file: `*.data`, `*.data.br`, `*.data.gz`, or `*.data.unityweb`.
- One framework file: `*.framework.js` with the corresponding compression extension when applicable.
- One code file: `*.wasm` with the corresponding compression extension when applicable.
- Optional `StreamingAssets/`.

`index.html` and `TemplateData/` may exist but are not required by the React canvas integration.

### Stop conditions

Stop and report instead of guessing when:

- The Unity archive is missing.
- The current directory is not the outer Git repository root.
- `UnityContent/Assets`, `UnityContent/Packages`, or `UnityContent/ProjectSettings` is missing.
- A nested `.git/` exists under either content directory.
- `web/` contains files that would be overwritten or conflict with `create-next-app`.
- The archive is a Unity source project rather than a WebGL/Web build.
- Any required loader/data/framework/wasm file is missing.
- The archive contains multiple unrelated builds and the Campus build cannot be identified.
- The default scene inside the build is not `Campus`.

### Checkpoint acceptance

- Node/npm versions are recorded.
- The shared outer Git root is confirmed.
- `UnityContent/` is confirmed as the existing Unity project.
- `web/` is confirmed as the safe Next.js initialization target.
- No nested Git repository exists.
- The exact Campus build filenames and compression mode are recorded.

---

## Checkpoint 1 - Initialize the Next.js project only

### Purpose

Create a clean Next.js shell before adding Unity or visual customization.

### Command

Run this from the outer Git repository root:

```bash
npx create-next-app@latest web \
  --typescript \
  --eslint \
  --tailwind \
  --app \
  --src-dir \
  --turbopack \
  --import-alias "@/*" \
  --use-npm \
  --agents-md \
  --disable-git \
  --yes
```

The lowercase directory name `web` is also a valid npm package name, so no temporary scaffold or move step is required.

`--disable-git` is mandatory. It prevents `create-next-app` from creating a second repository inside `web/`.

If `web/` contains pre-existing files, do not overwrite or delete them. Inspect and report the conflict. If `web/` exists but is empty, it remains the required target.

Then verify the untouched scaffold:

```bash
test ! -d web/.git
node -p "require('./web/package.json').name"
git status --short
cd web
npm run dev
```

Open:

```text
http://localhost:3000
```

Stop the development server normally after verification.

### Checkpoint acceptance

- The default Next.js page loads at localhost.
- There are no terminal compilation errors.
- `web/package.json` exists and uses the lowercase package name `web`.
- `web/.git` does not exist.
- From the outer root, `git status --short` reports the scaffold under `web/` as part of the shared repository.
- No Unity package or Unity files have been added yet.

Suggested commit boundary:

```text
chore(web): initialize Next.js application shell
```

---

## Checkpoint 2 - Install the Unity React adapter

### Purpose

Install only the dependency needed to mount a Unity Web build in React.

### Commands

```bash
cd web
npm install react-unity-webgl
npm ls react-unity-webgl
```

Record the exact resolved version in the implementation report. Do not install unrelated state-management, component-library, icon, chart, authentication, or API packages.

### Checkpoint acceptance

- `react-unity-webgl` is present in `package.json` and the lockfile.
- `npm ls react-unity-webgl` exits successfully.
- The default Next.js page still runs.

Suggested commit boundary:

```text
chore(web): add Unity WebGL React adapter
```

---

## Checkpoint 3 - Add the visual application shell without Unity

### Purpose

Build and verify the PDF-inspired shell independently from Unity loading.

### Required route behavior

- `/` redirects to `/viewer/campus` using the App Router redirect utility.
- `/viewer/campus` displays the viewer shell.
- `viewer/layout.tsx` owns the persistent viewer shell.

### Required layout

- Full viewport height using `100dvh`.
- Compact left rail.
- Top bar containing:
  - Product label: `Digital Twin - Tòa nhà E, UIT`.
  - Breadcrumb/status label: `Campus`.
  - A static `Preparing viewer` status chip at this checkpoint.
- Main viewport panel fills all remaining space.
- Temporary centered placeholder: `Unity Campus canvas will load here`.
- Responsive behavior down to `1024 x 768`.

### Visual constraints

- Use the design tokens from section 2.
- Keep the 3D viewport visually dominant.
- Avoid glass effects, gradients, or neon effects that are not present in the reference.
- Use thin blue-gray borders and restrained shadows.
- No fake dashboard numbers or charts.
- Text must remain legible against the dark background.

### Verification

```bash
npm run lint
npm run dev
```

Verify both:

```text
http://localhost:3000
http://localhost:3000/viewer/campus
```

### Checkpoint acceptance

- Root redirects to the Campus route.
- Shell matches the dark navy/blue visual direction.
- There is no horizontal or page-level vertical overflow at desktop viewport sizes.
- Unity has not been integrated yet.

Suggested commit boundary:

```text
feat(web): add digital twin viewer shell
```

---

## Checkpoint 4 - Extract and validate the Unity Campus build

### Purpose

Place the verified WebGL runtime assets in the public directory without depending on Unity's generated `index.html`.

### Safe extraction workflow

From `web/`:

```bash
CAMPUS_WEBGL_ZIP="/absolute/path/to/Campus-WebGL.zip"
CAMPUS_EXTRACT_DIR="$(mktemp -d)"
unzip -q "$CAMPUS_WEBGL_ZIP" -d "$CAMPUS_EXTRACT_DIR"
find "$CAMPUS_EXTRACT_DIR" -maxdepth 4 -type f | sort | sed -n '1,200p'
```

After identifying the archive's actual web-build root:

```bash
mkdir -p public/unity/campus
cp -a "$CAMPUS_EXTRACT_DIR/<actual-build-root>/Build" public/unity/campus/
```

If present:

```bash
cp -a "$CAMPUS_EXTRACT_DIR/<actual-build-root>/StreamingAssets" public/unity/campus/
```

Do not copy or use the generated Unity `index.html`. Do not rename compressed runtime files blindly; the loader and config must use their exact exported filenames.

Inspect the copied result:

```bash
find public/unity/campus -maxdepth 3 -type f | sort
```

### Compression classification

Choose exactly one path based on the actual files:

#### Case A - Brotli without fallback

Expected suffixes:

```text
.data.br
.framework.js.br
.wasm.br
```

Record the exact filenames. `next.config.ts` must later return:

| Asset | Required response headers |
| --- | --- |
| `*.data.br` | `Content-Encoding: br`, `Content-Type: application/octet-stream` |
| `*.framework.js.br` | `Content-Encoding: br`, `Content-Type: application/javascript` |
| `*.wasm.br` | `Content-Encoding: br`, `Content-Type: application/wasm` |

For this milestone, use exact exported file paths in `next.config.ts` rather than a broad rule that could incorrectly mark uncompressed files as Brotli.

#### Case B - Unity decompression fallback

Expected suffix:

```text
.unityweb
```

Use the exact `.unityweb` URLs in the Unity config. Do not add `Content-Encoding: br`, because the Unity JavaScript fallback owns decompression.

#### Case C - Uncompressed

Expected suffixes:

```text
.data
.framework.js
.wasm
```

No `Content-Encoding` override is required. Ensure the wasm response uses `Content-Type: application/wasm`.

#### Case D - gzip

Treat it equivalently to Brotli but use `Content-Encoding: gzip` and the actual `.gz` paths.

### Checkpoint acceptance

- Only the intended Campus build is under `public/unity/campus/`.
- The four runtime URLs are known.
- Compression mode is explicitly documented.
- No source Unity project, unrelated build, or large archive file was copied into `public/`.

Suggested commit boundary:

```text
chore(web): add Campus Unity WebGL build assets
```

---

## Checkpoint 5 - Create a single source of truth for Unity build URLs

### Purpose

Prevent hard-coded build paths from being duplicated across React components.

Create:

```text
src/config/unity-build.ts
```

It must export one Campus configuration using the exact filenames discovered in Checkpoint 4:

```ts
export const campusUnityBuild = {
  loaderUrl: "/unity/campus/Build/<actual-name>.loader.js",
  dataUrl: "/unity/campus/Build/<actual-name>.data.br",
  frameworkUrl: "/unity/campus/Build/<actual-name>.framework.js.br",
  codeUrl: "/unity/campus/Build/<actual-name>.wasm.br",
  streamingAssetsUrl: "/unity/campus/StreamingAssets",
} as const;
```

The `.br` suffixes above are only an example. They must match the actual archive. Omit `streamingAssetsUrl` if the folder does not exist.

For a Brotli build without fallback, update `next.config.ts` with exact-path headers for the copied data, framework, and wasm files. Restart `npm run dev` after changing `next.config.ts`.

Use this shape, replacing every placeholder with the exact exported filename:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/unity/campus/Build/<exact-data-file>.data.br",
        headers: [
          { key: "Content-Encoding", value: "br" },
          { key: "Content-Type", value: "application/octet-stream" },
        ],
      },
      {
        source: "/unity/campus/Build/<exact-framework-file>.framework.js.br",
        headers: [
          { key: "Content-Encoding", value: "br" },
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
      {
        source: "/unity/campus/Build/<exact-code-file>.wasm.br",
        headers: [
          { key: "Content-Encoding", value: "br" },
          { key: "Content-Type", value: "application/wasm" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

Do not leave placeholder values in the implemented file. If Unity generated hashed names, use those complete hashed names.

### HTTP verification

With the development server running, request each configured URL:

```bash
curl -I "http://localhost:3000/unity/campus/Build/<actual-name>.loader.js"
curl -I "http://localhost:3000/unity/campus/Build/<actual-name>.data.br"
curl -I "http://localhost:3000/unity/campus/Build/<actual-name>.framework.js.br"
curl -I "http://localhost:3000/unity/campus/Build/<actual-name>.wasm.br"
```

Adapt suffixes to the real build.

For Brotli, confirm:

- Every request returns HTTP `200`.
- Compressed files return `Content-Encoding: br`.
- The wasm file returns `Content-Type: application/wasm`.
- The framework file returns a JavaScript MIME type.
- No Unity asset request returns a Next.js HTML page.

### Stop conditions

- Do not continue to React integration while a runtime URL returns `404`.
- Do not work around Brotli errors by modifying compressed bytes.
- If the hosting layer cannot return the required headers, report it and request either server configuration or a Unity rebuild with `Decompression Fallback` enabled.

### Checkpoint acceptance

- All Unity runtime asset URLs are reachable directly from localhost.
- Response headers match the archive's compression mode.

---

## Checkpoint 6 - Render Unity inside the shell

### Purpose

Replace the placeholder with one responsive Unity canvas while retaining the shell.

### Component responsibilities

#### `CampusUnityCanvas.client.tsx`

- Must be a Client Component.
- Calls `useUnityContext(campusUnityBuild)`.
- Renders exactly one `<Unity>` component.
- Owns the progress overlay and the `Loading Unity` / `Unity ready` status chip inside the viewport panel, using `isLoaded` and `loadingProgression`.
- Canvas fills its parent while preserving a sensible minimum size.
- Do not create a second Unity context.
- Do not use an iframe.
- Do not access the unsafe Unity instance API.
- Do not add messaging or scene-switch logic.

#### `CampusUnityCanvasLoader.client.tsx`

- Must be a Client Component.
- Uses `next/dynamic` with `{ ssr: false }` to load `CampusUnityCanvas.client.tsx`.
- Supplies a lightweight dark loading fallback during JavaScript module loading.

#### `ViewerShell.tsx`

- Places the loader component in the main viewport panel.
- Supplies the static navigation rail, header, product title, and viewport frame.
- Does not create a second loading state or second Unity context.
- Allows the canvas component's loading/status layer to occupy the viewport without obstructing it after loading.

### Required user experience

Initial state:

```text
Loading Campus
[progress bar] 0-100%
```

Ready state:

```text
Unity ready
```

The loading overlay should fade/remove only after the Unity application reports loaded. Do not use a fixed timeout.

### CSS requirements

- The outer viewer uses `overflow: hidden`.
- The canvas container uses `min-width: 0` and `min-height: 0` inside grid/flex layouts.
- The canvas visibly fills the viewport panel.
- The page must not resize repeatedly as loading progresses.
- UI layers that do not contain controls should use `pointer-events: none` once Unity is ready.
- Keep the native Campus mouse/camera interactions usable.

### Checkpoint acceptance

- One canvas is present in the DOM.
- The Unity Campus scene becomes visible.
- Loading percentage advances based on Unity loading progression.
- The loading layer disappears only after Unity reports ready.
- Mouse input reaches the Unity canvas.
- Existing Building E hover behavior still works in the browser.

Suggested commit boundary:

```text
feat(web): render Unity Campus build in viewer canvas
```

---

## Checkpoint 7 - Final localhost validation

### Automated commands

Run from `web/`:

```bash
npm run lint
npm run build
npm run dev
```

Next.js currently treats lint and build as separate checks, so both commands must run.

### Browser checks

Open `http://localhost:3000` in a supported desktop browser and verify:

1. The browser redirects to `/viewer/campus`.
2. The dark digital-twin shell renders before Unity is ready.
3. Loading progress is visible and does not freeze without an error.
4. The Campus scene appears inside the central canvas.
5. There is exactly one canvas and one Unity runtime instance.
6. Campus camera input works.
7. Hovering floors of `Building_E` still produces the existing light-yellow highlight.
8. No floor click is expected to navigate to `FloorDetail` yet.
9. Browser Console has no WebGL loader, MIME, Brotli, hydration, or React key errors.
10. Browser Network shows HTTP `200` for loader, data, framework, wasm, and any StreamingAssets requests.
11. Hard refresh on `/viewer/campus` still succeeds.
12. Resizing the window does not create page scrollbars or collapse the canvas.

### Brotli-specific browser checks

When the archive uses `.br`:

- Inspect the data, framework, and wasm responses in DevTools.
- Confirm `Content-Encoding: br`.
- Confirm wasm uses `Content-Type: application/wasm`.
- Confirm the response body is not an HTML error/fallback document.

### Evidence to retain

- Terminal output showing `npm run lint` passed.
- Terminal output showing `npm run build` passed.
- One screenshot of the finished localhost Campus viewer.
- Exact Next.js and `react-unity-webgl` versions.
- Actual Unity build filenames and detected compression mode.

Suggested final commit boundary:

```text
test(web): verify localhost Campus WebGL shell
```

---

## 6. Final Definition of Done

The milestone is complete only when all statements are true:

- [ ] The outer project directory is the only Git root.
- [ ] Unity remains under `UnityContent/` with its existing project structure preserved.
- [ ] A Next.js project exists directly under `web/`.
- [ ] Neither `UnityContent/.git` nor `web/.git` exists.
- [ ] No npm workspace/Turborepo/Nx layer was added at the outer root.
- [ ] TypeScript, App Router, ESLint, Tailwind, `src/`, and `@/*` alias are configured.
- [ ] `http://localhost:3000` redirects to `/viewer/campus`.
- [ ] The shell visually follows the dark navy/blue proposal direction.
- [ ] The supplied Unity Campus Web build is stored under `web/public/unity/campus/`.
- [ ] Compression mode and exact asset filenames are documented.
- [ ] Brotli/gzip headers are correct when compressed files are used.
- [ ] Exactly one Unity runtime and one canvas are mounted.
- [ ] The actual Campus scene renders successfully on localhost.
- [ ] Existing Unity camera and Building E hover input work.
- [ ] A real Unity loading indicator is shown.
- [ ] No scene-switching, floor navigation, auth, IoT, or dashboard scope has leaked into the implementation.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Browser Console contains no relevant errors.

## 7. Required implementation handoff report

When finished, the implementing agent must report:

1. Files created or changed.
2. Commands run.
3. Exact dependency versions.
4. Unity archive structure and actual configured URLs.
5. Compression mode and HTTP header verification result.
6. Lint/build results.
7. Browser verification result.
8. Any unresolved warning or deviation.
9. Explicit confirmation that scene switching and bridge work were not implemented.

## 8. Likely next milestone, not part of this plan

After this plan is accepted, create a separate plan for:

- Persistent `_InitManager` and `SceneFlowController` in Unity.
- Unity-to-Next.js `floor.clicked` event.
- Next.js route synchronization.
- `Campus -> FloorDetail` navigation.
- `FloorDetail -> FloorDetail` model replacement.
- Browser Back/Forward handling.

Do not begin that milestone during this implementation.

## 9. Technical references

- Next.js installation: https://nextjs.org/docs/app/getting-started/installation
- `create-next-app` CLI: https://nextjs.org/docs/app/api-reference/cli/create-next-app
- React Unity WebGL configuration: https://react-unity-webgl.dev/docs/main-concepts/unity-config
- React Unity WebGL loading state: https://react-unity-webgl.dev/docs/api/is-loaded
- Unity Web build deployment and compression: https://docs.unity3d.com/Manual/webgl-deploying.html
- Unity server configuration examples: https://docs.unity3d.com/Manual/webgl-server-configuration-code-samples.html
