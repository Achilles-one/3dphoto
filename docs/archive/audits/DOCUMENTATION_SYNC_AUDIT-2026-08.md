# 文档同步审计报告

日期：2026-08-23

## 审计范围与依据

本报告对比了 `docs/` 目录下的全部现有文档与当前工作区代码，重点检查了
Git 中已有的手动修改，以及新增的 `src/components/SiteHeader.vue`。

本报告记录了前一轮审计结果；本轮已根据确认的产品决策同步相关文档。当前工作区在
审计前已经存在代码和文档修改，以下结论基于审计时文件的实际内容，不假设所有修改
来自同一次实现。

## 分类说明

- **需要更新文档**：实现看起来是有意行为，但现有文档描述不准确或缺失。
- **仅需代码修改**：现有文档已经足够准确，或差异属于不应写入产品文档的实现细节。
- **需要设计决策**：代码和文档表达了相互冲突的产品选择，需先决定再同步文档。
- **临时实验**：代码中明确表现为临时、占位、注释掉或尚未确定的实现，不能直接视为正式约定。

## 执行摘要

当前文档已经部分同步了新的视觉结构和导出能力，包括统一站点头部、静态四步指南、
本地字体、隐藏 Split Preview 页面、GIF 导出取景、内存预算和中英文覆盖。

本轮已确认并同步以下事项：

1. 上传区域位于对齐预览舞台内部。
2. 预览控制区不提供独立导航，只显示当前模式；创建 Wiggle 和“调整对齐”负责状态转换。
3. 产品名称统一为 “Wiggle”。
4. `resetUpload()` 保持纯状态重置；`App.vue` 的 `deleteImg()` 负责完整删除和资源清理。
5. Wiggle 控件在桌面端和移动端均纵向排列。
6. `docs/design/DESIGN_CONCEPTS.md` 作为本地设计依据使用，不纳入版本控制。
7. Works、Archive、MiuMiu、Settings 继续作为非交互占位。

## 1. 当前实现相对文档的变化

