const fs=require('fs'),path=require('path'); const root=path.resolve(__dirname,'..'); const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const shell=read('src/features/scenes/GameShell.tsx'), network=read('src/features/scenes/NetworkDeductionScene.tsx'), audience=read('src/features/scenes/AudienceScene.tsx'), nav=read('src/features/scenes/CaseNavigator.tsx'); const failures=[];
if(!/调查其他信息渠道/.test(shell)) failures.push('first Zhao summary must open other-character investigation, not Cao audience');
if(/case-summary[\s\S]{0,900}START_AUDIENCE/.test(shell)) failures.push('case-summary still starts Cao audience too early');
if(!/onComplete\('bait'\)/.test(network)) failures.push('supported network deduction must lead directly to theory-driven bait');
if(!/onComplete\(finalVisit \? 'final-report' : 'bait'\)/.test(audience)) failures.push('audience compatibility path must still resolve to bait/final report');
if(!/audience:\s*'enemy-report'/.test(nav)) failures.push('final Cao audience safe return must be enemy-report');
if(failures.length){console.error('v0.9 narrative order FAILED\n- '+failures.join('\n- '));process.exit(1)} console.log('v0.9 narrative order OK');
