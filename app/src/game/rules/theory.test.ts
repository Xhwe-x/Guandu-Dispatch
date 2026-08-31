import { describe, expect, it } from 'vitest';
import type { TheoryEdge } from '../domain';
import { createInitialState } from '../initialState';
import { promoteKnowledge } from './knowledge';
import { evaluateTheory, frozenCoreTheoryEdges } from './theory';

function supportedState(ids: string[]) {
  return ids.reduce((state, id, index) => promoteKnowledge(state, id, 'supported', 100 + index), createInitialState());
}

describe('evaluateTheory', () => {
  it('returns missing-route instead of wrong when Zhao explains only the time leak', () => {
    const state = supportedState(['claim-zhao-time']);
    const result = evaluateTheory(state, [frozenCoreTheoryEdges[0]]);
    expect(result.status).toBe('incomplete');
    expect(result.gaps.some((gap) => gap.kind === 'missing-route')).toBe(true);
    expect(result.gaps.flatMap((gap) => gap.suggestedPersonIds)).toContain('du');
  });

  it('supports the frozen four-part chain before bait validation', () => {
    const state = supportedState([
      'claim-zhao-time',
      'claim-du-fodder-pattern',
      'claim-du-route',
      'claim-price-cipher',
      'claim-shuoyuan-received',
    ]);
    const result = evaluateTheory(state, frozenCoreTheoryEdges);
    expect(result.status).toBe('supported');
    expect(result.supportedEdgeIds).toEqual(frozenCoreTheoryEdges.map((edge) => edge.id));
  });

  it('returns an unsupported-edge gap without dead-ending the theory', () => {
    const state = supportedState(['claim-zhao-time']);
    const noise: TheoryEdge = { id: 'edge-time-lu', fromId: 'info-time', toId: 'person-lu', relation: 'accessedBy', status: 'proposed' };
    const result = evaluateTheory(state, [noise]);
    expect(result.status).toBe('incomplete');
    expect(result.gaps.some((gap) => gap.kind === 'unsupported-edge')).toBe(true);
  });
});
