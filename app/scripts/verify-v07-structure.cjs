const fs = require('fs');
const path = require('path');
const assert = require('assert');

const appRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(appRoot, '..');
const read = (relative) => fs.readFileSync(path.resolve(appRoot, relative), 'utf8');

const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
assert.equal(pkg.version, '0.7.0', 'package.json must be v0.7.0');
assert.equal(lock.version, pkg.version, 'package-lock root version must match package.json');
assert.equal(lock.packages[''].version, pkg.version, 'package-lock package version must match package.json');

const scenes = read('src/game/scenes.ts');
assert.match(scenes, /'audience'/, 'audience scene must be part of GameSceneId');

const shell = read('src/features/scenes/GameShell.tsx');
assert.match(shell, /<AudienceScene/, 'GameShell must route the audience scene');
assert.match(shell, /visitId: 'first-report'/, 'first Cao Cao briefing must be connected');
assert.match(shell, /visitId: 'final-report'/, 'second Cao Cao briefing must be connected');
assert.match(shell, /<CaseNavigator/, 'global case navigation must be present');

const navigator = read('src/features/scenes/CaseNavigator.tsx');
for (const label of ['返回', '案卷', '提示', '人物与密报', '玩法教程', '声音 / 辅助']) {
  assert.ok(navigator.includes(label), `CaseNavigator missing: ${label}`);
}
assert.match(navigator, /safeReturnMap/, 'safe return map must exist for dead-end recovery');

const tutorials = read('src/features/tutorial/tutorialLessons.ts');
for (const id of [
  'lesson-navigation', 'lesson-document', 'lesson-handwriting', 'lesson-interrogation',
  'lesson-deduction', 'lesson-network', 'lesson-bait', 'lesson-audience', 'lesson-final-report',
]) {
  assert.ok(tutorials.includes(id), `tutorial missing: ${id}`);
}

const links = read('src/content/guandu/taskLinks.ts');
for (const id of ['zhao', 'lu', 'zheng', 'du']) {
  assert.ok(links.includes(`characterId: '${id}'`), `character task link missing: ${id}`);
}

const audiences = read('src/content/guandu/audiences.ts');
for (const id of ['brief-cautious', 'brief-key-fact', 'brief-apology', 'brief-accuse-zhao', 'brief-evidence-chain', 'brief-coercion', 'brief-deeper-probe', 'brief-bait-proposal', 'final-close-network', 'final-differentiate', 'final-exploit']) {
  assert.ok(audiences.includes(`id: '${id}'`), `audience choice missing: ${id}`);
}

const designPath = path.resolve(projectRoot, '官渡密报_产品与技术设计草案_v0.3.md');
const design = fs.readFileSync(designPath, 'utf8');
for (const heading of ['# 25. 界面结构（v0.7）', '# 30.4 曹操阶段复命系统', '## 30.4.4 第一次觐见逐镜脚本（v0.7 实装基线）', '## 30.4.5 第二次觐见逐镜脚本（敌军回声后）']) {
  assert.ok(design.includes(heading), `design document missing section: ${heading}`);
}

console.log('v0.7 structure verification passed');
