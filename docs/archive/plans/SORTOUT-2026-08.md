# 开发文档体系整理方案与迁移记录

日期：2026-08-23

## 1. 整理目标

当前项目的文档同时记录了产品要求、页面设计、代码实现、发布流程、视觉探索和阶段审计。
问题不是文档数量本身，而是长期规范与过程记录没有分层：

- 新开发者不知道从哪里开始读；
- `README.md`、实施计划和设计实施计划存在职责重叠；
- 半年前的路线图、审计结论容易被误读为当前要求；
- 项目做完一个页面后，没有单独位置记录“现在做到哪里”；
- AI 开发需要的“设计语言 → 代码结构”桥梁如果被归档，后续页面会重新猜测组件和样式边界。

目标是建立一个扁平、可恢复、适合 AI 协作的长期系统：

1. 根目录入口只负责快速上手和导航；
2. `docs/DEVELOPMENT.md` 只负责怎样开发，不变成几十页的技术百科；
3. 项目状态、产品契约、页面规范、代码映射、质量和发布各有唯一来源；
4. 过程记录可以保留，但必须明显归档，不进入默认阅读路径；
5. 新项目和新页面都使用最小文档集，按需增加，不复制整套历史资料。

## 2. README 与 DEVELOPMENT 的边界

两者可以同时存在，但只保留一个入口。

### `README.md`：从哪里开始读

根目录 README 只回答：

- 这是一个什么项目；
- 如何安装、启动、测试和构建；
- 当前主要功能和限制是什么；
- 文档在哪里，以及应该按什么顺序阅读；
- 如何找到 `STATUS.md`、发布记录和页面规格。

README 应该是新开发者的 5 分钟入口，建议控制在 200 行以内。

README 不写完整开发规范，也不重复产品需求、Git 细节、Vue 规范或测试工具说明。

### `docs/DEVELOPMENT.md`：如何开发

这是长期可复用的 AI 开发系统，建议控制在 500 行以内，目标更接近 150–300 行。
只保留四部分：

1. **开发循环**：确认范围 → 读取事实来源 → 最小实现 → 查看首个真实错误 → 修复 → 验证 → 更新文档；
2. **AI 协作流程**：如何声明假设、控制任务范围、保持工作区边界、报告阻塞和交付结果；
3. **Definition of Done**：代码、测试、状态、错误路径、文档和交付说明的最低完成条件；
4. **文档更新规则**：哪些变化更新 PRD、页面规格、架构、状态、质量或发布记录，哪些只保留在任务/PR 中。

`DEVELOPMENT.md` 不写：

- Vue 或 TypeScript 编码规范；
- Git 分支、PR、Vercel 的详细流程；
- 测试工具的完整使用说明；
- 当前项目的组件清单、真实样本文件名或某次页面重构步骤；
- 某次审计、路线图和临时实验。

这些内容交给具体项目文档、README、质量文档、部署文档或归档记录。

### 是否需要 `docs/README.md`

当前不建议新增 `docs/README.md`，避免与根目录 README 重叠。

当 `docs/` 超过约 10 个活动文档，或包含多个产品/子项目时，再增加一个纯索引文件。
它只列目录和阅读顺序，不复制 README 或 DEVELOPMENT 的规则。

## 3. 哪些文件放在 docs，哪些不放

不是所有开发相关文件都应该移动到 `docs/`。

### 应保持在根目录

| 文件 | 是否移动 | 原因 |
|---|---|---|
| `README.md` | 不移动 | 根目录是 GitHub、IDE 和新开发者的默认入口；它负责项目简介、快速启动和文档导航。 |
| `AGENTS.md`（已由当前 `Agents.md` 改名） | 不移动 | 这是 Codex/Agent 的仓库级行为指令，不是普通项目说明。工具可能按根目录约定发现它，移动到 `docs/` 可能改变协作行为。保持根目录唯一、精简、可执行；不同时保留两个大小写版本。 |
| `.env.example`、`package.json`、`vercel.json` | 不移动 | 属于工具和构建约定，不是阅读型开发文档。 |

### 建议统一放入 docs

