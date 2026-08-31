# 《官渡密报》v0.9.5 Core Experience Pass — 核心玩法闭环设计规格

## 1. 目标

把现有五个相对独立的系统：

**调查 → 案卷 → 人物 → 泄密链推演 → 投饵验证**

重构成同一个可往返、可纠错、可被提醒系统辅助的半开放核心玩法循环。

本轮不是增加新案件，也不是继续优先打磨首页、字体和按钮，而是让玩家第一次真正感受到：

> 我在自己发现事实、验证人物、建立泄密链，并利用这条链反过来欺骗敌军。

## 2. 已确认的玩法模式

### 2.1 半开放调查（B）

系统始终给玩家一个明确的**阶段目标**，但不规定唯一调查顺序。

示例：

> 当前目标：查清敌军如何得知粮队集合时辰。

玩家可以自由：

- 打开案卷；
- 查看文书；
- 跳到人物；
- 向人物出示证据；
- 尝试推演；
- 从推演缺口返回调查。

系统告诉玩家“现在要解决什么问题”，不直接告诉玩家“下一步必须点哪个按钮”。

### 2.2 提醒模式（B）

采用：

> **轻主动提醒 + 玩家主动加深提示。**

提醒不能成为剧情弹窗，也不能直接给答案。

## 3. 本轮不可改动的案件核心

以下内容视为第一案冻结项：

1. 玩家最终要回答的是“敌人如何获得信息”，而不是简单“谁是内奸”。
2. 赵简泄露的是**集合时辰**。
3. 杜衡通过草料、车辆、道路、价格等碎片信息推断**路线**。
4. 杜衡承担碎片拼合以及价格暗号传递的重要责任。
5. 完整泄密链必须体现“碎片信息组合后形成可用军情”。
6. 泄密链建立后必须进入**反情报投饵**，而不是立即结案。
7. 敌军反应必须成为验证或推翻玩家理论的新证据。
8. 第一案保持固定真相，不引入随机真凶。
9. 曹操只负责追问、授权和评价，不替玩家推出正确答案。
10. 错误推理不得制造永久死胡同。

## 4. 核心循环

```text
阶段目标
   ↓
自由调查
   ↓
发现线索
   ↓
自动收入案卷
   ↓
案卷建立人物 / 文书 / 事实关联
   ↓
从案卷跳回人物 / 文书
   ↓
向人物出示证据
   ↓
人物反应 + 新事实 / 新矛盾
   ↓
拖入泄密链推演
   ↓
系统分析当前缺口
   ├─ 缺口存在 → 回到调查 / 人物 / 文书
   └─ 链条成立 → 进入投饵
                         ↓
                   按渠道设计假信息
                         ↓
                     敌军回声
                         ↓
                    验证 / 推翻
                         ↓
                      更新案卷
                         ↓
                未解决 → 回调查
                已解决 → 曹操复命
```

## 5. 子系统一：调查系统

### 5.1 调查不再等于“点击按钮获得一包 Claim”

现有 `NetworkInvestigationScene` 中的 `readBundle()` 一次会读取多份文书并直接加入多条 Claim。本轮需要把调查拆成：

1. **观察原始材料**；
2. **标记具体线索**；
3. **形成可用事实**。

### 5.2 调查对象

第一案继续使用现有材料，不增加无必要内容：

- 赵简口供；
- 集合命令；
- 笔迹；
- 粮秣出入簿；
- 车马修治簿；
- 邮舍出入簿；
- 商价簿；
- 官渡粮道图牍；
- 赵简家书。

### 5.3 线索状态

新增知识层状态：

```ts
export type KnowledgeStatus =
  | 'unknown'
  | 'observed'
  | 'suspected'
  | 'contradicted'
  | 'supported'
  | 'verified'
  | 'excluded';

export interface KnowledgeEntry {
  id: EntityId;
  kind: 'claim' | 'person' | 'document' | 'relationship' | 'enemy-feedback';
  status: KnowledgeStatus;
  sourceIds: EntityId[];
  relatedPersonIds: EntityId[];
  relatedDocumentIds: EntityId[];
  lastUpdatedAt: number;
}
```

