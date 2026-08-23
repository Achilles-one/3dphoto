# Achilles Cat v1 — Implementation Plan

Status: implementation plan only. Application code must not be changed until
this plan, the two Desktop concepts, and the acceptance checklist are approved.

## Implementation boundary

This is a presentation-layer migration of the existing Vue/Vite MVP.

Preserve without modification:

- MPO decoding and stereo-image parsing;
- image loading, splitting, alignment calculations, and resource cleanup;
- alignment and Wiggle Canvas rendering;
- playback, speed, eye swapping, and intermediate-frame behavior;
- GIF and SBS PNG export, memory estimates, progress, and cancellation;
- existing state management, generation guards, error codes, analytics context,
  and privacy behavior;
- Vue architecture and existing dependencies.

Do not introduce:

- a router or new product routes;
- a new state-management system;
- MP4, WebM, Rotation, advanced export, or Split Preview;
- full Works, Archive, Journal, or MiuMiu systems;
- modal-heavy onboarding or a help-center experience;
- a new animation or internationalization dependency without separate approval.

The Homepage concept is used as the parent-shell and header reference. The
repository currently has no separate Homepage component or route, so v1 does
not fabricate Homepage content or ecosystem functionality. The active product
surface remains 3D Photo Lab.

## Phase 0 — Freeze baseline and implementation contract

### Goal

Record the current behavior before any presentation changes and confirm the
implementation boundary.

### Files changed

No application files. This plan and the existing design documents are the
contract for the work.

### Components affected

None. Inventory only:

- mounted: `App.vue`, `UploadPanel.vue`, `AlignmentPreviewPanel.vue`,
  `PreviewCanvas.vue`, `ControlPanel.vue`, `MessageCenter.vue`,
  `GifExportDialog.vue`, `GuideModal.vue`, `PrivacyModal.vue`;
- not mounted: `InputDetectionPanel.vue`, `SplitPreviewPanel.vue`,
  `ErrorMessage.vue`.

### Risk

Low.

### Verification

- Record the existing results of `npm test`, `npm run typecheck`,
  `npm run build`, and `npm run verify:build`.
- Confirm the current `App.vue` event bindings and `appState.ts` phase model.
- Confirm no code is changed during the baseline step.
- Confirm the approved V2 Homepage and Lab mockups are the visual references.

### Exit condition

The baseline is recorded and the following behavior matrix is accepted:

```text
upload → parse → alignment preview → alignment controls
       → create Wiggle → playback controls → export dialog → download
```

## Phase 1 — Semantic visual foundation

### Goal

Make the CSS safe to migrate before changing page composition. Keep the visual
result close to the MVP while creating one source of truth for the design
system.

### Files changed

- `src/styles/base.css`
- `src/styles/layout.css`

No changes to `package.json`, `src/core/**`, `src/workers/**`,
`src/app/appState.ts`, or component event contracts.

### Components affected

All mounted visual components inherit the foundation, but no component logic or
template behavior changes in this phase.

### Work

- Add local `@font-face` declarations for Instrument Serif, Space Grotesk, and
  DM Mono using the existing files under `public/fonts`.
- Define semantic paper, ink, accent, rule, surface, focus, status, spacing,
  radius, shadow, easing, and duration tokens.
- Map existing warm paper and muted blue-green values into those tokens.
- Consolidate the duplicate base and later “stage-one” selector blocks in
  `layout.css` one selector family at a time.
- Preserve current dimensions for upload, preview, Canvas, controls, and
  dialogs while removing only confirmed duplicate declarations.

### Risk

Medium. The current stylesheet contains competing definitions and repeated
responsive blocks. Cascade order changes can create visual or sizing regressions
without TypeScript errors.

### Verification

- Run typecheck, tests, and build.
- Compare the empty, loading, alignment, Wiggle, exporting, and error states
  against the baseline screenshot.
- Confirm Canvas dimensions and `ResizeObserver` behavior are unchanged.
- Confirm local fonts load with usable fallbacks and do not shift the layout.
- Scan for new raw colors or one-off font declarations outside the token layer.

