const fs=require('fs');const path=require('path');const assert=require('assert');
const root=path.resolve(__dirname,'../..');const app=path.resolve(__dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(app,'package.json'),'utf8'));const lock=JSON.parse(fs.readFileSync(path.join(app,'package-lock.json'),'utf8'));
assert.match(pkg.version,/^0\.9\.[0-5]$/);assert.equal(lock.version,pkg.version);assert.equal(lock.packages?.['']?.version,pkg.version);
for(const f of ['README.md','HANDOFF.md','官渡密报_v0.9_叙事流程与UI组件系统重构方案.md','官渡密报_产品与技术设计草案_v0.3.md','FINAL_DELIVERY_AUDIT_v0.9.md','UNFINISHED_WORK_REPORT_v0.9.md','官渡密报_v0.9.1_试玩问题与存档系统修订方案.md']) assert.ok(fs.existsSync(path.join(root,f)),`missing root delivery file: ${f}`);
for(const f of ['FINAL_DELIVERY_AUDIT_v0.8.md','FINAL_DELIVERY_AUDIT_v0.8.2.md','FINAL_DELIVERY_AUDIT_v0.8.3.md','UNFINISHED_WORK_REPORT_v0.7.md','官渡密报_v0.8_全局UI交互与体验重构方案.md']) assert.ok(!fs.existsSync(path.join(root,f)),`legacy v0.8 file should not remain at root: ${f}`);
assert.ok(fs.existsSync(path.join(root,'docs/archive/官渡密报_v0.8_全局UI交互与体验重构方案.md')),'legacy v0.8 design should be archived');
assert.match(pkg.scripts['verify:v09'],/verify-v09-save-migration/);assert.match(pkg.scripts['verify:v09'],/verify-v09-recovery-contract/);assert.match(pkg.scripts['verify:v09:deep'],/verify-v09-runtime-lite/);assert.match(pkg.scripts['verify:v09:deep'],/verify-v09-syntax/);
console.log('v0.9 delivery contract OK');
