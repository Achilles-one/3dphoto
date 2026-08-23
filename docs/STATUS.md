# 项目状态

更新时间：2026-08-23

## Now

- 项目处于公开 Beta，当前为单一 3D Photo Lab 工作流。
- 上传区域位于对齐预览舞台内部。
- 预览不提供独立导航；控件只显示当前模式。
- Wiggle 控件在桌面端和移动端均纵向排列。
- 删除由 `App.vue` 的 `deleteImg()` 完成完整清理，`resetUpload()` 保持纯状态重置。
- 文档体系已完成首次迁移，后续只维护活动文档和明确归档的过程记录。

## Done

- JPG、PNG 的 SBS/Top-Bottom 处理和 MPO 处理流程已接入现有 UI。
- 对齐、Wiggle、GIF 导出、MPO SBS PNG 导出和导出取消已有实现。
- 分析默认关闭，只有明确开启匿名产品事件后才允许发送。
- SBS PNG 输出顺序遵循当前 `Swap Eyes` 设置。
- `SiteHeader`、舞台内上传、静态指南和隐私设置已纳入当前页面。
- `docs/design/DESIGN_CONCEPTS.md` 已确定为 v1 已批准设计概念基线并纳入 Git。

## Next

- 完成真实 Weeview 与 FUJIFILM 样本的设备矩阵验收。
- 按 `COMPATIBILITY.md` 完成移动端下载和低内存设备签收。
- 维护已收敛的 CSS 结构；只有发生视觉基线变更时，才更新设计系统或页面规格。

## Known limitations

- 不支持普通单张 2D 照片、HEIC、WebP、视频、两张独立图片和批量处理。
- 自动布局判断可能需要用户切换布局；对齐不处理透视、旋转、镜头畸变或严重场景运动。
- MPO 兼容性、移动 Safari 下载和低内存阈值仍需真实设备确认。

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
