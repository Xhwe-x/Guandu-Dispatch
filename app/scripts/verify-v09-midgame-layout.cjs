const fs=require('fs'),path=require('path'); const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const failures=[];
const shell=read('src/features/scenes/GameShell.tsx'); const inv=read('src/features/scenes/NetworkInvestigationScene.tsx'); const ded=read('src/features/scenes/NetworkDeductionScene.tsx');
if(!/v09-case-summary/.test(shell)) failures.push('case summary not migrated to v09');
if(/case-summary__embers|case-summary__sheet/.test(shell)) failures.push('legacy case summary visuals remain');
if(!/v09-network-investigation/.test(inv)) failures.push('network investigation not migrated');
if(/network-scene__heading/.test(inv)) failures.push('legacy network heading remains');
if(!/v095-theory-workspace/.test(ded)) failures.push('network deduction not migrated to persistent theory workspace');
if(/network-deduction__heading|theory-grid/.test(ded)) failures.push('legacy all-at-once deduction layout remains');
if(!/v095-theory-layout/.test(ded)||!/v095-theory-board/.test(ded)||!/v095-theory-gap/.test(ded)) failures.push('network deduction must expose palette, persistent board, and gap panel');
if(failures.length){console.error('v0.9 midgame layout FAILED\n- '+failures.join('\n- '));process.exit(1)}
console.log('v0.9 midgame layout OK');
