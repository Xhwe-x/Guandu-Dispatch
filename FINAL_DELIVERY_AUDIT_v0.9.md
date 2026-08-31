# 《官渡密报》v0.9.0 最终多轮审核报告

> 审核目标：确认 v0.9 已经成为后续项目的唯一叙事 / UI / 交互基线，而不是在 v0.8.3 上继续叠加视觉补丁。
> 审核日期：2026-08-28

## 1. 审核结论

v0.9.0 已完成本轮“基线重置”的核心代码工作：新手叙事顺序、统一组件系统、字体与响应式纪律、人物首次出场、引导式第一推断、赵简再问、三人物调查、双渠道推演、曹操复命、分渠道投饵、敌军回声、三步最终报告、案卷与对话历史、v0.8.x 存档演出迁移均已进入主工程。

本轮不能宣称“商业完成版”。当前容器无法稳定从 npm registry 下载完整依赖，因此 Vitest / Vite production build / Oxlint 仍需在目标 Windows 开发机重新执行；人物完整情绪立绘、正式 AI 配音和 CG 完整 2.5D 分层也仍属后续高级表现。

## 2. 第一轮：v0.9 设计一致性审核

基线：`官渡密报_v0.9_叙事流程与UI组件系统重构方案.md`。

已确认：

- 新玩家不再直接进入“质询赵简”；
- 开场为：时代背景 → 玩家身份 → 三项基础引导 → 赵简首次亮相 → 第一口供；
- 第一条推断只教学“印证 / 矛盾”；
- 陆淳 / 郑禾 / 杜衡均遵守“先介绍，再开放调查”；
- 完整泄密链成立后才第一次觐见曹操；
- 投饵、敌军回声、最终报告和结局全部使用 v0.9 信息层级。

状态：通过零依赖合同。

## 3. 第二轮：UI 组件纪律审核

后续通用 UI 唯一入口：

- `src/ui/primitives/`
- `src/ui/game/`
- `src/ui/motion/`

已建立：Button / Card / Badge / Tooltip / Dialog / Sheet / SceneHeader / Dialogue / CharacterIntro / Task / Dossier / Hint / AnimatedList / BlurFade 等。

旧 `features/ui` 只允许作为兼容桥，不再作为新页面视觉基线。

状态：通过 `verify-v09-ui-contract`、`verify-v09-control-discipline`。

## 4. 第三轮：字体、布局与“AI UI 感”审核

已完成：

- 普通场景标题统一进入 22–28px 级别；
- 顶栏约 52px；
- 普通页面取消海报式巨大标题；
- 曹操复命改为单 CG 主视觉；
- 赵简审讯取消 RPG 彩色状态条；
- 案卷人物页一次只展示一个人物；
- 投饵一次只处理一个渠道；
- 最终报告一次只处理一个阶段；
- 恢复页也改为 v0.9 Card / Button，并将标题收敛到 22–28px。

1366×768 规则已经进入 CSS 与静态审核合同，但仍需目标浏览器人工截图确认。

状态：静态审核通过，人工视觉验收待目标机完成。

## 5. 第四轮：叙事流程审核

当前主线：

```text
标题
→ 官渡背景
→ 玩家身份
→ 基础引导
→ 赵简首次亮相
→ 第一口供
→ 第一证据比较
→ 第一引导式推断
→ 再问赵简
→ 第一幕总结
→ 陆淳 / 郑禾 / 杜衡逐人认识与核验
→ 双渠道泄密链
→ 第一次觐见曹操
→ 分渠道投饵
→ 敌军回声
→ 第二次觐见曹操
→ 最终报告：事实 / 证据链 / 处置
→ 真相归属 / 政治结局
```

状态：通过 opening / narrative-order / midgame / audience / backhalf 合同。

## 6. 第五轮：返回、防卡死与旧存档迁移审核

存档 schema：v5。

v0.8.x → v0.9 策略：

