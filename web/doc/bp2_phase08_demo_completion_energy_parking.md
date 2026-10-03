# Big Phase 02 — Phase 08: Deterministic Demo Parking Dashboard

> **Project:** GIS — UIT Building E Digital Twin  
> **Loại tài liệu:** Kế hoạch bàn giao cho Coding Agent  
> **Trạng thái:** PLAN ONLY — KHÔNG IMPLEMENT TRONG TÀI LIỆU NÀY  
> **Ngày lập kế hoạch:** 2026-10-01  
> **Roadmap mapping:** `Small Phase 19 — Explicit demo completion: Parking`  
> **Trang mục tiêu:** Page 09 — Bãi xe  
> **Routes:** `/dashboard/parking`  
> **Parking mockup:** `codex-clipboard-81844ee0-403f-4c3d-ba22-c226c5bfd752.png`, ảnh gốc `1484 × 1110 px`, chỉ dùng làm visual reference  
> **Data rule bắt buộc:** toàn bộ dữ liệu Page 09 Parking là `demo`; không có live/derived/manual Parking value trong phase này

---

## 1. Mục tiêu

Hoàn tất Page 09 Parking bằng deterministic demo data đã được Knowledge Base phê duyệt mà không làm regress các trang đã triển khai:

1. thay Page 09 placeholder bằng Parking dashboard bám sát mockup;
2. giữ toàn bộ Page 09 ở `demo`, bao gồm cả slot occupancy, motorcycle density, entry chart, camera rows/status và technical notes;
3. không tạo backend API, database schema, camera integration, LoRa integration, AI/TinyML inference hoặc background job;
4. giữ aligned Dashboard shell, exactly seven routes, responsive/accessibility and shared visual tokens;
5. không chỉnh sửa Page 02 hoặc Page 07 trong phase này.

Phase này là deterministic presentation/demo completion. Nó không chứng minh có camera, barrier, occupancy sensor, LoRa packet, AI model, privacy certification hoặc production Parking subsystem.

---

## 2. Authority và cách dùng mockup

Coding Agent xử lý xung đột theo thứ tự:

1. Yêu cầu trực tiếp mới nhất của stakeholder.
2. `web/doc/Dashboard_Knowledge_Base.md`, đặc biệt Page 09 Parking.
3. `web/doc/IoTBackend_API_HandOver.md` cho exact current IoT capability and unresolved fields.
4. `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phase 19 và temporary sequencing override ngày 2026-10-01.
5. File plan này.
6. Handoff Phase 01–07 và UI alignment cho trạng thái implementation hiện tại.
7. Parking mockup cho visual hierarchy, geometry và interaction concepts.
8. Repository/runtime evidence tại thời điểm implement.

Mockup không phải data contract. Không sao chép các giá trị `8/40`, `65%`, `2.440`, `3h20`, `4/4`, chart values, camera IDs, refresh periods, parking capacity, motorcycle zone percentages, “online” status, dirty-lens status, R&D duration hoặc hardware count trong ảnh thành expected project facts.

### 2.1 Tài liệu Coding Agent phải đọc

- `web/doc/Dashboard_Knowledge_Base.md`, sections 4, 5, 8, 11, 12, 15–20 and decision log.
- `web/doc/IoTBackend_API_HandOver.md`, current capability and unresolved-field sections.
- `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phases 19–21.
- `web/doc/bp2_fix_align_UI.md` and `web/doc/bp2_fix_align_UI_handoff.md`.
- Parking mockup attached to the implementation task.
- `web/AGENTS.md` and relevant bundled Next.js 16 docs before editing Next.js code.

---

## 3. Protected work and no-touch rules

### 3.1 Preserve current working tree

At plan time:

- branch: `feature/dashboard`;
- HEAD: `f6fcde1dd4c540c9223cb046bd8dfd3344d0d910`;
- Phase 07 Overview implementation and handoff are present as uncommitted working-tree changes;
- unrelated/user-owned changes include `GISUIT.code-workspace` and `UnityContent/UserSettings/EditorUserSettings.asset`.

Coding Agent must re-audit because the user may commit or change this state before implementation. Never reset, clean, checkout-overwrite, stage into this phase, or reformat unrelated work.

### 3.2 Completed-page text/content protection

Do not perform unrelated rewording, translation, label normalization, token retuning, refactor or mockup alignment on:

- Page 01 Overview and `web/src/components/dashboard/overview/**`;
- Page 02 Energy and Water;
- Page 03 Environment;
- Page 06 Alerts;
- Page 07 IoT;
- shared shell/navigation unless an additive change is truly required;
- prior fixtures/tests/handoffs.

Repository text wins older plan/handoff snapshots, including stakeholder `FIX TEXT` changes.

### 3.3 Exception rule

Page 02- and Page 07-specific files have a zero-change rule for this phase. A protected shared-infrastructure file may be changed only when a reproducible blocking bug directly prevents Page 09 Parking and no Parking-local solution exists. Use the smallest patch, do not change unrelated text, add regression evidence, and document exact reasoning in the handoff.

---

## 4. Baseline and consequences

### 4.1 Page 09 Parking

- Current Page 09 is a foundation placeholder with four unavailable KPI cards.
- Knowledge Base explicitly freezes all Page 09 data as `demo`.
- No Parking backend API, database schema, camera/device source or event persistence is required.
- No current real parking/camera/AI state may be inferred from IoT catalogue or NFC history.

---

## 5. Scope

### 5.1 In scope

#### Page 09 Parking

- Aligned header, demo banner and five KPI cards.
- Car-slot occupancy visualization with stable slot IDs.
- Motorcycle-zone density visualization with stable zone IDs.
- Vehicle-entry-by-hour demo chart.
- Demo camera/device table with demo-only status.
- Technical-note card describing the scenario and limitations.
- Range switching, local selection/filter if included, responsive/accessibility.
- Versioned deterministic fixture and pure selectors.

#### Verification

- Dedicated Phase 08 tests.
- Prior-phase regressions.
- Diff/protected-file audit.
- Browser/visual QA.

### 5.2 Out of scope

- No Parking live/derived/manual data.
- No camera stream, image, thumbnail, RTSP/WebRTC or upload.
- No real camera health, lens-dirty detection or inference status.
- No TinyML/AI model, model file, confidence score or inference pipeline.
- No LoRa packet send/receive integration.
- No barrier, gate, ticket, payment, access-control or plate-recognition integration.
- No license plate, face, person, account or other personal-data fixture.
- No Parking backend controller/service/DTO/entity/migration/repository.
- No alert generation from demo Parking values.
- No auth/CASL/PCCC work while Small Phase 16 chain is held.
- No second chart/icon library.

---

## 6. Data-mode matrix

| Surface | Source | Mode | Rule |
| --- | --- | --- | --- |
| Page 09 header/banner | Parking fixture metadata | `demo` | Page-wide demo disclosure |
| Parking KPIs | Parking fixture selectors | `demo` | Same source as map/chart/table |
| Car slots | Parking fixture | `demo` | Stable DEMO IDs |
| Motorcycle density | Parking fixture | `demo` | Zone estimate scenario only |
| Entries by hour | Parking fixture selector | `demo` | Deterministic selected range |
| Camera/device rows | Parking fixture | `demo` | No real online/health claim |
| Technical notes | static demo-scenario metadata | `demo` | Not product/hardware commitment |

Page 09 may use one prominent page-level `Dữ liệu minh họa` badge because every operational value on that page is demo.

---

## 7. Deterministic Parking contract

### 7.1 Fixture identity

```text
fixtureId: page09-parking-demo-v1
mode: demo
referenceInstant: frozen ISO-8601 instant
timezone: Asia/Ho_Chi_Minh for presentation only
scenarioLabel: Building E basement parking demonstration
```

Requirements:

- static/versioned;
- no `Math.random()`;
- no render-time `Date.now()`;
- no browser storage persistence;
- no remote request;
- no image/video/person/plate data;
- all IDs use `DEMO-` prefix;
- all KPIs derive from the same fixture/selectors as the visualization/table/chart.

### 7.2 Conceptual data model

```text
ParkingDemoFixture
  fixtureId
  version
  referenceInstant
  supportedRanges[]
  carAreas[]
    areaId
    label
    slots[]
      slotId
      label
      occupied
      cameraDemoId | null
  motorcycleZones[]
    zoneId
    label
    estimatedDensityPercent
    cameraDemoId | null
  hourlyEntries[]
    timestamp/hour
    entryCount
  cameraDevices[]
    cameraDemoId
    label
    demoCoverageLabel
    demoInferenceIntervalSeconds
    demoStatus
  technicalNotes[]
```

