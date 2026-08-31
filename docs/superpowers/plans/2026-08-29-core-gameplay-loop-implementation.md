# 《官渡密报》Core Gameplay Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有“调查 → 案卷 → 人物 → 泄密链推演 → 投饵验证”五段式页面，重构成可往返、可纠错、可提示、可由敌军回声反证的半开放核心玩法闭环。

**Architecture:** 保留现有 React + reducer + GameContent 案件事实层，不引入 XState / React Flow / Radix 等新依赖。新增独立的知识层、目标层、人物证据反应层、持续理论图、引导状态和投饵实验层；所有 UI 通过这些领域状态互相反向导航，而不是通过场景硬编码下一步。

**Tech Stack:** React 19, TypeScript 6, existing reducer/rules architecture, Zod persistence schema, Vitest + Testing Library, existing CSS/UI primitives.

**Spec:** `docs/superpowers/specs/2026-08-29-core-gameplay-loop-design.md`

> **Execution status — 2026-08-29:** Tasks 1–10 are implemented in the v0.9.5 Core Experience Pass workspace. `npm run verify:v095` and `npm run verify:v095:deep` pass on the final source tree. The checkbox list below is retained as the original implementation recipe rather than rewritten as an execution log. Standard `vitest` / production build / `oxlint` still require a clean `npm ci` on a machine with registry access; see `FINAL_DELIVERY_AUDIT_v0.9.5.md`.

## Global Constraints

- 第一案固定真相不得改变：赵简泄露集合时辰；杜衡由草料、车辆、道路、价格等碎片推出路线，并承担拼合/价格暗号传递责任。
- 玩家解决的是“敌人如何得到信息”，不是随机“谁是内奸”。
- 泄密链达到 `supported` 后才能进入核心投饵；敌军回声后才能升级为 `verified`。
- 错误推理不得显示简单“错误”，必须返回可解释的缺口；无效质证不得消耗不可恢复资源或锁死人物。
- 采用半开放调查：始终显示一个主目标，但玩家可自由打开案卷、人物、文书和推演。
- 提醒采用 B 模式：轻主动提醒 + 玩家三层主动加深；同一主动提醒最多出现一次，不弹 Modal，不直接给答案。
- 继续复用现有依赖；本轮不新增 XState / React Flow / Radix / Motion。
- UI 继续遵守 v0.9.4：圆角、高对比、多行文本不溢出、1366×768 无横向滚动、人物立绘不拉伸。
- 当前包无 Git 元数据；每个任务用测试与 `CHECKPOINT` 文件记录替代 commit，不初始化 `.git`。

---

## File Structure

### Domain / State
- Modify: `app/src/game/domain.ts` — 新增知识、目标、证据反应、理论图、引导、投饵实验、敌军反馈类型；`GameState.version` 升级。
- Modify: `app/src/game/initialState.ts` — 初始化 core-loop 子状态。
- Modify: `app/src/game/reducer.ts` — 新增 core-loop 原子 action；保持旧 action 兼容。
- Modify: `app/src/game/contentSchema.ts` — 持久化 schema 接受新字段。
- Modify: `app/src/game/persistence.ts` — 旧 v5 → 新 schema 迁移。
- Create: `app/src/game/coreLoopSelectors.ts` — 当前目标、可突破方向、已使用证据、知识索引等纯 selector。

### Case Content
- Create: `app/src/content/guandu/coreLoop.ts` — 第一案目标、知识目录、EvidenceReaction、GuidanceCue、理论节点元数据。
- Modify: `app/src/content/guandu/index.ts` — 导出 core-loop 案件配置。

### Rules
- Create: `app/src/game/rules/knowledge.ts` — upsert / status monotonic update / source linking。
- Create: `app/src/game/rules/evidenceReaction.ts` — 依据人物 + 证据解析反应与知识更新。
- Create: `app/src/game/rules/theory.ts` — 持续理论图、缺口分析、supported / verified 判定。
- Create: `app/src/game/rules/guidance.ts` — cue 触发、主动提示层级、resolved 规则。
- Modify: `app/src/game/rules/investigation.ts` — 旧 investigation 输出同步写入知识层，避免一次性“知道即真相”。
- Modify: `app/src/game/rules/bait.ts` — 从“四渠道强制各一条”改为基于当前 supported theory 的 BaitExperiment。

### UI / Scenes
- Modify: `app/src/features/scenes/CaseNavigator.tsx` — 案卷成为反向导航中心；目标/突破口/提示统一来源于 core-loop selectors。
- Create: `app/src/ui/game/ObjectiveRail.tsx` — 当前目标 + 可继续方向数量 + 非打断型提醒。
- Create: `app/src/ui/game/KnowledgeStatusBadge.tsx` — 知识状态视觉语义。
- Modify: `app/src/features/scenes/NetworkInvestigationScene.tsx` — 调查改为“观察 → 标记 → 形成事实”，人物入口支持从案卷目标跳转。
- Modify: `app/src/features/scenes/InterrogationScene.tsx` — 人物核心交互改为“出示证据 → EvidenceReaction → 新事实”。
- Modify: `app/src/features/scenes/NetworkDeductionScene.tsx` — 持续理论图 + TheoryGap；不再三问填答案。
- Modify: `app/src/features/scenes/BaitScene.tsx` — 创建假情报实验并明确“正在验证什么”。
- Modify: `app/src/features/scenes/EnemyReportScene.tsx` — 回声写回 TheoryEdge / KnowledgeEntry；未验证允许回调查。
- Modify: `app/src/features/scenes/GameShell.tsx` — 允许 core-loop 环节之间合法往返，不改变冻结剧情节点。
- Modify: `app/src/features/scenes/v09.css`, `app/src/ui/game/game.css` — 新闭环 UI 状态与 1366×768 适配。

