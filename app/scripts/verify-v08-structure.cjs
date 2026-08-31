const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

for (const file of [
  'src/game/presentationRecovery.ts',
  'src/features/ui/GameButton.tsx',
  'src/features/ui/ChoiceStrip.tsx',
  'src/features/ui/SceneRecovery.tsx',
  'src/features/ui/ui.css',
  'src/features/scenes/DialogueCharacterCard.tsx',
  'src/features/scenes/dialogueCharacters.ts',
  'src/features/scenes/v08.css',
]) assert.ok(exists(file), `missing v0.8 file: ${file}`);

const domain = read('src/game/domain.ts');
assert.match(domain, /version: 4/);
assert.match(domain, /PresentationSnapshot/);
assert.match(domain, /sceneHistory\?: PresentationSnapshot\[\]/);

const recovery = read('src/game/presentationRecovery.ts');
for (const symbol of ['snapshotPresentation', 'recoverPresentation', 'isStorySceneCompatible']) {
  assert.ok(recovery.includes(`function ${symbol}`) || recovery.includes(`const ${symbol}`), `missing recovery symbol ${symbol}`);
}

const shell = read('src/features/scenes/GameShell.tsx');
assert.ok(shell.includes('SceneRecovery'), 'GameShell must render SceneRecovery');
assert.ok(!shell.includes('场景资料暂不可用'), 'developer fallback must be removed');

const dialogue = read('src/features/scenes/DialogueScene.tsx');
assert.ok(dialogue.includes('DialogueCharacterCard'), 'dialogue must use character cards');
assert.ok(!dialogue.includes("const speakers: Record<string"), 'dialogue speaker map cannot remain hard-coded to Zhao');

const audio = read('src/features/audio/audioCues.ts');
for (const cue of ['ui-back', 'paper-close', 'character-enter', 'evidence-place', 'deduction-link', 'journal-tab']) {
  assert.ok(audio.includes(`'${cue}'`), `missing audio cue ${cue}`);
}

const nav = read('src/features/scenes/CaseNavigator.tsx');
for (const tab of ["'people'", "'intel'", "'evidence'", "'reasoning'", "'task'", "'tutorial'", "'settings'"]) {
  assert.ok(nav.includes(tab), `journal tab missing ${tab}`);
}

const pkg = JSON.parse(read('package.json'));
assert.ok(/^0\.8\.[2-9]$/.test(pkg.version), `expected v0.8.x delivery version, got ${pkg.version}`);
assert.equal(pkg.scripts['verify:v08:structure'], 'node scripts/verify-v08-structure.cjs');

console.log('v0.8 structure verification passed');