| 当前文件 | 目标位置 | 处理建议 |
|---|---|---|
| `RELEASES.md` | 根目录保留短入口；完整内容放入 `docs/RELEASES.md` | 根目录文件继续方便 GitHub 和发布工具发现，但不再承载完整发布历史。README 和根目录入口都指向 `docs/RELEASES.md`。 |
| `docs/PRD.md` | 已完成 | 活动产品契约；只写稳定的范围、流程、业务规则和隐私承诺。 |
| `docs/UI.md` | 已完成 | 全局 UI/交互规则；具体页面规则放入 `docs/pages/`。 |
| `docs/COMPATIBILITY.md` | 已完成 | 当前项目质量/兼容性矩阵，不放入通用开发流程。 |
| `docs/DEPLOYMENT.md` | 已完成 | 当前项目发布手册；带日期的生产事实和 smoke 结果进入 `RELEASES.md`。 |

本次已统一使用大写活动文档名，重点仍是职责稳定、入口唯一。

## 4. 推荐的扁平 docs 结构

不再默认使用较重的 `handbook/` 层级。当前项目更适合以下结构：

```text
README.md                         # 根目录入口：从哪里开始读
AGENTS.md                         # AI/Agent 协作指令，保持根目录
RELEASES.md                       # 根目录短入口，指向 docs/RELEASES.md

docs/
├─ DEVELOPMENT.md                 # 通用开发系统，≤500 行
├─ STATUS.md                      # 当前项目状态，短、可快速更新
├─ PRD.md                         # 产品契约
├─ UI.md                          # 页面交互规则
├─ ARCHITECTURE.md                # 当前代码架构和边界
├─ UI_IMPLEMENTATION_MAPPING.md   # 设计语言到代码结构的桥梁，精简版保留
├─ COMPATIBILITY.md               # 项目质量和兼容性矩阵，按需存在
├─ DEPLOYMENT.md                  # 项目部署和回滚手册，按需存在
├─ RELEASES.md                    # 发布历史和回滚索引
├─ pages/                         # 页面级规格
│  ├─ HOME.md
│  ├─ LAB.md
│  └─ <NEW_PAGE>.md
├─ design/                        # 稳定视觉规则和批准的视觉资料，纳入 Git
│  ├─ DESIGN_SYSTEM.md            # 视觉语言：visual
│  ├─ BRAND.md                    # 品牌规则
│  ├─ references.md               # 参考来源
│  ├─ DESIGN_CONCEPTS.md          # v1 已批准设计概念基线：rationale + composition reference
│  ├─ approved-mockups/           # 后续批准并整理后的 mockup，纳入 Git
│  ├─ exploration/                # AI/设计探索素材，不纳入 Git
│  ├─ drafts/                     # 草稿，不纳入 Git
│  └─ generations/                # AI 生成过程素材，不纳入 Git
└─ archive/                       # 过程记录，不作为默认入口
   ├─ audits/
   ├─ plans/
   ├─ roadmaps/
   └─ visual-reviews/
```

### `handbook` 层是否保留

建议取消 `handbook/` 这一层。当前只有一个项目，扁平结构更容易被 AI 和人快速扫描。

`ARCHITECTURE.md` 和 `QUALITY.md` 现在就建立在 `docs/` 根层级，分别承担代码边界和质量门禁，
不等待下一个跨页面功能。未来如果变成多产品、多仓库或共享平台，再考虑把稳定文件整体提升到 `handbook/`。

## 5. UI、视觉和架构文档的明确边界

### `docs/UI.md` = interaction

`UI.md` 只负责页面如何工作，不负责完整的视觉 token。它描述：

- 页面结构和区域职责；
- 组件如何交互；
- Button 点击行为；
- Modal 打开、关闭、焦点和 Escape 行为；
- Loading、Error、Empty、Success、Cancel、Delete 等状态；
- 表单、控件、导航和异步反馈行为；
- 键盘、读屏、ARIA、触控和响应式行为；
- 中英文文案在交互中的使用规则。

`UI.md` 可以引用 `docs/design/DESIGN_SYSTEM.md` 的 token，但不复制色值、字体表或完整 CSS。

### `docs/design/DESIGN_SYSTEM.md` = visual