### Tests / Verification
- Create: `app/src/game/rules/knowledge.test.ts`
- Create: `app/src/game/rules/evidenceReaction.test.ts`
- Create: `app/src/game/rules/theory.test.ts`
- Create: `app/src/game/rules/guidance.test.ts`
- Modify: `app/src/game/rules/bait.test.ts`
- Modify: `app/src/game/reducer.test.ts`
- Modify: `app/src/game/persistence.test.ts`
- Create: `app/src/features/scenes/CoreLoopPlaythrough.test.tsx`
- Create: `app/scripts/verify-v095-core-loop.cjs`

---

### Task 1: Add the core-loop domain model and v6-compatible state

**Files:**
- Modify: `app/src/game/domain.ts`
- Modify: `app/src/game/initialState.ts`
- Modify: `app/src/game/reducer.ts`
- Modify: `app/src/game/reducer.test.ts`
- Create: `app/src/game/coreLoopSelectors.ts`

**Interfaces:**
- Consumes: existing `EntityId`, `RelationKind`, `BaitOption`, `EnemyReport`, `GameState`.
- Produces: `KnowledgeEntry`, `CaseObjective`, `EvidenceReaction`, `TheoryNode`, `TheoryEdge`, `TheoryGap`, `TheoryEvaluation`, `GuidanceCue`, `GuidanceState`, `BaitExperiment`, `EnemyFeedback`, and `GameState.coreLoop`.

- [ ] **Step 1: Write failing reducer/state tests**

Add tests to `src/game/reducer.test.ts`:

```ts
it('initializes and updates core-loop knowledge without deleting legacy claims', () => {
  const initial = createInitialState();
  expect(initial.coreLoop.knowledge).toEqual({});

  const next = gameReducer(initial, {
    type: 'UPSERT_KNOWLEDGE',
    entry: {
      id: 'claim-zhao-time',
      kind: 'claim',
      status: 'observed',
      sourceIds: ['statement-zhao'],
      relatedPersonIds: ['zhao'],
      relatedDocumentIds: ['statement-zhao'],
      lastUpdatedAt: 100,
    },
  });

  expect(next.coreLoop.knowledge['claim-zhao-time']?.status).toBe('observed');
  expect(next.extractedClaimIds).toEqual(initial.extractedClaimIds);
});

it('raises an existing knowledge entry without duplicating it', () => {
  const state = gameReducer(createInitialState(), {
    type: 'UPSERT_KNOWLEDGE',
    entry: {
      id: 'claim-zhao-time', kind: 'claim', status: 'observed', sourceIds: [],
      relatedPersonIds: ['zhao'], relatedDocumentIds: [], lastUpdatedAt: 1,
    },
  });
  const supported = gameReducer(state, {
    type: 'SET_KNOWLEDGE_STATUS', knowledgeId: 'claim-zhao-time', status: 'supported', at: 2,
  });
  expect(supported.coreLoop.knowledge['claim-zhao-time']?.status).toBe('supported');
});
```

- [ ] **Step 2: Run the targeted test and verify failure**

Run:

```bash
cd app
npx vitest run src/game/reducer.test.ts
```

Expected: TypeScript/test failure because `coreLoop`, `UPSERT_KNOWLEDGE`, and `SET_KNOWLEDGE_STATUS` do not exist.

- [ ] **Step 3: Add exact domain types and state shape**

Add to `src/game/domain.ts`:

```ts
export type KnowledgeStatus = 'unknown' | 'observed' | 'suspected' | 'contradicted' | 'supported' | 'verified' | 'excluded';
export interface KnowledgeEntry {
  id: EntityId;
  kind: 'claim' | 'person' | 'document' | 'relationship' | 'enemy-feedback';
  status: KnowledgeStatus;
  sourceIds: EntityId[];
  relatedPersonIds: EntityId[];
  relatedDocumentIds: EntityId[];
  lastUpdatedAt: number;
}
export interface CaseObjective {
  id: EntityId; title: string; question: string;
  requiredKnowledgeIds: EntityId[]; optionalKnowledgeIds: EntityId[];
  completion: 'manual' | 'all-required-supported' | 'theory-supported' | 'theory-verified';
  nextObjectiveId?: EntityId;
}
export interface EvidenceReaction {
  id: EntityId; characterId: EntityId; evidenceClaimId: EntityId;
  requiredKnowledgeIds?: EntityId[]; response: string;
  reaction: 'irrelevant' | 'deflect' | 'guarded' | 'contradicted' | 'breakthrough';
  revealClaimIds: EntityId[];
  knowledgeUpdates: Array<{ knowledgeId: EntityId; status: KnowledgeStatus }>;
}
export type TheoryNodeKind = 'person' | 'claim' | 'document' | 'information' | 'method' | 'enemy';
export interface TheoryNode { id: EntityId; kind: TheoryNodeKind; sourceId: EntityId; label: string; }
export interface TheoryEdge { id: EntityId; fromId: EntityId; toId: EntityId; relation: RelationKind; status: 'proposed' | 'supported' | 'verified' | 'rejected'; }
export interface TheoryGap {
  id: EntityId; kind: 'missing-source' | 'missing-route' | 'missing-transmitter' | 'unsupported-edge' | 'conflict';
  title: string; description: string; relatedKnowledgeIds: EntityId[];
  suggestedPersonIds: EntityId[]; suggestedDocumentIds: EntityId[];
}
export interface TheoryEvaluation { status: 'incomplete' | 'conflicted' | 'supported' | 'verified'; gaps: TheoryGap[]; supportedEdgeIds: EntityId[]; rejectedEdgeIds: EntityId[]; }
export type GuidanceStatus = 'unseen' | 'shown' | 'dismissed' | 'resolved';
export interface GuidanceCue {
  id: EntityId; objectiveId: EntityId;
  trigger: 'stalled' | 'invalid-theory' | 'unused-evidence' | 'new-gap' | 'manual';
  level1: string; level2: string; level3: string;
  relatedPersonIds: EntityId[]; relatedDocumentIds: EntityId[];
}
export interface GuidanceState {
  currentObjectiveId: EntityId;
  cueStates: Record<EntityId, GuidanceStatus>;
  manualHintLevels: Record<EntityId, 0 | 1 | 2 | 3>;
  lastProgressAt: number;
  invalidTheoryAttempts: number;
  unusedEvidenceIds: EntityId[];
}
export interface BaitExperiment {
  id: EntityId; theoryEdgeIds: EntityId[]; baitIds: EntityId[]; hypothesis: string;
  expectedSignals: string[]; status: 'draft' | 'deployed' | 'observed' | 'resolved';
}
export interface EnemyFeedback {
  id: EntityId; source: 'scout' | 'market' | 'intercept' | 'no-response'; text: string;
  relatedBaitIds: EntityId[]; supportsTheoryEdgeIds: EntityId[]; contradictsTheoryEdgeIds: EntityId[];
}
export interface CoreLoopState {
  knowledge: Record<EntityId, KnowledgeEntry>;
  theoryNodes: TheoryNode[];
  theoryEdges: TheoryEdge[];
  theoryEvaluation: TheoryEvaluation;
  guidance: GuidanceState;
  baitExperiments: BaitExperiment[];
  enemyFeedback: EnemyFeedback[];
  selectedDossierTarget?: { kind: 'person' | 'document' | 'knowledge' | 'gap'; id: EntityId };
}
```

Change `GameState.version` to `6` and add `coreLoop: CoreLoopState`.

- [ ] **Step 4: Initialize core-loop state**

In `createInitialState()` set:

```ts
coreLoop: {
  knowledge: {},
  theoryNodes: [],
  theoryEdges: [],
  theoryEvaluation: { status: 'incomplete', gaps: [], supportedEdgeIds: [], rejectedEdgeIds: [] },
  guidance: {
    currentObjectiveId: 'objective-time-leak', cueStates: {}, manualHintLevels: {},
    lastProgressAt: 0, invalidTheoryAttempts: 0, unusedEvidenceIds: [],
  },
  baitExperiments: [],
  enemyFeedback: [],
},
```

- [ ] **Step 5: Add reducer actions**

Add exact actions:

```ts
| { type: 'UPSERT_KNOWLEDGE'; entry: KnowledgeEntry }
| { type: 'SET_KNOWLEDGE_STATUS'; knowledgeId: EntityId; status: KnowledgeStatus; at: number }
| { type: 'SET_OBJECTIVE'; objectiveId: EntityId }
| { type: 'SET_THEORY_GRAPH'; nodes: TheoryNode[]; edges: TheoryEdge[]; evaluation: TheoryEvaluation }
| { type: 'SET_GUIDANCE_STATE'; guidance: GuidanceState }
| { type: 'UPSERT_BAIT_EXPERIMENT'; experiment: BaitExperiment }
| { type: 'ADD_ENEMY_FEEDBACK'; feedback: EnemyFeedback }
| { type: 'SET_DOSSIER_TARGET'; target?: CoreLoopState['selectedDossierTarget'] }
```

Implement them as immutable updates; `UPSERT_KNOWLEDGE` merges source/person/document arrays with `Set` semantics.

- [ ] **Step 6: Add pure selectors**

Create `src/game/coreLoopSelectors.ts`:

```ts
export function selectKnowledge(state: GameState, id: EntityId) { return state.coreLoop.knowledge[id]; }
export function selectCurrentObjectiveId(state: GameState) { return state.coreLoop.guidance.currentObjectiveId; }
export function selectUnusedEvidenceIds(state: GameState) { return state.coreLoop.guidance.unusedEvidenceIds; }
export function selectOpenTheoryGaps(state: GameState) { return state.coreLoop.theoryEvaluation.gaps; }
export function selectInvestigableDirectionCount(state: GameState) {
  return new Set([
    ...state.coreLoop.theoryEvaluation.gaps.flatMap((gap) => gap.suggestedPersonIds),
    ...state.coreLoop.guidance.unusedEvidenceIds,
  ]).size;
}
```

- [ ] **Step 7: Run tests and record checkpoint**

Run:

```bash
npx vitest run src/game/reducer.test.ts
```

Expected: PASS.

Create `CHECKPOINTS/core-loop-task-01.txt` containing the command and PASS result.

---

### Task 2: Define Guandu objectives, knowledge catalog, reactions, and guidance cues

