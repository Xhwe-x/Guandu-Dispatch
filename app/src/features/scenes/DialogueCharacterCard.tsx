import { useEffect } from 'react';
import { CharacterPortrait } from './CharacterPortrait';
import type { DialogueCharacterPresentation, DialogueMood } from './dialogueCharacters';
import { useGameAudio } from '../audio/GameAudio';

const moodLabels: Record<DialogueMood, string> = {
  neutral: '平静', thinking: '审视', guarded: '戒备', denial: '回避', pressured: '动摇', resolved: '定论',
};

interface DialogueCharacterCardProps {
  character: DialogueCharacterPresentation;
  mood?: DialogueMood;
  active?: boolean;
  line?: string;
  evidenceLabel?: string;
}

export function DialogueCharacterCard({ character, mood, active = true, line, evidenceLabel }: DialogueCharacterCardProps) {
  const { play } = useGameAudio();
  useEffect(() => { play(character.entryCue); }, [character.id, character.entryCue, play]);
  const resolvedMood = mood ?? character.defaultMood;
  return (
    <article className={`dialogue-character-card dialogue-character-card--${character.side}`} data-active={active} data-character={character.id}>
      <div className="dialogue-character-card__halo" aria-hidden="true" />
      <CharacterPortrait character={character.portrait} mood={resolvedMood} label={character.name} />
      <header className="dialogue-character-card__identity">
        <small>{character.role}</small>
        <h2>{character.name}</h2>
        <span className="dialogue-character-card__mood" data-mood={resolvedMood}>{moodLabels[resolvedMood]}</span>
      </header>
      {line && <blockquote><p>{line}</p></blockquote>}
      {evidenceLabel && <span className="dialogue-character-card__evidence">证据 · {evidenceLabel}</span>}
    </article>
  );
}
