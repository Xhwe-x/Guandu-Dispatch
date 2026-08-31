import { describe, expect, it } from 'vitest';
import { createInitialState } from './initialState';
import { gameReducer } from './reducer';
import {
  canAdvance,
  selectCanOpenBait,
  selectCurrentObjective,
  selectRemainingInvestigationPoints,
} from './selectors';
import type { GameState, Relationship } from './domain';

describe('game reducer', () => {
  it('starts with three investigation points, four cooperative people, and no timer state', () => {
    const state = createInitialState();

    expect(state.version).toBe(6);
    expect(state.presentation).toEqual({
      sceneId: 'title',
      sceneHistory: [],
      storySceneId: 'prologue-background',
      beatIndex: 0,
      documentFindingIds: [],
      handwritingFindingIds: [],
      interrogation: {
        evidenceClaimId: 'claim-shuoyuan-received',
        tone: 'calm',
        attempts: 0,
      },
      deduction: {},
      networkTheory: {},
      reportDraft: {
        leakedInfo: [],
        sourceCharacterIds: [],
        evidenceClaimIds: [],
        handling: 'differentiate',
      },
      audience: { visitId: 'first-report', shotIndex: 0, attitude: 'observing', choiceIds: [] },
    });
    expect(state.tutorial).toEqual({ step: 'notStarted', startedAtLeastOnce: false, enabled: true, seenLessonIds: [] });
    expect(state.investigationPoints).toBe(3);
    expect(state.stage).toBe('documents');
    expect(state.personStates).toEqual({
      lu: 'cooperative',
      zheng: 'cooperative',
      zhao: 'cooperative',
      du: 'cooperative',
    });
    expect(state).not.toHaveProperty('deadline');
    expect(state).not.toHaveProperty('secondsRemaining');
    expect(state).not.toHaveProperty('timer');
  });


  it('persists presentation navigation and interaction progress independently from case rules', () => {
    const state = createInitialState();
    const inStory = gameReducer(state, { type: 'SET_SCENE', sceneId: 'story' });
    const atBeat = gameReducer(inStory, { type: 'SET_STORY_POSITION', storySceneId: 'intro-cg', beatIndex: 2 });
    const markedReport = gameReducer(atBeat, { type: 'MARK_DOCUMENT_FINDING', findingId: 'ambush-location' });
    const markedHandwriting = gameReducer(markedReport, { type: 'MARK_HANDWRITING_FINDING', findingId: 'hook-stroke' });
    const selectedInterrogation = gameReducer(markedHandwriting, {
      type: 'SET_INTERROGATION_SELECTION',
      evidenceClaimId: 'claim-zhao-copied-order',
      tone: 'threaten',
    });
    const attempted = gameReducer(selectedInterrogation, { type: 'RECORD_INTERROGATION_ATTEMPT' });
    const deduction = gameReducer(attempted, {
      type: 'SET_DEDUCTION_DRAFT',
      fromId: 'claim-zhao-copied-order',
      toId: 'claim-zhao-denial',
      kind: 'refutes',
    });

    expect(deduction.presentation).toMatchObject({
      sceneId: 'story',
      storySceneId: 'intro-cg',
      beatIndex: 2,
      documentFindingIds: ['ambush-location'],
      handwritingFindingIds: ['hook-stroke'],
      interrogation: {
        evidenceClaimId: 'claim-zhao-copied-order',
        tone: 'threaten',
        attempts: 1,
      },
      deduction: {
        fromId: 'claim-zhao-copied-order',
        toId: 'claim-zhao-denial',
        kind: 'refutes',
      },
    });
    const networkTheory = gameReducer(deduction, {
      type: 'SET_NETWORK_THEORY',
      timeSourceId: 'zhao',
      routeSourceId: 'du',
      transmitterId: 'du',
    });
    const reportDraft = gameReducer(networkTheory, {
      type: 'SET_REPORT_DRAFT',
      reportDraft: {
        leakedInfo: ['departureTime', 'route'],
        sourceCharacterIds: ['zhao', 'du'],
        integratorId: 'du',
        transmissionMethod: 'priceCipher',
        evidenceClaimIds: ['claim-zhao-time', 'claim-du-route', 'claim-price-cipher'],
        handling: 'differentiate',
      },
    });
    const baitResolved = gameReducer(reportDraft, {
      type: 'RESOLVE_BAIT',
      realPlan: { route: 'northBridge', time: 'zi' },
      baitBand: 'bothCore',
      enemyReport: { route: 'southFord', time: 'yin' },
    });

    expect(baitResolved.presentation.networkTheory).toEqual({
      timeSourceId: 'zhao',
      routeSourceId: 'du',
      transmitterId: 'du',
    });
    expect(baitResolved.presentation.reportDraft.integratorId).toBe('du');
    expect(baitResolved.realPlan).toEqual({ route: 'northBridge', time: 'zi' });
    expect(baitResolved.baitBand).toBe('bothCore');
    expect(baitResolved.enemyReport).toEqual({ route: 'southFord', time: 'yin' });
    expect(baitResolved.stage).toBe('documents');
  });

  it('does not advance while reading, extracting, placing, or selecting', () => {
    const relation: Relationship = {
      fromId: 'claim-zhao-time',
      toId: 'zhao',
      kind: 'accessedBy',
      slot: 'actor',
    };
    const state = createInitialState();
    const afterReading = gameReducer(state, { type: 'READ_DOCUMENT', documentId: 'report-ambush' });
    const afterExtracting = gameReducer(afterReading, { type: 'EXTRACT_CLAIM', claimId: 'claim-zhao-time' });
    const afterPlacing = gameReducer(afterExtracting, { type: 'PLACE_RELATIONSHIP', relationship: relation });
    const afterSelecting = gameReducer(afterPlacing, { type: 'SELECT_BAIT', baitId: 'bait-zhao-yin', channel: 'zhao' });

    expect(afterSelecting.stage).toBe('documents');
  });

  it('advances exactly one normal stage only when CONFIRM_ADVANCE is dispatched', () => {
    const afterConfirm = gameReducer(createInitialState(), { type: 'CONFIRM_ADVANCE' });

    expect(afterConfirm.stage).toBe('secrets');
    expect(gameReducer(afterConfirm, { type: 'CONFIRM_ADVANCE' }).stage).toBe('chain');
  });

  it('does not mutate the prior state and deduplicates ID collections', () => {
    const state = createInitialState();
    const afterFirstRead = gameReducer(state, { type: 'READ_DOCUMENT', documentId: 'doc-zhao' });
    const afterSecondRead = gameReducer(afterFirstRead, { type: 'READ_DOCUMENT', documentId: 'doc-zhao' });
    const afterInvestigation = gameReducer(afterSecondRead, {
      type: 'COMPLETE_INVESTIGATION',
      investigationId: 'investigate-zhao-family',
      revealClaimIds: ['claim-zhao-coerced', 'claim-zhao-coerced'],
    });

    expect(state.readDocumentIds).toEqual([]);
    expect(afterSecondRead.readDocumentIds).toEqual(['doc-zhao']);
    expect(afterInvestigation.extractedClaimIds).toEqual(['claim-zhao-coerced']);
    expect(afterInvestigation.completedInvestigationIds).toEqual(['investigate-zhao-family']);
    expect(afterInvestigation.investigationPoints).toBe(2);
  });

  it('does not spend points or duplicate a completed investigation when the action is repeated', () => {
    const completed = gameReducer(createInitialState(), {
      type: 'COMPLETE_INVESTIGATION',
      investigationId: 'investigate-zhao-family',
      revealClaimIds: ['claim-zhao-coerced'],
    });
    const repeated = gameReducer(completed, {
      type: 'COMPLETE_INVESTIGATION',
      investigationId: 'investigate-zhao-family',
      revealClaimIds: ['claim-zhao-coerced'],
    });

    expect(repeated).toBe(completed);
    expect(repeated.investigationPoints).toBe(2);
  });

  it('keeps one bait selection per channel', () => {
    const state = createInitialState();
    const firstSelection = gameReducer(state, { type: 'SELECT_BAIT', baitId: 'bait-zhao-yin', channel: 'zhao' });
    const replacement = gameReducer(firstSelection, { type: 'SELECT_BAIT', baitId: 'bait-zhao-mao', channel: 'zhao' });

    expect(replacement.selectedBaitIds).toEqual(['bait-zhao-mao']);
    expect(firstSelection.selectedBaitIds).toEqual(['bait-zhao-yin']);
  });

  it('does not duplicate an identical relationship', () => {
    const relationship: Relationship = {
      fromId: 'claim-du-route',
      toId: 'du',
      kind: 'infers',
      slot: 'method',
    };
    const once = gameReducer(createInitialState(), { type: 'PLACE_RELATIONSHIP', relationship });
    const twice = gameReducer(once, { type: 'PLACE_RELATIONSHIP', relationship });

    expect(twice.relationships).toEqual([relationship]);
  });

  it('records person, report, truth, and hint choices without changing the stage', () => {
    const state = createInitialState();
    const withPerson = gameReducer(state, { type: 'SET_PERSON_STATE', characterId: 'zhao', state: 'guarded' });
    const withReport = gameReducer(withPerson, {
      type: 'SUBMIT_REPORT',
      report: {
        leakedInfo: ['行军路线'],
        sourceCharacterIds: ['zhao', 'du'],
        integratorId: 'du',
        transmissionMethod: '价格暗号',
        evidenceClaimIds: ['claim-price-cipher'],
        handling: 'cutOff',
      },
      outcome: 'networkClosed',
    });
    const withOwner = gameReducer(withReport, { type: 'CHOOSE_TRUTH_OWNER', owner: 'lishe' });
    const withHint = gameReducer(withOwner, { type: 'USE_HINT', topic: 'timeSource', level: 2 });

    expect(withHint.stage).toBe('documents');
    expect(withHint.personStates.zhao).toBe('guarded');
    expect(withHint.actionOutcome).toBe('networkClosed');
    expect(withHint.truthOwner).toBe('lishe');
    expect(withHint.hintUsage).toEqual({ timeSource: 2 });
  });

  it('changes only tutorial fields when setting a tutorial step', () => {
    const state = createInitialState();
    const after = gameReducer(state, { type: 'SET_TUTORIAL_STEP', step: 'introIdentity' });

    expect(after).toEqual({
      ...state,
      tutorial: { ...state.tutorial, step: 'introIdentity', startedAtLeastOnce: true },
    });
    expect(state.tutorial).toEqual({ step: 'notStarted', startedAtLeastOnce: false, enabled: true, seenLessonIds: [] });
  });

  it('resets only tutorial fields without changing case progress', () => {
    const state = {
      ...createInitialState(),
      stage: 'chain' as const,
      investigationPoints: 1,
      extractedClaimIds: ['claim-zhao-denial'],
      tutorial: { step: 'interrogateZhao' as const, startedAtLeastOnce: true },
    };
    const after = gameReducer(state, { type: 'RESET_TUTORIAL' });

    expect(after).toEqual({
      ...state,
      tutorial: { step: 'notStarted', startedAtLeastOnce: false, seenLessonIds: [] },
    });
    expect(after.stage).toBe('chain');
    expect(after.investigationPoints).toBe(1);
    expect(after.extractedClaimIds).toEqual(['claim-zhao-denial']);
  });

  it('applies the supplied validated rule state exactly', () => {
    const before = createInitialState();
    const ruleResult = {
      ...before,
      extractedClaimIds: ['claim-zhao-copied-order'],
      investigationPoints: 2,
    };

    expect(gameReducer(before, { type: 'APPLY_RULE_STATE', state: ruleResult })).toBe(ruleResult);
  });

  it('does not reduce investigation points below zero', () => {
    const noPoints = { ...createInitialState(), investigationPoints: 0 };
    const afterInvestigation = gameReducer(noPoints, {
      type: 'COMPLETE_INVESTIGATION',
      investigationId: 'investigate-zhao-family',
      revealClaimIds: ['claim-zhao-coerced'],
    });

    expect(afterInvestigation).toBe(noPoints);
  });

  it('does not change a negative restored state when an investigation is dispatched', () => {
    const restored = gameReducer(createInitialState(), {
      type: 'RESTORE_STATE',
      state: {
        ...createInitialState(),
        investigationPoints: -1,
      },
    });
    const afterInvestigation = gameReducer(restored, {
      type: 'COMPLETE_INVESTIGATION',
      investigationId: 'investigate-zhao-family',
      revealClaimIds: ['claim-zhao-coerced'],
    });

    expect(afterInvestigation).toBe(restored);
    expect(afterInvestigation.investigationPoints).toBe(-1);
    expect(afterInvestigation.completedInvestigationIds).toEqual([]);
    expect(afterInvestigation.extractedClaimIds).toEqual([]);
  });

  it('restores the supplied persisted state exactly', () => {
    const saved: GameState = {
      ...createInitialState(),
      stage: 'report',
      investigationPoints: 1,
      selectedBaitIds: ['bait-zhao-yin'],
    };

    expect(gameReducer(createInitialState(), { type: 'RESTORE_STATE', state: saved })).toBe(saved);
  });
});