**Files:**
- Create: `app/src/content/guandu/coreLoop.ts`
- Modify: `app/src/content/guandu/index.ts`
- Create: `app/src/content/guandu/coreLoop.test.ts`

**Interfaces:**
- Consumes: `CaseObjective`, `EvidenceReaction`, `GuidanceCue`, `TheoryNode`.
- Produces: `guanduObjectives`, `guanduEvidenceReactions`, `guanduGuidanceCues`, `guanduTheoryNodes`, and lookup helpers used by rules/UI.

- [ ] **Step 1: Write failing content contract tests**

Create `src/content/guandu/coreLoop.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { guanduObjectives, guanduEvidenceReactions, guanduGuidanceCues } from './coreLoop';

describe('Guandu core loop content', () => {
  it('keeps the frozen objective order', () => {
    expect(guanduObjectives.map((item) => item.id)).toEqual([
      'objective-time-leak', 'objective-route-leak', 'objective-integration',
      'objective-transmission', 'objective-counterintel', 'objective-verify-network',
    ]);
  });

  it('has evidence reactions for the core Zhao and Du breakthroughs', () => {
    expect(guanduEvidenceReactions.some((item) => item.characterId === 'zhao' && item.reaction === 'breakthrough')).toBe(true);
    expect(guanduEvidenceReactions.some((item) => item.characterId === 'du' && item.reaction === 'breakthrough')).toBe(true);
  });

  it('provides three levels for each guidance cue', () => {
    for (const cue of guanduGuidanceCues) {
      expect(cue.level1.length).toBeGreaterThan(0);
      expect(cue.level2.length).toBeGreaterThan(0);
      expect(cue.level3.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run `npx vitest run src/content/guandu/coreLoop.test.ts`.
Expected: module `./coreLoop` missing.

- [ ] **Step 3: Define objectives exactly**

Create `src/content/guandu/coreLoop.ts` with the six objective IDs from the spec. Use these required knowledge IDs:

```ts
'objective-time-leak': ['claim-zhao-time']
'objective-route-leak': ['claim-du-fodder-pattern', 'claim-du-route']
'objective-integration': ['claim-du-route', 'claim-price-cipher']
'objective-transmission': ['claim-price-cipher', 'claim-shuoyuan-received']
'objective-counterintel': [] // completion is theory-supported
'objective-verify-network': [] // completion is theory-verified
```

- [ ] **Step 4: Define evidence reactions**

Include at minimum:

```ts
{
  id: 'reaction-zhao-time-record', characterId: 'zhao', evidenceClaimId: 'claim-zhao-time',
  response: '这份誊本……确实经我手。时辰也是我泄出去的。', reaction: 'breakthrough',
  revealClaimIds: ['claim-zhao-time'],
  knowledgeUpdates: [{ knowledgeId: 'claim-zhao-time', status: 'supported' }],
}
{
  id: 'reaction-zhao-price-irrelevant', characterId: 'zhao', evidenceClaimId: 'claim-price-cipher',
  response: '此物与军书房何干？我从未碰过商价簿。', reaction: 'irrelevant',
  revealClaimIds: [], knowledgeUpdates: [],
}
{
  id: 'reaction-du-price-breakthrough', characterId: 'du', evidenceClaimId: 'claim-price-cipher',
  requiredKnowledgeIds: ['claim-du-fodder-pattern'],
  response: '路是我算出来的。价表……也是我传出去的。', reaction: 'breakthrough',
  revealClaimIds: ['claim-du-route'],
  knowledgeUpdates: [
    { knowledgeId: 'claim-du-route', status: 'supported' },
    { knowledgeId: 'claim-price-cipher', status: 'supported' },
  ],
}
```

Add guarded/deflect reactions for Lu and Zheng existing evidence so “撒谎” remains separate from “通敌”。

- [ ] **Step 5: Define guidance cues**

Add cues for:
- `cue-time-evidence-unused`
- `cue-route-gap`
- `cue-transmitter-gap`
- `cue-invalid-theory`
- `cue-counterintel-ready`

Each cue must have three progressively explicit levels and related person/document IDs.

- [ ] **Step 6: Export and test**

Export via `src/content/guandu/index.ts`, then run:

```bash
npx vitest run src/content/guandu/coreLoop.test.ts
```

Expected: PASS. Record `CHECKPOINTS/core-loop-task-02.txt`.

---

### Task 3: Implement knowledge updates and objective progression

**Files:**
- Create: `app/src/game/rules/knowledge.ts`
- Create: `app/src/game/rules/knowledge.test.ts`
- Modify: `app/src/game/rules/investigation.ts`
- Modify: `app/src/game/rules/investigation.test.ts`
- Modify: `app/src/game/reducer.ts`

**Interfaces:**
- Consumes: `KnowledgeEntry`, objective config from `content/guandu/coreLoop.ts`.
- Produces: `upsertKnowledge`, `markObservedClaim`, `promoteKnowledge`, `syncObjectiveProgress`.

- [ ] **Step 1: Write failing knowledge tests**

```ts
it('marks a discovered claim as observed and indexes its person/document relations', () => {
  const next = markObservedClaim(content, createInitialState(), 'claim-du-fodder-pattern', 100);
  const entry = next.coreLoop.knowledge['claim-du-fodder-pattern'];
  expect(entry.status).toBe('observed');
  expect(entry.relatedDocumentIds.length).toBeGreaterThan(0);
});

