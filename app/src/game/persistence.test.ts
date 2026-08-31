import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState } from './initialState';
import {
  loadGame,
  restoreStageSnapshot,
  saveGame,
  saveStageSnapshot,
} from './persistence';

const CURRENT_KEY = 'guandu.current';
const SNAPSHOT_KEY = 'guandu.stage-snapshot';

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a version 6 state with core-loop progress', () => {
    const state = createInitialState();

    saveGame(localStorage, state);

    expect(loadGame(localStorage)).toEqual({ kind: 'ok', state });
  });

  it('round-trips a connected late-game scene', () => {
    const state = createInitialState();
    state.presentation.sceneId = 'final-report';
    state.presentation.networkTheory = { timeSourceId: 'zhao', routeSourceId: 'du', transmitterId: 'du' };

    saveGame(localStorage, state);

    // 载入会对 presentation 做一次修复归一，晚局场景会补上派生的 dialogueNodeId。
    const loaded = loadGame(localStorage);
    expect(loaded.kind).toBe('ok');
    if (loaded.kind !== 'ok') return;
    expect(loaded.state).toEqual({
      ...state,
      presentation: { ...state.presentation, dialogueNodeId: 'bg-guan-du' },
    });
  });

  it('migrates a valid version 1 current save to skipped onboarding', () => {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({
      version: 1,
      stage: 'secrets',
      investigationPoints: 2,
      readDocumentIds: ['report-ambush'],
      extractedClaimIds: ['claim-shuoyuan-received'],
      relationships: [],
      completedInvestigationIds: [],
      personStates: { zhao: 'cooperative' },
      selectedBaitIds: [],
      hintUsage: {},
    }));

    const migrated = loadGame(localStorage);
    expect(migrated.kind).toBe('ok');
    if (migrated.kind !== 'ok') return;
    expect(migrated.state).toMatchObject({ version: 6, tutorial: { step: 'skipped', startedAtLeastOnce: true }, stage: 'secrets' });
    expect(migrated.state.presentation).toMatchObject({ sceneId: 'title', storySceneId: 'prologue-background', beatIndex: 0, sceneHistory: [] });
  });

  it('migrates a version 2 vertical-slice save into the nearest progressive v0.9 scene', () => {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({
      version: 2,
      tutorial: { step: 'interrogateZhao', startedAtLeastOnce: true },
      stage: 'documents',
      investigationPoints: 2,
      readDocumentIds: ['report-ambush', 'statement-zhao'],
      extractedClaimIds: ['claim-shuoyuan-received', 'claim-zhao-denial', 'claim-zhao-copied-order'],
      relationships: [],
      completedInvestigationIds: ['investigate-handwriting'],
      personStates: { lu: 'cooperative', zheng: 'cooperative', zhao: 'cooperative', du: 'cooperative' },
      selectedBaitIds: [],
      hintUsage: {},
    }));

    const loaded = loadGame(localStorage);
    expect(loaded.kind).toBe('ok');
    if (loaded.kind !== 'ok') return;
    expect(loaded.state.version).toBe(6);
    expect(loaded.state.presentation.sceneId).toBe('first-deduction');
    expect(loaded.state.presentation.storySceneId).toBe('case-summary');
    expect(loaded.state.presentation.sceneHistory).toEqual([]);
  });


  it('migrates a v5 checkpoint into v6 without losing legacy progress', () => {
    const current = createInitialState();
    const legacy = {
      ...current,
      version: 5,
      coreLoop: undefined,
      extractedClaimIds: ['claim-zhao-time', 'claim-du-fodder-pattern', 'claim-du-route', 'claim-price-cipher', 'claim-shuoyuan-received'],
      relationships: [
        { fromId: 'claim-zhao-time', toId: 'zhao', kind: 'accessedBy', slot: 'source' },
        { fromId: 'claim-du-route', toId: 'du', kind: 'infers', slot: 'actor' },
        { fromId: 'du', toId: 'claim-shuoyuan-received', kind: 'transmitsTo', slot: 'method' },
      ],
      selectedBaitIds: ['bait-zhao-yin', 'bait-du-south-ford'],
      baitBand: 'bothCore',
      enemyReport: { route: '南渡', time: '寅时' },
      presentation: { ...current.presentation, sceneId: 'enemy-report' },
    };
    localStorage.setItem(CURRENT_KEY, JSON.stringify(legacy));

    const loaded = loadGame(localStorage);
    expect(loaded.kind).toBe('ok');
    if (loaded.kind !== 'ok') return;
    expect(loaded.state.version).toBe(6);
    expect(loaded.state.extractedClaimIds).toEqual(legacy.extractedClaimIds);
    expect(loaded.state.relationships).toEqual(legacy.relationships);
    expect(loaded.state.selectedBaitIds).toEqual(legacy.selectedBaitIds);
    expect(loaded.state.presentation.sceneId).toBe('enemy-report');
    expect(loaded.state.coreLoop.knowledge['claim-zhao-time']?.status).not.toBe('unknown');
    expect(loaded.state.coreLoop.theoryEdges.length).toBeGreaterThan(0);
    expect(loaded.state.coreLoop.baitExperiments[0]?.baitIds).toEqual(legacy.selectedBaitIds);
    expect(loaded.state.coreLoop.enemyFeedback.length).toBeGreaterThan(0);
  });

  it('returns empty when no current save exists', () => {
    expect(loadGame(localStorage)).toEqual({ kind: 'empty' });
  });

  it('recovers the last valid snapshot after a corrupted current save', () => {
    const snapshot = createInitialState();
    saveStageSnapshot(localStorage, snapshot);
    localStorage.setItem(CURRENT_KEY, '{broken');

    expect(loadGame(localStorage)).toEqual({ kind: 'recovered', state: snapshot });
  });

  it('never silently accepts an unknown numeric save version', () => {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ version: 99 }));

    expect(loadGame(localStorage)).toEqual({ kind: 'unsupported', version: 99 });
  });

  it('does not recover an unknown numeric current version from a valid snapshot', () => {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ version: 99 }));
    saveStageSnapshot(localStorage, createInitialState());

    expect(loadGame(localStorage)).toEqual({ kind: 'unsupported', version: 99 });
  });

  it('rejects JSON that has version 1 but does not match the game-state schema', () => {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ version: 1, stage: 'documents' }));

    expect(loadGame(localStorage)).toEqual({
      kind: 'corrupt',
      message: '当前存档已损坏，且没有可恢复的有效关卡快照。',
    });
  });

  it('restores a valid stage snapshot', () => {
    const snapshot = createInitialState();
    saveStageSnapshot(localStorage, snapshot);

    expect(restoreStageSnapshot(localStorage)).toEqual({ kind: 'ok', state: snapshot });
  });

  it('returns empty when no stage snapshot exists', () => {
    expect(restoreStageSnapshot(localStorage)).toEqual({ kind: 'empty' });
  });

  it('reports a malformed stage snapshot as corrupt', () => {
    localStorage.setItem(SNAPSHOT_KEY, '{broken');

    expect(restoreStageSnapshot(localStorage)).toEqual({
      kind: 'corrupt',
      message: '关卡快照已损坏，无法恢复。',
    });
  });

  it('does not overwrite either raw save while attempting recovery', () => {
    const damagedCurrent = '{broken current';
    const damagedSnapshot = '{broken snapshot';
    localStorage.setItem(CURRENT_KEY, damagedCurrent);
    localStorage.setItem(SNAPSHOT_KEY, damagedSnapshot);

    loadGame(localStorage);

    expect(localStorage.getItem(CURRENT_KEY)).toBe(damagedCurrent);
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBe(damagedSnapshot);
  });
});
