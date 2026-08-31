const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');const s=fs.readFileSync(path.join(root,'src/features/scenes/AudienceScene.tsx'),'utf8');const f=[];
if(!/className="v09-audience"/.test(s))f.push('missing v09 audience stage');
if(/audience-scene__heading|audience-scene__backdrop|audience-stage__person/.test(s))f.push('legacy concept-board audience layout remains');
if(!/assets\/cg\/audience-caocao\.png/.test(s))f.push('audience CG is not primary stage');
if(!/ChoiceStrip/.test(s))f.push('choice system missing');
if(!/GameBadge/.test(s))f.push('attitude should be compact badge');
if(f.length){console.error('v0.9 audience layout FAILED\n- '+f.join('\n- '));process.exit(1)}console.log('v0.9 audience layout OK');