This is an application demo contract, not a future camera/IoT API proposal.

### 7.3 Derived consistency

Pure selectors must derive:

- occupied and free car-slot counts;
- capacity/occupancy percentage;
- highest motorcycle-density zone;
- entries in selected range;
- peak entry hour;
- average demo parking duration only if explicit sessions/durations exist in fixture;
- camera row/status counts;
- chart buckets.

If fixture has no session-duration input, do not fabricate the “average parking duration” KPI merely because mockup shows it. Use another fixture-backed KPI or unavailable/demo-note slot.

### 7.4 Demo camera semantics

- Camera rows are scenario objects, not real hardware inventory.
- Status label must include demo context at card/page level.
- “Online”, “lens dirty”, “inference every N seconds”, “privacy-by-design” or similar wording is not an operational claim.
- Prefer neutral statuses such as `Demo · hoạt động giả lập`, `Demo · cần kiểm tra`, or equivalent.
- No real-looking network address, serial number, firmware, URL or credential.
- No claim that only LoRa results are sent unless clearly labeled as a scenario note rather than implemented fact.

### 7.5 Privacy constraints

The Parking fixture and UI must not contain:

- license plates;
- names/person IDs;
- face imagery;
- tracking identifiers tied to real people;
- real camera snapshots or campus footage;
- claims of legal/privacy compliance certification.

Use high-level scenario notes only.

---

## 8. UI Architecture & Mockup Alignment — Page 09

### 8.1 Reference interpretation

- Original Parking mockup: `1484 × 1110 px`.
- Image starts at Dashboard Sidebar; High-Level Sidebar 64 px remains outside.
- Corresponding full-shell viewport is approximately `1548 × 1110 px`.
- Also verify at established `1842 × 1222` full shell.
- Use visual proportions, not absolute positioning.
- Do not commit the stakeholder image unless explicitly requested.

### 8.2 Shell

```text
DashboardShell
├── HighLevelSidebar (64 px; outside mockup)
└── DashboardWorkspace
    ├── DashboardSidebar (shared 288 px; active Bãi xe)
    └── DashboardViewport
        └── ParkingDashboard
```

- Preserve exactly seven routes.
- Do not add `Không gian`, `Thiết bị & Bảo trì`, `Thang máy`, `An ninh ra vào`, Document Control or OneCAD Nexus.
- Do not add mockup phase badges to the sidebar.
- Do not add alert badge `5`.
- Remove legacy `Trang 09` badge/divider/placeholder on Parking only.

### 8.3 Reference geometry

At source Dashboard workspace `1484 × 1110`:

| Region | Approximate source geometry | Target behavior |
| --- | --- | --- |
| Dashboard Sidebar | `x=0`, `w≈239` | Keep shared 288 px desktop token |
| Main canvas | `x≈239`, `w≈1245` | Fluid remaining width |
| Main inner content | `x≈263..1468` | ~24 px gutters |
| Header | `y≈20..70`, `h≈52` | Title/subtitle left, controls right |
| Demo banner | `y≈88..132`, `h≈44` | Full content width |
| KPI strip | `y≈147..251`, `h≈104` | Five equal cards |
| Main row | `y≈268..850`, `h≈582` | Occupancy left + two-card right column |
| Technical notes | `y≈867..1093`, `h≈226` | Full width bottom card |

At wide full shell `1842 × 1222`:

- High-Level Sidebar 64 px + Dashboard Sidebar 288 px.
- Main gutters about 30–32 px.
- KPI: five equal columns, 14–16 px gaps.
- Main row: occupancy visualization approximately 1.6:1 versus right column.
- Right column: entries chart then camera table, each independently sized.
- Technical notes span full width.

Use CSS grid/flex/minmax; do not absolute-position the page.

### 8.4 Header

Left:

- Title concept: `Bãi xe · Hầm B1` or current approved location label.
- Subtitle must state demo scenario; do not imply a real camera/LoRa stream.
- Teal dot is decorative, not a live-status indicator.

Right:

