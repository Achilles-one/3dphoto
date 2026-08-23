# Achilles Cat Lab — Visual Gap Audit

Status: audit only  
Target: approved Lab concept, `docs/design/mockups/ACHILLES_CAT_LAB_DESKTOP_V2.png`  
Scope: presentation layer and responsive layout only. No business logic, canvas rendering, export pipeline, or component functionality is being changed by this audit.

## Audit basis

The comparison uses:

- `docs/design/DESIGN_SYSTEM.md`
- `docs/design/LAB_WIREFRAME.md`
- `docs/design/DESIGN_CONCEPTS.md`
- `docs/design/mockups/ACHILLES_CAT_LAB_DESKTOP_V2.png`
- Current Vue templates and CSS in `src/app/App.vue`, `src/components/`, and `src/styles/`

The approved concept is treated as the visual source of truth. The audit does not introduce a new layout direction. The rendered page was not captured in the in-app browser because the browser runtime could not resolve its trusted service module; findings below are therefore based on the approved mockup plus the current DOM/CSS implementation. The next implementation pass should visually verify the findings at the approved desktop viewport and at 320, 375, 414, and 768 CSS-pixel widths.

## Executive verdict

The current implementation has the correct content vocabulary, local-processing message, bilingual structure, real font files, static Guide, and preserved Lab workflow. Its main visual gap is structural: the page still reads as a compact application dashboard, while the approved concept reads as a wide editorial instrument with one dominant photographic stage.

The highest-impact correction is to restore the approved two-zone composition: the global header remains the utility rail, and the Lab body becomes Preview + Controls. The existing upload capability must remain available, but it should no longer create a third persistent dashboard column.

## Findings by priority

### 1. Overall composition and proportions

#### V-01 — Persistent third column creates a dashboard shell

- **Tell:** AI-template structural fingerprint / dashboard shell.
- **Current implementation:** The Lab body is a three-part desktop composition: a persistent `utility-rail`, then a `workbench-zone` containing preview and controls. The upload panel occupies its own vertical column before the image is visible.
- **Approved concept:** The global header carries the utility-rail responsibilities. The Lab body is a focused two-zone workbench: one dominant Preview Stage and one subordinate Controls column. The approved image begins directly with the preview stage and controls below the Guide band.
- **Severity:** Critical
- **Exact area responsible:** `src/app/App.vue:958-981`; `src/styles/layout.css:922-937`; `src/styles/layout.css:1020-1027`.
- **Recommended correction:** Reflow the parent layout to the approved Preview + Controls composition and place the existing `UploadPanel` in the approved compact input position within that flow. Preserve its file events and validation; remove only the persistent third-column presentation shell.

#### V-02 — The desktop canvas is too narrow for the archive/workbench reading

- **Tell:** Constrained application canvas.
- **Current implementation:** `.app-shell` caps the entire page at `1120px`, so the Lab stage, controls, header, and Guide all share a relatively narrow centered canvas.
- **Approved concept:** The approved desktop composition uses the available page width, with a small, consistent edge inset. The preview stage can occupy most of the viewport while the controls remain legible at the right.
- **Severity:** Major
- **Exact area responsible:** `src/styles/layout.css:1-5`.
- **Recommended correction:** Establish the page container from the approved desktop composition rather than the current compact dashboard cap. Keep a fluid `minmax(0, 1fr)` content region and preserve a deliberate edge inset; do not compensate with child-level margins.

### 2. Preview stage visual dominance

#### V-03 — Preview is framed as a card instead of reading as the primary photograph

- **Tell:** Card-in-card; equal-surface hierarchy.
- **Current implementation:** `.preview-workspace` inherits a rounded border, surface background, and panel shadow, then contains another `.preview-stage` / `.align-stage` with its own stage surface and radius. The stage height is capped at `clamp(360px, 48vw, 520px)`.
- **Approved concept:** The preview is the largest object on the page. It uses a dark inverse photographic stage with a thin frame, enough room for alignment guides, and compact metadata around the image. The surrounding page remains quiet and does not compete as a second card surface.
- **Severity:** Major
- **Exact area responsible:** `src/styles/layout.css:52-60`; `src/styles/layout.css:126-131`; `src/styles/layout.css:173-184`; `src/styles/layout.css:1029-1034`; `src/components/AlignmentPreviewPanel.vue:87-92`; `src/components/PreviewCanvas.vue:107-115`.
- **Recommended correction:** Make the preview stage the primary framed surface and remove the extra Lab-level card treatment around it. Increase its share through the parent grid and retain the existing canvas dimensions, guides, empty, loading, and generated states inside that same footprint.

#### V-04 — Preview mode switching is visually detached from the approved controls hierarchy

