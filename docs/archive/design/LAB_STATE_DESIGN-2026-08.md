# Achilles Cat 3D Photo Lab — UX Flow + State Design

Status: design specification only  
Scope: v1 presentation-layer completion for the existing 3D Photo Lab workflow  
Implementation status: no code changes required by this document

This document fills the state and interaction gaps that are not represented in
the approved desktop mockup, especially the Wiggle Preview, export dialog,
export progress, cancellation, and recovery states.

The product remains a quiet photography instrument inside the Achilles Cat
archive. It is not a dashboard, an onboarding funnel, or a generic converter.

## 1. Scope and invariants

### Keep

- MPO upload and parsing.
- JPG/PNG stereo-image upload and layout detection.
- Alignment preview and horizontal, vertical, and overlay adjustments.
- Wiggle generation and playback controls.
- GIF export and existing MPO SBS PNG export where supported.
- Existing Vue state management, canvas renderers, workers, and export pipeline.
- Existing Chinese/English locale switching for every visible state.

### Hidden or deferred in v1

- Split Preview as a visible preview mode.
- MP4 and WebM export.
- Advanced export settings beyond the existing format, framing, and size choices.
- A tutorial page, help center, modal-heavy onboarding, Works system, Archive
  system, and Journal system.

“Split” may remain in internal compatibility types if the implementation needs
it, but it must not appear as a user-facing preview mode in v1.

### Design constraint

The state design changes presentation and interaction hierarchy only. It must
not create a second image-processing pipeline or duplicate business state.
The current `AppPhase`, `PreviewMode`, `WiggleSettings`, error model, and export
session remain the source of truth.

## 2. Product promise and success path

The Lab should make one path obvious:

```text
Choose stereo image
        ↓
Read and parse locally
        ↓
Align the two views
        ↓
Create Wiggle
        ↓
Preview depth motion
        ↓
Choose output settings
        ↓
Create and download result
```

The preview stage remains the dominant object throughout. Controls change
according to the active task, while the stage preserves its position and
dimensions so the user does not lose orientation.

The intended feeling is: “I am looking at a photograph and carefully tuning
its depth,” not “I am moving through a sequence of application screens.”

## 3. State model

### 3.1 Existing application state mapping

| UX state | `AppPhase` | `previewMode` | Meaning |
| --- | --- | --- | --- |
| Empty | `empty` | `align` | No source file has been accepted. |
| Loading | `loading` | `align` | The selected file is being read, decoded, parsed, and prepared. |
| Alignment ready | `preview` | `align` | A stereo pair is available for alignment. |
| Creating Wiggle | `creating` | `align` until completion | The existing Wiggle creation action is preparing the motion preview. |
| Wiggle ready | `preview` | `wiggle` | The motion preview exists and can be played, paused, adjusted, or exported. |
| Exporting | `exporting` | retains active mode | A GIF or SBS file is being created. The export dialog remains the active surface. |
| Recoverable error | `preview` with `error` | retains active mode | The current work remains usable while a message explains a failed action. |
| Blocking input/process error | `error` | `align` | No usable preview is available; the user must choose another file or retry. |

`error` is a transient explanation layer, not a separate page. When the error
is recoverable, the preview and current settings stay intact. When the error
blocks processing, the Lab returns to a clear input-oriented state after the
message is acknowledged or dismissed.

### 3.2 Presentation layers

The page has four persistent layers and one conditional layer:

1. Global header: ecosystem navigation, language, Settings, and status.
2. Lab entry: title, one-sentence description, local-processing note, and the
   four-step Guide.
3. Workbench: compact Input entry, dominant Preview Stage, and Controls.
4. Quiet footer: version, Privacy, and Feedback.
5. Conditional surfaces: message center, loading veil, and export dialog.

The conditional layers must not move the main Preview/Controls grid when they
appear. A message is anchored to the message area; the export dialog is
teleported above the page; the creating veil belongs to the workbench.

## 4. Primary UX flow

### Flow A — Upload to Alignment Preview

```text
EMPTY
  ├─ choose file / drop file
  │     ├─ unsupported or rejected → INPUT ERROR
  │     └─ accepted → LOADING
  │                         ├─ decode/parse failure → PROCESS ERROR
  │                         └─ success → ALIGNMENT READY
  └─ Guide remains visible as orientation, not onboarding
```

#### Empty

Purpose: invite the first action without looking like a large SaaS upload card.

Visible hierarchy:

