# 《官渡密报》新手引导与第一段可玩推理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让首次进入《官渡密报》的玩家无需口头说明，即可完成开场、第一条主张提取、笔迹调查、赵简审讯和第一条矛盾关系。

**Architecture:** 保留现有案件 `Stage`，在 `GameState` 中增加独立、可迁移的 `TutorialState`。开始界面、开场卡、教学推进器和目标提示只观察或触发真实 reducer/rule 状态；调查、审讯和关系板继续复用正式规则，不建立教学专用作弊路径。

**Tech Stack:** React、TypeScript、Vite、Vitest、React Testing Library、Playwright、现有 Zod/domain/reducer/persistence/rules/content。

**Spec:** `docs/superpowers/specs/2026-08-25-guandu-onboarding-design.md`

## Global Constraints

- 开始本计划前必须完成原计划 Task 11 fix round 2，并通过 scoped re-review。
- 案件 `Stage` 仍从 `documents` 开始；教学状态与案件阶段分离。
- 新游戏从 `notStarted` 开始；旧 v1 存档迁移后教学状态为 `skipped`。
- 教学步骤只能由真实 `GameState` 条件或明确的开始/继续/跳过动作推进。
- 跳过引导不得赠送 claim、扣调查点、增加 relationship 或推进 Stage。
- 正确教学路径只消耗 `investigate-handwriting` 的 1 个调查点。
- 第一张文书 claim 使用 `claim-shuoyuan-received`；不得提前提取 investigation provenance 的 `claim-ambush-north`。
- 赵简矛盾必须使用 `claim-zhao-denial` 与 `claim-zhao-copied-order`，审讯揭示 `claim-zhao-time`。
- 第一条关系必须走正式 tuple：`claim-zhao-copied-order → claim-zhao-denial / refutes / leakedInfo`。
- `recovered/corrupt/unsupported` 存档必须先决议，开始界面不能覆盖原始存档。
- 教学期间隐藏投饵、最终汇报和政治结尾；教学完成前不能结束当前阶段。
- 所有引导必须可用键盘和屏幕阅读器完成；不能只用颜色、动画或坐标。
- 无倒计时、随机、网络、服务器、账号、数据库或遥测。
- 每个任务严格 TDD：真实 RED → 最小 GREEN → 全量测试/build/lint → 独立提交与审查。

## Planned File Map

```text
app/src/
├─ game/
│  ├─ domain.ts
│  ├─ contentSchema.ts
│  ├─ initialState.ts
│  ├─ reducer.ts
│  ├─ persistence.ts
│  └─ tutorial/
│     ├─ tutorialProgress.ts
│     └─ tutorialProgress.test.ts
├─ app/
│  ├─ App.tsx
│  └─ ExperienceRouter.tsx
├─ test/
│  └─ GameStateProbe.tsx
├─ features/
│  ├─ onboarding/
│  │  ├─ StartScreen.tsx
│  │  ├─ IntroSequence.tsx
│  │  ├─ PendingSaveDecision.tsx
│  │  ├─ TutorialController.tsx
│  │  ├─ TutorialObjective.tsx
│  │  ├─ TutorialCompletion.tsx
│  │  ├─ TutorialViewContext.tsx
│  │  └─ onboarding.css
│  ├─ investigation/
│  │  └─ InvestigationPanel.tsx
│  └─ interrogation/
│     └─ InterrogationPanel.tsx
└─ e2e/
   └─ onboarding.spec.ts
```

---

### Task 1: Tutorial State, Reducer Actions, and Save Migration

**Files:**
- Modify: `app/src/game/domain.ts`
- Modify: `app/src/game/contentSchema.ts`
- Modify: `app/src/game/contentSchema.test.ts`
- Modify: `app/src/game/initialState.ts`
- Modify: `app/src/game/reducer.ts`
- Modify: `app/src/game/reducer.test.ts`
- Modify: `app/src/game/persistence.ts`
- Modify: `app/src/game/persistence.test.ts`

**Interfaces:**
- Consumes: existing `GameState`, reducer and versioned persistence.
- Produces: `TutorialStep`, `TutorialState`, v2 `GameState`, v1→v2 migration, `SET_TUTORIAL_STEP`, `RESET_TUTORIAL`, `APPLY_RULE_STATE`.