### Exit condition

Active selectors consume the semantic foundation, and the current workflow is
visually equivalent enough to continue safely.

## Phase 2 — Shared Achilles Cat shell and Lab entry

### Goal

Replace the centered MVP header with the approved shared header and introduce
the editorial Lab entry without changing the task flow.

### Files changed

- `src/app/App.vue` — presentation template only;
- `index.html` — page title and descriptive metadata, if approved;
- `src/styles/layout.css` — shell, header, footer, and Guide styles;
- `src/styles/base.css` — only if global focus or body rules are required.

### Components affected

- `App.vue` shell markup;
- `GuideModal.vue` visibility contract;
- `PrivacyModal.vue` and footer entry points;
- `MessageCenter.vue` layering, if fixed status placement conflicts with the
  new shell.

### Work

- Create the shared header structure used by both concepts:

  ```text
  ACHILLES CAT | Works | Archive | MiuMiu | Lab | EN / 中文 | Settings
  ```

- Mark Lab as the current product without presenting future sections as live
  features.
- Replace the centered title block with the Lab title, description, and local
  processing note from the concept.
- Add the static four-step Editorial Guide directly below the introduction.
- Keep Guide content out of a modal; remove the visible Guide trigger only after
  the static replacement is present.
- Preserve the existing footer privacy, feedback, and version behavior.
- Do not add a router or create a full Homepage route.

### Risk

Medium. The header and introduction are currently part of `App.vue`, which also
contains modal visibility and all asynchronous handlers.

### Verification

- Confirm the upload control still accepts the same files and emits the same
  events.
- Toggle Chinese/English and verify the header, Lab introduction, Guide, footer,
  and privacy entry update correctly.
- Confirm the active Lab marker is visual only and future navigation does not
  claim unavailable routes.
- Confirm Guide is static, compact, bilingual, and not modal-driven.
- Run build and inspect Desktop at the concept viewport before proceeding.

### Exit condition

The app reads as Achilles Cat with 3D Photo Lab inside it, while the existing
MVP workflow remains unchanged.

## Phase 3 — Preview + Controls workbench composition

### Goal

Move from the current single-column card stack to the approved two-zone Lab
workspace: dominant Preview Stage plus focused Controls.

### Files changed

- `src/app/App.vue` — template composition and layout wrappers only;
- `src/components/UploadPanel.vue` — presentation markup and styles;
- `src/components/AlignmentPreviewPanel.vue` — stage chrome only;
- `src/components/PreviewCanvas.vue` — stage chrome only;
- `src/components/ControlPanel.vue` — visual grouping only;
- `src/styles/layout.css` — two-zone layout and responsive rules.

### Components affected

- `UploadPanel.vue` becomes the quiet intake surface near the Lab entry.
- `AlignmentPreviewPanel.vue` becomes the primary alignment Preview Stage.
- `PreviewCanvas.vue` uses the same stage footprint for Wiggle Preview.
- `ControlPanel.vue` becomes the right-side Controls zone.

### Work

- Preserve the existing `v-if` alignment/Wiggle rendering relationship.
- Keep one stable preview footprint so mode changes do not cause page jumps.
- Establish a Desktop 7/5 or 8/4 relationship: Preview first, Controls second.
- Group existing controls visually under `View`, `Align`, `Motion`, and
  `Export`; do not add controls or state.
- Keep Horizontal, Vertical, Overlay, Reset, Create Wiggle, playback, swap,
  intermediate frames, and Download discoverable.
- Keep upload and privacy notes present without turning the intake into a SaaS
  upload card.
- Keep Split Preview absent from tabs, buttons, labels, and wrappers.

### Risk

High. This is the phase most likely to affect Canvas measurement, responsive
layout, event wiring, and the relationship between alignment and Wiggle modes.

### Verification

- Use representative MPO, side-by-side, and top-bottom inputs.
- Verify alignment offsets, overlay opacity, reset, layout toggle, and Canvas
  rendering.