- Input label: `INPUT / 输入`.
- One direct action: `Upload a 3D photo / 上传 3D 照片`.
- Supported formats: `MPO / JPG / PNG`.
- Local-processing note: `Images stay in your browser. / 图片留在浏览器中处理。`
- Preview stage remains a quiet dark stage with a short empty message.
- Controls are visible as structure but disabled, or visually subordinate until
  a file is available.

Interaction:

- Click the upload control to open the native file picker.
- Dragging a supported file over the drop zone highlights the rule and surface.
- A rejected file does not start processing.
- The Guide is static and does not open another page or modal.

#### Loading

Purpose: communicate that local work is in progress while preserving the Lab
composition.

Visible hierarchy:

- The Input entry shows the selected file context if available.
- Preview Stage shows a restrained status: `Reading and parsing photo… / 正在读取并解析照片…`.
- The workbench stays in place; no full-page loading screen.
- Upload is disabled while the active file is being processed.
- Controls cannot be used until a stereo pair is ready.

Motion:

- Use one quiet indicator or short linear progress treatment.
- Do not animate the whole page or introduce a blocking product tour.
- With reduced motion, keep the layout static and use text/status changes only.

#### Alignment ready

Purpose: help the user understand the stereo relationship before generating
motion.

Visible hierarchy:

```text
Preview Stage                         Controls
──────────────────────                ─────────────
Alignment Preview                     ALIGN
Stereo pair / overlay canvas          Horizontal
Alignment axes and metadata            Vertical
                                        Overlay
                                        Reset alignment
                                        MOTION
                                        Create Wiggle
```

- The Preview Stage remains the largest object.
- The stage caption identifies `ALIGNMENT STAGE / 对齐舞台` and its purpose.
- The alignment canvas owns the visual focus; controls are precise and quiet.
- `Horizontal`, `Vertical`, and `Overlay` show a label, track, and numeric value.
- `Reset alignment` restores only alignment and overlay defaults.
- `Create Wiggle` is the next clear action.
- For JPG/PNG combined images, the existing layout toggle may remain available
  as a small stage utility. It changes source layout, not preview mode.
- For MPO, the layout utility is disabled or unavailable with a concise reason.

The mode switch must not make the user think the file is reprocessed. It only
changes the view of the already available stereo pair.

### Flow B — Alignment to Wiggle Preview

```text
ALIGNMENT READY
        │ Create Wiggle
        ▼
CREATING WIGGLE
        ├─ canceled / invalidated → ALIGNMENT READY
        ├─ processing failure → RECOVERABLE ERROR + ALIGNMENT READY
        └─ success → WIGGLE READY
```

#### Creating Wiggle

Purpose: confirm that the user’s alignment settings are being turned into a
motion preview.

Visible hierarchy:

- The Preview Stage remains in the same geometry.
- A quiet workbench status reads `Creating Wiggle / 正在创建 Wiggle`.
- Controls are disabled for the duration of creation.
- The existing alignment canvas may remain visible beneath the status until
  the Wiggle canvas is ready; do not flash a new page or resize the stage.

Completion:

- On success, switch to `Wiggle Preview` automatically.
- Preserve the selected file, detection metadata, and alignment settings.
- Respect reduced-motion preference: a newly created preview may be paused
  when the user has requested reduced motion.

#### Wiggle ready — initial state

Purpose: let the user see the depth result immediately and choose whether to
adjust playback or export.

The Wiggle state is not a different page. It is the same Lab workbench with a
different preview mode and control group.

Visible hierarchy:

- Stage caption: `WIGGLE STAGE / Wiggle 舞台`.
- Stage note: `Preview depth motion / 预览深度运动`.
- The dark Preview Stage contains the existing canvas and no extra decorative
  animation layer.
- The Controls column changes from alignment controls to Motion controls.
- The export action becomes available in the `EXPORT / 导出` group.

Recommended control order:

1. Playback: `Pause / 暂停` or `Play / 播放`.
2. Speed: frame interval in milliseconds.
3. Swap eyes.
4. Intermediate frames on/off.
5. `Adjust alignment / 调整对齐` to return to the Alignment Preview.
6. `Download / 下载` to open the export dialog.

The preview itself should answer “what changed?” before the controls ask the
user to make another decision. Do not place export options inside the canvas.

#### Wiggle playback states

| State | Stage | Playback action | Other controls |
| --- | --- | --- | --- |
| Playing | Canvas animates through the existing frame sequence | `Pause / 暂停` | Enabled while `AppPhase` is `preview` |
| Paused | Canvas holds the current frame | `Play / 播放` | Speed and eye order remain available |
| Reduced motion | Canvas does not auto-play | `Play / 播放` | User can opt in explicitly |
| Adjusting alignment | Returns to alignment canvas | `Adjust alignment` no longer needed | Alignment controls return; existing settings are preserved |