- [ ] **Step 1: Write failing domain and migration tests**

```ts
it('creates a version 2 new game at the notStarted tutorial step', () => {
  expect(createInitialState()).toMatchObject({
    version: 2,
    tutorial: { step: 'notStarted', startedAtLeastOnce: false },
  });
});

it('migrates a valid version 1 save without forcing onboarding', () => {
  const { tutorial: _tutorial, ...currentWithoutTutorial } = createInitialState();
  const legacy = { ...currentWithoutTutorial, version: 1 };
  expect(migrateGameState(legacy)).toMatchObject({
    version: 2,
    tutorial: { step: 'skipped', startedAtLeastOnce: true },
  });
});

it('still rejects an unknown numeric version even when a snapshot exists', () => {
  localStorage.setItem('guandu.current', JSON.stringify({ version: 99 }));
  saveStageSnapshot(localStorage, createInitialState());
  expect(loadGame(localStorage)).toEqual({ kind: 'unsupported', version: 99 });
});
```

- [ ] **Step 2: Run RED**

Run:

```powershell
cd app
npm run test:run -- src/game/contentSchema.test.ts src/game/reducer.test.ts src/game/persistence.test.ts
```

Expected: FAIL because v2 tutorial fields and migration do not exist.

- [ ] **Step 3: Define exact tutorial contracts**

```ts
export type TutorialStep =
  | 'notStarted' | 'introIdentity' | 'introIncident' | 'introObjective'
  | 'openAmbushReport' | 'extractAmbushClaim' | 'openZhaoStatement'
  | 'extractZhaoDenial' | 'investigateHandwriting' | 'interrogateZhao'
  | 'placeContradiction' | 'completed' | 'skipped';

export interface TutorialState {
  step: TutorialStep;
  startedAtLeastOnce: boolean;
}

export interface GameState {
  version: 2;
  tutorial: TutorialState;
}
```

Modify the existing `GameState` interface in place: change only `version` from literal `1` to literal `2`, add required `tutorial`, and retain every pre-existing field and type exactly.

Add matching required Zod schemas. Keep a `LegacyGameStateV1Schema` with the exact pre-tutorial fields and `version: 1`.

- [ ] **Step 4: Implement migration and reducer actions**

```ts
export function migrateGameState(input: unknown): GameState {
  const version = z.object({ version: z.number() }).passthrough().parse(input).version;
  if (version === 2) return validateGameState(input);
  if (version === 1) {
    const legacy = LegacyGameStateV1Schema.parse(input);
    return validateGameState({
      ...legacy,
      version: 2,
      tutorial: { step: 'skipped', startedAtLeastOnce: true },
    });
  }
  throw new Error(`Unsupported game state version: ${version}`);
}
```

Add actions:

```ts
| { type: 'SET_TUTORIAL_STEP'; step: TutorialStep }
| { type: 'RESET_TUTORIAL' }
| { type: 'APPLY_RULE_STATE'; state: GameState }
```

`SET_TUTORIAL_STEP` changes only tutorial fields. `RESET_TUTORIAL` sets `notStarted/false` and changes no case evidence. `APPLY_RULE_STATE` returns the supplied validated rule result and does not unlock a pending persistence gate like `RESTORE_STATE` does.

- [ ] **Step 5: Update persistence parsing**

In `persistence.ts`, inspect the parsed numeric version before migration. Versions other than 1 or 2 throw the existing private `UnsupportedSaveVersionError`; versions 1 and 2 call `migrateGameState`. Existing unsupported, non-overwrite and recovery behavior remains unchanged.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
npm run test:run -- src/game/contentSchema.test.ts src/game/reducer.test.ts src/game/persistence.test.ts
npm run test:run
npm run build
npm run lint
git diff --check
git add app/src/game
git commit -m "feat: add versioned tutorial state"
```

---

### Task 2: State-Driven Tutorial Progress Engine

**Files:**
- Create: `app/src/game/tutorial/tutorialProgress.ts`
- Create: `app/src/game/tutorial/tutorialProgress.test.ts`

**Interfaces:**
- Consumes: v2 `GameState`.
- Produces: `deriveTutorialStep(state): TutorialStep`, `isTutorialComplete(state): boolean`, `tutorialObjective(step): TutorialObjective`.

- [ ] **Step 1: Write failing progression tests**

```ts
const tutorialStateAt = (step: TutorialStep): GameState => ({
  ...createInitialState(),
  tutorial: { step, startedAtLeastOnce: true },
});

