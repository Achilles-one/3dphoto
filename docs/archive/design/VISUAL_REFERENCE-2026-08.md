# Achilles Cat v1 — Frozen Visual Reference

Status: approved visual source of truth  
Scope: Achilles Cat v1 Homepage shell and 3D Photo Lab presentation layer  
Last reviewed: 2026-08-22

## 1. Visual Freeze Status

The mockups listed in this document are **APPROVED**.

The visual direction is frozen for Achilles Cat v1. Future implementation work
must converge toward these references rather than inventing a new direction.
Changes to the frozen visual direction require explicit approval.

This freeze applies to composition, hierarchy, proportions, typography roles,
surfaces, spacing intent, controls language, state presentation, dialog
treatment, and responsive interpretation. It does not replace the existing
application behavior or runtime data.

## 2. Reference Precedence

### Shared site shell

Use `ACHILLES_CAT_LAB_DESKTOP_V2.png` as the source of truth for the shared
global header used by both Homepage and Lab.

The Homepage header must not introduce a separate header design.

The shared header is defined by:

- `ACHILLES CAT` wordmark on the left;
- a vertical separator after the wordmark;
- `Works`, `Archive`, `MiuMiu`, and `Lab` route labels;
- the Lab active indicator as a small dot beneath `Lab`;
- `EN / 中文` and `Settings` utilities at the far right;
- the same baseline, spacing, hairline rule, and responsive behavior on both routes.

`ACHILLES_CAT_HOMEPAGE_DESKTOP_V2.png` currently shows an underline-style Lab
active state. That underline treatment is ignored. The Lab header style wins:
shared geometry, separator, active dot, and right-side utilities.

### Homepage

Use `ACHILLES_CAT_HOMEPAGE_DESKTOP_V2.png` for Homepage-specific content only:

- hero composition;
- editorial typography;
- image composition;
- Selected Works;
- Archive Preview;
- MiuMiu section;
- footer composition.

The Homepage reference image is a 1568×1003 desktop composition. Its canvas
size is reference metadata, not a requirement to hard-code a fixed viewport.
Shared header rules still come from `ACHILLES_CAT_LAB_DESKTOP_V2.png`.

### Lab shell and Alignment state

Use `ACHILLES_CAT_LAB_DESKTOP_V2.png` as the canonical Lab shell and Alignment
Preview reference.

### Wiggle state

Use `ACHILLES_CAT_LAB_DESKTOP_WIGGLE_V4.png` as the canonical Wiggle Playing
reference.

Use `ACHILLES_CAT_LAB_WIGGLE_PAUSED_DESKTOP.png` as the paused-state reference.

All Lab state mockups use a 1536×1024 desktop composition.

## 3. Lab State Mockup Manifest

The mockups below are the approved visual presentation for the corresponding
existing application states. The state names describe the current workflow;
they do not authorize a new processing pipeline or new product capability.

