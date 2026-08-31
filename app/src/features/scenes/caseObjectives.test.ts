import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../game/initialState';
import { caseObjectiveForScene, suggestedHintForScene } from './caseObjectives';

describe('case objectives and anti-dead-end guidance', () => {
  it('always tells the player a concrete next action for core gameplay scenes', () => {
    const state = createInitialState();
    for (const sceneId of ['document', 'investigation', 'interrogation', 'deduction', 'network-investigation', 'bait', 'final-report'] as const) {
      const objective = caseObjectiveForScene(sceneId, state);
      expect(objective.title.length).toBeGreaterThan(0);
      expect(objective.action.length).toBeGreaterThan(0);
      expect(suggestedHintForScene(sceneId, state).length).toBeGreaterThan(0);
    }
  });

  it('changes the audience objective for the final Cao Cao briefing', () => {
    const state = createInitialState();
    state.presentation.audience = { visitId: 'final-report', shotIndex: 0, attitude: 'observing', choiceIds: [] };
    expect(caseObjectiveForScene('audience', state).title).toContain('反情报结果');
  });
});
