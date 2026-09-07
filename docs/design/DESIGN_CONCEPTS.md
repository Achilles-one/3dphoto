# Achilles Cat v1 — Desktop Design Concepts

Status: visual concept baseline before implementation

This document records the two core Desktop concepts for Achilles Cat v1. These concepts are the visual reference for implementation and acceptance. No application code should be changed until the concepts and the acceptance flow below are confirmed.

## Shared direction

Achilles Cat is a personal visual archive. The 3D Photo Lab is one instrument inside that archive, not a separate SaaS product. The interface should feel like a quiet photography book that happens to be interactive: editorial pacing, precise metadata, generous image space, and controls that stay subordinate to the work.

The system combines Readymag-like composition with a practical creative tool:

- warm paper background, deep ink, muted blue-green accent, and fine rules;
- asymmetry and whitespace instead of cards, shadows, gradients, or glassmorphism;
- real photography as the dominant visual material;
- Instrument Serif as the Editorial Serif role, Space Grotesk for interface copy, and DM Mono for metadata and technical state;
- complete Chinese/English switching for all visible copy, including navigation, dialogs, errors, progress, download states, and footer content.

The mockups are high-fidelity composition references. Their photographic content is representative; production must use the project’s real photography or the user’s uploaded images for Hero and Works. Do not replace those images with generated placeholders during implementation.

## Concept 1 — Homepage / 主页

![Achilles Cat Homepage Desktop Concept](mockups/ACHILLES_CAT_HOMEPAGE_DESKTOP_V2.png)

### Layout

The homepage is a long-form editorial index rather than a marketing landing page.

1. A quiet global header starts with the `ACHILLES CAT` wordmark, a thin divider,
   and exposes `Works / Archive / MiuMiu / Lab`. The right side always contains
   `EN / 中文` and `Settings` with the same small state dot used by the Lab.
2. The hero uses two zones: a large editorial statement on the left and one dominant stereo photograph on the right.
3. A selected Works strip follows the hero. Two real image studies sit beside a wider Archive preview, separated by a thin vertical rule.
4. MiuMiu is a short personal-diary teaser only: `A personal visual diary.` It is not a pet-brand campaign or a commercial sticker section.
5. The footer remains sparse and archival, with year, small utility links, and no dense sitemap.

The first viewport should establish depth and authorship immediately. It should not behave like a feature list, pricing page, or dashboard overview.

### Typography

- Hero statement: Instrument Serif, large, calm, and optically tight. Use sentence case rather than all caps.
- Navigation and explanatory copy: Space Grotesk, with restrained tracking.
- Image captions, dates, route labels, and archive metadata: DM Mono, compact and factual.
- Recommended hierarchy: one editorial headline, one short sentence, one clear Lab entry action. Avoid multiple competing CTAs.

Suggested bilingual copy pairs:

| English | 简体中文 |
| --- | --- |
| Looking at the world in depth. | 以深度观看世界。 |
| Photography, stereoscopy, and visual experiments. | 摄影、立体视觉与影像实验。 |
| Enter 3D Photo Lab | 进入 3D Photo Lab |
| Selected Works | 精选作品 |
| Archive Preview | 档案预览 |
| A personal visual diary. | 一份个人视觉日记。 |

### Color usage

- Base: warm paper for the page field.
- Primary text: deep ink, close to black but not absolute black.
- Accent: muted blue-green for the Lab entry, active route, and small state markers.
- Structure: hairline rules and low-contrast borders only.
- Avoid: bright product blue, neon green, decorative gradients, floating cards, excessive rounded corners, and high-contrast badge systems.

The accent should indicate a route or a live state, never become a background color for the whole page.

### Image placement

The hero image is a real stereo photograph presented as a pair or a carefully cropped depth study. It should have enough negative space around its frame to read as an object in an archive, not as a banner.

Works should use real, varied photography with metadata below each image. Preserve the image’s character: do not normalize every work into identical card proportions if the source composition benefits from a different crop.

The mockup uses cat photography to communicate the MiuMiu direction, but the production implementation must use the project’s real image assets and preserve the visual distinction between Achilles Cat as the ecosystem and MiuMiu as one diary section.

### Interaction ideas

- A slight pointer parallax may move the hero image pair by a few pixels to reinforce binocular depth. It must be tied to image depth, stop on reduced-motion preference, and never shift the headline or navigation.
- The Lab entry is a simple text action with an underline/state marker, not a large SaaS button.
- Works can reveal a quiet caption or metadata state on hover/focus; do not build a carousel or masonry interaction for v1.
- Navigation remains stable while scrolling. Future sections may use the same route language without requiring a redesign of the shell.

## Concept 2 — 3D Photo Lab / 3D Photo Lab 工作台

