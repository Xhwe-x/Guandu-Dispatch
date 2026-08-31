import { describe, expect, it } from 'vitest';
import { guanduCase } from '../../content/guandu';
import { guanduObjectives, guanduTheoryNodes } from '../../content/guandu/coreLoop';
import { createInitialState } from '../../game/initialState';
import { gameReducer } from '../../game/reducer';
import { evaluateBaitExperiment } from '../../game/rules/bait';
import { applyEnemyFeedbackResolution } from '../../game/rules/enemyFeedback';
import { resolveEvidenceReaction } from '../../game/rules/evidenceReaction';
import { markObservedClaim, promoteKnowledge, syncObjectivesUntilStable } from '../../game/rules/knowledge';
import { evaluateTheory, frozenCoreTheoryEdges } from '../../game/rules/theory';

function discover(state: ReturnType<typeof createInitialState>, claimId: string, at: number) {
  const extracted = gameReducer(state, { type: 'EXTRACT_CLAIM', claimId });
  return markObservedClaim(guanduCase, extracted, claimId, at);
}

describe('v0.9.5 core gameplay loop playthrough', () => {
  it('travels from investigation to verified enemy feedback without dead ends', () => {
    let state = createInitialState();

    state = discover(state, 'claim-shuoyuan-received', 1);
    state = discover(state, 'claim-zhao-copied-order', 2);
    expect(state.coreLoop.knowledge['claim-zhao-copied-order']?.status).toBe('observed');

    const wrong = resolveEvidenceReaction(guanduCase, state, 'zhao', 'claim-shuoyuan-received', 3);
    expect(wrong.reaction).toBe('irrelevant');
    expect(wrong.state.investigationPoints).toBe(state.investigationPoints);
    state = wrong.state;

    const zhao = resolveEvidenceReaction(guanduCase, state, 'zhao', 'claim-zhao-copied-order', 4);
    state = syncObjectivesUntilStable(zhao.state, guanduObjectives);
    expect(state.coreLoop.knowledge['claim-zhao-time']?.status).toBe('supported');
    expect(state.coreLoop.guidance.currentObjectiveId).toBe('objective-route-leak');

    const earlyTheory = evaluateTheory(state, [frozenCoreTheoryEdges[0]]);
    expect(earlyTheory.status).toBe('incomplete');
    expect(earlyTheory.gaps.some((gap) => gap.kind === 'missing-route')).toBe(true);
    state = gameReducer(state, { type: 'SET_DOSSIER_TARGET', target: { kind: 'gap', id: 'gap-route' } });
    expect(state.coreLoop.selectedDossierTarget).toEqual({ kind: 'gap', id: 'gap-route' });

    for (const [index, claimId] of ['claim-du-fodder-pattern', 'claim-price-cipher', 'claim-south-ford-open'].entries()) {
      state = discover(state, claimId, 10 + index);
    }

    state = resolveEvidenceReaction(guanduCase, state, 'du', 'claim-du-fodder-pattern', 20).state;
    state = resolveEvidenceReaction(guanduCase, state, 'du', 'claim-price-cipher', 21).state;
    expect(state.coreLoop.knowledge['claim-du-route']?.status).toBe('supported');
    expect(state.coreLoop.knowledge['claim-price-cipher']?.status).toBe('supported');

    const supportedEvaluation = evaluateTheory(state, frozenCoreTheoryEdges);
    expect(supportedEvaluation.status).toBe('supported');
    const supportedEdges = frozenCoreTheoryEdges.map((edge) => ({
      ...edge,
      status: supportedEvaluation.supportedEdgeIds.includes(edge.id) ? 'supported' as const : 'proposed' as const,
    }));
    state = gameReducer(state, {
      type: 'SET_THEORY_GRAPH',
      nodes: guanduTheoryNodes,
      edges: supportedEdges,
      evaluation: supportedEvaluation,
    });
    state = promoteKnowledge(state, 'claim-shuoyuan-received', 'supported', 22);
    state = syncObjectivesUntilStable(state, guanduObjectives);
    expect(state.coreLoop.theoryEvaluation.status).toBe('supported');

    const experiment = evaluateBaitExperiment(guanduCase, {
      knownClaimIds: state.extractedClaimIds,
      theoryEdgeIds: supportedEdges.map((edge) => edge.id),
      baitIds: ['bait-zhao-yin', 'bait-du-south-ford'],
      realPlan: { route: 'northBridge', time: 'zi' },
    });
    state = gameReducer(state, {
      type: 'RESOLVE_BAIT',
      realPlan: { route: 'northBridge', time: 'zi' },
      baitBand: experiment.resolution.baitBand,
      enemyReport: experiment.resolution.enemyReport,
    });
    state = gameReducer(state, { type: 'UPSERT_BAIT_EXPERIMENT', experiment: experiment.experiment });
    state = { ...state, stage: 'bait' };
    state = syncObjectivesUntilStable(state, guanduObjectives);

    const applied = applyEnemyFeedbackResolution(
      state,
      experiment.experiment,
      experiment.resolution,
      guanduObjectives,
      30,
    );
    state = applied.state;

    expect(applied.verified).toBe(true);
    expect(state.coreLoop.theoryEvaluation.status).toBe('verified');
    expect(state.coreLoop.enemyFeedback.length).toBeGreaterThanOrEqual(2);
    expect(state.coreLoop.knowledge['claim-zhao-time']?.status).toBe('verified');
    expect(state.coreLoop.knowledge['claim-du-route']?.status).toBe('verified');
    expect(state.stage).toBe('report');
    expect(state.coreLoop.guidance.currentObjectiveId).toBe('objective-verify-network');
  });
});
