/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */

# Achilles Cat UI Audit

Audit scope: current MVP UI and its surrounding product structure.  
Audit target: the Vue/Vite application in this repository.  
Audit mode: read-only; no application code was changed.

## Executive verdict

The product is functionally credible but visually and structurally still reads
as a single-purpose beta utility. The important processing work is present:
local image handling, stereo alignment, Wiggle preview, GIF export, MPO support,
memory safeguards, privacy messaging, and bilingual copy. The interface around
that work has not yet become Achilles Cat.

The central issue is not that the UI is “too plain.” It is that the current
page has no relationship between the product name **3D Photo Enhancer**, the
future **achillescat.com** ecosystem, and the visual language defined in
`DESIGN_SYSTEM.md`. It is a centered tool screen with a collection of reliable
but generic panels. The redesign should make **3D Photo Lab** feel like one
carefully authored room inside a larger Achilles Cat archive.

## Pre-flight findings

| Signal | Current evidence | Audit implication |
| --- | --- | --- |
| Framework | Vue 3 + Vite; mounted in `src/main.ts:1-7` and declared in `package.json:18-28` | Preserve the framework and rendering architecture. |
| Runtime | Single static app; no router or route-level shell | Product IA needs to be introduced deliberately before Works / Archive / MiuMiu are added. |
| Typography | Inter is the only global family in `src/styles/base.css:1-11`; a separate system mono stack appears in `src/styles/layout.css:347-353` | Current UI has no display/body/label role system. |
| Palette | Warm paper and teal-green direction exists, but values are hard-coded throughout `src/styles/layout.css` | The existing palette is a good foundation; its implementation is not portable. |
| Motion | No motion library in `package.json`; one spinner and a width transition in `src/styles/layout.css:649-650,970-972` | Keep motion-cut; replace incidental motion with a small, intentional vocabulary. |
| Spacing | Repeated literal values and two separate responsive blocks in `src/styles/layout.css:866-927,1000-1016` | Tokenize before visual refinement. |
| Existing system | `docs/design/DESIGN_SYSTEM.md` defines Split Studio / Archive Catalogue, warm paper, blue-green accent, 2+1 typography, and an archive-first voice | This is the source of truth for the redesign. |

## 1. Current information architecture

### Current task IA

The MVP is organized around one linear task:

```text
Open tool
  → Upload one stereo source
  → Read / parse locally
  → Align left and right views
  → Create Wiggle preview
  → Adjust playback / eye order / intermediate frames
  → Download GIF or SBS PNG
```

This is a strong functional spine. It is easy to explain and should remain the
core of 3D Photo Lab.

### Current product IA

The product IA is effectively:

```text
3D Photo Enhancer
  ├─ Guide modal
  ├─ Privacy modal
  ├─ Feedback link
  └─ One workspace
      ├─ Upload
      ├─ Alignment Preview
      ├─ Wiggle Preview
      ├─ Controls
      └─ Download dialog
```

There is no top-level Achilles Cat layer, no product switcher, no Works index,
no Archive index, and no MiuMiu destination. The app currently behaves as a
standalone microsite, not as **3D Photo Lab inside achillescat.com**.

### Recommended ecosystem relationship

This audit does not authorize implementation, but the future structure should
be planned as:

```text
achillescat.com
  ├─ Works       curated outcomes, experiments, and case studies
  ├─ Archive     process notes, tools, references, and older work
  ├─ MiuMiu      a distinct editorial / experimental section; content model to confirm
  └─ 3D Photo Lab
      ├─ Upload / intake
      ├─ Align / compare
      ├─ Wiggle / animate
      └─ Export / record
```

The product page should share the Achilles Cat utility rail and footer language,
but the workbench must remain the dominant surface. The ecosystem navigation
should not turn the lab into a marketing landing page.

## 2. Current page structure

The rendered page is a centered, single-column stack:

1. **Centered header** — product title, subtitle, Guide, and language toggle
   (`src/app/App.vue:876-893`).
2. **Upload section** — one framed drop zone with format and privacy hints
   (`src/app/App.vue:895-903`, `src/components/UploadPanel.vue:57-86`).
3. **Preview workspace** — title plus a two-tab mode switch
   (`src/app/App.vue:905-948`).
4. **Conditional stage** — alignment canvas or Wiggle canvas
   (`src/app/App.vue:950-1002`, `src/components/AlignmentPreviewPanel.vue:87-103`,
   `src/components/PreviewCanvas.vue:106-133`).
5. **Controls** — alignment sliders before Wiggle creation; playback and export
   controls after creation (`src/app/App.vue:1004-1020`,
   `src/components/ControlPanel.vue:38-62`).
6. **Loading overlay** — centered spinner while creating the Wiggle
   (`src/app/App.vue:1021-1030`).
7. **Global message center** — fixed success, info, warning, and error messages
   (`src/app/App.vue:1032-1036`, `src/components/MessageCenter.vue:17-22`).
8. **Download dialog** — format, framing, size, memory guidance, and progress
   (`src/app/App.vue:1038-1053`, `src/components/GifExportDialog.vue:97-113`).
9. **Centered footer** — beta version, privacy, and feedback
   (`src/app/App.vue:1055-1063`).
10. **Guide and privacy dialogs** — teleported modal surfaces
    (`src/app/App.vue:1064-1073`).

The structure is coherent as an MVP task flow, but it lacks the design system’s
intended rhythm: editorial entry → asymmetric workbench → index band → quiet
footer. Upload and preview are currently sibling cards with similar visual
weight, so the image stage never becomes the clear hero of the work.

## 3. Current components

### Mounted components

| Component | Current responsibility | Audit assessment |
| --- | --- | --- |
| `src/app/App.vue` | Owns page shell, async file flow, export flow, modal state, analytics context, locale, and event wiring | Too much orchestration and presentation in one 1,075-line file; preserve behavior while separating shell from workbench composition. |
| `src/components/UploadPanel.vue` | File picker, drag/drop, accepted-file validation, loading state | Good functional boundary; needs Achilles Cat intake language and archive framing. |
| `src/components/AlignmentPreviewPanel.vue` | Canvas-based overlap/alignment preview | High-value product surface; should become the primary stage. |
| `src/components/PreviewCanvas.vue` | Canvas-based Wiggle playback preview | High-value product surface; should share stage chrome and metadata with alignment. |
| `src/components/ControlPanel.vue` | Sliders, reset, create, speed, playback, eye order, intermediate frames, download | Functionally broad and visually dense; needs grouping by intent. |
| `src/components/MessageCenter.vue` | Fixed transient status messages | Useful, but success feedback currently competes with the workbench. |
| `src/components/GifExportDialog.vue` | Export format, framing, size, memory guidance, progress | Behaviorally important; visually too generic and needs a stronger “export record” hierarchy. |
| `src/components/GuideModal.vue` | Three-step guide and supported formats | Useful support surface; current three-card step treatment is generic. |
| `src/components/PrivacyModal.vue` | Local processing explanation and analytics preference | Keep the privacy boundary; redesign the presentation and close affordance. |

### Present but not mounted

The repository contains components that do not appear in the current App shell:

- `src/components/InputDetectionPanel.vue:14-38` — detection metadata for input
  format, dimensions, view count, and EXIF orientation.
- `src/components/SplitPreviewPanel.vue:12-31` — separate left/right image
  preview.
- `src/components/ErrorMessage.vue:15-37` — inline recoverable / blocking error
  surface.

The state layer still exposes a `split` preview mode at
`src/app/appState.ts:349-351`, but the current template only renders `align` or
`wiggle` at `src/app/App.vue:950-1002`. This creates an architectural mismatch:
the codebase suggests a richer product model than the page actually exposes.
The redesign should decide which of these are real product surfaces before
restyling them.