it('advances gameplay steps only from real state', () => {
  let state = tutorialStateAt('openAmbushReport');
  expect(deriveTutorialStep(state)).toBe('openAmbushReport');

  state = { ...state, readDocumentIds: ['report-ambush'] };
  expect(deriveTutorialStep(state)).toBe('extractAmbushClaim');

  state = { ...state, extractedClaimIds: ['claim-shuoyuan-received'] };
  expect(deriveTutorialStep(state)).toBe('openZhaoStatement');
});

it('requires the real handwriting investigation, interrogation reveal, and relationship tuple', () => {
  const state = tutorialStateAt('investigateHandwriting');
  expect(deriveTutorialStep(state)).toBe('investigateHandwriting');
  expect(deriveTutorialStep({ ...state, completedInvestigationIds: ['investigate-handwriting'] }))
    .toBe('interrogateZhao');
});

it('skip changes no case state', () => {
  const before = createInitialState();
  const after = gameReducer(before, { type: 'SET_TUTORIAL_STEP', step: 'skipped' });
  expect({ ...after, tutorial: before.tutorial }).toEqual(before);
});
```

- [ ] **Step 2: Run RED**

Run: `npm run test:run -- src/game/tutorial/tutorialProgress.test.ts`

Expected: FAIL because the progress engine does not exist.

- [ ] **Step 3: Implement monotonic derivation**

For intro, terminal and skipped steps, return the stored step. For gameplay steps, check this ordered contract and return the first unmet step at or after the stored step:

```ts
const requirements = [
  ['openAmbushReport', (s: GameState) => s.readDocumentIds.includes('report-ambush')],
  ['extractAmbushClaim', (s: GameState) => s.extractedClaimIds.includes('claim-shuoyuan-received')],
  ['openZhaoStatement', (s: GameState) => s.readDocumentIds.includes('statement-zhao')],
  ['extractZhaoDenial', (s: GameState) => s.extractedClaimIds.includes('claim-zhao-denial')],
  ['investigateHandwriting', (s: GameState) => s.completedInvestigationIds.includes('investigate-handwriting')],
  ['interrogateZhao', (s: GameState) => s.extractedClaimIds.includes('claim-zhao-time')],
  ['placeContradiction', (s: GameState) => s.relationships.some((r) =>
    r.fromId === 'claim-zhao-copied-order'
      && r.toId === 'claim-zhao-denial'
      && r.kind === 'refutes'
      && r.slot === 'leakedInfo')],
] as const;
```

When all gameplay requirements are met, return `completed`. Never regress to an earlier step because an old relationship is currently hidden by UI; the saved state remains exact.

- [ ] **Step 4: Implement objective copy as data**

```ts
export interface TutorialObjective {
  title: string;
  reason: string;
  requestedView: 'documents' | 'relationships' | 'none';
  targetId?: string;
}
```

Return exact `title`, `reason`, `requestedView`, and optional stable `targetId` for every step. Copy must match the approved spec and must not mention Du Heng's route or the price cipher.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:run -- src/game/tutorial/tutorialProgress.test.ts
npm run test:run
npm run build
npm run lint
git add app/src/game/tutorial
git commit -m "feat: derive onboarding from real game state"
```

---

### Task 3: Start Screen, Intro Sequence, and Save Decision Gate

**Files:**
- Modify: `app/src/app/App.tsx`
- Create: `app/src/app/ExperienceRouter.tsx`
- Create: `app/src/features/onboarding/StartScreen.tsx`
- Create: `app/src/features/onboarding/IntroSequence.tsx`
- Create: `app/src/features/onboarding/PendingSaveDecision.tsx`
- Create: `app/src/features/onboarding/StartScreen.test.tsx`
- Create: `app/src/features/onboarding/PendingSaveDecision.test.tsx`
- Create: `app/src/test/GameStateProbe.tsx`