`Claim` 仍保留为案件事实数据；`KnowledgeEntry` 代表“玩家目前如何理解这条事实”。

这样同一条 Claim 可以从：

`observed → suspected → supported → verified`

逐步升级，而不是“获得即真相”。

### 5.4 调查输出

每次玩家真正形成新信息时：

- 写入/更新 `KnowledgeEntry`；
- 自动收入案卷；
- 触发一次轻量“新线索”反馈；
- 更新当前目标的可调查突破口；
- 不强制跳页。

## 6. 子系统二：案卷知识中枢

### 6.1 案卷定位

案卷从“信息展示 Sheet”升级为：

> **玩家的知识图谱入口 + 反向导航中心。**

### 6.2 页面结构

保留现有分类，但核心优先级调整为：

1. **当前目标**；
2. **人物**；
3. **文书**；
4. **线索 / 事实**；
5. **泄密链**；
6. **敌军回声**；
7. 历史 / 教程 / 设置。

### 6.3 每个条目必须支持反向行动

人物条目：

- 前去询问；
- 出示证据；
- 查看关联文书；
- 加入推演。

文书条目：

- 查看原件；
- 查看标记线索；
- 前往关联人物；
- 加入推演。

事实条目：

- 查看来源；
- 找相关人物；
- 加入泄密链。

泄密链缺口：

- 筛选可能相关人物；
- 筛选可能相关文书；
- 返回对应调查点。

### 6.4 知识状态视觉语义

- `unknown`：不显示或仅显示问号槽；
- `observed`：普通；
- `suspected`：虚线/浅色；
- `contradicted`：朱色矛盾标记；
- `supported`：稳定实线；
- `verified`：朱印/验证标记；
- `excluded`：降低饱和度和权重。

## 7. 子系统三：人物质证系统

### 7.1 人物不再是独立功能页面

人物系统的核心行为变为：

> **给人物出示证据 → 读取人物反应 → 获得新的知识状态。**

### 7.2 证据反应模型

新增：

```ts
export interface EvidenceReaction {
  id: EntityId;
  characterId: EntityId;
  evidenceClaimId: EntityId;
  requiredKnowledgeIds?: EntityId[];
  response: string;
  reaction: 'irrelevant' | 'deflect' | 'guarded' | 'contradicted' | 'breakthrough';
  revealClaimIds: EntityId[];
  knowledgeUpdates: Array<{
    knowledgeId: EntityId;
    status: KnowledgeStatus;
  }>;
}
```

现有 `InterrogationRule` 不删除，逐步作为 EvidenceReaction 的底层案件规则来源或兼容层。

### 7.3 错误证据也必须有价值

错误证据不能简单显示“错误”。

例如对赵简出示杜衡商价簿：

> “此物与军书房何干？”

结果可以是：

- 不产生突破；
- 不消耗案件；
- 记录一次无效质证；
- 可能将某条直接关系标记为 `excluded` 或保持 `unknown`。

### 7.4 人物反应层级

至少支持：

- 正常；
- 戒备；
- 迟疑；
- 被证据击中；
- 动摇；
- 松口。

这首先是玩法状态，其次才映射到立绘/动画。

## 8. 子系统四：泄密链推演

### 8.1 推演板不是一次性答题页

泄密链成为案卷中的持续系统，任何时候都可以打开。

早期可以是不完整的：

```text
集合时辰 → ? → 袁军
```

随着玩家获得事实，逐步加入节点。

### 8.2 节点类型

```ts
export type TheoryNodeKind =
  | 'person'
  | 'claim'
  | 'document'
  | 'information'
  | 'method'
  | 'enemy';

export interface TheoryNode {
  id: EntityId;
  kind: TheoryNodeKind;
  sourceId: EntityId;
  label: string;
}

export interface TheoryEdge {
  id: EntityId;
  fromId: EntityId;
  toId: EntityId;
  relation: RelationKind;
  status: 'proposed' | 'supported' | 'verified' | 'rejected';
}
```

现有 `relationships` 可以迁移/兼容为 TheoryEdge 的事实层。

### 8.3 推演结果不是“对 / 错”

新增：