## 4. Audit findings by severity

### Critical

#### C1 — Generic single-tool structure

- **Tell:** AI-default application shell / centered single-column tool page.
- **Where:** `src/app/App.vue:876-1075`; `src/styles/layout.css:930-1016`.
- **Severity:** critical — ships as a structural mismatch with the locked
  Achilles Cat DNA.
- **Fix:** Establish an Achilles Cat utility rail and product identity, then
  rebuild the page around a left-biased editorial entry and asymmetric 3D Photo
  Lab workbench.

The current page is not merely minimal; its dominant structure is the generic
“title → upload card → workspace card → footer” pattern. It does not express
Split Studio, Archive Catalogue, or a product inside a larger creative system.

#### C2 — Design-system drift at the CSS foundation

- **Tell:** Mid-render token improvisation and palette drift.
- **Where:** `src/styles/base.css:1-11`; `src/styles/layout.css:9-864,929-1016`.
- **Severity:** critical — every redesign change would currently require editing
  scattered literals.
- **Fix:** Introduce semantic Achilles Cat tokens first, then make every surface,
  border, type role, shadow, and state consume those tokens.

Static scanning finds approximately 141 raw color occurrences and 55 unique hex
values in `src/styles`. There is no `:root` semantic color layer, no display/body/
mono token set, and no named spacing scale in the implementation. The palette
direction is close to the design system; the implementation is not governed by
it.

#### C3 — Product identity is absent from the application surface

- **Tell:** Product is presented as a standalone beta utility rather than a
  branded product room.
- **Where:** `index.html:5-11`; `src/app/App.vue:885-891`; `README.md:1-3`.
- **Severity:** critical — the redesign cannot establish achillescat.com
  continuity without a naming and shell decision.
- **Fix:** Make **Achilles Cat** the parent identity, position this surface as
  **3D Photo Lab**, and keep “3D Photo Enhancer” as a capability or legacy
  descriptor only if needed.

The current title, meta description, page heading, and copy all center the old
MVP name. There is no visible relationship to future Works, Archive, or MiuMiu
sections.

### Major

#### M1 — Duplicate and competing CSS layers

- **Tell:** Cascade accumulation / dead-style drift.
- **Where:** `src/styles/layout.css:1-927` and the second “Stage-one page shell”
  block at `src/styles/layout.css:929-1016`.
- **Severity:** major — looks unfinished and makes visual changes unpredictable.
- **Fix:** Consolidate each selector into one source of truth and delete only
  confirmed dead selectors after component usage is mapped.

There are repeated definitions for `.app-shell`, `.upload-section`,
`.preview-workspace`, `.drop-zone`, `.section-header`, `.controls-panel`, and
`.mode-switch`, plus two separate mobile media blocks. The second block silently
overrides the first in several places.

#### M2 — Typography has no hierarchy beyond size and weight

- **Tell:** Single-family UI with ad hoc mono exception.
- **Where:** `src/styles/base.css:1-11`; `src/styles/layout.css:25-40,347-353`.
- **Severity:** major — the editorial / archive character cannot appear.
- **Fix:** Add named display, body, and label roles; keep Inter as the body
  fallback and use a roman display face plus mono metadata consistently.

The product title is centered and set in the same global family as controls and
body copy. The release metadata uses a separate raw mono declaration, while
labels elsewhere are uppercase Inter. This reads as default browser styling with
extra boldness rather than a designed type system.

#### M3 — Surface language is generic card UI

- **Tell:** Repeated rounded white panels with soft shadows; three equal guide
  tiles.
- **Where:** `src/styles/layout.css:43-59,147-155,303-311,405-430,461-467,949-950,993-998`.
- **Severity:** major — looks AI-generated and conflicts with tactile editorial
  surfaces.
- **Fix:** Reduce card count, flatten the stage, use hairline rules and semantic
  surface levels, and reserve depth for truly floating dialogs.

