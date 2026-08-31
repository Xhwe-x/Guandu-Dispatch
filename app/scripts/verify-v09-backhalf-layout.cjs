const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const checks=[
  ['src/features/scenes/BaitScene.tsx','v095-bait-experiment','bait-scene__heading'],
  ['src/features/scenes/EnemyReportScene.tsx','v09-enemy-report','enemy-report-scene'],
  ['src/features/scenes/FinalReportScene.tsx','v09-final-report','final-report-scene__heading'],
  ['src/features/scenes/EndingScene.tsx','v09-ending','ending-scene__heading'],
];
const failures=[];
for(const [file,required,legacy] of checks){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  if(!source.includes(required)) failures.push(`${file}: missing ${required}`);
  if(source.includes(legacy)) failures.push(`${file}: legacy layout remains (${legacy})`);
}
const bait=fs.readFileSync(path.join(root,'src/features/scenes/BaitScene.tsx'),'utf8');
if(!bait.includes('GameCard')) failures.push('bait must use compact GameCard composition');
const report=fs.readFileSync(path.join(root,'src/features/scenes/FinalReportScene.tsx'),'utf8');
if(!report.includes('GameCard')) failures.push('final report must use GameCard composition');
if(failures.length){console.error('v0.9 backhalf layout FAILED\n- '+failures.join('\n- '));process.exit(1)}
console.log('v0.9 backhalf layout OK');
