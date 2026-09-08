# 项目状态

更新时间：2026-09-08

## Now

- 项目处于公开 Beta，当前为单一 3D Photo Lab 工作流。
- 上传区域位于对齐预览舞台内部。
- 预览不提供独立导航；控件只显示当前模式。
- Wiggle 控件在桌面端和移动端均纵向排列。
- 删除由 `App.vue` 的 `deleteImg()` 完成完整清理，`resetUpload()` 保持纯状态重置。
- 文档体系已完成首次迁移，后续只维护活动文档和明确归档的过程记录。

## Done

- JPG、PNG 的 SBS/Top-Bottom 处理和 MPO 处理流程已接入现有 UI。
- 对齐、Wiggle、GIF 导出、H.264 MP4 导出、MPO SBS PNG 导出和导出取消已有实现。
- MP4 导出支持 1080/1440 最长边、不放大原图、偶数尺寸、25 fps VBR 编码，并按用户速度重复帧和分配累计误差。
- MP4 通过 WebCodecs 与 Mediabunny 在独立 Worker 中本地编码封装，不支持的尺寸档位会在下载弹框中禁用。
- MP4 发布门禁采用 Windows Edge 真实编码、Mediabunny 成品解析和 CI 专用 `ffprobe` 校验，并覆盖 1080/1440、能力降级、取消和迟到结果。
- 分析默认关闭，只有明确开启匿名产品事件后才允许发送。
- SBS PNG 输出顺序遵循当前 `Swap Eyes` 设置。
- `SiteHeader`、舞台内上传、静态指南和隐私设置已纳入当前页面。
- `docs/design/DESIGN_CONCEPTS.md` 已确定为 v1 已批准设计概念基线并纳入 Git。
- 浏览器本地自动主体对齐已实现：有界分析图、Worker 内 ORB 双向匹配、全局垂直稳健估计、主体视差聚类、置信度安全失败和手动操作优先；有效结果使用原始 `stereoSplit` 身份提交，任务在 30 秒超时，并统一清理计时器、事件处理器和 Worker。

## Next

- 完成真实 Weeview 与 FUJIFILM 样本的设备矩阵验收。
- 按 `COMPATIBILITY.md` 完成移动端下载和低内存设备签收。
- 维护已收敛的 CSS 结构；只有发生视觉基线变更时，才更新设计系统或页面规格。

## Known limitations

- 不支持普通单张 2D 照片、HEIC、WebP、视频输入、两张独立图片和批量处理。
- 自动布局判断可能需要用户切换布局；自动主体对齐不处理透视、旋转、缩放、镜头畸变或严重场景运动，低置信度时保留手动流程。
- MPO 兼容性、移动 Safari 下载和低内存阈值仍需真实设备确认。
- MP4 导出依赖浏览器的 WebCodecs H.264 编码能力，不支持时会在导出面板中禁用。

## Verification

- 功能与真实文件验收：见 `COMPATIBILITY.md`。
- 通用质量门禁：见 `QUALITY.md`。
- 发布与部署：见 `DEPLOYMENT.md` 和 `RELEASES.md`。

## Documentation map

- 产品范围：`PRD.md`
- 全局交互：`UI.md`
- 页面规格：`pages/`
- 架构边界：`ARCHITECTURE.md`
- 设计语言：`design/DESIGN_SYSTEM.md`
- 设计概念基线：`design/DESIGN_CONCEPTS.md`