- **Tell:** Split control ownership.
- **Current implementation:** `Alignment Preview` and `Wiggle Preview` are presented as a two-button tab control inside the preview header. The control column separately reports the current mode, so the mode decision is split across two zones.
- **Approved concept:** The right column begins with `VIEW`, then groups `ALIGN`, `MOTION`, and `EXPORT`. View state, alignment state, and output actions share one calm control rhythm; the preview remains visually uninterrupted.
- **Severity:** Major
- **Exact area responsible:** `src/app/App.vue:986-1028`; `src/app/App.vue:1085-1099`; `src/styles/layout.css:145-171`.
- **Recommended correction:** Recompose the existing preview-mode buttons into the approved View group in the controls column, retaining `showAlignPreview` and `showWigglePreview` unchanged. Keep the preview header limited to stage identity and file metadata.

### 3. Header geometry

#### V-05 — Header is centered inside the app shell and misses the approved rail geometry

- **Tell:** Centered everything / generic nav row.
- **Current implementation:** The header is a three-track grid inside the `1120px` shell. The brand has no separator from the navigation, and the active Lab state is drawn as a bottom underline.
- **Approved concept:** The header spans the full editorial canvas. The brand is separated from the route list by a vertical rule; Lab is indicated by a small dot beneath the label; language and Settings sit quietly at the far right.
- **Severity:** Major
- **Exact area responsible:** `src/app/App.vue:875-898`; `src/styles/layout.css:702-754`.
- **Recommended correction:** Fix the header parent geometry and add the approved brand/nav separator and active-dot relationship through the header layout and pseudo-element rules. Keep the existing navigation labels, locale action, and status semantics.

### 4. Controls column width and alignment

#### V-06 — Controls are too card-like and their internal alignment does not match the reference

- **Tell:** Card-in-card; equal padding on everything.
- **Current implementation:** `.controls-zone` is a bordered, rounded, filled panel with a 2px accent strip. Alignment sliders use a two-column grid, so the three adjustments do not form the full-width label/track/value rows shown in the concept.
- **Approved concept:** Controls are a narrow, flat editorial column. Hairline separators divide groups. Alignment controls are calm, vertically aligned rows with labels, tracks, and values; the primary Create Wiggle action is visible without turning the column into a dashboard card.
- **Severity:** Major
- **Exact area responsible:** `src/styles/layout.css:1051-1062`; `src/styles/layout.css:1088-1093`; `src/styles/layout.css:1113-1125`; `src/components/ControlPanel.vue:38-84`.
- **Recommended correction:** Let the parent workbench grid establish the control width, then use one-column control rows inside it. Replace the elevated panel treatment with the approved rule-based group rhythm; keep all existing emits, values, and disabled states.

#### V-07 — Upload treatment is oversized relative to the control hierarchy

- **Tell:** Giant SaaS upload card.
- **Current implementation:** The persistent rail contains a `min-height: 190px` dashed drop zone with a tinted background and centered instructional copy.
- **Approved concept:** Upload is a quiet technical entry point near the Lab introduction/workbench, not a large standalone onboarding surface. The loaded file metadata and stage should become the first visual anchor.
- **Severity:** Major
- **Exact area responsible:** `src/components/UploadPanel.vue:58-86`; `src/styles/layout.css:77-119`; `src/styles/layout.css:966-978`.
- **Recommended correction:** Reduce the upload presentation to the approved compact input treatment and let its parent placement carry the hierarchy. Preserve MPO/JPG/PNG acceptance, drag/drop, disabled, loading, and rejection behavior.

### 5. Typography hierarchy

#### V-08 — Lab title is scaled as a hero rather than an editorial entry heading

- **Tell:** Oversized centered-hero bias; decorative eyebrow.
- **Current implementation:** The Lab title uses `clamp(3.4rem, 8vw, 7.25rem)` with `line-height: 0.88`, preceded by `ACHILLES CAT / 01`. At desktop widths this can dominate the page before the actual photograph appears.
- **Approved concept:** `3D Photo Lab` is a clear editorial entry heading, large but proportionate to the preview stage. The page is an instrument entry, not a marketing hero; the visible hierarchy quickly moves from title and one-sentence description to the Guide and image.
- **Severity:** Major
- **Exact area responsible:** `src/app/App.vue:901-920`; `src/styles/layout.css:790-815`.
- **Recommended correction:** Tune the display scale and line-height as a parent-level intro rhythm so the title remains prominent without becoming a hero block. Retain Instrument Serif for the title, Space Grotesk for the description, and DM Mono for local-processing metadata.

#### V-09 — Section labels are more frequent and more prominent than the approved reference

- **Tell:** Eyebrow on every section.
- **Current implementation:** The intro, preview header, utility rail, controls header, and control groups all use uppercase kicker labels such as `ACHILLES CAT / 01`, `VIEW`, `UTILITY RAIL`, and `CONTROLS`.
- **Approved concept:** Mono labels are used as sparse metadata and group markers. The visual hierarchy is carried by the title, photograph, and quiet rules; labels should not become a repeated stack of equal-weight headings.
- **Severity:** Minor
- **Exact area responsible:** `src/app/App.vue:903-904`; `src/app/App.vue:960-963`; `src/app/App.vue:987-999`; `src/app/App.vue:1085-1099`; `src/components/ControlPanel.vue:41-45`, `55-59`, `64-82`; `src/styles/layout.css:9-17`, `1580-1612`.
- **Recommended correction:** Keep labels only where they identify a real mode, metadata band, or control group; reduce decorative repetition without changing the underlying content or bilingual coverage.

