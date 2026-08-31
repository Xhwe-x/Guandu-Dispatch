const fs = require('fs');
const path = require('path');
const nav = fs.readFileSync(path.join(__dirname,'../src/features/scenes/CaseNavigator.tsx'),'utf8');
for (const text of ['historicalDocumentLexicon','guanduGeographyNotes','制度与文书速查','官渡地理说明']) {
  if (!nav.includes(text)) throw new Error(`historical glossary UI missing: ${text}`);
}
console.log('v0.8.2 glossary contract OK');