Do not use bounce, zoom, celebratory confetti, or a large success toast when a
Wiggle is created. The change from alignment to motion should be a restrained
opacity crossfade or no transition under reduced motion.

### Flow C — Export

```text
WIGGLE READY
      │ Download
      ▼
EXPORT DIALOG — CONFIGURE
      ├─ Cancel / Escape / backdrop → WIGGLE READY
      ├─ unavailable choice → remain in CONFIGURE with explanation
      └─ Confirm download → EXPORTING
                                  ├─ Cancel export → WIGGLE READY
                                  ├─ success → WIGGLE READY + success message
                                  └─ failure → WIGGLE READY + recovery message
```

## 5. Export dialog state design

The export dialog is a contained decision surface, not a second application
screen. It appears only after the user has a valid stereo pair and has reached
the Wiggle state or an existing workflow entry point.

### 5.1 Dialog: Configure

Header:

- Kicker: `DOWNLOAD / 下载`.
- Title: `Download / 下载`.
- Compact index: `EXPORT / 01`.
- Clear close/cancel behavior.

Format section:

- For MPO input: show `GIF` and `SBS PNG` choices.
- For JPG/PNG combined input: keep only the existing supported output path.
- If SBS is not available because dimensions do not match or memory is unsafe,
  keep the choice visible but disabled with a plain explanation.

GIF options:

- Framing: `Crop overlap / 裁切重叠区` or `Full frame / 完整画面`.
- Size: `Small / 小`, `Medium / 中`, `Large / 大`.
- Show dimensions and estimated file size as technical metadata.
- Mark device-unavailable sizes as unavailable; do not silently change a user’s
  choice without explaining the fallback.

Copy tone:

- Direct, specific, and local.
- Example: `No white edges; image edges will be cropped.` / `无白边，边缘会裁切。`
- Avoid “high quality”, “optimized”, “magic”, or marketing claims.

Primary actions:

- Secondary: `Cancel / 取消`.
- Primary: `Confirm download / 确认下载`.
- The primary action is disabled only when the selected output is not safe or
  available; the reason remains visible next to the choice.

### 5.2 Dialog: Exporting

When the user confirms, retain the dialog in place and switch it to progress
mode. Do not close the dialog before the file has been created.

Visible content:

- Selected format and essential option summary remain identifiable.
- Progress stage: `Preparing frames / 正在准备帧` or `Encoding / 正在编码`.
- Percentage and a thin progress track.
- Guidance: `Keep this window open while the file is created.` /
  `文件创建期间请保持此窗口打开。`
- Primary action changes to a disabled/loading `Creating file… / 正在创建文件…`.
- Secondary action changes to `Cancel export / 取消导出`.

Behavior:

- Disable all format, framing, and size inputs while exporting.
- Cancellation calls the existing export cancellation path and returns to the
  Wiggle Preview without clearing the source or settings.
- Do not permit a second export session while one is active.

### 5.3 Dialog: Success

Success is intentionally brief:

1. The browser download begins through the existing download path.
2. The dialog closes.
3. The Wiggle Preview remains visible and usable.
4. A quiet message appears: `Downloaded / 已下载`.

The message should not cover the Preview Stage, reset the controls, or force a
new confirmation. It may dismiss automatically according to the existing
message-center behavior and must remain manually dismissible.

### 5.4 Dialog: Failure and unavailable outputs

Export failure is recoverable. The source preview and current settings remain.
The dialog closes or returns to configure mode according to the existing
interaction path, then the message explains the next action.

| Situation | Message direction | Next action |
| --- | --- | --- |
| GIF memory budget exceeded | `This export exceeds the safe memory budget… / 此导出超出当前设备的安全内存预算…` | Choose a smaller size. |
| GIF encoder/export failure | `GIF export failed. / GIF 导出失败。` | Try a smaller size or retry. |
| SBS dimensions mismatch | `The two views do not have matching dimensions… / 两个视图尺寸不匹配…` | Choose GIF or use a matching pair. |
| User canceled | No error message | Continue working in Wiggle Preview. |

Avoid a red full-width alert, a destructive confirmation dialog, or a reset to
Empty after export failure.

## 6. Complete state inventory

This is the implementation acceptance matrix for the Lab presentation layer.

