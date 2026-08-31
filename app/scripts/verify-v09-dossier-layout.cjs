const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');const s=fs.readFileSync(path.join(root,'src/features/scenes/CaseNavigator.tsx'),'utf8');const f=[];
if(/v08-person-grid|v08-person-dossier|v08-journal-task|v08-journal-list|v08-reasoning-page|v08-settings/.test(s))f.push('legacy v08 dossier page layouts remain');
if(/v09-dossier-tabs[\s\S]*?<button/.test(s))f.push('dossier tabs reimplement raw buttons');
if(!/v09-people-browser/.test(s))f.push('people dossier is not progressive browser');
if(!/GameCard/.test(s))f.push('dossier pages do not use v09 GameCard composition');
if(f.length){console.error('v0.9 dossier layout FAILED\n- '+f.join('\n- '));process.exit(1)}console.log('v0.9 dossier layout OK');
