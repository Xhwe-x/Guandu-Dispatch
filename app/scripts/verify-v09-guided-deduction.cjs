const fs=require('fs');function r(p){return fs.existsSync(p)?fs.readFileSync(p,'utf8'):''}function m(v,s){if(!v){console.error('FAIL:',s);process.exitCode=1}}
const evidence=r('src/features/scenes/FirstEvidenceScene.tsx');const deduction=r('src/features/scenes/FirstDeductionScene.tsx');const shell=r('src/features/scenes/GameShell.tsx');const scenes=r('src/game/scenes.ts');
m(evidence.includes('claim-zhao-denial')&&evidence.includes('claim-zhao-copied-order'),'first evidence must expose only Zhao denial and assembly record claim');
m(deduction.includes("setChoice('supports')")&&deduction.includes("setChoice('refutes')")&&deduction.includes('相互印证')&&deduction.includes('存在矛盾'),'guided deduction must offer supports/refutes through the unified choice controls');
m(deduction.includes("kind:'refutes'")&&deduction.includes("slot:'leakedInfo'"),'guided contradiction relation missing');
m(shell.includes("sceneId === 'first-evidence'")&&shell.includes("sceneId === 'first-deduction'"),'GameShell routes missing');
m(scenes.includes("'first-evidence'")&&scenes.includes("'first-deduction'"),'scene ids missing');
if(process.exitCode)process.exit(process.exitCode);console.log('v0.9 guided deduction contract OK');
