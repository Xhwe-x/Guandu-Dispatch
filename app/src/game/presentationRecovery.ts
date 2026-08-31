import { guanduStoryScenes } from '../content/guandu/story';
import type { PresentationSnapshot, PresentationState } from './domain';
import type { GameSceneId } from './scenes';

export const V09_STORY_SCENE_IDS = new Set([
  'prologue-background',
  'player-identity',
  'basic-onboarding',
  'zhao-first-intro',
  'zhao-first-dialogue',
]);

const requiredStoryScene: Partial<Record<GameSceneId, string>> = {
  opening: 'prologue-background',
  story: 'intro-cg',
  camp: 'camp-brief',
  dialogue: 'zhao-introduction',
};

export function storyBeatId(storySceneId: string, beatIndex: number): string | undefined {
  return guanduStoryScenes.find((candidate) => candidate.id === storySceneId)?.beats[beatIndex]?.id;
}

export function snapshotPresentation(presentation: PresentationState): PresentationSnapshot {
  return {
    sceneId: presentation.sceneId,
    storySceneId: presentation.storySceneId,
    beatIndex: presentation.beatIndex,
    dialogueNodeId: presentation.dialogueNodeId,
  };
}

export function isStorySceneCompatible(sceneId: GameSceneId, storySceneId: string): boolean {
  const story = guanduStoryScenes.find((candidate) => candidate.id === storySceneId);
  if (sceneId === 'opening') {
    return Boolean(story && story.sceneId === 'opening' && V09_STORY_SCENE_IDS.has(storySceneId));
  }
  const required = requiredStoryScene[sceneId];
  if (!required) return true;
  return Boolean(story && story.sceneId === sceneId);
}

function repairedStoryPosition(sceneId: GameSceneId, storySceneId: string, beatIndex: number) {
  const compatible = isStorySceneCompatible(sceneId, storySceneId);
  const repairedId = compatible ? storySceneId : requiredStoryScene[sceneId] ?? storySceneId;
  const story = guanduStoryScenes.find((candidate) => candidate.id === repairedId);
  const maxBeat = Math.max(0, (story?.beats.length ?? 1) - 1);
  return {
    storySceneId: repairedId,
    beatIndex: Math.max(0, Math.min(beatIndex, maxBeat)),
    dialogueNodeId: story?.beats[Math.max(0, Math.min(beatIndex, maxBeat))]?.id,
  };
}

export function recoverPresentation(presentation: PresentationState): PresentationState {
  const current = repairedStoryPosition(presentation.sceneId, presentation.storySceneId, presentation.beatIndex);
  const sceneHistory = (presentation.sceneHistory ?? []).map((snapshot) => {
    const repaired = repairedStoryPosition(snapshot.sceneId, snapshot.storySceneId, snapshot.beatIndex);
    return { ...snapshot, ...repaired };
  }).slice(-24);

  return {
    ...presentation,
    ...current,
    sceneHistory,
  };
}

export function safePresentationForScene(sceneId: GameSceneId, current: PresentationState): PresentationState {
  return recoverPresentation({ ...current, sceneId });
}
