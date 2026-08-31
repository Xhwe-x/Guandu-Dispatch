const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const required = ['lu.webp','zheng.webp','du.webp'];
for (const file of required) {
  const p = path.join(root, 'public/assets/portraits', file);
  if (!fs.existsSync(p)) throw new Error(`missing portrait: ${file}`);
  if (fs.statSync(p).size < 50000) throw new Error(`portrait too small: ${file}`);
}
const portrait = fs.readFileSync(path.join(root, 'src/features/scenes/CharacterPortrait.tsx'), 'utf8');
for (const id of ['lu','zheng','du']) {
  if (!portrait.includes(`${id}: '/assets/portraits/${id}.webp'`)) throw new Error(`portrait mapping missing: ${id}`);
}
const hist = fs.readFileSync(path.join(root, 'src/content/guandu/historicalContext.ts'), 'utf8');
for (const term of ['封检','出入簿','车马簿','邮书','符']) {
  if (!hist.includes(term)) throw new Error(`historical term missing: ${term}`);
}
console.log('v0.8.2 portrait/history contract OK');
