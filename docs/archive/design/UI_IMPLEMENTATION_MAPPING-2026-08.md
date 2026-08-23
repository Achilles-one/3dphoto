# Achilles Cat v1 — UI Implementation Mapping

Status: implementation analysis only  
Scope: gap between the frozen visual references and the current Vue implementation  
Code changes: none

This document describes the existing implementation as it is currently wired.
It does not introduce a new visual direction, authorize new functionality, or
replace the frozen references in `docs/design/VISUAL_REFERENCE.md`.

## Evidence and boundaries

Frozen design sources:

- `docs/design/DESIGN_SYSTEM.md`
- `docs/design/LAB_STATE_DESIGN.md`
- `docs/design/VISUAL_REFERENCE.md`
- `docs/design/mockups/`

Current implementation boundary:

- Vue 3 + Vite;
- `src/app/App.vue` is the only mounted application view;
- `src/app/appState.ts` is the current reactive state source;
- no router, Pinia store, Homepage route, or separate page shell exists;
- image processing, Canvas rendering, Wiggle playback, workers, export, and
  cleanup are implemented under `src/core/` and `src/workers/`.

The mapping below separates visual gaps from functional behavior. Existing
behavior remains authoritative for parsing, validation, state transitions,
Canvas lifecycle, export capability, cancellation, and accessibility.

## 1. Mockup states → UX states → current implementation

The frozen manifest defines 16 Lab states. The current application uses
`AppPhase`, `PreviewMode`, `state.error`, `isLayoutChanging`, the export dialog
open flag, and the message queue to represent them.