- prominent `Dữ liệu minh họa` badge with fixture ID/version in tooltip/detail;
- `Hôm nay`, `7 ngày`, `30 ngày` deterministic filters;
- `Tùy chọn` disabled unless fixture supports an actual custom-range selector;
- search may focus the demo camera/area list or be omitted;
- neutral avatar/account control only; no fake identity.

### 8.5 Demo-scenario banner

Use a full-width amber-outline banner below header:

- explicit `MÔ PHỎNG`/`DEMO` wording;
- state that no live Parking/camera integration is connected;
- avoid copying the mockup’s R&D duration, camera count and capacity proposal as commitments;
- concise enough not to dominate the page;
- accessible `role="note"`, not an error alert.

### 8.6 Five KPI cards

All cards are `demo` and selector-derived. Suggested slots:

1. car occupied/free slots;
2. motorcycle-zone density summary;
3. entries in selected range;
4. average demo parking duration only if fixture-backed, otherwise another safe demo metric;
5. demo camera scenario count/status summary.

Rules:

- no card uses values copied from mockup;
- no “live” indicator;
- counts agree with slot map, zones, hourly chart and camera table;
- every card exposes Demo provenance at card or strip level.

### 8.7 Main row — occupancy visualization

Left card title concept: `Hầm B1 · trạng thái minh họa`.

#### Car slots

- Render configured rows/areas with stable `slotId`.
- Each slot clearly shows occupied/free in demo scenario.
- Provide area label and total slots from fixture, not mockup assumptions.
- Optional demo camera marker references only `DEMO-` camera IDs.
- Legend includes `Trống`, `Có xe`, `Camera minh họa` with text/icons, not color-only.

#### Motorcycle zones

- Render configured zone cards with estimated demo density.
- Density is zone-level estimate, not per-bike counting.
- Warning styling may be used for fixture thresholds but must remain demo.
- Do not label a zone as real congestion or operational alarm.

#### Interaction

- Selecting a slot/zone may open or update a compact demo detail area.
- Keyboard selection and visible focus required.
- No mutation/reservation/control action.
- Provide accessible table/list alternative for slots/zones.

### 8.8 Right column

#### Vehicle entries by hour

- Use existing `MetricBarChart` or domain wrapper.
- Values derive from Parking fixture/range selector.
- Provide accessible table/summary and peak-hour calculation.
- Do not call it real gate/barrier traffic.

#### Demo camera/device table

- Columns may include demo camera ID, scenario coverage, demo cadence and demo status.
- All rows are visibly demo; IDs use `DEMO-` prefix.
- No real “online” or hardware fault conclusion.
- Long labels truncate with accessible full text.
- Table scroll remains inside card.

### 8.9 Technical notes

Bottom full-width card may explain the demo scenario:

- car-slot occupancy is a deterministic visualization;
- motorcycle density is a zone-level estimate;
- no license-plate/person/image data exists;
- no real camera/LoRa/TinyML integration is active;
- future concepts are not commitments.

Do not duplicate detailed implementation instructions or legal claims in user-facing UI.

### 8.10 Design tokens

Reuse current aligned Dashboard tokens:

- near-black/slate background;
- teal primary/accent;
- amber for demo/warning scenario;
- orange only for high-density demo scenario with text;
- radius 12–14 px;
- one-pixel subtle border;
- title 28–30 px;
- KPI values 32–38 px;
- card headings 15–17 px;
- body/table 12–14 px;
- helper/provenance 11–12 px;
- tabular/monospace numbers and IDs.

Do not change global tokens in a way that retunes completed pages.

### 8.11 Responsive behavior

| Full viewport | KPI | Main row | Right column | Notes |
| --- | --- | --- | --- | --- |
| `≥1842 px` | 5 columns | occupancy + right ~1.6:1 | chart + table | full width |
| `1548–1841 px` | 5 or 3+2 | two columns if right ≥390 px | stacked | full width |
| `1200–1547 px` | 3+2 | stack | chart/table full width | full width |
| `768–1199 px` | 2 columns | stack | stack | full width |
| `<768 px` | 1 column | stack | stack | compact rows |

- No body horizontal overflow.
- Slot map may scroll within card if necessary.
- Touch targets about 44 px.
- Camera table has internal horizontal scroll only when required.

### 8.12 Mockup divergence table

