/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */

# Achilles Cat v1 — Redesign Roadmap

This roadmap migrates the current 3D Photo Enhancer MVP into the Achilles Cat
visual system while keeping the existing product behavior intact.

## Product direction

**Achilles Cat** is the parent creative ecosystem. **3D Photo Lab** is one
focused product room inside it. Future **Works**, **Archive**, and **MiuMiu**
sections should feel related through the same utility rail, typography, tokens,
and editorial rhythm, but the Lab should remain a working tool rather than a
marketing landing page.

### v1 outcome

- A recognizable Achilles Cat shell surrounds the product.
- 3D Photo Lab has an editorial entry point and a clear asymmetric workbench.
- The canvas is the primary visual surface.
- Upload, align, animate, and export remain the same functional spine.
- Existing Vue components and business logic are preserved wherever possible.
- Visual decisions come from semantic tokens instead of scattered literals.
- Works, Archive, and MiuMiu have deliberate navigation positions without
  fabricating content or forcing their full builds into v1.

Before implementation, v1 requires the two approved Desktop high-fidelity
concepts documented in `DESIGN_CONCEPTS.md`: one Homepage and one 3D Photo Lab.
The concepts and acceptance checklist are a hard gate; no Vue or business-code
changes begin before they are confirmed.

### Explicit non-goals

- No rewrite of image decoding, stereo splitting, alignment, rendering, GIF
  encoding, memory budgeting, or download logic.
- No new state-management system.
- No new router or animation library unless a later requirement proves it is
  necessary.
- No large content build for Works, Archive, or MiuMiu in the first Lab pass.
- No visible Split Preview mode or new preview/export functionality in v1.
- Clean unused components instead of adding behavior to justify their use.
- No mascot, cat illustration, gradient-heavy identity, or decorative UI that
  competes with the image work.

## Migration principles

1. **Behavior before appearance.** Keep the current state machine and event
   contracts stable while the visual shell changes around them.
2. **Tokens before polish.** Do not tune individual components against raw
   values; establish the Achilles Cat foundation first.
3. **One surface at a time.** Work from global shell to Lab stage to controls to
   dialogs, keeping each step reviewable and reversible.
4. **Composition before decoration.** Solve hierarchy, asymmetry, spacing, and
   type roles before adding crop marks or cat-eye cues.
5. **No dependency by default.** Use Vue, CSS, native browser APIs, and the
   existing renderer. Prefer a small local abstraction over a new package.
6. **Future-ready, not future-built.** Reserve the parent navigation and route
   boundaries without inventing Works, Archive, or MiuMiu content.

## 1. Homepage redesign

### Intent

Create the first Achilles Cat entry surface: an editorial index that introduces
the ecosystem and gives 3D Photo Lab a clear place without turning the homepage
into a feature grid.

### Proposed structure

```text
Achilles Cat utility rail
  → short editorial statement
  → current product / work index
  → Works · Archive · MiuMiu · 3D Photo Lab destinations
  → quiet index footer
```

The homepage should use the Split Studio / Archive Catalogue DNA:

- left-biased title and short statement;
- a compact index of destinations rather than equal feature cards;
- 3D Photo Lab treated as an active instrument or featured room;
- Works and Archive presented as navigable categories;
- MiuMiu held as a named destination with its content model confirmed before
  detailed treatment;
- generous opening space followed by tighter index rows;
- one restrained blue-green accent for selection, links, and active markers.
- the same Desktop header as the 3D Photo Lab: `ACHILLES CAT`, divider,
  `Works / Archive / MiuMiu / Lab`, then `EN / 中文` and `Settings` on the right.

### Migration approach

The current repository has one app entry and no route-level shell. Do not begin
by adding a router. First define the shell contract and content boundaries. If a
homepage and Lab view need to coexist in v1, prefer a small existing-app view
boundary or native history handling over a dependency-heavy routing layer.

