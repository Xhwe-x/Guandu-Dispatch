import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { AudioCueId } from '../audio/audioCues';
import { GameButton } from '../../ui/primitives/GameButton';
interface GameIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { icon: ReactNode; label: string; audioCue?: AudioCueId; }
export function GameIconButton({ icon,label,audioCue='ui-click',className='',...props }:GameIconButtonProps){
  return <GameButton {...props} variant="ghost" size="icon" audioCue={audioCue} className={className} icon={icon} aria-label={label} title={label}><span className="sr-only">{label}</span></GameButton>;
}
