import { useEffect, type ReactNode } from 'react';
import './primitives.css';
export function GameSheet({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="v09-sheet-layer" role="dialog" aria-modal="true" aria-label={title}><button className="v09-sheet-layer__backdrop" aria-label="关闭" onClick={onClose} /><section className="v09-sheet"><header><h2>{title}</h2><button className="v09-sheet__close" onClick={onClose} aria-label="关闭">×</button></header><div className="v09-sheet__content">{children}</div>{footer ? <footer>{footer}</footer> : null}</section></div>;
}
