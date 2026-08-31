import { useEffect } from 'react';
import { useGameAudio } from '../audio/GameAudio';
import { useGame } from '../../app/GameProvider';
import type { GameSceneId } from '../../game/scenes';
import type { DialogueBeat, StorySceneData } from '../../game/storyTypes';
import { GameButton } from '../ui/GameButton';
import { DialogueCharacterCard } from './DialogueCharacterCard';
import { dialogueCharacterFor } from './dialogueCharacters';

interface DialogueSceneProps {
  beatIndex: number;
  onBeatChange: (nextBeatIndex: number) => void;
  onComplete: (nextSceneId: GameSceneId) => void;
  onPresentationEvent?: (eventId: string) => void;
  scene: StorySceneData;
}

function dialogueAt(scene: StorySceneData, index: number): DialogueBeat | undefined {
  const beat = scene.beats[index];
  return beat?.type === 'dialogue' ? beat : undefined;
}

export function DialogueScene({ beatIndex, onBeatChange, onComplete, onPresentationEvent, scene }: DialogueSceneProps) {
  const { dispatch } = useGame();
  const { speak, stopVoice } = useGameAudio();
  const currentBeat = scene.beats[beatIndex];
  const beat = dialogueAt(scene, beatIndex);
  const character = dialogueCharacterFor(beat?.speakerId);

  useEffect(() => {
    if (!beat) return;
    if (beat.voiceId && character) speak(beat.text, character.persona);
    return stopVoice;
  }, [beat?.id, beat?.text, beat?.voiceId, character?.id, character?.persona, speak, stopVoice]);

  useEffect(() => {
    if (currentBeat?.type === 'state-event') {
      onPresentationEvent?.(currentBeat.eventId);
      onBeatChange(beatIndex + 1);
    }
  }, [beatIndex, currentBeat, onBeatChange, onPresentationEvent]);

  function finishDialogue() {
    dispatch({ type: 'READ_DOCUMENT', documentId: 'statement-zhao' });
    dispatch({ type: 'EXTRACT_CLAIM', claimId: 'claim-zhao-denial' });
    dispatch({ type: 'SET_TUTORIAL_STEP', step: 'investigateHandwriting' });
    onComplete(scene.nextSceneId ?? 'investigation');
  }

  function advance() {
    let nextIndex = beatIndex + 1;
    while (scene.beats[nextIndex]?.type === 'state-event') {
      const eventBeat = scene.beats[nextIndex];
      if (eventBeat.type === 'state-event') onPresentationEvent?.(eventBeat.eventId);
      nextIndex += 1;
    }
    if (nextIndex >= scene.beats.length) return finishDialogue();
    onBeatChange(nextIndex);
  }

  if (!beat) return null;

  const isLastDialogue = !dialogueAt(scene, beatIndex + 1);
  const evidenceLabel = beat.id.includes('follow-up') ? '当前目标：核验赵简是否真的不知道集合时辰' : undefined;

  return (
    <main className="v08-dialogue-scene" aria-labelledby="dialogue-scene-title" data-beat={beat.id}>
      <div className="v08-dialogue-scene__tent" aria-hidden="true" />
      <header className="v08-dialogue-scene__heading">
        <div><p className="scene-kicker">中军偏帐 · 初问</p><h1 id="dialogue-scene-title">赵简入帐</h1></div>
        <p>人物每一次开口都是独立镜头；观察语气、状态与他回避的信息。</p>
      </header>

      <section className="v08-dialogue-stage" data-side={character?.side ?? 'center'}>
        {character ? (
          <DialogueCharacterCard key={beat.id} character={character} line={beat.text} evidenceLabel={evidenceLabel} />
        ) : (
          <article className="v08-narration-card">
            <small>案中记</small><p>{beat.text}</p>
          </article>
        )}
      </section>

      <footer className="v08-dialogue-actions">
        <span>{String(beatIndex + 1).padStart(2, '0')} / {String(scene.beats.length).padStart(2, '0')}</span>
        <GameButton variant="command" audioCue="ui-confirm" onClick={advance} mark="›">
          {isLastDialogue ? '去文书房核验' : '听下一句'}
        </GameButton>
      </footer>
    </main>
  );
}
