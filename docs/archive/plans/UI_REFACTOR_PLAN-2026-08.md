# Achilles Cat v1 — UI Refactor Plan

Status: implementation complete; post-review convergence applied  
Scope: presentation-layer convergence toward the frozen Achilles Cat v1 references  
Source of truth: `docs/design/VISUAL_REFERENCE.md`  
Code changes: none in this document

## 1. Purpose and non-negotiable boundaries

This plan closes the structural gap between the frozen visual references and
the current Vue implementation. It is not a redesign plan.

The implementation must:

- preserve current application behavior;
- preserve `AppPhase`, `PreviewMode`, `WiggleSettings`, errors, locale, and export session semantics;
- preserve file input, drag/drop, validation, loading, rejection, parsing, alignment, Wiggle playback, export, download, cancellation, and Privacy behavior;
- preserve Canvas elements, renderer lifecycle, ResizeObservers, workers, and resource cleanup;
- use the existing Vue + Vite architecture;
- avoid new runtime dependencies;
- avoid adding Homepage, Works, Archive, Journal, tutorial, Split Preview, MP4, WebM, or advanced export functionality;
- make changes through parent layout and shared presentation primitives before local offsets.

### Files explicitly outside the refactor boundary

- `src/core/*` processing, rendering, export, memory, and cleanup modules;
- `src/workers/gifWorker.ts`;
- `src/app/appState.ts` transition semantics;
- export session and cancellation logic inside `App.vue`;
- preference and locale persistence semantics;
- test behavior and existing event contracts.

The files above may be inspected for verification, but they should not be
modified as part of visual convergence.

## 2. Current implementation constraints

The current application has one mounted view in `src/app/App.vue`.
`useAppState()` in `src/app/appState.ts` is the effective state store. There is
no router, Pinia store, Homepage route, shared Header component, shared Guide
component, or shared Preview Stage shell.

The current visual workbench is already directionally two-zone:

```text
lab-workspace
  └─ workbench-zone
       ├─ preview-workspace
       │    ├─ lab-input-entry + UploadPanel
       │    └─ AlignmentPreviewPanel OR PreviewCanvas
       └─ controls-zone + ControlPanel
```

The safest migration therefore keeps the current orchestration and changes the
parent layout and presentation boundaries incrementally.

## 3. Phase overview

| Phase | Focus | Primary files | Risk |
| --- | --- | --- | --- |
| 0 | Baseline and route/state inventory | No source changes; existing tests and Playwright output | Low |
| 1 | CSS cascade and token inventory | `src/styles/base.css`, `src/styles/layout.css` | Medium |
| 2 | Shared Header presentation boundary | `src/app/App.vue`, new `src/components/SiteHeader.vue`, `src/styles/layout.css` | Medium |
| 3 | Stable Lab parent composition | `src/app/App.vue`, `src/styles/layout.css` | High |
| 4 | Shared Preview Stage footprint | `App.vue`, `AlignmentPreviewPanel.vue`, `PreviewCanvas.vue`, `layout.css` | High |
| 5 | Controls hierarchy and contextual View | `App.vue`, `ControlPanel.vue`, `layout.css` | High |
| 6 | Input and static Guide convergence | `App.vue`, `UploadPanel.vue`, `layout.css` | Medium |
| 7 | Message and state-surface convergence | `MessageCenter.vue`, `layout.css`; composable only if required | Medium |
| 8 | Export and Privacy surface convergence | `GifExportDialog.vue`, `PrivacyModal.vue`, `layout.css` | Medium |
| 9 | Responsive and final visual verification | Relevant styles/components; no core changes | Medium |

Only one phase should be implemented at a time. A phase is complete only when
its verification passes and the prior state behavior remains intact.

## 4. Phase 0 — Establish the baseline

### Objective

Record the current behavior and visual geometry before changing presentation.

### Files changed

None.

### Components and state affected

All current mounted states are observed, not changed:

- `UploadPanel.vue`;
- `AlignmentPreviewPanel.vue`;
- `PreviewCanvas.vue`;
- `ControlPanel.vue`;
- `GifExportDialog.vue`;
- `MessageCenter.vue`;
- `PrivacyModal.vue`;
- `useAppState()` and `useMessageCenter()`.

