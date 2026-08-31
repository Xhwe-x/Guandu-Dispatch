import { describe, expect, it } from 'vitest';
import { guanduCase } from '../../content/guandu';
import { createInitialState } from '../initialState';
import { markObservedClaim, promoteKnowledge } from './knowledge';
describe('knowledge rules',()=>{
  it('marks a discovered claim as observed and indexes its person/document relations',()=>{ const next=markObservedClaim(guanduCase,createInitialState(),'claim-du-fodder-pattern',100); const entry=next.coreLoop.knowledge['claim-du-fodder-pattern']; expect(entry.status).toBe('observed'); expect(entry.relatedPersonIds).toContain('du'); expect(entry.relatedDocumentIds).toContain('station-entry'); });
  it('never downgrades verified knowledge through observation',()=>{ const verified=promoteKnowledge(createInitialState(),'claim-zhao-time','verified',10); const observed=promoteKnowledge(verified,'claim-zhao-time','observed',20); expect(observed.coreLoop.knowledge['claim-zhao-time'].status).toBe('verified'); });
});
