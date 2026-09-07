# 架构与边界

## 1. 当前结构

```text
App.vue
├─ SiteHeader
├─ Lab 介绍与静态指南
├─ 预览舞台
│  ├─ AlignmentPreviewPanel
│  │  └─ stage-input → UploadPanel
│  └─ PreviewCanvas
├─ ControlPanel
├─ MessageCenter
├─ GifExportDialog
└─ PrivacyModal
```

## 2. 状态所有权

- `useAppState()` 只管理可序列化的应用状态、阶段和设置转换。
- `App.vue` 持有当前源文件、异步 generation、导出 session、反馈诊断和跨组件流程协调。
- `AlignmentPreviewPanel` 和 `PreviewCanvas` 管理各自渲染器、尺寸观察和画布销毁。
- `ControlPanel` 只发出用户动作，不拥有全局资源或业务流程状态。
- `useMessageCenter()` 管理消息去重、计数、定时和关闭。
- `GifExportDialog` 管理导出选择、进度、焦点和取消界面，不直接拥有源图资源。

## 3. 资源生命周期

- 解码图像、`processedImage` 和 `stereoSplit` 的画布资源由页面流程统一协调释放。
- `deleteImg()` 先使上传、创建和布局切换任务失效，再释放 `processedImage`、`stereoSplit`，清空 `currentSourceFile`，最后调用 `resetUpload()`。
- `resetUpload()` 是纯状态重置函数，不负责释放画布、取消异步任务或清空页面资源引用。
- 组件卸载和替换输入时，必须同时处理渲染器、观察器、计时器和旧任务结果。

## 4. 异步任务边界

- 上传、布局切换和 Wiggle 创建使用 generation 使过期结果不能提交。
- 导出使用带有取消标记和 session 校验的会话，旧导出不能恢复已改变的页面状态或触发迟到下载。
- 任何异步回调提交前都必须验证任务仍然有效，并在失败、取消和替换输入时释放临时资源。

## 5. 禁止事项

除非先建立 ADR，明确原因、替代方案、影响范围和回滚方式，否则禁止：

- 创建重复 store；
- 为单个页面新增另一套页面级状态管理；
- 未确认调用方和影响范围就修改 core；
- 绕过现有 composable，复制状态、计时器、焦点或消息逻辑；
- 新增依赖替代项目已有能力；
- 在页面组件中重复实现已有的解析、导出、资源清理或错误映射；
- 让 UI 组件承担不属于它的全局资源或业务状态所有权。

## 6. 变更检查

涉及状态、资源、异步任务或 core 的变更，至少检查：调用方、失效路径、取消路径、失败路径、组件卸载和重复触发。

## 7. MP4 导出实现约束

- MP4 导出继续遵守浏览器本地处理边界，不上传图片、像素或编码结果。
- 视频编码使用 WebCodecs `VideoEncoder` 和 H.264，码率控制使用 VBR 高质量配置，不把实现描述为精确的 FFmpeg/libx264 CRF 值。
- MP4 提供最长边 1080、1440 两档，保持源图宽高比且不放大源图；最终编码宽、高均向下调整为偶数，以适配 YUV 4:2:0。
- MP4 固定使用 25fps，并复用当前左右眼顺序、Alignment、Swap Eyes、中间帧序列和导出取景结果。每个视频帧为 40ms；源帧间隔不能被 40ms 整除时，使用累计时间误差分配视频帧，保持完整序列的平均速度，不对每个源帧独立四舍五入。
- MP4 目标码率按 `width × height × 25 × 0.6` bit/s 计算；1080 档钳制到 8–20 Mbps，1440 档钳制到 16–50 Mbps，并使用 `bitrateMode: "variable"` 与 `latencyMode: "quality"`。档位上限只作为复杂画面的绝对目标上限，不把所有输出固定编码到最高码率。
- 完整循环时长不超过 4 秒时，循环次数为 `max(1, ceil(2 秒 / 单循环时长))`；单循环超过 4 秒时循环次数固定为 1。编码后的 25fps 时长允许存在不超过一个视频帧的量化差异。
- 配置导出选项时通过 Mediabunny 的 `canEncodeVideo()` 调用 WebCodecs 能力检测，分别验证当前实际尺寸的 1080、1440 H.264 配置；不支持的档位由 UI 禁用，不自动回退到其他视频编码格式。
- WebCodecs 负责编码 H.264 数据，Mediabunny 在独立 MP4 Worker 中完成容器封装并生成内存 Blob；不引入 FFmpeg/WASM。依赖决策见 `adr/0001-mediabunny-mp4-export.md`。
- MP4 帧必须逐帧生成、提交编码并及时关闭，不能缓存 2–4 秒的全部 RGBA 视频帧。
- MP4 导出必须复用现有导出 session、进度、取消和迟到结果失效边界，不得在 UI 组件中另建导出流程。
