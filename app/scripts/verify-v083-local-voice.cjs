const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname,'..');
const audio = fs.readFileSync(path.join(root,'src/features/audio/GameAudio.tsx'),'utf8');
const assetsFile = path.join(root,'src/features/audio/voiceAssets.ts');
if (!fs.existsSync(assetsFile)) throw new Error('voiceAssets.ts missing');
const assets = fs.readFileSync(assetsFile,'utf8');
for (const marker of ['localVoiceAssetFor', 'caocao-final-order.wav', 'zhao-family.wav', 'lu-intro.wav', 'zheng-intro.wav', 'du-intro.wav']) {
  if (!assets.includes(marker)) throw new Error(`local voice asset mapping missing: ${marker}`);
}
for (const marker of ['voiceAssetRef', 'localVoiceAssetFor', 'new Audio(localAsset)']) {
  if (!audio.includes(marker)) throw new Error(`GameAudio local voice playback missing: ${marker}`);
}
const required = ['caocao-rise.wav','caocao-truth.wav','officer-salute.wav','zhao-confess.wav','lu-confess.wav','zheng-confess.wav','du-confess.wav'];
for (const file of required) {
  if (!fs.existsSync(path.join(root,'public/assets/voice',file))) throw new Error(`voice WAV missing: ${file}`);
}
console.log('v0.8.3 local voice contract OK');