it('never downgrades verified knowledge through observation', () => {
  const verified = promoteKnowledge(createInitialState(), 'claim-zhao-time', 'verified', 10);
  const observed = promoteKnowledge(verified, 'claim-zhao-time', 'observed', 20);
  expect(observed.coreLoop.knowledge['claim-zhao-time'].status).toBe('verified');
});
```

- [ ] **Step 2: Run and confirm failure**

Run `npx vitest run src/game/rules/knowledge.test.ts`.
Expected: missing functions.

- [ ] **Step 3: Implement status precedence**

Use exact precedence for positive progression:

```ts
const positiveRank = { unknown: 0, observed: 1, suspected: 2, contradicted: 2, supported: 3, verified: 4, excluded: 4 } as const;
```

`verified` and `excluded` are terminal except through explicit rule actions; plain observation cannot downgrade either.

- [ ] **Step 4: Sync old Claim extraction into knowledge**

Modify investigation completion and relevant scene actions so any newly revealed Claim calls `markObservedClaim`. Keep `extractedClaimIds` for legacy compatibility.

`applyInvestigation()` should return a state where `revealClaimIds` exist in both legacy `extractedClaimIds` and `coreLoop.knowledge` with status `observed`.

- [ ] **Step 5: Implement objective progression**

`syncObjectiveProgress(state, objectives)` must:
- advance `objective-time-leak` when `claim-zhao-time` is `supported`;
- advance route/integration/transmission when their required knowledge is `supported`;
- set `objective-counterintel` when theory evaluation is `supported`;
- set `objective-verify-network` after deployment;
- remain on verify-network until theory becomes `verified`.

- [ ] **Step 6: Run rule tests**

Run:

```bash
npx vitest run src/game/rules/knowledge.test.ts src/game/rules/investigation.test.ts
```

Expected: PASS. Record `CHECKPOINTS/core-loop-task-03.txt`.

---

### Task 4: Add evidence-to-character reactions and make wrong evidence non-destructive

**Files:**
- Create: `app/src/game/rules/evidenceReaction.ts`
- Create: `app/src/game/rules/evidenceReaction.test.ts`
- Modify: `app/src/features/scenes/InterrogationScene.tsx`
- Modify: `app/src/features/scenes/NetworkInvestigationScene.tsx`
- Modify: `app/src/features/scenes/CaseNavigator.tsx`

**Interfaces:**
- Consumes: `guanduEvidenceReactions`, `GameState.coreLoop.knowledge`.
- Produces: `resolveEvidenceReaction(content, state, characterId, evidenceClaimId, at)` returning `{ state, reaction, response, revealClaimIds }`.

- [ ] **Step 1: Write failing rule tests**

```ts
it('breaks Zhao only with evidence that supports the time leak', () => {
  const result = resolveEvidenceReaction(content, stateWithZhaoTimeObserved, 'zhao', 'claim-zhao-time', 100);
  expect(result.reaction).toBe('breakthrough');
  expect(result.state.coreLoop.knowledge['claim-zhao-time'].status).toBe('supported');
});

