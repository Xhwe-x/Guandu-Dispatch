import type { BaitExperiment, CaseObjective, EnemyFeedback, GameState } from '../domain';
import { gameReducer } from '../reducer';
import { promoteKnowledge, syncObjectivesUntilStable } from './knowledge';
import { evaluateTheory } from './theory';
import type { BaitResolution } from './bait';

export function createEnemyFeedback(experiment: BaitExperiment, resolution: BaitResolution): EnemyFeedback[] {
  const feedback: EnemyFeedback[] = [];
  const hasZhao = resolution.reflectedChannels.includes('zhao');
  const hasDu = resolution.reflectedChannels.includes('du');

  if (hasZhao) {
    feedback.push({
      id: `${experiment.id}-time`,
      source: 'intercept',
      text: `截获口令显示，袁军把准备时刻改成了投给赵简渠道的假时辰“${resolution.enemyReport.time}”。`,
      relatedBaitIds: experiment.baitIds.filter((id) => id.startsWith('bait-zhao-')),
      supportsTheoryEdgeIds: ['edge-time-zhao'],
      contradictsTheoryEdgeIds: [],
    });
  }
  if (hasDu) {
    feedback.push({
      id: `${experiment.id}-route`,
      source: 'scout',
      text: `斥候发现袁军骑队朝投给杜衡渠道的假路线“${resolution.enemyReport.route}”重新集结。`,
      relatedBaitIds: experiment.baitIds.filter((id) => id.startsWith('bait-du-')),
      supportsTheoryEdgeIds: ['edge-route-du', 'edge-integrate-du', 'edge-price-yuan'],
      contradictsTheoryEdgeIds: [],
    });
  }
  if (!hasZhao || !hasDu) {
    const missing = [!hasZhao ? '时辰渠道' : undefined, !hasDu ? '路线渠道' : undefined].filter(Boolean).join('与');
    feedback.push({
      id: `${experiment.id}-no-response`,
      source: 'no-response',
      text: `${missing || '核心渠道'}没有出现预期敌军回声。没有反应本身是一条证据，但单次实验不足以直接判定理论错误。`,
      relatedBaitIds: experiment.baitIds,
      supportsTheoryEdgeIds: [],
      contradictsTheoryEdgeIds: [],
    });
  }
  return feedback;
}

export interface EnemyFeedbackApplication {
  state: GameState;
  feedback: EnemyFeedback[];
  verified: boolean;
}

/**
 * Applies one experiment result back into the persistent case state.
 * This is the single rule-layer transition used by the UI and playthrough tests.
 */
export function applyEnemyFeedbackResolution(
  state: GameState,
  experiment: BaitExperiment,
  resolution: BaitResolution,
  objectives: CaseObjective[],
  at = Date.now(),
): EnemyFeedbackApplication {
  const feedback = createEnemyFeedback(experiment, resolution);
  const verified = resolution.baitBand === 'bothCore'
    && resolution.reflectedChannels.includes('zhao')
    && resolution.reflectedChannels.includes('du');

  let next = state;
  for (const item of feedback) {
    next = gameReducer(next, { type: 'ADD_ENEMY_FEEDBACK', feedback: item });
    next = gameReducer(next, {
      type: 'UPSERT_KNOWLEDGE',
      entry: {
        id: item.id,
        kind: 'enemy-feedback',
        status: verified ? 'verified' : 'observed',
        sourceIds: [experiment.id],
        relatedPersonIds: item.supportsTheoryEdgeIds.includes('edge-time-zhao')
          ? ['zhao']
          : item.supportsTheoryEdgeIds.length
            ? ['du']
            : [],
        relatedDocumentIds: [],
        lastUpdatedAt: at,
      },
    });
  }

  next = gameReducer(next, {
    type: 'UPSERT_BAIT_EXPERIMENT',
    experiment: { ...experiment, status: verified ? 'resolved' : 'observed' },
  });

  if (verified) {
    const edges = next.coreLoop.theoryEdges.map((edge) => (
      experiment.theoryEdgeIds.includes(edge.id)
        ? { ...edge, status: 'verified' as const }
        : edge
    ));
    for (const claimId of ['claim-zhao-time', 'claim-du-fodder-pattern', 'claim-du-route', 'claim-price-cipher', 'claim-shuoyuan-received']) {
      next = promoteKnowledge(next, claimId, 'verified', at);
    }
    const evaluation = evaluateTheory(next, edges);
    next = {
      ...next,
      stage: 'report',
      coreLoop: {
        ...next.coreLoop,
        theoryEdges: edges,
        theoryEvaluation: evaluation,
      },
    };
    next = syncObjectivesUntilStable(next, objectives);
  } else {
    next = {
      ...next,
      coreLoop: {
        ...next.coreLoop,
        theoryEvaluation: {
          ...next.coreLoop.theoryEvaluation,
          status: next.coreLoop.theoryEvaluation.status === 'verified' ? 'verified' : 'supported',
        },
      },
    };
  }

  return { state: next, feedback, verified };
}