- Create a Wiggle and verify playback, pause, speed, eye swap, and intermediate
  frames.
- Switch between alignment and Wiggle and confirm the stage size stays stable.
- Confirm controls are disabled during loading and exporting as before.
- Test 320px, 375px, 414px, 768px, and Desktop widths for overflow and usable
  touch targets.
- Run tests, typecheck, build, and artifact verification.

### Exit condition

The workbench matches the Lab concept structurally and all existing workflow
events still produce the same results.

## Phase 4 — Component surface and interaction states

### Goal

Apply the editorial visual language to the remaining active component surfaces
without changing their behavior.

### Files changed

- `src/components/MessageCenter.vue`
- `src/components/GifExportDialog.vue`
- `src/components/PrivacyModal.vue`
- `src/styles/layout.css`
- `src/styles/base.css`, only for shared focus and form primitives

### Components affected

- `MessageCenter.vue`
- `GifExportDialog.vue`
- `PrivacyModal.vue`
- shared buttons, sliders, tabs, file input, status, and dialog primitives

### Work

- Replace generic rounded cards with paper surfaces, hairlines, and restrained
  inverse stage treatment.
- Give the export dialog an editorial export-record hierarchy while preserving
  format, framing, size, memory, progress, cancel, and confirmation behavior.
- Keep Privacy as a quiet dialog with the existing analytics preference.
- Define the eight visual states for active controls:

  ```text
  default · hover · focus-visible · active · disabled · loading · error · success
  ```

- Keep live-region semantics and dismissal behavior for messages.
- Keep focus trapping and return-focus behavior through `useDialogFocus.ts`.
- Keep focus rings immediate and visible; do not animate them.

### Risk

Medium-high. Dialogs, fixed message surfaces, and export progress have their own
layering, focus, and cancellation behavior.

### Verification

- Open and close Privacy and Export dialogs with mouse, keyboard, and Escape.
- Verify focus enters and returns from each dialog correctly.
- Start, cancel, fail, and complete GIF export; confirm progress and download
  behavior are unchanged.
- Trigger success, warning, recoverable error, and blocking error messages.
- Verify messages are not duplicated by a new inline error surface.
- Test all controls in both locales and with `prefers-reduced-motion: reduce`.

### Exit condition

Every active interaction family has a coherent state language and all dialogs
retain their original functional contracts.

## Phase 5 — Typography, copy, and bilingual coverage

### Goal

Finish the authored Achilles Cat voice after composition and component states
are stable.

### Files changed

- `src/styles/base.css`
- `src/styles/layout.css`
- `src/app/App.vue`
- `src/components/UploadPanel.vue`
- `src/components/ControlPanel.vue`
- `src/components/MessageCenter.vue`
- `src/components/GifExportDialog.vue`
- `src/components/PrivacyModal.vue`
- optional small local copy module only if repeated copy cannot be safely
  centralized in the existing Vue structure;
- `public/fonts/*` is an existing asset dependency and should not be replaced
  or downloaded again in this phase.

### Components affected

All visible copy surfaces: header, Lab entry, Guide, upload, alignment,
Wiggle, export, privacy, feedback, errors, progress, and footer.

### Work

- Apply Instrument Serif to editorial display roles.
- Apply Space Grotesk to navigation, controls, and body copy.
- Apply DM Mono to file names, formats, dimensions, progress, and metadata.
- Centralize terminology around Achilles Cat → 3D Photo Lab → future Works /
  Archive / MiuMiu.
- Ensure every visible state has Chinese and English copy, including error
  actions and download progress.
- Keep technical error codes and diagnostics factual; do not translate codes.

### Risk

Medium. Copy length and font metrics can change wrapping, control widths, and
dialog heights without changing component logic.

### Verification

- Toggle locale after upload, during preview, while creating Wiggle, and during
  export.
