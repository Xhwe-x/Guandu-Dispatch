import type { CaseObjective, EntityId, GameContent, GameState, KnowledgeEntry, KnowledgeStatus } from '../domain';
import { gameReducer } from '../reducer';

const rank: Record<KnowledgeStatus, number> = { unknown:0, observed:1, suspected:2, contradicted:2, supported:3, verified:4, excluded:4 };
function inferPeople(claimId:string):string[]{ for(const id of ['zhao','du','lu','zheng']) if(claimId.startsWith(`claim-${id}-`)) return [id]; return []; }
export function upsertKnowledge(state:GameState,entry:KnowledgeEntry):GameState{ return gameReducer(state,{type:'UPSERT_KNOWLEDGE',entry}); }
export function markObservedClaim(content:GameContent,state:GameState,claimId:EntityId,at=Date.now()):GameState{
  const claim=content.claims.find((item)=>item.id===claimId); if(!claim) return state;
  const previous=state.coreLoop.knowledge[claimId]; const status=previous&&rank[previous.status]>rank.observed?previous.status:'observed';
  return upsertKnowledge(state,{id:claim.id,kind:'claim',status,sourceIds:[claim.provenance.sourceId],relatedPersonIds:inferPeople(claim.id),relatedDocumentIds:[claim.sourceDocumentId],lastUpdatedAt:at});
}
export function promoteKnowledge(state:GameState,knowledgeId:EntityId,status:KnowledgeStatus,at=Date.now()):GameState{
  const previous=state.coreLoop.knowledge[knowledgeId];
  if(!previous) return upsertKnowledge(state,{id:knowledgeId,kind:'claim',status,sourceIds:[],relatedPersonIds:inferPeople(knowledgeId),relatedDocumentIds:[],lastUpdatedAt:at});
  if(rank[status]<rank[previous.status]) return state;
  return gameReducer(state,{type:'SET_KNOWLEDGE_STATUS',knowledgeId,status,at});
}
export function markClaimsObserved(content:GameContent,state:GameState,claimIds:EntityId[],at=Date.now()):GameState{ return claimIds.reduce((current,id,index)=>markObservedClaim(content,current,id,at+index),state); }
function isSupported(state:GameState,id:EntityId){ const status=state.coreLoop.knowledge[id]?.status; return status==='supported'||status==='verified'; }
export function syncObjectiveProgress(state:GameState,objectives:CaseObjective[]):GameState{
  const current=objectives.find((item)=>item.id===state.coreLoop.guidance.currentObjectiveId)??objectives[0]; if(!current) return state;
  let complete=false;
  if(current.id==='objective-counterintel') complete=state.coreLoop.baitExperiments.some((item)=>item.status!=='draft');
  else if(current.completion==='all-required-supported') complete=current.requiredKnowledgeIds.every((id)=>isSupported(state,id));
  else if(current.completion==='theory-supported') complete=state.coreLoop.theoryEvaluation.status==='supported'||state.coreLoop.theoryEvaluation.status==='verified';
  else if(current.completion==='theory-verified') complete=state.coreLoop.theoryEvaluation.status==='verified';
  if(!complete||!current.nextObjectiveId) return state;
  return gameReducer(state,{type:'SET_OBJECTIVE',objectiveId:current.nextObjectiveId});
}
export function syncObjectivesUntilStable(state:GameState,objectives:CaseObjective[]):GameState{
  let current=state; for(let i=0;i<objectives.length;i+=1){ const next=syncObjectiveProgress(current,objectives); if(next===current||next.coreLoop.guidance.currentObjectiveId===current.coreLoop.guidance.currentObjectiveId) return current; current=next; } return current;
}