it('treats irrelevant evidence as information without locking the character', () => {
  const result = resolveEvidenceReaction(content, stateWithPriceCipher, 'zhao', 'claim-price-cipher', 100);
  expect(result.reaction).toBe('irrelevant');
  expect(result.state.personStates.zhao).not.toBe('hostile');
  expect(result.state.investigationPoints).toBe(stateWithPriceCipher.investigationPoints);
});
```

- [ ] **Step 2: Run and confirm failure**

Run `npx vitest run src/game/rules/evidenceReaction.test.ts`.

- [ ] **Step 3: Implement reaction resolution**

Algorithm:
1. Find exact character+evidence reaction.
2. If required knowledge missing, return `guarded` response without mutating scarce resources.
3. Apply reveal Claim IDs to legacy state and KnowledgeEntry.
4. Apply `knowledgeUpdates`.
5. Update `personStates` only for mood/behavior compatibility; never make irrelevant evidence permanently hostile.
6. Reset `guidance.lastProgressAt` only on actual new knowledge/status progress.

- [ ] **Step 4: Wire person UI**

In `InterrogationScene` and `NetworkInvestigationScene`:
- replace “one action reads/solves a bundle” for core Zhao/Du breakthroughs with evidence picker + `resolveEvidenceReaction`;
- show the response and reaction mood;
- on irrelevant evidence, show meaningful character line rather than “错误”；
- expose “打开案卷选证据” if no useful evidence is selected.

- [ ] **Step 5: Add Dossier reverse action**

In People page and Evidence page in `CaseNavigator.tsx`, add callbacks that dispatch:

```ts
dispatch({ type: 'SET_DOSSIER_TARGET', target: { kind: 'person', id: characterId } });
```

and route to the relevant person scene through the existing scene navigation callback. Do not add a second router.

- [ ] **Step 6: Run tests**

```bash
npx vitest run src/game/rules/evidenceReaction.test.ts src/features/scenes/GameShell.test.tsx
```

Expected: PASS. Record `CHECKPOINTS/core-loop-task-04.txt`.

---

### Task 5: Turn the dossier into a knowledge hub with reverse navigation

**Files:**
- Modify: `app/src/features/scenes/CaseNavigator.tsx`
- Create: `app/src/ui/game/KnowledgeStatusBadge.tsx`
- Create: `app/src/ui/game/ObjectiveRail.tsx`
- Modify: `app/src/ui/game/game.css`
- Modify: `app/src/features/scenes/v09.css`

**Interfaces:**
- Consumes: selectors from Task 1, objective config, `selectedDossierTarget`.
- Produces: dossier tabs/actions that navigate to person/document/theory targets; persistent objective rail used outside full-screen CG.

- [ ] **Step 1: Add failing scene contract test**

Extend `GameShell.test.tsx` or create a focused Dossier test asserting:

```ts
expect(screen.getByText(/当前目标/)).toBeInTheDocument();
expect(screen.getByRole('button', { name: /前去询问/ })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /加入推演/ })).toBeInTheDocument();
```

- [ ] **Step 2: Run and verify failure**

Run focused test; expected controls absent.

- [ ] **Step 3: Implement `KnowledgeStatusBadge`**

Map states exactly:
- observed → `已见`
- suspected → `推测`
- contradicted → `矛盾`
- supported → `有证`
- verified → `已验证`
- excluded → `已排除`

Use existing `GameBadge`; no new color system outside v0.9 tokens.

- [ ] **Step 4: Implement `ObjectiveRail`**

Props:

```ts
interface ObjectiveRailProps {
  title: string;
  question: string;
  directionCount: number;
  activeCue?: { id: string; text: string; onDismiss: () => void };
  onOpenDossier: () => void;
  onRequestHint: () => void;
}
```

It must show only objective + direction count by default. `activeCue` is a small non-modal inline strip.

- [ ] **Step 5: Rebuild dossier core tabs**

Priority order:
1. 当前目标
2. 人物
3. 文书
4. 线索 / 事实
5. 泄密链
6. 敌军回声
7. 历史 / 教程 / 设置

Each person/document/knowledge item must have at least one reverse action:
- `前去询问`
- `查看原件`
- `查看关联人物`
- `加入推演`

Use existing `GameButton`; keep one detail pane rather than card wall.

- [ ] **Step 6: Add CSS acceptance rules**

At 1366×768:
- dossier detail pane remains scrollable inside Sheet;
- no page-level horizontal scroll;
- action rows wrap to next line;
- ObjectiveRail does not cover SceneHeader.

- [ ] **Step 7: Run scene tests and checkpoint**

Run relevant Testing Library tests and `npm run verify:v094`. Expected PASS. Record `CHECKPOINTS/core-loop-task-05.txt`.

---

### Task 6: Replace the three-answer network deduction with a persistent theory graph and gaps

**Files:**
- Create: `app/src/game/rules/theory.ts`
- Create: `app/src/game/rules/theory.test.ts`
- Modify: `app/src/features/scenes/NetworkDeductionScene.tsx`
- Modify: `app/src/features/scenes/CaseNavigator.tsx`
- Modify: `app/src/features/scenes/v09.css`

**Interfaces:**
- Consumes: `TheoryNode`, `TheoryEdge`, current KnowledgeEntry statuses.
- Produces: `evaluateTheory(state, proposedEdges)`, persistent graph in `state.coreLoop`, clickable `TheoryGap` with dossier suggestions.

- [ ] **Step 1: Write failing theory tests**

```ts
it('returns missing-route instead of wrong when Zhao explains only the time leak', () => {
  const result = evaluateTheory(stateWithSupportedZhao, [
    { id: 'edge-time-zhao', fromId: 'info-time', toId: 'person-zhao', relation: 'accessedBy', status: 'proposed' },
  ]);
  expect(result.status).toBe('incomplete');
  expect(result.gaps.some((gap) => gap.kind === 'missing-route')).toBe(true);
  expect(result.gaps.flatMap((gap) => gap.suggestedPersonIds)).toContain('du');
});

it('supports the frozen four-part chain before bait validation', () => {
  const result = evaluateTheory(stateWithCoreKnowledge, fullFrozenChainEdges);
  expect(result.status).toBe('supported');
});
```

- [ ] **Step 2: Run and verify failure**

Run `npx vitest run src/game/rules/theory.test.ts`.

- [ ] **Step 3: Implement theory evaluator**

Evaluator checks four concepts, not fixed UI answers:
1. time source supported by Zhao;
2. route inference supported by Du + peripheral knowledge;
3. integration occurs on Du side;
4. transmission reaches Yuan army via supported transmission evidence.

Return gaps with suggestions. Never return plain boolean.

- [ ] **Step 4: Rebuild NetworkDeductionScene**

Replace three-question form with a compact persistent board:
- left rail: available supported/suspected knowledge chips;
- center: theory slots/edges;
- right/bottom: current gap explanation;
- buttons: `验证当前理论`, `回案卷查缺口`, `进入投饵` only when supported.

First version can use existing DnD / click-to-place; no React Flow.

- [ ] **Step 5: Make gaps reverse-navigable**

Clicking a `missing-route` gap dispatches:

```ts
{ type: 'SET_DOSSIER_TARGET', target: { kind: 'gap', id: 'gap-route' } }
```

and opens dossier filtered to suggested `du`, relevant docs, and knowledge.

- [ ] **Step 6: Persist evaluation**

Every validation dispatches `SET_THEORY_GRAPH`. Increment guidance invalid-theory count only when evaluation is `incomplete` or `conflicted` and no new progress occurred.

- [ ] **Step 7: Run tests/checkpoint**

Run theory tests + `GameShell.test.tsx` + existing relationship tests. Record `CHECKPOINTS/core-loop-task-06.txt`.

---

### Task 7: Implement B-mode guidance with light proactive cues and three manual levels

**Files:**
- Create: `app/src/game/rules/guidance.ts`
- Create: `app/src/game/rules/guidance.test.ts`
- Modify: `app/src/features/scenes/CaseNavigator.tsx`
- Modify: `app/src/ui/game/HintPanel.tsx`
- Modify: `app/src/ui/game/ObjectiveRail.tsx`

**Interfaces:**
- Consumes: `guanduGuidanceCues`, `GuidanceState`, theory gaps, unused evidence.
- Produces: `nextProactiveCue`, `requestManualHint`, `resolveGuidanceForProgress`.

- [ ] **Step 1: Write failing guidance tests**

```ts
it('shows the same proactive cue at most once', () => {
  const first = nextProactiveCue(stateWithRouteGap, cues, 130_000);
  expect(first?.id).toBe('cue-route-gap');
  const shown = markCueShown(stateWithRouteGap, 'cue-route-gap');
  expect(nextProactiveCue(shown, cues, 140_000)).toBeUndefined();
});

