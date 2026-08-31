import { useEffect, type ReactNode } from 'react';
import { GameButton } from './GameButton';
export function GameDialog({ open,title,description,onClose,children,footer }: { open:boolean; title:string; description?:string; onClose:()=>void; children:ReactNode; footer?:ReactNode }){
  useEffect(()=>{if(!open)return; const fn=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()}; window.addEventListener('keydown',fn); return()=>window.removeEventListener('keydown',fn)},[open,onClose]);
  if(!open)return null;
  return <div className="v09-dialog-layer"><button className="v09-dialog-layer__backdrop" aria-label="关闭" onClick={onClose}/><section className="v09-dialog" role="dialog" aria-modal="true" aria-labelledby="v09-dialog-title"><header><div><h2 id="v09-dialog-title">{title}</h2>{description?<p>{description}</p>:null}</div><GameButton variant="ghost" size="icon" aria-label="关闭" onClick={onClose}>×</GameButton></header><div className="v09-dialog__content">{children}</div>{footer?<footer>{footer}</footer>:null}</section></div>;
}
