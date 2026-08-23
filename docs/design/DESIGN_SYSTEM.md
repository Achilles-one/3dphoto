/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */

# Achilles Cat — Visual Design System

Studied DNA: editorial, experimental, personal archive, and digital art. This
system turns those references into a distinct visual language for a practical
photo tool: calm enough for careful work, strange enough to feel authored.

## 1. Design position

**Achilles Cat is a quiet instrument with a curious point of view.** It should
feel like opening a well-kept studio archive: organized, tactile, and slightly
unexpected. The product is not a mascot brand and should not rely on literal
cat illustrations, paw prints, or playful “AI magic” language.

### Principles

- **Archive before dashboard.** Present files, modes, and output as a browsable
  working record rather than a stack of generic cards.
- **Editorial clarity.** Give each screen one dominant idea, one clear action,
  and visible hierarchy between work, controls, and metadata.
- **Experimental in the margins.** Put the unusual moments in crop marks,
  asymmetric spacing, split views, labels, and transitions—not in gradients or
  decorative noise.
- **Tactile, not skeuomorphic.** Use paper-like surfaces, hairline rules, and
  restrained depth; do not simulate a fake browser, camera, or operating system.
- **Precise, never clinical.** Technical status can be exact and concise while
  the overall tone remains human.

## 2. Studied DNA

The reference set in `docs/design/references.md` points to Readymag-led
portfolios and personal sites. The common pattern is a **Split Studio / Archive
Catalogue**: a strong editorial entry point, an asymmetric work area, compact
index-like labels, and a visual rhythm that alternates between open space and
dense detail.

### Structural translation for Achilles Cat

| Reference signal | Achilles Cat expression |
| --- | --- |
| Personal archive | Upload history, file metadata, and export records remain legible and browsable. |
| Editorial hero | A short title and one-sentence explanation introduce the current task. |
| Experimental split layout | Preview and controls occupy distinct, unequal zones; the image always owns the visual focus. |
| Digital art texture | Crops, overlays, alignment guides, stereo pairs, and canvas states become the visual vocabulary. |
| Index-like navigation | Use compact mono labels, view switches, and small persistent utility actions. |
| Human creative studio | Copy is direct, observant, and specific; avoid inflated SaaS claims. |

### Macrostructure

**Primary:** Split Studio.  
**Secondary:** Catalogue / Long Document for file history, guides, and export
details.

### Component archetypes

- **H2 Split hero:** title and context on one side; the active file or primary
  action on the other.
- **F6 Product grid:** view modes and file states presented as an index, not as
  equal feature cards.
- **Workbench stage:** a large quiet canvas with controls orbiting it through
  hierarchy, not visual noise.
- **Ft1 Quiet index:** short utility links, privacy, version, and provenance in
  a light footer row.

### Rhythm

- Start generous, then tighten as the user enters the workbench.
- Alternate full-width visual stages with compact metadata bands.
- Prefer left-biased reading order; reserve the right side for actions,
  controls, or a secondary view.
- Use asymmetry deliberately: a 7/5 or 8/4 split is more characteristic than
  a perfectly even two-column grid.
- Let blank space mark a change of mode. Do not fill every region with a card.

## 3. Brand voice

### Voice

Quietly confident, observant, concise, and a little playful in naming. Write as
if a creative technologist is showing someone around a studio tool.

### Copy rules

- Prefer verbs: **Choose a file**, **Compare views**, **Export the result**.
- Use technical terms only when they help the user act.
- Explain limitations plainly: “This format is not supported yet.”
- Status messages should say what happened and what to do next.
- Never invent performance numbers, customer counts, testimonials, or quality
  claims.
- Avoid “revolutionary”, “seamless”, “next-generation”, “AI-powered magic”, and
  similar category language.

### Example vocabulary

Good: “A closer look at the left and right view.”  
Good: “The file stays in your browser until you export it.”  
Avoid: “Unlock an effortless 3D transformation experience.”

## 4. Color system

The palette keeps the existing warm paper and deep teal foundation, then gives
them semantic names. The single brand accent is a muted blue-green. Amber is
reserved for focus and attention; it is not a second decorative brand color.

```css
:root {
  --color-paper:          oklch(96% 0.015 85);
  --color-paper-2:        oklch(93% 0.020 78);
  --color-surface:        oklch(99% 0.008 90);
  --color-surface-muted:  oklch(95% 0.012 165);
  --color-surface-inverse: oklch(24% 0.025 185);

  --color-ink:            oklch(24% 0.030 230);
  --color-ink-2:          oklch(42% 0.025 220);
  --color-ink-muted:      oklch(56% 0.025 190);
  --color-rule:           oklch(84% 0.025 92);
  --color-rule-strong:    oklch(72% 0.035 165);

  --color-accent:         oklch(47% 0.090 166);
  --color-accent-strong:  oklch(39% 0.100 165);
  --color-accent-soft:    oklch(91% 0.045 165);
  --color-accent-ink:     oklch(98% 0.010 85);

  --color-focus:          oklch(50% 0.140 88);
  --color-info:           oklch(58% 0.100 230);
  --color-success:        oklch(49% 0.100 150);
  --color-warning:        oklch(62% 0.140 78);
  --color-danger:         oklch(52% 0.150 30);

  --shadow-panel: 0 16px 40px oklch(24% 0.030 230 / 0.08);
  --shadow-floating: 0 24px 72px oklch(24% 0.030 230 / 0.16);
}
```