| State ID | Frozen UX state | Existing application state | Current Vue presentation | Gap from frozen reference |
| --- | --- | --- | --- | --- |
| S-01 | Empty | `phase: empty`, `previewMode: align` | `UploadPanel.vue` plus `AlignmentPreviewPanel.vue` empty copy; `ControlPanel.vue` is disabled through `App.vue` | Partial. The input is rendered in `.lab-input-entry` above the stage rather than being owned by the dark Preview Stage composition shown in the Empty mockup. |
| S-02 | Drag Over | Empty phase plus `UploadPanel.vue` local `isDragging` ref | `.drop-zone.is-dragging` presentation | Behavior exists. The remaining work is visual convergence of the drop rule/surface; no state-layer change is needed. |
| S-03 | Loading | `phase: loading`, `previewMode: align` | `UploadPanel.vue` loading copy and `AlignmentPreviewPanel.vue` loading text | Partial. The stable two-zone shell exists, but the loading presentation is split between the input and alignment panel. `PreviewCanvas` loading branch is not the active path because loading forces `align`. |
| S-04 | Rejected Input | `setUploadRejectedError()` writes `state.error`; phase is preserved when a preview exists and becomes `error` otherwise | `MessageCenter.vue` receives the error after the `App.vue` watcher clears `state.error` | Partial. The approved message treatment exists as a generic queue item, but the component receives one concatenated string rather than distinct title, message, and action fields. |
| S-05 | Blocking Error | `phase: error`, `previewMode: align`, `state.error` transiently set | `MessageCenter.vue` plus input-oriented `AlignmentPreviewPanel.vue` | Partial. The blocking path exists; visual copy, message geometry, and stage placement must converge to the frozen mockup without changing recovery behavior. |
| S-06 | Alignment Ready | `phase: preview`, `previewMode: align`, `stereoSplit` available | `AlignmentPreviewPanel.vue`, layout toggle in `App.vue`, alignment branch of `ControlPanel.vue` | Major visual gap. View tabs are currently in the Preview header; the frozen reference places view/context inside the Controls hierarchy. The renderer and alignment state are present. |
| S-07 | Alignment Layout Change | `phase: preview`, `isLayoutChanging: true`, generation guard active | `toggleLayout()` in `App.vue`; `.workspace-loading` overlay; `AlignmentPreviewPanel.vue` remains mounted | Behavior exists. The busy treatment is workbench-level and must be checked against the state-specific mockup without changing the async layout pipeline. |
| S-08 | Creating Wiggle | `phase: creating`, `previewMode: align` until `finishCreatingWiggle()` | Alignment panel remains visible and `.workspace-loading` covers the workbench | Mostly present. The stage is preserved, but the loading veil belongs to the presentation layer and must remain stable while `App.vue` keeps the existing generation guard. |
| S-09 | Wiggle Playing | `phase: preview`, `previewMode: wiggle`, `settings.isPlaying: true` | `PreviewCanvas.vue` and Wiggle branch of `ControlPanel.vue` | Major visual gap. The Canvas and playback state exist, but the current control grid is not the frozen quiet Motion instrument with consistent switches and row alignment. |
| S-10 | Wiggle Paused | `phase: preview`, `previewMode: wiggle`, `settings.isPlaying: false` | Same `PreviewCanvas.vue`; button label changes to Play | Behavior exists. The state-specific stage and paused metadata need visual convergence; no new playback state is required. |
| S-11 | Export Configure | `phase: preview`, `previewMode: wiggle`, `isExportDialogOpen: true` | `GifExportDialog.vue` Teleported to `body` | Present. The dialog has the required format, framing, size, estimate, and actions. Its grouping and copy hierarchy still need comparison against the frozen export mockup. |
| S-12 | Export Unavailable | Dialog open plus disabled SBS/size choice from memory plan | `GifExportDialog.vue` disabled radio labels and `memoryGuidance` | Present. Availability is correctly computed from existing memory/dimension plans; only presentation convergence is outstanding. |
| S-13 | Exporting | `phase: exporting`, active `ExportSession`, `isExportDialogOpen: true` | `GifExportDialog.vue` progress mode; `App.vue` owns progress and cancellation | Present and high risk. The dialog remains mounted and the export session is cancellable. Do not change session ownership while restyling. |
| S-14 | Export Success | `finishExporting()` returns to `preview`; `showMessage('success', ...)` | `MessageCenter.vue` over the Wiggle preview | Present. The download path and preview retention work; message component geometry and bilingual success copy must match the frozen message reference. |
| S-15 | Export Failure | Recoverable error returns to `preview`; message is emitted from `App.vue` | `MessageCenter.vue` over the current Wiggle preview | Present. The preview/settings are retained; the visual error surface must remain recoverable and use the frozen restrained treatment. |
| S-16 | Privacy Modal | `isPrivacyOpen` local ref; underlying `AppState` unchanged | `PrivacyModal.vue` Teleported to `body`, `useDialogFocus.ts` | Present. Focus handling, Escape, backdrop close, and analytics preference behavior already exist; only visual alignment is in scope. |

### State transition source of truth

`src/types/app.ts` defines:

- `AppPhase`: `empty`, `loading`, `creating`, `preview`, `exporting`, `error`;
- `PreviewMode`: `split`, `align`, `wiggle`;
- `WiggleSettings`, `UserFacingError`, `InputDetection`, and locale types.

`src/app/appState.ts` owns the transitions. `src/app/App.vue` owns the async
work around those transitions: file decoding, MPO parsing, layout switching,
Wiggle creation, export sessions, resource release, analytics, and messages.

## 2. Current Vue components → frozen UI sections

### Mounted components