`DESIGN_SYSTEM.md` 只负责视觉语言和视觉 token，包括：

- 色彩；
- 字体和排版层级；
- spacing、grid 和尺寸 token；
- radius、border、shadow 和 surface；
- motion、transition 和 reduced-motion 视觉规则；
- Button、Modal、Input、Message 等组件的视觉变体；
- approved mockup 的视觉验收原则。

`DESIGN_SYSTEM.md` 不定义 Button 点击后做什么、Modal 何时关闭或 Loading 如何改变业务状态；这些属于 `UI.md`。

### `docs/ARCHITECTURE.md` = code ownership

`ARCHITECTURE.md` 负责代码结构、模块边界、状态所有权、资源生命周期、异步任务和依赖方向。
除非有明确 ADR 或项目负责人确认，以下事项属于禁止事项：

- 禁止创建重复 store；
- 禁止为单个页面新增另一套页面级状态管理；
- 修改 `core` 前必须确认影响范围和现有调用方；
- 禁止绕过现有 composable，直接复制其状态、计时器、焦点或消息逻辑；
- 禁止新增依赖替代项目已有能力；
- 禁止在页面组件中重复实现已有的解析、导出、资源清理或错误映射逻辑；
- 禁止让 UI 组件直接承担不属于它的全局资源或业务状态所有权。

如果确实需要突破这些禁止事项，必须先写 ADR，说明原因、替代方案、影响范围和回滚方式。

### `docs/QUALITY.md` = quality gates

`QUALITY.md` 负责通用质量门禁和验证方法：测试、类型检查、构建、状态覆盖、响应式、无障碍、性能和发布前检查。
`COMPATIBILITY.md` 只负责当前项目的真实输入、设备、浏览器和样本矩阵，不与 QUALITY 重复定义通用门禁。

## 6. `STATUS.md`：长期项目状态文件

建议新增 `docs/STATUS.md`。它不是日志，也不是路线图，而是“我半年后回来，先看这一页”的当前快照。

建议控制在 150 行以内，每次完成重要功能、做出产品决策、改变阻塞状态或发布版本时更新。

推荐结构：

```markdown
# Project Status

Last updated: YYYY-MM-DD
Current release:
Current product phase:

## Now
- 当前正在做什么

## Done
- 最近完成的稳定能力

## Next
- 接下来最多 3 项工作

## Blocked / Decisions
- 当前阻塞
- 已确定但尚未落代码的决定

## Known limitations
- 已知限制和未完成验收

## Verification
- 最近一次测试、构建、Preview 或真实文件验收结果

## Documentation map
- PRD:
- Current page specs:
- Architecture:
- UI mapping:
- Release notes:
```

`STATUS.md` 只保留当前事实。历史变化放在 `RELEASES.md`、ADR 或 `archive/`，不在 STATUS 中堆叠时间线。

## 7. `UI_IMPLEMENTATION_MAPPING.md` 不归档，而是精简保留

对于传统项目，设计到代码的映射文件完成一次交付后可以归档；但本项目采用持续 AI 开发模式，
未来还会继续开发 Homepage、MiuMiu、Archive 等页面，因此需要保留一个精简版作为长期桥梁。

它只回答一个问题：

> 设计语言和页面概念，在当前代码中由哪些组件、样式 token、状态和资源实现？

建议控制在 200 行以内，每个页面或设计概念只保留一张简表：

| 设计概念 | 代码入口 | 样式/资源 | 状态或交互 | 验收来源 |
|---|---|---|---|---|
| Editorial header | `SiteHeader.vue` | `layout.css`、字体 token | 当前栏目、未来占位、语言切换 | `pages/HOME.md` |
| Preview stage | `App.vue`、预览面板 | stage tokens、响应式规则 | empty/loading/preview/error | `pages/LAB.md` |
| Wiggle controls | `ControlPanel.vue` | control tokens | 播放、速度、交换左右眼、中间帧 | `pages/LAB.md` |

不要在 mapping 中复制完整 CSS、组件代码或产品规则。它只做导航和边界映射；具体规则回到 UI、页面规格和架构文档。

## 8. 现有文件的保留与归档建议

### 7.1 保留为活动文档

