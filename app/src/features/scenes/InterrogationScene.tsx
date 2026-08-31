import { useState, type FormEvent } from 'react';
import { useGame } from '../../app/GameProvider';
import type { InterrogationTone } from '../../game/domain';
import { resolveEvidenceReaction } from '../../game/rules/evidenceReaction';
import { syncObjectivesUntilStable } from '../../game/rules/knowledge';
import { guanduObjectives } from '../../content/guandu/coreLoop';
import type { GameSceneId } from '../../game/scenes';
import { CharacterPortrait } from './CharacterPortrait';
import { useGameAudio } from '../audio/GameAudio';
import { GameButton } from '../../ui/primitives/GameButton';
import { GameBadge } from '../../ui/primitives/GameBadge';

interface InterrogationSceneProps { onComplete: (nextSceneId: GameSceneId) => void; }
const zhaoId='zhao'; const statementClaimId='claim-zhao-denial'; const correctEvidenceId='claim-zhao-copied-order'; const wrongEvidenceId='claim-zhao-denial';
type Mode='calm'|'empathize'|'threaten';
const actions:{id:Mode;label:string;description:string; tone:InterrogationTone}[]=[
  {id:'calm',label:'平声询问',description:'不预设罪名，只要求他解释证据。',tone:'calm'},
  {id:'empathize',label:'缓言追问',description:'降低戒备，再问隐瞒的原因。',tone:'empathize'},
  {id:'threaten',label:'严词质问',description:'语气更强，但证据仍决定能否突破。',tone:'threaten'},
];
export function InterrogationScene({ onComplete }: InterrogationSceneProps){
  const {content,dispatch,state}=useGame(); const {speak}=useGameAudio(); const saved=state.presentation.interrogation;
  const [mode,setMode]=useState<Mode>('calm'); const [message,setMessage]=useState(''); const breakthrough=state.coreLoop.knowledge['claim-zhao-time']?.status==='supported'||state.coreLoop.knowledge['claim-zhao-time']?.status==='verified';
  const personState=state.personStates[zhaoId]??'cooperative'; const statement=content.claims.find(c=>c.id===statementClaimId); const evidence=[wrongEvidenceId,correctEvidenceId].map(id=>content.claims.find(c=>c.id===id)).filter((x):x is NonNullable<typeof x>=>Boolean(x));
  function chooseMode(next:Mode){setMode(next); const tone=actions.find(a=>a.id===next)!.tone; dispatch({type:'SET_INTERROGATION_SELECTION',evidenceClaimId:saved.evidenceClaimId,tone});}
  function chooseEvidence(id:string){dispatch({type:'SET_INTERROGATION_SELECTION',evidenceClaimId:id,tone:saved.tone});}
  function submit(event:FormEvent){
    event.preventDefault();
    const result=resolveEvidenceReaction(content,state,zhaoId,saved.evidenceClaimId,Date.now());
    const next=syncObjectivesUntilStable(result.state,guanduObjectives);
    dispatch({type:'APPLY_RULE_STATE',state:next});
    dispatch({type:'RECORD_INTERROGATION_ATTEMPT'});
    setMessage(result.response);
    if(result.reaction==='breakthrough'){
      dispatch({type:'RECORD_DIALOGUE',entry:{id:`zhao-breakthrough-${saved.attempts}-${saved.evidenceClaimId}`,speakerId:'zhao',speakerName:'赵简',text:result.response}});
      dispatch({type:'SET_TUTORIAL_STEP',step:'placeContradiction'});
      speak('属下认。时辰是我泄出去的。','zhao');
    }else if(result.reaction==='irrelevant'){
      speak('此物与军书房何干？','zhao');
    }else{
      speak('这份材料，还说明不了你说的事。','zhao');
    }
  }
  const mood=breakthrough?'动摇':personState==='hostile'?'拒绝':'戒备';
  return <main className="v09-interrogation" aria-label="再问赵简" aria-labelledby="v09-zhao-name"><section className="v09-interrogation__stage"><div className="v09-interrogation__portrait"><CharacterPortrait character="zhao" mood={breakthrough?'pressured':personState==='hostile'?'guarded':'denial'} label="赵简"/></div><div className="v09-interrogation__dialogue"><header><div><h1 id="v09-zhao-name">赵简</h1><span>军书佐</span></div><GameBadge>{mood}</GameBadge></header><p>“{breakthrough?'属下……愿意把知道的都说清楚。':statement?.text??'属下并不知道最终集合时辰。'}”</p><small>已知矛盾：口供 ↔ 集合记录</small></div></section><form className="v09-interrogation__console" onSubmit={submit}><div className="v09-interrogation__actions" role="radiogroup" aria-label="问询策略">{actions.map(action=><GameButton key={action.id} type="button" role="radio" aria-checked={mode===action.id} aria-pressed={mode===action.id} variant={mode===action.id?'secondary':'ghost'} size="lg" className="v09-interrogation__strategy" onClick={()=>chooseMode(action.id)}><span><strong>{action.label}</strong><small>{action.description}</small></span></GameButton>)}</div><section className="v09-interrogation__evidence"><header><strong>出示证据</strong><span>证据决定能否突破；问法只影响对话气氛</span></header><div>{evidence.map(claim=><GameButton key={claim.id} type="button" variant={saved.evidenceClaimId===claim.id?'evidence':'secondary'} size="lg" className="v09-interrogation__evidence-choice" disabled={!state.extractedClaimIds.includes(claim.id)} aria-pressed={saved.evidenceClaimId===claim.id} onClick={()=>chooseEvidence(claim.id)}><span><small>{claim.id===correctEvidenceId?'集合誊本':'赵简口供'}</small><strong>{claim.text}</strong></span></GameButton>)}</div></section><p className="v09-interrogation__result" role="status">{message||'选择问法，再从已掌握材料中出示一份证据。错误证据不会锁死问询。'}</p><footer>{breakthrough?<GameButton variant="primary" size="lg" audioCue="deduction-link" type="button" onClick={()=>onComplete('case-summary')}>完成本轮问询</GameButton>:<GameButton variant="primary" size="lg" audioCue="ui-confirm" type="submit" disabled={!state.extractedClaimIds.includes(saved.evidenceClaimId)}>出示所选证据</GameButton>}</footer></form></main>;
}
