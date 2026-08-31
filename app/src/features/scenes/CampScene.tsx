import { useEffect } from 'react';
import type { DialogueBeat, StorySceneData } from '../../game/storyTypes';
import { useGameAudio } from '../audio/GameAudio';
import { ChoiceStrip } from '../ui/ChoiceStrip';
import { GameButton } from '../ui/GameButton';
import { DialogueCharacterCard } from './DialogueCharacterCard';
import { dialogueCharacterFor } from './dialogueCharacters';

interface CampSceneProps {
  beatIndex: number;
  onBeatChange: (nextBeatIndex: number) => void;
  onComplete: (nextSceneId: StorySceneData['nextSceneId']) => void;
  onPresentationEvent?: (eventId: string) => void;
  scene: StorySceneData;
}

function findObjective(scene: StorySceneData): DialogueBeat | undefined {
  const objective = scene.beats.find((beat) => beat.id === 'camp-investigation-order');
  return objective?.type === 'dialogue' ? objective : undefined;
}

export function CampScene({ beatIndex, onBeatChange, onComplete, onPresentationEvent, scene }: CampSceneProps) {
  const { play } = useGameAudio();
  const currentBeat = scene.beats[beatIndex];
  useEffect(() => { play('tent-enter'); }, [play, scene.id]);
  const objective = findObjective(scene);

  const advanceTo = (requestedIndex: number) => {
    let nextIndex = requestedIndex;
    while (scene.beats[nextIndex]?.type === 'state-event') {
      const eventBeat = scene.beats[nextIndex];
      if (eventBeat.type === 'state-event') onPresentationEvent?.(eventBeat.eventId);
      nextIndex += 1;
    }
    if (nextIndex >= scene.beats.length) {
      onComplete(scene.nextSceneId);
      return;
    }
    onBeatChange(nextIndex);
  };

  const choose = (nextBeatId?: string) => {
    const nextIndex = nextBeatId ? scene.beats.findIndex((beat) => beat.id === nextBeatId) : -1;
    advanceTo(nextIndex >= 0 ? nextIndex : beatIndex + 1);
  };

  const expressionId = currentBeat && 'characterExpressionId' in currentBeat ? currentBeat.characterExpressionId : undefined;
  const mood = expressionId?.includes('thinking') ? 'thinking' : expressionId?.includes('guarded') ? 'guarded' : 'neutral';

  return (
    <main className="camp-scene" aria-labelledby="camp-scene-title" data-scene-id={scene.id}>
      <div className="camp-scene__backdrop" aria-hidden="true">
        <div className="camp-scene__canopy" />
        <div className="camp-scene__map" />
        <div className="camp-scene__screen" />
        <div className="camp-scene__brazier"><i /><i /><i /></div>
        <div className="camp-scene__table"><span /><span /><span /></div>
      </div>
      <header className="camp-scene__heading">
        <p className="scene-kicker">官渡中军 · 辰初</p>
        <h1 id="camp-scene-title">军帐议事</h1>
        <p>第三次伏击后，完整军令却仍封在中军。</p>
      </header>
      {currentBeat?.type === 'dialogue' && (
        <div className="camp-scene__dialogue camp-scene__dialogue--card">
          {currentBeat.speakerId && dialogueCharacterFor(currentBeat.speakerId) ? (
            <DialogueCharacterCard key={currentBeat.id} character={dialogueCharacterFor(currentBeat.speakerId)!} mood={mood} line={currentBeat.text} />
          ) : (
            <article className="v08-narration-card"><small>军帐记</small><p>{currentBeat.text}</p></article>
          )}
          <GameButton variant="command" audioCue="ui-confirm" mark="›" onClick={() => advanceTo(beatIndex + 1)}>
            {currentBeat.id === objective?.id ? '领命查案' : '听下一句'}
          </GameButton>
        </div>
      )}

      {currentBeat?.type === 'choice' && (
        <section className="camp-choice" aria-labelledby="camp-choice-title" aria-live="polite">
          <p className="scene-kicker">你的判断</p>
          <h2 id="camp-choice-title">这场伏击意味着什么？</h2>
          <p>两种切入角度都会推进调查，但会改变你理解案件的顺序。</p>
          <div className="camp-choice__options">
            <ChoiceStrip options={currentBeat.choices.map((choice) => ({ id: choice.id, tag: '判断', text: choice.text }))} onChoose={(id) => { const choice = currentBeat.choices.find((item) => item.id === id); choose(choice?.nextBeatId); }} />
          </div>
        </section>
      )}

      {currentBeat?.id === objective?.id && objective && (
        <aside className="objective-slip" aria-labelledby="objective-title">
          <span className="objective-slip__pin" aria-hidden="true" />
          <p id="objective-title">中军手令</p>
          <strong>{objective.text}</strong>
        </aside>
      )}
    </main>
  );
}
