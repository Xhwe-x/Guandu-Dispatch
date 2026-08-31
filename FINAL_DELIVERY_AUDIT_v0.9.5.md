# FINAL DELIVERY AUDIT v0.9.5 — Core Experience Pass

**Audit date:** 2026-08-29  
**Target:** Guandu Dispatch v0.9.5  
**Scope:** Complete the approved core gameplay loop implementation plan from Task 5 through Task 10 without changing the frozen truth of the first case.

## 1. Release judgment

The v0.9.5 **implementation scope is code-complete for Tasks 1–10** and the project now contains a continuous rules-level loop:

> 调查 → 自动入卷 → 案卷反向导航 → 人物质证 → 新事实 → Theory Gap → 补查 → Theory supported → Theory-driven 投饵 → Enemy Feedback → Theory verified / 返回调查 → 曹操复命 → 最终报告

This audit intentionally separates **implemented behavior** from **environment-dependent verification**. The core static/runtime delivery contracts pass in this container. The standard Vitest/build/lint commands cannot be certified here because the local `node_modules` is an incomplete interrupted installation and dependency restoration cannot reach the npm registry.

## 2. Implemented

### Task 5 — Dossier knowledge hub + reverse navigation

- `ObjectiveRail` is mounted into the dossier flow.
- Knowledge state badges are shown for dossier entries.
- Person/document/fact entries expose reverse actions such as “前去询问”, “查看原件”, “查看来源”, and “加入推演”.
- Dossier targets can route back to relevant people, documents, knowledge, or Theory Gaps.

### Task 6 — Persistent Theory Graph + Gap system

- Replaced the old one-shot “three answers” deduction contract with a persistent editable theory workspace.
- Theory can remain incomplete or conflicted.
- Evaluation returns explanatory gaps: `missing-source`, `missing-route`, `missing-transmitter`, `unsupported-edge`, `conflict`.
- Theory Gaps can drive the player back toward relevant dossier material rather than returning a binary “wrong answer”.
- `supported` remains distinct from `verified`.

### Task 7 — B-mode Guidance

- Lightweight proactive cue + manual deepening levels 1→2→3.
- The same cue is proactively shown at most once.
- Manual hint level is capped at 3.
- Related person/document directions can be surfaced without giving the final answer.
- Legacy `hintUsage` compatibility remains intact.

### Task 8 — Theory-driven bait + Enemy Feedback

- Core counter-intelligence experiment now reads the supported theory instead of forcing four equally weighted channels.
- Zhao Jian time channel and Du Heng route/cipher channel are the two core verification channels.
- Lu Chun / Zheng He remain optional controls/noise channels.
- Enemy feedback writes back into knowledge, theory edges, experiment state, and objective progression.
- Partial/no response can return the player to investigation instead of forcing case closure.

### Task 9 — v5 → v6 persistence migration

- Current state/schema is v6 and includes `coreLoop` persistence.
- Explicit legacy v5 schema is retained.
- v5 load path infers the minimum compatible v6 state from existing `extractedClaimIds`, `relationships`, `selectedBaitIds`, and `enemyReport` without deleting legacy progression.
- Migration recognizes both the older price-cipher support relationship and the v0.9.5-compatible Du-Heng transmission relationship.
- Migration creates meaningful incomplete-theory gaps rather than silently treating old saves as solved.
- v6 saves are accepted by the current loader.

### Task 10 — Full core-loop integration and delivery contracts

- Added rules-level `applyEnemyFeedbackResolution()` so feedback integration is testable outside UI components.
- Added full `CoreLoopPlaythrough.test.tsx` covering recoverable wrong evidence, early missing-route theory, supplementary investigation, supported theory, dual-core bait, verified feedback, and final report stage.
- Added zero-frontend-dependency runtime playthrough verification.
- Added v0.9.5 static delivery contract.
- Updated only the old v0.9 acceptance rules that directly contradicted the approved v0.9.5 design; other legacy contracts continue to run.
- Package version is `0.9.5`; `verify:final` points to `verify:v095:deep`.

## 3. Additional defect fixed during integration

A core bait could previously be configured with the **same route/time as the real convoy plan**. That makes the experiment non-distinguishable: the enemy can behave exactly as before while the game risks treating the outcome as verification.

v0.9.5 now rejects a core experiment when the fake Zhao time equals the real time or the fake Du route equals the real route. The UI disables those choices and the rules layer independently enforces the same invariant.

## 4. Deliberately preserved / deferred

Preserved for compatibility or scope control:

- Frozen first-case truth: Zhao Jian leaks assembly time; Du Heng infers the route from peripheral fragments and performs integration/transmission through the price cipher.
- Legacy `extractedClaimIds`, `relationships`, bait/presentation recovery fields are retained during the compatibility period.
- Existing React + reducer + current DnD/CSS stack is reused; no XState, React Flow, Radix, or Motion dependency was added.

Deferred beyond this Core Experience Pass:

- Commercial-grade portrait emotion sets / 2.5D CG layer production / final voice production.
- New cases or randomized culprits.
- External-library rewrite of the state machine or theory canvas.
- Multi-player or online backend work.

## 5. Fresh machine-verifiable evidence

The final delivery must be re-verified immediately before packaging. The expected evidence set is:

```bash
cd app
npm run verify:v095
npm run verify:v095:deep
node CHECKPOINTS/task9-red.cjs
node CHECKPOINTS/task10-red.cjs
node CHECKPOINTS/task10-bait-red.cjs
```

The final checkpoint file `app/CHECKPOINTS/core-loop-final.txt` records the fresh execution results used for packaging.

## 6. Standard toolchain verification limitation in this container

The following commands were attempted against the current workspace but cannot be marked PASS in this container:

### `npm run test:run`

Observed failure:

```text
sh: 1: vitest: not found
```

### `npm run build`

Observed failure:

```text
error TS2688: Cannot find type definition file for 'vite/client'.
error TS2688: Cannot find type definition file for 'node'.
```

### `npm run lint`

Observed failure:

```text
sh: 1: oxlint: not found
```

Root cause observed during verification: the workspace contained an incomplete interrupted `node_modules` installation, including missing executables and type packages. A dependency restoration attempt was unable to complete because the environment could not reach the npm registry. The incomplete `node_modules` directory was **removed before packaging**, so the delivered source package is clean and requires a fresh `npm ci`. This is an **environment/toolchain verification gap**, not evidence that these three commands pass.

A clean development machine must run:

```bash
npm ci
npm run test:run
npm run build
npm run lint
```

before treating v0.9.5 as production-certified.

## 7. Remaining manual acceptance risks

These are not automatically certified by the rules/static contracts:

- Real-browser 1366×768 horizontal-overflow check.
- 1920×1080 and 2560×1440 visual hierarchy review.
- Portrait aspect-ratio and safe-frame inspection on real rendered assets.
- Keyboard/focus behavior across dossier → person → theory → bait → feedback round trips.
- Save/load UX with real v5 save files from user play sessions.
- 3–5 blind-player playtests to confirm that B-mode guidance is sufficient without becoming answer-spoon-feeding.

## 8. Release boundary

This package is suitable as the **v0.9.5 Core Experience Pass implementation checkpoint**. It should not be described as fully production-certified until a clean dependency installation has passed the standard Vitest/build/lint suite and the real-browser acceptance items above have been completed.
