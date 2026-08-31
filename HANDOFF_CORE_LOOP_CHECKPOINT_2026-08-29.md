# 《官渡密报》核心玩法闭环实施检查点交接

> **SUPERSEDED BY v0.9.5 FINAL IMPLEMENTATION — 2026-08-29**  
> 本文件保留为“暂停时的中间检查点”历史记录。当前源码已经继续完成 Task 5–10；请以 `README.md`、`FINAL_DELIVERY_AUDIT_v0.9.5.md`、`docs/superpowers/specs/2026-08-29-core-gameplay-loop-design.md` 和 `app/CHECKPOINTS/core-loop-final.txt` 为当前状态依据，不要再按本文件第 4–8 节的“未完成”判断回退代码。


**检查点日期：** 2026-08-29  
**基础版本：** Guandu Dispatch v0.9.4  
**历史检查点目标：** v0.9.5 Core Experience Pass（当时尚未完成）  
**历史检查点状态：** 当时已暂停开发；Task 1–4 已完成并保留，Task 5 只建立 UI 骨架，Task 6–10 未实施。

---

## 1. 本检查点用途

这是为了暂停当前工作而保存的**中间源码检查点**，不是正式可发布的 v0.9.5。

后续继续时，应直接以本目录为基础，不要重新从 v0.9.4 开始，也不要把当前检查点当作最终试玩版发布。

核心设计规格：

- `docs/superpowers/specs/2026-08-29-core-gameplay-loop-design.md`

实施计划：

- `docs/superpowers/plans/2026-08-29-core-gameplay-loop-implementation.md`

---

## 2. 已冻结的核心设计

采用：**B 半开放调查 + 轻主动提醒 + 玩家主动加深提示**。

最终目标闭环固定为：

> 调查发现线索 → 自动收入案卷 → 从案卷跳回人物/文书 → 给人物出示证据 → 得到新事实 → 拖入泄密链 → 找到缺口 → 回头补查 → 链条成立 → 按链条设计投饵 → 敌军回声验证/推翻 → 更新案卷

第一案核心真相不得改变：

- 赵简泄露集合时辰；
- 杜衡从草料、车辆、道路等碎片推断路线；
- 杜衡通过价格暗号完成情报拼合 / 传递；
- 最终玩法核心不是“找一个坏人”，而是“重建敌军如何获得可用军情”。

---

## 3. 已完成任务

### Task 1 — Core Loop 领域模型与 v6 状态骨架

已完成：

- `GameState.version` 从 5 改为 6；
- 新增 `CoreLoopState`；
- 新增知识状态：`unknown / observed / suspected / contradicted / supported / verified / excluded`；
- 新增 `CaseObjective`；
- 新增 `EvidenceReaction`；
- 新增理论图节点 / 边 / Gap / Evaluation；
- 新增 Guidance 状态；
- 新增 BaitExperiment / EnemyFeedback；
- reducer 新增 core-loop actions；
- 新增 `src/game/coreLoopSelectors.ts`。

关键文件：

- `app/src/game/domain.ts`
- `app/src/game/initialState.ts`
- `app/src/game/reducer.ts`
- `app/src/game/coreLoopSelectors.ts`

运行检查：`CHECKPOINTS/task1-runtime.ts` → **PASS**。

---

### Task 2 — 官渡第一案核心内容配置

已完成：

六个固定目标：

1. `objective-time-leak`
2. `objective-route-leak`
3. `objective-integration`
4. `objective-transmission`
5. `objective-counterintel`
6. `objective-verify-network`

同时已配置：

- 赵简 / 陆淳 / 郑禾 / 杜衡的主要 EvidenceReaction；
- 五组 B 模式三级 GuidanceCue；
- 核心 TheoryNode 元数据。

关键文件：

- `app/src/content/guandu/coreLoop.ts`
- `app/src/content/guandu/coreLoop.test.ts`
- `app/src/content/guandu/index.ts`

运行检查：`CHECKPOINTS/task2-runtime.ts` → **PASS**。

---

### Task 3 — 知识状态更新与目标推进

已完成：

- 调查发现的 Claim 可同步成为 `observed` 知识；
- 知识项记录人物 / 文书来源关系；
- 知识状态只允许升级，不允许 `verified → observed` 降级；
- 目标根据知识状态推进，而不是单纯依赖页面跳转；
- `applyInvestigation()` 开始同步 legacy `extractedClaimIds` 与新知识层。

关键文件：

- `app/src/game/rules/knowledge.ts`
- `app/src/game/rules/knowledge.test.ts`
- `app/src/game/rules/investigation.ts`

运行检查：`CHECKPOINTS/task3-runtime.ts` → **PASS**。

---

### Task 4 — 人物“出示证据”反应规则

已完成：

- 新增 `resolveEvidenceReaction()`；
- 正确证据可以推进知识状态和人物突破；
- 错误证据返回有信息量的回应；
- 错误证据不扣调查令；
- 错误证据不会把人物永久锁成 hostile；
- 赵简审讯从“选择策略得到结果”开始转向“问法 + 证据”；
- 陆淳 / 郑禾 / 杜衡对质开始改用 EvidenceReaction。

关键文件：

- `app/src/game/rules/evidenceReaction.ts`
- `app/src/game/rules/evidenceReaction.test.ts`
- `app/src/features/scenes/InterrogationScene.tsx`
- `app/src/features/scenes/NetworkInvestigationScene.tsx`

运行检查：`CHECKPOINTS/task4-runtime.ts` → **PASS**。

---

## 4. Task 5 当前只做到“骨架”，不能视为完成

已经创建：

