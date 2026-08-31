# Guandu Dispatch v0.9.3 Handoff

> 当前后续开发唯一基线：`官渡密报_v0.9_叙事流程与UI组件系统重构方案.md`

## 1. 版本定位

v0.9.3 延续 v0.9 的基线重置，不是旧版本的普通美化版，而是叙事节奏、组件系统和场景布局的基线重置。后续禁止重新引入“巨大普通场景标题、厚金边工具栏、多块高权重卡片同时铺满、页面自写 Button / Card / Modal”等旧模式。

## 2. 新组件目录

```text
app/src/ui/
  primitives/
    GameButton.tsx
    GameCard.tsx
    GameBadge.tsx
    GameTooltip.tsx
    GameDialog.tsx
    GameSheet.tsx
  motion/
    BlurFade.tsx
    AnimatedList.tsx
    SceneTransition.tsx
    CharacterReveal.tsx
  game/
    SceneHeader.tsx
    DialoguePanel.tsx
    DialogueChoiceList.tsx
    CharacterIntro.tsx
    EvidenceCard.tsx
    TaskChip.tsx
    DossierSheet.tsx
    HintPanel.tsx
```

旧 `features/ui` 组件仅作为兼容桥接存在，新功能不得依赖旧视觉实现。

## 3. v0.9 主流程

```text
opening
  prologue-background
  → player-identity
  → basic-onboarding
  → zhao-first-intro
  → zhao-first-dialogue
→ first-evidence
→ first-deduction
→ interrogation
→ case-summary
→ network-investigation
→ network-deduction
→ audience(first-report)
→ bait
→ enemy-report
→ audience(final-report)
→ final-report
→ ending
```

## 4. 关键重构文件

- `src/content/guandu/story.ts`：前 10 分钟数据驱动叙事；
- `src/features/scenes/OpeningFlowScene.tsx`：背景 / 身份 / 教程 / 人物首次出现；
- `src/features/scenes/FirstEvidenceScene.tsx`：第一次证据比较；
- `src/features/scenes/FirstDeductionScene.tsx`：第一次引导式推断；
- `src/features/scenes/InterrogationScene.tsx`：再问赵简；
- `src/features/scenes/NetworkInvestigationScene.tsx`：先介绍陆/郑/杜，再逐人核验；
- `src/features/scenes/NetworkDeductionScene.tsx`：逐问建立泄密链；
- `src/features/scenes/AudienceScene.tsx`：单 CG 主视觉曹操复命；
- `src/features/scenes/BaitScene.tsx`：逐渠道投饵；
- `src/features/scenes/EnemyReportScene.tsx`：单急报 + 行动回声；
- `src/features/scenes/FinalReportScene.tsx`：事实 / 证据链 / 处置三步；
- `src/features/scenes/EndingScene.tsx`：单主卡真相归属；
- `src/features/scenes/CaseNavigator.tsx`：v0.9 案卷 / 任务 / 提示 / 历史。

## 5. 自动审核

```bash
cd app
npm run verify:v091
```

基础 `npm run verify:v09` 是纯静态合同，不依赖项目 node_modules。`npm run verify:v091:deep` 在此基础上增加存档/返回 runtime-lite 与全源码语法检查，需要项目或全局 TypeScript。

## 6. 还必须在目标机验证

```bash
npm ci
npm run test:run
npm run build
npm run lint
```

当前容器曾在 `npm ci` 下载阶段超时，因此不要把容器未完成的 production build 宣称为已经通过。

## 7. 下一阶段优先级

1. Windows 真实 build + 1366×768 视觉验收；
2. 试玩后修复“看不懂 / 不知道下一步 / 仍像网页”的具体画面；
3. 人物情绪图；
4. 正式 AI 配音；
5. CG 2.5D 分层；
6. 再考虑新案件或系统扩展。


## 8. 存档基线

当前 schema 为 v5。加载 v0.8.x v3/v4 存档时保留案件事实，但演出位置迁移到 v0.9 合法节点，并清理旧导航历史；当前 v5 存档也会过滤 legacy history。恢复页不得重新进入 `story / camp / document / investigation / dialogue / deduction` 旧演出壳。


## 9. v0.9.1 存档 / 证据交互补充基线

后续必须同时遵守 `官渡密报_v0.9.1_试玩问题与存档系统修订方案.md`：

- 应用启动永远先到标题，不自动恢复任意存档；
- 标题进入后先显示 3 个本地存档槽；
- 只有玩家点击“继续此档”后才恢复状态；
- 当前活动存档自动保存，场景顶栏显示“存档 N · 自动保存”；
- 旧 `guandu.current` 仅首次导入存档 1；
- 证据的“选择”和“查看详情”必须分离；
- 查看详情必须用 Dialog/Sheet，关闭后原布局不变；
- 人物图不得拉伸，普通对话优先“正常场景背景 + 独立人物层”。

验证命令：

```bash
npm run verify:v091
npm run verify:v091:deep
```


## 10. v0.9.3 开场 / 存档 / 逐页验收规则

- 开场前几分钟必须有轻量章节 HUD，玩家随时知道自己处于“背景 / 身份 / 引导 / 第一人物”哪一步。
- 存档卡必须提供场景缩略图、章节、当前位置、当前任务、进度和最后保存时间；最近一档要有显式标签。
- 证据、推理、人物调查、泄密链、投饵、敌军回声、最终报告和结局必须使用 `SceneFocusHeader`。
- 每次改 UI 都按 `UI_PAGE_ACCEPTANCE_v0.9.3.md` 逐页验收。
- 不允许通过新页面重新引入巨大普通标题、低对比按钮、人物拉伸或同时铺满多个同权重信息块。