### Work

- Confirm the current source tree and active imports.
- Confirm that the previously named `InputDetectionPanel.vue`,
  `SplitPreviewPanel.vue`, `ErrorMessage.vue`, and `GuideModal.vue` are not
  mounted or present as active components.
- Record existing `AppPhase` and `PreviewMode` transitions.
- Capture the current English Lab at 1536×1024.
- Capture the current Chinese Lab at 1536×1024.

### Verification

- Run existing tests, typecheck, and build.
- Verify the current upload → alignment → Wiggle → export path manually.
- Store the baseline screenshots outside the source tree or in the existing
  visual QA output location; do not replace frozen mockups.

### Exit condition

The current behavior and current visual baseline are known. No baseline failure
is silently attributed to the refactor.

## 5. Phase 1 — Consolidate the presentation CSS boundary

### Objective

Make the effective cascade understandable before changing geometry. This phase
does not attempt to match every pixel of the references.

### Files changed

- `src/styles/base.css`
- `src/styles/layout.css`

### Components affected

All mounted components through their existing class names. No component event
or prop contract changes.

### Work

- Identify the authoritative token declarations for paper, ink, accent, rule,
  inverse stage, typography, spacing, and motion.
- Group repeated selectors currently declared in both early MVP and later
  convergence sections.
- Consolidate only declarations whose computed behavior is already understood.
- Preserve all existing responsive breakpoints during the first consolidation.
- Preserve focus, disabled, loading, reduced-motion, and modal behavior.
- Keep Canvas sizing declarations unchanged until the Preview Stage phase.

### Do not do

- Do not introduce a new CSS framework or dependency.
- Do not change renderer dimensions or image processing.
- Do not remove selectors based only on their names; confirm all consumers.

### Verification

- Run typecheck/build and existing tests.
- Capture Empty, Alignment Ready, Wiggle Playing, Export Configure, and Privacy Modal.
- Compare computed layout boxes before and after consolidation.
- Confirm no new horizontal overflow at 1536, 768, 414, 375, and 320px.

### Exit condition

There is one understandable source of truth for the active layout rules, with
no behavior change and no unexpected selector regression.

## 6. Phase 2 — Extract the shared Header boundary

### Objective

Make the frozen Lab Header reusable by a future Homepage without building the
Homepage or adding navigation behavior.

### Files changed

- `src/app/App.vue`
- new `src/components/SiteHeader.vue`
- `src/styles/layout.css`

### Components affected

- Current inline header in `App.vue`.
- Future shared shell boundary only; no future route is added.

### Work

- Move the existing header markup into `SiteHeader.vue`.
- Preserve the current locale toggle event and displayed locale state.
- Preserve the current non-interactive `Works`, `Archive`, and `MiuMiu` items;
  do not turn them into new routes.
- Preserve `Settings` and the status dot.
- Encode the frozen shared geometry: wordmark, vertical separator, route list,
  Lab active dot, and right-side utilities.
- Keep the Header API presentation-only: locale plus active section/labels;
  do not introduce a router or store.

### Verification

- Compare Header bounding boxes and active indicator at 1536×1024.
- Verify locale switching still updates Header copy and persists through the
  existing `toggleLocale()` path.
- Verify keyboard focus remains visible on the locale button.
- Verify no navigation behavior was added.

### Exit condition

The Lab uses a reusable shared Header boundary that matches the Lab reference;
the Homepage remains unimplemented and no new route exists.

## 7. Phase 3 — Restore the stable Lab parent composition

### Objective

Make the frozen two-zone structure explicit at the parent level:

```text
Preview Stage | Controls
```

The Preview must dominate; Controls must remain subordinate. Upload remains
accessible without becoming a persistent third desktop rail.

### Files changed

- `src/app/App.vue` template/layout wrappers only
- `src/styles/layout.css`

### Components affected

- `UploadPanel.vue` placement only;
- `AlignmentPreviewPanel.vue` and `PreviewCanvas.vue` placement only;
- `ControlPanel.vue` placement only.

### Work

