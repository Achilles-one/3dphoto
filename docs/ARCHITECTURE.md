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
- 自动主体对齐使用独立 generation 和可终止 Worker；新上传、删除、布局切换、手动调节、重置、创建 Wiggle 和组件卸载都必须使旧任务失效。结果提交前同时验证 generation 与 `stereoSplit` 身份，用户操作始终优先于迟到结果。`stereoSplit` 可能被 Vue 包装为响应式代理，身份校验必须同时解包当前状态和任务输入，即比较 `toRaw(state.stereoSplit)` 与 `toRaw(taskStereoSplit)`，或使用稳定任务标识；不得只解包其中一侧，也不得直接比较代理与赋值前原始对象。
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

## 8. 自动主体对齐实现约束

- `App.vue` 负责启动、取消和提交自动对齐任务；`useAppState()` 继续只通过现有 `setAlignment()` 管理序列化后的水平、垂直偏移。对齐预览组件只显示画布和瞬时状态，不拥有算法任务。
- `core/autoAlignment.ts` 负责建立有界分析输入、创建 Worker、换算坐标和释放临时资源；`workers/alignmentWorker.ts` 负责图像预处理、特征匹配、稳健估计、主体视差聚类与置信度判断。算法消息类型独立放在 `types/alignment.ts`。
- 左右眼使用同一个分析缩放比例，最长边不超过 640px；不得分别拉伸到相同尺寸。JPG/PNG 可以复用现有降采样拆分结果，完整尺寸 MPO 必须建立临时分析画布，不能替换原始 `StereoView.canvas`。
- 自动对齐使用本地、同源、懒加载的 CSP-safe OpenCV.js/WASM 提供 ORB 与 Hamming 特征匹配能力；分析在 Worker 中完成，不依赖 CDN、不上传图片，不把完整原始尺寸像素复制进 Worker。必须先完成并验证自定义 OpenCV 构建，再替换 Worker 加载器，不能先修改 Worker 后继续依赖不确定的预编译产物。
- 自定义 OpenCV.js 构建只保留当前需要的 `core`、`imgproc`、`features2d` 与对应 ORB/BFMatcher 绑定；只有后续确实引入基础矩阵或 RANSAC API 时才增加 `calib3d`。首个生产基线固定为 OpenCV `5.0.0`（源码 tag `5.0.0`）+ Emscripten/emsdk `4.0.20` + C++17，构建环境固定使用官方 `emscripten/emsdk:4.0.20` 镜像；首次成功构建时把镜像 digest 写入构建清单。构建必须启用 `DYNAMIC_EXECUTION=0` 与 `EMBIND_AOT=1`，采用模块化 ES Module Worker 输出，并生成独立 `.wasm` 资源。不得使用浮动 `latest`、自动升级版本或在构建失败时静默换用其他组合；确需升级时必须单独修改版本、重新执行严格 CSP 与算法回归并更新文档。
- 自定义构建采用“可复现配方和已生成产物都入库”的方式：Docker 构建定义与命令放在 `scripts/opencv/`，运行时产物固定放在 `src/vendor/opencv/5.0.0/`，至少包含 `opencv.mjs`、`opencv.wasm`、OpenCV 许可证/第三方声明、记录源码 tag、工具链、镜像 tag/digest、模块和完整编译参数的构建清单，以及产物 SHA-256。常规 `npm`、Vite、CI 和 Vercel 构建只消费并校验这些已提交产物，不下载源码、不安装 emsdk，也不现场编译 OpenCV；版本升级通过显式重新生成和审查产物完成。
- 自定义产物接入后，`workers/alignmentWorker.ts` 只调整 OpenCV 模块工厂、`.wasm` URL 定位和初始化错误分类；现有灰度、ORB、BFMatcher、匹配过滤与主体偏移估计流程保持不变。Vite 必须把 `.wasm` 作为带内容哈希的本地资源发布，服务端返回 `application/wasm`。构建和发布检查必须校验构建清单、SHA-256、Apache-2.0 许可证与第三方声明、缓存策略和最终资源引用。
- 匹配流程为灰度预处理、ORB、双向 KNN 匹配、比值过滤和交叉验证。全局垂直偏移通过稳健一致集合估计；水平偏移从空间集中且视差一致的主要主体候选中取稳健中位数。不得用全图 Homography、全图 ECC 或单一全图平均视差替代这一语义。
- 可在主体局部区域使用仅平移的 ZNCC 或 ECC 精调，但精调只能接受相关性提高且仍满足合法范围的结果，不能改变第一版仅支持 X/Y 平移的产品边界。
- 分析坐标通过共同缩放比例换算回当前 `stereoSplit` 像素，取整后调用 `setAlignment()`；不得生成“已对齐图片”、修改 `StereoSplitResult` 或另建导出参数。现有导出源继续负责把预览偏移映射到原始尺寸。
- 自动对齐失败是可恢复结果，不进入页面级错误状态，不释放当前图片，也不改变当前偏移。失败原因至少区分特征不足、匹配不足、垂直不一致、主体歧义、偏移越界、结果校验失败、运行失败和 `timeout`。
- `core/autoAlignment.ts` 必须在任务启动时建立 30 秒超时；超时后终止 Worker、以 `timeout` 结果结算任务并使界面退出运行状态。成功消息、Worker 错误、主动取消和超时路径都必须经过同一个幂等收尾函数，清除超时计时器、解除 Worker 事件处理器并按需终止 Worker，确保 Promise 只结算一次且不遗留计时器、闭包或 Worker 引用。
- OpenCV.js 在自动对齐 Worker 内实例化 WebAssembly，CSP-safe 构建接入后的生产自动对齐 Worker 响应 CSP 必须包含范围受限的 `'wasm-unsafe-eval'`，不得包含 `'unsafe-eval'`；首页和其他不实例化 Wasm 的脚本继续使用 `script-src 'self'`。构建产物和严格 CSP 下的运行测试必须共同证明没有执行 `eval()` 或 `new Function()`；仅设置编译参数或静态搜索字符串不能单独作为通过依据。主线程请求与 Worker 校验共享显式运行时协议版本；OpenCV 构建、Wasm 或 CSP 运行边界发生变化时必须更新该版本，使版本值进入 Worker 构建内容并触发新的 Vite 内容哈希，避免旧的 immutable Worker 响应继续携带过期安全头。
- 主动取消必须同时清除计时器并让等待中的任务结束；调用方仍通过 generation 忽略取消后的结果。任何保护条件拒绝提交结果时，也必须清理仍属于该任务的活动引用和运行状态，不能让界面永久停留在 `running`。
