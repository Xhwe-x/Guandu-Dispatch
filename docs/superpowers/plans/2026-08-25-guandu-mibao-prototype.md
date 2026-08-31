# 《官渡密报》首案原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可以从文书调查完整玩到政治尾声的《官渡密报》单案 Web 原型，验证“双环情报推理”核心玩法。

**Architecture:** 在仓库根目录保留产品文档，在 `app/` 下建立 React 单页应用。案件内容、纯规则函数、状态 reducer、浏览器存档和 React 表现层相互分离；所有关键结论、诱饵反馈和结局均由稳定 ID 与确定规则驱动，不使用自然语言判定、随机数或机械计时。

**Tech Stack:** Node.js 22.x、React、TypeScript、Vite、Vitest、React Testing Library、Zod、`@dnd-kit/react`、Playwright、CSS。

**Spec:** `docs/superpowers/specs/2026-08-25-guandu-mibao-design.md`

## Global Constraints

- 应用位于 `app/`，不得覆盖根目录的 `HANDOFF.md`、v0.3 草案、规格和计划。
- Node.js 使用 22.x，以同时满足当前 Vite、Vitest 和 Playwright 工具链要求。
- 平台为 PC/Web 桌面横屏；不实现手机适配。
- 目标内容量为 20–30 分钟，但不存在倒计时、自动推进或超时失败。
- 阶段只在玩家查看摘要并主动确认后推进。
- 固定真相为“赵简泄露时辰＋杜衡推断路线并用价格表暗号传递”。
- 粮队规模是辅助情报，不是伏击成立的第三个必要条件。
- 调查点固定为 3；常规审讯不消耗调查点，深入审讯消耗 1 点。
- 关系板使用固定逻辑槽位＋证据自由拖放，并提供非拖拽的键盘/按钮替代操作。
- 敌军反馈不使用随机数，不实施假动作。
- 存档仅保存在浏览器本地；无服务器、账号、数据库或遥测上传。
- 第一版人物使用剪影和标志物；不制作正式立绘、配音或复杂过场。
- 每个任务遵循 TDD：失败测试 → 最小实现 → 通过测试 → 独立提交。

## Official Tooling References

- Vite: https://vite.dev/guide/
- Vitest: https://vitest.dev/guide/
- Zod: https://zod.dev/
- dnd kit React: https://dndkit.com/react/quickstart/
- Playwright: https://playwright.dev/docs/intro

## Planned File Map

```text
app/
├─ package.json
├─ vite.config.ts
├─ playwright.config.ts
├─ index.html
├─ e2e/
│  ├─ helpers.ts
│  ├─ happy-path.spec.ts
│  ├─ partial-path.spec.ts
│  └─ failure-and-politics.spec.ts
├─ public/
│  └─ icons/
│     ├─ lu-chun.svg
│     ├─ zheng-he.svg
│     ├─ zhao-jian.svg
│     └─ du-heng.svg
└─ src/
   ├─ app/
   │  ├─ App.tsx
   │  ├─ App.test.tsx
   │  ├─ GameProvider.tsx
   │  └─ ErrorBoundary.tsx
   ├─ game/
   │  ├─ domain.ts
   │  ├─ contentSchema.ts
   │  ├─ contentSchema.test.ts
   │  ├─ fixtures.ts
   │  ├─ initialState.ts
   │  ├─ reducer.ts
   │  ├─ reducer.test.ts
   │  ├─ selectors.ts
   │  ├─ persistence.ts
   │  ├─ persistence.test.ts
   │  └─ rules/
   │     ├─ relationships.ts
   │     ├─ relationships.test.ts
   │     ├─ investigation.ts
   │     ├─ investigation.test.ts
   │     ├─ bait.ts
   │     ├─ bait.test.ts
   │     ├─ report.ts
   │     ├─ report.test.ts
   │     ├─ ending.ts
   │     └─ ending.test.ts
   ├─ content/guandu/
   │  ├─ characters.ts
   │  ├─ documents.ts
   │  ├─ claims.ts
   │  ├─ investigations.ts
   │  ├─ interrogations.ts
   │  ├─ baits.ts
   │  ├─ hints.ts
   │  ├─ endings.ts
   │  ├─ index.ts
   │  └─ content.test.ts
   ├─ features/
   │  ├─ desk/
   │  ├─ documents/
   │  ├─ board/
   │  ├─ map/
   │  ├─ investigation/
   │  ├─ interrogation/
   │  ├─ bait/
   │  ├─ report/
   │  ├─ ending/
   │  ├─ hints/
   │  └─ save/
   ├─ audio/
   │  ├─ sound.ts
   │  └─ sound.test.ts
   ├─ test/setup.ts
   ├─ test/renderGame.tsx
   └─ styles/
      ├─ tokens.css
      └─ global.css
```

---

### Task 1: Repository Baseline and Tested React Shell

**Files:**
- Create: `.gitignore`
- Create: `app/package.json`
- Create: `app/vite.config.ts`
- Create: `app/playwright.config.ts`
- Create: `app/src/test/setup.ts`
- Modify: `app/src/app/App.tsx`
- Test: `app/src/app/App.test.tsx`

**Interfaces:**
- Consumes: 已批准规格文件。
- Produces: 可运行的 Vite React TypeScript 应用；`npm run test`、`npm run build`、`npm run e2e` 命令。

- [ ] **Step 1: 建立版本控制基线**

Run from workspace root:

```powershell
git init -b main
git add HANDOFF.md 官渡密报_产品与技术设计草案_v0.3.md docs .gitignore
git commit -m "docs: baseline guandu mibao design"
```

Create `.gitignore` with `apply_patch` before `git add`:

```gitignore
node_modules/
app/dist/
app/test-results/
app/playwright-report/
.superpowers/
```

Expected: `git status --short` prints no tracked-file changes.

- [ ] **Step 2: Scaffold the application and install the minimal dependencies**

Run:

```powershell
node --version
npm create vite@latest app -- --template react-ts --no-interactive
Set-Location app
npm install
npm install zod @dnd-kit/react
npm install -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @playwright/test
npx playwright install chromium
```

Expected: Node reports `v22.x`; installation completes without peer-dependency errors.

- [ ] **Step 3: Write the failing shell test**

```tsx
// app/src/app/App.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App shell', () => {
  it('renders the game title without a countdown', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: '官渡密报' })).toBeInTheDocument();
    expect(screen.queryByText(/剩余.*(?:分钟|秒)/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Configure Vitest and verify the test fails**

```ts
// app/vite.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
```

```ts
// app/src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

Run: `npm run test -- --run src/app/App.test.tsx`

Expected: FAIL because `App` does not export the requested title shell.

- [ ] **Step 5: Implement the minimal shell**

```tsx
// app/src/app/App.tsx
export function App() {
  return (
    <main>
      <h1>官渡密报</h1>
      <p>一场关于信息、判断与欺骗的调查。</p>
    </main>
  );
}
```

Update `app/src/main.tsx` to render `<App />`. Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest",
    "test:run": "vitest run",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 6: Verify and commit**

Run:

```powershell
npm run test:run
npm run build
git add app
git commit -m "chore: scaffold tested React prototype"
```

Expected: tests and production build pass.

---

### Task 2: Domain Types and Runtime Content Validation

**Files:**
- Create: `app/src/game/domain.ts`
- Create: `app/src/game/contentSchema.ts`
- Create: `app/src/game/fixtures.ts`
- Test: `app/src/game/contentSchema.test.ts`

**Interfaces:**
- Consumes: Zod.
- Produces: `GameContent`, `GameState`, `validateGameContent(input): GameContent`.

- [ ] **Step 1: Write tests for valid data and dangling references**

```ts
import { describe, expect, it } from 'vitest';
import { minimalContent } from './fixtures';
import { validateGameContent } from './contentSchema';

describe('validateGameContent', () => {
  it('accepts a complete minimal case', () => {
    expect(validateGameContent(minimalContent).id).toBe('guandu');
  });

  it('rejects a claim whose source document does not exist', () => {
    const broken = structuredClone(minimalContent);
    broken.claims[0].sourceDocumentId = 'missing-document';
    expect(() => validateGameContent(broken)).toThrow(/missing-document/);
  });

  it('rejects duplicate stable IDs', () => {
    const broken = structuredClone(minimalContent);
    broken.claims.push({ ...broken.claims[0] });
    expect(() => validateGameContent(broken)).toThrow(/Duplicate claim ID/);
  });
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npm run test:run -- src/game/contentSchema.test.ts`

Expected: FAIL because domain types and validator do not exist.

- [ ] **Step 3: Define the shared domain contracts**

```ts
// app/src/game/domain.ts
export type EntityId = string;
export type Stage = 'documents' | 'secrets' | 'chain' | 'bait' | 'report' | 'ending';
export type RelationKind = 'supports' | 'refutes' | 'sourceOf' | 'accessedBy' | 'infers' | 'transmitsTo';
export type LogicSlot = 'leakedInfo' | 'source' | 'actor' | 'method' | 'enemyConclusion';
export type PersonState = 'cooperative' | 'guarded' | 'hostile';
export type TruthOwner = 'canghe' | 'shuoyuan' | 'lishe' | 'destroyed';
export type ActionOutcome = 'networkClosed' | 'convoySavedIncomplete' | 'ambushedAgain';
export type BaitBand = 'bothCore' | 'oneCore' | 'noneCore';

export interface Character {
  id: EntityId;
  name: string;
  role: string;
  access: string[];
  secret: string;
  responsibility: string;
}

export interface Document {
  id: EntityId;
  title: string;
  category: 'report' | 'ledger' | 'statement' | 'repair' | 'trade' | 'map';
  body: string;
  claimIds: EntityId[];
}

export interface Claim {
  id: EntityId;
  text: string;
  sourceDocumentId: EntityId;
  tags: string[];
}

export interface Relationship {
  fromId: EntityId;
  toId: EntityId;
  kind: RelationKind;
  slot: LogicSlot;
}

export interface Investigation {
  id: EntityId;
  title: string;
  cost: 1;
  revealClaimIds: EntityId[];
}

export interface InterrogationRule {
  id: EntityId;
  characterId: EntityId;
  statementClaimId: EntityId;
  evidenceClaimId: EntityId;
  revealClaimIds: EntityId[];
  responseKeys: Record<'calm' | 'threaten' | 'empathize' | 'misdirect', string>;
}

export interface BaitOption {
  id: EntityId;
  channel: 'lu' | 'zheng' | 'zhao' | 'du';
  payload: string;
  signal: string;
  requiredClaimIds: EntityId[];
  core: boolean;
}

export interface ReportSubmission {
  leakedInfo: string[];
  sourceCharacterIds: EntityId[];
  integratorId: EntityId;
  transmissionMethod: string;
  evidenceClaimIds: EntityId[];
  handling: 'arrest' | 'cutOff' | 'exploit' | 'differentiate';
}

export interface RealConvoyPlan { route: string; time: string }
export interface EnemyReport { route: string; time: string }

export interface GameContent {
  id: 'guandu';
  characters: Character[];
  documents: Document[];
  claims: Claim[];
  investigations: Investigation[];
  interrogations: InterrogationRule[];
  baits: BaitOption[];
  hints: Record<string, [string, string, string]>;
  epilogueFragments: Record<string, string>;
}

export interface GameState {
  version: 1;
  stage: Stage;
  investigationPoints: number;
  readDocumentIds: EntityId[];
  extractedClaimIds: EntityId[];
  relationships: Relationship[];
  completedInvestigationIds: EntityId[];
  personStates: Record<EntityId, PersonState>;
  selectedBaitIds: EntityId[];
  realPlan?: RealConvoyPlan;
  baitBand?: BaitBand;
  enemyReport?: EnemyReport;
  report?: ReportSubmission;
  actionOutcome?: ActionOutcome;
  truthOwner?: TruthOwner;
  hintUsage: Record<string, number>;
}
```

