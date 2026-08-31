const fs=require('fs');
function read(p){return fs.existsSync(p)?fs.readFileSync(p,'utf8'):''}
function must(v,m){if(!v){console.error('FAIL:',m);process.exitCode=1}}
const story=read('src/content/guandu/story.ts'); const types=read('src/game/storyTypes.ts'); const shell=read('src/features/scenes/GameShell.tsx'); const opening=read('src/features/scenes/OpeningFlowScene.tsx');
for (const id of ['prologue-background','player-identity','basic-onboarding','zhao-first-intro','zhao-first-dialogue']) must(story.includes(id),`missing opening story scene ${id}`);
for (const kind of ["'narration'","'character-intro'","'tutorial'","'transition'"]) must(types.includes(kind),`missing StoryBeat type ${kind}`);
must(shell.includes("sceneId === 'opening'"),'GameShell must route opening');
must(story.includes('接下此案') && story.includes('听取口供'),'opening data missing required actions');
if(process.exitCode)process.exit(process.exitCode);console.log('v0.9 opening contract OK');
