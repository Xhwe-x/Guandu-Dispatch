import type { EntityId, GameState } from './domain';

export function selectKnowledge(state: GameState, id: EntityId) {
  return state.coreLoop.knowledge[id];
}

export function selectCurrentObjectiveId(state: GameState) {
  return state.coreLoop.guidance.currentObjectiveId;
}

export function selectUnusedEvidenceIds(state: GameState) {
  return state.coreLoop.guidance.unusedEvidenceIds;
}

export function selectOpenTheoryGaps(state: GameState) {
  return state.coreLoop.theoryEvaluation.gaps;
}

export function selectInvestigableDirectionCount(state: GameState) {
  return new Set([
    ...state.coreLoop.theoryEvaluation.gaps.flatMap((gap) => gap.suggestedPersonIds),
    ...state.coreLoop.guidance.unusedEvidenceIds,
  ]).size;
}