**Interfaces:**
- Consumes: `useGame()`, v2 tutorial state, `RESTORE_STATE` persistence gate.
- Produces: fresh/continue/skip/recovery routing before `IntelDesk`.

Create the shared state probe used only by component tests:

```tsx
export function GameStateProbe() {
  const { state } = useGame();
  return <output data-testid="game-state">{JSON.stringify(state)}</output>;
}

export function readGameState(): GameState {
  return JSON.parse(screen.getByTestId('game-state').textContent ?? 'null') as GameState;
}
```

Tests that call `readGameState()` render `<GameStateProbe />` as a sibling of the component under test.

- [ ] **Step 1: Write failing entry-flow tests**

```tsx
it('does not drop a new player directly onto the intelligence desk', async () => {
  renderGame(<ExperienceRouter />);
  expect(screen.getByRole('heading', { name: '官渡密报' })).toBeVisible();
  expect(screen.getByRole('button', { name: '开始调查' })).toBeEnabled();
  expect(screen.queryByRole('region', { name: '情报匣' })).not.toBeInTheDocument();
});

it('skip keeps all case progress untouched', async () => {
  const user = userEvent.setup();
  const before = createInitialState();
  renderGame(<><ExperienceRouter /><GameStateProbe /></>, before);
  await user.click(screen.getByRole('button', { name: '跳过引导' }));
  expect(readGameState()).toMatchObject({
    stage: 'documents', investigationPoints: 3,
    extractedClaimIds: [], completedInvestigationIds: [], relationships: [],
    tutorial: { step: 'skipped', startedAtLeastOnce: true },
  });
});

it('restarts only the tutorial while preserving case evidence', async () => {
  const user = userEvent.setup();
  const progressed = {
    ...createInitialState(),
    extractedClaimIds: ['claim-zhao-denial'],
    tutorial: { step: 'completed', startedAtLeastOnce: true },
  };
  renderGame(<><ExperienceRouter /><GameStateProbe /></>, progressed);
  await user.click(screen.getByRole('button', { name: '重新体验引导' }));
  expect(readGameState()).toMatchObject({
    extractedClaimIds: ['claim-zhao-denial'],
    tutorial: { step: 'introIdentity', startedAtLeastOnce: true },
  });
});
```

- [ ] **Step 2: Write failing pending-save tests**

```tsx
function pendingStorage(kind: 'recovered' | 'corrupt' | 'unsupported'): Storage {
  const storage = createMemoryStorage();
  if (kind === 'recovered') {
    saveStageSnapshot(storage, { ...createInitialState(), stage: 'chain' });
    storage.setItem('guandu.current', '{broken current');
  } else if (kind === 'corrupt') {
    storage.setItem('guandu.current', '{broken current');
  } else {
    storage.setItem('guandu.current', JSON.stringify({ version: 99 }));
  }
  return storage;
}

function renderPendingDecision(kind: 'recovered' | 'corrupt' | 'unsupported', storage: Storage) {
  return render(
    <GameProvider storage={storage}>
      <ExperienceRouter />
      <GameStateProbe />
    </GameProvider>,
  );
}

it.each(['recovered', 'corrupt', 'unsupported'] as const)(
  'does not overwrite a pending %s save before a decision', async (kind) => {
    const storage = pendingStorage(kind);
    const before = storage.getItem('guandu.current');
    renderPendingDecision(kind, storage);
    expect(storage.getItem('guandu.current')).toBe(before);
  },
);
```

For `recovered`, show “恢复有效快照” and “开始新游戏”. For `corrupt/unsupported`, show the exact error and require confirmation before a new game. The chosen path dispatches `RESTORE_STATE`, opening Task 10's persistence gate. Use the explicit `pendingStorage` setup above; assertions compare against the raw current string captured before rendering.

- [ ] **Step 3: Run RED**

