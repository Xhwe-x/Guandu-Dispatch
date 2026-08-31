const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');const f=[];
const domain=read('src/game/domain.ts'), reducer=read('src/game/reducer.ts'), schema=read('src/game/contentSchema.ts'), init=read('src/game/initialState.ts'), nav=read('src/features/scenes/CaseNavigator.tsx'), opening=read('src/features/scenes/OpeningFlowScene.tsx');
if(!/DialogueHistoryEntry/.test(domain)||!/dialogueHistory: DialogueHistoryEntry\[\]/.test(domain))f.push('state has no dialogue history');
if(!/RECORD_DIALOGUE/.test(reducer))f.push('reducer has no RECORD_DIALOGUE');
if(!/dialogueHistory:[\s\S]{0,140}default\(\[\]\)/.test(schema))f.push('schema does not default old saves to empty dialogue history');
if(!/dialogueHistory: \[\]/.test(init))f.push('initial state lacks history');
if(!/id:\s*'history',\s*label:\s*'历史'/.test(nav))f.push('dossier lacks history tab');
if(!/RECORD_DIALOGUE/.test(opening))f.push('opening dialogue is not recorded');
if(f.length){console.error('v0.9 dialogue history FAILED\n- '+f.join('\n- '));process.exit(1)}console.log('v0.9 dialogue history OK');