Upload, workspace, guide, export, and privacy surfaces all reuse near-identical
white fill, border, radius, and shadow combinations. The Guide modal adds a
three-column equal tile pattern, which reinforces a generic SaaS template.

#### M4 — Workbench hierarchy is flat and control-heavy

- **Tell:** Preview, tabs, controls, and actions share the same panel rhythm.
- **Where:** `src/app/App.vue:905-1020`; `src/styles/layout.css:140-145,176-188,739-785`.
- **Severity:** major — the image does not visually own the experience.
- **Fix:** Make the canvas the primary stage; move controls into intentional
  groups for view, alignment, motion, and export using an asymmetric 7/5 or 8/4
  composition.

The current layout is one vertical stack. The mode switch appears beside the
section heading, then the stage, then a dense control block. This is usable but
not editorial, archive-like, or exploratory.

#### M5 — Interaction states are incomplete and inconsistent

- **Tell:** Default and disabled states are present, but component-level hover,
  active, focus-visible, loading, error, and success states are not systematized.
- **Where:** `src/styles/base.css:31-39`; `src/styles/layout.css:90-96,147-174,690-731`;
  `src/components/ControlPanel.vue:43-59`.
- **Severity:** major — interaction polish and keyboard confidence are uneven.
- **Fix:** Define the full eight-state contract for every interactive family and
  use the Achilles Cat focus token without animating the ring.

The only explicit focus-visible treatment is on the drop zone. Most buttons and
controls rely on browser defaults or shared disabled opacity. Sliders and the
number input have no intentional visual state language.

#### M6 — Motion conflicts with the locked motion stance

- **Tell:** Layout-property animation and browser-default easing.
- **Where:** `src/styles/layout.css:649-650,970-972`.
- **Severity:** major — the motion is incidental rather than authored.
- **Fix:** Keep the renderer behavior, but limit UI motion to transform/opacity,
  use named easings, and replace width animation with a non-layout progress
  treatment or explicitly justify the progress track as an exception.

`transition: width 160ms ease` uses the default easing and animates a layout
property. The spinner is appropriately disabled for reduced motion, but the
overall interaction stance is not yet expressed through shared tokens.

#### M7 — Responsive foundation is not aligned with the system contract

- **Tell:** `overflow-x: hidden`, duplicated mobile rules, and unverified
  responsive affordances.
- **Where:** `src/styles/base.css:17-22`; `src/styles/layout.css:866-927,1000-1016`.
- **Severity:** major — narrow-screen behavior can hide overflow instead of
  resolving it.
- **Fix:** Use `overflow-x: clip`, consolidate the responsive rules, and verify
  the actual UI at 320, 375, 414, and 768px with clickable labels kept on one
  line.

The project has useful mobile collapse rules, but they are split across two
blocks and were not authored as one coherent layout system. The desktop
`.wiggle-control-grid` is particularly dense before it collapses to two columns.

#### M8 — Component model and rendered IA disagree

- **Tell:** Orphaned components and state branches imply features that the page
  does not expose.
- **Where:** `src/components/InputDetectionPanel.vue:14-38`,
  `src/components/SplitPreviewPanel.vue:12-31`,
  `src/components/ErrorMessage.vue:15-37`,
  `src/app/appState.ts:349-351`.
- **Severity:** major — redesigning unused surfaces would create accidental
  scope and inconsistent states.
- **Fix:** Decide the canonical IA for detection metadata, split preview, and
  inline errors before visual redesign; remove or mount each path intentionally.

#### M9 — Product copy is implementation-local and brand-inconsistent

- **Tell:** Inline bilingual strings, old product naming, and mixed voice.
- **Where:** `src/app/App.vue:879-891`; `src/components/UploadPanel.vue:70-75`;
  `src/components/ControlPanel.vue:43-59`; `src/components/GifExportDialog.vue:39-46`.
- **Severity:** major — brand voice cannot be tuned without touching many
  templates.