- 案件证据、人物状态、调查结果尽量保留；
- 旧 `story / camp / document / investigation / dialogue / deduction` 演出壳不会作为 v0.9 恢复目标；
- 旧导航历史清理，避免 GO_BACK 返回旧页面；
- 旧 dialogue 存档映射到新的赵简开场对白；
- 当前 v5 存档加载时也会过滤历史中的旧场景；
- SceneRecovery 的“恢复 / 返回当前阶段 / 本折安全节点”均使用 v0.9 合法场景。

已执行纯运行时迁移验证：

- legacy `document` → `opening`；
- legacy `dialogue` → `opening / zhao-first-dialogue`；
- 安全场景保留；
- 混合 history 中旧场景被过滤；
- documents / secrets / chain / bait / report / ending 六阶段均有安全章节入口。

状态：通过 save-migration / recovery-contract / runtime-lite。

## 7. 第六轮：源码与测试契约审核

本轮最终零依赖静态命令：

```bash
cd app
npm run verify:v09
```

包含：

1. UI contract
2. opening contract
3. guided deduction
4. Zhao layout
5. character intros
6. narrative order
7. audience layout
8. midgame layout
9. backhalf layout
10. dossier layout
11. control discipline
12. dialogue history
13. visual contract
14. save migration
15. recovery contract
16. delivery contract

静态合同全部通过。随后单独执行 `npm run verify:v09:deep`，迁移/返回 runtime-lite 通过；136 个 TS/TSX 文件，0 个语法诊断。

Vitest 源测试中的 v0.8 历史导航案例也已改写为 v0.9 safe-scene 场景；v2 老存档测试改为期待最近的 v0.9 渐进节点。

## 8. 第七轮：工程环境审核

当前容器：

- `npm ping` / `npm ci` 在网络阶段超时；
- 因依赖目录不完整，无法据此证明正式 `tsc -b` / Vitest / Vite build / Oxlint；
- 最终交付包不携带残缺 `node_modules`。

目标开发机必须补跑：

```bash
cd app
npm ci
npm run test:run
npm run build
npm run lint
```

任何真实错误应以目标机输出为准继续修复。

## 9. 完成板块

- v0.9 叙事重排；
- P0 UI 组件基线；
- 字号 / 顶栏 / 信息密度重构；
- 新手嵌入式引导；
- 人物首次亮相；
- 第一证据 / 第一推断；
- 赵简再问；
- 三人物调查；
- 双渠道推演；
- 两次曹操复命；
- 分渠道投饵；
- 敌军回声；
- 三步最终报告；
- 单内容案卷；
- 对话历史；
- v5 存档 / v0.8.x 演出迁移；
- SceneRecovery v0.9 安全恢复；
- v0.9 自动审核体系。

## 10. 仍未完成 / 需要后续支持

### 必须由目标机确认

- Windows `npm ci`；
- Vitest；
- production build；
- Oxlint；
- Chrome / Edge 1366×768、1920×1080、2560×1440 人工视觉截图。

### 需要试玩反馈

- 新玩家是否在 5–8 分钟内理解身份、赵简与第一矛盾；
- 是否仍有“看起来像 AI 概念板”的页面；
- 哪些任务文字仍不明确；
- 哪些返回行为不符合预期。

### 高级表现未完成

- 陆淳 / 郑禾 / 杜衡 / 赵简 / 曹操完整 3–5 张情绪变体；
- 正式商业级 AI 配音；
- CG 前 / 中 / 后景拆层和完整 2.5D 演出；
- 3–5 名完全没看设计文档的新玩家可用性测试。

## 11. 后续开发规则

v0.9.0 以后：

> 新功能先说明“玩家此刻为什么需要看到它”，再决定是否上屏。

任何新页面不得绕过 `src/ui/` 重建第二套 Button / Card / Dialog / Sheet，也不得重新引入普通场景巨大标题和卡片墙。