```ts
export interface TheoryGap {
  id: string;
  kind: 'missing-source' | 'missing-route' | 'missing-transmitter' | 'unsupported-edge' | 'conflict';
  title: string;
  description: string;
  relatedKnowledgeIds: EntityId[];
  suggestedPersonIds: EntityId[];
  suggestedDocumentIds: EntityId[];
}

export interface TheoryEvaluation {
  status: 'incomplete' | 'conflicted' | 'supported' | 'verified';
  gaps: TheoryGap[];
  supportedEdgeIds: EntityId[];
  rejectedEdgeIds: EntityId[];
}
```

例如玩家只建立：

`赵简 → 袁军`

系统返回：

> 可以解释时辰外泄，但不能解释敌军如何得到具体路线。

并生成 `missing-route` 缺口。

### 8.4 缺口必须反向驱动调查

点击 `missing-route`：

案卷筛选：

- 杜衡；
- 草料；
- 车马；
- 道路；
- 商价。

这一步构成：

> 推演 → 案卷 → 人物/文书 → 新调查。

### 8.5 链条成立条件

第一案“可进入投饵”的最低支持链保持：

1. 时辰来源：赵简；
2. 路线来源：杜衡从外围碎片推断；
3. 信息在杜衡一侧完成拼合；
4. 通过价格暗号等方式传递到袁军。

达到 `supported` 后允许进入投饵；投饵回声完成后升级为 `verified`。

## 9. 子系统五：投饵验证

### 9.1 投饵必须读取玩家当前理论

现有 `BaitOption.channel` 保留：

- `zhao`；
- `du`；
- `lu`；
- `zheng`。

但 UI 不再要求机械地“四个渠道各选一个”作为唯一主体验。

核心投饵必须围绕已支持的泄密链：

- 赵简渠道：假时辰；
- 杜衡渠道：假草料 / 假车马 / 假道路 / 假价格暗号。

陆淳、郑禾可作为对照渠道或噪声渠道，而不是与核心渠道同权重。

### 9.2 投饵计划

新增：

```ts
export interface BaitExperiment {
  id: EntityId;
  theoryEdgeIds: EntityId[];
  baitIds: EntityId[];
  hypothesis: string;
  expectedSignals: string[];
  status: 'draft' | 'deployed' | 'observed' | 'resolved';
}
```

玩家投饵前必须能看到：

> “你正在验证什么？”

例如：

> 如果杜衡的价格暗号是实际传递方式，那么改变价格尾数后，袁军部署应该随之改变。

### 9.3 敌军回声

现有 `EnemyReport` 继续保留，但扩展为知识来源：

```ts
export interface EnemyFeedback {
  id: EntityId;
  source: 'scout' | 'market' | 'intercept' | 'no-response';
  text: string;
  relatedBaitIds: EntityId[];
  supportsTheoryEdgeIds: EntityId[];
  contradictsTheoryEdgeIds: EntityId[];
}
```

回声可能包括：

- 斥候发现袁军骑兵改变方向；
- 商价突然变化；
- 截获新暗号；
- 没有任何敌军反应。

“没有反应”也是证据。

### 9.4 验证结果

敌军回声必须回写：

- `KnowledgeEntry`；
- `TheoryEdge.status`；
- 案卷；
- 当前目标状态。

如果理论未验证：

允许重新回到调查和人物质证，不直接结案。

## 10. 子系统六：查案引导 / 提醒系统

### 10.1 引导系统不是 HintPanel 的改名

现有：

```ts
hintUsage: Record<string, number>
GameContent.hints: Record<string, [string, string, string]>
```

继续保留兼容，但新增完整 Guidance 状态。

### 10.2 Guidance 数据

```ts
export type GuidanceStatus = 'unseen' | 'shown' | 'dismissed' | 'resolved';

export interface GuidanceCue {
  id: EntityId;
  objectiveId: EntityId;
  trigger: 'stalled' | 'invalid-theory' | 'unused-evidence' | 'new-gap' | 'manual';
  level1: string;
  level2: string;
  level3: string;
  relatedPersonIds: EntityId[];
  relatedDocumentIds: EntityId[];
}

export interface GuidanceState {
  currentObjectiveId: EntityId;
  cueStates: Record<EntityId, GuidanceStatus>;
  manualHintLevels: Record<EntityId, 0 | 1 | 2 | 3>;
  lastProgressAt: number;
  invalidTheoryAttempts: number;
  unusedEvidenceIds: EntityId[];
}
```