### Color behavior

- Paper is the default field; surfaces are reserved for active work areas.
- Keep the accent footprint small: actions, selected states, links, and key
  guide lines. Target roughly 5–15% of a view, never a full-page wash.
- Rules are visible but quiet. Use one-pixel hairlines before adding shadows.
- Inverse surfaces are for the image stage, canvas overlays, or a focused
  export state—not for every panel.
- Every status color must be paired with text or an icon; color alone never
  carries meaning.

## 5. Typography

Use a 2+1 pairing: a distinct roman display face, a highly readable body face,
and a mono face for labels and metadata. No italic display headings.

```css
:root {
  --font-display: "Instrument Serif", Georgia, serif;
  --font-body:    "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "DM Mono", ui-monospace, SFMono-Regular, Consolas, monospace;

  --text-xs:      0.75rem;
  --text-sm:      0.875rem;
  --text-md:      1rem;
  --text-lg:      1.25rem;
  --text-xl:      1.5rem;
  --text-2xl:     2rem;
  --text-display: clamp(2.75rem, 7vw, 5.5rem);

  --leading-tight: 0.98;
  --leading-body:  1.55;
  --tracking-label: 0.08em;
}
```

### Type roles

- **Display:** `--font-display`, Instrument Serif, regular roman, tight leading.
  Use for one headline or section idea at a time.
- **Body:** `--font-body`, Space Grotesk, weight 400–500, relaxed leading. Use for guidance,
  privacy notes, and explanatory copy.
- **Label:** `--font-mono`, 11–13px, uppercase only when it is genuinely a
  category or state. Never turn every paragraph into a label.
- **Numbers:** tabular numerals for file dimensions, progress, and coordinates.

### Font asset mapping

The role name “Editorial Serif” maps to the concrete `Instrument Serif` family
for implementation. v1 font assets are stored locally under `public/fonts`:

- `InstrumentSerif-Regular.ttf` — Editorial Serif display role.
- `SpaceGrotesk-wght.ttf` — interface and display sans role.
- `DMMono-Regular.ttf` — metadata and technical label role.

Each font is accompanied by its SIL Open Font License file. The product must
not depend on a remote font request. All visible copy, including the brand
shell, navigation, Lab, dialogs, status messages, errors, and footer, must have
Chinese and English variants.

## 6. Spacing, geometry, and surfaces

```css
:root {
  --space-3xs: 0.25rem;
  --space-2xs: 0.5rem;
  --space-xs:  0.75rem;
  --space-sm:  1rem;
  --space-md:  1.5rem;
  --space-lg:  2rem;
  --space-xl:  3rem;
  --space-2xl: 4rem;
  --space-3xl: 6rem;
  --space-4xl: 8rem;

  --radius-control: 0.5rem;
  --radius-panel:   0.75rem;
  --radius-stage:   0.25rem;
  --radius-pill:    999px;

  --rule-hairline: 1px;
  --content-max: 70rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 180ms;
  --dur-base: 240ms;
  --dur-slow: 320ms;
}
```

### Shape rules

- Use four-point spacing consistently; create larger pauses with multiples of
  the same scale.
- Panels are lightly rounded, never inflated into floating “app cards”.
- Controls may use compact rounded corners; reserve pills for filters, compact
  status chips, and truly categorical switches.
- Image stages should be flatter and more architectural than text panels.
- Prefer a hairline border plus one restrained shadow over stacked shadows.

## 7. Layout grammar

### Page shell

1. **Utility rail:** shared wordmark/navigation, locale, Settings, and one quiet
   version or status note. Keep it slim and left-readable. The Lab Guide stays
   beside the Lab introduction rather than in the global header.
2. **Editorial entry:** short title, one-sentence context, and the primary file
   action. Avoid a marketing hero.
3. **Workbench:** asymmetrical preview/control split. The preview receives the
   largest uninterrupted area.
4. **Index band:** file name, dimensions, mode, and export state in compact
   metadata rows.
5. **Quiet footer:** privacy, release, and support links.

### Responsive behavior

- At 320–414px, collapse every split into a single column; preview first,
  controls second.
- At 768px, use a modest 7/5 split when both preview and controls need to stay
  visible.
- Keep image-bearing tracks `minmax(0, 1fr)` and prevent horizontal scroll.
- Long display headings may wrap anywhere; clickable labels must remain on one
  line or be shortened.
