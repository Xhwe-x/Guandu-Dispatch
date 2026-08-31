# 《官渡密报》v0.4 P0 体验升级采纳规格

> 来源：`C:/Users/Xh/Downloads/官渡密报_v0.4_Steam级体验升级修改方案.md`
> 状态：已采纳，作为当前实现切片的约束
> 范围：入口、引导、第一段可玩推理、军帐案桌视觉基础

## 1. 建议与约束的区分

v0.4 附件是产品/UI/演出方向的修改建议，不自动覆盖已批准的确定性推理规则。当前采纳其中能直接解决“玩家不知道怎么玩”的 P0，并保留以下硬约束：

- `Stage`、证据来源、关系白名单和调查/审讯规则继续由现有领域层判定；
- 教学只观察真实 `GameState`，不赠送证据、不替玩家完成推理；
- 无倒计时、随机真相、网络/服务器和账号；
- 入口、开场、赵简第一条证据链必须可由新玩家独立完成；
- 现阶段不伪造尚未提供授权的立绘、音乐或配音素材。

附件中“正式人物半身像、对白语音、投饵/结案/政治结局场景化”等内容作为后续 P1/P2 方向，本切片只建立可替换的表现边界，不阻塞核心玩法。

## 2. 本切片验收目标

1. 新存档先进入《官渡密报》开始界面，不直接进入三栏桌。
2. 玩家通过身份、事件、任务三张短卡，在 30 秒内理解当前目标。
3. 玩家只依据界面文字完成：伏击军报 → 记录事实 → 赵简口供 → 笔迹调查 → 真实审讯 → 第一条矛盾关系。
4. 顶部始终显示“章节目标＋当前行动”，无关功能在教学期间隐藏或说明锁定原因。
5. 刷新、继续、跳过和重新体验引导不破坏案件证据与调查点。
6. 视觉层从米黄色后台感收敛为暗木案桌、旧纸、朱砂重点色；所有交互保留键盘和屏幕阅读器路径。

## 3. 状态与数据边界

### 3.1 TutorialState

在 `GameState` 中加入独立、可迁移的 `TutorialState`，沿用已批准 onboarding 规格中的步骤 ID：

```ts
type TutorialStep =
  | 'notStarted' | 'introIdentity' | 'introIncident' | 'introObjective'
  | 'openAmbushReport' | 'extractAmbushClaim' | 'openZhaoStatement'
  | 'extractZhaoDenial' | 'investigateHandwriting' | 'interrogateZhao'
  | 'placeContradiction' | 'completed' | 'skipped';
```

旧 v1 存档迁移到 v2 时标记 `skipped`，不能强迫已有玩家重新教学。跳过只改变教学字段。

### 3.2 真实教学条件

教学进度只能由以下事实推进：

- `readDocumentIds`：`report-ambush`、`statement-zhao`；
- `extractedClaimIds`：`claim-shuoyuan-received`、`claim-zhao-denial`、审讯后 `claim-zhao-time`；
- `completedInvestigationIds`：`investigate-handwriting`；
- 关系 tuple：`claim-zhao-copied-order → refutes → claim-zhao-denial`，槽位 `leakedInfo`。

教学不得提前提取 `claim-ambush-north`，不得创建第二套调查/审讯规则。

## 4. 表现层 P0

- `ExperienceRouter` 负责开始界面、开场、教学和情报桌之间的路由；
- `StartScreen` 提供开始、继续、跳过和重新体验引导；
- `IntroSequence` 只显示三张短卡，不做长过场；
- `TutorialController`、`TutorialObjective` 和 spotlight 只观察真实状态；
- 调查与审讯使用正式规则，组件提供清晰的“为什么”和“下一步”；
- 视觉 token 集中在 `app/src/index.css`，暗木、旧纸、朱砂和铜绿为主；
- 未提供资源时使用安全的程序化/文字 fallback，不把资源缺失变成规则错误。

## 5. 后续切片（本轮不实现）

- 四名角色正式半身图、表情图集与授权清单；
- Dialogue/AudioManager 的完整实现和实际语音素材；
- 投饵、敌军反馈、最终汇报、政治结局的正式场景 UI；
- 地图约束高亮、证据墙自动关系和视觉截图回归套件。

这些内容只能在 P0 可玩且全量验证后拆成独立规格与计划。

## 6. 成功标准

`npm run test:run`、`npm run build`、`npm run lint` 全部通过；新玩家 E2E 能从清空 localStorage 开始完成第一条证据链；控制台无错误；无倒计时文案；刷新后教学步骤精确恢复。
