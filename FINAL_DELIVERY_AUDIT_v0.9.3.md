# 《官渡密报》v0.9.3 最终多轮审核报告

## 1. 本轮范围

v0.9.3 不增加新的案件真相或玩法系统，只完成三类体验收束：

1. 开场前几分钟更像完整单机游戏；
2. 存档页更容易让玩家回忆进度；
3. 关键场景逐页统一 UI 信息架构。

## 2. 已完成

### 开场体验

- 标题 → 存档 → 序章 → 身份 → 基础引导 → 赵简首次登场的顺序保持不变；
- Opening 场景新增章节 / 小节 / 当前 Beat 进度 HUD；
- 非按钮焦点状态支持 Enter / Space 推进；
- HUD 不承担任务说明，不遮挡主画面。

### 存档页

- 有效存档加入场景缩略图；
- 最近更新的档位增加“最近游玩”标记；
- 继续保留章节、当前位置、当前任务、进度、线索/推断数量和更新时间；
- 空档不伪造游戏进度。

### 关键场景统一

新增共享 `SceneFocusHeader`，并应用于：

- 第一证据比较；
- 第一条推断；
- 四人物调查；
- 泄密链推演；
- 分渠道投饵；
- 敌军回声；
- 最终报告；
- 结局。

赵简审讯与曹操觐见继续保留专属舞台结构。

### 统一验收

新增 `UI_PAGE_ACCEPTANCE_v0.9.3.md`，作为后续逐页 UI 人工验收清单。

## 3. 自动验证

最终源码执行：

```text
npm run verify:v093:deep
```

结果：

- v0.9 UI contract：通过
- v0.9 opening contract：通过
- v0.9 guided deduction：通过
- v0.9 Zhao/nav：通过
- v0.9 narrative order：通过
- v0.9 audience / midgame / backhalf / dossier：通过
- v0.9 save migration / recovery：通过
- v0.9.1 save/evidence/portrait：通过
- v0.9.3 opening/save experience：通过
- v0.9.3 key-scene polish：通过
- runtime migration/recovery：通过
- TS/TSX 语法检查：140 个文件，0 syntax diagnostics

## 4. 当前仍未声明完成

- 五名主要人物透明抠像 + 多情绪正式立绘；
- 商业级正式配音；
- 全部关键 CG 的完整 2.5D 分层；
- 当前环境没有重新证明完整 `npm ci / vite build / vitest / oxlint`；
- 尚缺 3–5 名不了解设计稿的新玩家试玩。

## 5. 结论

v0.9.3 已完成“开场、存档、关键场景统一”三项迭代目标，可作为下一轮真人试玩基线。
