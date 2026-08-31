const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
const hist=fs.readFileSync(path.join(root,'src/content/guandu/historicalContext.ts'),'utf8');
for (const marker of ['封检题署','以邮行','驰行','传马','官渡与延津','乌巢']) {
  if(!hist.includes(marker)) throw new Error(`deeper historical context missing: ${marker}`);
}
const nav=fs.readFileSync(path.join(root,'src/features/scenes/CaseNavigator.tsx'),'utf8');
if(!nav.includes('传递方式')) throw new Error('tutorial missing postal-method heading');
console.log('v0.8.3 deeper historical context contract OK');