| 范围 | 当前实现 | 与文档的差异 | 分类 |
|---|---|---|---|
| 站点外壳 | `App.vue` 使用新的 `SiteHeader.vue`。头部包含 Achilles Cat、Works、Archive、MiuMiu、Lab、语言切换和 Settings。Works、Archive、MiuMiu、Settings 均为非交互占位。 | 已同步到 `prd.md`、`ui.md` 和 `implementation.md`。 | 仅需代码修改 |
| 静态指南 | `App.vue` 在 Lab 介绍下方渲染四步指南条带，不再使用弹框，也没有关闭或确认交互；产品名称统一为 Wiggle。 | 已同步到 `prd.md`、`ui.md` 和 `implementation.md`。 | 仅需代码修改 |
| 上传位置 | `UploadPanel` 通过 `AlignmentPreviewPanel` 的 `stage-input` 插槽渲染，仅在 `empty`、`loading`、`error` 状态显示。上传成功后同一位置显示对齐画布。 | 已同步到 `prd.md`、`ui.md`、`implementation.md` 和 `compatibility.md`。 | 仅需代码修改 |
| 预览入口 | `ControlPanel.vue` 的两个预览 Tab 不作为可见导航；实际界面显示当前模式文本，创建 Wiggle 进入 Wiggle，调整对齐返回 Alignment。 | 已同步为动作驱动的预览状态流程。 | 仅需代码修改 |
| Split Preview | `PreviewMode` 仍保留 `split`，但没有可见页面或激活控件。 | 与 `prd.md`、`ui.md`、`implementation.md` 中“不展示 Split Preview 页面”的要求一致。 | 仅需代码修改 |
| 删除图片 | `ControlPanel.vue` 发出 `clearImgRequested`，`App.vue` 的 `deleteImg()` 使上传、创建和布局切换任务失效，释放画布，清空 `currentSourceFile`，最后调用 `resetUpload()`。`resetUpload()` 只负责状态重置。 | 已同步删除动作、职责边界和资源清理语义。 | 仅需代码修改 |
| 动图名称 | 引擎、状态名、控件、代码文案和文档统一使用 “Wiggle”。 | 已完成统一。 | 仅需代码修改 |
| GIF 导出取景 | `GifExportDialog.vue` 提供“裁切重叠区”和“完整画面”选项；`App.vue` 针对两种取景分别计算尺寸和内存计划。 | `prd.md`、`ui.md`、`implementation.md`、`compatibility.md` 已较完整地记录该行为。 | 仅需代码修改 |
| 导出取消 | `App.vue` 使用包含 id、取消标记、取消任务和过期会话检查的 `ExportSession`。取消后弹框仍可保留，第二次取消才关闭。 | 用户可见的取消流程已有文档，但会话和失效检查的架构没有记录。 | 需要更新文档 |
| 隐私与分析 | `PrivacyModal.vue` 提供匿名分析开关，选择保存在本地；`analytics.ts` 根据该选择决定是否发送事件。 | `prd.md` 提到分析需获得同意，但 UI 和隐私文档没有说明可见开关及持久化行为。 | 需要更新文档 |
| 反馈诊断 | `App.vue` 保存最后一次确认的格式、尺寸和 GIF 取景，即使导出失败或取消也用于反馈信息。 | `prd.md` 和 `compatibility.md` 已覆盖大部分要求，但 `implementation.md` 未记录状态归属和 `not-applicable` 行为。 | 需要更新文档 |
| Wiggle 控件布局 | 当前最终 CSS 将 `wiggle-control-grid` 覆盖为单列，播放、速度、交换左右眼、中间帧、调整对齐以多行呈现。 | 已同步为桌面端和移动端均纵向排列。 | 仅需代码修改 |
| 预览舞台归属 | `App.vue` 统一持有舞台外壳，并向对齐面板注入上传插槽；两个预览面板不再自己渲染舞台标题。 | 文档只要求预览区域尺寸一致，没有说明父组件持有舞台和插槽结构。 | 需要更新文档 |
| 本地字体与配色 | `base.css` 从 `public/fonts` 加载 Instrument Serif、Space Grotesk、DM Mono；舞台/Matte 颜色改为深绿黑色。 | 字体交付已有文档；最新舞台颜色和多层 CSS 覆盖没有记录。 | 仅需代码修改 |
| 设计来源 | `docs/design/DESIGN_CONCEPTS.md` 实际存在，但 `docs/design/` 不纳入 Git。 | 已同步为本地设计依据，不纳入版本控制。 | 仅需代码修改 |

## 2. 手动新增或显著暴露的能力

| 能力 | 代码证据 | 文档状态 | 分类 |
|---|---|---|---|
| 编辑型站点头部 | 新增 `SiteHeader.vue`，并在 `App.vue` 中完成组件边界拆分；未来栏目保持非交互占位。 | 已同步头部占位语义。 | 仅需代码修改 |
| 四步指南条带 | `App.vue` 提供 Upload → Align → Preview → Export 条带，统一使用 Wiggle。 | 已同步。 | 仅需代码修改 |
| 舞台内上传 | `stage-input` 插槽和 `showStageInput` 状态。 | 已同步到产品、UI、实施和兼容性文档。 | 仅需代码修改 |
| 删除/重置动作 | 删除按钮、`App.vue` 的 `deleteImg()` 和 `appState` 的 `resetUpload()`。 | 已同步完整删除流程与纯状态重置边界。 | 仅需代码修改 |
| 响应式渲染器生命周期 | 对齐和 Wiggle 面板使用 `ResizeObserver`，负责渲染器创建、尺寸更新和销毁。 | 文档描述了视觉尺寸，但没有描述组件和资源归属。 | 需要更新文档 |
| 取景感知导出计划 | `ExportFraming`、`getGifExportRenderPlan()`、两套内存计划和弹框单选项。 | 已有较完整的产品文档描述。 | 仅需代码修改 |
| 原始源图 GIF 导出 | 有原始栅格源时，`App.vue` 在 GIF 导出时重新解码原图，而不是只导出预览画布。 | 文档要求不得从低分辨率预览放大，但没有明确该源图选择路径。 | 需要更新文档 |
| 异步任务安全机制 | 上传、布局切换、创建 Wiggle、导出均使用 generation/session 防旧任务提交，并释放资源。 | 用户可见的取消和重试行为已有文档，架构实现未记录。 | 需要更新文档 |
| 匿名分析同意 | 隐私弹框开关、本地存储偏好和事件发送门控。 | 已提到“需同意”，但未记录 UI 和持久化。 | 需要更新文档 |
| 深色舞台/Matte | `MATTE_BACKGROUND` 和 `--color-stage` 从浅色改为深色。 | UI 文档只要求统一 Matte，没有规定当前颜色。 | 仅需代码修改 |
| 本地字体包 | 项目包含 Instrument Serif、Space Grotesk、DM Mono 及许可证文件。 | 已在 UI、实施和兼容性文档中记录。 | 仅需代码修改 |

