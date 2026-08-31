import type { GameContent, GameState, PersonState } from '../domain';
import { gameReducer } from '../reducer';
import { markClaimsObserved } from './knowledge';

export interface InterrogationInput {
  characterId: string;
  statementClaimId: string;
  evidenceClaimId: string;
  tone: 'calm' | 'threaten' | 'empathize' | 'misdirect';
  deep: boolean;
}

export interface InvestigationResult {
  state: GameState;
  revealedClaimIds: string[];
}

export interface InterrogationResult {
  state: GameState;
  breakthrough: boolean;
  revealedClaimIds: string[];
  responseKey: string;
}

export function applyInvestigation(
  content: GameContent,
  state: GameState,
  investigationId: string,
): InvestigationResult {
  const investigation = content.investigations.find((item) => item.id === investigationId);
  if (!investigation) {
    throw new Error(`Unknown investigation: ${investigationId}`);
  }
  if (state.completedInvestigationIds.includes(investigationId)) {
    throw new Error('该调查已经完成');
  }
  if (state.investigationPoints < investigation.cost) {
    throw new Error('调查点不足');
  }

  const completed = gameReducer(state, {
    type: 'COMPLETE_INVESTIGATION',
    investigationId,
    revealClaimIds: investigation.revealClaimIds,
  });
  return {
    state: markClaimsObserved(content, completed, investigation.revealClaimIds),
    revealedClaimIds: investigation.revealClaimIds,
  };
}

export function resolveInterrogation(
  content: GameContent,
  state: GameState,
  input: InterrogationInput,
): InterrogationResult {
  const rule = content.interrogations.find((item) => (
    item.characterId === input.characterId
    && item.statementClaimId === input.statementClaimId
  ));
  const breakthrough = rule?.evidenceClaimId === input.evidenceClaimId;
  const currentPersonState = state.personStates[input.characterId] ?? 'cooperative';
  let nextPersonState: PersonState;

  if (breakthrough) {
    nextPersonState = input.tone === 'threaten' || input.tone === 'misdirect'
      ? 'guarded'
      : 'cooperative';
  } else if (currentPersonState === 'hostile' || input.tone === 'threaten') {
    nextPersonState = 'hostile';
  } else if (input.deep) {
    nextPersonState = currentPersonState === 'guarded' ? 'hostile' : 'guarded';
  } else if (input.tone === 'misdirect') {
    nextPersonState = 'guarded';
  } else {
    nextPersonState = currentPersonState;
  }

  const revealedClaimIds = breakthrough ? (rule?.revealClaimIds ?? []) : [];

  return {
    state: {
      ...gameReducer(state, {
        type: 'SET_PERSON_STATE',
        characterId: input.characterId,
        state: nextPersonState,
      }),
      extractedClaimIds: [...new Set([...state.extractedClaimIds, ...revealedClaimIds])],
    },
    breakthrough,
    revealedClaimIds,
    responseKey: breakthrough ? rule!.responseKeys[input.tone] : `${input.characterId}.wrongEvidence.${input.tone}`,
  };
}
