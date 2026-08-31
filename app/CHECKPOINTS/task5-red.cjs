const fs=require('fs');
const caseNav=fs.readFileSync('src/features/scenes/CaseNavigator.tsx','utf8');
const hasObjective=caseNav.includes('ObjectiveRail');
const hasKnowledge=caseNav.includes('KnowledgeStatusBadge');
const hasActions=/前去询问/.test(caseNav)&&/加入推演/.test(caseNav);
if(!hasObjective||!hasKnowledge||!hasActions){console.error({hasObjective,hasKnowledge,hasActions});process.exit(1)}
console.log('task5 contract PASS');