| State ID | UX State | Approved Mockup | Existing application state | Primary component(s) | Notes |
| --- | --- | --- | --- | --- | --- |
| S-01 | Empty | `ACHILLES_CAT_LAB_EMPTY_DESKTOP.png` | `AppPhase: empty`, `previewMode: align` | `App.vue`, `UploadPanel.vue`, `AlignmentPreviewPanel.vue`, `ControlPanel.vue` | Compact input entry in the dark stage; controls remain quiet/disabled. |
| S-02 | Drag Over | `ACHILLES_CAT_LAB_DRAG_OVER_DESKTOP.png` | Empty phase plus existing drag-over state | `UploadPanel.vue`, `AlignmentPreviewPanel.vue` | Highlight the existing drop target only; no processing begins until drop. |
| S-03 | Loading | `ACHILLES_CAT_LAB_LOADING_DESKTOP.png` | `AppPhase: loading`, `previewMode: align` | `UploadPanel.vue`, `AlignmentPreviewPanel.vue`, `MessageCenter.vue` | Preserve the stage footprint while reading, decoding, and parsing. |
| S-04 | Rejected Input | `ACHILLES_CAT_LAB_REJECTED_INPUT_DESKTOP.png` | Existing upload rejection/error message path; phase-preserving | `UploadPanel.vue`, `MessageCenter.vue`, `App.vue` | Explain the unsupported input and next action without replacing the Lab shell. |
| S-05 | Blocking Error | `ACHILLES_CAT_LAB_BLOCKING_ERROR_DESKTOP.png` | `AppPhase: error`, `previewMode: align` | `MessageCenter.vue`, `UploadPanel.vue`, `AlignmentPreviewPanel.vue` | No usable preview is available; guide the user back to another input. |
| S-06 | Alignment Ready | `ACHILLES_CAT_LAB_DESKTOP_V2.png` | `AppPhase: preview`, `previewMode: align` | `AlignmentPreviewPanel.vue`, `ControlPanel.vue` | Canonical loaded Lab shell; preserve stereo canvas, metadata, and alignment controls. |
| S-07 | Alignment Layout Change | `ACHILLES_CAT_LAB_ALIGNMENT_LAYOUT_CHANGE_DESKTOP.png` | Preview/align phase with existing layout-update busy state | `AlignmentPreviewPanel.vue`, `ControlPanel.vue` | Keep the existing canvas visible under a restrained status treatment. |
| S-08 | Creating Wiggle | `ACHILLES_CAT_LAB_CREATING_WIGGLE_DESKTOP.png` | `AppPhase: creating`, `previewMode: align` until completion | `AlignmentPreviewPanel.vue`, `ControlPanel.vue`, `App.vue` | Disable duplicate actions while preserving stage geometry and source context. |
| S-09 | Wiggle Playing | `ACHILLES_CAT_LAB_DESKTOP_WIGGLE_V4.png` | `AppPhase: preview`, `previewMode: wiggle`, playback active | `PreviewCanvas.vue`, `ControlPanel.vue` | Canonical motion-preview state; photo remains the dominant object. |
| S-10 | Wiggle Paused | `ACHILLES_CAT_LAB_WIGGLE_PAUSED_DESKTOP.png` | `AppPhase: preview`, `previewMode: wiggle`, playback paused | `PreviewCanvas.vue`, `ControlPanel.vue` | Hold the current frame; retain speed, eye order, intermediate-frame, alignment, and export actions. |
| S-11 | Export Configure | `ACHILLES_CAT_LAB_EXPORT_DIALOG_DESKTOP.png` | Preview/wiggle phase with export dialog open | `GifExportDialog.vue`, `ControlPanel.vue`, `useDialogFocus.ts` | Contained decision surface over the existing Wiggle Lab. |
| S-12 | Export Unavailable | `ACHILLES_CAT_LAB_EXPORT_UNAVAILABLE_DESKTOP.png` | Export dialog with existing availability/memory guard | `GifExportDialog.vue` | Disabled choice remains visible with a plain reason; valid choices remain usable. |
| S-13 | Exporting | `ACHILLES_CAT_LAB_EXPORT_DIALOG_EXPORTING_DESKTOP.png` | `AppPhase: exporting`, active export session | `GifExportDialog.vue`, existing export session, `useDialogFocus.ts` | Keep the dialog open; preserve progress, cancellation, and disabled inputs. |
| S-14 | Export Success | `ACHILLES_CAT_LAB_EXPORT_SUCCESS_DESKTOP.png` | `AppPhase: preview`, `previewMode: wiggle`, success message | `MessageCenter.vue`, `PreviewCanvas.vue`, `ControlPanel.vue` | Close the dialog, keep Wiggle usable, and show a quiet downloaded message. |
| S-15 | Export Failure | `ACHILLES_CAT_LAB_EXPORT_FAILURE_DESKTOP.png` | `AppPhase: preview` with recoverable export error | `MessageCenter.vue`, `PreviewCanvas.vue`, `ControlPanel.vue` | Preserve the preview and settings; explain the safer retry path. |
| S-16 | Privacy Modal | `ACHILLES_CAT_LAB_PRIVACY_MODAL_DESKTOP.png` | Existing privacy dialog open over the active Lab state | `PrivacyModal.vue`, `useDialogFocus.ts` | Preserve underlying workbench state and existing preference behavior. |

