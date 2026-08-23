# Achilles Cat Lab — Visual Convergence Audit

Status: audit only — no application code changed  
Method: Hallmark visual audit + Playwright DOM/screenshot inspection  
Viewport: `1536 × 1024` CSS pixels  
Reference: `docs/design/mockups/ACHILLES_CAT_LAB_DESKTOP_V2.png`  
Current capture: `output/playwright/current-1536x1024-en.png`  
DOM snapshot: `output/playwright/current-page.md`

## Comparison conditions

The current page was opened at `http://localhost:5173/` with Playwright, returned to scroll position `0`, switched to the English primary state, and captured at the requested fixed viewport.

The current page is in the empty-input state. The approved reference shows a loaded stereo image (`CAT_20240421_1430.MPO`) and populated alignment stage. The loaded-versus-empty difference is a workflow state difference, not a visual CSS finding. This audit compares the shell, geometry, surfaces, controls, and empty-state footprint against the approved composition; it does not treat the absence of the reference cat image as an implementation defect.

## Measured current geometry

Playwright reported these viewport-relative boxes at `1536 × 1024`:

| Area | Current box | Reading |
| --- | ---: | --- |
| Main app shell | `x=200, y=0, w=1120` | Narrow centered canvas with large unused side fields |
| Header | `x=200, y=20, w=1120, h=45` | Header follows the narrow shell |
| Lab intro copy | `x=200, y=151, w=680, h=214` | Large vertical lead-in before Guide |
| Guide band | `x=200, y=415, w=1120, h=57` | Correct row concept, but constrained to the narrow shell |
| Lab workspace | `x=200, y=527, w=1120` | Starts substantially below the Guide |
| Utility rail | `x=200, y=527, w=183` | Persistent third desktop column |
| Preview stage region | `x=407, y=527, w=591` | Preview is only the middle portion of the desktop canvas |
| Controls column | `x=1016, y=527, w=305` | Controls occupy a large share of the remaining workbench |
| Empty alignment stage | `x=428, y=650, w=549, h=520` | Stage begins low and is pale rather than inverse/dark |

The reference is a wider editorial composition: a full-width header and Guide, a dominant dark preview stage on the left, and a narrower, flat controls column on the right. Its visual proportions remain the target even though the reference image has a different pixel canvas and a loaded sample state.

## Findings in priority order

### 1. Overall composition and proportions

#### VC-01 — Persistent upload rail turns the Lab into a three-column dashboard

- **Current state:** The desktop body has `Utility rail + Preview + Controls`: a persistent `183px` upload rail, a `591px` preview region, and a `305px` controls card. The upload surface remains visible before a file is selected.
- **Reference state:** The approved concept treats the global header as the utility rail and makes the Lab body a two-zone `Preview + Controls` workbench. The preview starts directly after the Guide and owns most of the page.
- **Severity:** Critical
- **Responsible component / CSS:** `src/app/App.vue:958-981`; `.lab-workspace` and `.utility-rail` in `src/styles/layout.css:922-937`; `.workbench-zone` in `src/styles/layout.css:1020-1027`.
- **Recommended fix:** Change the parent Lab composition to the approved two-zone body and reflow the existing `UploadPanel` into the approved compact input position. Preserve its file input, drag/drop, validation, loading, and rejection behavior; remove only the persistent third-column presentation shell.
- **Hallmark tell:** AI-template structural fingerprint / dashboard shell.

### 2. Header height and geometry

#### VC-02 — Header is correctly quiet but too narrow and uses the wrong active-state geometry

- **Current state:** The header is limited to the `1120px` app shell. `ACHILLES CAT` sits directly beside the route list, and active Lab is shown with a short underline below the navigation item.
- **Reference state:** The header spans the full editorial canvas. A vertical separator distinguishes the wordmark from navigation, and the active Lab state is a small dot beneath the label. Utilities sit at the far right with more deliberate edge alignment.
- **Severity:** Major
- **Responsible component / CSS:** `src/app/App.vue:875-898`; `.site-header`, `.site-brand`, and `.site-nav-item.is-active::after` in `src/styles/layout.css:702-754`.
- **Recommended fix:** Correct the header’s parent width and alignment first, then implement the reference separator and active-dot relationship in the existing header rules. Keep the current route labels, language toggle, Settings label, and status dot.
- **Hallmark tell:** Centered everything / generic nav row.

### 3. Lab introduction spacing

#### VC-03 — Lab introduction starts too low and reads as a marketing hero

