import { CharacterPortrait } from '../../features/scenes/CharacterPortrait';
import { GameButton } from '../primitives/GameButton';
import { BlurFade } from '../motion/BlurFade';
export function CharacterIntro({ characterId, title, subtitle, description, onContinue, actionLabel='继续' }: { characterId:string; title:string; subtitle:string; description:string; onContinue:()=>void; actionLabel?:string }) {
  return <BlurFade keyId={characterId} className="v09-character-intro"><section><div className="v09-character-intro__portrait"><CharacterPortrait character={characterId} mood="neutral" label={title} /></div><div className="v09-character-intro__copy"><span>人物</span><h1>{title}</h1><p className="v09-character-intro__role">{subtitle}</p><p>{description}</p><GameButton variant="primary" size="lg" audioCue="character-enter" onClick={onContinue}>{actionLabel}</GameButton></div></section></BlurFade>;
}