- `app/src/ui/game/ObjectiveRail.tsx`
- `app/src/ui/game/KnowledgeStatusBadge.tsx`
- 对应 `game.css` 样式骨架；
- reducer 的 `READ_DOCUMENT / EXTRACT_CLAIM` 已开始自动写入 core-loop knowledge。

但以下内容**尚未接入**：

- `CaseNavigator` 尚未真正挂载 `ObjectiveRail`；
- 案卷人物页尚未显示知识状态；
- 尚未加入“前去询问”；
- 尚未加入“查看原件”；
- 尚未加入“加入推演”；
- 尚未实现从案卷反向导航人物 / 文书 / Theory Gap。

`CHECKPOINTS/task5-red.cjs` 当前应当失败，这是**预期状态**：

```text
hasObjective: false
hasKnowledge: false
hasActions: false
```

继续开发时应从 **Task 5 Step 3** 左右开始，而不是重做 Task 1–4。

---

## 5. 尚未实施的任务

### Task 6
持久化泄密链 Theory Graph + Gap 系统。

需要实现：

- 玩家自由添加 / 调整关系；
- 理论允许 incomplete；
- 不使用“答错”；
- 返回 `missing-route / missing-source / missing-transmitter / unsupported-edge / conflict`；
- 点击 Gap 可反向打开相关人物 / 文书。

### Task 7
B 模式完整 Guidance System。

需要实现：

- 轻主动提示；
- 同一提示主动出现最多一次；
- manual level 1 → 2 → 3；
- 无弹窗打断；
- 解决后自动 resolved；
- 无效推理 / 未使用证据 / 新 Gap 等触发条件。

### Task 8
Theory-driven 投饵实验。

需要实现：

- 投饵必须读取玩家已经支持的 Theory Edge；
- 不再只是“四个人各选一个假消息”；
- 记录实验 hypothesis / expectedSignals；
- EnemyFeedback 反向验证 / 推翻 Theory Edge；
- 回声写回知识状态。

### Task 9
v5 → v6 存档迁移。

**这是当前最重要的技术风险。**

GameState 已经升级到 v6，但存档迁移任务还没有实施。因此当前检查点**不建议拿旧存档直接试玩**。

必须：

- 接受旧 v5 存档；
- 根据 `readDocumentIds / extractedClaimIds / relationships / selectedBaitIds / enemyReport` 初始化 coreLoop；
- 输出统一 v6；
- 不能丢原案件进度；
- legacy presentation recovery 继续有效。

### Task 10
完整闭环 Playthrough + 交付验收。

目标连续流程：

> 调查 → 自动入卷 → 案卷跳转 → 人物质证 → 新事实 → Theory Gap → 补查 → Theory supported → 投饵 → Enemy Feedback → Theory verified → 案卷更新

---

## 6. 当前验证结果

### 通过

- Task 1 runtime：PASS
- Task 2 runtime：PASS
- Task 3 runtime：PASS
- Task 4 runtime：PASS
- `node scripts/verify-v09-syntax.cjs`：**149 TS/TSX files，0 syntax diagnostics**

### 已知 TypeScript 类型警告

使用全局 `tsc` 对 Task 1 / 3 / 4 依赖图进行临时编译时，仍会看到原 v0.9.4 已存在的：

```text
src/game/v09PresentationMigration.ts(108,7): TS2367
```

临时编译仍可生成 JS，Task 1 / 3 / 4 runtime 断言均为 PASS。

### 旧 v0.9 静态合同冲突

当前 `npm run verify:v09` 会在 `verify-v09-zhao-layout` 停止，原因是旧合同要求：

> evidence tray must be conditional on evidence confrontation

而新的已批准规格要求人物场景核心改成：

> **选择问法 + 直接出示证据，证据决定是否形成突破。**

因此这是**旧验收规则与新规格的冲突**，后续 Task 10 应更新验收合同，而不是把人物质证退回旧逻辑。

---

## 7. 当前不应做的事情

继续开发时不要：

- 不要重新设计第一案真相；
- 不要重新随机化凶手；
- 不要继续单独美化首页来替代核心玩法；
- 不要先做最终投饵 UI 再补 Theory；
- 不要绕过 v5→v6 migration 就宣称可试玩；
- 不要删除 legacy `extractedClaimIds / relationships`，v0.9.5 当前采用兼容式双层迁移；
- 不要让错误证据直接判“错误”或扣资源；
- 不要让提示系统直接说出最终答案。

---

## 8. 推荐恢复顺序

恢复开发时严格按：

1. 完成 Task 5 — 案卷知识中枢 + 反向导航；
2. Task 6 — Theory Graph + Gap；
3. Task 7 — B 模式 Guidance；
4. Task 8 — Theory-driven 投饵 / Enemy Feedback；
5. Task 9 — v5→v6 存档迁移；
6. Task 10 — 完整试玩链和验收；
7. 最后才做视觉微调。

---

## 9. 当前检查点文件定位

设计：

`docs/superpowers/specs/2026-08-29-core-gameplay-loop-design.md`

计划：

`docs/superpowers/plans/2026-08-29-core-gameplay-loop-implementation.md`

运行检查：

`app/CHECKPOINTS/task1-runtime.ts`  
`app/CHECKPOINTS/task2-runtime.ts`  
`app/CHECKPOINTS/task3-runtime.ts`  
`app/CHECKPOINTS/task4-runtime.ts`  
`app/CHECKPOINTS/task5-red.cjs`

---

## 10. 最终状态判断

当前成果已经完成了核心闭环的**数据基础、知识状态、目标推进和人物证据反应**，但还没有完成玩家能够完整体验的 UI 闭环。

因此：

> **这是一个有价值的中间工程检查点，不是 v0.9.5 试玩成品。**

继续工作时直接从 Task 5 接续即可。