- **Fix:** Establish Achilles Cat / 3D Photo Lab terminology and a small copy
  source per surface while preserving the current English/Chinese behavior.

### Minor

#### m1 — Footer reads like a beta utility footer

- **Tell:** Centered version / privacy / feedback row.
- **Where:** `src/app/App.vue:1055-1063`; `src/styles/layout.css:992`.
- **Severity:** minor — useful but generic.
- **Fix:** Convert it into the design system’s quiet index footer with parent
  identity, product label, privacy, feedback, and future ecosystem destinations.

#### m2 — Utility actions are visually detached from the product

- **Tell:** Guide and locale controls float in the top-right of a centered
  header with no shared utility rail.
- **Where:** `src/app/App.vue:877-884`; `src/styles/layout.css:935-947`.
- **Severity:** minor — the actions work but do not establish site-level chrome.
- **Fix:** Place them in the Achilles Cat utility rail and give the product room
  a clear current-location treatment.

#### m3 — Modal surface contains unfinished affordance residue

- **Tell:** Commented-out close button remains in the privacy modal.
- **Where:** `src/components/PrivacyModal.vue:39-44`.
- **Severity:** minor — small implementation residue that signals iteration.
- **Fix:** Choose one consistent close pattern for all dialogs and remove the
  unused markup during implementation.

#### m4 — Metadata is available but not surfaced as an archive index

- **Tell:** Detection metadata component exists but is not mounted.
- **Where:** `src/components/InputDetectionPanel.vue:14-38`; current App shell
  at `src/app/App.vue:895-1030`.
- **Severity:** minor — useful product information is currently hidden from the
  information hierarchy.
- **Fix:** If retained, place it as a compact index band directly under the
  active stage rather than as another card.

## 5. What makes the product feel like an MVP

1. **It has a name but not a world.** “3D Photo Enhancer” explains the utility
   but does not place it inside Achilles Cat.
2. **The first screen is a form, not an authored entry.** The upload zone is
   functional but visually interchangeable with many upload widgets.
3. **Everything is a panel.** Equal borders, equal radii, and equal shadows
   flatten the difference between image work, controls, metadata, and support.
4. **The workbench is not staged.** The preview canvas is a large rectangle, but
   it lacks a strong frame, index labels, comparison language, or a clear
   relationship to the controls.
5. **The CSS shows iteration history.** Duplicate blocks, raw literals, and
   unused components make the product feel in-progress even when behavior works.
6. **The brand voice is generic utility copy.** “Upload,” “Download,” and
   “Create Wiggle” are serviceable labels but do not yet sound like a studio
   instrument.
7. **The ecosystem is invisible.** Works, Archive, and MiuMiu cannot be
   anticipated from the current surface.

## 6. What should be redesigned

### P0 — brand and structure

- Establish the Achilles Cat global shell and the **3D Photo Lab** product
  identity.
- Replace the centered tool-page structure with the design system’s utility rail,
  editorial entry, asymmetric workbench, index band, and quiet footer.
- Decide how Works, Archive, and MiuMiu appear in the parent shell without
  turning the lab into a marketing page.

### P0 — visual foundation

- Consolidate colors, surfaces, shadows, typography, spacing, radii, easing, and
  durations into semantic tokens from `DESIGN_SYSTEM.md`.
- Remove duplicate layout blocks and establish one responsive source of truth.
- Use a roman display face, Inter body, and mono metadata roles.

### P1 — workbench hierarchy

- Make the canvas the dominant visual stage.
- Reframe alignment and Wiggle as two views of the same lab stage, not two
  unrelated tabs.
- Group controls into View / Align / Motion / Export.
- Surface file metadata and input detection as a compact archive index.
- Give export a clear “record” moment without adding celebratory UI.

### P1 — interaction and accessibility

- Define all eight component states.
- Add visible focus rings for buttons, tabs, sliders, number input, upload, and
  dialog actions.
