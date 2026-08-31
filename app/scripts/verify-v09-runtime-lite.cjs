const fs=require('fs');const assert=require('assert');
let ts;try{ts=require('typescript')}catch{try{ts=require(require('child_process').execSync('npm root -g').toString().trim()+'/typescript')}catch{console.error('TypeScript is required for this deep verification. Run npm ci first, or install TypeScript globally.');process.exit(2)}}
for(const ext of ['.ts','.tsx']) require.extensions[ext]=function(mod,filename){const source=fs.readFileSync(filename,'utf8');const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},fileName:filename});mod._compile(out.outputText,filename)};
const {createInitialState}=require('../src/game/initialState.ts');
const {gameReducer}=require('../src/game/reducer.ts');
const {isStorySceneCompatible}=require('../src/game/presentationRecovery.ts');
const {migrateV4PresentationToV09,sanitizeV09Presentation,v09RecoverySceneForState,v09ChapterStartForStage}=require('../src/game/v09PresentationMigration.ts');

const initial=createInitialState();
assert.equal(initial.version,6);assert.equal(initial.presentation.sceneId,'title');assert.equal(initial.presentation.storySceneId,'prologue-background');
assert.equal(isStorySceneCompatible('opening','prologue-background'),true);assert.equal(isStorySceneCompatible('opening','camp-brief'),false);

const legacyPresentation={...initial.presentation,sceneId:'document',storySceneId:'intro-cg',beatIndex:2,sceneHistory:[{sceneId:'camp',storySceneId:'camp-brief',beatIndex:0}]};
const repaired=gameReducer({...initial,presentation:legacyPresentation},{type:'REPAIR_PRESENTATION'});
assert.equal(repaired.presentation.sceneId,'opening');assert.equal(repaired.presentation.storySceneId,'prologue-background');assert.deepEqual(repaired.presentation.sceneHistory,[]);

const safeMixed={...initial,presentation:{...initial.presentation,sceneId:'network-investigation',storySceneId:'case-summary',sceneHistory:[{sceneId:'document',storySceneId:'intro-cg',beatIndex:0},{sceneId:'case-summary',storySceneId:'case-summary',beatIndex:0}]},stage:'secrets'};
const safeRepaired=gameReducer(safeMixed,{type:'REPAIR_PRESENTATION'});
assert.equal(safeRepaired.presentation.sceneId,'network-investigation');assert.equal(safeRepaired.presentation.sceneHistory.length,1);assert.equal(safeRepaired.presentation.sceneHistory[0].sceneId,'case-summary');

const legacyDialogue={...initial,presentation:{...initial.presentation,sceneId:'dialogue',storySceneId:'zhao-introduction',beatIndex:0},readDocumentIds:['report-ambush']};
const migrated=migrateV4PresentationToV09(legacyDialogue);
assert.equal(migrated.sceneId,'opening');assert.equal(migrated.storySceneId,'zhao-first-dialogue');assert.deepEqual(migrated.sceneHistory,[]);

const stageChain={...initial,stage:'chain',extractedClaimIds:['claim-zhao-time','claim-du-route','claim-price-cipher'],presentation:{...initial.presentation,sceneId:'document'}};
assert.equal(v09RecoverySceneForState(stageChain),'network-deduction');
assert.equal(v09ChapterStartForStage('documents'),'opening');assert.equal(v09ChapterStartForStage('secrets'),'network-investigation');assert.equal(v09ChapterStartForStage('chain'),'network-deduction');assert.equal(v09ChapterStartForStage('bait'),'bait');assert.equal(v09ChapterStartForStage('report'),'final-report');assert.equal(v09ChapterStartForStage('ending'),'ending');

const sanitized=sanitizeV09Presentation({...safeMixed,presentation:{...safeMixed.presentation,sceneHistory:[{sceneId:'document',storySceneId:'intro-cg',beatIndex:0}]}});assert.deepEqual(sanitized.sceneHistory,[]);
console.log('v0.9 lightweight runtime migration/recovery verification passed');
