import type { ReactNode } from 'react';
import { GameSheet } from '../primitives/GameSheet';
export function DossierSheet({ open, onClose, children }: { open:boolean; onClose:()=>void; children:ReactNode }) {
  return <GameSheet open={open} title="第一案 · 粮道泄密" onClose={onClose}>{children}</GameSheet>;
}
