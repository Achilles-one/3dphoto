# Git 与 Vercel 发布流程

## 1. 当前生产事实

- Git 仓库：`https://github.com/Achilles-one/3dphoto.git`。
- Vercel 已连接该 Git 仓库。
- 生产域名：`https://www.achillescat.com`。
- 当前生产分支为 `main`；推送或合并到 Vercel 配置的生产分支会触发 Production Deployment，成功后生产域名立即指向新部署。
- 本文只描述目标流程；修改 Vercel 或 GitHub 设置需要单独执行和确认。

## 2. 推荐分支模型

当前阶段不建议增加长期 `release` 分支。推荐：

- `main`：唯一生产分支，只接收通过 PR 的变更。
- `feature/*` 或 `fix/*`：日常开发分支，推送后由 Vercel 自动生成 Preview Deployment。
- 紧急修复同样走 `fix/* → Preview → PR → main`，不直接推送 `main`。

原因：Vercel 已为非生产分支和 PR 提供独立 Preview URL；再维护长期 `release` 分支会增加分支漂移、回合并和版本判断成本，但不会自动提供更强的质量门禁。

只有出现以下需求时再引入 `release`/`production` 分支或手动 Promote：

- 必须按固定窗口批量发布。
- `main` 需要长期承载尚未上线的完整功能。
- 需要独立、长期存在的 staging 域名和环境变量。
- 需要产品负责人手动批准生产域名切换。

## 3. 必须改进的门禁

已确认：在 GitHub 为 `main` 配置规则：

1. 禁止直接 push 和 force push。
2. 必须通过 Pull Request 合并。
3. 必须通过 `CI / release-check` 与 `CI / mp4-browser-gate`。
4. 分支落后时要求更新后重跑检查。
5. 合并前必须打开 Vercel Preview，完成 UI、移动端和真实文件验收。
6. 统一使用 Squash merge，确保每个 PR 对应一个可定位的生产提交。

若当前为单人维护，可不强制他人审批，但仍保留 PR、CI 和 Preview 验收；不要为了形式要求无法满足的双人审批。

“Vercel Preview 验收”分成两层：

- 自动门禁：Vercel Preview Deployment 必须构建成功，GitHub 中对应的 Vercel deployment/check 必须成功。
- 人工验收：在 PR 中勾选与本次变更相关的 PC、移动端、Weeview、FUJIFILM MPO 和下载结果。GitHub 仅靠分支规则无法判断人工是否真的打开过 Preview，因此使用轻量 PR 模板保存验收记录；未来有 E2E 后再把关键流程变成 required check。

当前由项目负责人和 Codex 单人协作开发，不设置“至少一名其他成员批准”等无法满足的规则。PR 模板不是审批机制，也不会增加第二位开发者；它只是在新建 PR 时自动填入变更说明、Preview URL、检查结果和验收勾选项，避免直接合并后才发现漏测。模板保持简短，不要求每次勾选与本次变更无关的完整矩阵。

已确认统一使用 Squash merge；关闭普通 Merge commit 和 Rebase merge。每个 PR 在 `main` 中形成一个可定位、可回滚的提交，并与一次 Vercel Production Deployment 对应。

已确认允许仓库管理员绕过 `main` 规则，但仅用于 CI/Vercel 门禁自身故障或需要立即恢复生产的紧急情况。正常功能、样式和文档改动不得使用绕过。绕过后必须补建 PR 或记录原因，并让 Git 历史、线上部署和后续修复重新一致。

建议的最小 PR 模板：

```markdown
## 变更

-

## 检查

- [ ] CI / release-check 通过
- [ ] CI / mp4-browser-gate 通过
- [ ] Vercel Preview 构建成功
- [ ] 已打开 Preview 检查本次改动
- [ ] 涉及 UI：检查 PC 和移动端
- [ ] 涉及输入/导出：检查 Weeview SBS 和 FUJIFILM MPO

Preview URL：
```

模板未来放在 `.github/pull_request_template.md`。这是推荐的低成本流程记录，不作为本轮文档修改之外的立即操作。

## 4. 标准发布流程