- Normalize dialog close behavior and status presentation.
- Verify narrow-screen behavior at the design system’s required widths.

### P2 — content and ecosystem readiness

- Centralize bilingual copy and create a small terminology map for Achilles Cat,
  3D Photo Lab, Works, Archive, and MiuMiu.
- Define whether MiuMiu is a product, archive category, or editorial space before
  adding navigation or route placeholders.
- Keep product support copy close to the task; move brand storytelling to the
  parent shell and future Works / Archive surfaces.

## 7. What should remain unchanged

The redesign should preserve the working product behavior and its trust model:

- local browser processing and the explicit privacy boundary documented in
  `README.md:3,14`;
- the upload acceptance flow for MPO, JPG/JPEG, PNG, side-by-side, and top-bottom
  inputs;
- alignment behavior, eye swapping, overlay opacity, and layout switching;
- Wiggle preview behavior, playback, speed, and intermediate-frame controls;
- GIF and SBS PNG export options, memory-budget checks, progress, and cancel;
- error diagnostics and recoverable error handling;
- the Vue/Vite build, test, typecheck, worker, and release-check pipeline;
- the existing warm paper / teal-green direction and Inter as a body fallback;
- bilingual support, while moving copy ownership out of dense templates;
- canvas renderer ownership and resource cleanup boundaries in the current
  preview components.

The redesign is a visual and IA transformation, not a reason to rewrite the
image-processing core or weaken the privacy contract.

## 8. Potential redesign risks

| Risk | Why it matters | Mitigation before implementation |
| --- | --- | --- |
| Canvas geometry regression | `PreviewCanvas` and `AlignmentPreviewPanel` size renderers from live DOM measurements and `ResizeObserver` | Preserve stage measurement contracts; change containers incrementally and test real images after each structural step. |
| Async file / export regression | `App.vue` owns generation counters, cancellation, resource release, and memory checks | Separate visual composition from event orchestration; do not move async logic during the first visual pass. |
| CSS cascade regression | Duplicate selectors currently override each other by order | Consolidate selectors before introducing new component variants. |
| Scope explosion from future IA | Works, Archive, and MiuMiu are named but not yet defined | Establish shell boundaries and content models first; do not fabricate pages or content. |
| Brand/product confusion | Replacing “3D Photo Enhancer” too aggressively could break existing recognition or feedback language | Use “3D Photo Lab” as product identity and retain the old name as a capability descriptor during transition. |
| Bilingual layout overflow | English and Chinese labels have different lengths and line-breaking behavior | Treat both locales as first-class responsive fixtures; keep clickable labels single-line or shorten them. |
| Accessibility regressions | Tabs, dialogs, sliders, and canvas labels already have semantics that must survive restyling | Keep roles and focus management intact; test keyboard flows after each component migration. |
| Token contrast drift | Moving from raw colors to OKLCH semantic tokens can change status and focus contrast | Verify every text/background pair and focus ring against the design system baseline. |
| Dead component false confidence | Existing unused components can look like supported product features | Confirm the canonical IA before mounting, deleting, or restyling them. |
| Fixed overlays colliding with new shell | Message center and modals use fixed positioning and z-index values | Define overlay layers centrally and test messages, dialogs, mobile sheets, and export progress together. |

## 9. Recommended redesign sequence

1. Confirm parent shell and naming: Achilles Cat → 3D Photo Lab → future Works /
   Archive / MiuMiu.
2. Establish semantic tokens and consolidate the stylesheet without changing
   behavior.
3. Refactor the page shell around the design system’s Split Studio grammar.
4. Recompose the upload, stage, metadata, controls, and export hierarchy.
5. Normalize component states, dialogs, status messaging, and responsive rules.
6. Decide the fate of the orphaned split / detection / inline-error components.
7. Validate with representative real images, both locales, keyboard navigation,
   reduced motion, and the existing release checks.

## Audit count

3 critical · 9 major · 4 minor
