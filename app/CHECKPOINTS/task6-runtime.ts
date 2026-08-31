import { createInitialState } from '../src/game/initialState';
import { promoteKnowledge } from '../src/game/rules/knowledge';
import { evaluateTheory, frozenCoreTheoryEdges } from '../src/game/rules/theory';

let state = createInitialState();
state = promoteKnowledge(state, 'claim-zhao-time', 'supported', 1);
const partial = evaluateTheory(state, [frozenCoreTheoryEdges[0]]);
if (!partial.gaps.some((gap) => gap.kind === 'missing-route')) throw new Error('missing-route gap not produced');
for (const id of ['claim-du-fodder-pattern','claim-du-route','claim-price-cipher','claim-shuoyuan-received']) state = promoteKnowledge(state, id, 'supported', 2);
const full = evaluateTheory(state, frozenCoreTheoryEdges);
if (full.status !== 'supported') throw new Error(`expected supported, got ${full.status}`);
console.log('task6 runtime PASS');