- Keep one parent grid for Preview and Controls.
- Use `minmax(0, 1fr)` for the Preview track and an explicit subordinate
  Controls track.
- Keep Upload in the compact input flow associated with Preview; do not create
  a third persistent desktop column.
- Remove parent-level card/elevation behavior that makes the workbench read as
  a SaaS dashboard.
- Establish stable parent gaps and stage/control alignment through grid rules,
  not child-specific offsets.
- Keep `MessageCenter`, export dialog, Privacy modal, and creating veil outside
  the grid’s sizing flow where they are already conditional/teleported.

### Do not do

- Do not change `handleFileAccepted`, `handleCreateWiggle`, export handlers, or
  state transition calls.
- Do not change Canvas elements or renderer props.
- Do not add a utility rail component inside the Lab body.

### Verification

- Capture Empty, Alignment Ready, Wiggle Playing, and Export Configure at
  exactly 1536×1024.
- Measure app shell, Preview, Controls, and Upload entry geometry.
- Confirm Preview remains the dominant object and the Controls column remains
  available.
- Test file picker, drag/drop, rejection, and loading while the new parent
  grid is active.

### Exit condition

The Lab body has one stable two-zone parent composition with no persistent
third-column dashboard structure and no workflow regression.

## 8. Phase 4 — Establish a shared Preview Stage footprint

### Objective

Prevent Alignment, Loading, Creating, Wiggle Playing, and Wiggle Paused from
causing avoidable geometry changes.

### Files changed

- `src/app/App.vue` wrapper markup only
- `src/components/AlignmentPreviewPanel.vue` outer presentation markup/classes only
- `src/components/PreviewCanvas.vue` outer presentation markup/classes only
- `src/styles/layout.css`

### Components affected

- `AlignmentPreviewPanel.vue` keeps `AlignmentRenderer` ownership.
- `PreviewCanvas.vue` keeps `WiggleRenderer` ownership.

### Work

- Define one shared parent stage contract: caption area, dark stage surface,
  metadata area, and stable min/max geometry.
- Keep the existing Canvas nodes and renderer initialization paths intact.
- Keep `v-if` behavior unless a measured geometry problem requires a safer
  wrapper; do not mount duplicate renderers to avoid a visual jump.
- Keep Empty and Loading messages within the stage footprint.
- Keep Creating and Layout Change overlays associated with the existing stage
  or workbench state without changing async ownership.
- Preserve the layout toggle as an existing JPG/PNG source-layout utility; do
  not expose Split Preview.

### Verification

- Capture S-01, S-03, S-06, S-07, S-08, S-09, and S-10.
- Compare Preview Stage outer box, Canvas box, caption box, and metadata box
  across states.
- Verify no Canvas blanking, duplicate renderer, stale frame, or ResizeObserver
  error during Alignment ↔ Wiggle changes.
- Verify reduced motion still prevents automatic Wiggle playback where required.

### Exit condition

The Preview Stage remains the same dominant page object across state changes;
only the intended content and controls change.

## 9. Phase 5 — Converge Controls hierarchy and contextual View

### Objective

Align the existing controls with the frozen `View / Align / Motion / Export`
hierarchy without adding controls or changing emitted events.

### Files changed

- `src/app/App.vue` template wiring only
- `src/components/ControlPanel.vue`
- `src/styles/layout.css`

### Components affected

- `ControlPanel.vue` all template branches;
- existing View buttons currently in the Preview header.

### Work

- Move the existing Alignment/Wiggle view context into the Controls-side
  hierarchy while preserving `showAlignPreview()` and `showWigglePreview()`.
- Keep Alignment controls: Horizontal, Vertical, Overlay, Reset Alignment.
- Keep Motion controls: Play/Pause, Speed input, Swap Eyes, Intermediate Frames,
  Adjust Alignment.
- Keep Export control: existing Download entry.
- Replace the button-grid appearance with systematic label/control/value rows.
- Render switch-like states through existing click/`aria-pressed` behavior;
  do not add a new setting or change toggle semantics.
- Keep the Speed input as a user-editable number input and preserve
  `getFrameInterval()` normalization.

### Do not do

