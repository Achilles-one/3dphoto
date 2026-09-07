# 设计到代码映射

本文件是 AI 持续开发时的短桥梁，不替代 `UI.md`、页面规格或设计系统。

| 设计概念 | 代码入口 | 状态/交互 | 验收来源 |
|---|---|---|---|
| Achilles Cat 全局外壳 | `App.vue`、`SiteHeader.vue`、`src/styles/layout.css` | Lab 当前可用；Works、Archive、MiuMiu、Settings 为占位 | `design/DESIGN_CONCEPTS.md`、`pages/HOME.md` |
| 舞台内上传 | `AlignmentPreviewPanel.vue`、`UploadPanel.vue` | `empty/loading/error` 显示 `stage-input` | `UI.md`、`pages/LAB.md` |
| 对齐预览 | `AlignmentPreviewPanel.vue`、`PreviewCanvas.vue` | 当前模式、布局切换、对齐参数 | `PRD.md`、`pages/LAB.md` |
| Wiggle 预览 | `PreviewCanvas.vue`、`ControlPanel.vue` | 创建后进入；控件纵向排列；调整对齐返回 | `UI.md`、`design/DESIGN_CONCEPTS.md` |
| 删除流程 | `App.vue`、`appState.ts`、`resourceCleanup.ts` | `deleteImg()` 完整清理；`resetUpload()` 纯状态重置 | `ARCHITECTURE.md`、`PRD.md` |
| 导出弹框 | `GifExportDialog.vue`、`exportEngine.ts`、`mp4Encoding.ts`、`mp4Policy.ts`、`exportFraming.ts`、`gifWorker.ts`、`mp4Worker.ts` | GIF/MP4 取景与尺寸、MP4 能力检测、进度、取消、失败恢复 | `PRD.md`、`QUALITY.md` |
| 视觉语言 | `src/styles/base.css`、`src/styles/layout.css`、`public/fonts` | token、字体、舞台、响应式布局 | `design/DESIGN_SYSTEM.md` |

新增页面或组件时，只添加稳定的代码入口和验收来源；过程截图、探索稿和生成素材放入 `archive/` 或 `design/generations/`。
