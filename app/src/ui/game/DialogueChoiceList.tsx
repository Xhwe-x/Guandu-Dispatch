import { GameTooltip } from '../primitives/GameTooltip';
export interface DialogueChoice { id:string; tag?:string; text:string; detail?:string; disabled?:boolean; lockedReason?:string; danger?:boolean; }
export function DialogueChoiceList({ choices,onChoose,ariaLabel='对话选择' }: { choices:DialogueChoice[]; onChoose:(id:string)=>void; ariaLabel?:string }){
  return <div className="v09-choice-list" role="group" aria-label={ariaLabel}>{choices.slice(0,4).map(choice=>{
    const button=<button type="button" disabled={choice.disabled||Boolean(choice.lockedReason)} data-danger={choice.danger||undefined} data-audio-cue="ui-confirm" onClick={()=>onChoose(choice.id)}><span>{choice.tag?<small>{choice.tag}</small>:null}<strong>{choice.text}</strong></span>{choice.detail&&!choice.lockedReason?<em>{choice.detail}</em>:null}</button>;
    return choice.lockedReason?<GameTooltip key={choice.id} label={choice.lockedReason}>{button}</GameTooltip>:<span className="v09-choice-list__item" key={choice.id}>{button}</span>;
  })}</div>;
}