- [ ] **Step 4: Implement schema validation and reference checks**

Define schemas for every persisted field and infer no separate duplicate types from them. The core schema definitions are:

```ts
const Id = z.string().min(1);
const CharacterSchema = z.object({
  id: Id, name: z.string().min(1), role: z.string().min(1),
  access: z.array(z.string()), secret: z.string(), responsibility: z.string(),
});
const DocumentSchema = z.object({
  id: Id, title: z.string().min(1),
  category: z.enum(['report', 'ledger', 'statement', 'repair', 'trade', 'map']),
  body: z.string().min(1), claimIds: z.array(Id),
});
const ClaimSchema = z.object({ id: Id, text: z.string().min(1), sourceDocumentId: Id, tags: z.array(z.string()) });
const InvestigationSchema = z.object({ id: Id, title: z.string().min(1), cost: z.literal(1), revealClaimIds: z.array(Id) });
const InterrogationRuleSchema = z.object({
  id: Id, characterId: Id, statementClaimId: Id, evidenceClaimId: Id,
  revealClaimIds: z.array(Id),
  responseKeys: z.object({ calm: z.string(), threaten: z.string(), empathize: z.string(), misdirect: z.string() }),
});
const BaitOptionSchema = z.object({
  id: Id, channel: z.enum(['lu', 'zheng', 'zhao', 'du']), payload: z.string(),
  signal: z.string(), requiredClaimIds: z.array(Id), core: z.boolean(),
});

export const GameContentSchema = z.object({
  id: z.literal('guandu'), characters: z.array(CharacterSchema), documents: z.array(DocumentSchema),
  claims: z.array(ClaimSchema), investigations: z.array(InvestigationSchema),
  interrogations: z.array(InterrogationRuleSchema), baits: z.array(BaitOptionSchema),
  hints: z.record(z.string(), z.tuple([z.string(), z.string(), z.string()])),
  epilogueFragments: z.record(z.string(), z.string()),
});

export const GameStateSchema = z.object({
  version: z.literal(1),
  stage: z.enum(['documents', 'secrets', 'chain', 'bait', 'report', 'ending']),
  investigationPoints: z.number().int().min(0).max(3),
  readDocumentIds: z.array(Id), extractedClaimIds: z.array(Id),
  relationships: z.array(z.object({
    fromId: Id, toId: Id,
    kind: z.enum(['supports', 'refutes', 'sourceOf', 'accessedBy', 'infers', 'transmitsTo']),
    slot: z.enum(['leakedInfo', 'source', 'actor', 'method', 'enemyConclusion']),
  })),
  completedInvestigationIds: z.array(Id),
  personStates: z.record(Id, z.enum(['cooperative', 'guarded', 'hostile'])),
  selectedBaitIds: z.array(Id),
  realPlan: z.object({ route: z.string(), time: z.string() }).optional(),
  baitBand: z.enum(['bothCore', 'oneCore', 'noneCore']).optional(),
  enemyReport: z.object({ route: z.string(), time: z.string() }).optional(),
  report: z.object({
    leakedInfo: z.array(z.string()), sourceCharacterIds: z.array(Id), integratorId: Id,
    transmissionMethod: z.string(), evidenceClaimIds: z.array(Id),
    handling: z.enum(['arrest', 'cutOff', 'exploit', 'differentiate']),
  }).optional(),
  actionOutcome: z.enum(['networkClosed', 'convoySavedIncomplete', 'ambushedAgain']).optional(),
  truthOwner: z.enum(['canghe', 'shuoyuan', 'lishe', 'destroyed']).optional(),
  hintUsage: z.record(z.string(), z.number().int().min(0)),
});
```

After `GameContentSchema.parse(input)`, build character, document, and claim ID sets. Validate every claim source, document claim, investigation reveal, interrogation character/statement/evidence/reveal, and bait requirement. Throw an error containing the exact missing ID.

```ts
export function validateGameContent(input: unknown): GameContent {
  const content = GameContentSchema.parse(input);
  const documentIds = new Set(content.documents.map((item) => item.id));
  const claimIds = new Set(content.claims.map((item) => item.id));

  const assertUnique = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) throw new Error(`Duplicate ${label} ID: ${id}`);
      seen.add(id);
    }
  };
  assertUnique('character', content.characters.map((item) => item.id));
  assertUnique('document', content.documents.map((item) => item.id));
  assertUnique('claim', content.claims.map((item) => item.id));
  assertUnique('investigation', content.investigations.map((item) => item.id));
  assertUnique('interrogation', content.interrogations.map((item) => item.id));
  assertUnique('bait', content.baits.map((item) => item.id));

  for (const claim of content.claims) {
    if (!documentIds.has(claim.sourceDocumentId)) {
      throw new Error(`Missing document reference: ${claim.sourceDocumentId}`);
    }
    const source = content.documents.find((item) => item.id === claim.sourceDocumentId)!;
    if (!source.claimIds.includes(claim.id)) {
      throw new Error(`Document ${source.id} does not list claim: ${claim.id}`);
    }
  }
  for (const investigation of content.investigations) {
    for (const id of investigation.revealClaimIds) {
      if (!claimIds.has(id)) throw new Error(`Missing claim reference: ${id}`);
    }
  }
  return content;
}

export function validateGameState(input: unknown): GameState {
  return GameStateSchema.parse(input) as GameState;
}
```

Create `minimalContent` in `fixtures.ts` with all fields required by the tests:

```ts
export const minimalContent: GameContent = {
  id: 'guandu',
  characters: [
    { id: 'lu', name: '陆淳', role: '驿丞', access: [], secret: '', responsibility: '' },
    { id: 'zheng', name: '郑禾', role: '粮官', access: [], secret: '', responsibility: '' },
    { id: 'zhao', name: '赵简', role: '书吏', access: ['departureTime'], secret: '', responsibility: '' },
    { id: 'du', name: '杜衡', role: '商人', access: ['routeSignals'], secret: '', responsibility: '' },
  ],
  documents: [
    { id: 'doc-zhao', title: '集合命令', category: 'statement', body: '测试文书', claimIds: ['claim-zhao-time', 'claim-zhao-denial', 'claim-zhao-copied-order', 'claim-zhao-coerced'] },
    { id: 'doc-du', title: '采购记录', category: 'trade', body: '测试文书', claimIds: ['claim-du-route', 'claim-bridge-open', 'claim-price-cipher', 'claim-shuoyuan-received', 'claim-lu-ledger-change'] },
  ],
  claims: [
    { id: 'claim-zhao-time', text: '赵简接触时辰', sourceDocumentId: 'doc-zhao', tags: ['actor'] },
    { id: 'claim-zhao-denial', text: '赵简否认知情', sourceDocumentId: 'doc-zhao', tags: ['statement'] },
    { id: 'claim-zhao-copied-order', text: '赵简誊抄命令', sourceDocumentId: 'doc-zhao', tags: ['refutes', 'actor'] },
    { id: 'claim-du-route', text: '杜衡可推断路线', sourceDocumentId: 'doc-du', tags: ['method'] },
    { id: 'claim-bridge-open', text: '北桥可通重车', sourceDocumentId: 'doc-du', tags: ['supports'] },
    { id: 'claim-price-cipher', text: '价格表是暗号', sourceDocumentId: 'doc-du', tags: ['method'] },
    { id: 'claim-shuoyuan-received', text: '朔原军收到拼合情报', sourceDocumentId: 'doc-du', tags: ['enemyConclusion'] },
    { id: 'claim-zhao-coerced', text: '赵简家人受胁迫', sourceDocumentId: 'doc-zhao', tags: ['motive'] },
    { id: 'claim-lu-ledger-change', text: '陆淳修改粮册', sourceDocumentId: 'doc-du', tags: ['supports'] },
  ],
  investigations: [{ id: 'investigate-zhao-family', title: '查询赵简家人', cost: 1, revealClaimIds: ['claim-zhao-coerced'] }],
  interrogations: [{
    id: 'interrogate-zhao-time', characterId: 'zhao', statementClaimId: 'claim-zhao-denial',
    evidenceClaimId: 'claim-zhao-copied-order', revealClaimIds: ['claim-zhao-time'],
    responseKeys: { calm: 'zhao.calm', threaten: 'zhao.threaten', empathize: 'zhao.empathize', misdirect: 'zhao.misdirect' },
  }],
  baits: [
    { id: 'bait-lu-south', channel: 'lu', payload: '南线驿马', signal: 'southDispatch', requiredClaimIds: [], core: false },
    { id: 'bait-zheng-36', channel: 'zheng', payload: '三十六辆', signal: '36', requiredClaimIds: [], core: false },
    { id: 'bait-zhao-yin', channel: 'zhao', payload: '寅时', signal: 'yin', requiredClaimIds: ['claim-zhao-time'], core: true },
    { id: 'bait-du-north-bridge', channel: 'du', payload: '北桥', signal: 'northBridge', requiredClaimIds: ['claim-du-route', 'claim-bridge-open'], core: true },
  ],
  hints: { timeSource: ['方向', '文书', '矛盾'] },
  epilogueFragments: {
    'outcome.networkClosed': '封网成功。',
    'outcome.convoySavedIncomplete': '保粮失人。',
    'outcome.ambushedAgain': '再次伏击。',
    'owner.canghe': '真相交给沧河军。', 'owner.shuoyuan': '真相交给朔原军。',
    'owner.lishe': '真相交给官渡里社。', 'owner.destroyed': '关键证据被销毁。',
    'lu.canghe': '陆淳受审。', 'lu.shuoyuan': '陆淳离开驿站。', 'lu.lishe': '陆淳受里社保护。', 'lu.destroyed': '陆淳的秘密未被公开。',
    'zheng.accused': '郑禾被错误牵连。', 'zheng.cleared': '郑禾洗清通敌嫌疑。',
    'zhao.coerced': '赵简的胁迫事实得到确认。', 'zhao.traitor': '赵简被作为叛徒处置。',
    'du.identified': '杜衡的暗号渠道被识破。', 'du.escaped': '杜衡带着渠道秘密逃脱。',
    'player.canghe': '玩家留在沧河军控制下。', 'player.shuoyuan': '玩家选择朔原军。',
    'player.lishe': '玩家站在官渡里社一边。', 'player.destroyed': '玩家独自保守真相。',
  },
};
```

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/game/contentSchema.test.ts`

Expected: PASS for valid fixture; invalid reference test reports the missing ID.

```powershell
git add app/src/game
git commit -m "feat: define validated game domain"
```

---

### Task 3: Relationship Board Rule Engine

**Files:**
- Create: `app/src/game/rules/relationships.ts`
- Test: `app/src/game/rules/relationships.test.ts`

**Interfaces:**
- Consumes: `GameContent`, `Relationship`.
- Produces: `validateRelationship(content, relation)` and `evaluateHypothesis(relationships)`.

- [ ] **Step 1: Write the failing rule tests**

```ts
import { describe, expect, it } from 'vitest';
import { evaluateHypothesis, validateRelationship } from './relationships';