it('manual hint advances only to level three', () => {
  let state = createInitialState();
  state = requestManualHint(state, 'cue-route-gap');
  state = requestManualHint(state, 'cue-route-gap');
  state = requestManualHint(state, 'cue-route-gap');
  state = requestManualHint(state, 'cue-route-gap');
  expect(state.coreLoop.guidance.manualHintLevels['cue-route-gap']).toBe(3);
});
```

- [ ] **Step 2: Run and confirm failure**

Run `npx vitest run src/game/rules/guidance.test.ts`.

- [ ] **Step 3: Implement trigger rules**

`nextProactiveCue()` checks in this order:
1. new theory gap;
2. two invalid-theory attempts;
3. unused evidence for current objective;
4. stalled progress (`now - lastProgressAt >= 120_000`).

A cue whose status is `shown`, `dismissed`, or `resolved` must not auto-show again.

- [ ] **Step 4: Integrate manual hints**

CaseNavigator “提示” button:
- finds cue for current objective / current gap;
- first click displays level1;
- second level2 and adds temporary highlight target IDs;
- third level3;
- fourth remains level3, no answer layer.

Preserve legacy `hintUsage` by mirroring the selected manual level for save compatibility.

- [ ] **Step 5: Resolve cues on progress**

When associated knowledge becomes `supported` or gap disappears, mark cue `resolved` and remove inline ObjectiveRail cue.

- [ ] **Step 6: Run tests/checkpoint**

Run guidance tests + CaseNavigator-related tests. Record `CHECKPOINTS/core-loop-task-07.txt`.

---

### Task 8: Make bait an experiment driven by the supported theory

**Files:**
- Modify: `app/src/game/rules/bait.ts`
- Modify: `app/src/game/rules/bait.test.ts`
- Modify: `app/src/features/scenes/BaitScene.tsx`
- Modify: `app/src/features/scenes/EnemyReportScene.tsx`
- Create: `app/src/game/rules/enemyFeedback.ts`
- Create: `app/src/game/rules/enemyFeedback.test.ts`

**Interfaces:**
- Consumes: supported TheoryEdge IDs, existing `BaitOption` content.
- Produces: `BaitExperiment`, `EnemyFeedback`, verified/rejected TheoryEdge status updates.

- [ ] **Step 1: Replace old four-channel test with theory-driven tests**

Add:

```ts
it('allows a coherent Zhao + Du experiment without forcing Lu and Zheng', () => {
  const result = evaluateBaitExperiment(content, {
    knownClaimIds: coreKnownClaims,
    theoryEdgeIds: coreTheoryEdges.map((edge) => edge.id),
    baitIds: ['bait-zhao-chou', 'bait-du-southFord'],
    realPlan: { route: 'northBridge', time: 'zi' },
  });
  expect(result.experiment.status).toBe('deployed');
  expect(result.expectedSignals.length).toBeGreaterThan(0);
});
```

Keep a compatibility test for the old four-channel inputs so old saves can still resolve.

- [ ] **Step 2: Implement `evaluateBaitExperiment`**

Rules:
- core supported theory requires at least one Zhao bait and one Du bait for a full validation experiment;
- Lu/Zheng baits are optional control/noise channels;
- UI must explain the hypothesis before deploy;
- selected bait credibility still checks `requiredClaimIds`.

- [ ] **Step 3: Rebuild BaitScene around hypothesis**

Show:
- “你正在验证什么？”
- supported theory edges being tested;
- core channel selectors Zhao / Du first;
- optional “加入对照渠道” for Lu/Zheng;
- expected signal preview;
- one deploy button.

Do not render four channels as mandatory equal-weight steps.

- [ ] **Step 4: Create enemy feedback rule**

`createEnemyFeedback(experiment, resolution)` returns one or more feedback items such as scout movement, market signal, intercept, or no-response and corresponding supported/contradicted edge IDs.

- [ ] **Step 5: Update EnemyReportScene**

On review:
- dispatch `ADD_ENEMY_FEEDBACK`;
- promote supported theory edges to `verified` only when feedback matches both core channels;
- if only one core channel matches, leave theory `supported`/partial and show “另一条链仍未验证”；
- offer `回案卷继续调查` when not verified;
- only unlock final Cao Cao/report path after `theoryEvaluation.status === 'verified'`.

- [ ] **Step 6: Run tests/checkpoint**

Run bait + enemy feedback tests and existing ending/report tests. Record `CHECKPOINTS/core-loop-task-08.txt`.

---

### Task 9: Add v5→v6 persistence migration without losing existing progress

**Files:**
- Modify: `app/src/game/contentSchema.ts`
- Modify: `app/src/game/persistence.ts`
- Modify: `app/src/game/persistence.test.ts`
- Modify: `app/src/game/saveSlots.test.ts`

**Interfaces:**
- Consumes: legacy v5 state.
- Produces: valid v6 state with inferred KnowledgeEntry/theory/guidance defaults.

- [ ] **Step 1: Write failing migration tests**

```ts
it('migrates v5 claims into observed knowledge and preserves presentation', () => {
  const old = { ...createLegacyV5Fixture(), extractedClaimIds: ['claim-zhao-time'], relationships: legacyCoreRelationships };
  const migrated = deserializeGameState(JSON.stringify(old));
  expect(migrated.version).toBe(6);
  expect(migrated.coreLoop.knowledge['claim-zhao-time']?.status).toBe('observed');
  expect(migrated.presentation.sceneId).toBe(old.presentation.sceneId);
});
```

- [ ] **Step 2: Run and confirm failure**

Run `npx vitest run src/game/persistence.test.ts src/game/saveSlots.test.ts`.

- [ ] **Step 3: Extend schema**

Add optional legacy-safe `coreLoop` parsing and normalize to complete v6 values. Keep version 5 accepted as an input migration shape; serialized output is always version 6.

- [ ] **Step 4: Infer migrated core-loop state**

For each old `extractedClaimId`: create `observed` KnowledgeEntry.
For old frozen relationships matching the core chain: create `supported` TheoryEdge only if the corresponding Claim IDs already exist; otherwise proposed/incomplete.
`selectedBaitIds`, `enemyReport`, `baitBand` remain intact and may create a resolved legacy experiment only if enough data exists.

- [ ] **Step 5: Run persistence tests/checkpoint**

Expected PASS. Record `CHECKPOINTS/core-loop-task-09.txt`.

---

### Task 10: End-to-end core loop playthrough and delivery contract

**Files:**
- Create: `app/src/features/scenes/CoreLoopPlaythrough.test.tsx`
- Create: `app/scripts/verify-v095-core-loop.cjs`
- Modify: `app/package.json`
- Modify: `FINAL_DELIVERY_AUDIT_v0.9.4.md` or create v0.9.5 audit at project root
- Modify: `官渡密报_产品与技术设计草案_v0.3.md`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: one automated smoke path proving the loop can travel forward and backward without dead ends.

- [ ] **Step 1: Write the playthrough test before final UI cleanup**

The test must prove this sequence:

```text
new game
→ discover Zhao time evidence
→ dossier auto-indexes it
→ dossier/person jump
→ show evidence to Zhao
→ knowledge becomes supported
→ open theory early
→ receive missing-route gap
→ return to dossier and Du
→ discover Du route fragments
→ show price evidence to Du
→ theory becomes supported
→ create Zhao+Du bait experiment
→ enemy feedback verifies both edges
→ dossier shows verified network
→ final report path becomes available
```

Assert at least one wrong evidence presentation and one incomplete theory attempt do not dead-end the run.

- [ ] **Step 2: Run test and fix any integration failures**

Run:

```bash
npx vitest run src/features/scenes/CoreLoopPlaythrough.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Add static delivery contract**

