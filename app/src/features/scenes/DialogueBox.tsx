import type { ReactNode } from 'react';
import { GameButton } from '../ui/GameButton';

export interface DialogueSpeaker { name: string; role?: string; }
interface DialogueBoxProps {
  dialogueId: string;
  speaker?: DialogueSpeaker;
  text: string;
  onContinue?: () => void;
  continueLabel?: string;
  children?: ReactNode;
}

export function DialogueBox({ dialogueId, speaker, text, onContinue, continueLabel = '继续', children }: DialogueBoxProps) {
  const speakerId = `${dialogueId}-speaker`;
  return (
    <section className="dialogue-box" aria-labelledby={speaker ? speakerId : undefined}>
      {speaker && <header className="dialogue-box__speaker" id={speakerId}><strong>{speaker.name}</strong>{speaker.role && <span>{speaker.role}</span>}</header>}
      <p className="dialogue-box__text" aria-live="polite" aria-atomic="true">{text}</p>
      <div className="dialogue-box__actions">
        {children}
        {onContinue && <GameButton variant="command" audioCue="ui-confirm" onClick={onContinue} mark="›">{continueLabel}</GameButton>}
      </div>
    </section>
  );
}