## 3. 已变更组件及文档影响

| 组件/模块 | 当前职责或变化 | 文档影响 |
|---|---|---|
| `src/app/App.vue` | 负责上传、布局切换、导出异步流程、源文件引用、内存计划、反馈状态、消息、舞台组合和资源清理。 | 应更新实施架构及产品/UI 用户流程。**需要更新文档。** |
| `src/app/appState.ts` | 负责响应式应用状态、阶段转换、设置重置；`resetUpload()` 保持纯状态重置。 | 已同步删除/重置职责边界。**仅需代码修改。** |
| `src/components/SiteHeader.vue` | 新的站点头部，Lab 为当前栏目，其他栏目为未来占位。 | 只有在未来栏目属于正式站点外壳时才应写入产品规范。**临时实验。** |
| `src/components/ControlPanel.vue` | 新的对齐、播放、导出控件，包含开关样式、删除动作和被注释的模式 Tab。 | 已同步当前模式文本、删除动作和无独立导航的实际行为。**仅需代码修改。** |
| `src/components/AlignmentPreviewPanel.vue` | 管理对齐渲染器生命周期，并提供上传插槽；不再自己拥有舞台标题。 | 应更新空状态和组件边界说明。**需要更新文档。** |
| `src/components/PreviewCanvas.vue` | 管理 Wiggle 渲染器生命周期、响应式画布尺寸和预览舞台状态。 | 应补充实施架构；用户行为大体已有文档。**需要更新文档。** |
| `src/components/GifExportDialog.vue` | 管理取景选择、内存感知尺寸选项、进度、焦点和取消/确认。 | 导出行为已有覆盖；组件归属应补充到实施文档。**需要更新文档。** |
| `src/components/UploadPanel.vue` | 加载期间显示选中文件名；保留拖拽和文件选择器。 | 应更新上传状态文案和位置。**需要更新文档。** |
| `src/components/MessageCenter.vue` | 支持四类消息、计数、关闭、ARIA live region 和本地化状态标签。 | 如作为产品契约，应补充消息聚合和状态展示规则。**需要更新文档。** |
| `src/components/PrivacyModal.vue` | 展示本地处理说明，并提供分析同意开关和焦点管理。 | 应补充同意控件和持久化行为。**需要更新文档。** |
| `src/core/renderGeometry.ts` | Matte 背景改为深色；预览和导出仍共用画面顺序与对齐几何。 | 除非颜色是设计契约，否则无需更新产品文档。**仅需代码修改。** |
| `src/styles/base.css`、`src/styles/layout.css` | 大量编辑型视觉系统、舞台、弹框、消息和响应式控件覆盖规则。 | 应同步可见的布局差异；原始 CSS 层级不需要写入产品文档。**需要更新文档。** |

## 4. 新增或变化的状态

### 应用级状态

`AppPhase` 没有新增联合类型成员，当前仍为：

`empty → loading → preview → creating → exporting`，并以 `error` 表示可恢复或不可恢复的错误状态。

`PreviewMode` 中仍保留 `split`，但它不是可见页面流程，也不是本次新增的用户状态。

### 派生状态与临时状态