Run: `npm run test:run -- src/features/onboarding/StartScreen.test.tsx src/features/onboarding/PendingSaveDecision.test.tsx`

- [ ] **Step 4: Implement entry routing**

`App` remains `ErrorBoundary → GameProvider → ExperienceRouter`. `ExperienceRouter` uses local session UI state only to decide whether the user has pressed start/continue during this page load.

Routing order:

1. pending `recovered/corrupt/unsupported` → `PendingSaveDecision`;
2. not entered this page load → `StartScreen`;
3. intro step → `IntroSequence`;
4. otherwise → `IntelDesk`.

`开始调查` dispatches `introIdentity`; three “继续” presses dispatch `introIncident`, `introObjective`, then `openAmbushReport`. `跳过引导` dispatches `skipped`. A progressed save shows `继续调查` and enters its exact saved step. Completed/skipped saves also show `重新体验引导`; it dispatches `RESET_TUTORIAL` followed by `introIdentity`, preserving all non-tutorial state.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:run -- src/features/onboarding/StartScreen.test.tsx src/features/onboarding/PendingSaveDecision.test.tsx
npm run test:run
npm run build
npm run lint
git add app/src/app app/src/features/onboarding
git commit -m "feat: add onboarding entry and intro"
```

---

### Task 4: Reusable Investigation and Interrogation UI for the Tutorial

**Files:**
- Create: `app/src/features/investigation/InvestigationPanel.tsx`
- Create: `app/src/features/investigation/InvestigationPanel.test.tsx`
- Create: `app/src/features/interrogation/InterrogationPanel.tsx`
- Create: `app/src/features/interrogation/InterrogationPanel.test.tsx`
- Modify: `app/src/features/desk/ActionBar.tsx`

**Interfaces:**
- Consumes: `applyInvestigation`, `resolveInterrogation`, `APPLY_RULE_STATE`, tutorial step.
- Produces: generic panels reusable by original Task 12, with tutorial-allowed IDs.

- [ ] **Step 1: Write failing investigation UI test**

```tsx
it('spends one point and reveals handwriting only after confirmation', async () => {
  const user = userEvent.setup();
  renderGame(<><InvestigationPanel allowedIds={['investigate-handwriting']} /><GameStateProbe /></>);
  await user.click(screen.getByRole('button', { name: '核对集合命令笔迹' }));
  expect(screen.getByText('将消耗 1 个调查点')).toBeVisible();
  await user.click(screen.getByRole('button', { name: '确认调查' }));
  expect(readGameState()).toMatchObject({
    investigationPoints: 2,
    completedInvestigationIds: ['investigate-handwriting'],
    extractedClaimIds: expect.arrayContaining(['claim-zhao-copied-order']),
  });
});
```

- [ ] **Step 2: Write failing interrogation UI test**

```tsx
const preparedZhaoState: GameState = {
  ...createInitialState(),
  investigationPoints: 2,
  completedInvestigationIds: ['investigate-handwriting'],
  extractedClaimIds: ['claim-zhao-denial', 'claim-zhao-copied-order'],
  tutorial: { step: 'interrogateZhao', startedAtLeastOnce: true },
};

it('uses the real Zhao contradiction and spends no point', async () => {
  const user = userEvent.setup();
  renderGame(<><InterrogationPanel characterId="zhao" /><GameStateProbe /></>, preparedZhaoState);
  await user.selectOptions(screen.getByLabelText('选择口供'), 'claim-zhao-denial');
  await user.selectOptions(screen.getByLabelText('选择证据'), 'claim-zhao-copied-order');
  await user.click(screen.getByRole('radio', { name: '冷静追问' }));
  await user.click(screen.getByRole('button', { name: '提交质询' }));
  expect(readGameState()).toMatchObject({
    investigationPoints: 2,
    extractedClaimIds: expect.arrayContaining(['claim-zhao-time']),
  });
});
```

- [ ] **Step 3: Run RED**

Run: `npm run test:run -- src/features/investigation src/features/interrogation`

- [ ] **Step 4: Implement panels through real rules**

`InvestigationPanel` renders content investigations filtered by optional `allowedIds`; completed/insufficient items are disabled with reasons. Confirmation calls `applyInvestigation(content, state, id)` then dispatches `APPLY_RULE_STATE`.

`InterrogationPanel` lists only extracted statement/evidence claims that match content rules. Tone changes response text/person state but not breakthrough. Submission calls `resolveInterrogation` then `APPLY_RULE_STATE`.

Add `调查` and `审讯` actions to `ActionBar`; during tutorial they are hidden until the corresponding step, then open one mutually exclusive modal using the existing modal pattern.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:run -- src/features/investigation src/features/interrogation src/features/desk
npm run test:run
npm run build
npm run lint
git add app/src/features/investigation app/src/features/interrogation app/src/features/desk
git commit -m "feat: add evidence-led investigation UI"
```

