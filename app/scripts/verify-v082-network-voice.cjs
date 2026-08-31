const fs = require('fs');
const path = require('path');
const text = fs.readFileSync(path.join(__dirname,'../src/features/scenes/NetworkInvestigationScene.tsx'),'utf8');
for (const item of ['dossierVoiceLines','封检、邮书、驿马都有簿可查','车损是我的过失','商人走的路','speak(voiceLine, character.voice)']) {
  if (!text.includes(item)) throw new Error(`network half-voice missing: ${item}`);
}
console.log('v0.8.2 network voice contract OK');
