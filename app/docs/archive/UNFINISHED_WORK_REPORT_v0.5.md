# 《官渡密报》v0.5 未完成修改报告

更新时间：2026-08-26

## 已推送成果

远端仓库：<https://github.com/Xhwe-x/Guandu-Dispatch>

分支：`feat/guandu-prototype`

最新已推送提交：`88f97d1 docs: update readme for v05 playable slice`

已包含：

- v0.5 场景/剧情数据契约；
- 标题页、开场 CG 占位演出、军帐对白；
- 军报、线索记录、赵简出场、笔迹调查、质询、第一条案情关系；
- 原型结束提示；
- README v0.5 状态说明。

## 尚未完成或暂缓

### 1. v0.5 后半局

按 Prototype First 方案主动暂停，尚未实现：

- 投饵与敌军反馈；
- 最终汇报；
- 政治选择与结局；
- 完整四名人物资源、正式 CG、实际配音和完整音频系统。

### 2. 旧 v0.4 实验改动

工作树中仍有一组未提交的旧 Task 4 实验文件，未纳入本次 GitHub 推送：

- `app/src/features/board/RelationshipBoard.tsx`
- `app/src/features/desk/ActionBar.tsx`
- `app/src/features/desk/IntelDesk.tsx`
- `app/src/features/desk/Workspace.tsx`
- `app/src/features/desk/desk.css`
- 对应的旧测试修改；
- `app/src/features/investigation/`
- `app/src/features/interrogation/`
- `app/src/features/onboarding/TutorialObjective.tsx`

这些文件属于被暂停的 v0.4 Task 4 半成品，当前保留以便后续决定取舍，不应视为完成成果。

### 3. 测试状态

v0.5 方案明确暂缓新的测试工作包。当前构建和 lint 通过，但完整 Vitest 运行仍有 2 个旧 onboarding 测试失败，原因是它们仍期待 v0.4 的三段卡片入口，而 v0.5 已改为场景壳：

- `src/features/onboarding/IntroSequence.test.tsx`
- `src/features/onboarding/StartScreen.test.tsx`

这两个测试需要在产品试玩确认 v0.5 方向后，决定“更新为场景流程”或“删除旧入口测试”。本报告不擅自修改它们。

## 当前可试玩入口

```text
http://127.0.0.1:5178/
```

启动命令：

```powershell
cd app
npm install
npm run dev -- --host 127.0.0.1 --port 5178
```

## 后续需要产品方确认

1. v0.5 场景化首段是否比旧三栏界面更容易理解；
2. CSS placeholder 的构图、节奏和文字是否值得继续投入正式美术；
3. 是否保留旧 v0.4 未提交实验文件；
4. 是否将两个旧 onboarding 测试迁移到新的场景流程。
