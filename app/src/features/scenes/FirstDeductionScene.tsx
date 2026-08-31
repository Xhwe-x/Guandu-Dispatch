import { useState } from 'react';
import { useGame } from '../../app/GameProvider';
import type { GameSceneId } from '../../game/scenes';
import { validateRelationship } from '../../game/rules/relationships';
import { GameButton } from '../../ui/primitives/GameButton';
import { GameCard, CardContent } from '../../ui/primitives/GameCard';
import { SceneFocusHeader } from '../../ui/game/SceneFocusHeader';

export function FirstDeductionScene({ onComplete }: { onComplete:(sceneId:GameSceneId)=>void }) {
  const { content, dispatch } = useGame(); const [choice,setChoice]=useState<'supports'|'refutes'|undefined>(); const [message,setMessage]=useState('');
  function submit(){
    if(choice!=='refutes'){setMessage('这两条信息并不能相互印证。再看“是否知晓时辰”这一点。');return;}
    const relationship={fromId:'claim-zhao-copied-order',toId:'claim-zhao-denial',kind:'refutes' as const,slot:'leakedInfo' as const};
    const result=validateRelationship(content,relationship);
    if(!result.ok){setMessage(result.reason);return;}
    dispatch({type:'PLACE_RELATIONSHIP',relationship}); dispatch({type:'SET_TUTORIAL_STEP',step:'interrogateZhao'}); setMessage('推断成立：赵简的口供需要进一步核实。');
  }
  const established=message.startsWith('推断成立');
  return <main className="v09-guided-scene"><section className="v09-guided-scene__body v09-guided-scene__body--narrow"><SceneFocusHeader eyebrow="第一次证据比较 · 步骤 2 / 3" title="这两条信息是什么关系？" description="第一次只给两个选项。之后的推演会逐步开放更多关系类型。" status={<span className="v093-step-counter">2/3</span>} /><GameCard tone="dark" density="compact"><CardContent><div className="v09-deduction-line"><span>赵简：不知道集合时辰</span><b>↔</b><span>集合记录：由赵简誊写</span></div></CardContent></GameCard><div className="v09-deduction-options" role="radiogroup" aria-label="信息关系"><GameButton type="button" role="radio" aria-checked={choice==='supports'} aria-pressed={choice==='supports'} variant={choice==='supports'?'evidence':'secondary'} size="lg" className="v09-deduction-option" onClick={()=>setChoice('supports')}><span><strong>相互印证</strong><small>两条信息支持同一个结论</small></span></GameButton><GameButton type="button" role="radio" aria-checked={choice==='refutes'} aria-pressed={choice==='refutes'} variant={choice==='refutes'?'evidence':'secondary'} size="lg" className="v09-deduction-option" onClick={()=>setChoice('refutes')}><span><strong>存在矛盾</strong><small>一条信息削弱或推翻另一条说法</small></span></GameButton></div><p className="v09-guided-scene__message" role="status">{message}</p><footer className="v09-guided-scene__footer"><span>{established?'已解锁：再次询问赵简。':'选择关系后提交。'}</span>{established?<GameButton variant="primary" size="lg" audioCue="tent-enter" onClick={()=>onComplete('interrogation')}>再次询问赵简</GameButton>:<GameButton variant="primary" size="lg" audioCue="deduction-link" disabled={!choice} onClick={submit}>提交推断</GameButton>}</footer></section></main>;
}
