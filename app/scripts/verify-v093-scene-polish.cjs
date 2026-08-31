const fs=require('fs');const path=require('path');const assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
assert.ok(fs.existsSync(path.join(root,'src/ui/game/SceneFocusHeader.tsx')),'SceneFocusHeader missing');
const targets=['FirstEvidenceScene.tsx','FirstDeductionScene.tsx','NetworkInvestigationScene.tsx','NetworkDeductionScene.tsx','BaitScene.tsx','EnemyReportScene.tsx','FinalReportScene.tsx','EndingScene.tsx'];
for(const file of targets){const src=read(`src/features/scenes/${file}`);assert.match(src,/SceneFocusHeader/,`${file} must use shared scene focus header`);}
const css=read('src/ui/game/game.css');assert.match(css,/\.v093-scene-focus/,'shared scene focus styles missing');
console.log('v0.9.3 key-scene polish contract OK');
