import { describe, expect, it } from 'vitest';
import type { BaitExperiment } from '../domain';
import { createEnemyFeedback } from './enemyFeedback';

const experiment: BaitExperiment = {
  id: 'experiment-test',
  theoryEdgeIds: ['edge-time-zhao','edge-route-du','edge-integrate-du','edge-price-yuan'],
  baitIds: ['bait-zhao-yin','bait-du-south-ford'],
  hypothesis: 'test', expectedSignals: ['yin','southFord'], status: 'deployed',
};

describe('enemy feedback', () => {
  it('verifies both core sides when both reflected', () => {
    const feedback = createEnemyFeedback(experiment, {
      credibleBaitIds: experiment.baitIds,
      reflectedChannels: ['zhao','du'],
      enemyReport: { route: 'southFord', time: 'yin' },
      baitBand: 'bothCore',
    });
    expect(feedback.flatMap((item) => item.supportsTheoryEdgeIds)).toEqual(expect.arrayContaining(experiment.theoryEdgeIds));
  });

  it('represents no response as evidence instead of an error', () => {
    const feedback = createEnemyFeedback(experiment, {
      credibleBaitIds: [], reflectedChannels: [], enemyReport: { route: 'northBridge', time: 'zi' }, baitBand: 'noneCore',
    });
    expect(feedback.some((item) => item.source === 'no-response')).toBe(true);
  });
});
