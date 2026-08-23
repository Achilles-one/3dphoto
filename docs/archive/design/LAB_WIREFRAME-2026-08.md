# Achilles Cat Lab Wireframe

Version: v1.0

---

# 1. Page Purpose


## Identity


3D Photo Lab is a creative instrument inside Achilles Cat.


It allows users to transform stereo images into:

- Wiggle images
- Animated depth experiences


It is not:

- A generic image converter
- A SaaS dashboard
- An AI image generator


The feeling should be:

"A photographer's digital darkroom."


---

# 2. Primary Goal


Help users complete:

Upload
↓
Preview
↓
Adjust depth
↓
Export


while maintaining the Achilles Cat visual identity.


---

# 3. Information Architecture


3D PHOTO LAB


│
├── Lab Header
│
├── File Input
│
├── Main Preview Stage
│
├── Adjustment Controls
│
├── Export
│
└── Metadata


---

# 4. Layout Structure


## Overall Layout


Two-zone workspace:


UTILITY RAIL:

Global navigation, locale, Settings, and quiet product context. The four-step
Guide is local to the Lab introduction, immediately before the workspace.


PREVIEW + CONTROLS:

Main image workspace with controls in one focused secondary zone.


The preview area has the highest visual priority.


---

# 5. Section Specifications


## 01. Lab Header


Purpose:

Identify current creative tool.


Content:

Title:

3D Photo Lab


Description:

Convert stereo photos into moving depth images.


Show:

- Current file
- Format
- Resolution


Avoid:

Large marketing hero.


# 02. Editorial Guide


Purpose:

Explain the existing workflow at a glance near the Lab introduction.


Placement:

Directly below the Lab description and local-processing note, before the
two-zone workspace.


Content:

- `GUIDE / 使用指南`
- `01 Upload stereo image / 上传立体图像`
- `02 Align images / 对齐图像`
- `03 Preview depth motion / 预览深度运动`
- `04 Export result / 导出结果`


Style:

- One thin editorial band with hairline separators.
- Static, compact, and readable in one glance.
- No tutorial page, modal-heavy onboarding, help-center layout, or new
  functionality.


---

# 03. File Input


Purpose:

Start the creative process.


Supported:

- MPO
- SBS
- Stereo images


Display:

File information:

- Filename
- Format
- Resolution


Style:

Quiet technical label.


Avoid:

Large SaaS upload card.

Example:

Avoid:

"Drop your image here!!!"


Prefer:

A studio workspace entry.


---

# 04. Main Preview Stage


Priority:

Highest.


The preview is the main object of the page.


Purpose:

Let users immediately understand depth.


Contains:

- Stereo image preview
- Wiggle animation
- Alignment result


Feeling:

Viewing a photograph.

Not operating software.


Layout:

Large canvas.


Avoid:

Small preview window surrounded by controls.


---

# 05. Adjustment Controls


Purpose:

Fine tune the image.


Controls:


## Alignment

- Horizontal offset
- Vertical offset
- Overlay opacity


## Animation

- Speed
- Loop
- Frame settings


## Preview

- Playback mode


Style:

Precision instrument.


Avoid:

Dashboard cards.


Controls should feel:

- Calm
- Precise
- Professional


---

# 06. Export


Purpose:

Complete creation.


Formats in v1:

- GIF
- SBS PNG where the existing MPO workflow supports it


Options:

- Size
- Quality


Primary action:

Download existing output


Style:

Clear but not aggressive.


---

# 07. Metadata


Purpose:

Connect tool with photography culture.


Display:

Example:


Camera:

Panasonic GX9


Format:

MPO


Frames:

2


Resolution:

...


Future:

- Fujifilm FinePix Real 3D
- Nintendo 3DS
- Other stereo cameras


---

# 7. State Design


## Empty State


Before upload:

Show:

- Supported formats
- Simple explanation


Avoid:

Generic empty dashboard.


---

## Processing State


Show:

- Current progress
- Quiet animation


Avoid:

Large loading screens.


---

## Success State


Show:

- Finished preview
- Export options


---

## Error State


Explain:

- What happened
- How to fix


Avoid:

Generic red alert boxes.


---

# 8. Motion Principles


Motion should explain:

- Depth
- Stereo relationship
- Processing state


Recommended:

- Subtle image movement
- Smooth transitions
- Depth-based interaction


Avoid:

- Decorative animations


---

# 9. Implementation Constraints


Keep existing:

- MPO parsing
- Stereo processing
- Alignment logic
- Rendering pipeline
- Export logic


The redesign should focus on:

- Layout
- Visual system
- Components
- Interaction


Do not rewrite working image processing code.

Split Preview remains hidden in v1. Do not add a new visible preview mode or
new export format. Clean unused `InputDetectionPanel`, `SplitPreviewPanel`,
and `ErrorMessage` components when they are not required by the existing
workflow; do not add functionality solely to keep them mounted.

All Lab copy must support the existing Chinese/English locale behavior.


---

# 10. Future Expansion


Lab can contain future tools:


- MPO/SBS utilities
- Wiggle generator
- Stereo adjustments
- Export tools


All tools should follow the same Achilles Cat Lab language.
