const fs = require('node:fs');
const schema = fs.readFileSync('src/game/contentSchema.ts', 'utf8');
const persistence = fs.readFileSync('src/game/persistence.ts', 'utf8');
const checks = {
  currentV6Schema: /GameStateSchema[\s\S]*?version:\s*z\.literal\(6\)/.test(schema),
  legacyV5Schema: /LegacyGameStateV5Schema/.test(schema),
  coreLoopPersisted: /coreLoop:\s*CoreLoopStateSchema/.test(schema),
  v5Migration: /version\s*===\s*5[\s\S]*?inferCoreLoopFromLegacy/.test(schema),
  loaderAcceptsV6: /parsed\.version\s*!==\s*6/.test(persistence),
};
console.log(checks);
if (Object.values(checks).some((value) => !value)) process.exit(1);
