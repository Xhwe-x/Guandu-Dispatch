const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');const failures=[];
for(const file of ['src/features/scenes/InterrogationScene.tsx','src/features/scenes/FirstDeductionScene.tsx']){const s=fs.readFileSync(path.join(root,file),'utf8');if(/<button\b|<label\s+data-selected/.test(s))failures.push(`${file}: raw interactive controls remain`);}
if(failures.length){console.error('v0.9 control discipline FAILED\n- '+failures.join('\n- '));process.exit(1)}console.log('v0.9 control discipline OK');
