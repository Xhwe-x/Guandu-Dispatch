import type { GameState, Relationship, TutorialStep } from '../domain';

export interface TutorialObjective {
  title: string;
  reason: string;
  requestedView: 'documents' | 'relationships' | 'none';
  targetId?: string;
}

interface TutorialRequirement {
  step: TutorialStep;
  isSatisfied: (state: GameState) => boolean;
}

const contradictionRelationship: Relationship = {
  fromId: 'claim-zhao-copied-order',
  toId: 'claim-zhao-denial',
  kind: 'refutes',
  slot: 'leakedInfo',
};

const gameplayRequirements: TutorialRequirement[] = [
  {
    step: 'openAmbushReport',
    isSatisfied: (state) => state.readDocumentIds.includes('report-ambush'),
  },
  {
    step: 'extractAmbushClaim',
    isSatisfied: (state) => state.extractedClaimIds.includes('claim-shuoyuan-received'),
  },
  {
    step: 'openZhaoStatement',
    isSatisfied: (state) => state.readDocumentIds.includes('statement-zhao'),
  },
  {
    step: 'extractZhaoDenial',
    isSatisfied: (state) => state.extractedClaimIds.includes('claim-zhao-denial'),
  },
  {
    step: 'investigateHandwriting',
    isSatisfied: (state) => state.completedInvestigationIds.includes('investigate-handwriting'),
  },
  {
    step: 'interrogateZhao',
    isSatisfied: (state) => state.extractedClaimIds.includes('claim-zhao-time'),
  },
  {
    step: 'placeContradiction',
    isSatisfied: (state) => state.relationships.some((relationship) => sameRelationship(relationship, contradictionRelationship)),
  },
];

const gameplayStepOrder = gameplayRequirements.map((requirement) => requirement.step);

const objectives: Record<TutorialStep, TutorialObjective> = {
  notStarted: {
    title: '开始新手引导',
    reason: '准备好后，从第一份军报开始梳理案情。',
    requestedView: 'none',
  },
  introIdentity: {
    title: '确认你的身份',
    reason: '你要在下一次运粮前，先把伏击线索查清楚。',
    requestedView: 'none',
  },
  introIncident: {
    title: '了解伏击经过',
    reason: '军报会说明粮队在哪里、何时出事。',
    requestedView: 'none',
  },
  introObjective: {
    title: '明确当前目标',
    reason: '先找出敌军知道了什么，再判断谁能把消息传出去。',
    requestedView: 'none',
  },
  openAmbushReport: {
    title: '查看残缺伏击军报',
    reason: '先看看粮队在哪里、何时遭到伏击。',
    requestedView: 'documents',
    targetId: 'report-ambush',
  },
  extractAmbushClaim: {
    title: '记录第一条事实',
    reason: '把可以用于推理的事实记录成线索卡。',
    requestedView: 'documents',
    targetId: 'claim-shuoyuan-received',
  },
  openZhaoStatement: {
    title: '找出声称不知道出发时辰的人',
    reason: '打开赵简口供，找出与时辰有关的说法。',
    requestedView: 'documents',
    targetId: 'statement-zhao',
  },
  extractZhaoDenial: {
    title: '记录赵简的否认',
    reason: '把这句否认记下来，稍后与他抄写的命令核对。',
    requestedView: 'documents',
    targetId: 'claim-zhao-denial',
  },
  investigateHandwriting: {
    title: '核对集合命令笔迹',
    reason: '确认集合命令由谁抄写，别只听口供。',
    requestedView: 'documents',
    targetId: 'investigate-handwriting',
  },
  interrogateZhao: {
    title: '用亲笔命令质询赵简',
    reason: '选择赵简的口供，再提交与之矛盾的亲笔命令。',
    requestedView: 'documents',
    targetId: 'claim-zhao-time',
  },
  placeContradiction: {
    title: '建立第一条矛盾关系',
    reason: '把亲笔命令放入关系板，反驳赵简的口供。',
    requestedView: 'relationships',
    targetId: 'claim-zhao-copied-order',
  },
  completed: {
    title: '新手引导完成',
    reason: '你已经完成第一条证据链，可以继续自由查案。',
    requestedView: 'none',
  },
  skipped: {
    title: '已跳过新手引导',
    reason: '案情进度不会改变，你可以直接继续查案。',
    requestedView: 'none',
  },
};

function sameRelationship(left: Relationship, right: Relationship) {
  return left.fromId === right.fromId
    && left.toId === right.toId
    && left.kind === right.kind
    && left.slot === right.slot;
}

export function deriveTutorialStep(state: GameState): TutorialStep {
  const storedStep = state.tutorial.step;
  const startIndex = gameplayStepOrder.indexOf(storedStep);

  if (startIndex === -1) {
    return storedStep;
  }

  return gameplayRequirements.slice(startIndex).find((requirement) => !requirement.isSatisfied(state))?.step
    ?? 'completed';
}

export function isTutorialComplete(state: GameState): boolean {
  const step = deriveTutorialStep(state);
  return step === 'completed' || step === 'skipped';
}

export function tutorialObjective(step: TutorialStep): TutorialObjective {
  return objectives[step];
}