The first homepage pass may be a lightweight shell and index only. It should
not block the 3D Photo Lab redesign or require real Works / Archive / MiuMiu
content.

### Acceptance criteria

- Achilles Cat is the primary identity; 3D Photo Lab is clearly a product inside
  it.
- The page does not use the generic centered hero → three-card pattern.
- Destination links have stable labels and a mobile-safe layout.
- No invented metrics, testimonials, or portfolio claims are introduced.
- The Lab remains reachable as the primary working action.

## 2. Navigation redesign

### Intent

Replace the current floating locale / utility actions with a consistent
Achilles Cat header that works across the homepage and product room. Keep the
Guide local to the Lab introduction instead of placing it in the global header.

### Navigation model

```text
Achilles Cat              Works   Archive   MiuMiu   3D Photo Lab
                                             current product marker
```

Recommended behavior:

- left: Achilles Cat wordmark / parent identity;
- center or right: Works, Archive, MiuMiu, 3D Photo Lab;
- utility: language, Settings, privacy, or support actions kept compact;
- current destination: a small mono label, rule, or accent marker rather than a
  large filled pill;
- mobile: collapse destinations into one intentional menu or stacked index, not
  a wrapping row of tiny links;
- product pages keep their product context visible even when the global rail is
  collapsed.

### Migration constraints

- Keep the current locale toggle behavior and stored preference.
- Keep the four-step Guide, Privacy, and Feedback available; change their
  placement and visual hierarchy, not their purpose. The Guide is static Lab
  orientation content, not a modal.
- Do not make future destinations appear “live” if their content and routes do
  not exist. Use a clear coming-soon or archive-state treatment only if needed.
- Keep clickable labels on one line at every supported viewport.

## 3. 3D Photo Lab redesign

### Intent

Make the Lab feel like a focused instrument: one dominant canvas, clear stages
of work, compact metadata, and controls that appear in the order users need
them.

### Target page grammar

```text
Achilles Cat utility rail
  → 3D Photo Lab editorial entry
      short context · local processing note · static four-step Guide
  → asymmetric workbench
      large preview stage | focused controls
  → archive index band
      filename · input format · dimensions · current mode · export state
  → quiet footer
```

### State model to preserve

The visual redesign must continue to support the existing functional states:

1. Empty / ready for upload.
2. Reading and parsing.
3. Alignment preview.
4. Wiggle preview.
5. Creating Wiggle.
6. Export dialog open.
7. Exporting with progress and cancel.
8. Recoverable error.
9. Blocking error.

The exact state transitions and renderer ownership remain in the current Vue
state layer and preview components. The roadmap changes their composition and
presentation, not their business behavior.

### Target workbench composition

- **Entry:** short title such as “Make a stereo image move” or an approved
  equivalent, with a direct explanation of local processing.
- **Intake:** open framed drop zone; one verb, formats, and privacy note.
- **Stage:** alignment and Wiggle share the same visual stage frame and metadata
  language. The active mode is clear without relying only on color.
- **Controls:** grouped into View, Align, Motion, and Export. The current
  ControlPanel behavior is retained but visually reordered and labeled by intent.
- **Index band:** mount or replace the input detection surface as a compact
  metadata row below the stage if its fields are confirmed useful.
- **Export:** keep the existing dialog choices, but frame the decision as an
  export record: format, framing, size, estimate, and device guidance.

### Orphaned surface decision

Before implementation, make one explicit decision for each existing but
unmounted path:

- `InputDetectionPanel`: clean up if the existing workflow does not mount it.
- `SplitPreviewPanel`: clean up; Split Preview is hidden in v1.
- `ErrorMessage`: clean up if the existing workflow does not mount it; do not
  add a new error surface solely to preserve the component.
- `split` preview state: do not visually expose it.

### Acceptance criteria

