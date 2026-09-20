---
document_id: GIS-UIT-WEBGL-SHADOW-FIX-PLAN-REVISED
version: "1.1.0"
created_on: "2026-09-20"
project: GIS - UIT Building E Digital Twin
title: Revised WebGL Shadow / Floor Artifact Fix Plan
status: ready_for_implementation
target_agent: Coding / Implementation Agent
implementation_performed_in_this_document: false
supersedes: GIS-UIT-WEBGL-SHADOW-INVESTIGATION-PLAN v1.0.0
---

# Revised WebGL Shadow / Floor Artifact Fix Plan

## 0. Purpose

Implement a controlled fix for the visual mismatch between the Unity Editor floor view and the WebGL build used by the Next.js viewer.

Observed in the Web viewer:
- repeated jagged / diamond-like dark patches on floor surfaces,
- overly bright / washed-out floor appearance,
- weaker object grounding/contact shading,
- lower overall image crispness than the Editor view.

This plan accepts the previous repository investigation as the current source-level baseline, but corrects several causal claims and changes the implementation order so each suspected cause is isolated and verified before adding more expensive rendering features.

---

## 1. Reviewed conclusions

### 1.1 Findings accepted as high-confidence

The previous investigation found that WebGL is mapped to a lower-quality URP configuration than the Editor/Standalone path. If the repository still contains the reported values, this is the strongest root-cause candidate and should be tested first.

Reported differences:

| Setting | WebGL / Mobile | Editor / PC | Assessment |
| --- | ---: | ---: | --- |
| Main light shadow map | 1024 | 2048 | Strong contributor to coarse shadow edges |
| Shadow cascades | 1 | 4 | Strong contributor at oblique indoor views |
| Shadow distance | 50 m | 50 m | Too broad for a floor-detail scene if most visible geometry is much nearer |
| Soft shadows | disabled | enabled | Strong contributor to hard/jagged shadow edges |
| Render scale | 0.8 | 1.0 | Explains lower image sharpness, not the shadow pattern by itself |
| SSAO renderer feature | absent | present | Explains weaker contact grounding, not the floor artifact itself |

### 1.2 Geometry-compression hypothesis

Keep the previous conclusion **only if re-verified in current HEAD**:

- if the relevant floor FBX imports still show `meshCompression: 0`, mesh compression is not a credible primary cause;
- no geometry remediation should be performed unless the WebGL build shows actual vertex/normal corruption independent of lighting/shadows.

Do **not** re-export or alter floor meshes as part of the first fix pass.

### 1.3 Correction: shadow bias interpretation

The previous plan overstated the claim that a large depth bias directly causes "shadow acne".

In URP, Depth Bias and Normal Bias are controls used to mitigate self-shadowing/acne. Excessively large bias more commonly produces detached shadows, light leakage, or peter-panning. Therefore:

- treat the reported `Depth Bias = 1.0` / `Normal Bias = 1.0` as suspicious and worth tuning,
- do **not** assume lowering bias alone is the primary cure,
- change bias only after shadow resolution/cascade/soft-shadow parity has been tested.

### 1.4 Correction: Fast sRGB / Linear conversion

`Fast sRGB/Linear conversion` uses a faster, less accurate approximation. It can contribute to tonal mismatch, but there is not enough evidence to treat it as the main cause of the nearly white floor.

Therefore:

- classify it as a secondary color-fidelity variable,
- test it after the shadow artifact is fixed,
- do not couple it to the first shadow-quality change.

### 1.5 Correction: SSAO

SSAO should be treated as an **optional visual-grounding enhancement**, not part of the minimum fix for the diamond/jagged shadow artifact.

Adding SSAO too early makes it harder to determine whether the primary shadow defect was actually solved and may increase GPU cost on WebGL.

### 1.6 Frontend DPR assessment

Adding an explicit Unity canvas `devicePixelRatio` can improve sharpness on high-DPI displays, but it does not explain the specific floor shadow pattern.

It should be implemented as a separate rendering-quality step after the shadow configuration is stable, and its GPU cost must be measured.

---

## 2. Revised root-cause priority

Use this order during implementation and verification:

1. **WebGL quality/URP profile mismatch** — primary.
2. **Low shadow-map resolution + single cascade + large shadow distance** — primary.
3. **Hard shadows instead of filtered soft shadows** — primary.
4. **Shadow bias values** — secondary tuning after 1-3.
5. **Render scale / canvas DPR** — image-resolution issue, separate from shadow topology.
6. **Lighting / exposure / color conversion** — separate tonal issue.
7. **Missing SSAO** — optional grounding enhancement.
8. **Mesh/geometry corruption** — currently low probability; investigate only if artifacts persist with shadows disabled or with a diagnostic parity profile.

---

## 3. Implementation strategy

Do **not** jump directly from the current Mobile profile to a fully enhanced renderer.

Use a two-stage approach:

### Stage A — diagnostic parity test

Temporarily make WebGL use rendering settings that are as close as practical to the current PC profile.

Purpose: prove or disprove that the artifact is caused by the WebGL quality/URP profile rather than geometry.

Preferred diagnostic method:

1. In a local test branch only, map WebGL to the existing PC quality tier **or** clone the PC URP asset into a temporary WebGL diagnostic asset.
2. Build WebGL.
3. Capture the exact same floor/camera view.
4. Compare against current broken WebGL and Editor.

**Pass condition:** the diamond/jagged floor artifacts disappear or materially reduce.

If Stage A produces no material improvement, stop before SSAO/DPR work and investigate scene light/shadow receivers, shader variants, and WebGL graphics/API behavior.

### Stage B — dedicated WebGL profile

After Stage A confirms the hypothesis, create a dedicated WebGL URP configuration instead of permanently reusing the full PC profile.

Recommended starting configuration:

| Setting | Start value | Notes |
| --- | --- | --- |
| Main light shadows | enabled | Required |
| Main light shadow resolution | 2048 | First fidelity target |
| Shadow cascades | 2 | Start with 2 for WebGL cost control |
| Cascade split | approximately 0.25-0.35 | Tune visually to floor-detail camera ranges |
| Shadow distance | 25-30 m | Measure scene/camera bounds before final value |
| Soft shadows | enabled | Required for smoother edges |
| Soft shadow quality | Low or Medium | Start Low; move to Medium only if needed |
| Depth bias | use PC value as baseline | Do not hard-code until current PC asset is re-read |
| Normal bias | use PC value as baseline | Tune for leakage / detachment |
| Render scale | 1.0 initially | Later performance tuning allowed |
| Fast sRGB conversion | keep current initially | Toggle only in tonal-debug pass |
| SSAO | off initially | Add only after primary fix verified |

Do not assume 4 cascades + High soft shadows are necessary. The target is acceptable fidelity for an indoor floor scene at stable WebGL performance, not exact feature parity at any cost.

---

## 4. Required repository checks before editing

The implementing agent must verify the current HEAD rather than trusting values copied from the previous investigation.

Record actual current values from:

```text
UnityContent/ProjectSettings/QualitySettings.asset
UnityContent/.../Mobile_RPAsset.asset
UnityContent/.../PC_RPAsset.asset
UnityContent/.../Mobile_Renderer.asset
UnityContent/.../PC_Renderer.asset
UnityContent/Assets/Scene/FloorDetail.unity
web/src/components/unity/UnityViewerCanvas.client.tsx
```

Also locate the exact pipeline asset paths from Graphics/Quality settings instead of assuming filenames.

Verify:

- WebGL default quality tier/index,
- URP asset assigned to that tier,
- shadow resolution,
- shadow distance,
- cascade count/splits,
- soft shadow support/quality,
- renderer feature list,
- main Directional Light shadow mode and whether per-light custom bias is enabled,
- render scale,
- color space / post-processing configuration,
- canvas DPR behavior,
- relevant floor mesh import compression and normal settings.

If any reported values differ from current HEAD, update this plan's implementation notes before changing code/assets.

---

## 5. Implementation tasks

### T1 — create diagnostic baseline evidence

Before changes:

1. Record Git branch + HEAD.
2. Build or use the current WebGL artifact.
3. Capture floor 6 at the same route and approximately the same orbit camera pose used in the reported screenshot.
4. Record browser, OS, display DPR, window size, and WebGL canvas backing resolution if available.
5. Capture Unity Editor Game/Scene reference from the same content.

Output:

```text
before_webgl.png
editor_reference.png
baseline_settings.md or implementation log section
```

### T2 — run temporary PC-parity diagnostic