| 文件 | 建议 |
|---|---|
| `docs/PRD.md` | 保留为产品契约。 |
| `docs/UI.md` | 保留为全局 UI/交互契约；页面细节位于 `docs/pages/`。 |
| `docs/COMPATIBILITY.md` | 保留为当前项目质量/兼容性矩阵。 |
| `docs/DEPLOYMENT.md` | 保留为当前项目发布手册。 |
| `docs/design/DESIGN_SYSTEM.md` | 保留并纳入 Git，作为稳定的设计系统来源。 |
| `docs/design/BRAND.md` | 保留并纳入 Git，作为品牌和文案参考；稳定产品约束仍需在 PRD/UI 中可见。 |
| `docs/design/DESIGN_CONCEPTS.md` | 保留在原位置并纳入 Git，作为 v1 已批准的设计概念基线（approved design rationale + composition reference），也是高保真验收依据。 |
| `docs/UI_IMPLEMENTATION_MAPPING.md` | 保留精简版作为 AI 持续开发的设计到代码桥梁；原长版已归档。 |
| `docs/design/references.md` | 保留并纳入 Git；过期来源归档。 |
| `docs/design/approved-mockups/` | 目录名固定采用连字符写法；仅存放后续批准并整理后的最终视觉参考，纳入 Git。当前已有 mockup 全部视为生成素材，放入不纳入 Git 的 `generations/`。 |
| `docs/STATUS.md` | 新增后作为长期活动文档。 |
| `docs/RELEASES.md` | 从根目录整理后作为发布历史活动文档。 |

### 7.2 归档而不是继续作为当前规范

| 文件 | 建议归档位置 | 原因 |
|---|---|---|
| `docs/archive/plans/implementation-2026-08.md` | 已完成 | 本轮 UI 重构计划，稳定内容已抽取到长期文档。 |
| `docs/archive/audits/DOCUMENTATION_SYNC_AUDIT-2026-08.md` | 已完成 | 一次同步审计，保留用于追溯，不作为日常开发入口。 |
| `docs/archive/plans/IMPLEMENTATION_PLAN-2026-08.md` | 已完成 | 项目阶段实施计划。 |
| `docs/archive/roadmaps/REDESIGN_ROADMAP-2026-08.md` | 已完成 | 特定一轮重设计路线图。 |
| `docs/archive/plans/UI_REFACTOR_PLAN-2026-08.md` | 已完成 | 特定重构计划。 |
| `docs/archive/visual-reviews/UI_AUDIT-2026-08.md` | 已完成 | 一次性视觉审计。 |
| `docs/archive/visual-reviews/VISUAL_GAP_AUDIT-2026-08.md` | 已完成 | 差距分析记录。 |
| `docs/archive/visual-reviews/VISUAL_CONVERGENCE_AUDIT-2026-08.md` | 已完成 | 视觉收敛过程记录。 |
| `docs/archive/design/LAB_STATE_DESIGN-2026-08.md` | 已完成 | 状态设计推导已抽取到 `pages/LAB.md`。 |
| `docs/archive/design/HOME_WIREFRAME-2026-08.md`、`LAB_WIREFRAME-2026-08.md` | 已完成 | 原始线框归档，页面契约位于 `pages/`。 |
| `docs/archive/design/VISUAL_REFERENCE-2026-08.md` | 已完成 | 旧视觉参考归档，避免多个视觉事实来源。 |

### 7.3 特别说明：`RELEASES.md`

`RELEASES.md` 采用“双层入口”结构：

- 根目录 `RELEASES.md` 保留简短说明和 `docs/RELEASES.md` 链接，满足 GitHub、发布工具和开发者快速发现；
- `docs/RELEASES.md` 保存完整版本记录、已知问题、反馈入口和回滚信息；
- 两处不复制完整内容，避免发布记录分叉。

## 9. 新项目真正需要的最小文档集

新项目第一版不需要复制当前所有设计审计和实施计划。建议最小集合为：

