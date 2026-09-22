````md
## Next Cheap-First Pass — Improve Close-Up Shadow Quality

### 1. Current Status

Candidate 1 has already improved the WebGL shadow substantially compared with the original build.

Current verified WebGL configuration:

| Setting | Candidate 1 |
|---|---:|
| Shadow Resolution | 2048 |
| Shadow Cascades | 2 |
| Shadow Distance | 24 m |
| Cascade 2 Split | 0.35 |
| Shadow Depth Bias | 0.08 |
| Shadow Normal Bias | 0.35 |
| Soft Shadows Quality | Medium |
| Render Scale | 1.0 |
| SSAO | Off |

Observed result:

- Long-distance / overview rendering is now acceptable.
- The previous severe diamond-like / broken shadow artifacts are gone.
- Shadow contact is better after reducing Depth Bias and Normal Bias.
- However, when the camera zooms closer to the floor, long wall / column shadow edges are still visibly zigzag / stair-stepped.
- Therefore, the remaining issue is primarily **insufficient shadow-map texel density in close-up views**, not geometry corruption or the original WebGL quality-profile problem.

The next pass must continue to favor **free or very cheap changes**. Do not increase shadow resolution, cascade count, render scale, or add SSAO yet.

---

## 2. Important Correction to Candidate 1 Rationale

Candidate 1 changed:

```text
Cascade 2 Split:
0.30 -> 0.35
````

The previous rationale stated that this "allocates more precision to the near-camera area."

This should be corrected.

With a 2-cascade setup, increasing the split value means the first / near cascade covers a **larger world-space distance**.

Example with:

```text
Shadow Distance = 24 m
```

At:

```text
Split = 0.35
Near cascade coverage ~= 8.4 m
```

while:

```text
Split = 0.25
Near cascade coverage ~= 6.0 m
```

If approximately the same shadow-map allocation is used for the near cascade, forcing it to cover a larger world-space region reduces texel density inside that region.

Therefore, for the specific remaining problem — shadows looking acceptable from far away but jagged at close camera distances — the next test should first try moving the split **down**, not further up.

Do not immediately modify the final value permanently. A/B test it first.

---

# 3. Candidate 2 — Tune Only the Existing 2-Cascade Split

## Goal

Improve close-up shadow texel density without:

* increasing shadow-map resolution;
* adding cascades;
* adding render passes;
* increasing WebGL download size;
* increasing full-frame rendering resolution.

Keep everything from Candidate 1 unchanged except `Cascade 2 Split`.

### Test matrix

Test:

```text
Candidate 1 reference:
Shadow Distance = 24 m
Cascade Split   = 0.35

Candidate 2A:
Shadow Distance = 24 m
Cascade Split   = 0.30

Candidate 2B:
Shadow Distance = 24 m
Cascade Split   = 0.25

Candidate 2C:
Shadow Distance = 24 m
Cascade Split   = 0.20
```

Keep fixed:

```text
Shadow Resolution = 2048
Cascade Count     = 2
Depth Bias        = 0.08
Normal Bias       = 0.35
Soft Shadows      = Medium
Render Scale      = 1.0
SSAO              = Off
```

### Expected trade-off

Lower split:

```text
+ Higher effective texel density close to the camera
+ Potentially cleaner wall / doorway / column shadow edges
+ Essentially no additional shadow texture memory
+ No additional cascade rendering

- Cascade transition happens closer to the camera
- Mid-distance shadow quality may become slightly worse
- A visible quality transition may appear if the split is pushed too low
```

### Acceptance criteria

Choose the lowest split that:

1. visibly reduces close-up zigzag shadow edges;
2. does not create an obvious cascade transition line;
3. does not noticeably degrade the normal floor-view distance;
4. does not cause shadow instability while orbiting / zooming.

Expected likely useful range:

```text
0.20 - 0.30
```

Do not assume `0.25` is automatically the final value. Select based on the actual WebGL comparison.

---

# 4. Candidate 3 — Reduce Shadow Distance Further for Close Views

If Cascade Split tuning alone is insufficient, test a shorter shadow distance.

Keep the selected split from Candidate 2 and compare:

```text
24 m
20 m
16 m
```

Example:

```text
Shadow Resolution = 2048
Cascades          = 2
Cascade Split     = selected Candidate 2 value
Depth Bias        = 0.08
Normal Bias       = 0.35
Soft Shadows      = Medium
```

### Why this is preferred over 4096 shadows

Reducing shadow distance concentrates the existing 2048 shadow-map resolution over less world space.

This directly increases world-space shadow precision without increasing the shadow-map texture size.

It can also reduce shadow-rendering workload because distant shadow casters no longer need to remain inside the active shadow range.

### Trade-off

```text
Shorter shadow distance:
+ Better texel density
+ Potentially lower shadow rendering cost
+ No additional memory
+ No additional WebGL download size

