# ADR 0001：MP4 本地封装使用 Mediabunny

- 状态：已接受
- 日期：2026-09-01

## 背景

MP4 导出必须继续在浏览器本地完成。WebCodecs `VideoEncoder` 可以生成 H.264 编码数据，但不负责生成可下载的 MP4 容器。

## 决策

使用 `mediabunny` 连接 WebCodecs H.264 编码与 MP4 封装。导出采用 `CanvasSource` 逐帧提交画面，使用内存目标生成最终 Blob，不引入 FFmpeg/WASM。

## 替代方案

- `mp4-muxer`：已弃用并由 Mediabunny 取代，不采用。
- FFmpeg/WASM：包体、启动、内存和编码成本过高，不符合当前轻量浏览器架构。
- 自行实现 MP4 容器：维护和兼容风险高，不采用。

## 影响与回滚

- 新增一个运行时依赖，并增加独立 MP4 导出 Worker。
- 编码支持仍由运行时 WebCodecs H.264 能力决定；不支持时保留 GIF 导出。
- 如需回滚，移除 MP4 UI、Worker、导出核心及该依赖，现有 GIF/SBS 导出链路不受影响。