Temporarily apply the PC-quality rendering path to WebGL without changing geometry.

Build and inspect.

Record one of:

- `CONFIRMED`: artifact materially disappears/reduces,
- `PARTIAL`: artifact improves but remains,
- `REFUTED`: no material improvement.

Do not leave a temporary PC remap as the final implementation unless explicitly justified by measured WebGL performance.

### T3 — create dedicated WebGL URP asset/renderer

If T2 is `CONFIRMED` or `PARTIAL`:

1. Duplicate the appropriate URP asset and renderer into clearly named project assets, e.g.
   - `WebGL_RPAsset.asset`
   - `WebGL_Renderer.asset`
2. Preserve GUID/reference integrity using Unity asset operations.
3. Assign the dedicated WebGL asset via Quality Settings / platform mapping.
4. Start with the Stage B values in Section 3.
5. Do not add SSAO yet.

### T4 — tune shadow distance/cascades first

Use the smallest practical shadow distance that covers the visible floor-detail scene under normal zoom.

Test in this order:

1. 2048 shadow map, 2 cascades, 30 m.
2. Reduce distance toward 25 m if all relevant shadows remain visible.
3. Adjust cascade split if near-camera floor shadows still alias.
4. Only move to 4 cascades if 2 cascades remain visibly insufficient and GPU cost is acceptable.

Avoid changing bias during this first tuning pass unless the scene becomes unusable.

### T5 — tune soft shadows

Enable soft shadows.

Start with Low quality. Compare floor edges and furniture shadows.

Move to Medium only if Low visibly fails the acceptance criteria.

Do not default to High without profiling.

### T6 — tune bias only after T4/T5

Compare against current PC values.

Tune only enough to remove:

- self-shadow acne,
- light leaking at wall/floor contacts,
- detached/peter-panned shadows.

Keep a short table of tested depth/normal bias values and screenshots. Avoid arbitrary magic numbers copied from the old plan.

### T7 — tonal / overexposure debug pass

Once shadow topology is fixed, investigate the white floor independently.

Test one variable at a time:

1. Compare floor material/albedo in Editor Game view vs WebGL.
2. Verify Directional Light intensity and Environment Lighting are identical at runtime.
3. Verify active Volume / post-processing stack.
4. Toggle Fast sRGB/Linear conversion and compare screenshots.
5. If needed, adjust lighting/exposure/material only after confirming the render-path mismatch is not the cause.

Do not reduce light intensity globally merely to hide the shadow problem.

### T8 — canvas sharpness / DPR

After the Unity render settings are stable, update the React Unity canvas only if current behavior is genuinely under-resolved.

Preferred implementation pattern:

```tsx
const dpr = typeof window === "undefined"
  ? 1
  : Math.min(window.devicePixelRatio || 1, 2);

<Unity
  unityProvider={unityProvider}
  devicePixelRatio={dpr}
  className="h-full w-full outline-none"
  tabIndex={1}
/>
```

Before committing, verify the installed `react-unity-webgl` version supports the prop/signature used by the repository.

Measure GPU/frame impact at DPR 1, 1.5 (if implementation allows), and capped 2 on the target machine. If 2 materially hurts performance, use a lower cap.

### T9 — optional SSAO enhancement

Only after the primary defect is fixed and baseline performance is known:

1. Add Screen Space Ambient Occlusion to `WebGL_Renderer.asset` only if contact grounding is still insufficient.
2. Start with conservative quality/intensity/radius values.
3. Verify furniture contact improvement.
4. Measure frame-time impact.

If performance cost is disproportionate, leave SSAO disabled; it is not required for the shadow-artifact fix.

---

## 6. Geometry fallback investigation

Run this section **only if the artifact persists after the diagnostic parity test**.

### G1 — disable main light shadows temporarily

If the diamond pattern disappears when main-light shadows are disabled, the artifact is in the shadow path, not mesh topology.

### G2 — unlit/material diagnostic

Render the floor temporarily with an Unlit diagnostic material or shader.

- If the geometry looks clean: mesh topology/vertex precision is unlikely to be the cause.
- If the same geometric pattern remains: inspect vertex data, normals, tangents, z-fighting, overlapping coplanar floor meshes, and importer behavior.

### G3 — overlapping floor surfaces / z-fighting

