# 《官渡密报》v0.5 垂直切片采纳规格

> 来源：`C:/Users/Xh/Downloads/官渡密报_v0.5_游戏体验重构方案_PrototypeFirst_Codex执行版.md`
> 状态：当前执行依据

## 1. 采纳结论

v0.5 不是旧三栏界面的换皮，而是一次主流程体验重构。保留稳定的 `GameState`、reducer、案件内容、调查/审讯/关系 validator 和本地存档；退出 `IntelDesk` 作为首屏主壳，改由场景控制器串起垂直切片。

## 2. 本轮唯一交付

```text
TitleScene
→ 开场 CG/分层场景占位与镜头动效
→ CampScene 军帐人物对白
→ DocumentScene 查看残缺伏击军报并记录线索
→ 赵简出场
→ InvestigationScene 核验集合命令笔迹
→ InterrogationScene 出示证据并触发人物反馈
→ DeductionBoardScene 建立第一条矛盾
→ “原型体验结束 / 后续调查待开放”
```

首屏不能直接进入 `IntelDesk`，玩家不需要理解 `Claim / LogicSlot / RelationKind`。所有核心推进仍由真实案件状态触发；演出、CG、语音或动画失败不能阻塞规则。

## 3. 资源策略

当前仓库没有正式图片或音频资源。本轮使用统一构图的 CSS/HTML placeholder、文字对白和可替换资源 manifest 边界；不伪造已授权的正式素材。后续可用真实 CG、人物图和 VO 替换，不改变场景接口。

## 4. 状态边界

新增纯表现层 `GameSceneId`/scene controller 和一次性演出标记；不改变既有案件真相。`TutorialState` 继续兼容现有 v2 字段，由场景条件适配；若必须持久化演出进度，只增加向后兼容可选字段。

## 5. 硬性停止点

完成本垂直切片并通过 `npm run dev` 启动烟测后，立即停止扩张。投饵、敌军反馈、最终汇报、政治结局、四人完整资源、自动化测试工作包均不在本轮实现。