### 10.3 永久显示内容

任何非全屏 CG 页面，玩家都能在不打开案卷的情况下看到：

- 当前目标；
- 当前可继续突破方向数量。

例如：

> 当前目标：查清路线是如何泄露的
>
> 3 个方向仍可调查

### 10.4 轻主动提醒触发

以下条件可触发一级轻提醒：

- 一段时间没有新知识状态变化；
- 连续两次无效理论验证；
- 有可用于质证的新证据但长期未使用；
- 新 TheoryGap 出现；
- 玩家在同一个人物/文书上重复无效操作。

主动提醒：

- 不弹 Modal；
- 不抢输入焦点；
- 同一 Cue 最多主动出现一次；
- 玩家可关闭；
- 问题解决后自动标记 `resolved`。

### 10.5 主动加深

玩家点击“提示”后：

- 第一次：方向提示；
- 第二次：范围提示，并短暂高亮相关人物/文书；
- 第三次：明确操作提示。

不得存在第四层自动答案。

## 11. 阶段目标模型

新增：

```ts
export interface CaseObjective {
  id: EntityId;
  title: string;
  question: string;
  requiredKnowledgeIds: EntityId[];
  optionalKnowledgeIds: EntityId[];
  completion: 'manual' | 'all-required-supported' | 'theory-supported' | 'theory-verified';
  nextObjectiveId?: EntityId;
}
```

第一案建议目标顺序：

1. `objective-time-leak`：谁接触并泄露集合时辰？
2. `objective-route-leak`：敌军如何得到具体路线？
3. `objective-integration`：碎片在哪里被拼成可用军情？
4. `objective-transmission`：军情如何送到袁军？
5. `objective-counterintel`：如何利用已知渠道制造可验证假情报？
6. `objective-verify-network`：敌军回声是否验证泄密链？

目标可以前后交叠，但 UI 每次只突出一个主目标。

## 12. 数据流

### 12.1 调查发现

```text
Document / Investigation
  → mark finding
  → reveal Claim
  → upsert KnowledgeEntry
  → update objective progress
  → update GuidanceState.lastProgressAt
  → Dossier auto-index
```

### 12.2 人物质证

```text
Dossier / Person scene
  → select evidence
  → resolve EvidenceReaction
  → reveal claims
  → update knowledge statuses
  → update person reaction state
  → append dialogue history
  → refresh theory gaps
```

### 12.3 推演

```text
Knowledge graph
  → player places TheoryNode / TheoryEdge
  → evaluateTheory()
  → TheoryEvaluation
     ├ incomplete/conflicted → create GuidanceCue + dossier filters
     └ supported → unlock counter-intelligence objective
```

### 12.4 投饵

```text
Supported theory
  → create BaitExperiment
  → deploy selected bait
  → evaluate enemy response
  → EnemyFeedback
  → knowledge + theory edge verified/rejected
  → dossier updated
```

## 13. UI 约束

### 13.1 一屏一个主要操作对象

- 调查：文书 / 地图 / 物件；
- 人物：人物 + 当前证据；
- 案卷：知识；
- 推演：关系网络；
- 投饵：假情报实验；
- 回声：敌军反馈。

### 13.2 不把所有信息放在一个页面

禁止重新出现：

- 人物 + 五策略 + 三任务 + 案卷摘要 + 推理板同时常驻；
- 一屏全部四人物大卡；
- 投饵四渠道全部同权铺满。

### 13.3 控件继续遵守 v0.9.4 已建立的规则

- 圆角；
- 高对比；
- 多行文本必须在控件内部完整换行；
- disabled 仍可识别；
- 1366×768 不横向溢出；
- 人物立绘不允许拉伸。

## 14. 错误和恢复

### 14.1 错误推理

不返回“答案错误”。

返回：