- **Current state:** The intro copy begins at `y=151`; the display heading occupies a `680 × 102px` box and is preceded by `ACHILLES CAT / 01`. The Guide rule does not begin until `y=415`.
- **Reference state:** The title begins close below the header rule, with a shorter editorial entry block. The description and local-processing note lead quickly into the Guide and then the image stage; there is no oversized hero pause.
- **Severity:** Major
- **Responsible component / CSS:** `src/app/App.vue:901-920`; `.lab-intro`, `.lab-intro-copy`, and `.lab-intro h1` in `src/styles/layout.css:790-815`.
- **Recommended fix:** Rebalance the intro parent padding and display scale as one entry rhythm. Preserve the approved Instrument Serif / Space Grotesk / DM Mono roles, but make the title proportionate to the workbench rather than the viewport.
- **Hallmark tell:** Oversized centered-hero bias.

### 4. Guide height and alignment

#### VC-04 — Guide structure is correct, but its band is aligned to the narrow app shell and sits too far from the workbench

- **Current state:** The Guide is a `1120 × 57px` row inside the centered shell. Its first intro cell is `283px`, followed by four equal cells; the workbench begins `55px` after the Guide’s reported bottom.
- **Reference state:** The Guide is a thin full-width editorial band with a compact height and direct visual handoff to the preview/control composition. Its four steps align to the same broad page field as the header and stage.
- **Severity:** Minor
- **Responsible component / CSS:** `src/app/App.vue:922-955`; `.guide-band`, `.guide-band-intro`, and `.guide-step` in `src/styles/layout.css:828-885`.
- **Recommended fix:** Let the Guide inherit the corrected page width and tune its parent gap to the workbench rhythm. Keep the four steps and hairline separators; do not add per-step offsets.
- **Hallmark tell:** Equalized template spacing.

### 5. Preview / Controls width ratio

#### VC-05 — The preview does not own enough of the desktop workbench

- **Current state:** In the real DOM, the workbench after the upload rail is `913px` wide: Preview is `591px` and Controls is `305px`, roughly a `65/34` split before the gap. The separate upload rail consumes another `183px`.
- **Reference state:** The approved concept is approximately a `72/28` Preview + Controls split across a much wider page. The control column is visibly subordinate and the preview image is the page’s dominant object.
- **Severity:** Major
- **Responsible component / CSS:** `.workbench-zone` in `src/styles/layout.css:1020-1027`; `.lab-workspace` in `src/styles/layout.css:923-929`.
- **Recommended fix:** Fix the parent tracks after removing the third column: use the approved asymmetric Preview + Controls proportions and let both tracks use `minmax(0, 1fr)`. Do not widen the preview with child margins or transforms.
- **Hallmark tell:** Equal-column dashboard bias.

### 6. Preview stage dimensions

#### VC-06 — The stage footprint is narrow and arrives below the fold

- **Current state:** The empty alignment stage is `549 × 520px` at `x=428, y=650`. Its top is pushed down by the preview card header, mode tabs, and the preceding vertical composition; only part of it is visible in the fixed viewport capture.
- **Reference state:** The stage begins around `y=414` in the approved desktop composition, is much wider, and uses the dark photographic surface as the strongest visual mass. Metadata sits inside the stage frame without reducing the image’s dominance.
- **Severity:** Major
- **Responsible component / CSS:** `src/components/AlignmentPreviewPanel.vue:87-92`; `src/components/PreviewCanvas.vue:107-115`; `.preview-workspace` and `.preview-stage-panel` in `src/styles/layout.css:1029-1034`, `1135-1147`; `.preview-stage, .align-stage` in `src/styles/layout.css:173-184`.
- **Recommended fix:** Increase the stage footprint through the parent grid and remove the extra preview-card padding/header weight. Keep the existing canvas element, sizing contract, alignment guides, empty state, loading state, and wiggle output unchanged.
- **Hallmark tell:** Card-in-card / primary object demotion.

### 7. Controls row alignment

#### VC-07 — Alignment controls use a compact two-column form instead of the reference’s aligned rows

- **Current state:** Playwright reports two horizontal slider cells of `126px` each on the first row, with Overlay on a second row. Labels, tracks, and values are grouped tightly and the Reset button fills the card below.
- **Reference state:** Each alignment setting forms a full-width row: label at left, slider through the middle, value at right. Group rules and collapsed Motion / Export rows give the controls a calm editorial rhythm.
- **Severity:** Major
- **Responsible component / CSS:** `src/components/ControlPanel.vue:38-84`; `.controls-zone .align-slider-grid` in `src/styles/layout.css:1113-1125`; `.controls-zone` in `src/styles/layout.css:1051-1062`.
- **Recommended fix:** Use a single vertical row grid inside the controls parent, with a stable label / track / value alignment. Recompose existing View, Align, Motion, and Export presentation around the current emits; do not add control functionality or alter slider state handling.
- **Hallmark tell:** Equalized form-card treatment.