---

### Task 5: Tutorial Controller, Objectives, View Switching, and Completion

**Files:**
- Create: `app/src/features/onboarding/TutorialController.tsx`
- Create: `app/src/features/onboarding/TutorialObjective.tsx`
- Create: `app/src/features/onboarding/TutorialCompletion.tsx`
- Create: `app/src/features/onboarding/TutorialViewContext.tsx`
- Create: `app/src/features/onboarding/TutorialController.test.tsx`
- Modify: `app/src/features/desk/IntelDesk.tsx`
- Modify: `app/src/features/desk/TopBar.tsx`
- Modify: `app/src/features/desk/Workspace.tsx`
- Modify: `app/src/features/desk/ActionBar.tsx`
- Modify: `app/src/features/documents/DocumentDesk.tsx`
- Modify: `app/src/features/board/RelationshipBoard.tsx`
- Create: `app/src/features/onboarding/onboarding.css`

**Interfaces:**
- Consumes: tutorial progress engine and all real UI controls.
- Produces: guided target, reason, requested view, feature gates, completion transition.

- [ ] **Step 1: Write failing guided-flow component test**

Render `TutorialController` from `openAmbushReport`, then perform the real UI actions. Assert exact ordered objectives:

```text
先看看粮队在哪里、何时遭到伏击。
把可以用于推理的事实提取成主张卡。
找出谁声称不知道粮队的出发时辰。
口供只是说法。去确认集合命令由谁抄写。
选择赵简的口供，再提交与之矛盾的亲笔命令。
把亲笔命令放入关系板，反驳赵简的口供。
```

Each transition must follow a real state mutation. Before the required mutation, clicking unrelated views or closing a modal must not advance.

```tsx
it('does not advance the objective until the real requirement exists', async () => {
  const user = userEvent.setup();
  renderTutorialAt('openAmbushReport');
  expect(screen.getByRole('status')).toHaveTextContent('先看看粮队在哪里、何时遭到伏击。');
  await user.click(screen.getByRole('tab', { name: '路线图' }));
  expect(screen.getByRole('status')).toHaveTextContent('先看看粮队在哪里、何时遭到伏击。');
  await user.click(screen.getByRole('button', { name: '打开文书：残缺伏击军报' }));
  expect(screen.getByRole('status')).toHaveTextContent('把可以用于推理的事实提取成主张卡。');
});
```

Define the local render helper explicitly:

```tsx
function renderTutorialAt(step: TutorialStep) {
  return renderGame(
    <TutorialController><IntelDesk /></TutorialController>,
    { tutorial: { step, startedAtLeastOnce: true } },
  );
}
```

`TutorialController` accepts `children: ReactNode` and renders the objective/completion UI around those children.

- [ ] **Step 2: Write failing feature-gate and accessibility tests**

- `结束当前阶段` is disabled with reason until tutorial completes;
- investigation appears only at `investigateHandwriting`;
- interrogation appears only at `interrogateZhao`;
- bait/report actions are absent;
- the target has `aria-describedby` pointing to its reason;
- keyboard-only actions complete the flow;
- requested document/relationship view becomes active automatically.

- [ ] **Step 3: Run RED**

Run: `npm run test:run -- src/features/onboarding/TutorialController.test.tsx`

- [ ] **Step 4: Implement controller without a second rule path**

