const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname,'..');
const interrogation = fs.readFileSync(path.join(root,'src/features/scenes/InterrogationScene.tsx'),'utf8');
for (const text of ['家人在他们手里','时辰是我泄出去的',"speak(voiceLine, 'zhao')"]) {
  if (!interrogation.includes(text)) throw new Error(`interrogation half-voice missing: ${text}`);
}
const audience = fs.readFileSync(path.join(root,'src/features/scenes/AudienceScene.tsx'),'utf8');
if (!audience.includes("phase === 'order'")) throw new Error('audience order voice trigger missing');
if (!audience.includes("speak(orderVoice, 'caocao')")) throw new Error('audience Cao Cao order voice missing');
console.log('v0.8.2 half-voice contract OK');