describe('relationship rules', () => {
  it('recognizes the fixed Zhao + Du chain without requiring a unique layout', () => {
    const score = evaluateHypothesis([
      { fromId: 'claim-zhao-time', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
      { fromId: 'claim-du-route', toId: 'du', kind: 'infers', slot: 'method' },
      { fromId: 'du', toId: 'claim-shuoyuan-received', kind: 'transmitsTo', slot: 'enemyConclusion' },
    ]);
    expect(score).toEqual({ timeChannel: true, routeChannel: true, transmitter: true });
  });

  it('rejects a missing entity without deleting the card', () => {
    expect(validateRelationship(minimalContent, {
      fromId: 'missing', toId: 'zhao', kind: 'supports', slot: 'actor',
    })).toEqual({ ok: false, reason: '证据不存在' });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run -- src/game/rules/relationships.test.ts`

Expected: FAIL because the functions are undefined.

- [ ] **Step 3: Implement deterministic relationship evaluation**

```ts
export interface HypothesisScore {
  timeChannel: boolean;
  routeChannel: boolean;
  transmitter: boolean;
}

export function evaluateHypothesis(items: Relationship[]): HypothesisScore {
  return {
    timeChannel: items.some((r) => r.fromId === 'claim-zhao-time' && r.toId === 'zhao'),
    routeChannel: items.some((r) => r.fromId === 'claim-du-route' && r.toId === 'du'),
    transmitter: items.some((r) => r.fromId === 'du' && r.toId === 'claim-shuoyuan-received'),
  };
}
```

`validateRelationship` must check both entity IDs, then verify the selected `RelationKind` is allowed by the source claim tags. Return `{ ok: true }` or `{ ok: false, reason: string }`; never mutate state inside the validator.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/game/rules/relationships.test.ts`

Expected: both tests PASS.

```powershell
git add app/src/game/rules
git commit -m "feat: add deterministic relationship rules"
```

---

### Task 4: Game State Reducer and Explicit Stage Progression

**Files:**
- Create: `app/src/game/initialState.ts`
- Create: `app/src/game/reducer.ts`
- Create: `app/src/game/selectors.ts`
- Test: `app/src/game/reducer.test.ts`

**Interfaces:**
- Consumes: `GameState`, validated content IDs.
- Produces: `createInitialState()`, `gameReducer(state, action)`, `canAdvance(state)`.

- [ ] **Step 1: Write failing tests for points and manual progression**

```ts
describe('game reducer', () => {
  it('starts with three investigation points and no timer state', () => {
    const state = createInitialState();
    expect(state.investigationPoints).toBe(3);
    expect(state.stage).toBe('documents');
    expect(state).not.toHaveProperty('deadline');
    expect(state).not.toHaveProperty('secondsRemaining');
  });

  it('does not advance until CONFIRM_ADVANCE is dispatched', () => {
    const state = createInitialState();
    const afterReading = gameReducer(state, { type: 'READ_DOCUMENT', documentId: 'report-ambush' });
    expect(afterReading.stage).toBe('documents');
    expect(gameReducer(afterReading, { type: 'CONFIRM_ADVANCE' }).stage).toBe('secrets');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run -- src/game/reducer.test.ts`

Expected: FAIL because reducer files do not exist.

- [ ] **Step 3: Implement initial state and reducer actions**

```ts
const stageOrder: Stage[] = ['documents', 'secrets', 'chain', 'bait', 'report', 'ending'];

export function createInitialState(): GameState {
  return {
    version: 1,
    stage: 'documents',
    investigationPoints: 3,
    readDocumentIds: [],
    extractedClaimIds: [],
    relationships: [],
    completedInvestigationIds: [],
    personStates: { lu: 'cooperative', zheng: 'cooperative', zhao: 'cooperative', du: 'cooperative' },
    selectedBaitIds: [],
    hintUsage: {},
  };
}

export type GameAction =
  | { type: 'READ_DOCUMENT'; documentId: string }
  | { type: 'EXTRACT_CLAIM'; claimId: string }
  | { type: 'PLACE_RELATIONSHIP'; relationship: Relationship }
  | { type: 'COMPLETE_INVESTIGATION'; investigationId: string; revealClaimIds: string[] }
  | { type: 'SET_PERSON_STATE'; characterId: string; state: PersonState }
  | { type: 'SELECT_BAIT'; baitId: string; channel: BaitOption['channel'] }
  | { type: 'SUBMIT_REPORT'; report: ReportSubmission; outcome: ActionOutcome }
  | { type: 'CHOOSE_TRUTH_OWNER'; owner: TruthOwner }
  | { type: 'USE_HINT'; topic: string; level: 1 | 2 | 3 }
  | { type: 'CONFIRM_ADVANCE' }
  | { type: 'RESTORE_STATE'; state: GameState };

const addOnce = (items: string[], id: string) => items.includes(id) ? items : [...items, id];

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'READ_DOCUMENT': return { ...state, readDocumentIds: addOnce(state.readDocumentIds, action.documentId) };
    case 'EXTRACT_CLAIM': return { ...state, extractedClaimIds: addOnce(state.extractedClaimIds, action.claimId) };
    case 'PLACE_RELATIONSHIP': return { ...state, relationships: [...state.relationships, action.relationship] };
    case 'COMPLETE_INVESTIGATION': return {
      ...state,
      investigationPoints: state.investigationPoints - 1,
      completedInvestigationIds: addOnce(state.completedInvestigationIds, action.investigationId),
      extractedClaimIds: [...new Set([...state.extractedClaimIds, ...action.revealClaimIds])],
    };
    case 'SET_PERSON_STATE': return { ...state, personStates: { ...state.personStates, [action.characterId]: action.state } };
    case 'SELECT_BAIT': return { ...state, selectedBaitIds: [...state.selectedBaitIds.filter((id) => !id.startsWith(`bait-${action.channel}-`)), action.baitId] };
    case 'SUBMIT_REPORT': return { ...state, report: action.report, actionOutcome: action.outcome };
    case 'CHOOSE_TRUTH_OWNER': return { ...state, truthOwner: action.owner };
    case 'USE_HINT': return { ...state, hintUsage: { ...state.hintUsage, [action.topic]: action.level } };
    case 'CONFIRM_ADVANCE': {
      const index = stageOrder.indexOf(state.stage);
      return { ...state, stage: stageOrder[Math.min(index + 1, stageOrder.length - 1)] };
    }
    case 'RESTORE_STATE': return action.state;
  }
}
```

Guard `COMPLETE_INVESTIGATION` before dispatch so it cannot run for a completed ID or when points are zero. `CONFIRM_ADVANCE` is the only action that changes `stage` before report submission.

- [ ] **Step 4: Add selector tests and implementation**

Test `selectRemainingInvestigationPoints`, `selectCurrentObjective`, and `selectCanOpenBait`. `selectCanOpenBait` returns true only in `chain` after the player has extracted the required base claims; it must not depend on elapsed time.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/game/reducer.test.ts`

```powershell
git add app/src/game/initialState.ts app/src/game/reducer.ts app/src/game/selectors.ts app/src/game/reducer.test.ts
git commit -m "feat: add explicit game state progression"
```

---

### Task 5: Investigation and Interrogation Rules

**Files:**
- Create: `app/src/game/rules/investigation.ts`
- Test: `app/src/game/rules/investigation.test.ts`

**Interfaces:**
- Consumes: `GameContent`, `GameState`, investigation ID, interrogation input.
- Produces: `applyInvestigation(...)` and `resolveInterrogation(...)`.

- [ ] **Step 1: Write failing tests**

```ts
describe('investigation and interrogation', () => {
  it('spends one point for a deep investigation', () => {
    const result = applyInvestigation(minimalContent, createInitialState(), 'investigate-zhao-family');
    expect(result.state.investigationPoints).toBe(2);
    expect(result.revealedClaimIds).toContain('claim-zhao-coerced');
  });

  it('does not spend a point for ordinary evidence confrontation', () => {
    const result = resolveInterrogation(minimalContent, createInitialState(), {
      characterId: 'zhao', statementClaimId: 'claim-zhao-denial',
      evidenceClaimId: 'claim-zhao-copied-order', tone: 'calm', deep: false,
    });
    expect(result.state.investigationPoints).toBe(3);
    expect(result.breakthrough).toBe(true);
  });

  it('makes a person guarded after wrong evidence without deleting required claims', () => {
    const prepared = { ...createInitialState(), extractedClaimIds: ['claim-zhao-copied-order'] };
    const result = resolveInterrogation(minimalContent, prepared, {
      characterId: 'zhao', statementClaimId: 'claim-zhao-denial',
      evidenceClaimId: 'claim-lu-ledger-change', tone: 'threaten', deep: false,
    });
    expect(result.state.personStates.zhao).toBe('guarded');
    expect(result.state.extractedClaimIds).toContain('claim-zhao-copied-order');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run -- src/game/rules/investigation.test.ts`

Expected: FAIL because rule functions do not exist.

- [ ] **Step 3: Implement the rules**

```ts
export interface InterrogationInput {
  characterId: string;
  statementClaimId: string;
  evidenceClaimId: string;
  tone: 'calm' | 'threaten' | 'empathize' | 'misdirect';
  deep: boolean;
}

export interface InterrogationResult {
  state: GameState;
  breakthrough: boolean;
  revealedClaimIds: string[];
  responseKey: string;
}

export function applyInvestigation(content: GameContent, state: GameState, investigationId: string) {
  const investigation = content.investigations.find((item) => item.id === investigationId);
  if (!investigation) throw new Error(`Unknown investigation: ${investigationId}`);
  if (state.completedInvestigationIds.includes(investigationId)) throw new Error('该调查已经完成');
  if (state.investigationPoints < investigation.cost) throw new Error('调查点不足');
  return {
    state: gameReducer(state, { type: 'COMPLETE_INVESTIGATION', investigationId, revealClaimIds: investigation.revealClaimIds }),
    revealedClaimIds: investigation.revealClaimIds,
  };
}

export function resolveInterrogation(content: GameContent, state: GameState, input: InterrogationInput): InterrogationResult {
  const rule = content.interrogations.find((item) =>
    item.characterId === input.characterId && item.statementClaimId === input.statementClaimId,
  );
  const breakthrough = rule?.evidenceClaimId === input.evidenceClaimId;
  const nextPersonState: PersonState = breakthrough
    ? (input.tone === 'threaten' ? 'guarded' : 'cooperative')
    : (state.personStates[input.characterId] === 'guarded' ? 'hostile' : 'guarded');
  const revealedClaimIds = breakthrough ? (rule?.revealClaimIds ?? []) : [];
  return {
    state: {
      ...gameReducer(state, { type: 'SET_PERSON_STATE', characterId: input.characterId, state: nextPersonState }),
      extractedClaimIds: [...new Set([...state.extractedClaimIds, ...revealedClaimIds])],
    },
    breakthrough,
    revealedClaimIds,
    responseKey: breakthrough ? rule!.responseKeys[input.tone] : `${input.characterId}.wrongEvidence`,
  };
}
```

For `deep: true`, the caller must first run the matching `Investigation`; ordinary `resolveInterrogation` never spends a point. Tone selects an alternate `responseKey` and person-state change, while `breakthrough` depends only on evidence correctness.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/game/rules/investigation.test.ts`

```powershell
git add app/src/game/rules/investigation*
git commit -m "feat: add evidence-led investigation rules"
```

---

### Task 6: Multi-Channel Bait and Enemy Feedback Engine

**Files:**
- Create: `app/src/game/rules/bait.ts`
- Test: `app/src/game/rules/bait.test.ts`

**Interfaces:**
- Consumes: extracted claim IDs, one selected bait per channel, real convoy plan.
- Produces: `evaluateBaitPlan(content, input): BaitResolution`.

- [ ] **Step 1: Write failing tests for all three action bands**

```ts
describe('evaluateBaitPlan', () => {
  it('combines only Zhao time and Du route when both are credible', () => {
    const result = evaluateBaitPlan(minimalContent, {
      knownClaimIds: ['claim-zhao-time', 'claim-du-route', 'claim-bridge-open'],
      baitIds: ['bait-lu-south', 'bait-zheng-36', 'bait-zhao-yin', 'bait-du-north-bridge'],
      realPlan: { route: 'southFord', time: 'zi' },
    });
    expect(result.enemyReport).toMatchObject({ route: 'northBridge', time: 'yin' });
    expect(result.reflectedChannels).toEqual(['zhao', 'du']);
    expect(result.baitBand).toBe('bothCore');
  });

  it('returns oneCore when exactly one core bait is credible', () => {
    const partialBaitInput = {
      knownClaimIds: ['claim-zhao-time'],
      baitIds: ['bait-lu-south', 'bait-zheng-36', 'bait-zhao-yin', 'bait-du-north-bridge'],
      realPlan: { route: 'southFord', time: 'zi' },
    };
    expect(evaluateBaitPlan(minimalContent, partialBaitInput).baitBand).toBe('oneCore');
  });

  it('returns noneCore when both core baits fail', () => {
    const failedBaitInput = {
      knownClaimIds: [],
      baitIds: ['bait-lu-south', 'bait-zheng-36', 'bait-zhao-yin', 'bait-du-north-bridge'],
      realPlan: { route: 'southFord', time: 'zi' },
    };
    expect(evaluateBaitPlan(minimalContent, failedBaitInput).baitBand).toBe('noneCore');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run -- src/game/rules/bait.test.ts`

Expected: FAIL because bait resolution is undefined.

- [ ] **Step 3: Implement deterministic resolution**

```ts
export interface BaitPlanInput {
  knownClaimIds: string[];
  baitIds: string[];
  realPlan: { route: string; time: string };
}

export interface BaitResolution {
  credibleBaitIds: string[];
  reflectedChannels: Array<'lu' | 'zheng' | 'zhao' | 'du'>;
  enemyReport: EnemyReport;
  baitBand: BaitBand;
}

export function evaluateBaitPlan(content: GameContent, input: BaitPlanInput): BaitResolution {
  const selected = input.baitIds.map((id) => {
    const bait = content.baits.find((item) => item.id === id);
    if (!bait) throw new Error(`Unknown bait: ${id}`);
    return bait;
  });
  const channels = new Set(selected.map((item) => item.channel));
  if (channels.size !== 4) throw new Error('每个渠道必须且只能选择一个诱饵');
  const credible = selected.filter((bait) => bait.requiredClaimIds.every((id) => input.knownClaimIds.includes(id)));
  const zhao = credible.find((bait) => bait.channel === 'zhao');
  const du = credible.find((bait) => bait.channel === 'du');
  const coreCount = Number(Boolean(zhao)) + Number(Boolean(du));
  const baitBand: BaitBand = coreCount === 2 ? 'bothCore' : coreCount === 1 ? 'oneCore' : 'noneCore';
  return {
    credibleBaitIds: credible.map((item) => item.id),
    reflectedChannels: [zhao ? 'zhao' : undefined, du ? 'du' : undefined].filter((value): value is 'zhao' | 'du' => Boolean(value)),
    enemyReport: {
      route: du?.signal ?? input.realPlan.route,
      time: zhao?.signal ?? input.realPlan.time,
    },
    baitBand,
  };
}
```

For each bait, credibility is `requiredClaimIds.every(id => knownClaimIds.includes(id))`. A credible core bait replaces that dimension with its fake signal; an incredible Zhao bait leaves `enemyReport.time` equal to `realPlan.time`, and an incredible Du bait leaves `enemyReport.route` equal to `realPlan.route`. Lu and Zheng may receive credible bait, but fixed truth says their channels do not leak, so they never appear in `reflectedChannels`; the UI derives their absence by comparing selected channels with reflected channels. Return `bothCore`, `oneCore`, or `noneCore`; the final `ActionOutcome` is computed only after report evaluation. No randomness, date, timer, or network call is permitted.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/game/rules/bait.test.ts`

```powershell
git add app/src/game/rules/bait*
git commit -m "feat: resolve deterministic counterintelligence bait"
```

---

### Task 7: Final Report Scoring and Modular Epilogue

**Files:**
- Create: `app/src/game/rules/report.ts`
- Create: `app/src/game/rules/ending.ts`
- Test: `app/src/game/rules/report.test.ts`
- Test: `app/src/game/rules/ending.test.ts`

**Interfaces:**
- Consumes: `ReportSubmission`, `ActionOutcome`, `TruthOwner`, case content.
- Produces: `evaluateReport(...)` and `composeEpilogue(...)`.

- [ ] **Step 1: Write failing report tests**

```ts
const correctReport: ReportSubmission = {
  leakedInfo: ['departureTime', 'route'],
  sourceCharacterIds: ['zhao', 'du'],
  integratorId: 'du',
  transmissionMethod: 'priceCipher',
  evidenceClaimIds: ['claim-zhao-copied-order', 'claim-du-route', 'claim-price-cipher', 'claim-zhao-coerced'],
  handling: 'differentiate',
};

it('scores the fixed chain and closes the network after two credible core baits', () => {
  const result = evaluateReport(correctReport, 'bothCore');
  expect(result).toMatchObject({
    timeSourceCorrect: true,
    routeSourceCorrect: true,
    integratorCorrect: true,
    methodCorrect: true,
    falselyAccused: [],
    outcome: 'networkClosed',
  });
});

it('flags Lu and Zheng when they are named as core leakers', () => {
  const result = evaluateReport({ ...correctReport, sourceCharacterIds: ['lu', 'zheng'] }, 'bothCore');
  expect(result.falselyAccused).toEqual(['lu', 'zheng']);
  expect(result.outcome).toBe('convoySavedIncomplete');
});

it('cannot repair a failed bait operation with a correct report', () => {
  expect(evaluateReport(correctReport, 'noneCore').outcome).toBe('ambushedAgain');
});
```

- [ ] **Step 2: Write the political invariance test**

```ts
it.each(['canghe', 'shuoyuan', 'lishe', 'destroyed'] as const)(
  'truth owner %s does not rewrite the action outcome',
  (owner) => {
    const ending = composeEpilogue(minimalContent, {
      owner, report: evaluateReport(correctReport, 'noneCore'),
      personStates: { lu: 'cooperative', zheng: 'guarded', zhao: 'cooperative', du: 'hostile' },
    });
    expect(ending.outcome).toBe('ambushedAgain');
    expect(ending.paragraphs).toHaveLength(7);
  },
);
```

- [ ] **Step 3: Run to verify failure**

Run: `npm run test:run -- src/game/rules/report.test.ts src/game/rules/ending.test.ts`

- [ ] **Step 4: Implement scoring and epilogue composition**

```ts
export interface ReportEvaluation {
  timeSourceCorrect: boolean;
  routeSourceCorrect: boolean;
  integratorCorrect: boolean;
  methodCorrect: boolean;
  coercionEstablished: boolean;
  falselyAccused: string[];
  outcome: ActionOutcome;
}

export interface Epilogue {
  outcome: ActionOutcome;
  owner: TruthOwner;
  paragraphs: [string, string, string, string, string, string, string];
}

export function evaluateReport(report: ReportSubmission, baitBand: BaitBand): ReportEvaluation {
  const timeSourceCorrect = report.sourceCharacterIds.includes('zhao');
  const routeSourceCorrect = report.sourceCharacterIds.includes('du');
  const integratorCorrect = report.integratorId === 'du';
  const methodCorrect = report.transmissionMethod === 'priceCipher';
  const falselyAccused = report.sourceCharacterIds.filter((id) => id === 'lu' || id === 'zheng');
  const coercionEstablished = report.evidenceClaimIds.includes('claim-zhao-coerced');
  const complete = timeSourceCorrect && routeSourceCorrect && integratorCorrect && methodCorrect && falselyAccused.length === 0;
  const outcome: ActionOutcome = baitBand === 'noneCore'
    ? 'ambushedAgain'
    : baitBand === 'bothCore' && complete
      ? 'networkClosed'
      : 'convoySavedIncomplete';
  return { timeSourceCorrect, routeSourceCorrect, integratorCorrect, methodCorrect, coercionEstablished, falselyAccused, outcome };
}

export function composeEpilogue(content: GameContent, input: {
  owner: TruthOwner; report: ReportEvaluation; personStates: Record<string, PersonState>;
}): Epilogue {
  const fragment = (key: string) => {
    const value = content.epilogueFragments[key];
    if (!value) throw new Error(`Missing epilogue fragment: ${key}`);
    return value;
  };
  return {
    outcome: input.report.outcome,
    owner: input.owner,
    paragraphs: [
      fragment(`outcome.${input.report.outcome}`), fragment(`owner.${input.owner}`),
      fragment(`lu.${input.owner}`), fragment(`zheng.${input.report.falselyAccused.includes('zheng') ? 'accused' : 'cleared'}`),
      fragment(`zhao.${input.report.coercionEstablished ? 'coerced' : 'traitor'}`),
      fragment(`du.${input.report.methodCorrect ? 'identified' : 'escaped'}`), fragment(`player.${input.owner}`),
    ],
  };
}
```

Compose exactly seven paragraphs in this order: action result, truth owner, Lu, Zheng, Zhao, Du, player coda. The screen heading is rendered separately. Select fragments by stable keys such as `outcome.networkClosed`, `owner.lishe`, `zhao.coercedProtected`; never concatenate unresolved IDs into player-facing text.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/game/rules/report.test.ts src/game/rules/ending.test.ts`

```powershell
git add app/src/game/rules/report* app/src/game/rules/ending*
git commit -m "feat: score reports and compose political endings"
```

---

### Task 8: Versioned Local Save and Snapshot Recovery

**Files:**
- Create: `app/src/game/persistence.ts`
- Test: `app/src/game/persistence.test.ts`

**Interfaces:**
- Consumes: `GameState`, browser `Storage`.
- Produces: `saveGame`, `loadGame`, `saveStageSnapshot`, `restoreStageSnapshot`.

- [ ] **Step 1: Write failing persistence tests**

```ts
describe('persistence', () => {
  it('round-trips version 1 state', () => {
    saveGame(localStorage, createInitialState());
    expect(loadGame(localStorage)).toEqual({ kind: 'ok', state: createInitialState() });
  });

  it('falls back to the last valid snapshot after corrupted current save', () => {
    saveStageSnapshot(localStorage, createInitialState());
    localStorage.setItem('guandu.current', '{broken');
    expect(loadGame(localStorage)).toMatchObject({ kind: 'recovered' });
  });

  it('never silently accepts an unknown save version', () => {
    localStorage.setItem('guandu.current', JSON.stringify({ version: 99 }));
    expect(loadGame(localStorage)).toEqual({ kind: 'unsupported', version: 99 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run -- src/game/persistence.test.ts`

- [ ] **Step 3: Implement explicit save results**

```ts
export type LoadResult =
  | { kind: 'empty' }
  | { kind: 'ok'; state: GameState }
  | { kind: 'recovered'; state: GameState }
  | { kind: 'unsupported'; version: number }
  | { kind: 'corrupt'; message: string };

const CURRENT_KEY = 'guandu.current';
const SNAPSHOT_KEY = 'guandu.stage-snapshot';

export function saveGame(storage: Storage, state: GameState): void {
  storage.setItem(CURRENT_KEY, JSON.stringify(state));
}

export function saveStageSnapshot(storage: Storage, state: GameState): void {
  storage.setItem(SNAPSHOT_KEY, JSON.stringify(state));
}

function parseState(raw: string): GameState {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed === 'object' && parsed !== null && 'version' in parsed && parsed.version !== 1) {
    throw Object.assign(new Error('unsupported'), { version: parsed.version });
  }
  return validateGameState(parsed);
}

export function loadGame(storage: Storage): LoadResult {
  const current = storage.getItem(CURRENT_KEY);
  if (!current) return { kind: 'empty' };
  try {
    return { kind: 'ok', state: parseState(current) };
  } catch (error) {
    const version = (error as { version?: unknown }).version;
    if (typeof version === 'number') return { kind: 'unsupported', version };
    const snapshot = storage.getItem(SNAPSHOT_KEY);
    if (snapshot) {
      try { return { kind: 'recovered', state: parseState(snapshot) }; } catch { /* report current corruption below */ }
    }
    return { kind: 'corrupt', message: error instanceof Error ? error.message : '未知存档错误' };
  }
}

export function restoreStageSnapshot(storage: Storage): LoadResult {
  const snapshot = storage.getItem(SNAPSHOT_KEY);
  if (!snapshot) return { kind: 'empty' };
  try { return { kind: 'ok', state: parseState(snapshot) }; }
  catch (error) { return { kind: 'corrupt', message: error instanceof Error ? error.message : '快照损坏' }; }
}
```

Never overwrite corrupt content during `loadGame`. `saveStageSnapshot` runs immediately before a confirmed stage transition.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/game/persistence.test.ts`

```powershell
git add app/src/game/persistence*
git commit -m "feat: add recoverable local saves"
```

---

### Task 9: Complete Validated Guan Du Case Content

**Files:**
- Create: `app/src/content/guandu/characters.ts`
- Create: `app/src/content/guandu/documents.ts`
- Create: `app/src/content/guandu/claims.ts`
- Create: `app/src/content/guandu/investigations.ts`
- Create: `app/src/content/guandu/interrogations.ts`
- Create: `app/src/content/guandu/baits.ts`
- Create: `app/src/content/guandu/hints.ts`
- Create: `app/src/content/guandu/endings.ts`
- Create: `app/src/content/guandu/index.ts`
- Test: `app/src/content/guandu/content.test.ts`

**Interfaces:**
- Consumes: `GameContent`, `validateGameContent`.
- Produces: `guanduCase: GameContent`, the only case loaded by the prototype.

- [ ] **Step 1: Write the failing content completeness test**

```ts
import { describe, expect, it } from 'vitest';
import { validateGameContent } from '../../game/contentSchema';
import { guanduCase } from './index';

describe('guandu case content', () => {
  it('contains the complete fixed case', () => {
    const content = validateGameContent(guanduCase);
    expect(content.characters.map((c) => c.id)).toEqual(['lu', 'zheng', 'zhao', 'du']);
    expect(content.documents).toHaveLength(12);
    expect(content.investigations).toHaveLength(6);
    expect(content.baits).toHaveLength(12);
  });

  it('keeps prose documents within the prototype reading budget', () => {
    for (const document of guanduCase.documents.filter((d) => d.category !== 'map')) {
      expect([...document.body].length).toBeGreaterThanOrEqual(80);
      expect([...document.body].length).toBeLessThanOrEqual(180);
    }
  });

  it('contains every fixed-truth claim', () => {
    expect(guanduCase.claims.map((c) => c.id)).toEqual(expect.arrayContaining([
      'claim-zhao-time', 'claim-du-route', 'claim-price-cipher',
      'claim-lu-ledger-change', 'claim-zheng-repair-change', 'claim-zhao-coerced',
    ]));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run -- src/content/guandu/content.test.ts`

Expected: FAIL because the content modules do not exist.

- [ ] **Step 3: Author the four characters exactly as approved**

```ts
export const characters: Character[] = [
  { id: 'lu', name: '陆淳', role: '驿丞', access: ['ledger', 'seal', 'horseDispatch'], secret: '挪用少量军粮救济村民并修改数量', responsibility: '违法但未通敌' },
  { id: 'zheng', name: '郑禾', role: '粮官', access: ['convoyScale', 'wagonDamage'], secret: '修改车辆维修记录掩盖失误', responsibility: '撒谎但未泄露核心情报' },
  { id: 'zhao', name: '赵简', role: '传令书吏', access: ['departureTime'], secret: '家人受胁迫', responsibility: '向杜衡泄露出发时辰' },
  { id: 'du', name: '杜衡', role: '商人', access: ['fodder', 'wheel', 'bridge', 'tradeRoute'], secret: '使用价格表暗号', responsibility: '推断路线、拼合并传递情报' },
];
```

- [ ] **Step 4: Author the exact document inventory**

Create 12 records with the following IDs and required factual content. Prose must state the listed fact without naming the final answer directly.

| ID | Title | Required factual content |
| --- | --- | --- |
| `report-ambush` | 残缺伏击军报 | 伏击发生在北桥附近；朔原军在粮队抵达前完成集结 |
| `ledger-original` | 原始粮册 | 原始粮袋数与陆淳签押 |
| `ledger-revised` | 改写粮册 | 数量减少，盖印顺序异常，但无路线和时辰 |
| `repair-wagons` | 粮车维修记录 | 郑禾修改损坏数量，包含新车轮规格 |
| `repair-north-bridge` | 北桥修缮记录 | 北桥两日前恢复重车通行 |
| `station-entry` | 驿站出入簿 | 杜衡在采购与修桥期间多次出入 |
| `statement-lu` | 陆淳口供 | 否认通敌，回避粮册数量变化 |
| `statement-zheng` | 郑禾口供 | 淡化车辆损坏并否认改写记录 |
| `statement-zhao` | 赵简口供 | 声称只负责誊抄且不知道集合时辰 |
| `statement-du` | 杜衡口供 | 声称只按订单送货、不懂军务 |
| `trade-prices` | 商品价格表 | 若干价格偏离同期记录，编码路线与时辰 |
| `route-map` | 官渡商路图 | 标出北桥、南渡、西岭、驿站和伏击点的距离与承重条件 |

Use the following pattern for every record:

```ts
{
  id: 'statement-zhao',
  title: '赵简口供',
  category: 'statement',
  body: '小吏只奉命誊抄集合文书……',
  claimIds: ['claim-zhao-denial', 'claim-zhao-copied-order'],
}
```

- [ ] **Step 5: Author claims and evidence permissions**

At minimum create these stable claims:

```text
claim-ambush-north       伏击发生在北桥附近
claim-lu-ledger-change   陆淳修改过粮册数量
claim-lu-no-time         陆淳不知道最终出发时辰
claim-zheng-repair-change 郑禾修改过车辆损坏记录
claim-zheng-no-route     郑禾不知道最终路线
claim-zhao-denial        赵简声称不知道集合时辰
claim-zhao-copied-order  集合命令由赵简亲笔抄写
claim-zhao-time          赵简接触并泄露出发时辰
claim-zhao-coerced       赵简家人受到朔原军控制
claim-bridge-open        北桥可以通行重型粮车
claim-du-wheel-question  杜衡询问过新车轮规格
claim-du-fodder-pattern  草料采购量足以推断粮队规模
claim-du-route           杜衡可以综合迹象推断北桥路线
claim-price-cipher       商品价格表编码路线与时辰
claim-no-full-order      无人接触完整运输命令
claim-shuoyuan-received  朔原军收到拼合后的路线与时辰
claim-lu-seal-order      陆淳掌握驿传盖印与调度顺序
claim-zheng-scale        郑禾掌握登记车辆规模
claim-zhao-night-duty    赵简接触值夜安排
claim-south-ford-open    南渡可供普通粮车通行
claim-west-ridge-light   西岭只适合轻车与空车
```

Each claim must include tags that allow only logically valid relation types. For example, `claim-zhao-copied-order` allows `refutes` against `claim-zhao-denial` and `accessedBy` toward `zhao`.

- [ ] **Step 6: Author investigations, interrogations, baits, hints, and endings**

Investigations and reveals:

```text
investigate-handwriting → claim-zhao-copied-order
investigate-du-records  → claim-du-fodder-pattern + claim-price-cipher
investigate-north-bridge → claim-bridge-open
investigate-zhao-family → claim-zhao-coerced
investigate-ambush-site → claim-ambush-north + claim-no-full-order
investigate-deep-du     → claim-du-wheel-question + claim-price-cipher
```

Create three bait options per channel. Required IDs and signals:

```text
bait-lu-south / bait-lu-priority / bait-lu-seal
bait-zheng-12 / bait-zheng-24 / bait-zheng-36
bait-zhao-zi / bait-zhao-chou / bait-zhao-yin
bait-du-south-ford / bait-du-west-ridge / bait-du-north-bridge
```

Use these exact credibility requirements:

| Bait ID | Player-facing label | Required claims |
| --- | --- | --- |
| `bait-lu-south` | 南线调用驿马 | `claim-lu-seal-order` |
| `bait-lu-priority` | 调高南渡通行优先级 | `claim-lu-seal-order`, `claim-lu-ledger-change` |
| `bait-lu-seal` | 制造异常盖印顺序 | `claim-lu-seal-order` |
| `bait-zheng-12` | 登记十二辆粮车 | `claim-zheng-scale` |
| `bait-zheng-24` | 登记二十四辆粮车 | `claim-zheng-scale`, `claim-zheng-repair-change` |
| `bait-zheng-36` | 登记三十六辆粮车 | `claim-zheng-scale`, `claim-zheng-repair-change` |
| `bait-zhao-zi` | 子时集合 | `claim-zhao-time`, `claim-zhao-copied-order` |
| `bait-zhao-chou` | 丑时家书 | `claim-zhao-time`, `claim-zhao-coerced` |
| `bait-zhao-yin` | 寅时集合 | `claim-zhao-time`, `claim-zhao-copied-order` |
| `bait-du-south-ford` | 制造南渡运输迹象 | `claim-south-ford-open`, `claim-du-fodder-pattern` |
| `bait-du-west-ridge` | 制造西岭运输迹象 | `claim-west-ridge-light`, `claim-du-wheel-question` |
| `bait-du-north-bridge` | 制造北桥运输迹象 | `claim-bridge-open`, `claim-du-wheel-question`, `claim-du-fodder-pattern` |

Only Zhao and Du options set `core: true`. `bait-zhao-yin` emits `yin`; `bait-du-north-bridge` emits `northBridge`. The player sees only requirements whose claims have already been discovered.

Create three hint levels for `timeSource`, `routeSource`, `transmission`, and `innocentLiars`. The `timeSource` text is exactly:

```ts
[
  '也许应该确认谁真正知道出发时间。',
  '赵简的口供和集合命令可能存在关联。',
  '赵简称不知道出发时间，但集合命令由他亲笔抄写。',
]
```

Create epilogue fragments for 3 outcomes, 4 owners, and all four character fates. Every fragment must name its consequences and must not alter the already computed `ActionOutcome`.

- [ ] **Step 7: Validate the assembled case**

```ts
// app/src/content/guandu/index.ts
export const guanduCase = validateGameContent({
  id: 'guandu', characters, documents, claims, investigations, interrogations, baits, hints, epilogueFragments,
});
```

Run:

```powershell
npm run test:run -- src/content/guandu/content.test.ts src/game/contentSchema.test.ts
git add app/src/content/guandu
git commit -m "feat: author the complete guandu case"
```

---

### Task 10: Game Provider and Three-Column Intelligence Desk

**Files:**
- Create: `app/src/app/GameProvider.tsx`
- Create: `app/src/app/ErrorBoundary.tsx`
- Create: `app/src/test/renderGame.tsx`
- Modify: `app/src/app/App.tsx`
- Create: `app/src/features/desk/IntelDesk.tsx`
- Create: `app/src/features/desk/TopBar.tsx`
- Create: `app/src/features/desk/IntelDrawer.tsx`
- Create: `app/src/features/desk/Workspace.tsx`
- Create: `app/src/features/desk/CaseFile.tsx`
- Create: `app/src/features/desk/ActionBar.tsx`
- Create: `app/src/features/desk/desk.css`
- Test: `app/src/features/desk/IntelDesk.test.tsx`

**Interfaces:**
- Consumes: `guanduCase`, `createInitialState`, `gameReducer`, persistence load result.
- Produces: `useGame()` context and permanent desktop regions.

- [ ] **Step 1: Write the failing layout test**

```tsx
it('keeps materials, reasoning workspace, and people visible together', () => {
  render(<GameProvider><IntelDesk /></GameProvider>);
  expect(screen.getByRole('region', { name: '情报匣' })).toBeVisible();
  expect(screen.getByRole('main', { name: '工作区域' })).toBeVisible();
  expect(screen.getByRole('region', { name: '人物档案' })).toBeVisible();
  expect(screen.getByText('调查点 3 / 3')).toBeVisible();
  expect(screen.queryByText(/倒计时|剩余.*分钟/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run -- src/features/desk/IntelDesk.test.tsx`

- [ ] **Step 3: Implement context and shell regions**

```tsx
export interface GameContextValue {
  content: GameContent;
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  loadResult: LoadResult;
}

export interface GameProviderProps {
  children: React.ReactNode;
  content?: GameContent;
  initialState?: GameState;
}

export function IntelDesk() {
  return (
    <div className="intel-desk">
      <TopBar />
      <div className="intel-desk__columns">
        <aside aria-label="情报匣"><IntelDrawer /></aside>
        <main aria-label="工作区域"><Workspace /></main>
        <aside aria-label="人物档案"><CaseFile /></aside>
      </div>
      <ActionBar />
    </div>
  );
}
```

Create the shared component-test helper:

```tsx
// app/src/test/renderGame.tsx
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GameProvider } from '../app/GameProvider';
import { guanduCase } from '../content/guandu';
import { createInitialState } from '../game/initialState';
import type { GameState } from '../game/domain';

export function renderGame(ui: ReactNode, overrides: Partial<GameState> = {}) {
  const initialState = { ...createInitialState(), ...overrides };
  return render(<GameProvider content={guanduCase} initialState={initialState}>{ui}</GameProvider>);
}
```

CSS desktop grid: rows `auto 1fr auto`; columns `minmax(220px, 22%) minmax(520px, 56%) minmax(220px, 22%)`; minimum viewport width 1100px. At narrower widths, display an explicit “请使用桌面横屏窗口” notice rather than a mobile redesign.

- [ ] **Step 4: Add explicit stage confirmation**

`ActionBar` opens a confirmation dialog listing the stage, selected investigations/baits, and choices that will lock. Only the dialog's `确认推进` button dispatches `CONFIRM_ADVANCE` after `saveStageSnapshot`.

Add a secondary `恢复阶段快照` action. It shows the snapshot stage and explicitly warns that later progress will be discarded; only `确认恢复` dispatches `RESTORE_STATE`.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm run test:run -- src/features/desk/IntelDesk.test.tsx
npm run build
git add app/src/app app/src/features/desk app/src/test/renderGame.tsx
git commit -m "feat: build the three-column intelligence desk"
```

---

### Task 11: Documents, Claims, Map, and Accessible Relationship Board

**Files:**
- Create: `app/src/features/documents/DocumentDesk.tsx`
- Create: `app/src/features/documents/ClaimCard.tsx`
- Create: `app/src/features/documents/DocumentDesk.test.tsx`
- Create: `app/src/features/board/RelationshipBoard.tsx`
- Create: `app/src/features/board/EvidenceCard.tsx`
- Create: `app/src/features/board/LogicSlot.tsx`
- Create: `app/src/features/board/RelationshipBoard.test.tsx`
- Create: `app/src/features/map/RouteMap.tsx`

**Interfaces:**
- Consumes: documents, claims, relationship validation, `PLACE_RELATIONSHIP` action.
- Produces: document reading/extraction and equivalent drag or keyboard evidence placement.

- [ ] **Step 1: Write failing document extraction test**

```tsx
it('extracts a predefined claim and retains its source', async () => {
  const user = userEvent.setup();
  renderGame(<DocumentDesk documentId="statement-zhao" />);
  await user.click(screen.getByRole('button', { name: '提取主张：赵简不知道集合时辰' }));
  expect(screen.getByRole('button', { name: /赵简声称不知道集合时辰/ })).toHaveAccessibleDescription('来源：赵简口供');
});
```

- [ ] **Step 2: Write failing board parity test**

```tsx
it('places evidence without requiring pointer drag', async () => {
  const user = userEvent.setup();
  renderGame(<RelationshipBoard />, { extractedClaimIds: ['claim-zhao-copied-order'] });
  await user.click(screen.getByRole('button', { name: '选择证据：集合命令由赵简亲笔抄写' }));
  await user.click(screen.getByRole('button', { name: '选择对象：赵简' }));
  await user.click(screen.getByRole('button', { name: '选择关系：接触过' }));
  await user.click(screen.getByRole('button', { name: '放入：接触人物' }));
  expect(screen.getByLabelText('接触人物')).toHaveTextContent('集合命令由赵简亲笔抄写');
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm run test:run -- src/features/documents src/features/board`

- [ ] **Step 4: Implement document tabs and claim extraction**

The central workspace has tabs `文书桌`, `情报关系板`, `路线图`. `DocumentDesk` renders the full document, visually marks extractable passages, and dispatches `EXTRACT_CLAIM` only after the user presses the explicit extraction button.

- [ ] **Step 5: Implement one state mutation path for both input modes**

```ts
function placeEvidence(claimId: string, slot: LogicSlot, targetId: string, kind: RelationKind) {
  const relationship: Relationship = { fromId: claimId, toId: targetId, kind, slot };
  const result = validateRelationship(content, relationship);
  if (!result.ok) return setPlacementError(result.reason);
  dispatch({ type: 'PLACE_RELATIONSHIP', relationship });
}
```

Wrap the board in `DragDropProvider`; its `onDragEnd` calls the same `placeEvidence` function used by the click/keyboard flow. Invalid drops return the card to its source and display the exact reason in an `aria-live="polite"` region.

- [ ] **Step 6: Implement the static route map**

Use semantic SVG with labeled nodes for `驿站`, `北桥`, `南渡`, `西岭`, and `伏击点`; each route exposes distance and vehicle constraints as focusable text. Do not implement pan/zoom or a large map.

- [ ] **Step 7: Verify and commit**

Run:

```powershell
npm run test:run -- src/features/documents src/features/board
npm run build
git add app/src/features/documents app/src/features/board app/src/features/map
git commit -m "feat: add evidence reading and relationship board"
```

---

### Task 12: Investigation, Interrogation, and Three-Level Hints UI

**Files:**
- Create: `app/src/features/investigation/InvestigationPanel.tsx`
- Create: `app/src/features/investigation/InvestigationPanel.test.tsx`
- Create: `app/src/features/interrogation/InterrogationPanel.tsx`
- Create: `app/src/features/interrogation/InterrogationPanel.test.tsx`
- Create: `app/src/features/hints/HintPanel.tsx`
- Create: `app/src/features/hints/HintPanel.test.tsx`

**Interfaces:**
- Consumes: Task 5 rules and hint content.
- Produces: point-limited investigation, evidence-first interrogation, manual hints.

- [ ] **Step 1: Write failing investigation test**

```tsx
it('spends exactly one of three points after confirmation', async () => {
  const user = userEvent.setup();
  renderGame(<InvestigationPanel />);
  await user.click(screen.getByRole('button', { name: '查询赵简家人' }));
  expect(screen.getByText('将消耗 1 个调查点')).toBeVisible();
  await user.click(screen.getByRole('button', { name: '确认调查' }));
  expect(screen.getByText('调查点 2 / 3')).toBeVisible();
});
```

- [ ] **Step 2: Write failing interrogation test**

```tsx
it('requires contradictory evidence before tone can reveal information', async () => {
  const user = userEvent.setup();
  renderGame(<InterrogationPanel characterId="zhao" />);
  await user.selectOptions(screen.getByLabelText('选择口供'), 'claim-zhao-denial');
  await user.selectOptions(screen.getByLabelText('选择证据'), 'claim-zhao-copied-order');
  await user.click(screen.getByRole('radio', { name: '冷静追问' }));
  await user.click(screen.getByRole('button', { name: '提交质询' }));
  expect(screen.getByText(/承认接触过出发时辰/)).toBeVisible();
  expect(screen.getByText('调查点 3 / 3')).toBeVisible();
});
```

- [ ] **Step 3: Write failing hint progression test**

Requesting the same topic three times reveals exactly the three approved texts in order, increments local `hintUsage`, and never changes score or stage.

- [ ] **Step 4: Implement and verify**

Render all six investigations before selection, disable them only when already completed or points are zero, and keep ordinary interrogation available. Person state changes must be visible in the right-side case file.

Run:

```powershell
npm run test:run -- src/features/investigation src/features/interrogation src/features/hints
git add app/src/features/investigation app/src/features/interrogation app/src/features/hints
git commit -m "feat: add investigations interrogations and hints"
```

---

### Task 13: Counterintelligence Bait Planner and Scout Report

**Files:**
- Create: `app/src/features/bait/BaitPlanner.tsx`
- Create: `app/src/features/bait/ScoutReport.tsx`
- Test: `app/src/features/bait/BaitPlanner.test.tsx`

**Interfaces:**
- Consumes: Task 6 `evaluateBaitPlan`, 12 case bait options.
- Produces: real plan, one bait per channel, deterministic scout report.

- [ ] **Step 1: Write the failing complete-plan test**

```tsx
const preparedChainState: Partial<GameState> = {
  stage: 'bait',
  extractedClaimIds: ['claim-zhao-time', 'claim-du-route', 'claim-bridge-open', 'claim-du-wheel-question', 'claim-du-fodder-pattern'],
};

type TestUser = ReturnType<typeof userEvent.setup>;

async function chooseRealPlan(user: TestUser, route: string, time: string) {
  await user.selectOptions(screen.getByLabelText('真实路线'), route);
  await user.selectOptions(screen.getByLabelText('真实时辰'), time);
}

async function chooseBait(user: TestUser, channel: string, option: string) {
  const group = screen.getByRole('group', { name: channel });
  await user.click(within(group).getByRole('radio', { name: option }));
}

it('requires a real plan and one bait for every channel', async () => {
  const user = userEvent.setup();
  renderGame(<BaitPlanner />, preparedChainState);
  await chooseRealPlan(user, '南渡', '子时');
  await chooseBait(user, '陆淳', '南线调用驿马');
  await chooseBait(user, '郑禾', '登记三十六辆粮车');
  await chooseBait(user, '赵简', '寅时集合');
  await chooseBait(user, '杜衡', '制造北桥运输迹象');
  expect(screen.getByRole('button', { name: '执行投饵' })).toBeEnabled();
});
```

- [ ] **Step 2: Write the failing deterministic-report test**

```tsx
it('reports fixed enemy behavior without revealing the answer', async () => {
  const user = userEvent.setup();
  renderGame(<BaitPlanner />, preparedChainState);
  await chooseRealPlan(user, 'southFord', 'zi');
  await chooseBait(user, '陆淳', '南线调用驿马');
  await chooseBait(user, '郑禾', '登记三十六辆粮车');
  await chooseBait(user, '赵简', '寅时集合');
  await chooseBait(user, '杜衡', '制造北桥运输迹象');
  await user.click(screen.getByRole('button', { name: '执行投饵' }));
  await user.click(screen.getByRole('button', { name: '确认执行' }));
  expect(screen.getByText(/北桥/)).toBeVisible();
  expect(screen.getByText(/寅时/)).toBeVisible();
  expect(screen.queryByText(/赵简.*泄露|杜衡.*泄露/)).not.toBeInTheDocument();
  expect(screen.queryByText(/可能是假动作|随机/)).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm run test:run -- src/features/bait/BaitPlanner.test.tsx`

- [ ] **Step 4: Implement planner and report**

Show four channel cards with role-appropriate options and a separate real convoy card. Display unmet credibility conditions using already discovered evidence titles; do not reveal undiscovered requirements. `执行投饵` opens a final summary, saves a snapshot, evaluates once, stores the result, and cannot be repeated.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:run -- src/features/bait/BaitPlanner.test.tsx src/game/rules/bait.test.ts
git add app/src/features/bait
git commit -m "feat: add counterintelligence bait planning"
```

---

### Task 14: Final Report and Political Epilogue UI

**Files:**
- Create: `app/src/features/report/FinalReport.tsx`
- Create: `app/src/features/report/EvidencePicker.tsx`
- Create: `app/src/features/report/FinalReport.test.tsx`
- Create: `app/src/features/ending/TruthOwnerChoice.tsx`
- Create: `app/src/features/ending/Epilogue.tsx`
- Create: `app/src/features/ending/Epilogue.test.tsx`

**Interfaces:**
- Consumes: Task 7 scoring/ending functions and the stored bait outcome.
- Produces: evidence-backed report, separate truth-owner decision, seven-paragraph ending.

- [ ] **Step 1: Write failing evidence requirement test**

```tsx
const reportStageState: Partial<GameState> = {
  stage: 'report',
  baitBand: 'bothCore',
  enemyReport: { route: 'northBridge', time: 'yin' },
  extractedClaimIds: ['claim-zhao-copied-order', 'claim-du-route', 'claim-price-cipher', 'claim-zhao-coerced'],
};

it('does not submit a conclusion without supporting evidence', async () => {
  const user = userEvent.setup();
  renderGame(<FinalReport />, reportStageState);
  await user.click(screen.getByRole('checkbox', { name: '出发时辰' }));
  await user.click(screen.getByRole('checkbox', { name: '运输路线' }));
  await user.selectOptions(screen.getByLabelText('时间来自谁'), 'zhao');
  await user.selectOptions(screen.getByLabelText('路线来自谁'), 'du');
  await user.selectOptions(screen.getByLabelText('谁负责拼合并传递'), 'du');
  await user.selectOptions(screen.getByLabelText('信息如何离开驿站'), 'priceCipher');
  await user.selectOptions(screen.getByLabelText('建议如何处理'), 'differentiate');
  expect(screen.getByRole('button', { name: '提交最终汇报' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '证据：赵简亲笔集合命令' }));
  await user.click(screen.getByRole('button', { name: '证据：杜衡可推断北桥路线' }));
  await user.click(screen.getByRole('button', { name: '证据：商品价格表暗号' }));
  expect(screen.getByRole('button', { name: '提交最终汇报' })).toBeEnabled();
});
```

- [ ] **Step 2: Write failing outcome/owner separation test**

```tsx
it.each([
  ['交给沧河军', 'canghe'], ['交给朔原军', 'shuoyuan'], ['交给官渡里社', 'lishe'], ['销毁关键证据', 'destroyed'],
] as const)('owner action %s cannot rewrite a second ambush', async (buttonName) => {
  const user = userEvent.setup();
  renderGame(<TruthOwnerChoice />, { stage: 'ending', actionOutcome: 'ambushedAgain' });
  await user.click(screen.getByRole('button', { name: buttonName }));
  await user.click(screen.getByRole('button', { name: '确认真相归属' }));
  expect(screen.getByRole('heading', { name: '再次伏击' })).toBeVisible();
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm run test:run -- src/features/report src/features/ending`

- [ ] **Step 4: Implement report and epilogue flow**

Render five report sections from the spec, require at least one evidence claim for each core conclusion, show a read-only summary, then submit once. After the action result is displayed, render four owner cards: `沧河军`, `朔原军`, `官渡里社`, `销毁关键证据`. Compose and render the seven epilogue paragraphs only after owner confirmation.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:run -- src/features/report src/features/ending src/game/rules/report.test.ts src/game/rules/ending.test.ts
git add app/src/features/report app/src/features/ending
git commit -m "feat: add final report and political epilogue"
```

---

### Task 15: Recovery UI, Visual System, Silhouettes, and Procedural Sound

**Files:**
- Create: `app/src/features/save/RecoveryScreen.tsx`
- Create: `app/src/features/save/RecoveryScreen.test.tsx`
- Create: `app/src/styles/tokens.css`
- Create: `app/src/styles/global.css`
- Create: `app/public/icons/lu-chun.svg`
- Create: `app/public/icons/zheng-he.svg`
- Create: `app/public/icons/zhao-jian.svg`
- Create: `app/public/icons/du-heng.svg`
- Create: `app/src/audio/sound.ts`
- Test: `app/src/audio/sound.test.ts`

**Interfaces:**
- Consumes: `LoadResult`, character IDs, named UI sound events.
- Produces: recover/new-game choice, parchment visual system, four SVG silhouettes, optional procedural feedback sounds.

- [ ] **Step 1: Write failing recovery test**

```tsx
it('offers recovery without silently overwriting corrupt data', async () => {
  const onRecover = vi.fn();
  const onNewGame = vi.fn();
  render(<RecoveryScreen result={{ kind: 'recovered', state: createInitialState() }} onRecover={onRecover} onNewGame={onNewGame} />);
  expect(screen.getByText(/已找到上一个有效阶段快照/)).toBeVisible();
  expect(screen.getByRole('button', { name: '恢复快照' })).toBeEnabled();
  expect(screen.getByRole('button', { name: '开始新游戏' })).toBeEnabled();
});
```

- [ ] **Step 2: Define design tokens and focus behavior**

```css
:root {
  --paper: #f3e7c9;
  --paper-deep: #d8c39a;
  --ink: #28231d;
  --muted-ink: #665b4c;
  --seal: #8d2d24;
  --wood: #3e3024;
  --focus: #1769aa;
  --shadow: 0 10px 30px rgb(48 35 20 / 18%);
}

:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
```

- [ ] **Step 3: Create four simple SVG silhouettes**

Use this exact accessible structure for each file, changing the `<title>` and symbol group only:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">
  <title>陆淳</title>
  <circle cx="60" cy="36" r="18" fill="#342f29"/>
  <path d="M27 108c2-30 14-48 33-48s31 18 33 48z" fill="#342f29"/>
  <g aria-hidden="true" fill="#8d2d24">
    <rect x="78" y="75" width="22" height="18" rx="2"/>
    <rect x="83" y="69" width="12" height="8" rx="2"/>
  </g>
</svg>
```

Use these symbol primitives in the other three files: Zheng—rounded grain sack with a tied neck; Zhao—diagonal brush plus rectangular order slip; Du—three horizontal abacus rails with three beads each. Keep the same head/body silhouette and viewBox. Do not depict historical celebrities or use generated portraits.

- [ ] **Step 4: Write and implement sound tests**

```ts
const soundEvents = ['paper', 'brush', 'stamp', 'wood', 'wind', 'hoof', 'distantDrum', 'horn', 'night'] as const;

it.each(soundEvents)('does nothing for %s when audio is unavailable or muted', (event) => {
  const sound = createSoundController({ audioContext: undefined, muted: true });
  expect(() => sound.play(event)).not.toThrow();
});
```

Implement the controller with this public contract:

```ts
export const soundEvents = ['paper', 'brush', 'stamp', 'wood', 'wind', 'hoof', 'distantDrum', 'horn', 'night'] as const;
export type SoundEvent = typeof soundEvents[number];
export interface SoundController { play(event: SoundEvent): void; setMuted(value: boolean): void }

const cue: Record<SoundEvent, { kind: 'tone' | 'noise'; frequency: number; duration: number }> = {
  paper: { kind: 'noise', frequency: 900, duration: 0.08 },
  brush: { kind: 'noise', frequency: 600, duration: 0.12 },
  stamp: { kind: 'tone', frequency: 90, duration: 0.09 },
  wood: { kind: 'tone', frequency: 130, duration: 0.08 },
  wind: { kind: 'noise', frequency: 240, duration: 0.8 },
  hoof: { kind: 'tone', frequency: 170, duration: 0.07 },
  distantDrum: { kind: 'tone', frequency: 70, duration: 0.35 },
  horn: { kind: 'tone', frequency: 220, duration: 0.5 },
  night: { kind: 'noise', frequency: 1800, duration: 0.4 },
};
```

For tone cues, create an oscillator and gain node, ramp gain to zero, and stop at `currentTime + duration`. For noise cues, fill a mono `AudioBuffer` with values in `[-1, 1]`, pass it through a low-pass filter set to `frequency`, and apply the same gain envelope. Sound starts only after a user gesture, has a visible mute button, and never blocks progression.

- [ ] **Step 5: Verify visual/recovery integration and commit**

Run:

```powershell
npm run test:run -- src/features/save src/audio
npm run build
git add app/src/features/save app/src/styles app/public/icons app/src/audio
git commit -m "feat: add recovery and prototype presentation"
```

---

### Task 16: Full-Flow Browser Tests and Prototype Acceptance

**Files:**
- Create: `app/playwright.config.ts`
- Create: `app/e2e/helpers.ts`
- Create: `app/e2e/happy-path.spec.ts`
- Create: `app/e2e/partial-path.spec.ts`
- Create: `app/e2e/failure-and-politics.spec.ts`
- Create: `app/README.md`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: complete application.
- Produces: repeatable Chromium acceptance suite and local run instructions.

- [ ] **Step 1: Configure Playwright against the Vite app**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: { command: 'npm run build && npm run preview -- --host 127.0.0.1', port: 4173, reuseExistingServer: false },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 2: Write the failing happy-path browser test**

Create exact role-based helpers in `app/e2e/helpers.ts`:

```ts
import { expect, type Page } from '@playwright/test';

async function openAndExtract(page: Page, documentTitle: string, claimLabels: string[]) {
  await page.getByRole('button', { name: `打开文书：${documentTitle}` }).click();
  for (const label of claimLabels) {
    await page.getByRole('button', { name: `提取主张：${label}` }).click();
  }
}

async function advanceStage(page: Page) {
  await page.getByRole('button', { name: '结束当前阶段' }).click();
  await page.getByRole('button', { name: '确认推进' }).click();
}

async function confrontZhaoWithOrder(page: Page) {
  await page.getByRole('button', { name: '审讯' }).click();
  await page.getByLabel('选择人物').selectOption('zhao');
  await page.getByLabel('选择口供').selectOption('claim-zhao-denial');
  await page.getByLabel('选择证据').selectOption('claim-zhao-copied-order');
  await page.getByRole('radio', { name: '冷静追问' }).click();
  await page.getByRole('button', { name: '提交质询' }).click();
  await expect(page.getByText(/承认接触过出发时辰/)).toBeVisible();
}

async function placeRelation(page: Page, evidence: string, target: string, relation: string, slot: string) {
  await page.getByRole('button', { name: `选择证据：${evidence}` }).click();
  await page.getByRole('button', { name: `选择对象：${target}` }).click();
  await page.getByRole('button', { name: `选择关系：${relation}` }).click();
  await page.getByRole('button', { name: `放入：${slot}` }).click();
}

export async function playCorrectInvestigation(page: Page) {
  await openAndExtract(page, '赵简口供', ['赵简不知道集合时辰', '集合命令由赵简亲笔抄写']);
  await openAndExtract(page, '粮车维修记录', ['杜衡询问过新车轮规格', '郑禾修改过车辆损坏记录']);
  await openAndExtract(page, '北桥修缮记录', ['北桥可以通行重型粮车']);
  await openAndExtract(page, '驿站出入簿', ['杜衡可以综合迹象推断北桥路线']);
  await advanceStage(page);
  await page.getByRole('button', { name: '深查杜衡的采购和价格记录' }).click();
  await page.getByRole('button', { name: '确认调查' }).click();
  await page.getByRole('button', { name: '查询赵简家人' }).click();
  await page.getByRole('button', { name: '确认调查' }).click();
  await confrontZhaoWithOrder(page);
  await advanceStage(page);
  await page.getByRole('tab', { name: '情报关系板' }).click();
  await placeRelation(page, '集合命令由赵简亲笔抄写', '赵简', '接触过', '接触人物');
  await placeRelation(page, '杜衡可以综合迹象推断北桥路线', '杜衡', '推断出', '推断或传递方式');
  await advanceStage(page);
}

export async function playMinimumInvestigation(page: Page) {
  await openAndExtract(page, '赵简口供', ['赵简不知道集合时辰', '集合命令由赵简亲笔抄写']);
  await openAndExtract(page, '驿站出入簿', ['杜衡可以综合迹象推断北桥路线']);
  await advanceStage(page);
  await page.getByRole('button', { name: '深查杜衡的采购和价格记录' }).click();
  await page.getByRole('button', { name: '确认调查' }).click();
  await confrontZhaoWithOrder(page);
  await advanceStage(page);
  await page.getByRole('tab', { name: '情报关系板' }).click();
  await placeRelation(page, '集合命令由赵简亲笔抄写', '赵简', '接触过', '接触人物');
  await placeRelation(page, '杜衡可以综合迹象推断北桥路线', '杜衡', '推断出', '推断或传递方式');
  await advanceStage(page);
}

async function chooseRadio(page: Page, group: string, option: string) {
  await page.getByRole('group', { name: group }).getByRole('radio', { name: option }).click();
}

export async function executeCredibleZhaoDuBaits(page: Page) {
  await page.getByLabel('真实路线').selectOption('southFord');
  await page.getByLabel('真实时辰').selectOption('zi');
  await chooseRadio(page, '陆淳', '南线调用驿马');
  await chooseRadio(page, '郑禾', '登记三十六辆粮车');
  await chooseRadio(page, '赵简', '寅时集合');
  await chooseRadio(page, '杜衡', '制造北桥运输迹象');
  await page.getByRole('button', { name: '执行投饵' }).click();
  await page.getByRole('button', { name: '确认执行' }).click();
  const report = page.getByRole('region', { name: '斥候报告' });
  await expect(report.getByText(/北桥/)).toBeVisible();
  await expect(report.getByText(/寅时/)).toBeVisible();
}

export async function executeFailedCoreBaits(page: Page) {
  await page.getByLabel('真实路线').selectOption('southFord');
  await page.getByLabel('真实时辰').selectOption('zi');
  await chooseRadio(page, '陆淳', '南线调用驿马');
  await chooseRadio(page, '郑禾', '登记三十六辆粮车');
  await chooseRadio(page, '赵简', '丑时家书');
  await chooseRadio(page, '杜衡', '制造西岭运输迹象');
  await page.getByRole('button', { name: '执行投饵' }).click();
  await page.getByRole('button', { name: '确认执行' }).click();
}

export async function submitReport(page: Page, routeSource: 'du' | 'zheng' = 'du') {
  await page.getByRole('checkbox', { name: '出发时辰' }).check();
  await page.getByRole('checkbox', { name: '运输路线' }).check();
  await page.getByLabel('时间来自谁').selectOption('zhao');
  await page.getByLabel('路线来自谁').selectOption(routeSource);
  await page.getByLabel('谁负责拼合并传递').selectOption('du');
  await page.getByLabel('信息如何离开驿站').selectOption('priceCipher');
  await page.getByLabel('建议如何处理').selectOption('differentiate');
  await page.getByRole('button', { name: '证据：赵简亲笔集合命令' }).click();
  await page.getByRole('button', { name: routeSource === 'du' ? '证据：杜衡可推断北桥路线' : '证据：郑禾修改车辆损坏记录' }).click();
  await page.getByRole('button', { name: '证据：商品价格表暗号' }).click();
  await page.getByRole('button', { name: '提交最终汇报' }).click();
  await page.getByRole('button', { name: '确认提交' }).click();
}
```

```ts
import { expect, test } from '@playwright/test';
import { executeCredibleZhaoDuBaits, playCorrectInvestigation, submitReport } from './helpers';

test('completes network closure and local handoff', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '官渡密报' })).toBeVisible();
  await playCorrectInvestigation(page);
  await executeCredibleZhaoDuBaits(page);
  await submitReport(page);
  await page.getByRole('button', { name: '交给官渡里社' }).click();
  await page.getByRole('button', { name: '确认真相归属' }).click();
  await expect(page.getByRole('heading', { name: '封网成功' })).toBeVisible();
  const epilogue = page.getByRole('region', { name: '政治尾声' });
  await expect(epilogue.getByText(/官渡里社/)).toBeVisible();
  await expect(epilogue.getByText(/赵简.*胁迫/)).toBeVisible();
});
```

- [ ] **Step 3: Add partial and failure path tests**

```ts
// app/e2e/partial-path.spec.ts
test('saves the convoy but loses the network after accusing Zheng', async ({ page }) => {
  await page.goto('/');
  await playCorrectInvestigation(page);
  await executeCredibleZhaoDuBaits(page);
  await submitReport(page, 'zheng');
  await expect(page.getByRole('heading', { name: '保粮失人' })).toBeVisible();
});
```

```ts
// app/e2e/failure-and-politics.spec.ts
const owners = ['交给沧河军', '交给朔原军', '交给官渡里社', '销毁关键证据'] as const;
for (const owner of owners) {
  test(`a political choice cannot erase the second ambush: ${owner}`, async ({ page }) => {
    await page.goto('/');
    await playMinimumInvestigation(page);
    await executeFailedCoreBaits(page);
    await submitReport(page);
    await expect(page.getByRole('heading', { name: '再次伏击' })).toBeVisible();
    await page.getByRole('button', { name: owner }).click();
    await page.getByRole('button', { name: '确认真相归属' }).click();
    await expect(page.getByRole('heading', { name: '再次伏击' })).toBeVisible();
  });
}
```

- [ ] **Step 4: Add the no-timer and snapshot acceptance checks**

```ts
test('never advances with time and restores only after confirmation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/剩余.*(?:分钟|秒)|倒计时/)).toHaveCount(0);
  await playCorrectInvestigation(page);
  await expect(page.getByText(/剩余.*(?:分钟|秒)|倒计时/)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('tab', { name: '情报关系板' })).toBeVisible();
  await page.getByRole('button', { name: '恢复阶段快照' }).click();
  await expect(page.getByText(/将丢弃快照之后的进度/)).toBeVisible();
  await page.getByRole('button', { name: '取消' }).click();
  await expect(page.getByRole('tab', { name: '情报关系板' })).toBeVisible();
  await page.getByRole('button', { name: '恢复阶段快照' }).click();
  await page.getByRole('button', { name: '确认恢复' }).click();
  await expect(page.getByText('第三阶段 · 还原泄密链')).toBeVisible();
});
```

- [ ] **Step 5: Run the complete verification suite**

Run:

```powershell
npm run test:run
npm run build
npm run e2e
```

Expected: all unit, component, build, and Chromium tests pass with no console errors.

- [ ] **Step 6: Document the local workflow**

`app/README.md` must contain:

```text
Requirements: Node.js 22.x
Install: npm install
Develop: npm run dev
Unit/component tests: npm run test:run
Production build: npm run build
Browser acceptance: npm run e2e
Storage: browser localStorage only; no server or account
```

Update `HANDOFF.md` current stage to state that the formal spec and implementation plan exist, and link both paths. Do not mark implementation complete.

- [ ] **Step 7: Final commit**

```powershell
git add app HANDOFF.md
git commit -m "test: verify complete guandu mibao prototype"
git status --short
```

Expected: clean worktree after the final commit.