| Mockup concept | Phase 08 implementation | Reason |
| --- | --- | --- |
| Operational camera/LoRa subtitle | Explicit demo scenario | No integration exists |
| Phase 2/R&D plan details | Generic demo banner | Mockup is not roadmap authority |
| Exact capacity/occupancy values | New deterministic fixture values | Do not copy mockup facts |
| Camera online/dirty-lens status | Demo-labelled scenario status | No real health API |
| Privacy-by-design badge | Neutral demo/privacy limitation note | No certification claim |
| Extra sidebar routes/badges | Excluded | Exactly seven routes |
| Camera IDs and cadence | `DEMO-` IDs/fixture cadence | Prevent real-hardware implication |

---

## 9. Component and state architecture

### 9.1 Parking component tree

```text
ParkingDashboard.client
├── ParkingPageHeader
├── ParkingDemoNotice
├── ParkingKpiStrip
├── ParkingOccupancyCard
│   ├── DemoCarSlotRows
│   └── DemoMotorcycleZones
├── ParkingEntriesChart
├── ParkingCameraTable
└── ParkingTechnicalNotes
```

### 9.2 Parking state

```text
selectedRange:
  today | 7d | 30d

selectedParkingEntityId:
  DEMO slot/zone/camera ID | null

occupancyView:
  visual | accessible-table
```

All state is local/read-only presentation state. No acknowledge, reserve, edit, control or persistence state.

---

## 10. Expected file impact

Coding Agent must re-audit before editing.

### 10.1 Expected Parking files

```text
web/src/
├── app/dashboard/parking/page.tsx
├── components/dashboard/parking/
│   ├── ParkingDashboard.client.tsx
│   ├── ParkingPageHeader.tsx
│   ├── ParkingDemoNotice.tsx
│   ├── ParkingKpiStrip.tsx
│   ├── ParkingOccupancyCard.tsx
│   ├── ParkingEntriesChart.tsx
│   ├── ParkingCameraTable.tsx
│   └── ParkingTechnicalNotes.tsx
├── lib/dashboard/
│   ├── parking-demo-fixtures.ts
│   └── parking-demo-selectors.ts
└── types/
    └── dashboard-parking.ts
```

### 10.2 Tests

Add `web/test-bp2-phase08.mjs` and append it to the existing aggregate test pipeline without clobbering the uncommitted Phase 07 package-script change.

### 10.3 Backend expectation

- Expected backend file changes: none.
- Expected database/migration changes: none.

---

## 11. Implementation sequence for Coding Agent

### Checkpoint 1 — Re-audit/protect

1. Record branch, HEAD and working tree.
2. Confirm Phase 07 files are present and preserve them.
3. Confirm the implementation diff is restricted to Page 09 Parking files plus the minimum aggregate-test registration required for this phase.
4. Treat every other Dashboard page, including Page 02 and Page 07, as no-touch.

### Checkpoint 2 — Demo contracts

1. Create Parking fixture/types/selectors.
2. Add deterministic consistency tests.
3. Prove no random/current-time/network dependency.

### Checkpoint 3 — Page 09 layout

1. Replace Page 09 placeholder/page badge/divider.
2. Build aligned header and demo notice.
3. Build five KPI cards.
4. Build occupancy + entries chart + camera table + notes.
5. Wire deterministic range/selection behavior.

### Checkpoint 4 — Responsive/accessibility

1. Keyboard selection and visible focus.
2. Accessible chart and occupancy alternatives.
3. Responsive matrix and no overflow.
4. Color-independent occupied/density/status labels.
5. Table semantics and long-label handling.

### Checkpoint 5 — Verification/protected diff audit

1. Run Phase 08 tests.
2. Run all prior web tests without rewriting stakeholder labels.
3. Run lint/build.
4. Run relevant prior web regressions to confirm no integration break.
5. Browser/visual QA at required viewports.
6. Confirm no files for Page 02, Page 07, backend or database were changed.
7. Create mandatory handoff in section 16.

---

## 12. Test matrix

### 12.1 Parking fixture/selectors

- Stable `DEMO-` IDs and no collisions.
- Occupied + free equals configured car capacity.
- Occupancy KPI equals slot map.
- Motorcycle density KPI equals zone selector.
- Entries KPI/chart/peak hour agree for each range.
- Camera KPI/table/status counts agree.
- Duration KPI appears only when fixture has duration evidence.
- No mockup values are asserted as project facts.
- No PII/image/video/plate fields exist.

