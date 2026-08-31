import { describe, expect, it } from 'vitest';
import type { GameSceneId } from '../../game/scenes';
import type {
  DialogueBeat,
  PresentationAssetIds,
  StateEventBeat,
  StoryBeat,
} from '../../game/storyTypes';
import { guanduStoryScenes } from './story';

const requiredGameSceneIds = [
  'title',
  'opening',
  'first-evidence',
  'first-deduction',
  'story',
  'camp',
  'document',
  'investigation',
  'dialogue',
  'interrogation',
  'deduction',
  'case-summary',
  'audience',
  'network-investigation',
  'network-deduction',
  'bait',
  'enemy-report',
  'final-report',
  'ending',
] as const satisfies readonly GameSceneId[];

function isDialogueBeat(beat: StoryBeat): beat is DialogueBeat {
  return beat.type === 'dialogue';
}

function isStateEventBeat(beat: StoryBeat): beat is StateEventBeat {
  return beat.type === 'state-event';
}

function collectAssetIds(assets: PresentationAssetIds): string[] {
  return [
    assets.backgroundId,
    assets.cgId,
    assets.characterExpressionId,
    assets.voiceId,
    assets.bgmId,
    assets.ambienceId,
    assets.sfxId,
  ].filter((id): id is string => id !== undefined);
}

describe('v0.9 story contracts', () => {
  it('provides the stable v0.9 opening chain and keeps legacy save entries last', () => {
    expect(guanduStoryScenes.map(({ id, sceneId, nextSceneId }) => ({ id, sceneId, nextSceneId }))).toEqual([
      { id: 'prologue-background', sceneId: 'opening', nextSceneId: undefined },
      { id: 'player-identity', sceneId: 'opening', nextSceneId: undefined },
      { id: 'basic-onboarding', sceneId: 'opening', nextSceneId: undefined },
      { id: 'zhao-first-intro', sceneId: 'opening', nextSceneId: undefined },
      { id: 'zhao-first-dialogue', sceneId: 'opening', nextSceneId: 'first-evidence' },
      { id: 'intro-cg', sceneId: 'story', nextSceneId: 'opening' },
      { id: 'camp-brief', sceneId: 'camp', nextSceneId: 'opening' },
      { id: 'zhao-introduction', sceneId: 'dialogue', nextSceneId: 'first-evidence' },
      { id: 'case-summary', sceneId: 'case-summary', nextSceneId: undefined },
    ]);

    const gameSceneIds = new Set<string>(requiredGameSceneIds);
    for (const scene of guanduStoryScenes) {
      expect(gameSceneIds.has(scene.sceneId), scene.id).toBe(true);
      if (scene.nextSceneId !== undefined) {
        expect(gameSceneIds.has(scene.nextSceneId), scene.id).toBe(true);
      }
    }
  });

  it('links each story continuation to one unique existing story scene', () => {
    const sceneIds = guanduStoryScenes.map((scene) => scene.id);
    expect(new Set(sceneIds).size).toBe(sceneIds.length);
    expect(guanduStoryScenes.map(({ id, nextStorySceneId }) => ({ id, nextStorySceneId }))).toEqual([
      { id: 'prologue-background', nextStorySceneId: 'player-identity' },
      { id: 'player-identity', nextStorySceneId: 'basic-onboarding' },
      { id: 'basic-onboarding', nextStorySceneId: 'zhao-first-intro' },
      { id: 'zhao-first-intro', nextStorySceneId: 'zhao-first-dialogue' },
      { id: 'zhao-first-dialogue', nextStorySceneId: undefined },
      { id: 'intro-cg', nextStorySceneId: 'prologue-background' },
      { id: 'camp-brief', nextStorySceneId: 'prologue-background' },
      { id: 'zhao-introduction', nextStorySceneId: undefined },
      { id: 'case-summary', nextStorySceneId: undefined },
    ]);

    const knownSceneIds = new Set(sceneIds);
    for (const scene of guanduStoryScenes) {
      if (scene.nextStorySceneId !== undefined) {
        expect(knownSceneIds.has(scene.nextStorySceneId), scene.id).toBe(true);
      }
    }
  });

  it('keeps the concrete opening script and player-facing text in content data', () => {
    const prologue = guanduStoryScenes.find((scene) => scene.id === 'prologue-background')!;
    expect(prologue.beats.map((beat) => beat.id)).toEqual([
      'bg-guan-du',
      'bg-three-raids',
      'bg-leak',
      'bg-assignment',
    ]);
    expect(prologue.beats.map((beat) => beat.text).join('\n')).toMatch(
      /建安五年[\s\S]*粮道三遭袭扰[\s\S]*军机正在从营中流出[\s\S]*敌军究竟从哪里得到消息/u,
    );

    const identity = guanduStoryScenes.find((scene) => scene.id === 'player-identity')!;
    const identityBeat = identity.beats.find((beat) => beat.id === 'identity-card')!;
    expect(identityBeat.actionId).toBe('accept-case');

    const onboarding = guanduStoryScenes.find((scene) => scene.id === 'basic-onboarding')!;
    expect(onboarding.beats.map((beat) => beat.id)).toEqual([
      'tutorial-report',
      'tutorial-report-note',
      'tutorial-dossier-open',
    ]);

    const intro = guanduStoryScenes.find((scene) => scene.id === 'zhao-first-intro')!;
    expect(intro.beats.map((beat) => beat.id)).toEqual(['zhao-reveal']);

    const dialogue = guanduStoryScenes.find((scene) => scene.id === 'zhao-first-dialogue')!;
    expect(dialogue.beats.filter(isDialogueBeat).map((beat) => beat.speakerId)).toEqual(['zhao', 'officer', 'zhao']);
    expect(dialogue.beats.filter(isDialogueBeat).map((beat) => beat.text).join('\n')).toMatch(
      /照令誊写[\s\S]*并不知道粮队真正出发的时辰/u,
    );

    // Legacy entries stay available for old v0.8.x saves.
    const legacySummary = guanduStoryScenes.find((scene) => scene.id === 'case-summary')!;
    expect(legacySummary.beats.filter(isDialogueBeat).map((beat) => beat.text)).toContain(
      '第一条矛盾已立 / 第二折：四匣并查',
    );
  });

  it('uses replaceable asset IDs and presentation-only replay-safe state events', () => {
    const assetIds = guanduStoryScenes.flatMap((scene) => [
      ...collectAssetIds(scene),
      ...scene.beats.flatMap((beat) => collectAssetIds(beat)),
    ]);
    expect(assetIds).toEqual(expect.arrayContaining([
      'cg_intro_ambush',
      'cg_evidence_desk',
      'voice_zhao_intro',
    ]));
    expect(assetIds.every((id) => !id.includes('://'))).toBe(true);

    const stateEvents = guanduStoryScenes.flatMap((scene) => scene.beats.filter(isStateEventBeat));
    expect(stateEvents.every((beat) => beat.scope === 'presentation')).toBe(true);
    expect(stateEvents.every((beat) => beat.replay === 'always' || beat.replay === 'once')).toBe(true);
  });
});
