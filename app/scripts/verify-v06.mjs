import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/initialState.ts';
import { gameReducer } from '../src/game/reducer.ts';
import { migrateGameState } from '../src/game/contentSchema.ts';
import { guanduCase } from '../src/content/guandu/index.ts';
import { applyInvestigation, resolveInterrogation } from '../src/game/rules/investigation.ts';
import { validateRelationship } from '../src/game/rules/relationships.ts';
import { loadGame, saveGame } from '../src/game/persistence.ts';

class MemoryStorage {
  #items = new Map();
  get length() { return this.#items.size; }
  clear() { this.#items.clear(); }
  getItem(key) { return this.#items.has(key) ? this.#items.get(key) : null; }
  key(index) { return [...this.#items.keys()][index] ?? null; }
  removeItem(key) { this.#items.delete(key); }
  setItem(key, value) { this.#items.set(key, String(value)); }
}

const initial = createInitialState();
assert.equal(initial.version, 3);
assert.equal(initial.presentation.sceneId, 'title');
assert.equal(initial.presentation.storySceneId, 'intro-cg');

let presentation = gameReducer(initial, { type: 'SET_SCENE', sceneId: 'story' });
presentation = gameReducer(presentation, { type: 'SET_STORY_POSITION', storySceneId: 'intro-cg', beatIndex: 3 });
presentation = gameReducer(presentation, { type: 'MARK_DOCUMENT_FINDING', findingId: 'ambush-location' });
presentation = gameReducer(presentation, { type: 'MARK_HANDWRITING_FINDING', findingId: 'hook-stroke' });
assert.equal(presentation.presentation.sceneId, 'story');
assert.equal(presentation.presentation.beatIndex, 3);
assert.deepEqual(presentation.presentation.documentFindingIds, ['ambush-location']);
assert.deepEqual(presentation.presentation.handwritingFindingIds, ['hook-stroke']);

const migrated = migrateGameState({
  version: 2,
  tutorial: { step: 'interrogateZhao', startedAtLeastOnce: true },
  stage: 'documents',
  investigationPoints: 2,
  readDocumentIds: ['report-ambush', 'statement-zhao'],
  extractedClaimIds: ['claim-shuoyuan-received', 'claim-zhao-denial', 'claim-zhao-copied-order'],
  relationships: [],
  completedInvestigationIds: ['investigate-handwriting'],
  personStates: { lu: 'cooperative', zheng: 'cooperative', zhao: 'cooperative', du: 'cooperative' },
  selectedBaitIds: [],
  hintUsage: {},
});
assert.equal(migrated.version, 3);
assert.equal(migrated.presentation.sceneId, 'interrogation');
assert.deepEqual(migrated.presentation.handwritingFindingIds, ['hook-stroke', 'cart-stroke']);

const investigated = applyInvestigation(guanduCase, initial, 'investigate-handwriting');
assert.equal(investigated.state.investigationPoints, 2);
assert.ok(investigated.state.extractedClaimIds.includes('claim-zhao-copied-order'));

const wrongThreat = resolveInterrogation(guanduCase, initial, {
  characterId: 'zhao',
  statementClaimId: 'claim-zhao-denial',
  evidenceClaimId: 'claim-shuoyuan-received',
  tone: 'threaten',
  deep: false,
});
assert.equal(wrongThreat.breakthrough, false);
assert.equal(wrongThreat.state.personStates.zhao, 'hostile');
assert.equal(wrongThreat.responseKey, 'zhao.wrongEvidence.threaten');

const correctCalm = resolveInterrogation(guanduCase, investigated.state, {
  characterId: 'zhao',
  statementClaimId: 'claim-zhao-denial',
  evidenceClaimId: 'claim-zhao-copied-order',
  tone: 'calm',
  deep: false,
});
assert.equal(correctCalm.breakthrough, true);
assert.equal(correctCalm.state.personStates.zhao, 'cooperative');
assert.ok(correctCalm.state.extractedClaimIds.includes('claim-zhao-time'));

const relationship = {
  fromId: 'claim-zhao-copied-order',
  toId: 'claim-zhao-denial',
  kind: 'refutes',
  slot: 'leakedInfo',
};
assert.deepEqual(validateRelationship(guanduCase, relationship), { ok: true });

const storage = new MemoryStorage();
const persisted = {
  ...correctCalm.state,
  presentation: {
    ...correctCalm.state.presentation,
    sceneId: 'deduction',
    storySceneId: 'zhao-introduction',
    beatIndex: 2,
    documentFindingIds: ['ambush-location', 'ambush-time'],
    handwritingFindingIds: ['hook-stroke', 'cart-stroke'],
  },
};
saveGame(storage, persisted);
const loaded = loadGame(storage);
assert.equal(loaded.kind, 'ok');
assert.equal(loaded.state.presentation.sceneId, 'deduction');
assert.equal(loaded.state.presentation.beatIndex, 2);

console.log('v0.6 logic smoke verification passed');