| 状态 | 当前行为 | 分类 |
|---|---|---|
| `showStageInput` | 仅在 `empty`、`loading`、`error` 显示上传面板；预览舞台拥有空状态入口。 | 需要更新文档 |
| `isLayoutChanging` | 重新解码和拆分 JPG/PNG 时禁用布局切换。 | 需要更新文档 |
| `ExportSession` 的 active/canceled | 防止旧导出完成、迟到下载和过期状态恢复。 | 需要更新文档 |
| `uploadGeneration` | 新上传或组件销毁时使旧上传任务失效。 | 仅需代码修改 |
| `wiggleCreationGeneration` | 防止延迟的动画帧回调恢复已经失效的创建请求。 | 仅需代码修改 |
| `layoutChangeGeneration` | 防止旧布局解析结果提交。 | 仅需代码修改 |
| `lastExportAttempt` | 保存最后一次确认的导出选择，包含失败或取消的尝试。 | 需要更新文档 |
| `lastDiagnosticCode` | 保存最近的诊断标识，用于反馈和顶部消息。 | 需要更新文档 |
| `selectedFraming` | 每次打开弹框默认为 `crop-overlap` 的 GIF 取景状态。 | 已有文档，现状仅需代码修改 |
| 消息队列状态 | `success`、`info`、`warning`、`error` 消息按类型/文本去重、计数、定时和关闭。 | 已基本有文档；实现归属仍需更新 |
| 分析同意状态 | 本地持久化的偏好控制产品事件是否发送。 | 需要更新文档 |

## 5. 已变化的用户流程

### 代码中的当前流程

1. 用户进入单一 Lab 页面，看到站点头部和静态四步指南。
2. 没有图片时，上传控件位于对齐舞台内部；同一舞台也显示加载或错误内容。
3. 有效上传进入 `loading`，在浏览器本地解码，然后进入对齐预览；成功时显示消息，MPO 额外图像显示可恢复警告。
4. JPG/PNG 可切换布局，切换期间异步重新解析并禁用按钮；MPO 显示布局图标但不能切换。
5. 用户调整水平/垂直偏移和叠加强度，点击创建 Wiggle；应用进入 `creating`，随后进入 Wiggle 并按 Reduced Motion 设置决定是否播放。
6. 当前可见控件没有预览模式 Tab。用户通过“创建 Wiggle”进入 Wiggle，通过“调整对齐”返回 Alignment。
7. 用户可以点击“删除”。`App.vue` 的 `deleteImg()` 先使上传、创建和布局切换任务失效，释放画布资源并清空源文件，最后调用纯状态重置函数 `resetUpload()`。
8. 下载弹框支持 GIF 取景和内存感知尺寸，MPO 支持 SBS PNG；导出可取消，旧任务会失效。
9. 页脚打开隐私弹框，用户可启用或关闭匿名产品事件。

### 本轮已确认并同步的流程决策

| 问题 | 后续动作 | 分类 |
|---|---|---|
| 上传位置 | 上传区域位于对齐预览舞台内部，按 `empty/loading/error` 状态显示。 | 已同步 |
| 预览导航 | 不提供独立导航，只显示当前模式；创建 Wiggle 和调整对齐负责状态转换。 | 已同步 |
| 删除契约 | `App.vue` 的 `deleteImg()` 负责完整清理，最后调用纯状态函数 `resetUpload()`。 | 已同步 |
| 产品名称 | 全部统一为 Wiggle。 | 已同步 |
| Wiggle 控件布局 | 桌面端和移动端均纵向排列。 | 已同步 |
| 头部占位 | Works、Archive、MiuMiu、Settings 保持非交互占位。 | 已同步 |
| 设计资料 | `docs/design/DESIGN_CONCEPTS.md` 仅作为本地依据，不纳入版本控制。 | 已同步 |

## 6. 架构变化

当前代码的组件结构更明确，关系如下：

```text
App.vue
├── SiteHeader
├── Lab 介绍 + 静态指南条带
├── 父组件持有的预览舞台
│   ├── AlignmentPreviewPanel
│   │   └── stage-input 插槽 → UploadPanel（仅 empty/loading/error）
│   └── PreviewCanvas
├── ControlPanel
├── MessageCenter
├── GifExportDialog（Teleport）
└── PrivacyModal（Teleport）
```

