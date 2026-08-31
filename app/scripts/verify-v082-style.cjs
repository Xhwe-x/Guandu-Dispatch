const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname,'../src/features/scenes/v08.css'),'utf8');
for (const selector of ['.character-portrait--lu .character-portrait__asset','.character-portrait--zheng .character-portrait__asset','.character-portrait--du .character-portrait__asset','.v08-person-dossier__history']) {
  if (!css.includes(selector)) throw new Error(`missing v0.8.2 visual treatment: ${selector}`);
}
console.log('v0.8.2 style contract OK');