- Section headers always become one column on small screens.

## 8. Component language

### Upload / drop zone

An open, framed invitation rather than a giant call-to-action card. Use a dashed
rule, generous empty space, one clear verb, and a small format note. On hover
or drag, shift the surface to `--color-accent-soft` and strengthen the rule.

### Preview stage

The canvas is the hero. Give it a quiet inverse or neutral surface, a thin
frame, and precise overlay labels. Side-by-side, top-bottom, and MPO views
should feel like deliberate editorial compositions, not generic thumbnails.

### Controls

Group controls by intent: **view**, **alignment**, **motion**, **export**. Each
group gets one heading and one primary control path. Do not show every option at
the same visual weight.

### Segmented controls

Use for mutually exclusive view modes only. The selected state uses accent fill
or a stronger hairline; avoid adding a separate pill for every option.

### Status messages

Use a compact icon, a one-line result, and an optional next action. Success is
quiet and persistent; errors explain recovery. Prefer an inline Undo action to
a confirmation dialog.

### Modals

Use only when the user must make a contained decision or read a guide. On
mobile, anchor the modal to the bottom with a clear close action. Never recreate
browser chrome inside the modal.

## 9. Interaction and motion

The stance is **motion-cut with one orchestrated reveal**. Motion should clarify
state, not add personality on top of the content.

- Page entry: a short opacity + translate reveal, staggered once.
- State changes: animate `transform` and `opacity` only.
- Hover: small color/rule change; no card zoom, bounce, or gradient sweep.
- Loading: use a quiet linear progress or restrained indicator; preserve the
  active layout.
- Focus: an immediate, high-contrast ring using `--color-focus`; never animate
  the ring.
- Reduced motion: remove spatial movement and keep an opacity crossfade of
  150ms or less.

Every interactive component needs visible styling for: default, hover,
focus-visible, active, disabled, loading, error, and success.

## 10. Graphic motifs

Use a small, repeatable visual vocabulary instead of decorative illustration:

- crop brackets and registration marks;
- thin alignment axes and stereo guide lines;
- index numbers and mono metadata;
- slightly offset frames for compare states;
- a single “cat-eye” cue: a narrow horizontal highlight or paired marker used
  once per view, never as a mascot.

Do not use paw prints, cartoon cats, glossy 3D mascots, neon gradients, random
grain, or ornamental blobs as default decoration.

## 11. Accessibility baseline

- Maintain at least 4.5:1 contrast for body text and 3:1 for large text and
  interface boundaries.
- Keep keyboard focus visible and never rely on hover-only information.
- Pair status colors with text or icons.
- Preserve a minimum 44px hit area for touch controls.
- Provide meaningful labels for upload, compare, align, animate, and export
  actions.
- Keep the canvas usable at 200% zoom and on narrow screens.

## 12. Implementation handoff

The current project foundation is Vue + Vite with global styles in
`src/styles/base.css` and `src/styles/layout.css`. Preserve the existing Inter
body stack and warm paper / teal-green direction when applying this system;
introduce display and mono faces only through named tokens. Consolidate raw
color values into semantic variables before extending the UI.

The design system is intentionally portable: future CSS should consume the
tokens above by name, use the layout grammar for page-level decisions, and use
the component language for local states. New visual ideas should earn their
place by improving orientation, comparison, or creative focus.

Before implementation, confirm the two Desktop high-fidelity design concepts
and freeze the acceptance checklist. Code changes begin only after that gate.

## 13. Provenance and limits

Primary references are listed in `docs/design/references.md`, including
[Joana Tavares](https://souajoana.com/), [T-KO](https://t-ko.live/),
[Goodness](https://hellogoodness.co/), and the supplied Readymag examples.
The extraction is structural and directional, not a pixel reproduction. Some
references returned limited or loading-only HTML during shallow study, so exact
font names, color values, and page rhythm were not treated as authoritative;
the system favors the shared editorial DNA and the existing product foundation.

## 14. Anti-patterns to avoid

- generic centered hero → three equal feature cards → CTA;
- dashboard walls of identical rounded cards;
- purple/blue AI gradients and glassmorphism by default;
- oversized marketing claims or invented metrics;
- italic display headings or mixed italic emphasis in headers;
- transition-all, bounce, hover-scale, and celebratory success toasts;
- left-margin eyebrow / right-heading “hanging header” layouts;
- fake browser bars, fake device frames, and fake editor chrome;
- literal cat mascots that compete with the work.


# Global Header Specification
## Purpose

All Achilles Cat pages share the same global header.
Homepage and Lab must use identical header structure.

## Structure

Left:

ACHILLES CAT

Center:

Works
Archive
MiuMiu
Lab

Right:

Language
Settings
Status


## Rules

Do not create page-specific headers.

Do not redesign navigation per page.

Header is a shared component.