1. 从最新 `main` 创建功能分支。
2. 按 `DEVELOPMENT.md` 完成一个可验收变更，并按 `QUALITY.md` 执行相应检查。
3. 推送功能分支，等待 GitHub CI 和 Vercel Preview。
4. 在 Preview 验收 PC 和移动端；涉及输入或导出时，在本地使用不进入 Git 的 Weeview 32.51MP SBS 与 FUJIFILM MPO 验收。
5. 创建/更新 PR，记录 Preview URL、非敏感样本编号、已测结果和已知限制；真实样本不上传 Git、CI Artifact 或 Vercel。
6. CI 与 Preview 验收通过后使用 Squash merge 合并到 `main`。
7. Vercel 自动创建 Production Deployment，并将 `www.achillescat.com` 指向成功部署。
8. 对生产域名执行 smoke test。

## 5. Preview 与访问保护

- 非生产分支默认作为 Vercel Preview，不影响生产域名。
- 当前不启用 Standard Deployment Protection。即使 Vercel 官方文档说明部分基于 Vercel Authentication 的 Standard Protection 可用于所有计划，实际项目后台显示的可用范围、团队方案或所选保护方式可能要求付费；在没有明确需要前不升级、不启用。
- 自动化访问受保护 Preview 时，使用 Vercel 提供的 Automation Bypass，不把绕过密钥写入仓库。
- Preview 不得引用不应公开的真实照片；本项目的图像处理仍应保持本地进行。

不开保护的影响：任何获得 Preview URL 的人都可能访问预发布页面。因此 Preview 中不得内置私人图片、密钥、未授权素材或敏感诊断数据。若未来出现这些内容，再重新评估免费可用的 Vercel Authentication、Shareable Link 或付费保护方案。

## 6. 构建与上线检查

本地/CI 最低命令：

```bash
npm ci
npm run release:check
```

`release:check` 除单元测试、类型检查、构建和 Worker 产物检查外，还必须运行 Playwright MP4 门禁。真实 H.264 编码放在 Windows Edge CI 任务中；若运行环境不支持编码则任务失败，不得跳过。CI 可安装 `ffprobe` 验证视频流，但该工具不得进入网站依赖或构建产物。

Vercel 项目建议配置：

- Framework Preset：Vite。
- Build Command：`npm run build`。
- Output Directory：`dist`。
- Node.js：满足 `package.json` 的 `>=22.12.0`。
- Production Branch：`main`。

仓库已使用根目录 `vercel.json` 声明 Vercel 的构建、缓存和基础安全响应头；Cloudflare/Sites 遗留的 `_headers`、`wrangler.toml`、Sites Worker 与项目元数据均已移除。

自动主体对齐在 Worker 内使用 OpenCV.js WebAssembly。首个生产基线固定为 OpenCV `5.0.0` + Emscripten/emsdk `4.0.20` + C++17，并以官方 `emscripten/emsdk:4.0.20` 镜像生成启用 `DYNAMIC_EXECUTION=0`、`EMBIND_AOT=1` 的 CSP-safe OpenCV.js/WASM。构建配方存放在 `scripts/opencv/`，已生成的模块、独立 Wasm、许可证、构建清单和 SHA-256 存放在 `src/vendor/opencv/5.0.0/` 并提交 Git；常规 CI/Vercel 不现场编译 OpenCV，只校验和消费仓库产物。必须先单独验证该产物的 ORB/BFMatcher API，再修改 Worker 加载模块工厂与本地 `.wasm` URL；迁移完成前不得把预编译包的 `runtime-failure` 误判为“未识别主体”。迁移后的首页和普通脚本继续使用 `script-src 'self'`，只有自动对齐 Worker 响应 CSP 增加 `'wasm-unsafe-eval'`，所有响应均不得包含 `'unsafe-eval'`；`.wasm` 必须返回 `application/wasm`。Vercel 中 Worker 专用响应头规则必须比通用规则更具体并在部署后核对实际响应。主线程请求与自动对齐 Worker 共享显式运行时协议版本；OpenCV/CSP/Wasm 边界变更时更新该版本，使 Worker 内容哈希随之变化并绕过旧响应。

发布顺序固定为：用冻结工具链生成 CSP-safe OpenCV 产物并记录镜像 digest、构建清单和 SHA-256 → 单独验证所需 API → 接入 Worker 模块工厂和 `.wasm` 定位 → 更新运行时协议版本 → 执行分类自动对齐测试 → 检查构建产物和 CSP → 部署 Preview。Preview 和 Production 都必须使用已知成功样本确认自动结果实际写入 `alignmentX/Y`，不能只检查状态文本结束；低纹理或无明确主体样本则确认返回允许的业务安全失败并保留手动流程。

2026-08-13 实测：