```text
README.md                       # 项目是什么、如何运行、文档入口
AGENTS.md                       # 如果使用 AI 协作，则保留仓库级指令
docs/
├─ DEVELOPMENT.md               # ≤500 行，四部分
├─ STATUS.md                    # 当前状态快照
├─ PRD.md                       # 产品范围和核心流程
├─ ARCHITECTURE.md              # 项目架构、状态和资源边界
├─ UI.md                        # 有页面 UI 时必需
├─ UI_IMPLEMENTATION_MAPPING.md # 有持续设计驱动开发时保留
├─ QUALITY.md                   # 测试、验收和质量门禁
└─ DEPLOYMENT.md                # 需要发布到环境时必需
```

按需增加：

- `pages/<PAGE>.md`：多页面或复杂页面；
- `COMPATIBILITY.md`：有真实文件、设备、浏览器或性能矩阵；
- `RELEASES.md`：第一次正式发布后；根目录保留短入口；
- `decisions/ADR-*.md`：存在会影响后续开发的架构选择；
- `design/`：稳定设计规则、参考资料和 `approved-mockups/` 纳入版本控制；`exploration/`、`drafts/`、`generations/` 不纳入 Git。当前已有 mockup 全部归入 `generations/`。

新项目默认不创建：

- 大型 handbook 目录；
- 每个阶段一份 implementation plan；
- 每个页面一份 roadmap；
- 没有明确问题的视觉 audit；
- 与 README 重复的 docs README。

## 10. 新页面真正需要的最小文档集

在已有项目中新开发一个页面，默认只需要：

### 必需：`docs/pages/<PAGE>.md`

页面规格文件包含：

1. 页面目标和入口；
2. 不在范围内的能力；
3. 页面区域和组件入口；
4. 用户流程和状态矩阵；
5. 空、加载、成功、失败、取消、删除和禁用状态；
6. 响应式、键盘、读屏和触控要求；
7. 中英文文案和本地化边界；
8. 数据、持久化、分析和隐私边界；
9. 页面验收清单；
10. 关联的 `UI_IMPLEMENTATION_MAPPING.md` 行和 ADR。

### 必要时更新：现有公共文档

- 新页面使用新的全局视觉规则：更新 `UI.md` 或 `DESIGN_SYSTEM` 摘要；
- 新页面改变状态所有权或资源生命周期：更新 `ARCHITECTURE.md` 或增加 ADR；
- 新页面引入新输入、设备、性能或发布门禁：更新 `COMPATIBILITY.md`/`QUALITY.md`；
- 新页面完成或改变当前方向：更新 `STATUS.md`；
- 新版本发布：更新 `RELEASES.md`。

### 不需要默认创建

- `page-implementation-plan.md`：步骤放在任务、Issue 或 PR；
- `page-audit.md`：专项审计完成后归档；
- `page-roadmap.md`：只有批准的跨版本计划才建立；
- `page-deployment.md`：页面沿用项目级发布手册。

## 11. 文档更新规则

### 唯一事实来源

| 内容 | 唯一来源 |
|---|---|
| 项目是什么、如何启动 | 根目录 `README.md` |
| AI 如何协作和完成任务 | `docs/DEVELOPMENT.md` + 根目录 `AGENTS.md` 的协作边界 |
| 当前做到哪里 | `docs/STATUS.md` |
| 产品范围和业务规则 | `docs/PRD.md` 或页面规格 |
| 页面结构和交互 | `docs/UI.md` + `docs/pages/<PAGE>.md` |
| 设计语言到代码入口 | `docs/UI_IMPLEMENTATION_MAPPING.md` |
| 代码边界和状态所有权 | `docs/ARCHITECTURE.md` 或 ADR |
| 测试和发布验收 | `docs/QUALITY.md`、`docs/COMPATIBILITY.md` |
| 发布历史和回滚索引 | `docs/RELEASES.md` |
| 部署和回滚流程 | `docs/DEPLOYMENT.md` |
| 某次审计、计划或视觉探索 | `docs/archive/` |

其他文档只引用，不复制完整规则。

### 规范和记录分开

- 规范用现在时，描述系统当前应该怎样工作；
- `STATUS.md` 用当前快照，不写完整历史；
- `RELEASES.md` 和 archive 文件带日期，负责追溯；
- 已解决的审计结论先写回规范，再归档审计原文；
- 临时实验不能成为新页面的默认模板。

