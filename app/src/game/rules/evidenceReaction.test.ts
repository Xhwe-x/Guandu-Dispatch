import { describe, expect, it } from 'vitest';
import { guanduCase } from '../../content/guandu';
import { createInitialState } from '../initialState';
import { markObservedClaim, promoteKnowledge } from './knowledge';
import { resolveEvidenceReaction } from './evidenceReaction';
describe('evidence reactions',()=>{
  it('breaks Zhao with the copied order and reveals the time leak',()=>{ let state=markObservedClaim(guanduCase,createInitialState(),'claim-zhao-copied-order',1); const result=resolveEvidenceReaction(guanduCase,state,'zhao','claim-zhao-copied-order',100); expect(result.reaction).toBe('breakthrough'); expect(result.state.coreLoop.knowledge['claim-zhao-time']?.status).toBe('supported'); });
  it('treats irrelevant evidence as information without locking the character',()=>{ let state=markObservedClaim(guanduCase,createInitialState(),'claim-price-cipher',1); state=promoteKnowledge(state,'claim-price-cipher','supported',2); const result=resolveEvidenceReaction(guanduCase,state,'zhao','claim-price-cipher',100); expect(result.reaction).toBe('irrelevant'); expect(result.state.personStates.zhao).not.toBe('hostile'); expect(result.state.investigationPoints).toBe(state.investigationPoints); });
});
