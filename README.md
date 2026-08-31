# 官渡密报 / Guandu Dispatch v0.9.5

《官渡密报》是一款 PC / Web 横屏的单人三国军机悬疑与反情报推理游戏。v0.9.5 **Core Experience Pass** 的重点不是增加新案件，而是把原先相对分离的调查、案卷、人物质证、泄密链和投饵系统连成一个可往返、可纠错、可被敌军回声反证的核心玩法闭环。

## v0.9.5 核心变化

- **半开放阶段目标**：系统始终给出当前问题，但不规定唯一点击顺序。
- **案卷成为知识中枢**：线索自动入卷；人物、文书、事实和 Theory Gap 都能反向跳回调查或推演。
- **人物直接出示证据**：问法只影响对话气氛，证据决定是否形成突破；无关证据不会扣调查资源或永久锁死人。
- **持续泄密链 Theory Graph**：不再是“三问填答案”；理论允许不完整，系统返回 `missing-source / missing-route / missing-transmitter / unsupported-edge / conflict` 等可解释缺口。
- **B 模式 Guidance**：轻主动提醒 + 玩家主动加深 1→2→3；同一主动提醒最多出现一次，不弹 Modal，不直接给答案。
- **Theory-driven 投饵实验**：赵简时辰渠道与杜衡路线/价格暗号渠道是核心验证对象；陆淳、郑禾只作为可选对照，不再强制四渠道齐填。
- **敌军回声写回案卷**：只有两个核心渠道都产生可区分回声时，泄密链才从 `supported` 升级为 `verified`。
- **修复假验证缺陷**：与真实计划相同的“假时辰/假路线”不能作为核心诱饵，避免敌军没有变化却被错误判定为验证成功。
- **存档升级到 v6**：接受旧 v1–v5 存档，v5 进度迁移到 `coreLoop`，继续保留 legacy Claim / Relationship / Bait / presentation 兼容数据。
- **旧 v0.9 验收合同同步**：保留旧页面、组件、响应式和迁移合同，只替换与 v0.9.5 已批准玩法规格直接冲突的验收项。

## 当前核心流程

```text
标题 / 开场
→ 第一文书与赵简矛盾
→ 调查发现线索
→ 自动收入案卷
→ 从案卷跳回人物 / 文书
→ 给人物出示证据
→ 新事实 / 新矛盾
→ 打开持续泄密链
→ Theory Gap 指出缺口
→ 回案卷补查
→ 泄密链 supported
→ 按理论设计赵简 + 杜衡投饵实验
→ 敌军回声验证 / 未验证
   ├─ 未验证：回调查 / 重做实验
   └─ verified：曹操复命
→ 最终报告
→ 真相归属与结局
```

第一案固定真相保持不变：赵简泄露集合时辰；杜衡通过草料、车辆、道路等碎片推断路线，并通过价格暗号完成拼合/传递。核心问题始终是**“敌军如何获得可用军情”**，不是随机寻找一个“坏人”。

## 设计基线

优先级从高到低：

1. `docs/superpowers/specs/2026-08-29-core-gameplay-loop-design.md` — v0.9.5 核心玩法闭环规格；
2. `docs/superpowers/plans/2026-08-29-core-gameplay-loop-implementation.md` — v0.9.5 实施计划；
3. `官渡密报_v0.9_叙事流程与UI组件系统重构方案.md` — v0.9 叙事/UI 基线；
4. `官渡密报_v0.9.1_试玩问题与存档系统修订方案.md` — 存档与基础可用性；
5. `官渡密报_v0.9.3_开场存档与关键场景统一验收方案.md` — 开场和逐页体验基线。

旧文档出现“逐问推理”“四渠道必须齐填”“泄密链成立后先固定进入第一次曹操复命”等与 v0.9.5 冲突的描述时，以 v0.9.5 Core Experience Pass 为准。

## 验证

无需完整前端依赖即可执行核心静态与规则级审核：

```bash
cd app
npm run verify:v095
npm run verify:v095:deep
```

`verify:v095:deep` 当前覆盖：

- v0.9–v0.9.4 旧合同回归；
- v0.9.5 知识 / Theory / Guidance / Bait / Enemy Feedback 静态合同；
- 完整规则级核心闭环 Playthrough；
- presentation migration / recovery runtime-lite；
- 全部 TS/TSX 语法转译检查。

标准开发机仍必须执行：

```bash
npm ci
npm run test:run
npm run build
npm run lint
```

本次交付容器中的 `node_modules` 是一次中断安装留下的残缺目录：`vitest` / `oxlint` 不可执行，Vite / Node 类型文件不完整，因此这三项不能在当前容器里标记为通过。详见 `FINAL_DELIVERY_AUDIT_v0.9.5.md`。

## 主要目录

- `app/src/game/coreLoopSelectors.ts`：核心闭环 selector；
- `app/src/game/rules/knowledge.ts`：知识状态；
- `app/src/game/rules/evidenceReaction.ts`：人物证据反应；
- `app/src/game/rules/theory.ts`：持续理论图与缺口；
- `app/src/game/rules/guidance.ts`：B 模式提示；
- `app/src/game/rules/bait.ts`：理论驱动投饵；
- `app/src/game/rules/enemyFeedback.ts`：敌军回声与状态回写；
- `app/src/features/scenes/CaseNavigator.tsx`：案卷知识中枢；
- `app/src/features/scenes/NetworkDeductionScene.tsx`：Theory Workspace；
- `app/src/features/scenes/BaitScene.tsx`：反情报实验；
- `app/src/features/scenes/EnemyReportScene.tsx`：敌军回声；
- `app/src/features/scenes/CoreLoopPlaythrough.test.tsx`：完整闭环自动化测试。

## 仍需真实设备验证的高级项

- `npm ci` 后完整 Vitest / production build / oxlint；
- 1366×768、1920×1080、2560×1440 多分辨率人工视觉验收；
- 3–5 名不看设计文档的新玩家完整试玩；
- 完整商业级人物情绪立绘、CG 拆层与正式配音。
