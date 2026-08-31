const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const chars = fs.readFileSync(path.join(root,'src/content/guandu/characters.ts'),'utf8');
for (const role of ['邮驿主吏','军粮书佐','军书佐','营外行商']) {
  if (!chars.includes(role)) throw new Error(`missing historicalized role: ${role}`);
}
const d = fs.readFileSync(path.join(root,'src/features/scenes/dialogueCharacters.ts'),'utf8');
for (const voice of ["voice: 'lu'","voice: 'zheng'","voice: 'zhao'","voice: 'du'","voice: 'caocao'"]) {
  if (!d.includes(voice)) throw new Error(`missing character voice profile: ${voice}`);
}
const ga = fs.readFileSync(path.join(root,'src/features/audio/GameAudio.tsx'),'utf8');
for (const name of ['voiceProfiles','preferredNames','getVoices']) {
  if (!ga.includes(name)) throw new Error(`voice engine upgrade missing: ${name}`);
}
console.log('v0.8.2 roles/voice contract OK');