| Existing component | Mounted by | Current responsibility | Frozen UI relationship | Assessment |
| --- | --- | --- | --- | --- |
| `src/app/App.vue` | `src/main.ts` | Entire page template, state orchestration, async processing, export orchestration, messages, dialogs, and footer | Shared site shell, Lab entry, Guide, stable workbench, conditional surfaces, footer | Primary composition boundary. It currently mixes presentation and most application orchestration. |
| `src/components/UploadPanel.vue` | `App.vue` | Native file input, click selection, drag/drop, file acceptance, rejection, disabled/loading state | Compact Lab input entry | Behavior is reusable. Its presentation is still a generic drop-zone component rather than a fully state-specific stage entry. |
| `src/components/AlignmentPreviewPanel.vue` | `App.vue` | `AlignmentRenderer` lifecycle, Canvas sizing, alignment rendering, loading/empty copy | Preview Stage — Alignment | Renderer ownership is correct. The outer Preview Stage shell is not shared with Wiggle. |
| `src/components/PreviewCanvas.vue` | `App.vue` | `WiggleRenderer` lifecycle, ResizeObserver, playback/settings watches, Canvas rendering | Preview Stage — Wiggle | Renderer ownership is correct. Its stage markup and sizing path differ from Alignment. |
| `src/components/ControlPanel.vue` | `App.vue` | Alignment sliders, reset, Create Wiggle, Motion controls, playback, eye swap, intermediate frames, alignment return, download event | Controls zone: View / Align / Motion / Export | Functional controls exist. The visual grouping and control alignment are not yet equivalent to the frozen references. |
| `src/components/GifExportDialog.vue` | `App.vue` | Format, framing, size, memory availability, estimates, progress, confirm/cancel | Export Configure / Unavailable / Exporting | Functional dialog exists and must be restyled without changing computed availability or events. |
| `src/components/MessageCenter.vue` | `App.vue` | Transient success/info/warning/error queue rendering and dismissal | Rejected Input / Blocking Error / Success / Failure message surface | Functional message queue exists, but its data model is less expressive than the frozen message component. |
| `src/components/PrivacyModal.vue` | `App.vue` | Privacy explanation, analytics preference, close behavior | Privacy Modal | Functional and focus-safe. Visual treatment is the remaining concern. |

### Components expected by the frozen design but not currently present

These are architectural presentation boundaries, not instructions to add
functionality:

- Shared Header component: header markup is inline in `App.vue`.
- Homepage shell/page: no Homepage component or route exists.
- Static Guide component: Guide markup is inline in `App.vue`.
- Shared Preview Stage shell: Alignment and Wiggle own separate stage markup.
- Shared message-state component model: `MessageCenter.vue` renders a queue
  item from a single text string rather than a typed title/body/action model.
- Shared locale copy catalog: bilingual copy is written inline in each Vue
  component and in `appState.ts`.

The absence of these boundaries explains several visual gaps, but it does not
justify duplicating business logic or creating a second state machine.

### Previously named unused components

`InputDetectionPanel.vue`, `SplitPreviewPanel.vue`, `ErrorMessage.vue`, and
`GuideModal.vue` are not present in the current `src/` tree and have no active
imports. They are not pending runtime components to preserve or mount.

- `InputDetectionPanel`: detection data still exists in `AppState`, but is used
  by `App.vue` for feedback/export context rather than a mounted panel.
- `SplitPreviewPanel`: no component exists and no Split UI is mounted.
- `ErrorMessage`: errors are routed through `state.error` → `App.vue` →
  `useMessageCenter` → `MessageCenter.vue`.
- `GuideModal`: the current Guide is inline and static; no modal component is
  present.

No component removal is required as part of this analysis. Any future cleanup
of dormant Split APIs must be checked against tests and internal compatibility
requirements first.

## 3. Composables and state utilities

| File | Current role | Frozen-design relationship | Gap / risk |
| --- | --- | --- | --- |
| `src/app/appState.ts` | `useAppState()` creates the reactive `AppState` and exposes phase, preview mode, settings, error, locale, and transition methods | Behavior source of truth for all Lab states | It is a store-like composable, not a separate store package. `App.vue` still performs substantial orchestration outside it. |
| `src/composables/useMessageCenter.ts` | Reactive transient message list, deduplication by type/text, timeout scheduling, dismissal | Message surface for four frozen message states | It stores only `type`, one `text`, and `count`; it cannot independently represent frozen title, detail, recovery action, diagnostic code, or status metadata. |
| `src/composables/useDialogFocus.ts` | Focus capture/restore, Escape close, Tab loop | Export and Privacy dialog accessibility behavior | It is shared by both dialogs and should remain unchanged during visual work. It does not manage nested dialogs or a global dialog stack. |
| `src/core/preferences.ts` | LocalStorage for locale and export preference | Persistent locale and export choice | This is a utility module, not a store. Storage keys and fallback behavior are part of existing behavior. |
| `src/utils/analytics.ts` | Local analytics preference and optional endpoint event sending | Privacy Modal preference and existing telemetry | Not a visual state source. Do not couple visual message state to analytics state. |