### 12.2 Parking UI

- Page-level Demo disclosure visible.
- Five KPI slots and macro layout present.
- Range controls update all supported demo widgets coherently.
- Slot/zone selection works by mouse/keyboard.
- Visual/table alternatives agree.
- Camera rows unmistakably demo.
- No real online/health/privacy certification claim.
- Exactly seven routes and no fake alert badge.

### 12.3 Architecture/security

- No backend/controller/entity/migration/repository/job.
- No network request from Parking feature.
- No camera/LoRa upstream URL.
- No timer/polling interval.
- No demo input reaches alert evaluator/live aggregates.
- Diff contains no Page 02 or Page 07 implementation changes.
- Auth/PCCC held phases untouched.

---

## 13. Browser and interaction checks

### Page 09

- `Bãi xe` nav item active.
- Header and demo banner clearly state simulation.
- Today/7d/30d update deterministic KPIs/chart.
- Slot and motorcycle-zone visuals agree with KPI totals.
- Camera table agrees with camera KPI.
- Demo IDs/status cannot be mistaken for live equipment.
- Technical notes do not claim real integration.
- No automatic/repeated network request.
- No body horizontal overflow.

---

## 14. Visual QA viewports

- `1548 × 1110` full shell corresponding to Parking source image plus 64 px rail.
- `1484 × 1110` Dashboard workspace crop.
- `1842 × 1222` established wide full shell.
- `1440 × 900` desktop.
- `1280 × 800` compact desktop.
- `1024 × 768` tablet landscape.
- `390 × 844` mobile.

Visual checklist:

- dual sidebar and active route preserved;
- Page 09 header/banner/KPI/main/bottom hierarchy follows mockup;
- five KPI cards align at wide desktop;
- occupancy card and right column retain intended proportions;
- demo provenance visible on all operational Parking content;
- other completed pages remain visually unchanged;
- no extra mockup route/badge/profile identity;
- no overflow and focus visible.

---

## 15. Acceptance criteria

Phase 08 is complete only when:

1. Page 09 placeholder is replaced by the aligned Parking dashboard.
2. Every Page 09 value and status is deterministic `demo` with visible provenance.
3. Parking KPI, occupancy visualization, entry chart and camera table are internally consistent.
4. No Parking network/backend/database integration exists.
5. No PII, image/video or real camera/hardware claim exists.
6. Page 02, Page 07 and every other completed page have no implementation changes from this phase.
7. Demo Parking data never enters live aggregates or alert evaluation.
8. No authentication/PCCC workaround is introduced while Small Phase 16 is held.
9. Exactly seven routes and dual-sidebar shell remain intact.
10. Responsive/accessibility and chart/table alternatives pass.
11. Automated tests, lint/build, protected-diff audit and visual QA have evidence.
12. Mandatory implementation handoff exists.

---

## 16. Mandatory handoff after implementation

After implementation and verification, Coding Agent **must create**:

`web/doc/bp2_phase08_demo_completion_energy_parking_handoff.md`

The handoff must include at minimum:

- branch, HEAD and working-tree notes;
- proof Phase 07 and unrelated dirty files were preserved;
- protected-file audit and stakeholder-label preservation evidence;
- exact file inventory;
- Parking fixture ID/version/reference instant/schema;
- per-widget mode/source matrix;
- KPI/chart/map/table consistency evidence;
- no-touch diff evidence proving Page 02 and Page 07 received no implementation changes;
- Parking privacy/no-PII/no-media audit;
- no-network/no-backend/no-database/no-polling audit;
- mockup-difference table;
- automated tests, lint/build and prior-phase regression results;
- browser interaction/accessibility results;
- screenshots at section 14 viewports;
- any protected shared-file edit with strict blocking-bug evidence;
- open issues and sequencing notes for held Small Phases 16–18.

> **Final handoff instruction to Coding Agent:** Implement only Page 09 Parking from `bp2_phase08_demo_completion_energy_parking.md`; treat every Parking value, camera row and status as deterministic demo; do not modify Page 02, Page 07, Alert, Environment, Overview or any other completed page; add no backend, PostgreSQL persistence, camera/LoRa/AI integration or authentication workaround; and after implementation and verification you must create `web/doc/bp2_phase08_demo_completion_energy_parking_handoff.md` before reporting the phase complete.