- Verify no English-only or Chinese-only visible strings remain in active UI.
- Check long labels at 320px and 375px widths.
- Confirm headline and metadata hierarchy against the V2 Desktop concepts.
- Confirm fonts are served locally and the fallback layout remains stable.

### Exit condition

The interface is fully bilingual and the typography reads as a digital
photography archive rather than a generic utility.

## Phase 6 — Motion and responsive refinement

### Goal

Add only motion that communicates state or depth, then finalize narrow-screen
composition.

### Files changed

- `src/styles/layout.css`
- `src/styles/base.css`
- `src/app/App.vue` only if a presentation-only transition wrapper is required

No changes to Canvas playback or Wiggle rendering.

### Components affected

- shell and page transitions;
- loading and creating indicators;
- preview mode presentation;
- responsive header, Guide, Preview, Controls, dialogs, and footer.

### Work

- Keep the actual Wiggle playback untouched.
- Use transform and opacity only for interface motion.
- Use named easing and duration tokens.
- Remove layout-property transitions such as width-based UI motion unless the
  progress representation is explicitly verified as truthful and harmless.
- Support reduced motion with no continuous decorative movement.
- Do not add Homepage parallax to the current Lab surface. If a future Homepage
  is implemented, parallax may move only the hero image pair to communicate
  depth and must not move navigation or copy.

### Risk

Low-medium, with a high accessibility impact if reduced-motion or focus behavior
is missed.

### Verification

- Test `prefers-reduced-motion: reduce`.
- Confirm loading, creating, exporting, and error states communicate progress
  without decorative animation.
- Verify keyboard focus is visible and never animated.
- Check 320px, 375px, 414px, 768px, and Desktop layouts.
- Confirm header labels remain usable and no horizontal overflow is hidden.

### Exit condition

The UI is calm, responsive, and stable while the product’s core motion output
remains unchanged.

## Phase 7 — Orphan cleanup and CSS consolidation

### Goal

Remove only confirmed-unused presentation code after the new UI is already
working.

### Files changed

Potential removals, only after repository-wide reference checks:

- `src/components/InputDetectionPanel.vue`
- `src/components/SplitPreviewPanel.vue`
- `src/components/ErrorMessage.vue`
- `src/components/GuideModal.vue`, after the static Guide is confirmed
- `src/app/App.vue`, to remove confirmed-dead imports, local modal state, and
  template bindings
- `src/styles/layout.css`, to remove stale `.split-*`, `.guide-modal`, and
  orphaned MVP selectors

### Components affected

Only unused presentation components and the App template bindings that refer to
them. No state type, error code, renderer, or export module is removed.

### Work

- Search the full repository for every candidate component before deletion.
- Confirm the static Guide fully replaces the visible Guide modal contract.
- Keep dormant `split` state internal if it is still referenced by the state
  model; do not expose or recreate a Split Preview UI.
- Remove stale CSS only after confirming no active selector depends on it.

### Risk

Medium. Orphaned files can appear unused from `App.vue` while still being
referenced by tests, tooling, or future entry points.

### Verification

- Run repository-wide reference searches before and after each deletion.
- Run typecheck, tests, build, and release checks.
- Confirm no component import or template mount remains for removed files.
- Confirm no Split Preview text, tab, route, or visual surface appears.
- Confirm blocking and recoverable errors still arrive through
  `MessageCenter.vue`.

### Exit condition

The active UI has no unused mounted surfaces, and cleanup has not changed any
functional behavior.

## Phase 8 — Release validation and sign-off

### Goal

Prove visual equivalence to the concepts and functional equivalence to the MVP
before treating Achilles Cat v1 as complete.

### Files changed

No new application files. Update design documentation only if an approved
deviation is recorded.

### Components affected

All active components and the complete user workflow.

### Risk

High overall, because this phase validates cross-component regressions.

### Verification matrix

#### Functional

- MPO upload and parsing.
- JPG/PNG side-by-side and top-bottom parsing.
- Alignment Horizontal, Vertical, Overlay, and Reset.
- Layout toggle where the existing workflow supports it.
- Create Wiggle.
- Playback, pause, speed, swap eyes, and intermediate frames.
- GIF export sizes and framing.
- SBS PNG export when dimensions allow it.
- Export progress, cancel, failure recovery, and download.
- Upload replacement and resource cleanup.