There is no `src/composables/useLocale`, no i18n plugin, and no `src/store` or
`src/stores` directory. Locale switching is a state method with per-component
conditional copy.

## 4. Stores and state ownership

### No external store

The project does not use Pinia, Vuex, or another store library. `package.json`
contains only Vue and the existing GIF encoder at runtime.

The effective ownership is:

```text
App.vue
  ├─ useAppState()          → phase, mode, file, detection, settings, error, locale
  ├─ useMessageCenter()     → transient messages and timers
  ├─ local refs             → dialog visibility, progress, layout busy, export session
  └─ core modules/workers   → decode, split, render, export, cleanup
```

### Important local refs in `App.vue`

- `isExportDialogOpen`: export dialog visibility;
- `isPrivacyOpen`: privacy modal visibility;
- `exportProgress`: current export progress;
- `isLayoutChanging`: JPG/PNG layout-change presentation state;
- `activeExportSession`: cancellation and stale-session guard;
- `uploadGeneration`, `wiggleCreationGeneration`, `layoutChangeGeneration`:
  async invalidation guards;
- `lastDiagnosticCode`, `lastExportAttempt`: feedback and diagnostics context.

These refs are not visual-only state. Moving them into components or a new
store would risk changing cancellation, stale-result protection, cleanup, or
feedback behavior.

## 5. Missing implementation relative to the frozen reference

The following are missing or only partially represented. They are gaps in the
presentation architecture, not requests to add product features.

### Shared shell and future ecosystem

- There is no Homepage route or Homepage implementation.
- `Works`, `Archive`, and `MiuMiu` are non-interactive `.is-future` spans in the
  Lab header, not shared navigation links.
- The global header exists only as inline Lab markup in `App.vue`; it cannot yet
  be reused by a future Homepage without extraction.
- The current Lab active state is implemented by `.site-nav-item.is-active::after`;
  the shared frozen rule is the Lab dot treatment.

### Lab composition

- The current parent is a two-zone `.workbench-zone`, which is directionally
  aligned with the freeze; however, Upload, Preview header, and stage are still
  assembled inside one large `.preview-workspace` rather than through a stable
  shared Preview Stage boundary.
- `AlignmentPreviewPanel` and `PreviewCanvas` are swapped with `v-if`. Their
  different DOM footprints can change stage geometry between Alignment and
  Wiggle states.
- View tabs remain in the Preview header. The frozen hierarchy expects View to
  be part of the Controls-side context.
- Empty/loading/input content is split across sibling layers instead of having
  a single stable stage/status ownership model.

### Controls

- Alignment controls are implemented as a four-column slider/action grid.
- Wiggle controls are implemented as a five-column button/input grid.
- The frozen Wiggle concept expects quiet, systematic rows with consistent
  switch treatment for playback, eye order, and intermediate frames.
- The current `Intermediate: On/Off` text button is behaviorally valid but not
  visually equivalent to the frozen switch language.

### Messages

- `MessageCenter.vue` has one generic renderer for success, info, warning, and
  error, which is the correct single-component direction.
- Its current payload is a single concatenated string. `App.vue` combines
  `error.message`, `error.action`, and the diagnostic code before passing it to
  the message center.
- The frozen states require the same message structure while allowing status
  title, detail, recovery action, icon, and color to vary. That semantic split
  is not represented in the current message type.

