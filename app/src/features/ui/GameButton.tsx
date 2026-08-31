import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { AudioCueId } from '../audio/audioCues';
import { GameButton as V09GameButton, type GameButtonVariant as V09Variant } from '../../ui/primitives/GameButton';

export type GameButtonVariant = 'command' | 'secondary' | 'quiet' | 'danger' | 'locked';
interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant; audioCue?: AudioCueId; eyebrow?: string; icon?: ReactNode; mark?: ReactNode; lockedReason?: string;
}
const variantMap: Record<GameButtonVariant,V09Variant> = { command:'primary', secondary:'secondary', quiet:'ghost', danger:'danger', locked:'evidence' };
export function GameButton({ variant='secondary', audioCue, eyebrow, icon, mark, lockedReason, className='', children, disabled, ...props }: GameButtonProps) {
  const locked=variant==='locked'||Boolean(lockedReason);
  return <V09GameButton {...props} disabled={disabled||locked} audioCue={audioCue} variant={variantMap[variant]} size="md" hint={lockedReason ?? props.title} className={`legacy-v09-button ${className}`.trim()} icon={icon}>
    <span className="legacy-v09-button__copy">{eyebrow?<small>{eyebrow}</small>:null}<strong>{children}</strong>{lockedReason?<em>{lockedReason}</em>:null}</span>{mark?<span className="legacy-v09-button__mark" aria-hidden="true">{mark}</span>:null}
  </V09GameButton>;
}
