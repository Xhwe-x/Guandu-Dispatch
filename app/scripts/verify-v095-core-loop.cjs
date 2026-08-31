const fs=require('fs');const path=require('path');
function read(p){return fs.existsSync(p)?fs.readFileSync(p,'utf8'):''}
function ok(value,message){if(!value){console.error('FAIL:',message);process.exitCode=1}}
const domain=read('src/game/domain.ts');
const initial=read('src/game/initialState.ts');
const schema=read('src/game/contentSchema.ts');
const persistence=read('src/game/persistence.ts');
const theory=read('src/game/rules/theory.ts');
const deduction=read('src/features/scenes/NetworkDeductionScene.tsx');
const bait=read('src/game/rules/bait.ts');
const feedback=read('src/game/rules/enemyFeedback.ts');
const dossier=read('src/features/scenes/CaseNavigator.tsx');
const enemy=read('src/features/scenes/EnemyReportScene.tsx');
const pkg=JSON.parse(read('package.json')||'{}');
const required=[
  'src/game/coreLoopSelectors.ts',
  'src/game/rules/knowledge.ts',
  'src/game/rules/evidenceReaction.ts',
  'src/game/rules/theory.ts',
  'src/game/rules/guidance.ts',
  'src/game/rules/bait.ts',
  'src/game/rules/enemyFeedback.ts',
  'src/ui/game/ObjectiveRail.tsx',
  'src/ui/game/KnowledgeStatusBadge.tsx',
  'src/features/scenes/CoreLoopPlaythrough.test.tsx',
];
ok(pkg.version==='0.9.5','package version must be 0.9.5');
ok(fs.existsSync('../FINAL_DELIVERY_AUDIT_v0.9.5.md'),'final delivery audit must exist');
ok(/v0\.9\.5 Core Experience Pass/.test(read('../官渡密报_产品与技术设计草案_v0.3.md')),'product draft must declare v0.9.5 Core Experience Pass');
ok(/version:\s*6/.test(domain),'GameState.version must be 6');
ok(/version:\s*6/.test(initial),'initial state must be version 6');
ok(/version:\s*z\.literal\(6\)/.test(schema)&&/LegacyGameStateV5Schema/.test(schema),'schema must accept v6 and retain v5 migration input');
ok(/parsed\.version\s*!==\s*6/.test(persistence),'loader must explicitly accept v6');
for(const file of required) ok(fs.existsSync(file),`missing ${file}`);
ok(!/questions\s*:\s*Array<\{\s*key:\s*TheoryKey/.test(deduction),'NetworkDeduction must not use old three-answer question model');
ok(/TheoryGap/.test(theory)&&/missing-route/.test(theory)&&/unsupported-edge/.test(theory)&&/conflict/.test(theory),'Theory rules must expose explainable gaps');
ok(!/length\s*!==\s*4|length\s*===\s*4/.test(bait),'bait rule must not require exactly four channels');
ok(/赵简/.test(bait)&&/杜衡/.test(bait)&&/真实计划不同/.test(bait),'bait experiment must require two core channels and distinguishable fake signals');
ok(/applyEnemyFeedbackResolution/.test(feedback),'enemy feedback must have a rule-layer state transition');
ok(/ObjectiveRail/.test(dossier)&&/KnowledgeStatusBadge/.test(dossier),'CaseNavigator must render objective and knowledge status');
ok(/selectedDossierTarget/.test(dossier)&&/gap/.test(dossier)&&/前去询问/.test(dossier)&&/查看原件/.test(dossier)&&/加入推演/.test(dossier),'dossier must provide reverse navigation actions and gap handling');
ok(/回案卷继续调查/.test(enemy)&&/network-investigation/.test(enemy),'unverified enemy feedback must provide a return-to-investigation route');
ok(/theoryVerified/.test(enemy)&&/final-report/.test(enemy),'final report route must be gated by verified theory');
if(process.exitCode)process.exit(process.exitCode);
console.log('v0.9.5 core-loop delivery contract passed');