### Typography and bilingual coverage

- Local font files and `@font-face` declarations exist for Instrument Serif,
  Space Grotesk, and DM Mono.
- Locale switching exists and is persisted through LocalStorage.
- Copy is distributed through inline ternaries and duplicated error maps in
  `appState.ts`; there is no centralized translation catalog.
- This is not proof of missing translations in every state. It is a structural
  gap and a risk for future additions to dialogs, messages, footer, and
  Homepage content.

## 6. Duplicated or overlapping logic

### Presentation duplication

1. **Parallel preview shells** — `AlignmentPreviewPanel.vue` and
   `PreviewCanvas.vue` each own a stage wrapper, caption, empty/loading copy,
   Canvas ref, ResizeObserver, and renderer cleanup. Their renderers must remain
   separate, but their outer presentation contract is duplicated.
2. **Inline locale copy** — `App.vue`, `UploadPanel.vue`, `ControlPanel.vue`,
   `GifExportDialog.vue`, `MessageCenter.vue`, and `PrivacyModal.vue` each hold
   their own English/Chinese conditionals.
3. **Message styling layers** — `layout.css` contains an early message block
   and a later convergence block with repeated `.message-center`,
   `.app-message`, `.message-icon`, and related selectors. The later rules
   override the earlier rules, increasing debugging risk.
4. **MVP and convergence CSS** — selectors such as `.upload-panel`,
   `.preview-workspace`, `.app-footer`, `.controls-panel`, and modal rules are
   declared in multiple sections of `layout.css`. The effective cascade is not
   represented by one authoritative block.
5. **Header and Guide markup** — both are currently embedded in `App.vue`, so
   the future Homepage would otherwise duplicate them.

### Split responsibility that can look like duplication

1. **State transitions vs async orchestration** — `appState.ts` changes phase
   and mode, while `App.vue` decides when to call those methods around decode,
   rendering, and export. This is intentional behavior ownership, but a visual
   refactor must not move the same transition into a component.
2. **Error copy vs error presentation** — error definitions live in
   `appState.ts`, while `App.vue` converts them into a transient message and
   clears the source error. This is one path; adding an inline error component
   would duplicate it.
3. **Export availability** — `App.vue` computes memory plans and passes them to
   `GifExportDialog.vue`, while the dialog computes its selected option,
   estimates, and disabled presentation. Keep the safety decision in the
   existing plan data; do not duplicate export checks in CSS/UI wrappers.

## 7. Risky areas

| Risk | Evidence in current code | What can break during presentation work |
| --- | --- | --- |
| Canvas lifecycle and dimensions | Both preview components create/destroy renderers and observe their containers | Blank Canvas, incorrect scaling, stale render, or layout jumps when wrappers change. |
| Conditional preview swap | `App.vue` uses `v-if` for `PreviewCanvas` vs `AlignmentPreviewPanel` | Changing the DOM order or wrapper can alter renderer timing and stage dimensions. |
| Export session cancellation | `App.vue` owns `activeExportSession`, `cancelTask`, generation checks, and cleanup | Export may continue after cancel, download twice, or clear the active preview. |
| Error recovery semantics | `state.error` is watched, transformed into a message, then cleared | Adding a second message/error surface can duplicate messages or lose recovery state. |
| Upload replacement | `handleFileAccepted()` invalidates generations and releases decoded/stereo resources | Re-parenting `UploadPanel` can break disabled state, drag/drop, or replacement behavior. |
| Dormant Split mode | `PreviewMode` includes `split`; `showSplitPreview()` remains exported and tested, but no UI exists | New tabs or shared view components could expose a deferred v1 mode. |
| Layout-change async path | `toggleLayout()` decodes again, sets `isLayoutChanging`, and replaces resources | A busy overlay or stage wrapper can hide the wrong state or cause a stale layout commit. |
| Bilingual copy width | Copy is inline and differs substantially in length between locales | Controls, message rows, header utilities, and dialog actions may wrap or clip. |
| Message semantics | `AppMessage` stores one text string and a count | A visual redesign can accidentally change deduplication, timeout, dismissal, or aria-live behavior. |
| Dialog focus | Both dialogs use the shared `useDialogFocus()` composable | Teleport or wrapper changes can break initial focus, Escape, Tab trapping, or focus restoration. |
| CSS cascade | `layout.css` has multiple generations of overlapping selectors and media rules | A local style change can be overridden later or alter unrelated states. |
| Responsive split | Desktop and tablet rules change `.workbench-zone` at several breakpoints | Preview/Controls can collapse too early, create overflow, or violate the frozen hierarchy. |
| Font loading | Fonts are local but used through global declarations and broad role selectors | Changing markup can trigger text reflow and move the Preview Stage. |
| Privacy preference behavior | `PrivacyModal.vue` writes analytics preference directly to LocalStorage | Restyling the checkbox/toggle must not change default, persistence, or event behavior. |

