const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const shell=read('src/features/scenes/GameShell.tsx');
const firstEvidence=read('src/features/scenes/FirstEvidenceScene.tsx');
const firstDeduction=read('src/features/scenes/FirstDeductionScene.tsx');
const legacyButton=read('src/features/ui/GameButton.tsx');
const legacyIcon=read('src/features/ui/GameIconButton.tsx');
const v09=read('src/features/scenes/v09.css');
const title=read('src/features/scenes/TitleScene.tsx');
const gameCss=read('src/ui/game/game.css');
const opening=read('src/features/scenes/OpeningFlowScene.tsx');
const failures=[];
if(/TutorialOverlay|tutorialLessonForScene/.test(shell)) failures.push('legacy automatic TutorialOverlay still mounted');
if(!/import '\.\/v09\.css';/.test(shell)) failures.push('v09.css is not imported last by GameShell');
if(/<SceneHeader/.test(firstEvidence)||/<SceneHeader/.test(firstDeduction)) failures.push('guided scenes duplicate the global SceneHeader');
if(!/ui\/primitives\/GameButton/.test(legacyButton)) failures.push('legacy GameButton is not bridged to v0.9 primitive');
if(!/ui\/primitives\/GameButton/.test(legacyIcon)) failures.push('legacy GameIconButton is not bridged to v0.9 primitive');
if(!/prefers-reduced-motion/.test(v09)) failures.push('missing reduced motion contract');
if(!/max-width:\s*1366px/.test(v09)) failures.push('missing 1366 responsive contract');
if(!/title-scene__v09/.test(title)) failures.push('title scene has not been reset to v0.9 layout');
if(/v09-character-intro__copy h1\{[^}]*42px/.test(gameCss)) failures.push('character intro still uses oversized 42px name treatment');
// 证据桌概念图带烘焙标签，只允许在压暗+模糊滤镜下作为远景使用，禁止全亮度直出。
if(!/cg_evidence_desk:\s*['"]\/assets\/cg\/evidence-desk\.png/.test(opening)) failures.push('opening evidence-desk beat must use the real desk art');
if(!/data-cg='cg_evidence_desk'\] img\{[^}]*brightness\(\.5\)[^}]*blur/.test(v09)) failures.push('evidence-desk art must be dimmed and blurred to hide baked labels');
if(!/data-cg=/.test(opening)||!/cg_evidence_desk/.test(v09)) failures.push('v0.9 opening needs a text-free CSS evidence-desk treatment');
if(failures.length){ console.error('v0.9 visual contract FAILED\n- '+failures.join('\n- ')); process.exit(1); }
console.log('v0.9 visual contract OK');