Specifically verify whether Floor 6 has duplicate/copanar floor polygons or decals/planes occupying nearly identical depth. Z-fighting can present differently across APIs and should be checked before re-exporting meshes.

### G4 — importer verification

Verify current import settings for all relevant floor meshes:

- mesh compression,
- index format,
- normals,
- tangents,
- optimize mesh,
- read/write only if relevant.

Do not change these settings without a reproduced geometry-specific failure.

---

## 7. Verification matrix

The fix is not complete from a single screenshot.

Test at minimum:

| Case | Required |
| --- | --- |
| Floor 6, current reported camera angle | Yes |
| Floor 6, closer zoom | Yes |
| Floor 6, farther zoom | Yes |
| Another available detailed floor prefab | Yes if available |
| Chrome/Chromium desktop | Yes |
| High-DPI display | Yes |
| Normal-DPI / DPR 1 emulation or display | Preferable |
| WebGL after hard refresh / clean load | Yes |
| Current Editor reference | Yes |

For each final candidate profile record:

- average FPS or frame time after scene settles,
- canvas resolution,
- DPR,
- shadow settings,
- whether artifacts are visible,
- whether floor is clipped/washed out,
- whether obvious shadow detachment/light leak exists.

---

## 8. Acceptance criteria

### Visual correctness

1. The repeated jagged/diamond dark artifacts visible across the floor in the original WebGL screenshot are no longer present at normal viewing distance.
2. Main wall/furniture shadows have stable edges without severe aliasing.
3. No obvious peter-panning or large light-leak gaps are introduced by bias tuning.
4. Floor albedo/material remains readable; large surfaces are not uniformly clipped to pure white unless the source material intentionally is white.
5. WebGL view is materially closer to the Editor reference while preserving the existing scene/model layout.

### Architecture / regression

1. No geometry/prefab re-export unless the fallback investigation proves a mesh issue.
2. Existing one-runtime / one-canvas viewer architecture remains unchanged.
3. No navigation, filter, Addressables, floor-loading, or URL-route regressions.
4. WebGL uses an explicit, maintainable quality/pipeline configuration rather than accidental inheritance from the Mobile tier.

### Performance

1. Record actual WebGL frame-time/FPS before and after on the target development laptop/desktop.
2. Avoid a large sustained regression from unnecessary 4-cascade / High-soft-shadow / SSAO / DPR-2 combination.
3. If a setting is expensive, prefer the lowest setting that satisfies visual acceptance.

---

## 9. Rollback and commit structure

Prefer separable commits so regressions can be bisected:

1. `fix(unity): add WebGL URP quality profile`
2. `fix(unity): tune WebGL floor shadows`
3. `fix(web): use capped Unity canvas device pixel ratio` — only if retained
4. `feat(unity): add WebGL SSAO grounding` — optional, separate

Do not mix mesh edits, floor filter work, backend work, or unrelated prefab cleanup into these commits.

---

## 10. Required implementation handoff output

After implementation, return a short technical report containing:

```text
Source identity
- branch
- commit(s)
- Unity version
- URP package version
- browser tested

Root cause result
- quality-tier hypothesis: CONFIRMED / PARTIAL / REFUTED
- geometry hypothesis: CONFIRMED / REFUTED / NOT NEEDED

Final WebGL settings
- pipeline asset
- renderer
- shadow resolution
- distance
- cascades/splits
- soft shadow quality
- depth/normal bias
- render scale
- fast sRGB setting
- SSAO setting
- canvas DPR policy

Verification
- before screenshot
- after screenshot
- Editor reference
- FPS/frame-time before/after
- commands/build method used
- tests/regressions checked

Remaining limitations
- any residual aliasing
- unsupported/slow devices
- unverified visual differences
```

---

## 11. Decision summary for implementing agent

Proceed with the quality/URP mismatch as the primary hypothesis, but use a diagnostic parity build to prove it before permanently changing the project.

The final preferred architecture is a **dedicated WebGL URP profile**, not a blind permanent remap to the PC profile.

Fix shadow resolution/cascades/distance/soft-shadow filtering first. Bias is a tuning parameter, not a proven primary cause. Treat DPR, Fast sRGB conversion, and SSAO as separate secondary passes. Do not touch geometry unless the diagnostic shadow/material tests demonstrate a geometry-specific failure.
