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