### 8. Typography hierarchy

#### VC-08 — Actual fonts are correct, but the display scale and repeated labels are not yet at reference hierarchy

- **Current state:** The page correctly loads Instrument Serif, Space Grotesk, and DM Mono, but the Lab heading uses `clamp(3.4rem, 8vw, 7.25rem)` and the page repeats uppercase kickers in the intro, utility rail, preview, controls, and groups.
- **Reference state:** The same three-font system is used with a shorter title scale, restrained metadata, and stronger hierarchy from title → image → controls. Mono labels support the interface rather than becoming a repeated visual layer.
- **Severity:** Major
- **Responsible component / CSS:** `src/styles/base.css:1-23`, `71-73`; `.lab-intro h1` in `src/styles/layout.css:799-808`; kicker selectors in `src/styles/layout.css:9-17`, `1580-1612`; corresponding markup in `src/app/App.vue:903-904`, `960-963`, `987-999`, `1085-1099`.
- **Recommended fix:** Keep the real font files and role tokens. Tune the display size through the intro rule and reduce only decorative kicker repetition; do not replace the approved typefaces or introduce a fourth family.
- **Hallmark tell:** Eyebrow on every section.

### 9. Spacing rhythm

#### VC-09 — Large empty intervals delay the primary visual object

- **Current state:** The intro uses up to `86px` top padding, the Guide has a `50px` top margin, and the workbench starts at `y=527`. The cumulative result is a large paper field above the preview and controls.
- **Reference state:** The concept keeps generous paper space but compresses the entry sequence so the Guide and stage appear within one continuous editorial rhythm. Whitespace supports the photograph instead of delaying it.
- **Severity:** Major
- **Responsible component / CSS:** `.lab-intro` in `src/styles/layout.css:790-793`; `.guide-band` in `src/styles/layout.css:828-835`; `.lab-workspace` in `src/styles/layout.css:923-929`.
- **Recommended fix:** Rebalance the intro, Guide, and workbench parent gaps as a shared spacing scale. Fix the sequence at the section level; do not patch individual child margins.
- **Hallmark tell:** Equal padding / flat spacing scale.

### 10. Borders, colors, and small details

#### VC-10 — Lab surfaces still look like elevated SaaS panels

- **Current state:** Preview and Controls are rounded, filled cards with borders and shadows. The empty stage uses the pale `--color-stage: #eef3f0`; Controls has a distinct 2px accent top border and rounded surface.
- **Reference state:** The approved Lab uses warm paper, deep ink, muted blue-green, hairline rules, and one dark inverse preview stage. Controls read as a flat ruled column rather than an elevated card.
- **Severity:** Major
- **Responsible component / CSS:** `src/styles/base.css:25-50`, `88-93`; generic panel rules in `src/styles/layout.css:43-60`; `.preview-workspace` in `src/styles/layout.css:1029-1034`; `.controls-zone` in `src/styles/layout.css:1051-1062`; stage rules in `src/styles/layout.css:173-184`.
- **Recommended fix:** Apply the approved token roles at the Lab parent/surface level: paper field, hairline rules, dark stage, and no Lab-level panel elevation. Keep modal shadows isolated to actual dialogs and leave the canvas rendering untouched.
- **Hallmark tell:** Card-in-card / shadow-based depth.

## Explicit non-findings

- This audit does not recommend changing MPO parsing, stereo splitting, alignment state, canvas rendering, wiggle generation, GIF export, download behavior, or existing state management.
- The absence of the cat image in the current screenshot is because no file is loaded. It is not evidence that the preview canvas or image-processing pipeline is broken.
- Split Preview, MP4, WebM, advanced export, Works, Archive, Journal, and a tutorial page remain out of scope.
- The existing real font files and bilingual text infrastructure are retained; only hierarchy and placement need convergence.

## Recommended convergence order

1. Fix the page container and remove the persistent third-column composition.
2. Re-establish the Preview + Controls parent ratio and make the preview stage dominant.
3. Correct header geometry and active-state treatment.
4. Rebalance intro and Guide spacing.
5. Align controls into the reference row rhythm.
6. Tune typography scale and label density.
7. Apply the approved paper / rule / inverse-stage surface language.

All corrections should be made through parent grid, flex, surface, and type-role rules first. Do not use arbitrary per-element margins, transforms, or canvas changes.

## Hallmark summary

1 Critical · 8 Major · 1 Minor

Verdict — the current page has the approved brand vocabulary and workflow, but the fixed-viewport evidence confirms that its dominant structure is still a narrow three-column MVP dashboard rather than the approved wide editorial Lab instrument.