当前代码体现出的职责边界：

- `App.vue` 持有源文件引用、generation token、导出 session、内存计划、反馈诊断和资源清理。
- `useAppState()` 持有可序列化的应用状态、阶段和设置转换，但不负责释放解码资源。
- 对齐和 Wiggle 面板负责渲染器创建、ResizeObserver、渲染更新和销毁。
- `GifExportDialog` 负责格式、尺寸、取景、内存选项、焦点、进度和取消界面状态。
- `useMessageCenter()` 负责消息去重、计数、定时和关闭。
- `PrivacyModal` 与 `analytics.ts` 负责同意设置和本地分析门控。
- `base.css` 与 `layout.css` 负责视觉 token 和响应式舞台/控件覆盖；当前 CSS 存在追加的阶段性覆盖层，尚未完全收敛。

`docs/implementation.md` 应补充这些职责边界，以及异步失效、资源清理和导出取消规则；
同时应区分正式产品要求与临时视觉实验。

分类：**需要更新文档**。

## 7. 文档同步结果与剩余项

### `docs/prd.md`

本轮已更新：

- 舞台内上传及其 `empty/loading/error` 行为；
- 删除动作、资源清理和重置语义；
- 无独立预览导航的实际流程；
- 统一使用 Wiggle；
- 非交互头部占位项；
- 本地设计资料不纳入版本控制。

### `docs/ui.md`

本轮已更新：

- 上传控件在预览舞台内部的位置；
- 实际控件清单，包括删除按钮；
- 动作驱动的预览状态转换；
- 桌面端和移动端纵向 Wiggle 控件布局；
- 头部未来栏目与正式导航的区别；
- 隐私弹框中的分析同意控件；
- 统一使用 Wiggle 和本地设计资料约束。

### `docs/implementation.md`

本轮已更新：

- 舞台内上传、无独立预览导航和纵向 Wiggle 控件布局；
- `App.vue` 的 `deleteImg()` 与 `appState` 的纯状态 `resetUpload()` 职责边界；
- 删除时的任务失效、资源释放和源文件清空顺序；
- 非交互头部占位项；
- 本地设计依据及版本控制边界。

### `docs/compatibility.md`

本轮已更新 UI 回归部分：

- Wiggle 控件在桌面端和移动端均纵向排列；
- 不提供独立预览导航；
- 上传/空状态位于预览舞台内部；
- 删除后资源、源文件和相关异步任务均被清理；
- 产品名称统一为 Wiggle。

真实文件处理、内存预算、导出取景和本地处理边界目前已有较完整描述，应继续保留。

### `docs/deployment.md`

当前代码和组件变化不直接影响部署流程、Vercel 配置、生产域名或发布命令，
因此暂不需要更新。只有未来新增路由、部署产物、分析端点或导航表面影响发布流程时，
才需要修改该文档。

### 本地设计资料

`docs/design/DESIGN_CONCEPTS.md` 实际存在，作为本地设计依据使用；
`docs/design/` 继续被忽略，不纳入 Git 版本控制。

## 8. 临时实验与未决实现信号

以下内容仍属于实现清理项，不构成新的产品决策：

- `ControlPanel.vue` 中被注释掉的预览 Tab 按钮；
- 导出和隐私弹框中被注释掉的标题、编号和选项标签；
- `styles/layout.css` 中追加的多组阶段性/收敛性覆盖规则；
- `ControlPanel.vue` 中保留的注释代码；
- 本地设计资料目录不纳入 Git 的现有仓库策略。

分类：**临时实验/代码清理**，不影响当前已确认的产品行为。

## 审计结论

本轮已完成已确认决策的文档同步：预览不提供独立导航、产品名称统一为 Wiggle、
上传位于对齐预览舞台内部、Wiggle 控件纵向排列、头部栏目保持非交互占位，
以及 `deleteImg()` 与 `resetUpload()` 的职责边界和完整删除顺序。

当前不需要更新 `deployment.md`。
