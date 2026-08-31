import { describe, expect, it } from 'vitest';
import { minimalContent } from '../fixtures';
import { createInitialState } from '../initialState';
import { applyInvestigation, resolveInterrogation } from './investigation';

describe('investigation and interrogation', () => {
  it('spends one point for a deep investigation and reveals its content claims', () => {
    const result = applyInvestigation(minimalContent, createInitialState(), 'investigate-zhao-family');

    expect(result.state.investigationPoints).toBe(2);
    expect(result.state.completedInvestigationIds).toEqual(['investigate-zhao-family']);
    expect(result.revealedClaimIds).toEqual(['claim-zhao-coerced']);
    expect(result.state.extractedClaimIds).toContain('claim-zhao-coerced');
  });

  it('rejects unknown investigations without changing state', () => {
    const state = createInitialState();

    expect(() => applyInvestigation(minimalContent, state, 'missing-investigation')).toThrow(
      'Unknown investigation: missing-investigation',
    );
    expect(state.investigationPoints).toBe(3);
  });

  it('rejects repeated investigations without spending another point', () => {
    const completed = applyInvestigation(minimalContent, createInitialState(), 'investigate-zhao-family').state;

    expect(() => applyInvestigation(minimalContent, completed, 'investigate-zhao-family')).toThrow('该调查已经完成');
    expect(completed.investigationPoints).toBe(2);
  });

  it('rejects an investigation with no points without dropping below zero', () => {
    const state = { ...createInitialState(), investigationPoints: 0 };

    expect(() => applyInvestigation(minimalContent, state, 'investigate-zhao-family')).toThrow('调查点不足');
    expect(state.investigationPoints).toBe(0);
  });

  it('does not spend a point for ordinary evidence confrontation', () => {
    const result = resolveInterrogation(minimalContent, createInitialState(), {
      characterId: 'zhao',
      statementClaimId: 'claim-zhao-denial',
      evidenceClaimId: 'claim-zhao-copied-order',
      tone: 'calm',
      deep: false,
    });

    expect(result.state.investigationPoints).toBe(3);
    expect(result.breakthrough).toBe(true);
    expect(result.revealedClaimIds).toEqual(['claim-zhao-time']);
    expect(result.responseKey).toBe('zhao.calm');
  });

  it('does not let deep interrogation spend points itself', () => {
    const result = resolveInterrogation(minimalContent, createInitialState(), {
      characterId: 'zhao',
      statementClaimId: 'claim-zhao-denial',
      evidenceClaimId: 'claim-zhao-copied-order',
      tone: 'empathize',
      deep: true,
    });

    expect(result.state.investigationPoints).toBe(3);
    expect(result.breakthrough).toBe(true);
    expect(result.responseKey).toBe('zhao.empathize');
  });

  it('uses content evidence pairing rather than the selected tone to decide breakthrough', () => {
    const result = resolveInterrogation(minimalContent, createInitialState(), {
      characterId: 'zhao',
      statementClaimId: 'claim-zhao-denial',
      evidenceClaimId: 'claim-lu-ledger-change',
      tone: 'threaten',
      deep: false,
    });

    expect(result.breakthrough).toBe(false);
    expect(result.revealedClaimIds).toEqual([]);
    expect(result.responseKey).toBe('zhao.wrongEvidence.threaten');
  });

  it('makes a threatening wrong-evidence confrontation immediately hostile without deleting required claims', () => {
    const prepared = { ...createInitialState(), extractedClaimIds: ['claim-zhao-copied-order'] };
    const result = resolveInterrogation(minimalContent, prepared, {
      characterId: 'zhao',
      statementClaimId: 'claim-zhao-denial',
      evidenceClaimId: 'claim-lu-ledger-change',
      tone: 'threaten',
      deep: false,
    });

    expect(result.state.personStates.zhao).toBe('hostile');
    expect(result.state.extractedClaimIds).toContain('claim-zhao-copied-order');
  });

  it('keeps a guarded person guarded when a calm first confrontation misses the evidence', () => {
    const prepared = {
      ...createInitialState(),
      personStates: { ...createInitialState().personStates, zhao: 'guarded' as const },
    };
    const result = resolveInterrogation(minimalContent, prepared, {
      characterId: 'zhao',
      statementClaimId: 'claim-zhao-denial',
      evidenceClaimId: 'claim-lu-ledger-change',
      tone: 'calm',
      deep: false,
    });

    expect(result.state.personStates.zhao).toBe('guarded');
  });


  it('escalates a repeated wrong confrontation even when the tone is calm', () => {
    const prepared = {
      ...createInitialState(),
      personStates: { ...createInitialState().personStates, zhao: 'guarded' as const },
    };
    const result = resolveInterrogation(minimalContent, prepared, {
      characterId: 'zhao',
      statementClaimId: 'claim-zhao-denial',
      evidenceClaimId: 'claim-lu-ledger-change',
      tone: 'calm',
      deep: true,
    });

    expect(result.state.personStates.zhao).toBe('hostile');
    expect(result.responseKey).toBe('zhao.wrongEvidence.calm');
  });

  it('keeps hostile people hostile after wrong evidence without changing points or claims', () => {
    const prepared = {
      ...createInitialState(),
      extractedClaimIds: ['claim-zhao-copied-order'],
      personStates: { ...createInitialState().personStates, zhao: 'hostile' as const },
    };
    const result = resolveInterrogation(minimalContent, prepared, {
      characterId: 'zhao',
      statementClaimId: 'claim-zhao-denial',
      evidenceClaimId: 'claim-lu-ledger-change',
      tone: 'calm',
      deep: false,
    });

    expect(result.state.personStates.zhao).toBe('hostile');
    expect(result.state.investigationPoints).toBe(3);
    expect(result.state.extractedClaimIds).toEqual(['claim-zhao-copied-order']);
  });

  it('lets a correct threatening confrontation retain a guarded state while using its content response', () => {
    const result = resolveInterrogation(minimalContent, createInitialState(), {
      characterId: 'zhao',
      statementClaimId: 'claim-zhao-denial',
      evidenceClaimId: 'claim-zhao-copied-order',
      tone: 'threaten',
      deep: false,
    });

    expect(result.breakthrough).toBe(true);
    expect(result.state.personStates.zhao).toBe('guarded');
    expect(result.responseKey).toBe('zhao.threaten');
  });
});
