const fs = require('fs');
const path = require('path');
const assert = require('assert');
const appRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(appRoot, '..');
const read = (p) => fs.readFileSync(path.join(appRoot, p), 'utf8');
const readProject = (p) => fs.readFileSync(path.join(projectRoot, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(appRoot, p));


// Round 0: version and package consistency.
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
assert.ok(/^0\.8\.[2-9]$/.test(pkg.version), `unexpected package version ${pkg.version}`);
assert.equal(lock.version, pkg.version);
assert.equal(lock.packages[''].version, pkg.version);
assert.ok(pkg.scripts['verify:v08:playthrough']);
assert.ok(pkg.scripts['audit:v08']);

// Round A: v0.3 gameplay contract must survive v0.8 presentation changes.
const initial = read('src/game/initialState.ts');
assert.match(initial, /investigationPoints:\s*3/);
const chars = read('src/content/guandu/characters.ts');
for (const name of ['陆淳','郑禾','赵简','杜衡']) assert.ok(chars.includes(name), `missing core character ${name}`);
const baits = read('src/content/guandu/baits.ts');
for (const channel of ["channel: 'lu'", "channel: 'zheng'", "channel: 'zhao'", "channel: 'du'"]) assert.ok(baits.includes(channel), `missing bait channel ${channel}`);
const endings = read('src/content/guandu/endings.ts');
for (const owner of ['canghe','shuoyuan','lishe','destroyed']) assert.ok(endings.includes(owner), `missing truth owner ${owner}`);

// Round B: v0.8 interaction contract.
const shell = read('src/features/scenes/GameShell.tsx');
assert.ok(shell.includes('CaseNavigator'));
assert.ok(shell.includes('SceneRecovery'));
const dialogue = read('src/features/scenes/DialogueScene.tsx');
assert.ok(dialogue.includes('DialogueCharacterCard'));
const characterCard = read('src/features/scenes/DialogueCharacterCard.tsx');
assert.ok(characterCard.includes('dialogue-character-card__mood'), 'character cards must expose visible mood/state');
const recovery = read('src/features/ui/SceneRecovery.tsx');
assert.ok(!recovery.includes('记录编号：{sceneId}'), 'recovery UI must not expose internal scene id');
assert.ok(!recovery.includes('sceneId'), 'recovery component should not require sceneId for player-facing UI');

// Active major actions should use the v0.8 control system rather than legacy scene-button.
for (const file of ['StoryScene.tsx','CampScene.tsx','DeductionBoardScene.tsx','NetworkInvestigationScene.tsx','NetworkDeductionScene.tsx','BaitScene.tsx','EnemyReportScene.tsx','FinalReportScene.tsx','EndingScene.tsx']) {
  const src = read(`src/features/scenes/${file}`);
  assert.ok(!src.includes('className="scene-button'), `${file} still contains legacy action buttons`);
}
const tutorialOverlay = read('src/features/tutorial/TutorialOverlay.tsx');
assert.ok(!tutorialOverlay.includes('className="scene-button'), 'TutorialOverlay still contains legacy action buttons');

// Round C: assets and audio.
for (const asset of ['audience-caocao.png','night-ambush.png','zhao-interrogation.png','evidence-desk.png']) assert.ok(exists(`public/assets/cg/${asset}`), `missing CG ${asset}`);
for (const portrait of ['caocao.jpg','zhao.jpg','lu.webp','zheng.webp','du.webp']) assert.ok(exists(`public/assets/portraits/${portrait}`), `missing portrait ${portrait}`);
for (const wav of ['ui-click.wav','ui-confirm.wav','ui-back.wav','journal-tab.wav','paper-open.wav','paper-close.wav','seal.wav','tent-enter.wav','character-enter.wav','evidence-place.wav','deduction-link.wav','warning.wav','task-unlock.wav']) assert.ok(exists(`public/assets/audio/${wav}`), `missing audio ${wav}`);
for (const wav of ['caocao-rise.wav','caocao-truth.wav','officer-salute.wav','zhao-confess.wav','lu-confess.wav','zheng-confess.wav','du-confess.wav']) assert.ok(exists(`public/assets/voice/${wav}`), `missing local voice ${wav}`);

// Round C2: v0.8.2 history + placeholder voice upgrade.
const historical = read('src/content/guandu/historicalContext.ts');
for (const term of ['封检','邮书','符','出入簿','车马簿']) assert.ok(historical.includes(term), `missing historical term ${term}`);
for (const role of ['邮驿主吏','军粮书佐','军书佐','营外行商']) assert.ok(chars.includes(role), `missing historicalized role ${role}`);
const audioEngine = read('src/features/audio/GameAudio.tsx');
for (const persona of ['caocao','zhao','lu','zheng','du']) assert.ok(audioEngine.includes(`${persona}: {`), `missing voice profile ${persona}`);

// Round D: documentation must tell the truth about the current v0.8 delivery.
const design = readProject('官渡密报_产品与技术设计草案_v0.3.md');
assert.match(design, /v0\.8/);
assert.match(design, /军机案牍式/);
assert.match(design, /完整导航快照/);
assert.match(design, /一句话.*人物卡/);
const audit = readProject(fs.existsSync(path.join(projectRoot,'FINAL_DELIVERY_AUDIT_v0.8.3.md')) ? 'FINAL_DELIVERY_AUDIT_v0.8.3.md' : 'FINAL_DELIVERY_AUDIT_v0.8.2.md');
assert.match(audit, /已完成/);
assert.match(audit, /部分完成/);
assert.match(audit, /未完成/);
assert.match(audit, /需要用户支持/);

// Round E: user-facing naming, tutorials and character coverage.
const tutorial = read('src/features/tutorial/tutorialLessons.ts');
assert.equal((tutorial.match(/id: 'lesson-/g) || []).length, 9, 'v0.8 must expose nine tutorial lessons');
const dialogueChars = read('src/features/scenes/dialogueCharacters.ts');
for (const id of ['caocao','zhao','lu','zheng','du']) assert.ok(dialogueChars.includes(`${id}:`), `missing presentation character ${id}`);
const productionCorpus = [read('src/features/scenes/EndingScene.tsx'), read('src/features/scenes/EnemyReportScene.tsx'), read('src/content/guandu/endings.ts'), read('src/content/guandu/claims.ts')].join('\n');
assert.ok(!/沧河军|朔原军/.test(productionCorpus), 'player-facing faction labels must be Cao/Yuan aligned');
assert.match(productionCorpus, /曹军/);
assert.match(productionCorpus, /袁军/);

console.log(`v${pkg.version} final audit contract passed`);
