import { guanduEvidenceReactions } from '../../content/guandu/coreLoop';
import type { EvidenceReaction, GameContent, GameState } from '../domain';
import { gameReducer } from '../reducer';
import { markClaimsObserved, promoteKnowledge } from './knowledge';

export interface EvidenceReactionResult { state:GameState; reaction:EvidenceReaction['reaction']; response:string; revealClaimIds:string[]; reactionId?:string; }
function knowledgeReady(state:GameState,id:string){ const status=state.coreLoop.knowledge[id]?.status; return status==='supported'||status==='verified'; }
function fallbackResponse(characterId:string){ if(characterId==='zhao') return '此物与我所写军书没有直接关系。若要问时辰，就拿与军书房有关的东西来。'; if(characterId==='du') return '这东西只能说明军中有人经手，不能说明我从中知道了什么。'; if(characterId==='lu') return '这份材料与我经手的封检无直接关系。'; if(characterId==='zheng') return '这不是我负责的车马记录。'; return '这份证据与我的口供没有直接关系。'; }
export function resolveEvidenceReaction(content:GameContent,state:GameState,characterId:string,evidenceClaimId:string,at=Date.now()):EvidenceReactionResult{
  const matched=guanduEvidenceReactions.find((item)=>item.characterId===characterId&&item.evidenceClaimId===evidenceClaimId);
  if(!matched) return {state,reaction:'irrelevant',response:fallbackResponse(characterId),revealClaimIds:[]};
  const missingRequired=matched.requiredKnowledgeIds?.filter((id)=>!knowledgeReady(state,id))??[];
  if(missingRequired.length) return {state,reaction:'guarded',response:'这些材料还没有连成一条完整事实。你若只拿这一页来问，我没有更多可说。',revealClaimIds:[],reactionId:matched.id};
  let next=state;
  for(const claimId of matched.revealClaimIds) next=gameReducer(next,{type:'EXTRACT_CLAIM',claimId});
  next=markClaimsObserved(content,next,matched.revealClaimIds,at);
  for(const update of matched.knowledgeUpdates) next=promoteKnowledge(next,update.knowledgeId,update.status,at+1);
  const usedEvidenceIds=next.coreLoop.guidance.unusedEvidenceIds.filter((id)=>id!==evidenceClaimId);
  const progressed=next!==state&&(matched.revealClaimIds.length>0||matched.knowledgeUpdates.some((update)=>state.coreLoop.knowledge[update.knowledgeId]?.status!==update.status));
  const nextPersonState=matched.reaction==='breakthrough'?'cooperative':matched.reaction==='irrelevant'?(state.personStates[characterId]??'cooperative'):'guarded';
  next=gameReducer(next,{type:'SET_PERSON_STATE',characterId,state:nextPersonState});
  next=gameReducer(next,{type:'SET_GUIDANCE_STATE',guidance:{...next.coreLoop.guidance,unusedEvidenceIds:usedEvidenceIds,lastProgressAt:progressed?at:next.coreLoop.guidance.lastProgressAt}});
  return {state:next,reaction:matched.reaction,response:matched.response,revealClaimIds:matched.revealClaimIds,reactionId:matched.id};
}