## 4. Hard Visual Constraints

### Global shell

- Homepage and Lab use the same shared header component and geometry.
- The page field is warm paper with deep ink typography.
- Structure uses restrained hairline rules rather than dense card borders.
- Typography uses the Instrument Serif / Space Grotesk / DM Mono role system.
- The shell must not read as a generic SaaS header.
- Avoid card-heavy dashboard language, marketing navigation, and stacked feature panels.

### Lab geometry

- The Preview Stage is the dominant object.
- Desktop Lab uses a two-zone `Preview + Controls` composition.
- Controls remain visually subordinate to the photograph.
- Preview and Controls preserve stable geometry across application states.
- State transitions must not cause large layout jumps.
- The Guide stays in the same location and four-step structure.
- The persistent utility responsibility belongs to the global header, not a third desktop body column.

### Preview Stage

- Use a dark inverse photographic surface.
- The image or Canvas owns the visual hierarchy.
- Technical metadata remains quiet and factual.
- Empty, loading, error, alignment, and Wiggle overlays live inside the stable stage footprint.
- State overlays do not replace the whole page.
- Do not add decorative effects, fake depth particles, or unrelated animation layers.
- Do not modify Canvas lifecycle or rendering merely to match a screenshot.

### Controls

- The hierarchy follows `View / Align / Motion / Export` as shown by the active state mockup.
- Controls change contextually according to the existing application state.
- Label, control, and value alignment must be systematic.
- Use hairline separation rather than nested cards.
- Existing controls remain the source of truth: no Split Preview, MP4, WebM, or advanced export additions.

### Dialogs

- Dialog placement, width, visual language, and backdrop converge toward the approved references.
- Dialogs are contained decision surfaces over the Lab, not separate pages.
- Export dialogs retain the underlying Preview Stage and Controls relationship.
- Privacy and export dialogs use the same quiet editorial darkroom language: paper surface, thin borders, precise copy, and restrained actions.

### Messages

- Success, recoverable error, rejected input, and blocking error use the approved restrained editorial message treatment.
- The message component pattern remains consistent in placement, hierarchy, icon treatment, and border language.
- State meaning is communicated with text and icon as well as color.
- Messages must not obscure the primary Preview Stage unnecessarily.

## 5. Soft / Non-Literal Reference Elements

The following mockup details are illustrative and must not be hard-coded merely
to reproduce a screenshot:

- sample cat photographs;
- filenames such as `CAT_20240421_1430.MPO`;
- sample resolution such as `4032 × 4032`;
- sample ISO, shutter, focal-length, camera, baseline, or frame metadata;
- example export dimensions;
- example estimated file sizes;
- progress percentages such as `58%`;
- sample error text when runtime diagnostics provide more accurate information.

Runtime data and existing application behavior remain the source of truth.
Use the project’s real photography for Homepage Hero and Works when those
sections are implemented. Use uploaded images and actual detected metadata in
the Lab. Do not hard-code generated mockup data just to reproduce a reference
image.

## 6. Behavior vs Visual Reference Rule

Mockups are the source of truth for:

- composition;
- hierarchy;
- spacing intent;
- typography roles;
- surface treatment;
- placement;
- visual state presentation.

`LAB_STATE_DESIGN.md` and the existing application remain the source of truth
for:

- workflow;
- application state;
- control availability;
- parsing;
- Canvas behavior;
- Wiggle playback;
- export capability;
- validation;
- cancellation;
- errors;
- accessibility behavior.

If a mockup implies functionality that does not exist in the approved v1
scope, do not implement new functionality merely to match the image.

Presentation migration must preserve existing Vue state management, image
processing, Canvas rendering, Wiggle generation, export pipeline, download
behavior, and focus management.

## 7. Conflict Resolution

