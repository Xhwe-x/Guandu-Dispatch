const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname,'..');
const files = [
  'src/content/guandu/documents.ts',
  'src/features/scenes/EnemyReportScene.tsx',
  'src/features/scenes/NetworkInvestigationScene.tsx',
  'src/features/scenes/NetworkDeductionScene.tsx',
  'src/features/scenes/BaitScene.tsx',
].map(f=>[f,fs.readFileSync(path.join(root,f),'utf8')]);
for (const [file,text] of files) {
  for (const stale of ['朔原','role: \'驿丞\'','role: \'粮官\'','role: \'传令书吏\'']) {
    if (text.includes(stale)) throw new Error(`${file} still contains stale player-facing term: ${stale}`);
  }
}
const docs = files.find(([f])=>f.endsWith('documents.ts'))[1];
for (const title of ['粮秣出入簿（原簿）','车马修治簿','邮舍出入簿','商价簿']) {
  if (!docs.includes(title)) throw new Error(`historical document title missing: ${title}`);
}
console.log('v0.8.2 historical copy contract OK');
