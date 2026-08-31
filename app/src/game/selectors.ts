import type { GameState, Stage } from './domain';

const objectiveByStage: Record<Stage, string> = {
  documents: '阅读文书并提取主张',
  secrets: '调查人物秘密',
  chain: '梳理泄密链条',
  bait: '选择投饵信息',
  report: '提交调查报告',
  ending: '查看结局',
};

const requiredBaseClaimIds = ['claim-zhao-time', 'claim-du-route', 'claim-bridge-open'];

export function selectRemainingInvestigationPoints(state: GameState) {
  return state.investigationPoints;
}

export function selectCurrentObjective(state: GameState) {
  return objectiveByStage[state.stage];
}

export function selectCanOpenBait(state: GameState) {
  return state.stage === 'chain'
    && requiredBaseClaimIds.every((claimId) => state.extractedClaimIds.includes(claimId));
}

export function canAdvance(state: GameState) {
  return state.stage !== 'ending';
}