### DEVELOPMENT.md 的完成定义

`DEVELOPMENT.md` 自身应满足：

- 不超过 500 行；
- 只有开发循环、AI 协作、Definition of Done、文档规则四个主题；
- 不复制 README、AGENTS、Vue、Git、测试工具和部署手册；
- 新项目可以直接复用，只需在 README 和项目文档中补充项目特例。

## 12. 本轮已确定的整理边界

本轮确认：

1. 根目录 `RELEASES.md` 保留短入口，完整内容位于 `docs/RELEASES.md`；
2. 整理后的 `docs/design/` 纳入 Git；
3. 页面规格统一放在 `docs/pages/`；
4. `docs/ARCHITECTURE.md` 和 `docs/QUALITY.md` 现在建立；
5. `README` 负责入口，`DEVELOPMENT` 负责开发循环，`STATUS` 负责当前进度；
6. `UI_IMPLEMENTATION_MAPPING.md` 作为 AI 持续开发的设计到代码桥梁保留精简版；
7. 历史计划、审计和视觉探索进入 `archive/`。

## 13. 实际迁移顺序

按以下顺序执行，确保每一步都有明确的来源、目标和验收结果：

1. **冻结现状**：记录当前工作区改动；不覆盖用户已有代码、文档和测试修改。确认 `DESIGN_CONCEPTS.md`、现有 mockup 和历史文档的分类。
2. **建立目录边界**：创建 `docs/pages/`、`docs/archive/{audits,plans,roadmaps,visual-reviews,design}`，以及 `docs/design/{approved-mockups,exploration,drafts,generations}`。
3. **建立长期活动文档**：创建 `docs/DEVELOPMENT.md`、`docs/STATUS.md`、`docs/ARCHITECTURE.md` 和 `docs/QUALITY.md`；内容只写当前有效规则，不复制过程记录。
4. **规范化活动文档名称**：将 `prd.md`、`ui.md`、`compatibility.md`、`deployment.md` 分别迁移为大写文件名，并统一内部链接。
5. **整理页面规格**：将 Homepage 与 Lab 的稳定页面结构、状态和交互整理到 `docs/pages/HOME.md`、`docs/pages/LAB.md`；原始 wireframe/state 讨论随后归档。
6. **整理设计基线**：保留并纳入 Git 的 `DESIGN_SYSTEM.md`、`BRAND.md`、`references.md`、v1 `DESIGN_CONCEPTS.md`；现有全部 mockup 移入不纳入 Git 的 `generations/`，预留 `approved-mockups/` 给未来批准稿。
7. **压缩实现桥梁**：从原 `docs/design/UI_IMPLEMENTATION_MAPPING.md` 提取精简版到 `docs/UI_IMPLEMENTATION_MAPPING.md`，原始长版归档。
8. **归档过程文档**：将实施计划、重构计划、路线图、审计、视觉差距分析和视觉收敛记录移入对应 `docs/archive/` 子目录；将 `DOCUMENTATION_SYNC_AUDIT.md` 和本次整理方案作为过程记录归档或保留迁移索引。
9. **整理发布入口**：完整发布记录迁移到 `docs/RELEASES.md`，根目录 `RELEASES.md` 改为短入口；根目录 `README.md` 增加长期文档入口。
10. **更新版本控制边界**：根目录改用 `AGENTS.md`；`.gitignore` 不再忽略整个 `docs/design/`，只忽略 `exploration/`、`drafts/`、`generations/` 等生成素材目录。
11. **交叉检查**：搜索旧文件名、旧路径和“设计资料不纳入 Git”等过时表述；确认活动文档互相引用唯一来源，确认历史文件不再被默认入口引用。
12. **最小验收**：检查文档目录树、Git 跟踪边界和根目录入口；必要时运行现有文档/构建检查，不因整理任务扩展代码范围。

本次迁移后的未决事项仅保留：根目录 `RELEASES.md` 短入口的具体措辞，以及未来哪些新 mockup 可以进入 `approved-mockups/`。现有 mockup 全部归入 `generations/`，`DESIGN_CONCEPTS.md` 保留在原位置并纳入 Git。
