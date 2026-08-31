const fs = require('fs');
const assert = require('assert');

const read = (p) => fs.readFileSync(p, 'utf8');
const domain = read('src/game/domain.ts');
const initial = read('src/game/initialState.ts');
const schema = read('src/game/contentSchema.ts');
const persistence = read('src/game/persistence.ts');
const migration = fs.existsSync('src/game/v09PresentationMigration.ts')
  ? read('src/game/v09PresentationMigration.ts')
  : '';

assert.match(domain, /version:\s*6;/, 'GameState must use save schema v6');
assert.match(initial, /version:\s*6,/, 'initial state must be v6');
assert.match(initial, /storySceneId:\s*'prologue-background'/, 'new games must start on v0.9 prologue');
assert.match(schema, /LegacyGameStateV4Schema/, 'v4 must be retained as an explicit legacy schema');
assert.match(schema, /LegacyGameStateV5Schema/, 'v5 must be retained as an explicit legacy schema');
assert.match(schema, /version:\s*z\.literal\(6\)/, 'current zod schema must be v6');
assert.match(schema, /version === 4[\s\S]*migrateV4PresentationToV09/, 'v4 migration must use the v0.9 presentation migrator');
assert.match(persistence, /parsed\.version !== 6/, 'persistence must recognize v6 as supported');
assert.match(schema, /version === 5[\s\S]*inferCoreLoopFromLegacy/, 'v5 migration must infer core-loop state');
assert.match(migration, /migrateV4PresentationToV09/, 'dedicated v0.9 migration helper must exist');
assert.match(migration, /sceneHistory:\s*\[\]/, 'legacy navigation history must be cleared during v0.9 migration');
assert.match(migration, /'prologue-background'/, 'legacy early presentation must have a v0.9 prologue recovery point');
assert.match(migration, /'zhao-first-dialogue'/, 'legacy dialogue must map to the v0.9 first Zhao dialogue');
assert.doesNotMatch(migration, /sceneHistory:\s*context\.presentation\.sceneHistory/, 'old history must never survive intact');

console.log('v0.9 save migration contract OK');
