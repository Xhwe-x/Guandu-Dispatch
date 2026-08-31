import type { GameSceneId } from '../../game/scenes';

export interface TutorialLesson {
  id: string;
  sceneId: GameSceneId;
  eyebrow: string;
  title: string;
  body: string;
  steps: string[];
  manualOnly?: boolean;
}

export const tutorialLessons: TutorialLesson[] = [
  {
    id: 'lesson-navigation', sceneId: 'camp', eyebrow: '基础教程 · 案件导航', title: '任何时候都不要被困在一个页面', manualOnly: true,
    body: '除标题页外，左上案件导航始终提供“返回 / 案卷 / 当前任务 / 提示”。返回不会删除已经取得的证据；刷新后没有历史栈时，系统也会把你送回本阶段的安全节点。',
    steps: ['返回：退回上一安全场景，不回滚已经确认的案件事实', '案卷：查看当前任务、人物与密报绑定、完整教程和声音设置', '当前任务：确认这一幕要解决的问题与下一步动作', '提示：只在你主动需要时提供方向，不直接替你给出答案'],
  },
  {
    id: 'lesson-document', sceneId: 'document', eyebrow: '新手引导 · 文书调查', title: '先记录事实，再推测人物',
    body: '军报不会直接替你标出答案。先从文书中找可核验的地点、时辰、数量与行动痕迹，再把事实誊入案卷。',
    steps: ['点击文书中的可疑区域', '至少确认两项能被后续验证的事实', '把确认后的事实誊入案卷'],
  },
  {
    id: 'lesson-handwriting', sceneId: 'investigation', eyebrow: '新手引导 · 文书比对', title: '一处像，不等于同一人',
    body: '笔迹判断应依靠多个稳定特征。放大、叠层并标记至少两处差异或共同特征，再形成结论。',
    steps: ['并置两份文书', '观察收笔、转折和字形习惯', '标出足够特征后确认结论'],
  },
  {
    id: 'lesson-interrogation', sceneId: 'interrogation', eyebrow: '新手引导 · 审讯', title: '证据比语气更重要',
    body: '平询、缓劝、设问和威压会改变人物戒备。证据如果不能直接击中口供矛盾，强硬手段反而可能让目标封口。',
    steps: ['先读目标当前口供', '选择能直接反驳口供的证据', '再决定问话态度并观察人物反应'],
  },
  {
    id: 'lesson-deduction', sceneId: 'deduction', eyebrow: '新手引导 · 推演', title: '关系必须由两端事实支撑',
    body: '推理板不是自动给答案。选择两条事实，再指定它们之间的关系类型；证据不足时关系会被退回，但不会卡死。',
    steps: ['选择关系起点', '选择关系终点', '指定“反驳 / 来源 / 推断”等关系后钉入案板'],
  },
  {
    id: 'lesson-network', sceneId: 'network-investigation', eyebrow: '进阶引导 · 人物任务', title: '把“撒谎”和“通敌”分开',
    body: '第二折每个人都可能隐瞒事情，但只有能接触核心信息、形成情报链的人才构成泄密责任。案卷会显示人物与文书、疑点和下一步任务的绑定。',
    steps: ['查看人物案卷', '确认他真正接触过的信息', '再判断其谎言是否与泄密核心有关'],
  },
  {
    id: 'lesson-bait', sceneId: 'bait', eyebrow: '进阶引导 · 反情报', title: '让敌军替你验证渠道',
    body: '给不同渠道放入不同假路线与假时辰。敌军随后采用哪组假情报，就会反向证明哪条渠道仍在向外传递。',
    steps: ['每条渠道使用不同的假碎片', '真实粮队保持另一套计划', '等待敌军行动回声并比对'],
  },
  {
    id: 'lesson-audience', sceneId: 'audience', eyebrow: '进阶教程 · 帐中复命', title: '曹操评的是你的判断方式，不是“标准答案”', manualOnly: true,
    body: '觐见曹操时，先说明事实与证据，再说明你对责任和下一步的判断。稳妥、切要、退守、冒进会改变主公态度和回话，但单次选择不会把剧情锁死。',
    steps: ['先看右侧案卷摘要，区分“已确认”和“仍待确认”', '第一轮选择汇报风格：谨慎、切要、退守或冒进', '第二轮选择办案策略：据证、察人、深查；满足条件后可提出设局', '主公态度只表达反馈，不是隐藏的唯一正确路线'],
  },
  {
    id: 'lesson-final-report', sceneId: 'final-report', eyebrow: '结案教程 · 军机报告', title: '事实、责任、处置必须分开', manualOnly: true,
    body: '最终报告不是猜一个“凶手”。你需要分别写清泄露了什么、信息来自谁、谁负责拼合与传出、哪些证据支持，以及最终如何处置。',
    steps: ['先填事实：时辰、路线等实际泄露内容', '再填责任：区分受胁迫泄露、主动拼合和无关违规', '用投饵后的敌军回声验证渠道，而不是只靠口供', '最后选择处置，并让结局反映你的证据是否足够'],
  },
];

export function tutorialLessonForScene(sceneId: GameSceneId) {
  return tutorialLessons.find((lesson) => lesson.sceneId === sceneId && !lesson.manualOnly);
}
