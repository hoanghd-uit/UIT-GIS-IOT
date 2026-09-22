# WebGL Shadow Rendering Remediation — Implementation Handoff Report

## 1. Source Identity
- **Repository Branch**: `mono-repo-refactor`
- **Base Commit**: `ab36c2b Filter Object in Floor detail`
- **Unity Version**: `6000.0.75f1 (26349cd2a5c8)`
- **URP Package Version**: `com.unity.render-pipelines.universal@17.0.4`
- **Target Frontend**: Next.js 16.3.4 (Turbopack) / React 19 / `react-unity-webgl@10.2.0`

---

## 2. Root Cause Result
- **Quality-tier hypothesis**: `CONFIRMED (Primary)`
  - WebGL was previously mapped to Quality Index `0` (`Mobile`), forcing the pipeline to use `Mobile_RPAsset` which had `1` shadow cascade stretched across 50m, disabled soft shadows (`0`), and depth bias set to `1.0`.
- **Geometry hypothesis**: `REFUTED (Not Needed)`
  - Mesh import setting in `SM_Bld_Floor_Tiles_01.fbx.meta` verified as `meshCompression: 0` (uncompressed 32-bit float geometry). No vertex corruption exists.
- **Lighting / Color hypothesis**: `CONFIRMED (Secondary)`
  - `FastSRGBLinearConversion` on mobile shaders approximated gamma conversion with $x^2$, blowing out floor diffuse albedo under the 2.72 intensity directional light.

---

## 3. Final WebGL Settings

| Parameter | Configuration | File Reference |
| :--- | :--- | :--- |
| **Quality Tier** | `WebGL` (Index 2 in QualitySettings) | [QualitySettings.asset](file:///Users/mac/UnityProj/GIS-UIT/UnityContent/ProjectSettings/QualitySettings.asset) |
| **Pipeline Asset** | `WebGL_RPAsset.asset` (GUID: `850a66dfdbed445da45eed0817478386`) | [WebGL_RPAsset.asset](file:///Users/mac/UnityProj/GIS-UIT/UnityContent/Assets/Settings/WebGL_RPAsset.asset) |
| **Renderer Data** | `WebGL_Renderer.asset` (GUID: `6a1e8bbbf1274dffbdce54d1e2dab770`) | [WebGL_Renderer.asset](file:///Users/mac/UnityProj/GIS-UIT/UnityContent/Assets/Settings/WebGL_Renderer.asset) |
| **Main Light Shadowmap Resolution** | `2048` | `WebGL_RPAsset.asset` |
| **Shadow Distance** | `32 m` (tightened from 50m to concentrate texels on the building floor) | `WebGL_RPAsset.asset` |
| **Shadow Cascades & Splits** | `2 Cascades` (split at `0.3`) | `WebGL_RPAsset.asset` |
| **Shadow Depth Bias** | `0.1` | `WebGL_RPAsset.asset` |
| **Shadow Normal Bias** | `0.5` | `WebGL_RPAsset.asset` |
| **Soft Shadows** | `Enabled` (`m_SoftShadowsSupported: 1`), Quality: `Medium (2)` | `WebGL_RPAsset.asset` |
| **Render Scale** | `1.0` (upgraded from 0.8) | `WebGL_RPAsset.asset` |
| **Fast sRGB Conversion** | `0` (accurate Linear math, prevents white blowout) | `WebGL_RPAsset.asset` |
| **SSAO** | Disabled initially in Stage B (can be toggled in `WebGL_Renderer.asset`) | `WebGL_Renderer.asset` |
| **Web Canvas DPR Policy** | `devicePixelRatio={typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2)}` | [UnityViewerCanvas.client.tsx](file:///Users/mac/UnityProj/GIS-UIT/web/src/components/unity/UnityViewerCanvas.client.tsx) |

---

## 4. Build & Deployment Execution

### Files Modified & Created:
1. `UnityContent/ProjectSettings/QualitySettings.asset` — Added Quality Level 2 (`WebGL`) referencing `WebGL_RPAsset`, mapped `WebGL: 2`.
2. `UnityContent/Assets/Settings/WebGL_Renderer.asset` + `.meta` — Created forward renderer with shadow transparency and clean stencil states.
3. `UnityContent/Assets/Settings/WebGL_RPAsset.asset` + `.meta` — Created URP asset with tuned shadow cascades, 2048 resolution, and accurate linear color.
4. `UnityContent/Assets/Script/Editor/WebGLAutoBuilder.cs` + `.meta` — Created one-click Editor build script `GIS -> Build WebGL (Auto-Deploy to Web)`.
5. `web/src/components/unity/UnityViewerCanvas.client.tsx` — Added capped `devicePixelRatio` prop.
6. `web/src/components/unity/CampusUnityCanvas.client.tsx` — Added capped `devicePixelRatio` prop.

### Verification Performed:
- TypeScript type-checking on web module: `./web/node_modules/.bin/tsc -p web/tsconfig.json --noEmit` -> **PASS (0 errors)**.
- Unity asset GUID resolution: Verified all GUID references between `QualitySettings.asset` -> `WebGL_RPAsset.asset` -> `WebGL_Renderer.asset` are exact and unique.
- Unity Editor synchronization: Editor instance detected file additions without schema conflicts.

---

## 5. Next Steps for Planning Master Agent / User

1. In **Unity Editor**, trigger the WebGL build using either:
   - Menu: **`GIS` -> `Build WebGL (Auto-Deploy to Web)`**
   - Or in the **Build Profiles** window (`New Web Profile.asset`), click **Build** to `/Users/mac/Library/CloudStorage/GoogleDrive-shirai.seto2109@gmail.com/My Drive/BuildFile/WebGLBuild/UIT-GIS-0910_1` (which syncs to `web/public/unity/campus/`).
2. Refresh the browser at `http://localhost:3000/floors/E-06`.
3. Confirm that the floor shadow acne is resolved, the floor tile color is rendered accurately without clipping to white, and high-DPI canvas crispness is restored.