| ID | State | Primary visual object | Available actions | Must preserve |
| --- | --- | --- | --- | --- |
| S-01 | Empty | Compact Input entry + quiet empty stage | Upload, drag/drop, language | No file, default settings |
| S-02 | Drag over | Input drop zone rule/surface | Drop or leave zone | No processing until drop |
| S-03 | Rejected input | Input message/status | Choose another file, dismiss | Existing preview if one exists |
| S-04 | Loading | Existing stage with processing status | No editing; upload disabled | Selected file context |
| S-05 | Blocking parse error | Message plus empty/input-oriented stage | Choose another file, dismiss | Locale and shell |
| S-06 | Alignment ready | Alignment canvas | Adjust sliders, reset, change source layout, Create Wiggle | Stereo pair, detection, file |
| S-07 | Alignment layout change | Existing stage with quiet busy indication | Wait or recover | Alignment state unless operation fails |
| S-08 | Creating Wiggle | Same stage geometry + workbench status | No duplicate create/export | Source and settings |
| S-09 | Wiggle playing | Wiggle canvas | Pause, speed, swap eyes, intermediate frames, adjust alignment, download | Canvas lifecycle and settings |
| S-10 | Wiggle paused | Held Wiggle canvas | Play and all other Wiggle actions | Current frame and settings |
| S-11 | Export configure | Export dialog | Choose format, framing, size, cancel, confirm | Wiggle preview underneath |
| S-12 | Export unavailable option | Dialog with disabled choice + reason | Choose another option, cancel | Existing valid choices |
| S-13 | Exporting | Dialog progress | Cancel export | Source and preview |
| S-14 | Export success | Wiggle canvas + quiet message | Continue, export again | Selected source and settings |
| S-15 | Export failure | Wiggle canvas + recovery message | Retry with safer option, dismiss | Preview and settings |
| S-16 | Privacy modal | Privacy dialog | Close, toggle existing preference | Underlying workbench state |

## 7. Component and responsibility map

This map is for presentation implementation. It does not authorize new
business logic.

| Existing component / layer | State responsibility | Presentation responsibility |
| --- | --- | --- |
| `UploadPanel.vue` | File selection, drag/drop, accept/reject, loading copy | Empty, drag-over, loading, and rejected-input presentation |
| `AlignmentPreviewPanel.vue` | Existing alignment canvas lifecycle | Alignment Stage, empty/loading copy, canvas caption |
| `PreviewCanvas.vue` | Existing Wiggle canvas lifecycle and playback rendering | Wiggle Stage, playing/paused/empty/loading copy |
| `ControlPanel.vue` | Existing alignment, motion, and export events | Contextual Controls for Align and Wiggle states |
| `GifExportDialog.vue` | Existing format/size/framing selection and progress props | Configure, unavailable, exporting, and cancel states |
| `MessageCenter.vue` | Existing transient message queue | Input, processing, export success, warning, and error messages |
| `App.vue` | Existing orchestration and phase transitions | Stable workbench composition and conditional surface placement |
| `useAppState` | Existing source of truth | No duplicate UI state machine should replace it |
| `useDialogFocus` | Existing modal focus behavior | Focus trap, Escape close, restore focus |

Unused `InputDetectionPanel`, `SplitPreviewPanel`, and `ErrorMessage` files
should not be reintroduced solely to represent these states. Input detection
metadata can remain in the existing app state and be surfaced only if the
current workflow already exposes it. Split Preview stays hidden in v1.

## 8. Message and error hierarchy

Use three levels only:

### Inline stage status

For loading and empty states where the user needs orientation immediately.

Examples:

- `Preparing alignment preview… / 正在准备对齐预览…`
- `Your preview will appear here after creating a Wiggle. / 创建 Wiggle 后，预览会显示在这里。`

### Recoverable message

For a completed or failed action where the user can continue working.

Examples:

- `Photo parsed. You can start aligning. / 照片已解析，可以开始对齐。`
- `GIF export failed. Try a smaller size. / GIF 导出失败，请尝试较小的尺寸。`

### Blocking error

For an input or processing failure that prevents a usable preview.
The message must include:

1. What happened.
2. What to try next.
3. The diagnostic code where appropriate.

Color never carries meaning alone. Pair error, warning, and success treatment
with text and the existing icon/label pattern.

## 9. Bilingual behavior

Every state has a complete English and Simplified Chinese copy set. Switching
locale must update:

- Header, Guide, Input, Preview captions, Controls, and buttons.
- Empty, loading, creating, and playback copy.
- Export dialog headings, options, estimates, progress, and cancel actions.
- Success, warning, blocking error, and recovery messages.
- Accessibility labels, dialog labels, and focus announcements.

