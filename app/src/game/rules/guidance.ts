import type { GameState, GuidanceCue, GuidanceStatus } from '../domain';

function withGuidance(state: GameState, guidance: GameState['coreLoop']['guidance']): GameState {
  if (guidance === state.coreLoop.guidance) return state;
  return { ...state, coreLoop: { ...state.coreLoop, guidance } };
}

function cueStatus(state: GameState, cueId: string): GuidanceStatus {
  return state.coreLoop.guidance.cueStates[cueId] ?? 'unseen';
}

function isAutoEligible(state: GameState, cue: GuidanceCue, now: number) {
  if (cue.objectiveId !== state.coreLoop.guidance.currentObjectiveId) return false;
  if (cueStatus(state, cue.id) !== 'unseen') return false;
  switch (cue.trigger) {
    case 'new-gap':
      return state.coreLoop.theoryEvaluation.gaps.length > 0;
    case 'invalid-theory':
      return state.coreLoop.guidance.invalidTheoryAttempts >= 2;
    case 'unused-evidence':
      return state.coreLoop.guidance.unusedEvidenceIds.length > 0;
    case 'stalled':
      return state.coreLoop.guidance.lastProgressAt > 0 && now - state.coreLoop.guidance.lastProgressAt >= 120_000;
    case 'manual':
      return false;
  }
}

export function nextProactiveCue(state: GameState, cues: GuidanceCue[], now = Date.now()): GuidanceCue | undefined {
  const order: GuidanceCue['trigger'][] = ['new-gap', 'invalid-theory', 'unused-evidence', 'stalled'];
  for (const trigger of order) {
    const cue = cues.find((item) => item.trigger === trigger && isAutoEligible(state, item, now));
    if (cue) return cue;
  }
  return undefined;
}

export function markCueShown(state: GameState, cueId: string): GameState {
  if (cueStatus(state, cueId) !== 'unseen') return state;
  return withGuidance(state, {
    ...state.coreLoop.guidance,
    cueStates: { ...state.coreLoop.guidance.cueStates, [cueId]: 'shown' },
  });
}

export function dismissCue(state: GameState, cueId: string): GameState {
  if (cueStatus(state, cueId) === 'resolved') return state;
  return withGuidance(state, {
    ...state.coreLoop.guidance,
    cueStates: { ...state.coreLoop.guidance.cueStates, [cueId]: 'dismissed' },
  });
}

export function requestManualHint(state: GameState, cueId: string): GameState {
  const current = state.coreLoop.guidance.manualHintLevels[cueId] ?? 0;
  const level = Math.min(3, current + 1) as 0 | 1 | 2 | 3;
  const currentStatus = cueStatus(state, cueId);
  return withGuidance(state, {
    ...state.coreLoop.guidance,
    manualHintLevels: { ...state.coreLoop.guidance.manualHintLevels, [cueId]: level },
    cueStates: {
      ...state.coreLoop.guidance.cueStates,
      [cueId]: currentStatus === 'resolved' ? 'resolved' : 'shown',
    },
  });
}

export function resolveGuidanceForProgress(state: GameState, cues: GuidanceCue[]): GameState {
  let changed = false;
  const cueStates = { ...state.coreLoop.guidance.cueStates };
  for (const cue of cues) {
    const status = cueStates[cue.id] ?? 'unseen';
    if (status === 'resolved') continue;
    const objectivePassed = cue.objectiveId !== state.coreLoop.guidance.currentObjectiveId && status !== 'unseen';
    const triggerResolved = cue.trigger === 'new-gap'
      ? state.coreLoop.theoryEvaluation.gaps.length === 0
      : cue.trigger === 'invalid-theory'
        ? state.coreLoop.theoryEvaluation.status === 'supported' || state.coreLoop.theoryEvaluation.status === 'verified'
        : cue.trigger === 'unused-evidence'
          ? state.coreLoop.guidance.unusedEvidenceIds.length === 0
          : false;
    if (objectivePassed || triggerResolved) {
      cueStates[cue.id] = 'resolved';
      changed = true;
    }
  }
  if (!changed) return state;
  return withGuidance(state, { ...state.coreLoop.guidance, cueStates });
}

export function selectManualGuidanceCue(state: GameState, cues: GuidanceCue[]): GuidanceCue | undefined {
  const current = cues.filter((cue) => cue.objectiveId === state.coreLoop.guidance.currentObjectiveId && cueStatus(state, cue.id) !== 'resolved');
  const active = [
    current.find((cue) => cue.trigger === 'new-gap' && state.coreLoop.theoryEvaluation.gaps.length > 0),
    current.find((cue) => cue.trigger === 'invalid-theory' && state.coreLoop.guidance.invalidTheoryAttempts >= 2),
    current.find((cue) => cue.trigger === 'unused-evidence' && state.coreLoop.guidance.unusedEvidenceIds.length > 0),
    current.find((cue) => cue.trigger === 'manual'),
    current[0],
  ].find(Boolean);
  if (active) return active;

  if (state.coreLoop.theoryEvaluation.gaps.some((gap) => gap.kind === 'missing-route')) {
    return cues.find((cue) => cue.id === 'cue-route-gap');
  }
  if (state.coreLoop.theoryEvaluation.gaps.some((gap) => gap.kind === 'missing-transmitter')) {
    return cues.find((cue) => cue.id === 'cue-transmitter-gap');
  }
  return cues.find((cue) => cue.trigger === 'manual');
}

export function guidanceText(cue: GuidanceCue, level: number) {
  if (level <= 1) return cue.level1;
  if (level === 2) return cue.level2;
  return cue.level3;
}
