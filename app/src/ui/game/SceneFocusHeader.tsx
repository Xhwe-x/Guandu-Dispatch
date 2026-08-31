import type { ReactNode } from 'react';
import './game.css';

export function SceneFocusHeader({
  eyebrow,
  title,
  description,
  status,
  id,
}: {
  eyebrow: string;
  title: string;
  description: string;
  status?: ReactNode;
  id?: string;
}) {
  return (
    <header className="v093-scene-focus">
      <div className="v093-scene-focus__copy">
        <small>{eyebrow}</small>
        <h1 id={id}>{title}</h1>
        <p>{description}</p>
      </div>
      {status ? <aside className="v093-scene-focus__status">{status}</aside> : null}
    </header>
  );
}