- Do not add Split Preview.
- Do not alter `WiggleSettings`.
- Do not add a new playback engine, intermediate-frame algorithm, or export path.

### Verification

- Test every existing ControlPanel emit: alignment, overlay, reset, create,
  playback, eye swap, speed, intermediate frames, alignment return, and export.
- Verify disabled behavior for Empty, Loading, Creating, and Exporting.
- Capture Alignment Ready, Wiggle Playing, and Wiggle Paused in both locales.
- Confirm no control text wraps into unusable interactive targets.

### Exit condition

Controls visually follow the frozen hierarchy while the existing control API,
values, disabled states, and state transitions remain unchanged.

### Post-review correction

The first Phase 4/5 pass applied shared class names and local CSS rules but did
not establish a single parent-owned Preview Stage or the frozen Wiggle control
row hierarchy. The correction keeps the existing renderer and event contracts
while making the following structural changes:

- `App.vue` owns the shared Preview Stage caption and dark surface wrapper;
- `AlignmentPreviewPanel.vue` and `PreviewCanvas.vue` retain only their
  state-specific stage content and Canvas ownership;
- Alignment and Wiggle use the same parent stage height and transparent child
  surfaces;
- `ControlPanel.vue` keeps all existing emits while rendering Wiggle Motion
  rows, switch states, Speed input, Adjust Alignment, and Download in the
  frozen hierarchy;
- `layout.css` owns the shared stage contract and parent-level control layout.

No processing, Canvas rendering, export, state semantics, or new functionality
is changed by this correction.

## 10. Phase 6 — Converge Input and static Guide presentation

### Objective

Make the initial Lab workflow readable at a glance without adding onboarding
or a tutorial surface.

### Files changed

- `src/app/App.vue`
- `src/components/UploadPanel.vue` template/classes only
- `src/styles/layout.css`

### Components affected

- `UploadPanel.vue`;
- inline Guide markup in `App.vue`;
- Preview Stage Empty/Drag Over/Loading presentation.

### Work

- Keep the Guide static, compact, bilingual, and directly below the Lab entry.
- Preserve the four steps: Upload, Align, Preview depth motion, Export result.
- Keep UploadPanel’s native file input, accepted formats, drag/drop, rejection,
  disabled state, and loading state unchanged.
- Reconcile input placement with the Empty and Drag Over frozen references using
  the existing `UploadPanel` event contract.
- Avoid a large SaaS upload card, modal onboarding, tutorial route, or extra
  input functionality.

### Verification

- Capture Empty, Drag Over, Loading, Rejected Input, and Blocking Error.
- Verify click-to-upload, drag/drop, invalid file rejection, and input reset.
- Verify Guide copy in English and Simplified Chinese.
- Verify Upload remains disabled during Loading and Exporting.

### Exit condition

The first workflow step is visible and quiet, the Guide is editorial rather
than modal, and all existing upload behavior remains intact.

## 11. Phase 7 — Converge the shared message surface

### Objective

Match the frozen message treatment for Rejected Input, Blocking Error,
Success, and Failure while retaining one message component and the current
queue lifecycle.

### Files changed

- `src/components/MessageCenter.vue`
- `src/styles/layout.css`
- `src/composables/useMessageCenter.ts` only if a presentation-only type change
  is proven necessary
- `src/app/App.vue` only for non-behavioral message mapping, if required

### Components affected

- `MessageCenter.vue`;
- `useMessageCenter()` timeout, deduplication, and dismissal behavior.

### Work

- Keep one shared message component structure.
- Preserve status color/icon differences for success, warning, and error.
- Preserve top-center placement and compact editorial geometry.
- Keep title, copy, close action, `aria-live`, dismissal, timeout, and count
  behavior accessible.
- Avoid adding a second `ErrorMessage.vue` or inline error path.
- Do not change the source error lifecycle unless the current visual contract
  cannot be represented without it; if so, isolate the smallest typed-payload
  change and verify deduplication/timing before proceeding.

### Verification

- Trigger rejected input with and without an existing preview.
- Trigger blocking MPO parse failure.
- Trigger export success and export failure.
- Verify close button, timeout, duplicate count, `aria-live`, and locale copy.
- Confirm messages do not change Preview/Controls geometry.

