const fs=require('fs');
const path=require('path');
function read(p){return fs.readFileSync(path.join(process.cwd(),p),'utf8')}
function must(cond,msg){if(!cond){console.error('FAIL:',msg);process.exitCode=1}}
const tokens=fs.existsSync('src/ui/tokens.css')?read('src/ui/tokens.css'):'';
const btn=fs.existsSync('src/ui/primitives/GameButton.tsx')?read('src/ui/primitives/GameButton.tsx'):'';
const header=fs.existsSync('src/ui/game/SceneHeader.tsx')?read('src/ui/game/SceneHeader.tsx'):'';
must(tokens.includes('--font-scene-title: clamp(22px'), 'scene title token must start at 22px clamp');
must(tokens.includes('--font-dialogue: clamp(16px'), 'dialogue token missing');
must(tokens.includes('--scene-header-height: 52px'), '52px scene header token missing');
must(tokens.includes('--space-1: 4px') && tokens.includes('--space-8: 32px'), '4px spacing scale missing');
must(btn.includes("'primary' | 'secondary' | 'ghost' | 'danger' | 'evidence'"), 'GameButton variants missing');
must(btn.includes("'sm' | 'md' | 'lg' | 'icon'"), 'GameButton sizes missing');
must(header.includes('scene-header'), 'SceneHeader component missing');
if(process.exitCode) process.exit(process.exitCode); console.log('v0.9 UI contract OK');