But:
- Distant shadows disappear earlier
- Shadow pop-out may become visible during zoom-out / orbit
```

### Acceptance

Use the shortest distance that still covers the useful visible area during normal user navigation.

Do not reduce global shadow distance to 16 m if it causes obvious shadow disappearance in the normal overview camera.

---

# 5. Candidate 4 — Adaptive Shadow Distance by Camera Zoom

If:

* `24 m` is required for overview mode;
* but approximately `14-18 m` gives clearly better shadows in close-up mode;

then prefer a small runtime adaptive-shadow-distance system instead of globally increasing rendering quality.

This is the preferred cheap solution if static settings cannot satisfy both far and close views.

## Proposed behavior

Example starting thresholds only:

```text
Far / overview camera:
Shadow Distance = 24 m

Medium camera:
Shadow Distance = 18-20 m

Close camera:
Shadow Distance = 14-16 m
```

Possible associated split:

```text
Far:
Cascade Split ~= 0.30

Medium:
Cascade Split ~= 0.25

Close:
Cascade Split ~= 0.20-0.25
```

These values are test candidates, not final constants.

### Implementation requirement

Do not continuously rewrite URP settings every frame.

Use a small number of camera-distance / orbit-distance bands.

Pseudo behavior:

```text
if camera is in far band:
    apply far shadow preset

else if camera is in medium band:
    apply medium shadow preset

else:
    apply close shadow preset
```

Only apply the preset when the camera crosses a band threshold.

Add hysteresis if necessary so zooming around a threshold does not repeatedly switch presets.

Example:

```text
Enter close mode at distance <= X
Return to medium mode only at distance >= X + margin
```

### Why this is suitable for the Digital Twin viewer

When the user is zoomed close to one section of a floor, there is little visual value in maintaining precise realtime shadows 20-30 meters away.

Therefore:

```text
close camera
-> smaller useful visible shadow area
-> shorter shadow distance
-> more shadow texels per visible meter
```

This redistributes existing rendering resources instead of increasing them.

### Performance objective

Adaptive distance must not:

* increase shadow-map resolution;
* increase cascade count;
* add post-processing;
* trigger floor reload;
* trigger Addressables reload;
* affect floor prefab lifetime;
* affect the one-runtime / one-canvas architecture.

This should remain a rendering-quality optimization only.

---

# 6. Verify the Directional Light Actually Uses Soft Shadows

Before increasing any quality setting, inspect the actual main Directional Light used by `FloorDetail`.

It is not sufficient that:

```text
WebGL_RPAsset
Soft Shadows Supported = true
Soft Shadow Quality = Medium
```

The Light itself also needs to request soft shadows.

Verify the active Directional Light configuration:

```text
Directional Light
    Shadows = Soft Shadows
```

If it is currently:

```text
Shadows = Hard Shadows
```

change it to:

```text
Shadows = Soft Shadows
```

and rebuild WebGL before performing more expensive experiments.

### Important

Do not change Directional Light intensity, rotation, color, or baking mode as part of this test unless a separate problem is discovered.

This step is only intended to verify the shadow type.

---

# 7. Bias Settings — Preserve Candidate 1 Unless Artifacts Reappear

Candidate 1 currently uses:

```text
Depth Bias  = 0.08
Normal Bias = 0.35
```

These values appear to improve shadow attachment and should remain the default during Candidate 2/3 testing.

Do not use bias as the main solution to stair-step aliasing.

Bias primarily affects:

* shadow acne;
* peter-panning;
* light leaking;
* apparent attachment of shadows to geometry.

It does not materially increase shadow-map sampling resolution.

Only retune bias if the new cascade / distance configuration introduces a visible artifact.

If needed, test only narrow ranges:

```text
Depth Bias:
0.06
0.08
0.10