### Exit condition

All four frozen message states share one restrained presentation component with
unchanged queue, dismissal, timing, and recovery behavior.

## 12. Phase 8 — Converge Export and Privacy surfaces

### Objective

Bring the existing dialogs toward the frozen editorial surfaces without
changing export safety or privacy behavior.

### Files changed

- `src/components/GifExportDialog.vue` template/classes only
- `src/components/PrivacyModal.vue` template/classes only
- `src/styles/layout.css`

### Components affected

- `GifExportDialog.vue`;
- `PrivacyModal.vue`;
- shared `useDialogFocus.ts` behavior must remain unchanged.

### Work

- Preserve Teleport, backdrop close, Escape, focus trap, focus restoration, and
  emitted `canceled`/`confirmed` events.
- Keep GIF and supported SBS PNG choices, framing, size, estimates, unavailable
  explanations, progress, and cancellation.
- Align dialog hierarchy to the approved `DOWNLOAD / 下载` editorial surface.
- Keep progress inside the dialog; do not turn exporting into a separate page.
- Align Privacy Modal structure and local-processing explanation to its approved
  reference without changing the analytics preference.

### Verification

- Capture S-11, S-12, S-13, and S-16 at 1536×1024.
- Verify GIF/SBS availability guards, memory guidance, estimated dimensions,
  progress, cancellation, and confirm behavior.
- Verify Privacy checkbox persistence and close behavior.
- Verify keyboard focus, Escape, Tab loop, backdrop click, and focus restore.

### Exit condition

Dialogs visually converge while export and privacy behavior remains identical.

## 13. Phase 9 — Responsive and final state verification

### Objective

Validate the frozen relationship across the full state set and required widths.

### Files changed

Only files identified by a failing verification result. No speculative source
changes.

### Verification matrix

#### Desktop

- viewport: 1536×1024;
- English and Simplified Chinese;
- Empty, Drag Over, Loading, Rejected Input, Blocking Error;
- Alignment Ready, Alignment Layout Change, Creating Wiggle;
- Wiggle Playing, Wiggle Paused;
- Export Configure, Export Unavailable, Exporting, Success, Failure;
- Privacy Modal.

#### Responsive

- 768px: preserve a modest Preview + Controls relationship when content fits;
- 414px, 375px, 320px: Preview first, Controls second, no horizontal scroll;
- verify long bilingual labels, focus rings, dialogs, messages, and upload.

#### Behavior regression

- `npm test`;
- `npm run typecheck`;
- `npm run build`;
- existing build verification script;
- manual upload, parse, align, Wiggle, playback, export, cancel, recovery,
  locale, and Privacy checks.

#### Visual comparison

- Playwright capture for each implemented state;
- compare against the corresponding frozen mockup;
- report Critical, Major, and Minor differences separately;
- fix parent grid/flex/surface rules before child offsets;
- obtain human approval before using an implementation screenshot as a new
  regression baseline.

## 14. Implementation order and rollback rule

Recommended order:

```text
Baseline
  → CSS cascade inventory
  → Shared Header
  → Lab parent grid
  → Preview Stage footprint
  → Controls hierarchy
  → Input + Guide
  → Messages
  → Dialogs
  → Responsive/state sign-off
```

Each phase should be a small, reviewable change. If a verification step shows
a behavior regression, revert the presentation change from the current phase
and continue only after the last known-good behavior is restored. Do not
compensate for a parent-layout problem with arbitrary child margins,
transforms, or Canvas resizing.

## 15. Definition of done

The refactor is complete when:

- the Lab converges toward all approved frozen states;
- the shared Header geometry is reusable without adding Homepage behavior;
- the Lab body is a stable Preview + Controls workspace;
- Preview remains visually dominant across states;
- Upload, Guide, Controls, Messages, Export, and Privacy preserve current
  functionality;
- no Split Preview or deferred feature is exposed;
- no processing, Canvas, worker, export, cancellation, or state semantics were
  changed;
- English and Simplified Chinese states are verified;
- required desktop and responsive screenshots pass human visual sign-off.