- The preview stage is visually dominant at desktop widths.
- The controls have an intentional 7/5 or 8/4 relationship to the stage.
- Upload, align, create, play, swap, and download remain discoverable.
- No export or memory behavior changes.
- Empty, loading, preview, creating, exporting, and error states all share the
  same visual vocabulary.

## 4. Component redesign

### Component strategy

Keep the current Vue component boundaries where they already match product
behavior. Add composition boundaries only where the current `App.vue` shell and
orchestration are too tightly coupled.

| Existing area | v1 treatment | Business logic policy |
| --- | --- | --- |
| `App.vue` | Thin page composition and state wiring; move only presentational shell markup if necessary | Keep async handlers, generation counters, cancellation, analytics context, and cleanup behavior unchanged. |
| `UploadPanel.vue` | Redesign as an editorial intake frame with clear states | Preserve file validation, drag/drop, and loading events. |
| `AlignmentPreviewPanel.vue` | Make the primary stage with guide lines, crop marks, and stage metadata | Preserve canvas renderer and ResizeObserver contract. |
| `PreviewCanvas.vue` | Use the same stage frame as alignment; add playback context and file index | Preserve renderer lifecycle, resize, and playback watches. |
| `ControlPanel.vue` | Split visual groups into View / Align / Motion / Export | Preserve emitted event names and values unless an explicit behavior change is approved. |
| `MessageCenter.vue` | Quiet status rail or inline status region near the affected action | Preserve message types, dismissal, and live-region behavior. |
| `GifExportDialog.vue` | Editorial export record with clear option hierarchy | Preserve format, framing, size, memory, progress, cancel, and confirmation behavior. |
| `GuideModal.vue` | Do not mount the modal in v1; clean up if unused. Add the four-step Guide as a static Lab introduction band. | Preserve the existing workflow only; no tutorial route, onboarding modal, or new business behavior. |
| `PrivacyModal.vue` | Use the quiet footer / policy pattern and a consistent close action | Preserve local-processing explanation and analytics preference. |
| `InputDetectionPanel.vue` | Clean up as unused in v1 | Do not add new detection logic or a new visible surface. |
| `SplitPreviewPanel.vue` / `ErrorMessage.vue` | Clean up as unused in v1 | Do not mount or expand scope to justify the components. |

### Shared component states

Create a consistent state contract for upload, buttons, tabs, controls, dialogs,
and status surfaces:

```text
default · hover · focus-visible · active · disabled · loading · error · success
```

The states should use color, rule weight, opacity, and text changes. They should
not depend on scale bounce, layout shifts, or celebratory toasts.

## 5. Typography migration

### Target roles

Use the design system’s 2+1 model:

- **Display:** `--font-display` — Instrument Serif with a Georgia fallback;
  used for the editorial hero, product entry, and section titles.
- **Body:** `--font-body` — Space Grotesk with a system sans fallback; used for
  navigation, guidance, privacy, and explanatory copy.
- **Label:** `--font-mono` — DM Mono with a system mono fallback; used for file
  metadata, dimensions, modes, and compact index labels.

### Migration steps

1. Define the three named font tokens without changing layout.
2. Move global body text to `--font-body`.
3. Move headings and product identity to `--font-display`, keeping display text
   roman and wrapping safely.
4. Replace raw mono declarations in release metadata and future index bands with
   `--font-mono`.
5. Establish the type scale and line-height tokens from the design system.
6. Tune copy length and hierarchy after the type roles are stable.

Do not add a font package or make a network font dependency a prerequisite for
the first migration. The fallback stack must remain usable if the named face is
not loaded.

### Typography acceptance criteria

- There are no isolated `font-family` declarations outside the token layer.
- Headings are roman, short, and editorial rather than oversized SaaS slogans.
- Body copy remains readable in both English and Chinese.
- Metadata is visibly distinct without turning the whole page into uppercase
  labels.
- The three selected font files exist locally and are used through named roles:
  Instrument Serif, Space Grotesk, and DM Mono.

## 6. Color token migration

### Target token layer

