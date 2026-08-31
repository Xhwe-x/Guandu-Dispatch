const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname,'..');
const nav = fs.readFileSync(path.join(root,'src/features/scenes/CaseNavigator.tsx'),'utf8');
if (!nav.includes('historicalRoleNotes')) throw new Error('case dossier does not import historicalRoleNotes');
if (!nav.includes('制度注')) throw new Error('case dossier lacks system-history note');
const portrait = fs.readFileSync(path.join(root,'src/features/scenes/CharacterPortrait.tsx'),'utf8');
for (const role of ['邮驿主吏','军粮书佐','营外行商','军书佐']) {
  if (!portrait.includes(role)) throw new Error(`portrait role label not updated: ${role}`);
}
const tasks = fs.readFileSync(path.join(root,'src/content/guandu/taskLinks.ts'),'utf8');
for (const text of ['封检与邮书','车马簿','军书权限','营外物流']) {
  if (!tasks.includes(text)) throw new Error(`task history wording missing: ${text}`);
}
console.log('v0.8.2 dossier/history contract OK');
