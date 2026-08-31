import type { ReactNode } from 'react';
import { GameButton } from '../primitives/GameButton';
import './game.css';

export function SceneHeader({ title, chapter, onBack, right }: { title: string; chapter?: string; onBack?: () => void; right?: ReactNode }) {
  return <header className="scene-header"><div className="scene-header__inner"><div className="scene-header__left">{onBack ? <GameButton variant="ghost" size="icon" onClick={onBack} aria-label="返回">←</GameButton> : null}<div className="scene-header__title">{chapter ? <span>{chapter}</span> : null}<strong>{title}</strong></div></div><nav className="scene-header__right">{right}</nav></div></header>;
}
