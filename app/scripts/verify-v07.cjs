const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ts = require('typescript');

function registerTypeScript(ext) {
  require.extensions[ext] = function transpile(module, filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.Node10,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
      fileName: filename,
    });
    module._compile(output.outputText, filename);
  };
}
registerTypeScript('.ts');
registerTypeScript('.tsx');
require.extensions['.css'] = () => {};

class MemoryStorage {
  constructor(seed = {}) { this.data = new Map(Object.entries(seed)); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
  clear() { this.data.clear(); }
  key(index) { return [...this.data.keys()][index] ?? null; }
  get length() { return this.data.size; }
}

const { createInitialState } = require('../src/game/initialState.ts');
const { guanduCase } = require('../src/content/guandu/index.ts');
const initialGameState = createInitialState();
const { gameReducer } = require('../src/game/reducer.ts');
const { loadGame } = require('../src/game/persistence.ts');
const { applyInvestigation, resolveInterrogation } = require('../src/game/rules/investigation.ts');
const { evaluateHypothesis, validateRelationship } = require('../src/game/rules/relationships.ts');
const { evaluateBaitPlan } = require('../src/game/rules/bait.ts');
const { evaluateReport } = require('../src/game/rules/report.ts');
const { composeEpilogue } = require('../src/game/rules/ending.ts');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { GameProvider } = require('../src/app/GameProvider.tsx');
const { GameShell } = require('../src/features/scenes/GameShell.tsx');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function withScene(sceneId, patch = {}) {
  const state = clone(initialGameState);
  state.presentation.sceneId = sceneId;
  Object.assign(state, patch);
  return state;
}
function renderScene(state) {
  const storage = new MemoryStorage();
  return renderToStaticMarkup(
    React.createElement(
      GameProvider,
      { initialState: state, storage },
      React.createElement(GameShell),
    ),
  );
}

// v0.7 persistence/navigation contract.
assert.equal(initialGameState.version, 3);
assert.equal(initialGameState.presentation.sceneId, 'title');
assert.deepEqual(initialGameState.presentation.sceneHistory, []);
assert.equal(initialGameState.audio.enabled, true);
assert.equal(initialGameState.tutorial.enabled, true);
const progressed = gameReducer(initialGameState, { type: 'SET_SCENE', sceneId: 'document' });
assert.equal(progressed.presentation.sceneId, 'document');
assert.notEqual(progressed, initialGameState);
const stepped = gameReducer(progressed, { type: 'SET_SCENE', sceneId: 'investigation' });
assert.deepEqual(stepped.presentation.sceneHistory, ['document']);
const steppedBack = gameReducer(stepped, { type: 'GO_BACK' });
assert.equal(steppedBack.presentation.sceneId, 'document');

const v2 = clone(initialGameState);
delete v2.presentation;
v2.version = 2;
v2.completedInvestigationIds = ['investigate-handwriting'];
v2.extractedClaimIds = ['claim-zhao-time'];
const migrationStorage = new MemoryStorage({ 'guandu.current': JSON.stringify(v2) });
const migrated = loadGame(migrationStorage);
assert.equal(migrated.kind, 'ok');
assert.equal(migrated.state.version, 3);
assert.equal(migrated.state.presentation.sceneId, 'deduction');

// Every newly connected v0.6 scene must round-trip through persistence.
for (const sceneId of ['audience', 'network-investigation', 'network-deduction', 'bait', 'enemy-report', 'final-report', 'ending']) {
  const storage = new MemoryStorage();
  const persistedScene = clone(initialGameState);
  persistedScene.presentation.sceneId = sceneId;
  storage.setItem('guandu.current', JSON.stringify(persistedScene));
  const restored = loadGame(storage);
  assert.equal(restored.kind, 'ok', `${sceneId} should survive a reload`);
  assert.equal(restored.state.presentation.sceneId, sceneId);
}

// Interrogation consequence contract.
const correct = resolveInterrogation(guanduCase, initialGameState, {
  characterId: 'zhao',
  statementClaimId: 'claim-zhao-denial',
  evidenceClaimId: 'claim-zhao-copied-order',
  tone: 'calm',
  deep: false,
});
assert.equal(correct.breakthrough, true);
assert.equal(correct.state.personStates.zhao, 'cooperative');
const wrongThreat = resolveInterrogation(guanduCase, initialGameState, {
  characterId: 'zhao',
  statementClaimId: 'claim-zhao-denial',
  evidenceClaimId: 'claim-shuoyuan-received',
  tone: 'threaten',
  deep: false,
});
assert.equal(wrongThreat.breakthrough, false);
assert.equal(wrongThreat.state.personStates.zhao, 'hostile');

// Deduction contract.
const relation = validateRelationship(guanduCase, {
  fromId: 'claim-zhao-copied-order',
  toId: 'claim-zhao-denial',
  kind: 'refutes',
  slot: 'leakedInfo',
});
assert.equal(relation.ok, true);

// Full second-fold rules path: every required fact must be obtainable without hidden setup.
let full = clone(initialGameState);
full.investigationPoints = 2;
full.completedInvestigationIds = ['investigate-handwriting'];
full.extractedClaimIds = ['claim-shuoyuan-received', 'claim-zhao-denial', 'claim-zhao-copied-order', 'claim-zhao-time'];
full.relationships = [{
  fromId: 'claim-zhao-copied-order', toId: 'claim-zhao-denial', kind: 'refutes', slot: 'leakedInfo',
}];
for (const claimId of ['claim-lu-seal-order', 'claim-lu-ledger-change', 'claim-lu-denial']) {
  full = gameReducer(full, { type: 'EXTRACT_CLAIM', claimId });
}
full = resolveInterrogation(guanduCase, full, {
  characterId: 'lu', statementClaimId: 'claim-lu-denial', evidenceClaimId: 'claim-lu-ledger-change', tone: 'calm', deep: false,
}).state;
assert.ok(full.extractedClaimIds.includes('claim-lu-no-time'));
for (const claimId of ['claim-zheng-repair-change', 'claim-zheng-scale', 'claim-zheng-denial']) {
  full = gameReducer(full, { type: 'EXTRACT_CLAIM', claimId });
}
full = resolveInterrogation(guanduCase, full, {
  characterId: 'zheng', statementClaimId: 'claim-zheng-denial', evidenceClaimId: 'claim-zheng-repair-change', tone: 'calm', deep: false,
}).state;
assert.ok(full.extractedClaimIds.includes('claim-zheng-no-route'));
for (const claimId of ['claim-du-denial', 'claim-south-ford-open', 'claim-west-ridge-light']) {
  full = gameReducer(full, { type: 'EXTRACT_CLAIM', claimId });
}
full = applyInvestigation(guanduCase, full, 'investigate-du-records').state;
assert.equal(full.investigationPoints, 1);
assert.ok(full.extractedClaimIds.includes('claim-price-cipher'));
full = resolveInterrogation(guanduCase, full, {
  characterId: 'du', statementClaimId: 'claim-du-denial', evidenceClaimId: 'claim-price-cipher', tone: 'calm', deep: false,
}).state;
assert.ok(full.extractedClaimIds.includes('claim-du-route'));
full = applyInvestigation(guanduCase, full, 'investigate-zhao-family').state;
assert.equal(full.investigationPoints, 0);
assert.ok(full.extractedClaimIds.includes('claim-zhao-coerced'));
for (const nextRelation of [
  { fromId: 'claim-zhao-time', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
  { fromId: 'claim-du-route', toId: 'du', kind: 'infers', slot: 'method' },
  { fromId: 'du', toId: 'claim-shuoyuan-received', kind: 'transmitsTo', slot: 'enemyConclusion' },
]) {
  assert.equal(validateRelationship(guanduCase, nextRelation).ok, true);
  full = gameReducer(full, { type: 'PLACE_RELATIONSHIP', relationship: nextRelation });
}
assert.deepEqual(evaluateHypothesis(full.relationships), { timeChannel: true, routeChannel: true, transmitter: true });
const baitResolution = evaluateBaitPlan(guanduCase, {
  knownClaimIds: full.extractedClaimIds,
  baitIds: ['bait-lu-south', 'bait-zheng-12', 'bait-zhao-yin', 'bait-du-south-ford'],
  realPlan: { route: 'northBridge', time: 'zi' },
});
assert.equal(baitResolution.baitBand, 'bothCore');
assert.deepEqual(baitResolution.enemyReport, { route: 'southFord', time: 'yin' });
const report = {
  leakedInfo: ['departureTime', 'route'],
  sourceCharacterIds: ['zhao', 'du'],
  integratorId: 'du',
  transmissionMethod: 'priceCipher',
  evidenceClaimIds: ['claim-zhao-copied-order', 'claim-zhao-coerced', 'claim-du-route', 'claim-price-cipher'],
  handling: 'differentiate',
};
const reportEvaluation = evaluateReport(report, baitResolution.baitBand);
assert.equal(reportEvaluation.outcome, 'networkClosed');
assert.equal(reportEvaluation.evidenceSufficient, true);
const epilogue = composeEpilogue(guanduCase, { owner: 'canghe', report: reportEvaluation, personStates: full.personStates });
assert.equal(epilogue.outcome, 'networkClosed');
assert.ok(epilogue.paragraphs.length >= 3);

// Render smoke tests for every v0.6 scene family.
const cases = [
  ['title', withScene('title'), '启封案卷'],
  ['story', withScene('story', { presentation: { ...clone(initialGameState.presentation), sceneId: 'story', storySceneId: 'intro-cg', beatIndex: 1 } }), '继续'],
  ['camp', withScene('camp', { presentation: { ...clone(initialGameState.presentation), sceneId: 'camp', storySceneId: 'camp-brief', beatIndex: 4 } }), '军帐议事'],
  ['audience', withScene('audience', { presentation: { ...clone(initialGameState.presentation), sceneId: 'audience', audience: { visitId: 'first-report', shotIndex: 0, attitude: 'observing', choiceIds: [] } } }), '觐见曹操'],
  ['document', withScene('document'), '誊入案卷'],
  ['dialogue', withScene('dialogue', { presentation: { ...clone(initialGameState.presentation), sceneId: 'dialogue', storySceneId: 'zhao-introduction', beatIndex: 1 } }), '赵简入帐'],
  ['investigation', withScene('investigation'), '确认笔迹结论'],
  ['interrogation', withScene('interrogation'), '开始对质'],
  ['deduction', withScene('deduction'), '钉入推演板'],
  ['summary', withScene('case-summary'), '第一条矛盾已立'],
  ['network-investigation', withScene('network-investigation'), '四匣并查'],
  ['network-deduction', withScene('network-deduction'), '拼出泄密链'],
  ['bait', withScene('bait'), '四路投饵'],
  ['enemy-report', withScene('enemy-report'), '敌军回声'],
  ['final-report', withScene('final-report'), '提交军机结案'],
  ['ending', withScene('ending'), '真相归属'],
];
for (const [name, state, needle] of cases) {
  const html = renderScene(state);
  assert.ok(html.includes(needle), `${name} did not render expected marker: ${needle}`);
}

console.log(`v0.6 smoke verification passed (${cases.length} scene renders + logic contracts).`);
