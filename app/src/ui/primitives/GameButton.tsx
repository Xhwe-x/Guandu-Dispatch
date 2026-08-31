import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { AudioCueId } from '../../features/audio/audioCues';
import './primitives.css';

export type GameButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'evidence' | 'command';
export type GameButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant;
  size?: GameButtonSize;
  audioCue?: AudioCueId;
  icon?: ReactNode;
  hint?: string;
  lockedReason?: string;
  mark?: ReactNode;
}

export function GameButton({
  variant = 'secondary', size = 'md', audioCue, icon, hint, lockedReason, mark, className = '', children, ...props
}: GameButtonProps) {
  return (
    <button
      {...props}
      data-audio-cue={audioCue}
      data-variant={variant}
      data-size={size}
      className={`v09-button v09-button--${variant} v09-button--${size} ${className}`.trim()}
      title={lockedReason ?? hint ?? props.title}
    >
      {icon ? <span className="v09-button__icon" aria-hidden="true">{icon}</span> : null}
      {size === 'icon' ? children : <span>{children}</span>}
      {mark ? <span className="v09-button__mark" aria-hidden="true">{mark}</span> : null}
    </button>
  );
}