`verify-v095-core-loop.cjs` must assert:
- `GameState.version === 6` appears in domain/initial state;
- knowledge/theory/guidance/bait experiment files exist;
- NetworkDeduction no longer contains the old `questions: Array<{ key: TheoryKey` three-answer pattern;
- bait rule no longer requires exactly four channels;
- CaseNavigator renders current objective and knowledge/gap tabs;
- EnemyReport exposes a return-to-investigation route when unverified.

- [ ] **Step 4: Add npm verification scripts**

Add:

```json
"verify:v095": "npm run verify:v094 && node scripts/verify-v095-core-loop.cjs",
"verify:v095:deep": "npm run verify:v095 && node scripts/verify-v09-runtime-lite.cjs && node scripts/verify-v09-syntax.cjs"
```

Set `verify:final` to `npm run verify:v095:deep`.

- [ ] **Step 5: Run full verification**

Run in this order:

```bash
npm run verify:v095
npm run verify:v095:deep
npm run test:run
npm run build
npm run lint
```

If dependency/native binding installation prevents the last three commands, record the exact environment error separately; do not mark them passed.

- [ ] **Step 6: Manual 1366×768 acceptance**

Check:
- objective always visible outside full-screen CG;
- dossier actions fit without horizontal overflow;
- wrong evidence returns a line and remains playable;
- gap click points back to relevant person/doc;
- supported theory visibly unlocks bait;
- partial enemy response offers return to investigation;
- verified response updates dossier and unlocks final report.

- [ ] **Step 7: Update design/product docs and delivery audit**

Create `FINAL_DELIVERY_AUDIT_v0.9.5.md` with sections:
- implemented;
- partially implemented;
- deliberately deferred;
- test evidence;
- remaining user-playtest risks.

Update product draft so v0.9.5 core-loop specification supersedes old “linear NetworkInvestigation → NetworkDeduction → Bait” language.

- [ ] **Step 8: Record final checkpoint**

Create `CHECKPOINTS/core-loop-final.txt` listing every executed verification command and its actual result.