## 8. Current gap summary

### Already implemented behavior

- MPO upload and stereo parsing;
- JPG/PNG layout detection and layout switching;
- alignment X/Y/overlay controls and reset;
- Wiggle generation and playback;
- speed input, eye swap, intermediate-frame toggle, and alignment return;
- GIF and supported SBS PNG export;
- memory-based unavailable states;
- export progress and cancellation;
- success, recoverable error, blocking error, and rejection paths;
- privacy modal and focus management;
- persisted locale and export preference;
- local font files and bilingual copy infrastructure.

### Main presentation gaps

1. Shared Header and future Homepage architecture are not separated from
   `App.vue`.
2. Preview states do not share one explicit stable stage shell.
3. View context is placed in the Preview header instead of the frozen Controls
   hierarchy.
4. Wiggle controls use a compact button grid rather than the frozen technical
   row/switch language.
5. Empty/loading/input ownership is split across several siblings.
6. Message semantics are less structured than the frozen shared message
   component model.
7. CSS contains overlapping MVP and convergence layers.
8. Locale copy is distributed rather than centrally auditable.

These are implementation gaps only. They do not imply new routes, new export
formats, Split Preview, new processing behavior, or changes to Canvas code.

## 9. Safe implementation boundary

The following files/layers are presentation candidates only after separate
approval of an implementation step:

- `src/app/App.vue` template and layout wrappers;
- `src/components/UploadPanel.vue` template/classes;
- `src/components/AlignmentPreviewPanel.vue` outer presentation wrapper;
- `src/components/PreviewCanvas.vue` outer presentation wrapper;
- `src/components/ControlPanel.vue` template/classes;
- `src/components/GifExportDialog.vue` template/classes;
- `src/components/MessageCenter.vue` presentation contract;
- `src/components/PrivacyModal.vue` template/classes;
- `src/styles/base.css` and `src/styles/layout.css`.

The following remain outside the redesign boundary:

- `src/core/*` image decoding, splitting, alignment, rendering, export,
  memory, and cleanup logic;
- `src/workers/gifWorker.ts`;
- `src/app/appState.ts` state semantics and transition behavior;
- export session/cancellation logic in `App.vue`;
- locale and preference persistence semantics;
- existing tests and business event contracts.

## 10. Verification required after future changes

This document does not run or authorize implementation. When implementation
starts, each state must be verified against its frozen mockup with:

1. existing tests and typecheck/build;
2. English and Simplified Chinese locale checks;
3. fixed desktop Playwright capture at 1536×1024;
4. comparison to the state-specific frozen PNG;
5. upload, drag/drop, parse failure, alignment, Wiggle, playback, export,
   cancel, success, failure, and Privacy smoke checks;
6. responsive checks at 768, 414, 375, and 320 CSS pixels;
7. reduced-motion verification.

The visual sign-off order remains Critical → Major → Minor, followed by human
approval and promotion of the implementation screenshot to the visual
regression baseline.