Use this priority order when references or implementation details appear to
conflict:

1. Existing approved v1 functional behavior and safety constraints.
2. `LAB_STATE_DESIGN.md` for UX and state semantics.
3. `VISUAL_REFERENCE.md` for frozen visual decisions.
4. State-specific approved mockup for that state’s presentation.
5. `DESIGN_SYSTEM.md` for shared tokens and general visual language.

Specific resolutions:

- For shared shell conflicts, `ACHILLES_CAT_LAB_DESKTOP_V2.png` wins.
- For the Homepage shared header, ignore the underline shown in the Homepage mockup and use the Lab header’s active dot.
- For Wiggle-specific conflicts, `ACHILLES_CAT_LAB_DESKTOP_WIGGLE_V4.png` wins.
- For paused Wiggle behavior and label treatment, `ACHILLES_CAT_LAB_WIGGLE_PAUSED_DESKTOP.png` is the state-specific reference.
- For state semantics, the approved mockup never overrides `LAB_STATE_DESIGN.md` or existing runtime behavior.

Do not silently resolve any other significant contradiction. Document it and
request explicit approval before changing the frozen direction.

## 8. Responsive Interpretation

The current mockups are Desktop references. They define:

- visual hierarchy;
- relationships;
- grouping;
- proportions;
- design language.

They do not require blindly scaling Desktop pixels onto mobile.

Responsive implementation must preserve the hierarchy and component
relationships defined by the Desktop references while following the responsive
rules in `DESIGN_SYSTEM.md`:

- preserve Preview before Controls as the reading order;
- preserve the Preview Stage as the dominant object;
- preserve the relationship between Guide, Preview, and Controls;
- collapse the two-zone workbench only when the content no longer fits;
- avoid horizontal scrolling and unusable bilingual labels;
- do not invent a separate mobile visual language.

## 9. Implementation Rule After Freeze

After this document is approved:

- Do not redesign during implementation.
- Do not generate replacement concepts or replacement mockups.
- Phrase implementation tasks as visual convergence.
- Fix parent layout and shared primitives before one-off offsets.
- Avoid arbitrary margins and transform hacks.
- Preserve existing business logic, Canvas rendering, and export behavior.
- Keep Split Preview hidden and defer MP4, WebM, advanced export, Works, Archive, Journal, and tutorial-page scope.
- Each implemented state must be captured with Playwright at the fixed reference viewport and compared against its corresponding frozen mockup.

## 10. Visual Sign-off Workflow

Use this workflow for every state that is implemented or materially restyled:

```text
Approved mockup
    → implement existing state
    → fixed viewport Playwright screenshot
    → compare against corresponding mockup
    → Critical differences
    → Major differences
    → Minor polish
    → human approval
    → implementation screenshot becomes the visual regression baseline
```

The comparison must verify both the active state and the stable surrounding
composition. A state passes only when its visual differences are approved and
its existing behavior still works in English and Simplified Chinese.

## Freeze Summary

- **Homepage reference:** `ACHILLES_CAT_HOMEPAGE_DESKTOP_V2.png` for Homepage-specific content.
- **Shared Header reference:** `ACHILLES_CAT_LAB_DESKTOP_V2.png`; the Lab active dot and shared header geometry win over the Homepage underline.
- **Alignment reference:** `ACHILLES_CAT_LAB_DESKTOP_V2.png`.
- **Wiggle reference:** `ACHILLES_CAT_LAB_DESKTOP_WIGGLE_V4.png` for Playing and `ACHILLES_CAT_LAB_WIGGLE_PAUSED_DESKTOP.png` for Paused.
- **Full Lab state manifest:** S-01 through S-16 in this document.
- **Explicit known conflict resolutions:** shared shell and Lab active-state precedence are resolved in favor of the Lab reference; state semantics remain governed by `LAB_STATE_DESIGN.md`.
- **Unresolved conflicts requiring human approval:** none identified in the approved visual set. The different Homepage/Lab image canvas sizes are reference-capture metadata, not a visual-direction conflict.
