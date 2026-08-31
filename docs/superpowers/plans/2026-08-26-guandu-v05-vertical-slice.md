# 《官渡密报》v0.5 垂直切片 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有后台式首屏重构为可直接试玩的场景化“看 → 查 → 问 → 推理”垂直切片。

**Architecture:** `GameShell`/scene controller 管理 `title/story/camp/document/investigation/interrogation/deduction/prototype-end` 场景；场景只调用现有 `GameProvider` 和规则层。表现资源通过稳定 ID/manifest 与规则解耦，缺失资源使用统一 placeholder。

**Tech Stack:** React 19、TypeScript、Vite、现有 Vitest/Playwright（本轮不新增测试工作包，仅执行启动和构建烟测）。

**Spec:** `docs/superpowers/specs/2026-08-26-guandu-v05-vertical-slice.md` 与附件 v0.5 执行规格。

## Global Constraints

- 停止继续铺设 Bait/FinalReport/Ending；垂直切片完成后暂停等试玩反馈。
- 不让 `IntelDesk`/`Workspace` 继续主导首屏，不把新体验做成三栏换皮。
- 保留确定性案件规则、证据 provenance、关系 validator 和本地存档。
- 不新增服务器、账号、随机真相、倒计时或未经授权二进制素材。
- 当前不建立新的测试工作包；至少运行 `npm run build`、`npm run lint` 与 `npm run dev` 烟测。

---

### Task 1: 场景状态与数据契约

**Owner:** `backend_worker`

**Files:** `app/src/game/` 中表现状态/剧情数据适配文件及对应已有测试（仅必要改动）。

- [ ] 定义 `GameSceneId`、场景进入/退出和一次性演出事件的最小契约；兼容现有 v2 `TutorialState`。
- [ ] 建立第一段剧情数据（开场、军帐、赵简对白、结束提示）与稳定资源 ID，不把文本硬编码进场景 JSX。
- [ ] 不改变案件规则；运行现有测试、build、lint 后提交 `feat: add v05 scene contracts`。

### Task 2: GameShell、TitleScene 与开场演出

**Owner:** `frontend_worker`

**Files:** `app/src/app/`、`app/src/features/scenes/`、`app/src/index.css`、必要 placeholder manifest。

- [ ] 建立场景壳和 TitleScene，首屏不直达 `IntelDesk`。
- [ ] 实现黑场、夜路粮车、火光/烟尘的 CSS/HTML placeholder 演出，支持慢推/横移/轻震和 reduced-motion；不依赖外部图片或音频。
- [ ] 实现 CampScene/DialogueBox：赵简或上级角色能以半身 placeholder 出现、对白推进、明确任务。
- [ ] 保持键盘和屏幕阅读器可用，运行 build/lint/dev 烟测后提交 `feat: add v05 title and story scenes`。

### Task 3: Document、Investigation、Interrogation 场景串联

**Owner:** `frontend_worker`

**Files:** `app/src/features/scenes/`、必要的 `app/src/features/documents|investigation|interrogation` 适配层。

- [ ] DocumentScene 只突出残缺伏击军报与“记录线索”，调用真实 `READ_DOCUMENT`/`EXTRACT_CLAIM`。
- [ ] InvestigationScene 只开放笔迹核验，调用真实 `applyInvestigation`/`APPLY_RULE_STATE` 并显示调查令消耗。
- [ ] InterrogationScene 只开放赵简真实规则，正确证据触发拍桌/表情/对白 placeholder 反馈，错误证据可解释且不 Game Over。
- [ ] 每个场景显示轻量当前目标，运行 build/lint/dev 烟测后提交 `feat: add v05 playable investigation scenes`。

### Task 4: DeductionBoard、原型结束与试玩入口

**Owner:** `frontend_worker`

**Files:** `app/src/features/scenes/`、`RelationshipBoard` 适配、`README.md`、`HANDOFF.md`。

- [ ] 质询成功后解锁案情板，使用现有 validator 建立 `claim-zhao-copied-order → refutes → claim-zhao-denial / leakedInfo`。
- [ ] 完成后显示“原型体验结束 / 后续调查待开放”，不得自动进入投饵或结局。
- [ ] 更新 README/HANDOFF 的试玩入口、当前完成场景、已知暂缓项；运行 build/lint/dev 烟测后提交 `test: mark v05 prototype slice playable`。

## Stop Gate

Task 4 完成后停止自动执行；输出启动命令、进入路径、关键文件、实际已完成场景和试玩重点，等待产品方反馈后再规划 Phase C 及后续测试。