describe('game selectors', () => {
  it('reports remaining investigation points and the objective for the current stage', () => {
    const state = { ...createInitialState(), investigationPoints: 2, stage: 'chain' as const };

    expect(selectRemainingInvestigationPoints(state)).toBe(2);
    expect(selectCurrentObjective(state)).toBe('梳理泄密链条');
    expect(canAdvance(state)).toBe(true);
    expect(canAdvance({ ...state, stage: 'ending' })).toBe(false);
  });

  it('opens bait only in chain after every base claim has been extracted, regardless of time-like data', () => {
    const chainState: GameState = {
      ...createInitialState(),
      stage: 'chain',
      extractedClaimIds: ['claim-zhao-time', 'claim-du-route', 'claim-bridge-open'],
    };

    expect(selectCanOpenBait(chainState)).toBe(true);
    expect(selectCanOpenBait({ ...chainState, stage: 'secrets' })).toBe(false);
    expect(selectCanOpenBait({ ...chainState, extractedClaimIds: ['claim-zhao-time', 'claim-du-route'] })).toBe(false);
    expect(selectCanOpenBait({ ...chainState, secondsRemaining: 0 } as GameState)).toBe(true);
  });
  it('keeps a bounded v0.9 scene history and can return to the previous gameplay scene', () => {
    let state = createInitialState();
    state = gameReducer(state, { type: 'SET_SCENE', sceneId: 'opening' });
    state = gameReducer(state, { type: 'SET_SCENE', sceneId: 'first-evidence' });
    state = gameReducer(state, { type: 'SET_SCENE', sceneId: 'first-deduction' });

    expect(state.presentation.sceneHistory?.map((item) => item.sceneId)).toEqual(['opening', 'first-evidence']);
    const back = gameReducer(state, { type: 'GO_BACK' });
    expect(back.presentation.sceneId).toBe('first-evidence');
    expect(back.presentation.sceneHistory?.map((item) => item.sceneId)).toEqual(['opening']);
  });

  it('repairs a legacy v0.8 scene into a safe v0.9 presentation and drops legacy history', () => {
    const state = createInitialState();
    const legacy = {
      ...state,
      presentation: {
        ...state.presentation,
        sceneId: 'document' as const,
        storySceneId: 'intro-cg',
        sceneHistory: [{ sceneId: 'camp' as const, storySceneId: 'camp-brief', beatIndex: 0 }],
      },
    };

    const repaired = gameReducer(legacy, { type: 'REPAIR_PRESENTATION' });
    expect(repaired.presentation.sceneId).toBe('opening');
    expect(repaired.presentation.storySceneId).toBe('prologue-background');
    expect(repaired.presentation.sceneHistory).toEqual([]);
  });

  it('persists tutorial lesson and audio preferences without changing case progress', () => {
    const state = createInitialState();
    const withLesson = gameReducer(state, { type: 'MARK_TUTORIAL_LESSON', lessonId: 'lesson-document' });
    const muted = gameReducer(withLesson, { type: 'SET_AUDIO_SETTINGS', settings: { voiceEnabled: false, volume: 0.4 } });

    expect(muted.tutorial.seenLessonIds).toEqual(['lesson-document']);
    expect(muted.audio).toMatchObject({ enabled: true, voiceEnabled: false, volume: 0.4 });
    expect(muted.extractedClaimIds).toEqual([]);
  });

  it('records Cao Cao audience choices and attitude as presentation state', () => {
    let state = createInitialState();
    state = gameReducer(state, { type: 'START_AUDIENCE', visitId: 'first-report' });
    state = gameReducer(state, { type: 'RECORD_AUDIENCE_CHOICE', choiceId: 'brief-key-fact', attitude: 'approving' });
    state = gameReducer(state, { type: 'SET_AUDIENCE_SHOT', shotIndex: 4 });

    expect(state.presentation.audience).toEqual({
      visitId: 'first-report',
      shotIndex: 4,
      attitude: 'approving',
      choiceIds: ['brief-key-fact'],
    });
  });

});
