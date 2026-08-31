# Guandu Dispatch v0.9.5 Web App

React + TypeScript + Vite 实现的《官渡密报》主游戏工程。v0.9.5 的开发基线是 **半开放调查 + 案卷知识中枢 + 人物证据反应 + 持续 Theory Graph + Theory-driven 投饵 + Enemy Feedback 验证**。

## 开发

```bash
npm ci
npm run dev
```

## 核心验证

```bash
npm run verify:v095
npm run verify:v095:deep
```

`verify:v095` 会先完整回归 v0.9–v0.9.4 合同，再检查 v0.9.5 核心闭环静态合同。`verify:v095:deep` 额外执行规则级完整 Playthrough、migration/recovery runtime-lite 和全 TS/TSX 语法检查。

完整开发机还必须执行：

```bash
npm run test:run
npm run build
npm run lint
```

## v0.9.5 关键目录

- `src/game/coreLoopSelectors.ts`：目标、知识、缺口 selector；
- `src/game/rules/knowledge.ts`：知识状态与目标推进；
- `src/game/rules/evidenceReaction.ts`：人物质证；
- `src/game/rules/theory.ts`：Theory Graph / Gap；
- `src/game/rules/guidance.ts`：三级 Guidance；
- `src/game/rules/bait.ts`：Theory-driven BaitExperiment；
- `src/game/rules/enemyFeedback.ts`：EnemyFeedback 与 verified 回写；
- `src/features/scenes/CaseNavigator.tsx`：案卷反向导航中心；
- `src/features/scenes/NetworkDeductionScene.tsx`：持续推演工作区；
- `src/features/scenes/BaitScene.tsx`：双核心验证实验；
- `src/features/scenes/EnemyReportScene.tsx`：敌军回声；
- `src/features/scenes/CoreLoopPlaythrough.test.tsx`：端到端规则路径；
- `scripts/verify-v095-core-loop.cjs`：v0.9.5 静态交付合同；
- `scripts/verify-v095-core-loop-runtime.cjs`：零前端依赖的规则级闭环验证。

后续新页面仍禁止绕过 `src/ui/` 建立第二套通用 Button / Card / Dialog / Sheet。