`TutorialController` calls `deriveTutorialStep(state)` and dispatches `SET_TUTORIAL_STEP` only when the derived step is ahead. It exposes the objective through context. `TutorialViewContext` requests `documents` or `relationships`; `Workspace` remains the owner of active view and responds to requests.

Controls receive a `data-tutorial-target` attribute and textual description. CSS may dim non-target regions but must honor `prefers-reduced-motion` and cannot hide needed document text.

When the contradiction relationship exists, show `TutorialCompletion`. `继续自由调查` sets `completed`; the normal desk returns without automatically advancing Stage.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:run -- src/features/onboarding src/features/documents src/features/board src/features/desk
npm run test:run
npm run build
npm run lint
git add app/src/features/onboarding app/src/features/desk app/src/features/documents app/src/features/board
git commit -m "feat: guide the first evidence chain"
```

---

### Task 6: Browser Acceptance, Documentation, and Handoff

**Files:**
- Create: `app/playwright.config.ts`
- Create: `app/e2e/onboarding.spec.ts`
- Modify: `app/package.json`
- Modify: `README.md`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: completed onboarding vertical slice.
- Produces: repeatable fresh-browser acceptance and updated handoff.

- [ ] **Step 1: Configure Chromium acceptance**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1',
    port: 4173,
    reuseExistingServer: false,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 2: Write the failing fresh-player journey**

```ts
test('a new player completes the first evidence chain without outside instructions', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: '开始调查' }).click();
  await page.getByRole('button', { name: '继续' }).click();
  await page.getByRole('button', { name: '继续' }).click();
  await page.getByRole('button', { name: '继续' }).click();
  await page.getByRole('button', { name: '打开文书：残缺伏击军报' }).click();
  await page.getByRole('button', { name: /提取主张：敌军行动同时对应北桥与寅时/ }).click();
  await page.getByRole('button', { name: '打开文书：赵简口供' }).click();
  await page.getByRole('button', { name: /提取主张：赵简声称不知道集合时辰/ }).click();
  await page.getByRole('button', { name: '调查' }).click();
  await page.getByRole('button', { name: '核对集合命令笔迹' }).click();
  await page.getByRole('button', { name: '确认调查' }).click();
  await page.getByRole('button', { name: '审讯' }).click();
  await page.getByLabel('选择口供').selectOption('claim-zhao-denial');
  await page.getByLabel('选择证据').selectOption('claim-zhao-copied-order');
  await page.getByRole('radio', { name: '冷静追问' }).click();
  await page.getByRole('button', { name: '提交质询' }).click();
  await page.getByRole('button', { name: '选择证据：笔迹核对确认集合命令由赵简亲笔抄写' }).click();
  await page.getByRole('button', { name: '选择对象：赵简声称不知道集合时辰' }).click();
  await page.getByRole('button', { name: '选择关系：反驳' }).click();
  await page.getByRole('button', { name: '放入：泄露信息' }).click();
  await expect(page.getByText(/第一条证据链已成立/)).toBeVisible();
  await expect(page.getByText(/有矛盾不等于通敌/)).toBeVisible();
});
```

- [ ] **Step 3: Add skip, continue, refresh, and no-timer acceptance**

Separate tests must prove:

- `跳过引导` leaves 3 points and empty evidence/relationships;
- refresh during `investigateHandwriting` returns to that objective;
- a v1 save migrates and does not force onboarding;
- no screen contains `/剩余.*(?:分钟|秒)|倒计时/`;
- browser console has no errors.

```ts
test('skip does not mutate case progress', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: '跳过引导' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('guandu.current') ?? 'null')))
    .toMatchObject({
    stage: 'documents', investigationPoints: 3,
    extractedClaimIds: [], completedInvestigationIds: [], relationships: [],
    tutorial: { step: 'skipped', startedAtLeastOnce: true },
  });
});
```

- [ ] **Step 4: Update public documentation**

README current status must say the first guided inference is playable and list the exact run/test commands. HANDOFF must record completed onboarding commits, tests, next original task, and the corrected Task 16 provenance path.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:run
npm run build
npm run lint
npm run e2e -- --project=chromium
git diff --check
git add app README.md HANDOFF.md
git commit -m "test: verify guided first inference"
```
