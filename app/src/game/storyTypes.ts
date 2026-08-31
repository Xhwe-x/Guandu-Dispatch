import type { GameSceneId } from './scenes';

export interface PresentationAssetIds {
  readonly backgroundId?: string;
  readonly cgId?: string;
  readonly characterExpressionId?: string;
  readonly voiceId?: string;
  readonly bgmId?: string;
  readonly ambienceId?: string;
  readonly sfxId?: string;
}

interface BeatBase extends PresentationAssetIds {
  readonly id: string;
  readonly text?: string;
  readonly actionLabel?: string;
  readonly actionId?: string;
}

export interface NarrationBeat extends BeatBase {
  readonly type: 'narration';
  readonly text: string;
  readonly camera?: 'wide' | 'medium' | 'close';
}

export interface CharacterIntroBeat extends BeatBase {
  readonly type: 'character-intro';
  readonly speakerId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly portraitVariant?: string;
}

export interface DialogueBeat extends BeatBase {
  readonly type: 'dialogue';
  readonly speakerId?: string;
  readonly text: string;
  readonly position?: 'left' | 'center' | 'right';
  readonly portraitVariant?: string;
  readonly camera?: 'wide' | 'medium' | 'close';
}

export interface TutorialBeat extends BeatBase {
  readonly type: 'tutorial';
  readonly title: string;
  readonly text: string;
  readonly steps?: readonly string[];
}

export interface TransitionBeat extends BeatBase {
  readonly type: 'transition';
  readonly text?: string;
}

export interface EvidenceBeat extends BeatBase {
  readonly type: 'evidence';
  readonly evidenceIds: readonly string[];
}

export interface DeductionBeat extends BeatBase {
  readonly type: 'deduction';
  readonly fromId: string;
  readonly toId: string;
}

export interface StoryChoice {
  readonly id: string;
  readonly text: string;
  readonly nextBeatId?: string;
}

export interface ChoiceBeat extends BeatBase {
  readonly type: 'choice';
  readonly choices: readonly StoryChoice[];
}

export interface StateEventBeat extends BeatBase {
  readonly type: 'state-event';
  readonly eventId: string;
  readonly scope: 'presentation';
  readonly replay: 'once' | 'always';
}

export type StoryBeat = NarrationBeat | CharacterIntroBeat | DialogueBeat | TutorialBeat | TransitionBeat | EvidenceBeat | DeductionBeat | ChoiceBeat | StateEventBeat;

export interface StorySceneData extends PresentationAssetIds {
  readonly id: string;
  readonly sceneId: GameSceneId;
  readonly beats: readonly StoryBeat[];
  readonly nextSceneId?: GameSceneId;
  readonly nextStorySceneId?: string;
}
