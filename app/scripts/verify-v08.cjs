const fs=require('fs');
const path=require('path');
const assert=require('assert');
const ts=require('typescript');
for (const ext of ['.ts','.tsx']) require.extensions[ext]=function(mod,filename){const source=fs.readFileSync(filename,'utf8');const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},fileName:filename});mod._compile(out.outputText,filename)};
const {createInitialState}=require('../src/game/initialState.ts');
const {gameReducer}=require('../src/game/reducer.ts');
const {recoverPresentation,isStorySceneCompatible,snapshotPresentation}=require('../src/game/presentationRecovery.ts');
const {migrateGameState}=require('../src/game/contentSchema.ts');

const initial=createInitialState();
assert.equal(initial.version,4);
assert.deepEqual(initial.presentation.sceneHistory,[]);

const broken={...initial.presentation,sceneId:'dialogue',storySceneId:'camp-brief',beatIndex:99};
assert.equal(isStorySceneCompatible('dialogue','camp-brief'),false);
const repaired=recoverPresentation(broken);
assert.equal(repaired.sceneId,'dialogue');
assert.equal(repaired.storySceneId,'zhao-introduction');
assert.ok(repaired.beatIndex>=0 && repaired.beatIndex<=2);
assert.ok(repaired.dialogueNodeId);

let state=gameReducer(initial,{type:'SET_STORY_POSITION',storySceneId:'intro-cg',beatIndex:2});
state=gameReducer(state,{type:'SET_SCENE',sceneId:'story'});
state=gameReducer(state,{type:'SET_STORY_POSITION',storySceneId:'intro-cg',beatIndex:3});
state=gameReducer(state,{type:'SET_SCENE',sceneId:'camp'});
assert.equal(state.presentation.sceneHistory.length,1);
const snap=state.presentation.sceneHistory[0];
assert.equal(snap.sceneId,'story');
assert.equal(snap.storySceneId,'intro-cg');
assert.equal(snap.beatIndex,3);
state=gameReducer(state,{type:'GO_BACK'});
assert.equal(state.presentation.sceneId,'story');
assert.equal(state.presentation.storySceneId,'intro-cg');
assert.equal(state.presentation.beatIndex,3);


const legacyV3={
  version:3,
  tutorial:{step:'investigateHandwriting',startedAtLeastOnce:true,enabled:true,seenLessonIds:[]},
  audio:{enabled:true,voiceEnabled:true,volume:.72},
  presentation:{
    sceneId:'dialogue',sceneHistory:['document'],storySceneId:'camp-brief',beatIndex:99,
    documentFindingIds:['ambush-location','ambush-time'],handwritingFindingIds:[],
    interrogation:{evidenceClaimId:'claim-shuoyuan-received',tone:'calm',attempts:0},deduction:{},networkTheory:{},
    reportDraft:{leakedInfo:[],sourceCharacterIds:[],evidenceClaimIds:[],handling:'differentiate'},
    audience:{visitId:'first-report',shotIndex:0,attitude:'observing',choiceIds:[]}
  },
  stage:'documents',investigationPoints:3,readDocumentIds:['report-ambush'],extractedClaimIds:['claim-shuoyuan-received'],
  relationships:[],completedInvestigationIds:[],personStates:{zhao:'cooperative'},selectedBaitIds:[],hintUsage:{}
};
const migrated=migrateGameState(legacyV3);
assert.equal(migrated.version,4);
assert.equal(migrated.presentation.sceneId,'dialogue');
assert.equal(migrated.presentation.storySceneId,'zhao-introduction');
assert.equal(migrated.presentation.sceneHistory[0].sceneId,'document');

const snapped=snapshotPresentation({...state.presentation,dialogueNodeId:'intro-aftermath'});
assert.equal(snapped.dialogueNodeId,'intro-aftermath');
console.log('v0.8.2 presentation + v3 migration runtime verification passed');