Normal Bias:
0.30
0.35
0.40
```

Stop if acne returns.

---

# 8. Soft Shadow Quality

Keep:

```text
Soft Shadow Quality = Medium
```

during Candidate 2 and Candidate 3.

Do not change multiple variables simultaneously.

Only after:

1. cascade split has been selected;
2. shadow distance has been selected;
3. Directional Light soft-shadow mode has been verified;

may the agent perform one optional comparison:

```text
Low vs Medium
```

Keep Medium only if the visual improvement is clearly useful.

Do not test High in this cheap-first pass.

---

# 9. Required Test Scene

Use the same Floor 6 WebGL scene for all comparisons.

Test at minimum two camera distances.

## A. Overview

The approximate normal floor-view distance where Candidate 1 already looks acceptable.

Verify:

* overall shadow coverage;
* no premature shadow disappearance;
* no visible cascade boundary.

## B. Close-up

Zoom close enough that the currently observed zigzag shadow edges are clearly visible.

Focus especially on:

* long wall shadows;
* vertical column shadows;
* doorway shadows;
* large rectangular shadow boundaries;
* staircase area;
* floor regions where shadows cross large flat surfaces.

The close-up view is the primary quality target of this pass.

---

# 10. Test Matrix to Record

Update the existing investigation document with results similar to:

| Candidate   | Shadow Distance | Cascades |             Split | Soft   | Depth Bias | Normal Bias | Far View | Close View | Perf     | Result    |
| ----------- | --------------: | -------: | ----------------: | ------ | ---------: | ----------: | -------- | ---------- | -------- | --------- |
| Candidate 1 |              24 |        2 |              0.35 | Medium |       0.08 |        0.35 | Good     | Zigzag     | Baseline | Reference |
| 2B / 3A (Applied)|         20 |        2 |              0.25 | Medium |       0.08 |        0.35 | Expected Good | Expected Crisp | Target 60fps | Evaluating |
| 2C          |              24 |        2 |              0.20 | Medium |       0.08 |        0.35 |          |            |          |           |
| 3B          |              16 |        2 |              0.25 | Medium |       0.08 |        0.35 |          |            |          |           |
| Adaptive    |           14-24 |        2 | adaptive/selected | Medium |       0.08 |        0.35 |          |            |          |           |

Do not exhaustively combine every parameter.

Select the best split first, then test distance.

---

# 11. Preferred Decision Order

Implement and evaluate in this exact order:

```text
1. Verify active Directional Light uses Soft Shadows
        ↓
2. Keep Candidate 1, test split:
   0.30 -> 0.25 -> 0.20
        ↓
3. Select best close-up split
        ↓
4. Test shadow distance:
   24 -> 20 -> 16
        ↓
5. If close needs shorter distance than overview:
   implement adaptive distance presets
        ↓
6. Stop if quality is acceptable
```

Do not increase expensive settings before completing this sequence.

---

# 12. Explicitly Deferred Expensive Solutions

The following remain out of scope for this pass:

```text
4096 shadow resolution
4 shadow cascades
High soft-shadow quality
SSAO
Render Scale > 1.0
Higher canvas devicePixelRatio
Post-processing AA solely for shadow edges
Geometry / FBX changes
Additional realtime lights
```

Reason:

The current problem is now limited to close-up shadow aliasing.

There is still meaningful quality available from redistributing the existing 2048 / 2-cascade shadow budget before increasing GPU cost.

---

# 13. Escalation Condition

Only propose expensive settings if all of the following have been completed:

* Directional Light confirmed to use soft shadows.
* 2-cascade split tested down to approximately `0.20-0.25`.
* Shadow distance tested down to a practical close-view range.
* Adaptive shadow distance evaluated if different far/close requirements exist.
* Before / after WebGL screenshots captured.
* Performance compared against Candidate 1.

If the close-up zigzag artifact remains unacceptable after this cheap pass, report:

```text
1. Best static configuration
2. Best close-up configuration
3. Best overview configuration
4. Whether adaptive distance solved the conflict
5. Remaining visual artifact
6. FPS / frame-time difference from Candidate 1
7. Before / after screenshots
```

Then a separate higher-cost pass may evaluate, in order:

```text
1. 4 cascades
2. High soft-shadow filtering
3. 4096 shadow resolution
```

Do not enable all three simultaneously because their individual visual benefit and GPU cost would become impossible to measure.

---

# 14. Target Outcome

The target is not exact parity with the Unity Editor.

The target is:

> The floor should remain fast to load and render in WebGL, while close-up wall and object shadows are clean enough that the remaining stair-step pattern is not visually distracting during normal Digital Twin navigation.

Favor resource redistribution over resource expansion.

```
```
