import { describe, expect, it } from 'vitest';
import { guanduEvidenceReactions, guanduGuidanceCues, guanduObjectives } from './coreLoop';

describe('Guandu core loop content', () => {
  it('keeps the frozen objective order', () => {
    expect(guanduObjectives.map((item) => item.id)).toEqual([
      'objective-time-leak','objective-route-leak','objective-integration','objective-transmission','objective-counterintel','objective-verify-network',
    ]);
  });
  it('has evidence reactions for the core Zhao and Du breakthroughs', () => {
    expect(guanduEvidenceReactions.some((item) => item.characterId === 'zhao' && item.reaction === 'breakthrough')).toBe(true);
    expect(guanduEvidenceReactions.some((item) => item.characterId === 'du' && item.reaction === 'breakthrough')).toBe(true);
  });
  it('provides three levels for each guidance cue', () => {
    for (const cue of guanduGuidanceCues) {
      expect(cue.level1.length).toBeGreaterThan(0); expect(cue.level2.length).toBeGreaterThan(0); expect(cue.level3.length).toBeGreaterThan(0);
    }
  });
});