![Achilles Cat 3D Photo Lab Desktop Concept](mockups/ACHILLES_CAT_LAB_DESKTOP_V2.png)

### Layout

The Lab is a two-zone workspace:

1. Utility rail: route identity, `Works / Archive / MiuMiu / Lab`, language switch, and quiet settings/privacy access.
2. Preview + Controls: a dominant preview stage on the left and a focused control column on the right.

The preview owns the page. The controls are an instrument panel, not a collection of equal cards. The control column groups the existing workflow under `View`, `Align`, `Motion`, and `Export`, but only exposes capabilities that already exist in the MVP.

The visible v1 alignment controls are `Horizontal`, `Vertical`, and `Overlay`. `Split Preview` remains hidden. The export dialog includes GIF and the approved H.264 MP4 option; WebM and other advanced export remain deferred. There is no third dashboard column and no new preview mode.

### Editorial Guide entry

Immediately below the Lab introduction and local-processing line, add one thin
editorial Guide band. It is a static orientation index, not a tutorial page,
modal, or help center. Use four compact steps separated by hairlines:

| English | 简体中文 |
| --- | --- |
| GUIDE | 使用指南 |
| 01 Upload stereo image | 01 上传立体图像 |
| 02 Align images | 02 对齐图像 |
| 03 Preview depth motion | 03 预览深度运动 |
| 04 Export result | 04 导出结果 |

The Guide should explain the workflow at a glance and then get out of the way.
It must not introduce new actions, progress state, onboarding dialogs, or a
separate tutorial route.

### Typography

- Lab title and short description: Instrument Serif for the editorial entry point.
- Control labels, buttons, and bilingual descriptions: Space Grotesk.
- File name, format, pixel dimensions, camera metadata, progress, and local-processing state: DM Mono.
- Technical values should be aligned and quiet so they support image inspection without competing with the preview.

Suggested bilingual copy pairs:

| English | 简体中文 |
| --- | --- |
| Convert stereo photos into moving depth images. | 将立体照片转换为具有运动深度的影像。 |
| Local processing | 本地处理 |
| Your files never leave this device. | 文件不会离开此设备。 |
| Alignment Preview | 对齐预览 |
| Horizontal | 水平 |
| Vertical | 垂直 |
| Overlay | 叠加 |
| Create Wiggle | 创建 Wiggle |
| Download | 下载 |

### Color usage

- The page remains warm paper so the Lab belongs to the same archive.
- The preview stage uses deep ink as a darkroom-like matte, providing contrast for stereo imagery.
- The muted blue-green accent marks the active route, primary existing action, and local-processing indicator.
- Controls use paper surfaces, thin rules, and clear focus states. No decorative color blocks should compete with the photo.

### Image placement

The preview is the largest object on the page. For a loaded MPO or stereo pair, show the existing image content in a dark stage with enough margin for alignment guides and technical metadata.

The alignment state may show the existing left/right image relationship and overlay guide. It must not introduce a new Split Preview surface. Empty state, loading state, error state, and generated result should all preserve the same preview footprint so the page does not jump during the workflow.

### Interaction ideas

- Keep the existing workflow: select/upload input, detect or parse, align, create the existing Wiggle output, play/inspect, swap when already supported, and download the existing output.
- Use visible value feedback beside each slider. Reset is a quiet secondary action.
- Use progressive disclosure for secondary groups so the preview remains dominant.
- The only motion added by the redesign is state feedback and existing output playback. Do not add new rotation, video formats, or advanced export behavior.
- Every control, dialog, error, progress message, and download state must switch between Chinese and English without leaving mixed-language copy behind.

## Acceptance flow before implementation

The implementation gate is visual and functional, in this order:

1. **Concept confirmation** — approve the two Desktop mockups as the composition baseline, including the Homepage hero, Works placement, Lab two-zone structure, typography, and color behavior.
2. **Scope confirmation** — confirm that v1 keeps current MVP capabilities, hides Split Preview, cleans unused components, and adds no new functionality.
3. **Asset confirmation** — confirm that Hero and Works use real project photography; confirm local font files and licenses in `public/fonts`.
4. **Bilingual copy audit** — verify English/Chinese coverage for global navigation, homepage, Lab, upload, alignment, export, dialogs, privacy, errors, progress, and footer.
5. **Functional regression** — verify the current upload/detection, alignment, Wiggle generation, playback, swap, and download workflow remains intact.
6. **Visual QA** — compare Desktop implementation against these mockups at the target viewport, then check narrow layouts and reduced motion.
7. **Release gate** — run the existing build and confirm no unused component is mounted or exposed by the v1 routes.

Until steps 1–3 are confirmed, only design documents, mockup assets, font assets, and copy decisions may change. Vue components and business logic remain untouched.
