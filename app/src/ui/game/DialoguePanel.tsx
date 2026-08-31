import { CharacterPortrait } from '../../features/scenes/CharacterPortrait';
import { GameButton } from '../primitives/GameButton';
import { GameBadge } from '../primitives/GameBadge';
import { BlurFade } from '../motion/BlurFade';
export function DialoguePanel({ speakerId, name, role, text, mood='平静', onContinue, actionLabel='继续' }: { speakerId:string; name:string; role?:string; text:string; mood?:string; onContinue:()=>void; actionLabel?:string }) {
  return <BlurFade keyId={`${speakerId}-${text}`} className="v09-dialogue-panel"><section className="v09-dialogue-panel__stage"><div className="v09-dialogue-panel__portrait"><CharacterPortrait character={speakerId} mood={mood === '戒备' ? 'guarded' : 'neutral'} label={name} /></div><div className="v09-dialogue-panel__copy"><header><div><strong>{name}</strong>{role?<span>{role}</span>:null}</div><GameBadge>{mood}</GameBadge></header><p>“{text}”</p><footer><GameButton variant="secondary" size="md" audioCue="ui-confirm" onClick={onContinue}>{actionLabel} →</GameButton></footer></div></section></BlurFade>;
}