Use the canonical semantic values already defined in
`DESIGN_SYSTEM.md`:

- paper and paper-2 for the page field and quiet bands;
- surface and surface-muted for active work areas;
- surface-inverse for the canvas or focused export state;
- ink, ink-2, and ink-muted for text hierarchy;
- rule and rule-strong for hairlines and active boundaries;
- accent, accent-strong, accent-soft, and accent-ink for the single brand
  accent;
- focus, info, success, warning, and danger for system states;
- panel and floating shadows only where depth is needed.

### Migration steps

1. Add one semantic token source to the existing stylesheet entry path.
2. Map the current warm paper / teal-green values to the new semantic names.
3. Replace raw colors in base rules first, then layout primitives, then dialogs
   and state variants.
4. Remove duplicate color definitions only after every consumer is mapped.
5. Consolidate shadows, radii, and spacing into the same foundation layer.
6. Verify contrast for body text, controls, selected states, status messages,
   inverse canvas surfaces, and focus rings.

This is a migration, not a palette reset. The existing warm paper and teal-green
direction should remain recognizable while the system becomes consistent.

### Color acceptance criteria

- No new raw hex, RGB, or one-off font values are introduced in component or
  layout rules.
- Accent usage remains small and purposeful.
- White surfaces are replaced by semantic surface tokens rather than multiplied
  across panels.
- Status colors always have text or icon support and meet contrast requirements.

## 7. Animation strategy

### Stance

Use **motion-cut**. Keep the actual Wiggle playback animation because it is the
product output, but keep interface motion sparse and informational.

### Keep

- canvas playback and frame rendering;
- renderer resize behavior;
- a restrained loading indicator if it communicates active work;
- export progress as a truthful state indicator;
- reduced-motion handling already considered by the state layer.

### Change

- replace browser-default `ease` with named easing tokens;
- avoid animating width, height, margin, padding, or other layout properties;
- use opacity and transform for shell entry and surface transitions;
- avoid card hover-scale, bounce, gradient sweeps, and celebratory success
  effects;
- make focus rings appear immediately and never animate them;
- keep hover subtle: rule color, surface tone, or text color only.

### Suggested motion budget

- one page-entry reveal when the shell first mounts;
- one short transition when the active Lab mode changes;
- one clear loading treatment for parsing / creating / exporting;
- no additional motion unless it explains a state or comparison.

### Reduced-motion rule

When `prefers-reduced-motion: reduce` is active, remove spatial motion and keep
only an opacity crossfade of 150ms or less. Do not alter the core Wiggle output
semantics without a separate product decision.

## 8. Implementation order

### Phase 0 — Freeze behavior and confirm IA

**Goal:** establish the migration boundary before visual work.

- confirm Achilles Cat / 3D Photo Lab naming;
- confirm whether homepage and Lab coexist in v1;
- define placeholder behavior for Works, Archive, and MiuMiu;
- inventory mounted and orphaned components;
- record the current test, build, and release-check baseline;
- do not change business logic.

**Exit condition:** the product shell, Lab states, and orphaned component
decisions are documented.

### Phase 1 — Establish semantic foundations

**Goal:** make the visual system safe to migrate.

- add color, typography, spacing, radius, shadow, easing, duration, and focus
  tokens;
- consolidate duplicated rules in `src/styles/layout.css`;
- replace `overflow-x: hidden` with the approved clipping behavior;
- keep visual output close to the current MVP during this phase;
- run existing typecheck, tests, and build checks.

**Exit condition:** every active selector consumes shared tokens and the cascade
has one source of truth.

### Phase 2 — Build the Achilles Cat shell

**Goal:** establish brand continuity without changing Lab behavior.

- introduce the utility rail and parent identity;
- define the navigation positions for Works, Archive, MiuMiu, and 3D Photo Lab;
- move Privacy, Locale, Feedback, version, and support into a coherent shell
  hierarchy; keep the four-step Guide beside the Lab introduction;
