import { describe, expect, it } from 'vitest';
import { minimalContent } from '../fixtures';
import { evaluateBaitExperiment, evaluateBaitPlan } from './bait';

const coreTheoryEdgeIds = ['edge-time-zhao', 'edge-route-du', 'edge-integrate-du', 'edge-price-yuan'];

describe('theory-driven bait experiment', () => {
  it('allows a coherent Zhao + Du experiment without forcing Lu and Zheng', () => {
    const result = evaluateBaitExperiment(minimalContent, {
      knownClaimIds: ['claim-zhao-time', 'claim-zhao-copied-order', 'claim-du-route', 'claim-du-fodder-pattern', 'claim-bridge-open'],
      theoryEdgeIds: coreTheoryEdgeIds,
      baitIds: ['bait-zhao-yin', 'bait-du-north-bridge'],
      realPlan: { route: 'southFord', time: 'zi' },
    });
    expect(result.experiment.status).toBe('deployed');
    expect(result.expectedSignals.length).toBeGreaterThan(0);
    expect(result.resolution.baitBand).toBe('bothCore');
  });

  it('keeps old four-channel inputs compatible', () => {
    const result = evaluateBaitPlan(minimalContent, {
      knownClaimIds: ['claim-zhao-time', 'claim-zhao-copied-order', 'claim-du-route', 'claim-du-fodder-pattern', 'claim-bridge-open'],
      baitIds: ['bait-lu-south', 'bait-zheng-36', 'bait-zhao-yin', 'bait-du-north-bridge'],
      realPlan: { route: 'southFord', time: 'zi' },
    });
    expect(result.enemyReport).toEqual({ route: 'northBridge', time: 'yin' });
    expect(result.baitBand).toBe('bothCore');
  });


  it('rejects a core experiment whose fake signals are identical to the real convoy plan', () => {
    expect(() => evaluateBaitExperiment(minimalContent, {
      knownClaimIds: ['claim-zhao-time', 'claim-du-route', 'claim-bridge-open'],
      theoryEdgeIds: coreTheoryEdgeIds,
      baitIds: ['bait-zhao-yin', 'bait-du-north-bridge'],
      realPlan: { route: 'northBridge', time: 'yin' },
    })).toThrow(/真实计划不同/);
  });

  it('rejects duplicate selections from the same channel', () => {
    expect(() => evaluateBaitExperiment(minimalContent, {
      knownClaimIds: ['claim-zhao-time'],
      theoryEdgeIds: coreTheoryEdgeIds,
      baitIds: ['bait-zhao-yin', 'bait-zhao-yin', 'bait-du-north-bridge'],
      realPlan: { route: 'northBridge', time: 'zi' },
    })).toThrow(/同一渠道/);
  });
});
