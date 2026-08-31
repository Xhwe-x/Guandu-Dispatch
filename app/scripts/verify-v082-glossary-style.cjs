const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname,'../src/features/scenes/v08.css'),'utf8');
if (!css.includes('.v082-history-guide')) throw new Error('history guide styling missing');
if (!css.includes('.v082-history-guide ul')) throw new Error('history guide list styling missing');
console.log('v0.8.2 glossary style contract OK');