- introduce the quiet index footer;
- keep the Lab task content intact inside the new shell.

**Exit condition:** the app reads as Achilles Cat with 3D Photo Lab inside it,
even before the workbench is fully restyled.

### Phase 3 — Redesign the 3D Photo Lab page composition

**Goal:** move from stacked panels to the Split Studio workbench.

- redesign the editorial entry and intake surface;
- give the preview stage primary visual ownership;
- establish the asymmetric preview / controls relationship;
- add the metadata index band if confirmed in Phase 0;
- unify alignment and Wiggle stage framing;
- preserve every current state and event contract.

**Exit condition:** upload, preview, alignment, create, and export remain
functional while the page hierarchy matches the design system.

### Phase 4 — Redesign components and states

**Goal:** make the system consistent at the interaction level.

- migrate UploadPanel, ControlPanel, MessageCenter, and dialogs to shared
  component primitives;
- implement all eight visual states;
- resolve orphaned components according to the IA decision;
- normalize modal close, focus, live-region, and disabled behavior;
- keep controls and labels usable in English and Chinese.

**Exit condition:** every interactive family has a predictable state language and
no component depends on browser-default styling for important feedback.

### Phase 5 — Typography and copy pass

**Goal:** give the product an authored voice after the structure is stable.

- apply display/body/mono roles;
- shorten or restructure headings to fit the editorial hierarchy;
- centralize bilingual copy by surface;
- establish terms for Achilles Cat, 3D Photo Lab, Works, Archive, and MiuMiu;
- keep technical limitations and privacy language explicit.

**Exit condition:** the interface sounds like a creative instrument rather than
an unnamed utility, with no overflow regressions.

### Phase 6 — Motion and responsive pass

**Goal:** add only the motion that clarifies state and finish the narrow-screen
  composition.

- replace incidental easing and layout transitions;
- add the single shell reveal and mode transition only if useful;
- validate loading, creating, exporting, and error states;
- verify 320, 375, 414, and 768px layouts;
- verify reduced motion, keyboard focus, touch hit areas, and single-line
  clickable labels.

**Exit condition:** the UI is visually calm, responsive, and stable under the
  complete interaction state matrix.

### Phase 7 — Consolidation and release validation

**Goal:** finish v1 without reopening business logic.

- remove confirmed dead selectors and stale commented markup;
- confirm no new dependency was added without explicit justification;
- run tests, typecheck, production build, artifact checks, and release checks;
- test representative MPO, side-by-side, and top-bottom inputs;
- verify GIF and SBS PNG output, cancellation, memory guidance, and privacy copy;
- document any deferred Works / Archive / MiuMiu work separately.

**Exit condition:** Achilles Cat v1 is visually coherent and functionally
equivalent to the MVP, with the core processing pipeline unchanged.

## Definition of done for v1

- Homepage and Lab Desktop design concepts are approved before implementation.
- The v1 acceptance checklist is frozen before implementation.
- The first screen establishes Achilles Cat and 3D Photo Lab in one glance.
- The page follows the utility rail → editorial entry → workbench → index band
  → quiet footer grammar.
- The preview canvas owns the visual hierarchy.
- The interface uses semantic tokens and the 2+1 typography model.
- Current upload, alignment, Wiggle, export, error, privacy, and locale behavior
  remains available.
- The entire project, not only the Lab, has complete Chinese/English coverage.
- Split Preview is hidden and unused components are cleaned up.
- No unnecessary dependency is introduced.
- No business-logic rewrite is required to achieve the visual transformation.
- The app passes responsive, accessibility, reduced-motion, and release
  validation before further ecosystem expansion.

## Deferred until after v1

- Full Works content model and case-study templates.
- Full Archive browsing, filtering, or persistence behavior.
- Final MiuMiu information architecture and visual treatment.
- Multi-product switching beyond the initial shell contract.
- Any backend, account, upload, or online asset workflow.
