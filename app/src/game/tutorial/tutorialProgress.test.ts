import { describe, expect, it } from 'vitest';
import type { GameState, Relationship } from '../domain';
import { createInitialState } from '../initialState';
import { gameReducer } from '../reducer';
import {
  deriveTutorialStep,
  isTutorialComplete,
  tutorialObjective,
} from './tutorialProgress';

const contradiction: Relationship = {
  fromId: 'claim-zhao-copied-order',
  toId: 'claim-zhao-denial',
  kind: 'refutes',
  slot: 'leakedInfo',
};

function stateAt(step: GameState['tutorial']['step'], progress: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    ...progress,
    tutorial: { step, startedAtLeastOnce: step !== 'notStarted' },
  };
}

describe('tutorial progress', () => {
  it('returns the first unmet real-state requirement from the stored gameplay step', () => {
    expect(deriveTutorialStep(stateAt('openAmbushReport'))).toBe('openAmbushReport');

    expect(deriveTutorialStep(stateAt('openAmbushReport', {
      readDocumentIds: ['report-ambush'],
    }))).toBe('extractAmbushClaim');

    expect(deriveTutorialStep(stateAt('openAmbushReport', {
      readDocumentIds: ['report-ambush', 'statement-zhao'],
      extractedClaimIds: ['claim-shuoyuan-received', 'claim-zhao-denial'],
    }))).toBe('investigateHandwriting');

    expect(deriveTutorialStep(stateAt('openAmbushReport', {
      readDocumentIds: ['report-ambush', 'statement-zhao'],
      extractedClaimIds: [
        'claim-shuoyuan-received',
        'claim-zhao-denial',
        'claim-zhao-time',
        'claim-zhao-copied-order',
      ],
      completedInvestigationIds: ['investigate-handwriting'],
      relationships: [contradiction],
    }))).toBe('completed');

    expect(deriveTutorialStep(stateAt('investigateHandwriting', {
      completedInvestigationIds: ['investigate-handwriting'],
      extractedClaimIds: ['claim-zhao-time', 'claim-zhao-copied-order'],
      relationships: [contradiction],
    }))).toBe('completed');
  });

  it('does not regress behind the stored gameplay step when earlier evidence is hidden or absent', () => {
    const state = stateAt('placeContradiction', {
      readDocumentIds: [],
      extractedClaimIds: [],
      completedInvestigationIds: [],
      relationships: [],
    });

    expect(deriveTutorialStep(state)).toBe('placeContradiction');
  });

  it('preserves non-gameplay stored tutorial states and treats terminal states as complete', () => {
    expect(deriveTutorialStep(stateAt('notStarted'))).toBe('notStarted');
    expect(deriveTutorialStep(stateAt('introIdentity'))).toBe('introIdentity');
    expect(deriveTutorialStep(stateAt('introIncident'))).toBe('introIncident');
    expect(deriveTutorialStep(stateAt('introObjective'))).toBe('introObjective');
    expect(deriveTutorialStep(stateAt('completed'))).toBe('completed');
    expect(deriveTutorialStep(stateAt('skipped'))).toBe('skipped');
    expect(isTutorialComplete(stateAt('completed'))).toBe(true);
    expect(isTutorialComplete(stateAt('skipped'))).toBe(true);
    expect(isTutorialComplete(stateAt('placeContradiction'))).toBe(false);
  });

  it('describes objectives without internal rule terms and points the UI at the intended target', () => {
    expect(tutorialObjective('notStarted')).toEqual({
      title: '开始新手引导',
      reason: '准备好后，从第一份军报开始梳理案情。',
      requestedView: 'none',
    });
    expect(tutorialObjective('introIdentity')).toEqual({
      title: '确认你的身份',
      reason: '你要在下一次运粮前，先把伏击线索查清楚。',
      requestedView: 'none',
    });
    expect(tutorialObjective('introIncident')).toEqual({
      title: '了解伏击经过',
      reason: '军报会说明粮队在哪里、何时出事。',
      requestedView: 'none',
    });
    expect(tutorialObjective('introObjective')).toEqual({
      title: '明确当前目标',
      reason: '先找出敌军知道了什么，再判断谁能把消息传出去。',
      requestedView: 'none',
    });
    expect(tutorialObjective('openAmbushReport')).toEqual({
      title: '查看残缺伏击军报',
      reason: '先看看粮队在哪里、何时遭到伏击。',
      requestedView: 'documents',
      targetId: 'report-ambush',
    });
    expect(tutorialObjective('extractAmbushClaim')).toEqual({
      title: '记录第一条事实',
      reason: '把可以用于推理的事实记录成线索卡。',
      requestedView: 'documents',
      targetId: 'claim-shuoyuan-received',
    });
    expect(tutorialObjective('openZhaoStatement')).toEqual({
      title: '找出声称不知道出发时辰的人',
      reason: '打开赵简口供，找出与时辰有关的说法。',
      requestedView: 'documents',
      targetId: 'statement-zhao',
    });
    expect(tutorialObjective('extractZhaoDenial')).toEqual({
      title: '记录赵简的否认',
      reason: '把这句否认记下来，稍后与他抄写的命令核对。',
      requestedView: 'documents',
      targetId: 'claim-zhao-denial',
    });
    expect(tutorialObjective('investigateHandwriting')).toEqual({
      title: '核对集合命令笔迹',
      reason: '确认集合命令由谁抄写，别只听口供。',
      requestedView: 'documents',
      targetId: 'investigate-handwriting',
    });
    expect(tutorialObjective('interrogateZhao')).toEqual({
      title: '用亲笔命令质询赵简',
      reason: '选择赵简的口供，再提交与之矛盾的亲笔命令。',
      requestedView: 'documents',
      targetId: 'claim-zhao-time',
    });
    expect(tutorialObjective('placeContradiction')).toEqual({
      title: '建立第一条矛盾关系',
      reason: '把亲笔命令放入关系板，反驳赵简的口供。',
      requestedView: 'relationships',
      targetId: 'claim-zhao-copied-order',
    });
    expect(tutorialObjective('completed')).toEqual({
      title: '新手引导完成',
      reason: '你已经完成第一条证据链，可以继续自由查案。',
      requestedView: 'none',
    });
    expect(tutorialObjective('skipped')).toEqual({
      title: '已跳过新手引导',
      reason: '案情进度不会改变，你可以直接继续查案。',
      requestedView: 'none',
    });
  });

  it('does not mutate case progress when the tutorial is skipped', () => {
    const caseProgress = stateAt('interrogateZhao', {
      stage: 'chain',
      investigationPoints: 1,
      readDocumentIds: ['report-ambush', 'statement-zhao'],
      extractedClaimIds: ['claim-shuoyuan-received', 'claim-zhao-denial'],
      completedInvestigationIds: ['investigate-handwriting'],
      relationships: [contradiction],
    });

    const skipped = gameReducer(caseProgress, { type: 'SET_TUTORIAL_STEP', step: 'skipped' });

    expect(skipped).toEqual({
      ...caseProgress,
      tutorial: { step: 'skipped', startedAtLeastOnce: true },
    });
  });
});