- 当前理论解释了什么；
- 仍然缺少什么；
- 哪条关系证据不足；
- 哪些材料可能与缺口有关。

### 14.2 无效质证

不消耗不可恢复资源，不锁死人物。

### 14.3 投饵未验证

允许回调查；不强制进入最终报告。

### 14.4 存档

新闭环状态必须纳入存档 schema 迁移：

- knowledge entries；
- theory graph；
- guidance state；
- bait experiments；
- enemy feedback。

旧 v5 存档必须迁移到新 schema，同时保留已获得 Claim、Relationship、Bait 等核心进度。

## 15. 技术边界

### 15.1 本轮优先复用现有依赖

首轮实现不强制引入 XState / React Flow / Radix / Motion。

原因：

- 当前核心风险首先是数据模型和玩法闭环；
- 现有 React + reducer + DnD 能完成第一版闭环；
- 新库应在闭环验证后按明确收益引入。

### 15.2 可选后续依赖

- XState：当场景/目标转换继续复杂化时替换部分场景状态机；
- React Flow：当泄密链画布的拖拽、边线、缩放复杂度超过当前实现时引入；
- Radix：Dialog / Sheet / Tooltip 的行为层；
- Motion：复杂分镜和布局动画。

本轮计划必须把这些作为可替换边界，而不是先绑定第三方 API。

## 16. 模块边界

建议新增目录：

```text
app/src/features/coreLoop/
  objectives/
    objectiveTypes.ts
    objectiveRules.ts
  knowledge/
    knowledgeTypes.ts
    knowledgeReducer.ts
    knowledgeSelectors.ts
  guidance/
    guidanceTypes.ts
    guidanceRules.ts
    GuidanceRail.tsx
  evidence/
    evidenceReactionTypes.ts
    evidenceReactionRules.ts
  theory/
    theoryTypes.ts
    theoryRules.ts
    TheoryWorkspace.tsx
  counterintel/
    baitExperimentTypes.ts
    baitExperimentRules.ts
    EnemyFeedbackPanel.tsx
```

现有内容文件继续留在：

```text
app/src/content/guandu/
```

案件事实与 UI 引擎分离。

## 17. 测试策略

必须优先测试规则层，不依赖视觉截图完成正确性验证。

### 17.1 单元测试

至少覆盖：

1. Claim → KnowledgeEntry 状态升级；
2. 错误证据不会制造突破；
3. 正确证据触发人物反应与新事实；
4. 不完整泄密链产生正确 TheoryGap；
5. 错误理论不会锁死；
6. 支持链解锁投饵；
7. 投饵回声可以验证核心边；
8. 无敌军反应也能形成 EnemyFeedback；
9. Guidance Cue 不重复主动弹；
10. 第三级提示之后不能继续升级；
11. 旧存档迁移保留已有 Claim/Relationship；
12. 投饵未验证后可以重新调查。

### 17.2 集成测试

模拟完整第一案：

```text
调查集合文书
→ 质证赵简
→ 建立时辰来源
→ 推演出现路线缺口
→ 从缺口跳转杜衡材料
→ 标记草料 / 车辆 / 道路
→ 质证杜衡
→ 泄密链 supported
→ 配置时辰 + 价格暗号投饵
→ 敌军回声
→ 泄密链 verified
→ 曹操复命解锁
```

### 17.3 UI 行为验收

人工验收：

- 玩家 3 秒内知道当前目标；
- 从 TheoryGap 到对应文书不超过 2 次点击；
- 从案卷人物到“出示证据”不超过 2 次点击；
- 错误推理后有明确下一步，但没有直接答案；
- 主动一级提醒不会抢焦点；
- 1366×768 不溢出；
- 人物不拉伸；
- 投饵之后可以明确看懂“我验证的是哪条关系”。

## 18. 成功标准

本轮完成后，新玩家应该能用一句话描述自己在做什么：

> “我先查文书和人物，把线索放进案卷，再自己拼泄密链；哪里拼不通就回头补查，最后按这条链给敌人喂假消息，再看敌军行动验证自己猜得对不对。”

如果玩家仍然描述为：

> “游戏让我按顺序点几个按钮，然后告诉我谁有问题。”

则本轮不算完成。
