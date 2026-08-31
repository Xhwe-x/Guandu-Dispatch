import { describe, expect, it } from 'vitest';
import { guanduGuidanceCues } from '../../content/guandu/coreLoop';
import { createInitialState } from '../initialState';
import { markCueShown, nextProactiveCue, requestManualHint } from './guidance';

describe('core-loop guidance', () => {
  it('shows the same proactive cue at most once', () => {
    const state = createInitialState();
    state.coreLoop.guidance.currentObjectiveId = 'objective-route-leak';
    state.coreLoop.theoryEvaluation.gaps = [{
      id: 'gap-route', kind: 'missing-route', title: '路线缺口', description: '缺路线',
      relatedKnowledgeIds: [], suggestedPersonIds: ['du'], suggestedDocumentIds: ['route-map'],
    }];
    const first = nextProactiveCue(state, guanduGuidanceCues, 130_000);
    expect(first?.id).toBe('cue-route-gap');
    const shown = markCueShown(state, 'cue-route-gap');
    expect(nextProactiveCue(shown, guanduGuidanceCues, 140_000)).toBeUndefined();
  });

  it('manual hint advances only to level three', () => {
    let state = createInitialState();
    state = requestManualHint(state, 'cue-route-gap');
    state = requestManualHint(state, 'cue-route-gap');
    state = requestManualHint(state, 'cue-route-gap');
    state = requestManualHint(state, 'cue-route-gap');
    expect(state.coreLoop.guidance.manualHintLevels['cue-route-gap']).toBe(3);
  });
});