### 6. Spacing rhythm

#### V-10 — Intro and Guide create too much vertical separation before the workbench

- **Tell:** Equalized application spacing / delayed primary object.
- **Current implementation:** The intro uses up to `86px` of top padding, and the Guide uses a `50px` top margin before the workbench begins.
- **Approved concept:** The concept preserves generous paper space, but the title, one-line description, local-processing note, Guide rule, and preview stage form one continuous editorial entry. The image arrives earlier and occupies more of the page.
- **Severity:** Major
- **Exact area responsible:** `src/styles/layout.css:790-793`; `src/styles/layout.css:828-835`; `src/styles/layout.css:923-929`.
- **Recommended correction:** Rebalance the intro-to-Guide-to-workbench parent gaps as one vertical scale. Reduce the empty lead-in only enough to make the preview arrive at the concept’s proportion; avoid adding compensating margins to individual children.

### 7. Borders, surfaces, and colors

#### V-11 — Surface language still uses SaaS panel elevation instead of paper, rules, and inverse stage

- **Tell:** Card-in-card; shadow-based depth.
- **Current implementation:** The Lab uses rounded panels and shadows (`--shadow-panel`, `--shadow-control`), bright white surfaces, tinted drop zones, and a pale green stage token `--color-stage: #eef3f0`.
- **Approved concept:** The page uses warm paper, deep ink, muted blue-green accent, and hairline rules. Depth is provided by scale and the dark photographic stage, not by stacked shadows or elevated cards.
- **Severity:** Major
- **Exact area responsible:** `src/styles/base.css:25-50`; `src/styles/base.css:88-93`; `src/styles/layout.css:43-60`; `src/styles/layout.css:1051-1062`; `src/styles/layout.css:173-184`.
- **Recommended correction:** Apply the approved token roles consistently to the Lab surfaces: paper as the page field, hairline rules for structure, one inverse stage surface around the canvas, and no Lab-level elevation. Keep dialog shadows isolated to actual modal layers.

### 8. Responsive behavior

#### V-12 — The 768px layout collapses the workbench too early

- **Tell:** Desktop-first breakpoint collapse; loss of the primary asymmetry.
- **Current implementation:** At `max-width: 860px` and `min-width: 761px`, `.workbench-zone` becomes one column, stacking the controls below the preview. At `max-width: 980px`, the utility rail also becomes a separate horizontal layout.
- **Approved concept/system:** The design system explicitly keeps a modest 7/5-style Preview + Controls split at approximately tablet width, then collapses to Preview first and Controls second only on narrow mobile widths. The asymmetric workbench is part of the product identity.
- **Severity:** Major
- **Exact area responsible:** `src/styles/layout.css:1153-1180`; `src/styles/layout.css:1222-1231`.
- **Recommended correction:** Move the breakpoint where the two-zone workbench collapses to the content-driven point at which controls no longer fit, rather than using `860px` as an early hard stop. Preserve `minmax(0, 1fr)`, ensure labels remain single-line, and verify 768, 414, 375, and 320 widths.

## What is already aligned with the approved concept

These areas are not visual gaps for this audit:

- The page uses the approved actual font files: Instrument Serif, Space Grotesk, and DM Mono (`src/styles/base.css:1-23`).
- The header already contains the approved ecosystem labels: Works, Archive, MiuMiu, and Lab (`src/app/App.vue:878-883`).
- The Guide is a compact static four-step band rather than a modal tutorial (`src/app/App.vue:922-955`).
- Preview states remain represented by the existing canvas components, including alignment and wiggle modes (`src/app/App.vue:1030-1045`).
- The audit does not identify a need to add Split Preview, MP4, WebM, advanced export, a Journal route, or a tutorial page. Those remain deferred v1 scope.
- The responsive CSS already uses `overflow-x: clip` and `minmax(0, 1fr)` in the relevant base/layout rules; these should be retained while the breakpoint hierarchy is corrected (`src/styles/base.css:111-116`, `src/styles/layout.css:1020-1027`).

## Correction order

1. Re-establish the approved parent composition: remove the persistent third column and widen the desktop canvas.
2. Make the Preview Stage the dominant inverse surface and move view selection into the existing Controls hierarchy.
3. Correct header geometry and the controls parent grid/alignment.
4. Rebalance intro/Guide spacing and title scale.
5. Replace Lab-level cards, shadows, and tinted surfaces with the approved paper/rule/stage token roles.
6. Adjust the tablet collapse point and verify the four required narrow widths.

This order intentionally fixes parent layout and surface ownership before any local spacing adjustment. No arbitrary child margins or pixel-level compensation should be introduced.

## Hallmark summary

1 critical · 10 major · 1 minor

Verdict — reads as a functional MVP dashboard with the right brand vocabulary; it does not yet match the approved editorial photography instrument composition.
