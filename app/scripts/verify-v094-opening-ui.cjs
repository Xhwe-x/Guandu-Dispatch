const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const opening = fs.readFileSync(path.join(root, 'src/features/scenes/OpeningFlowScene.tsx'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/features/scenes/v09.css'), 'utf8');
assert(opening.includes('onBack: () => void;'), 'OpeningFlowScene must accept an onBack callback.');
assert(opening.includes('← 返回标题'), 'OpeningFlowScene should expose a back button label.');
assert(opening.includes('<kbd>Enter</kbd>') && opening.includes('<kbd>Space</kbd>'), 'Opening key hint should split Enter and Space into separate pills.');
// 人物出场与对白节拍一律用无脸军帐背景，避免与左侧立绘形成“两个赵简”。
assert(opening.includes("'bg-leak': 'cg_intro_aftermath'") && opening.includes("'zhao-reveal': 'cg_intro_aftermath'") && opening.includes("'zhao-first-line': 'cg_intro_aftermath'"), 'Character beats must use the face-free tent backdrop, not the Zhao close-up.');
assert(css.includes('.v093-opening-nav') && css.includes('.v09-opening__visual--swap img'), 'Opening CSS should include the nav bar and backdrop swap animation.');
console.log('verify-v094-opening-ui: ok');
