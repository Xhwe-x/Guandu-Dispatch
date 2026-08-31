const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname,'..');
const nav = fs.readFileSync(path.join(root,'src/features/scenes/CaseNavigator.tsx'),'utf8');
for (const marker of ['CharacterPortrait', 'v083-person-portrait', "dialogueCharacterFor(link.characterId)", 'v083-person-portrait--caocao']) {
  if (!nav.includes(marker)) throw new Error(`dossier portrait integration missing: ${marker}`);
}
const css = fs.readFileSync(path.join(root,'src/features/scenes/v08.css'),'utf8');
for (const marker of ['.v083-person-portrait', '.v08-person-dossier[data-character="du"]']) {
  if (!css.includes(marker)) throw new Error(`dossier portrait style missing: ${marker}`);
}
console.log('v0.8.3 dossier portrait contract OK');
