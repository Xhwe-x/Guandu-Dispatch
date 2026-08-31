const fs=require('fs');const assert=require('assert');
let ts;try{ts=require('typescript')}catch{ts=require(require('child_process').execSync('npm root -g').toString().trim()+'/typescript')}
for(const ext of ['.ts','.tsx']) require.extensions[ext]=function(mod,filename){const source=fs.readFileSync(filename,'utf8');const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},fileName:filename});mod._compile(out.outputText,filename)};
const {minimalContent}=require('../src/game/fixtures.ts');
const {evaluateBaitExperiment}=require('../src/game/rules/bait.ts');
assert.throws(()=>evaluateBaitExperiment(minimalContent,{
  knownClaimIds:['claim-zhao-time','claim-du-route','claim-bridge-open'],
  theoryEdgeIds:['edge-time-zhao','edge-route-du','edge-integrate-du','edge-price-yuan'],
  baitIds:['bait-zhao-yin','bait-du-north-bridge'],
  realPlan:{route:'northBridge',time:'yin'},
}),/真实计划不同/,'an experiment must reject core fake signals identical to the real plan');
console.log('bait distinguishability contract passed');