- `https://www.achillescat.com` 返回 `200 OK`，服务端为 Vercel。
- `https://achillescat.com` 返回 `308 Permanent Redirect`，正确跳转到 `https://www.achillescat.com/`。
- 已有 `Strict-Transport-Security: max-age=63072000`。
- 首页缓存为 `Cache-Control: public, max-age=0, must-revalidate`。
- 未发现 CSP、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`。

检查命令：

```bash
curl -I https://www.achillescat.com
curl -I -L https://achillescat.com
```

Windows PowerShell 可直接使用：

```powershell
curl.exe -I https://www.achillescat.com
curl.exe -I -L https://achillescat.com
```

浏览器也可在开发者工具的 Network 中选中首页请求，在 Response Headers 查看。应同时抽查首页、`/assets/` 下的哈希资源、GIF Worker 和 MP4 Worker，因为不同路径可能使用不同缓存策略。

`vercel.json` 不负责触发部署，也不取代当前“push Git → Vercel 自动部署”。它是随代码版本管理的 Vercel平台配置，可声明响应头、重定向、重写、构建命令和输出目录。本项目增加它的主要价值是：

- 为所有部署稳定添加安全响应头。
- 明确 HTML 与哈希静态资源的缓存策略。
- 让 Preview 和 Production 使用相同、可审查、可回滚的配置。
- 避免只在 Vercel Dashboard 手工设置而无法从 Git 判断某次部署用了什么规则。

本项目使用 `vercel.json` 为 Preview 与 Production 统一声明基础安全响应头和缓存策略；部署后仍须以实际响应头为准执行 smoke。

生产 Smoke：

```bash
npm run smoke:deployment -- https://www.achillescat.com
```

自动部署 smoke 只执行一次较轻的 1080 MP4 导出；1440 真实编码留在 `release:check`，避免每次生产 smoke 重复高负载测试。

还需人工确认：

- 首页和静态资源成功加载。
- 页面没有生产控制台错误；自动对齐 Worker 能在不开放 `'unsafe-eval'` 的生产 CSP 下完成初始化和一次已知成功对齐，不出现 `WebAssembly.instantiate()`、`eval()` 或 `new Function()` CSP 错误。
- 移动端无横向滚动。
- GIF Worker 能完成最小导出；MP4 Worker 资源可加载且响应头正确。
- 在支持 WebCodecs H.264 的浏览器中完成一次 MP4 下载，并确认视频无音频、25fps、尺寸为偶数；不支持时确认 MP4 明确禁用且 GIF 可用。
- Weeview JPG 和 FUJIFILM MPO 核心路径可用。

## 7. 回滚

- 生产异常时优先在 Vercel 将 `www.achillescat.com` 回滚/重新指向上一成功部署，快速恢复访问。
- 随后在 Git 中 revert 有问题的提交，通过 CI 和 Preview 后合并 `main`，使代码历史与线上状态重新一致。
- 不使用强制推送或重写 `main` 历史处理线上事故。

## 8. 待项目负责人确认

- 已确认将 `main` 设置为禁止直接推送，只允许 PR + CI + Vercel Preview 验收后发布；尚需在 GitHub 仓库设置中实际启用规则。
- 已确认暂不启用 Standard Deployment Protection。
- 默认维持 Vercel 自动将成功的 `main` 部署绑定生产域名，暂不改为人工 Promote；如需变更仍需项目负责人确认。
- 稳定项目文档和 `docs/design/` 中的设计基线纳入 Git；仅 `design/exploration/`、`design/drafts/` 和 `design/generations/` 等生成素材目录忽略。
- 已完成：已增加并通过本地验证的最小 `vercel.json`，并清理 `_headers`、`wrangler.toml`、Sites Worker 与项目元数据。Vercel Preview 与 Production 的实际响应头仍需在部署后 smoke 确认。
- 已确认使用轻量 PR 模板记录 Preview 验收，不设置他人审批要求。
- 已确认统一使用 Squash merge，并保留管理员紧急绕过能力。
- 已确认真实 Weeview 与 FUJIFILM 样本不进入 Git、Vercel 或 CI Artifact；OG 只提交优化后的最终分享图，不提交超大源图。

## 9. 官方机制依据

- Vercel Git 部署与 Production/Preview 分支：<https://vercel.com/docs/git>
- Vercel 环境与 Preview/Production：<https://vercel.com/docs/deployments/environments>
- Vercel Deployment Protection：<https://vercel.com/docs/deployment-protection>
- Vercel 自定义域名随生产部署更新：<https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting>
- Vercel `vercel.json` 与自定义响应头：<https://vercel.com/docs/project-configuration/vercel-json>