#### Visual

- Header matches the V2 Homepage and Lab concepts.
- Lab uses Utility Rail + Preview / Controls, not a full three-column
  dashboard.
- Preview owns the visual hierarchy.
- Guide is a static four-step band below the Lab introduction.
- Empty, loading, alignment, Wiggle, creating, exporting, and error states use
  the same stage vocabulary.
- Real project or user-provided imagery is used for visual content; generated
  mockup photography is not treated as production content.

#### Accessibility and responsive

- Chinese and English complete across all visible surfaces.
- Keyboard navigation and visible focus for upload, tabs, sliders, buttons, and
  dialogs.
- Dialog focus trap and return focus.
- Live-region announcements for messages and progress.
- 320px, 375px, 414px, 768px, and Desktop layouts.
- Reduced-motion behavior.
- No hidden horizontal overflow masking a layout defect.

#### Tooling

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm run verify:build`
- `npm run release:check`

### Final exit condition

Achilles Cat v1 is a visual migration of the existing product: the page has
the approved archive/editorial language, while the current image processing,
Canvas rendering, state management, export pipeline, and privacy behavior are
functionally equivalent to the baseline.

## Change control rule

If a visual change requires editing `src/core/**`, `src/workers/**`,
`src/app/appState.ts`, export handlers, Canvas renderer code, or introducing a
new dependency, stop and request separate approval. It is outside this
presentation-layer plan.

## Phase 0 baseline record

Recorded: 2026-08-21

| Check | Result |
| --- | --- |
| `npm test` | Pass — 39 tests, 0 failures |
| `npm run typecheck` | Pass |
| `npm run build` | Pass — 54 modules transformed; production assets generated |
| `npm run verify:build` | Pass — GIF Worker smoke GIF and 3 build assets verified |
| Source/package changes during Phase 0 | None |

Phase 0 is complete. The current implementation is a valid baseline for the
presentation-layer migration. No visual implementation phase should begin
until the plan and approved design acceptance gate are confirmed.

## Phase 1 implementation record

Recorded: 2026-08-21

Changed only:

- `src/styles/base.css`
- `src/styles/layout.css`

Completed:

- Added local `@font-face` declarations for Instrument Serif, Space Grotesk,
  and DM Mono.
- Added semantic color, typography, spacing, radius, shadow, easing, duration,
  and focus tokens.
- Replaced layout stylesheet color literals with semantic token references.
- Consolidated the duplicate shell, drop-zone, preview-workspace, mode-switch,
  controls, and mobile responsive rules.
- Changed `overflow-x` to `clip` and added a shared `:focus-visible` treatment.
- Kept component templates, state management, Canvas rendering, and export
  logic unchanged.

Verification:

| Check | Result |
| --- | --- |
| `npm run build` | Pass — 54 modules transformed |
| `npm test` | Pass — 39 tests, 0 failures |
| `npm run verify:build` | Pass — GIF Worker smoke GIF and 3 build assets verified |
| CSS token reference check | Pass — no missing tokens; no raw colors remain in `layout.css` |
| Built font assets | Pass — all three font files present under `dist/fonts` |
| Source scope | Pass — only `src/styles/base.css` and `src/styles/layout.css` changed under `src` |

The local browser visual inspection could not connect because the configured
browser runtime rejected its trusted script path. No environment permissions
were expanded; visual review remains a follow-up before Phase 2 approval.

## Phase 2 implementation record

Recorded: 2026-08-21

Changed only:

- `src/app/App.vue`
- `src/styles/layout.css`
- `index.html`

Completed:

- Replaced the centered MVP title/header with the shared Achilles Cat shell:
  brand, future ecosystem entries, active Lab marker, locale switch, and
  settings status.
- Replaced the old product title and description with the editorial 3D Photo
  Lab introduction and local-processing note.
- Added a compact, static, bilingual four-step Guide below the Lab
  introduction: Upload, Align, Preview, Export.
- Removed the visible Guide modal trigger and its App-level visibility state;
  `GuideModal.vue` remains untouched for the later Phase 7 orphan check.
- Preserved upload, preview, alignment, Wiggle, export, privacy, feedback, and
  locale behavior.
- Updated the document title and descriptive metadata to Achilles Cat / 3D
  Photo Lab terminology.

Verification:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run build` | Pass — 52 modules transformed |
| `npm test` | Pass — 39 tests, 0 failures |
| `npm run verify:build` | Pass — GIF Worker smoke GIF and 3 build assets verified |
| `git diff --check` | Pass |
| Guide modal reference check | Pass — no `GuideModal` or `isGuideOpen` reference remains in `App.vue` |
| Browser visual inspection | Not completed — configured browser runtime rejected its trusted script path; no permissions were expanded |

Source scope:

- No changes to `src/core/**`, `src/workers/**`, `src/app/appState.ts`, Canvas
  rendering, image processing, or export pipeline.
- No router, dependency, future-section route, or new product functionality
  was introduced.

## Phase 3 implementation record

Recorded: 2026-08-21

Changed only:

- `src/app/App.vue`
- `src/components/UploadPanel.vue`
- `src/components/AlignmentPreviewPanel.vue`
- `src/components/PreviewCanvas.vue`
- `src/components/ControlPanel.vue`
- `src/styles/layout.css`

Completed:

- Reorganized the active Lab surface into two zones: a quiet Utility rail and
  a Preview + Controls workbench.
- Moved the existing UploadPanel into the Utility rail without changing its
  file input, drag/drop, disabled, loading, or rejection events.
- Kept AlignmentPreviewPanel and PreviewCanvas as the two states of one stable
  Preview Stage footprint, adding only presentation captions and localized
  labels.
- Moved ControlPanel into a focused Controls zone and grouped existing
  controls under Align, Motion, and Export; the App preview switch remains the
  View control.
- Preserved the existing layout toggle, alignment sliders, reset, Create
  Wiggle, playback, speed, eye swap, intermediate frames, and Download event
  bindings.
- Added responsive collapse rules so the workbench becomes a single-column
  flow before controls become too narrow for bilingual labels.
- Kept Split Preview absent from the active template; its unused component file
  remains for the planned Phase 7 reference check.

Verification:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run build` | Pass — 52 modules transformed |
| `npm test` | Pass — 39 tests, 0 failures |
| `npm run verify:build` | Pass — GIF Worker smoke GIF and 3 build assets verified |
| `git diff --check` | Pass |
| Active Split Preview reference check | Pass — no active App import or mount |
| Browser workflow and Desktop visual inspection | Not completed — configured browser runtime still rejects its trusted script path; no permissions were expanded |

Source scope:

- No changes to `src/core/**`, `src/workers/**`, `src/app/appState.ts`, Canvas
  rendering logic, image processing, state transitions, or export pipeline.
- No new dependency, route, preview mode, or product functionality was
  introduced.

## Phase 4 implementation record

Recorded: 2026-08-22

Changed only:

- `src/components/MessageCenter.vue`
- `src/components/GifExportDialog.vue`
- `src/components/PrivacyModal.vue`
- `src/styles/layout.css`

Completed:

- Restyled MessageCenter as a compact editorial status surface with localized
  status labels, retained live-region semantics, message counts, and dismiss
  events.
- Refined GifExportDialog into an export-record hierarchy with a quiet dialog
  header, hairlines, paper surfaces, restrained option states, memory guidance,
  and explicit export loading treatment.
- Refined PrivacyModal into the same paper/dialog language and kept its local
  processing copy, analytics preference, focus behavior, and close action.
- Added shared interaction styling for default, hover, focus-visible, active,
  disabled, loading, error, and success surfaces using existing state classes
  and props.
- Kept focus rings immediate and visible; no focus animation was introduced.
- Preserved all existing dialog events, progress rendering, cancellation,
  confirmation, analytics preference updates, and message dismissal behavior.

Verification:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run build` | Pass — 52 modules transformed |
| `npm test` | Pass — 39 tests, 0 failures |
| `npm run verify:build` | Pass — GIF Worker smoke GIF and 3 build assets verified |
| `git diff --check` | Pass — only existing CRLF normalization warning remains for `PreviewCanvas.vue` |
| Manual dialog keyboard/mouse verification | Pending — configured browser runtime still rejects its trusted script path; no permissions were expanded |

Source scope:

- No changes to `src/core/**`, `src/workers/**`, `src/app/appState.ts`, Canvas
  rendering, image processing, export handlers, or focus composable logic.
- No new dependency, route, modal flow, or product functionality was
  introduced.

## Phase 5 implementation record

Recorded: 2026-08-22

Changed only:

- `src/styles/base.css`
- `src/styles/layout.css`
- `src/app/App.vue`
- `src/components/UploadPanel.vue`
- `src/components/ControlPanel.vue`
- `src/components/MessageCenter.vue`
- `src/components/GifExportDialog.vue`
- `src/components/PrivacyModal.vue`
- `src/components/PreviewCanvas.vue`

Completed:

- Added named typography scale and leading tokens, applied Instrument Serif to
  display headings, Space Grotesk to body/interface copy, and DM Mono to
  labels, metadata, dimensions, progress, and numeric controls.
- Kept all font files local and reused the existing files under `public/fonts`;
  no remote font request or new dependency was introduced.
- Completed active-surface bilingual coverage for the Lab shell, Guide, upload,
  controls, preview labels, messages, export sizes, export progress, Privacy,
  footer, and download feedback.
- Localized export size labels instead of deriving English labels from enum
  values.
- Replaced the remaining active Privacy product reference with `3D Photo Lab`
  and kept technical formats, units, diagnostic codes, and file metadata
  factual and unchanged.
- Kept unused `ErrorMessage.vue`, `GuideModal.vue`, `InputDetectionPanel.vue`,
  and `SplitPreviewPanel.vue` untouched for the planned Phase 7 cleanup.

Verification:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run build` | Pass — 52 modules transformed |
| `npm test` | Pass — 39 tests, 0 failures |
| `npm run verify:build` | Pass — GIF Worker smoke GIF and 3 build assets verified |
| Local font assets in `dist/fonts` | Pass — Instrument Serif, Space Grotesk, and DM Mono present |
| `git diff --check` | Pass — only existing CRLF normalization warning remains for `PreviewCanvas.vue` |
| Browser locale workflow at active states | Pending — configured browser runtime still rejects its trusted script path; no permissions were expanded |

Source scope:

- No changes to `src/core/**`, `src/workers/**`, `src/app/appState.ts`, Canvas
  rendering logic, image processing, export handlers, or state transitions.
- No new dependency, route, internationalization plugin, or product
  functionality was introduced.

## Phase 6 implementation record

Recorded: 2026-08-22

Changed only:

- `src/styles/base.css`
- `src/styles/layout.css`

Completed:

- Added one-shot editorial reveal motion for messages and dialogs using only
  opacity and transform with existing easing and duration tokens.
- Kept the loading indicator as the only continuous interface animation; it
  communicates active preparation rather than decoration.
- Removed the export progress bar's width transition so progress updates remain
  truthful and discrete.
- Added a global reduced-motion rule that removes reveal motion, continuous
  spinner motion, and spatial transitions while preserving visible state
  surfaces and focus rings.
- Applied mobile safeguards for long display headings and no-wrap clickable
  labels; Wiggle controls collapse to one column below 760px.
- Applied `overflow-x: clip` to both `html` and `body` and did not add hidden
  overflow to mask layout defects.
- Did not add Homepage parallax to the current Lab and did not modify Canvas or
  Wiggle playback behavior.

Verification:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run build` | Pass — 52 modules transformed |
| `npm test` | Pass — 39 tests, 0 failures |
| `npm run verify:build` | Pass — GIF Worker smoke GIF and 3 build assets verified |
| Motion/overflow rule check | Pass — no width transition; reduced-motion and root overflow rules present |
| `git diff --check` | Pass — only existing CRLF normalization warning remains for `PreviewCanvas.vue` |
| Browser visual checks at 320/375/414/768/Desktop | Pending — configured browser runtime still rejects its trusted script path; no permissions were expanded |

Source scope:

- No changes to `src/core/**`, `src/workers/**`, `src/app/appState.ts`, Canvas
  rendering logic, image processing, export pipeline, or Wiggle playback.
- No new dependency, route, parallax behavior, or product functionality was
  introduced.

## Phase 7 implementation record

Recorded: 2026-08-22

Deleted confirmed-unused presentation components:

- `src/components/InputDetectionPanel.vue`
- `src/components/SplitPreviewPanel.vue`
- `src/components/ErrorMessage.vue`
- `src/components/GuideModal.vue`

Changed:

- `src/styles/layout.css`

Completed:

- Audited the full repository before deletion; remaining candidate references
  are documentation records only, with no runtime, test, or tooling consumer.
- Confirmed the static four-step Guide fully replaces the old GuideModal
  presentation contract.
- Removed stale selectors for unused detection, split preview, inline error,
  old centered header, old Guide modal/steps, and unused format examples.
- Kept the dormant `split` state internal; no Split Preview UI or new preview
  mode was introduced.
- Kept all error generation, diagnostic codes, MessageCenter delivery,
  alignment, Canvas, Worker, export, and privacy behavior intact.

Verification:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run build` | Pass — 52 modules transformed |
| `npm test` | Pass — 39 tests, 0 failures |
| `npm run verify:build` | Pass — GIF Worker smoke GIF and 3 build assets verified |
| `npm run release:check` | Pass — test, build, and artifact verification completed |
| Removed component reference check | Pass — no references remain in `src` |
| Stale selector check | Pass — no Phase 7 orphan selectors remain in `layout.css` |
| `git diff --check` | Pass — only existing CRLF normalization warning remains for `PreviewCanvas.vue` |

Source scope:

- No changes to `src/core/**`, `src/workers/**`, `src/app/appState.ts`, Canvas
  rendering, image processing, export pipeline, or state types.
- No new dependency, route, UI surface, or product functionality was
  introduced.

## Phase 8 validation record

Recorded: 2026-08-22

Phase 8 automated release validation is complete. No application files were
changed in this phase.

Verified:

| Area | Result |
| --- | --- |
| MPO/stereo processing regression suite | Pass — 39 tests, 0 failures |
| Typecheck and production build | Pass — 52 modules transformed |
| GIF Worker and build artifacts | Pass — smoke GIF and required assets verified |
| `npm run release:check` | Pass |
| Source scope | Pass — no changes in `src/core/**`, `src/workers/**`, or `src/app/appState.ts` |
| Removed component references | Pass — no active references to removed components remain |
| Split Preview surface/text/routes | Pass — no active surface, text, or route found |
| Works / Archive / Journal routes | Pass — no routes introduced |
| Lab parallax | Pass — none introduced |
| `git diff --check` | Pass — only existing CRLF normalization warning remains for `PreviewCanvas.vue` |

Functional coverage remains aligned with the baseline: upload parsing,
alignment, Wiggle settings, Canvas rendering, GIF/SBS export calculations,
memory guards, cancellation-related state, and privacy-related tests all pass.

Remaining sign-off item:

- Manual browser validation of MPO/JPG/PNG upload, alignment, Wiggle playback,
  export dialog keyboard behavior, locale switching, reduced motion, and the
  320/375/414/768/Desktop layouts is pending because the configured browser
  runtime rejects its trusted script path. No permissions were expanded.

Final status: automated release gate passed; full visual and interaction sign-off
is pending the browser runtime check.