Do not mix languages within one state except for product terms that are already
part of the vocabulary, such as `MPO`, `GIF`, `SBS`, and `Wiggle`.

Recommended stable terms:

| English | 简体中文 |
| --- | --- |
| Alignment Preview | 对齐预览 |
| Wiggle Preview | Wiggle 预览 |
| Create Wiggle | 创建 Wiggle |
| Adjust alignment | 调整对齐 |
| Download | 下载 |
| Confirm download | 确认下载 |
| Cancel export | 取消导出 |
| Preparing frames | 正在准备帧 |
| Encoding | 正在编码 |
| Downloaded | 已下载 |

## 10. Motion and transition rules

State changes should explain the workflow:

- Empty → Loading: input status changes; do not move the whole workbench.
- Loading → Alignment: reveal the loaded canvas with a short opacity change.
- Alignment → Creating: keep the stage footprint; show one quiet busy indicator.
- Creating → Wiggle: crossfade the stage content; do not scale or transform the
  Canvas element.
- Wiggle → Export dialog: use a restrained opacity/backdrop reveal.
- Exporting → Success: close the dialog and show the message without a page jump.

Under `prefers-reduced-motion: reduce`:

- Disable spatial movement and autoplay.
- Keep only a brief opacity change of 150ms or less.
- Never use animation as the only indication of progress or state.

## 11. Accessibility and focus behavior

- The upload action has a visible label and supports keyboard activation.
- Drag/drop is an enhancement; it is never the only upload path.
- Disabled controls explain their unavailable condition through nearby text or
  an accessible label where needed.
- The Preview Stage has a meaningful accessible label in both locales.
- Alignment and playback controls retain native keyboard behavior and visible
  focus rings.
- The export dialog uses `role="dialog"`, `aria-modal="true"`, a labelled
  heading, focus containment, Escape to cancel, and focus restoration to the
  Download trigger.
- During export, progress is announced through a polite live region; avoid
  announcing every minor percentage change as a separate interruptive message.
- Success and errors are announced through the existing polite message region.

## 12. Acceptance checklist

Before implementing the missing presentation states, verify each item below:

### Flow integrity

- [ ] Empty → upload → loading → alignment works without a layout jump.
- [ ] Alignment adjustments affect the existing alignment renderer only.
- [ ] Create Wiggle enters a visible creating state and ends in Wiggle Preview.
- [ ] Wiggle Preview supports play/pause, speed, eye swap, intermediate frames,
      and return to alignment.
- [ ] Download opens the export dialog only when a stereo pair is available.
- [ ] Confirming export keeps the dialog visible during progress.
- [ ] Canceling export returns to Wiggle Preview without clearing state.
- [ ] Successful export closes the dialog, downloads the file, and preserves the
      Wiggle Preview.
- [ ] Export failures remain recoverable and do not reset the source.

### Visual hierarchy

- [ ] Preview Stage remains dominant in Empty, Alignment, and Wiggle states.
- [ ] Controls change by task rather than showing unrelated groups at equal weight.
- [ ] Export options are contained in one editorial dialog, not a dashboard page.
- [ ] Loading and errors use restrained status treatment rather than full-page
      overlays or generic red alert boxes.
- [ ] No new preview mode, export format, or onboarding page is introduced.

### Locale and accessibility

- [ ] All visible copy switches between English and Simplified Chinese.
- [ ] Dialog labels, live regions, and button names switch with the locale.
- [ ] Keyboard focus remains visible through upload, Wiggle, and export flows.
- [ ] Reduced-motion behavior prevents automatic Wiggle playback and spatial
      transitions.

## 13. Implementation sequence after design approval

This document is not an instruction to code immediately. When implementation is
approved, use small presentation-only increments:

1. Verify and document the current Empty, Loading, Alignment, and Wiggle DOM
   surfaces without changing behavior.
2. Complete the Wiggle Preview presentation: stage caption, contextual Controls,
   playing/paused/reduced-motion states, and return-to-alignment affordance.
3. Reconcile the export dialog with the approved editorial surface treatment
   while preserving all existing selection, memory, progress, and cancel logic.
4. Add visual coverage for export success, recoverable failure, and unavailable
   output choices.
5. Verify both locales, keyboard focus, reduced motion, and the existing test,
   typecheck, build, and export flows.

Each increment must be checked against the same Lab shell and must not alter
Canvas rendering, image processing, or export behavior.
