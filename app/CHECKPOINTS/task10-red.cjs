const fs=require('fs');const assert=require('assert');
let ts;try{ts=require('typescript')}catch{ts=require(require('child_process').execSync('npm root -g').toString().trim()+'/typescript')}
for(const ext of ['.ts','.tsx']) require.extensions[ext]=function(mod,filename){const source=fs.readFileSync(filename,'utf8');const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},fileName:filename});mod._compile(out.outputText,filename)};
const feedback=require('../src/game/rules/enemyFeedback.ts');
assert.equal(typeof feedback.applyEnemyFeedbackResolution,'function','enemy feedback must expose one rule-layer state transition');
console.log('task10 integration rule contract ready');
